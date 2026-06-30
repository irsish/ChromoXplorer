const express               = require('express')
const annotationsController = require('../controllers/annotationsController')
const { requireAdmin }      = require('../middleware/requireAdmin')

const router = express.Router()

// Only admins persist annotations to the database.
// Regular users store annotations in session state on the frontend only.
router.get('/',       requireAdmin, annotationsController.getAnnotations)
router.post('/',      requireAdmin, annotationsController.createAnnotation)
router.delete('/:id', requireAdmin, annotationsController.deleteAnnotation)

module.exports = router
