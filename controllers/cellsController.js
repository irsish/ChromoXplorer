// cellsController.js
// Handles all business logic for cell-related API routes.
// Data is sourced from two places:
//   - MongoDB (via the Cell model) for cell metadata and s3Keys
//   - AWS S3 (chromoxplorer bucket) for directory listings and file content

const { ListObjectsV2Command, GetObjectCommand } = require("@aws-sdk/client-s3")
const { s3 } = require("../config/s3")
const { BUCKET } = require("../utils/s3Utils")
const Cell = require("../models/cell")

// Case-insensitive cell lookup — handles data inserted outside of Mongoose
// where the lowercase:true schema option may not have been applied.
function findCell(cellName) {
  return Cell.findOne({ cellName: new RegExp(`^${cellName}$`, 'i') }).lean()
}

function urlToS3Key(url) {
  if (!url) return null
  try {
    return decodeURIComponent(new URL(url).pathname.slice(1))
  } catch {
    return null
  }
}

// GET /cells
// Returns a list of all cell names stored in MongoDB.
exports.getAllCells = async (req, res) => {
  try {
    const cells = await Cell.find({}, 'cellName displayName').lean()
    return res.json({ count: cells.length, cells })
  } catch (err) {
    console.error('GET /cells error:', err)
    return res.status(500).json({ error: 'Failed to fetch cells' })
  }
}

// GET /cells/files
// Lists all top-level cell folders in the S3 bucket under the "cells/" prefix.
exports.getCellFiles = async (req, res) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: "cells/",
      Delimiter: "/"
    })
    const response = await s3.send(command)
    const folders = response.CommonPrefixes.map(
      folder => folder.Prefix.replace("cells/", "").replace("/", "")
    )
    res.json(folders)
  } catch (err) {
    console.error('GET /cells/files error:', err)
    res.status(500).json({ error: "Failed to fetch files" })
  }
}

// GET /cells/:cellName
// Returns chromosome metadata for a specific cell from MongoDB.
// URLs returned are backend proxy paths — the frontend never fetches S3 directly.
//
// Response shape:
// {
//   cellName: string,
//   displayName: string,
//   chromosomes: [{ chromosome, format, resolutions: string[], url: string }],
//   abCompartmentsUrl: string | null,
//   annotationTracks: { [type: string]: { label, format, source, url } }
// }
exports.getCellByName = async (req, res) => {
  try {
    const { cellName } = req.params

    const cell = await findCell(cellName)
    if (!cell) {
      return res.status(404).json({ error: `Cell "${cellName}" not found` })
    }

    const chromosomes = (cell.chromosomes ?? []).map((chr) => ({
      chromosome:  chr.chromosome,
      format:      chr.format,
      // List available resolutions so the frontend knows what to request.
      resolutions: (chr.files ?? []).map(f => f.resolution),
      // Resolution is passed as a query param: ?resolution=1mb
      url:         `/cells/${cell.cellName}/chromosomes/${chr.chromosome}`,
    }))

    const abCompartmentsUrl = cell.abCompartmentsFile
      ? `/cells/${cell.cellName}/ab-compartments`
      : null

    const annotationTracks = Object.fromEntries(
      (cell.annotationTracks ?? [])
        .filter((track) => track?.type && (track.s3Key || track.s3Url))
        .map((track) => [
          track.type,
          {
            label:  track.label ?? track.type,
            format: track.format ?? "bed",
            source: track.source ?? "upload",
            url:    `/cells/${cell.cellName}/tracks/${track.type}`,
          },
        ])
    )

    return res.json({
      cellName:         cell.cellName,
      displayName:      cell.displayName,
      chromosomes,
      abCompartmentsUrl,
      annotationTracks,
    })
  } catch (err) {
    console.error(`GET /cells/${req.params.cellName} error:`, err)
    return res.status(500).json({ error: "Failed to fetch cell data" })
  }
}

// GET /cells/:cellName/chromosomes/:chromosome?resolution=1mb
// Proxies the chromosome PDB file from S3 to the client.
// The ?resolution query param selects which file to serve (e.g. "1mb", "5kb").
// Defaults to "1mb" if not provided.
exports.getCellChromosomeFile = async (req, res) => {
  try {
    const { cellName, chromosome } = req.params
    const resolution = (req.query.resolution || '1mb').toLowerCase()

    const cell = await findCell(cellName)
    if (!cell) return res.status(404).json({ error: `Cell "${cellName}" not found` })

    const chr = (cell.chromosomes ?? []).find(
      c => c.chromosome.toLowerCase() === chromosome.toLowerCase()
    )
    if (!chr) {
      return res.status(404).json({ error: `Chromosome "${chromosome}" not found` })
    }

    const file = (chr.files ?? []).find(f => f.resolution.toLowerCase() === resolution)
    if (!file?.s3Key) {
      return res.status(404).json({
        error: `Resolution "${resolution}" not available for chromosome "${chromosome}"`,
        available: (chr.files ?? []).map(f => f.resolution),
      })
    }

    const command = new GetObjectCommand({ Bucket: BUCKET, Key: file.s3Key })
    const s3Response = await s3.send(command)

    res.setHeader('Content-Type', 'text/plain')
    s3Response.Body.pipe(res)
  } catch (err) {
    console.error(`GET /cells/${req.params.cellName}/chromosomes/${req.params.chromosome} error:`, err)
    res.status(500).json({ error: "Failed to fetch chromosome file" })
  }
}

// GET /cells/:cellName/ab-compartments
// Proxies the AB compartments .bed file from S3 to the client.
exports.getCellAbCompartments = async (req, res) => {
  try {
    const { cellName } = req.params

    const cell = await findCell(cellName)
    if (!cell) return res.status(404).json({ error: `Cell "${cellName}" not found` })
    if (!cell.abCompartmentsFile) {
      return res.status(404).json({ error: 'No AB compartments file for this cell' })
    }

    const s3Key = urlToS3Key(cell.abCompartmentsFile)
    if (!s3Key) {
      return res.status(500).json({ error: "Stored AB compartments file URL is invalid" })
    }

    const command = new GetObjectCommand({ Bucket: BUCKET, Key: s3Key })
    const s3Response = await s3.send(command)

    res.setHeader('Content-Type', 'text/plain')
    s3Response.Body.pipe(res)
  } catch (err) {
    console.error(`GET /cells/${req.params.cellName}/ab-compartments error:`, err)
    res.status(500).json({ error: "Failed to fetch AB compartments file" })
  }
}

// GET /cells/:cellName/tracks/:trackType
// Proxies an uploaded annotation track (e.g. TADs, regulatory BED) from S3.
exports.getCellAnnotationTrack = async (req, res) => {
  try {
    const { cellName, trackType } = req.params

    const cell = await findCell(cellName)
    if (!cell) return res.status(404).json({ error: `Cell "${cellName}" not found` })

    const track = (cell.annotationTracks ?? []).find(
      (t) => t.type?.toLowerCase() === String(trackType || "").toLowerCase()
    )
    if (!track) {
      return res.status(404).json({ error: `No "${trackType}" track for this cell` })
    }

    const s3Key = track.s3Key || urlToS3Key(track.s3Url)
    if (!s3Key) {
      return res.status(500).json({ error: `Stored "${trackType}" track URL is invalid` })
    }

    const command = new GetObjectCommand({ Bucket: BUCKET, Key: s3Key })
    const s3Response = await s3.send(command)

    res.setHeader('Content-Type', 'text/plain')
    s3Response.Body.pipe(res)
  } catch (err) {
    console.error(`GET /cells/${req.params.cellName}/tracks/${req.params.trackType} error:`, err)
    res.status(500).json({ error: "Failed to fetch annotation track" })
  }
}
