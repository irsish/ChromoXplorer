// users.js (route definitions)
// Maps incoming HTTP requests to the appropriate controller function.
// All logic lives in controllers/usersController.js — keep this file thin.

const express = require('express')
const usersController = require('../controllers/usersController')
const { requireAuth } = require('../middleware/requireAuth')
const { requireAdmin } = require('../middleware/requireAdmin')

const router = express.Router()

router.get('/', requireAdmin, usersController.getAllUsers)
router.post('/', requireAuth, usersController.createUser)
router.get('/:sub', requireAuth, usersController.getUserBySub)
router.patch('/:sub', requireAuth, usersController.updateUserProfile)

module.exports = router