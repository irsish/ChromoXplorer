// annotationsController.js
// Handles CRUD for admin annotations on specific genes.
// All routes are protected by requireAdmin — req.admin.sub is the caller's Cognito sub.

const Annotation = require('../models/annotation')

// GET /annotations?cellName=X&chromosome=Y
// Returns all annotations for the authenticated admin scoped to a cell + chromosome.
async function getAnnotations(req, res) {
  const { cellName, chromosome } = req.query

  if (!cellName || !chromosome) {
    return res.status(400).json({ error: 'cellName and chromosome query params are required' })
  }

  try {
    const annotations = await Annotation.find({
      userSub: req.admin.sub,
      cellName,
      chromosome,
    }).sort({ geneSymbol: 1 })

    return res.json({ annotations })
  } catch (err) {
    console.error('getAnnotations error:', err)
    return res.status(500).json({ error: 'Failed to fetch annotations' })
  }
}

// POST /annotations
// Body: { cellName, chromosome, geneSymbol, geneStart, geneEnd, note }
// One annotation per admin per gene per cell — upserts so re-saving updates the note.
async function createAnnotation(req, res) {
  const { cellName, chromosome, geneSymbol, geneStart, geneEnd, note } = req.body

  if (!cellName || !chromosome || !geneSymbol || geneStart == null || geneEnd == null) {
    return res.status(400).json({ error: 'cellName, chromosome, geneSymbol, geneStart, geneEnd are required' })
  }

  try {
    const annotation = await Annotation.findOneAndUpdate(
      { userSub: req.admin.sub, cellName, chromosome, geneSymbol },
      { userSub: req.admin.sub, cellName, chromosome, geneSymbol, geneStart, geneEnd, note: note ?? '' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    return res.status(201).json({ annotation })
  } catch (err) {
    console.error('createAnnotation error:', err)
    return res.status(500).json({ error: 'Failed to save annotation' })
  }
}

// DELETE /annotations/:id
// Only the owner can delete their own annotation.
async function deleteAnnotation(req, res) {
  try {
    const result = await Annotation.findOneAndDelete({
      _id:     req.params.id,
      userSub: req.admin.sub,
    })

    if (!result) {
      return res.status(404).json({ error: 'Annotation not found or not yours' })
    }

    return res.json({ deleted: true })
  } catch (err) {
    console.error('deleteAnnotation error:', err)
    return res.status(500).json({ error: 'Failed to delete annotation' })
  }
}

module.exports = { getAnnotations, createAnnotation, deleteAnnotation }
