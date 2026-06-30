// user.js (Mongoose model)
// Defines the schema for a user document in MongoDB.
// Users are identified by their Auth0 "sub" claim, which is unique per account.
// The schema also stores optional profile info (email, location) and UI preferences.

const mongoose = require('mongoose')
const { Schema } = mongoose

const UserSchema = new Schema(
  {
    sub: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    email: {
      type: String,
      default: null,
      trim: true,
      lowercase: true
    },
    location: {
      city: {
        type: String,
        default: null,
        trim: true
      },
      region: {
        type: String,
        default: null,
        trim: true
      },
      country: {
        type: String,
        default: null,
        trim: true
      }
    },
    useCaseReason: {
      type: String,
      default: null,
      trim: true
    },
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system'
      },
      starfieldEnabled: {
        type: Boolean,
        default: true
      }
    },
    optionalDataOptOut: {
      type: Boolean,
      default: false
    },
    profileCompleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.models.User || mongoose.model('User', UserSchema)