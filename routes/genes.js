// genes.js (route definitions)
// Maps incoming HTTP requests to the appropriate controller function.
// All logic lives in controllers/genesController.js — keep this file thin.

const express = require('express')
const genesController = require('../controllers/genesController')

const router = express.Router()

router.get('/search',   genesController.searchGenes)     // ?query=BRCA1
router.get('/:symbol',  genesController.getGeneBySymbol) // exact symbol lookup

module.exports = router
