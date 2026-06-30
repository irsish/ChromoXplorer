const mongoose = require("mongoose")
const { Schema } = mongoose

const ResolutionFileSchema = new Schema(
  {
    resolution: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    s3Key: {
      type: String,
      default: null,
      trim: true
    },
    s3Url: {
      type: String,
      default: null,
      trim: true
    },
    size: {
      type: Number,
      default: null,
      min: 0
    },
    version: {
      type: Number,
      required: true,
      default: 1,
      min: 1
    },
    lastUpdated: {
      type: Date,
      default: null
    }
  },
  { _id: false }
)

const ChromosomeFileSchema = new Schema(
  {
    chromosome: {
      type: String,
      required: true,
      trim: true
    },
    format: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    files: {
      type: [ResolutionFileSchema],
      default: []
    }
  },
  { _id: false }
)

const AnnotationTrackSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    label: {
      type: String,
      default: null,
      trim: true
    },
    format: {
      type: String,
      default: "bed",
      trim: true,
      lowercase: true
    },
    source: {
      type: String,
      default: "upload",
      trim: true,
      lowercase: true
    },
    s3Key: {
      type: String,
      default: null,
      trim: true
    },
    s3Url: {
      type: String,
      default: null,
      trim: true
    },
    lastUpdated: {
      type: Date,
      default: null
    }
  },
  { _id: false }
)

const CellSchema = new Schema(
  {
    cellName: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    displayName: {
      type: String,
      default: null,
      trim: true
    },
    description: {
      type: String,
      default: null,
      trim: true
    },
    abCompartmentsFile: {
      type: String,
      default: null,
      trim: true
    },
    annotationTracks: {
      type: [AnnotationTrackSchema],
      default: []
    },
    chromosomes: {
      type: [ChromosomeFileSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.models.Cell || mongoose.model("Cell", CellSchema)
