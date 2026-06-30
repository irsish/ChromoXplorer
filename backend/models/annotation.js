// annotation.js — Mongoose model
// Stores a user's note on a specific gene viewed within a cell.
// Scoped to admin users only — regular users store annotations in session state.

const mongoose = require('mongoose')
const { Schema } = mongoose

const AnnotationSchema = new Schema(
  {
    userSub: {
      type:     String,
      required: true,
      index:    true,
    },
    cellName: {
      type:     String,
      required: true,
    },
    chromosome: {
      type:     String,
      required: true,
    },
    geneSymbol: {
      type:     String,
      required: true,
    },
    geneStart: {
      type:     Number,
      required: true,
    },
    geneEnd: {
      type:     Number,
      required: true,
    },
    note: {
      type:    String,
      default: "",
      trim:    true,
    },
  },
  {
    timestamps: true,
  }
)

// One annotation per admin per gene per cell — enforced via upsert in the controller.
AnnotationSchema.index({ userSub: 1, cellName: 1, chromosome: 1, geneSymbol: 1 }, { unique: true })

module.exports = mongoose.models.Annotation || mongoose.model('Annotation', AnnotationSchema)
