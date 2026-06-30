const express    = require('express')
const controller = require('../controllers/genomicFeaturesController')

const router = express.Router()

router.get('/', controller.getFeatures)

module.exports = router
