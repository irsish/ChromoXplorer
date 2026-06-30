// usersController.js
// Handles all business logic for user-related API routes.
// Users are stored in MongoDB and identified by their Auth0 "sub" claim (e.g. "auth0|abc123").

const User = require("../models/user")

// GET /users
// Returns all users in the database.
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).lean()
    return res.json({ count: users.length, users })
  } catch (err) {
    console.error('GET /users error:', err)
    return res.status(500).json({ error: 'Failed to fetch users' })
  }
}

// GET /users/:sub
// Returns a single user by their Cognito sub.
exports.getUserBySub = async (req, res) => {
  if (req.user.sub !== req.params.sub) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  try {
    const user = await User.findOne({ sub: req.params.sub }).lean()
    if (!user) return res.status(404).json({ error: 'User not found' })
    return res.json(user)
  } catch (err) {
    console.error('GET /users/:sub error:', err)
    return res.status(500).json({ error: 'Failed to fetch user' })
  }
}

// PATCH /users/:sub
// Updates profile fields and marks profileCompleted: true.
// Used by the profile completion wizard (both submit and skip paths).
exports.updateUserProfile = async (req, res) => {
  if (req.user.sub !== req.params.sub) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  try {
    const { city, region, country, reason, optOut } = req.body

    const update = {
      profileCompleted: true,
      optionalDataOptOut: !!optOut,
    }

    // Keep optional profile fields in sync with the user's latest preference.
    update['location.city'] = optOut ? null : (city || null)
    update['location.region'] = optOut ? null : (region || null)
    update['location.country'] = optOut ? null : (country || null)
    update.useCaseReason = optOut ? null : (reason || null)

    const user = await User.findOneAndUpdate(
      { sub: req.params.sub },
      { $set: update },
      { new: true, lean: true }
    )

    if (!user) return res.status(404).json({ error: 'User not found' })
    return res.json(user)
  } catch (err) {
    console.error('PATCH /users/:sub error:', err)
    return res.status(500).json({ error: 'Failed to update profile' })
  }
}

// POST /users
// Creates a new user. Expects a JSON body containing at minimum a "sub" field (Auth0 user ID).
// Returns 409 if a user with that sub already exists to prevent duplicates.
exports.createUser = async (req, res) => {
  try {
    const sub = req.user.sub
    const existing = await User.findOne({ sub })
    if (existing) return res.status(409).json({ error: 'User already exists', user: existing })

    const user = await User.create({ ...req.body, sub })
    return res.status(201).json({ id: user._id, user })
  } catch (err) {
    console.error('POST /users error:', err)
    return res.status(500).json({ error: 'Failed to create user' })
  }
}
