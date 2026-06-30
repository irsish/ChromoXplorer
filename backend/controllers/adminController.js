// adminController.js
// Admin-only endpoints for managing cell data: zip upload to S3, selective
// object deletes, and full cell removal.
// All routes using these handlers are protected by the requireAdmin middleware.

const unzipper = require("unzipper")
const {
  BUCKET,
  S3_CELLS_PREFIX,
  s3ObjectUrl,
  putS3Object,
  listAllObjectKeysUnderPrefix,
  deleteS3Keys,
} = require("../utils/s3Utils")
const {
  buildChromosomesFromKeys,
  pickAbCompartmentsKey,
  buildAnnotationTracksFromKeys,
} = require("../utils/chromosomeUtils")
const Cell = require("../models/cell")

const MAX_ZIP_BYTES = Number(process.env.ADMIN_MAX_ZIP_BYTES) || 500 * 1024 * 1024
const MAX_ENTRIES   = Number(process.env.ADMIN_MAX_ZIP_ENTRIES) || 2000

exports.adminUploadLimits = { MAX_ZIP_BYTES, MAX_ENTRIES }

// Validates a cell folder name: 1–128 chars, alphanumeric/underscore/hyphen,
// must start with a letter or number. Returns null if invalid.
function safeCellFolderName(name) {
  const t = String(name || "").trim()
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/.test(t)) return null
  return t
}

// Escapes special regex characters so a string can be safely used in a RegExp.
function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Strips backslashes, leading slashes, and trailing slashes from a zip entry path.
function normalizeZipPath(p) {
  return String(p).replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "")
}

function pickBestCommonRoot(paths) {
  const normalized = paths.map(normalizeZipPath).filter(Boolean)
  if (!normalized.length) return null

  const firstSegments = normalized[0].split("/")
  const candidates = []

  for (let i = 1; i <= firstSegments.length - 1; i += 1) {
    const prefix = firstSegments.slice(0, i).join("/")
    if (normalized.every((p) => p === prefix || p.startsWith(prefix + "/"))) {
      candidates.push(prefix)
    }
  }

  return (
    candidates.find((prefix) => {
      const relPaths = normalized
        .map((p) => (p === prefix ? "" : p.slice(prefix.length + 1)))
        .filter(Boolean)
      const hasRootBed = relPaths.some((p) => p.toLowerCase().endsWith(".bed") && !p.includes("/"))
      const has1mb = relPaths.some((p) => /^1mb\/.+\.pdb$/i.test(p))
      const has5kb = relPaths.some((p) => /^5kb\/.+\.pdb$/i.test(p))
      return hasRootBed && has1mb && has5kb
    }) ?? candidates[0] ?? null
  )
}

// Returns an appropriate Content-Type for PDB, BED, and Markdown files.
// Falls back to application/octet-stream for anything unrecognised.
function contentTypeForFilename(filename) {
  const lower = filename.toLowerCase()
  if (lower.endsWith(".pdb")) return "chemical/x-pdb"
  if (lower.endsWith(".bed")) return "text/plain"
  if (lower.endsWith(".md"))  return "text/markdown"
  return "application/octet-stream"
}

// Resolves user-supplied input to a full S3 key or prefix under cells/{cellName}/.
// isPrefix=true is used for folder-level deletes and allows a trailing slash.
// Returns null if the path is invalid or would escape the cell's folder.
function resolveCellStoragePath(cellName, input, { isPrefix = false } = {}) {
  const raw = String(input || "").trim().replace(/\\/g, "/")
  if (!raw || raw.includes("..")) return null
  const noLead = raw.replace(/^\/+/, "")
  if (noLead.split("/").some((s) => s === "..")) return null

  const fullPath = noLead.toLowerCase().startsWith(`${S3_CELLS_PREFIX.toLowerCase()}/`)
    ? noLead
    : `${S3_CELLS_PREFIX}/${cellName}/${noLead}`

  const root = `${S3_CELLS_PREFIX}/${cellName}/`
  if (!fullPath.toLowerCase().startsWith(root.toLowerCase())) return null
  if (isPrefix) {
    // Disallow targeting the cell root itself — that would delete the entire cell.
    if (fullPath.replace(/\/+$/, "") === `${S3_CELLS_PREFIX}/${cellName}`) return null
  } else {
    if (fullPath.length <= root.length) return null
  }
  return fullPath
}

// Returns true if a stored AB compartments URL references the given S3 key.
// Handles both full URL and path-only forms.
function abFileReferencesKey(url, key) {
  if (!url || !key) return false
  if (url === s3ObjectUrl(key)) return true
  try {
    const path = decodeURIComponent(new URL(url).pathname.replace(/^\//, ""))
    return path === key
  } catch {
    return url.endsWith(key)
  }
}

function trackReferencesKey(track, key) {
  if (!track || !key) return false
  if (track.s3Key && track.s3Key === key) return true
  return abFileReferencesKey(track.s3Url, key)
}

// Removes references to deleted S3 keys from a Cell document's chromosomes,
// AB-compartment file, and optional annotation track metadata.
async function pruneCellMetadata(cellName, deletedKeys) {
  const set  = new Set(deletedKeys)
  const cell = await Cell.findOne({
    cellName: new RegExp(`^${escapeRegex(cellName)}$`, "i"),
  })
  if (!cell) return { cellFound: false, modified: false }

  let modified = false
  for (const chr of cell.chromosomes || []) {
    const before = chr.files.length
    chr.files = chr.files.filter((f) => f.s3Key && !set.has(f.s3Key))
    if (chr.files.length !== before) modified = true
  }
  cell.chromosomes = cell.chromosomes.filter((c) => c.files.length > 0)

  if (cell.abCompartmentsFile) {
    for (const k of deletedKeys) {
      if (abFileReferencesKey(cell.abCompartmentsFile, k)) {
        cell.abCompartmentsFile = null
        modified = true
        break
      }
    }
  }

  const beforeTracks = (cell.annotationTracks ?? []).length
  cell.annotationTracks = (cell.annotationTracks ?? []).filter(
    (track) => !deletedKeys.some((k) => trackReferencesKey(track, k))
  )
  if (cell.annotationTracks.length !== beforeTracks) modified = true

  if (modified) await cell.save()
  return { cellFound: true, modified }
}

// POST multipart: cellName, optional description, file (.zip)
// Extracts the zip and uploads each entry to s3://{bucket}/cells/{cellName}/...
// Registers the new cell in MongoDB after a successful upload.
// Rolls back uploaded S3 objects if the database insert fails.
exports.uploadCellZip = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({
        error: "Missing zip file",
        message: 'Send multipart/form-data with field "file" (application/zip).',
      })
    }

    const buf = req.file.buffer
    if (buf.length < 4 || buf[0] !== 0x50 || buf[1] !== 0x4b) {
      return res.status(400).json({
        error: "Invalid zip file",
        message: "File does not look like a ZIP archive (missing PK header).",
      })
    }

    const cellName = safeCellFolderName(req.body.cellName)
    if (!cellName) {
      return res.status(400).json({
        error: "Invalid cellName",
        message:
          "cellName must be 1–128 characters: letters, numbers, underscore, hyphen; must start with a letter or number.",
      })
    }

    const existingCell = await Cell.findOne({
      cellName: new RegExp(`^${escapeRegex(cellName)}$`, "i"),
    }).lean()
    if (existingCell) {
      return res.status(409).json({
        error: "Cell already exists",
        message: `A cell named "${existingCell.cellName}" is already registered.`,
        cell: { cellName: existingCell.cellName, _id: existingCell._id },
      })
    }

    const directory    = await unzipper.Open.buffer(req.file.buffer)
    const uploadedKeys = []
    let fileCount      = 0

    // Detect a common wrapper folder so uploads with redundant nesting like
    // "H1-hESC/H1-hESC/1mb/..." still land directly under cells/{cellName}/...
    const fileEntries  = directory.files.filter((e) => e.type !== "Directory")
    const commonRoot   = pickBestCommonRoot(fileEntries.map((e) => e.path))

    for (const entry of directory.files) {
      if (entry.type === "Directory") continue

      if (++fileCount > MAX_ENTRIES) {
        return res.status(400).json({
          error: "Zip too large",
          message: `More than ${MAX_ENTRIES} file entries are not allowed.`,
        })
      }

      const rel = normalizeZipPath(entry.path)
      if (!rel) continue
      const segments = rel.split("/").filter(Boolean)
      if (segments.some((s) => s === "..")) {
        return res.status(400).json({
          error: "Unsafe zip path",
          message: `Entry paths must not contain "..": ${entry.path}`,
        })
      }

      // Strip any leading cells/ prefix, then strip the common root folder
      // (whatever it is named — handles template zips where the root folder
      // is a placeholder like "cellName" rather than the actual cell name).
      let inner = segments
      while (inner.length && inner[0].toLowerCase() === S3_CELLS_PREFIX.toLowerCase()) {
        inner = inner.slice(1)
      }
      if (commonRoot) {
        const rootSegments = commonRoot.split("/").filter(Boolean)
        if (
          inner.length >= rootSegments.length &&
          rootSegments.every((seg, idx) => inner[idx].toLowerCase() === seg.toLowerCase())
        ) {
          inner = inner.slice(rootSegments.length)
        }
      }
      if (inner.length === 0) continue

      const key = `${S3_CELLS_PREFIX}/${cellName}/${inner.join("/")}`
      if (!key.startsWith(`${S3_CELLS_PREFIX}/${cellName}/`)) {
        return res.status(400).json({ error: "Invalid upload path" })
      }

      await putS3Object(key, await entry.buffer(), contentTypeForFilename(inner[inner.length - 1]))
      uploadedKeys.push(key)
    }

    if (!uploadedKeys.length) {
      return res.status(400).json({
        error: "Empty zip",
        message: "The archive contained no uploadable files.",
      })
    }

    const description = String(req.body.description || "").trim() || null
    const chromosomes = buildChromosomesFromKeys(uploadedKeys, cellName)
    const abKey       = pickAbCompartmentsKey(uploadedKeys, cellName)
    const annotationTracks = buildAnnotationTracksFromKeys(uploadedKeys, cellName)

    try {
      const cell = await Cell.create({
        cellName,
        displayName: cellName,
        description,
        abCompartmentsFile: abKey ? s3ObjectUrl(abKey) : null,
        annotationTracks,
        chromosomes,
      })
      return res.status(201).json({
        id: cell._id,
        cell,
        cellName,
        bucket: BUCKET,
        s3Prefix: `${S3_CELLS_PREFIX}/${cellName}/`,
        uploaded: uploadedKeys.length,
        keys: uploadedKeys,
      })
    } catch (err) {
      console.error("Cell.create after S3 upload:", err)
      // Best-effort rollback — remove files already uploaded to S3.
      try { await deleteS3Keys(uploadedKeys) } catch (e) { console.error("S3 rollback failed:", e) }
      if (err.code === 11000) {
        return res.status(409).json({
          error: "Cell already exists",
          message: "That cell name is already registered (duplicate key).",
        })
      }
      return res.status(500).json({
        error: "Database insert failed",
        message: err.message || "Cell was removed from S3 after a failed database write.",
      })
    }
  } catch (err) {
    console.error("uploadCellZip error:", err)
    return res.status(500).json({
      error: "Upload failed",
      message: err.message || "Failed to extract or upload to S3.",
    })
  }
}

// DELETE JSON body: exactly one of
//   { "key": "path/to/file" }   — deletes a single S3 object
//   { "prefix": "subfolder/" }  — deletes all S3 objects under that prefix
// Updates the Cell document to remove any references to the deleted keys.
exports.deleteCellObjects = async (req, res) => {
  try {
    const cellName = safeCellFolderName(req.params.cellName)
    if (!cellName) {
      return res.status(400).json({
        error: "Invalid cellName",
        message:
          "cellName must be 1–128 characters: letters, numbers, underscore, hyphen; must start with a letter or number.",
      })
    }

    const { key, prefix } = req.body || {}
    const keyStr    = key    != null ? String(key).trim()    : ""
    const prefixStr = prefix != null ? String(prefix).trim() : ""

    if (!keyStr && !prefixStr) {
      return res.status(400).json({
        error: "Missing target",
        message: 'Send JSON with exactly one of "key" (single file) or "prefix" (folder / prefix).',
      })
    }
    if (keyStr && prefixStr) {
      return res.status(400).json({
        error: "Ambiguous target",
        message: 'Send only one of "key" or "prefix", not both.',
      })
    }

    const cellRoot    = `${S3_CELLS_PREFIX}/${cellName}/`
    let keysToDelete  = []

    if (keyStr) {
      const fullKey = resolveCellStoragePath(cellName, keyStr)
      if (!fullKey) {
        return res.status(400).json({
          error: "Invalid key",
          message: "Key must resolve under the cell folder with no path traversal.",
        })
      }
      keysToDelete = [fullKey]
    } else {
      const fullPrefix = resolveCellStoragePath(cellName, prefixStr, { isPrefix: true })
      if (!fullPrefix) {
        return res.status(400).json({
          error: "Invalid prefix",
          message: "Prefix must resolve under the cell folder with no path traversal.",
        })
      }
      const listed = await listAllObjectKeysUnderPrefix(fullPrefix)
      keysToDelete = listed.filter((k) => k.startsWith(cellRoot) && k.startsWith(fullPrefix))
    }

    if (!keysToDelete.length) {
      const cellExists = await Cell.exists({
        cellName: new RegExp(`^${escapeRegex(cellName)}$`, "i"),
      })
      return res.json({
        cellName,
        bucket: BUCKET,
        deleted: 0,
        keys: [],
        mongo: { cellFound: !!cellExists, modified: false },
      })
    }

    const delResult = await deleteS3Keys(keysToDelete, { checked: true })
    if (!delResult.ok) {
      return res.status(500).json({ error: "S3 delete failed", message: delResult.message })
    }

    const mongo = await pruneCellMetadata(cellName, keysToDelete)
    return res.json({ cellName, bucket: BUCKET, deleted: keysToDelete.length, keys: keysToDelete, mongo })
  } catch (err) {
    console.error("deleteCellObjects error:", err)
    return res.status(500).json({
      error: "Delete failed",
      message: err.message || "Failed to delete objects.",
    })
  }
}

// DELETE /admin/cells/:cellName
// Removes all S3 objects under cells/{cellName}/ and deletes the Cell document from MongoDB.
exports.deleteCellFromS3 = async (req, res) => {
  try {
    const cellName = safeCellFolderName(req.params.cellName)
    if (!cellName) {
      return res.status(400).json({
        error: "Invalid cellName",
        message:
          "cellName must be 1–128 characters: letters, numbers, underscore, hyphen; must start with a letter or number.",
      })
    }

    const prefix = `${S3_CELLS_PREFIX}/${cellName}/`
    const keys   = (await listAllObjectKeysUnderPrefix(prefix)).filter((k) => k.startsWith(prefix))

    if (keys.length) {
      const delResult = await deleteS3Keys(keys, { checked: true })
      if (!delResult.ok) {
        console.error("deleteCellFromS3 partial failure:", delResult.message)
        return res.status(500).json({ error: "S3 delete failed", message: delResult.message })
      }
    }

    const delDoc = await Cell.deleteOne({
      cellName: new RegExp(`^${escapeRegex(cellName)}$`, "i"),
    })

    return res.json({ cellName, bucket: BUCKET, deleted: keys.length, mongoDeleted: delDoc.deletedCount })
  } catch (err) {
    console.error("deleteCellFromS3 error:", err)
    return res.status(500).json({
      error: "Delete failed",
      message: err.message || "Failed to delete cell objects from S3.",
    })
  }
}
