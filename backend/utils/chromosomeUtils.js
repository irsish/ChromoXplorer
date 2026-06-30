// chromosomeUtils.js
// Parses uploaded S3 keys to build chromosome metadata for a Cell document.
// Supports multiple folder layout conventions inside the zip:
//   cells/{cell}/chr1/1mb.pdb       — chromosome folder, resolution as filename
//   cells/{cell}/1mb/chr1.pdb       — resolution folder, chromosome as filename
//   cells/{cell}/chr1_1mb.pdb       — chromosome + resolution joined by underscore/hyphen
//   cells/{cell}/chr1.pdb           — chromosome only, defaults to 1mb resolution

const { S3_CELLS_PREFIX, s3ObjectUrl } = require("./s3Utils")

const TRACK_DEFS = [
  {
    type: "tads",
    label: "TADs",
    score(key) {
      let score = 0
      if (/[/\\]tracks[/\\]/i.test(key)) score += 2
      if (/(^|[^a-z])(tad|tads|domain|domains)([^a-z]|$)/i.test(key)) score += 6
      return score
    },
  },
  {
    type: "regulatory",
    label: "Regulatory Elements",
    score(key) {
      let score = 0
      if (/[/\\]tracks[/\\]/i.test(key)) score += 2
      if (/(regulatory|enhancer|enhancers|silencer|silencers|ccre|cres)/i.test(key)) score += 6
      return score
    },
  },
]

// Returns true if the segment looks like a chromosome name (e.g. chr1, chrX, chr23x).
function isChrSegment(name) {
  return /^chr(\d+|x|23x)$/i.test(String(name))
}

// Normalises chromosome names to a consistent lowercase form.
// chrX and chr23x both map to "chr23x"; numeric chromosomes stay as chr{n}.
function normalizeChromosomeName(name) {
  const n = String(name).toLowerCase()
  if (n === "chrx" || n === "chr23x") return "chr23x"
  const m = n.match(/^chr(\d+)$/)
  if (m) return `chr${m[1]}`
  return n
}

// Returns a numeric sort key for a chromosome name so they render in order.
// chr23x sorts as 23; unrecognised names sort last at 999.
function chrSortKey(c) {
  const x = String(c).toLowerCase()
  if (x === "chr23x") return 23
  const m = x.match(/^chr(\d+)$/)
  return m ? parseInt(m[1], 10) : 999
}

// Infers Mongo `chromosomes` entries from a list of uploaded S3 keys.
// Groups files by chromosome and resolution, then sorts chromosomes in order.
function buildChromosomesFromKeys(uploadedKeys, cellName) {
  const prefix = `${S3_CELLS_PREFIX}/${cellName}/`
  const rows = []

  for (const key of uploadedKeys) {
    if (!key.toLowerCase().endsWith(".pdb")) continue
    if (!key.toLowerCase().startsWith(prefix.toLowerCase())) continue

    const rest     = key.slice(prefix.length)
    const segments = rest.split("/").filter(Boolean)
    if (!segments.length) continue

    const filename = segments[segments.length - 1]
    if (!filename.toLowerCase().endsWith(".pdb")) continue
    const base = filename.slice(0, -4)

    let chromosome = null
    let resolution = null

    // Two-segment paths: one segment is the chromosome name, the other the resolution.
    if (segments.length >= 2) {
      const parent = segments[segments.length - 2]
      if (isChrSegment(parent)) {
        chromosome = normalizeChromosomeName(parent)
        resolution = (base || "1mb").toLowerCase()
      } else if (isChrSegment(base)) {
        chromosome = normalizeChromosomeName(base)
        resolution = (parent || "1mb").toLowerCase()
      }
    }

    // Single-segment path: chromosome and resolution joined by underscore or hyphen.
    if (!chromosome) {
      const m = base.match(/^(chr(?:\d+|x|23x))[_-](.+)$/i)
      if (m) {
        chromosome = normalizeChromosomeName(m[1])
        resolution = String(m[2]).toLowerCase()
      }
    }

    // Single-segment path with only a chromosome name — default resolution to 1mb.
    if (!chromosome && isChrSegment(base)) {
      chromosome = normalizeChromosomeName(base)
      resolution = "1mb"
    }

    if (!chromosome || !resolution) continue
    rows.push({ chromosome, resolution, s3Key: key })
  }

  // Group files by chromosome, then by resolution within each chromosome.
  const byChr = new Map()
  for (const row of rows) {
    if (!byChr.has(row.chromosome)) byChr.set(row.chromosome, new Map())
    byChr.get(row.chromosome).set(row.resolution, row.s3Key)
  }

  const chromosomes = []
  for (const [chromosome, resMap] of byChr) {
    const files = []
    for (const [resolution, s3Key] of resMap) {
      files.push({
        resolution,
        s3Key,
        s3Url: s3ObjectUrl(s3Key),
        size: null,
        version: 1,
        lastUpdated: new Date(),
      })
    }
    chromosomes.push({ chromosome, format: "pdb", files })
  }

  chromosomes.sort((a, b) => chrSortKey(a.chromosome) - chrSortKey(b.chromosome))
  return chromosomes
}

// Picks the most likely AB compartments .bed file from a list of uploaded S3 keys.
// Prefers keys whose names contain "ab" or "compartment" to handle multiple .bed files.
function pickAbCompartmentsKey(uploadedKeys, cellName) {
  const prefix = `${S3_CELLS_PREFIX}/${cellName}/`.toLowerCase()
  const beds = uploadedKeys.filter(
    (k) => k.toLowerCase().endsWith(".bed") && k.toLowerCase().startsWith(prefix)
  )
  if (!beds.length) return null
  const ranked = [...beds].sort((a, b) => {
    const score = (k) =>
      (/ab|compartment/i.test(k) ? 2 : 0) + (/human|compart/i.test(k) ? 1 : 0)
    return score(b) - score(a)
  })
  return ranked[0]
}

function buildAnnotationTracksFromKeys(uploadedKeys, cellName) {
  const prefix = `${S3_CELLS_PREFIX}/${cellName}/`.toLowerCase()
  const beds = uploadedKeys.filter(
    (k) => k.toLowerCase().endsWith(".bed") && k.toLowerCase().startsWith(prefix)
  )

  return TRACK_DEFS.map((def) => {
    const ranked = beds
      .map((key) => ({ key, score: def.score(key) }))
      .filter(({ key, score }) => score > 0 && !/ab|compartment/i.test(key))
      .sort((a, b) => b.score - a.score)

    if (!ranked.length) return null

    const s3Key = ranked[0].key
    return {
      type: def.type,
      label: def.label,
      format: "bed",
      source: "upload",
      s3Key,
      s3Url: s3ObjectUrl(s3Key),
      lastUpdated: new Date(),
    }
  }).filter(Boolean)
}

module.exports = { buildChromosomesFromKeys, pickAbCompartmentsKey, buildAnnotationTracksFromKeys }
