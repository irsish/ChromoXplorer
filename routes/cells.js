// cells.js (route definitions)
// Maps incoming HTTP requests to the appropriate controller function.
// All logic lives in controllers/cellsController.js — keep this file thin.

const express = require("express")
const cellsController = require("../controllers/cellsController")

const router = express.Router()

router.get('/',                                      cellsController.getAllCells)
router.get('/files',                                 cellsController.getCellFiles)
router.get('/:cellName/chromosomes/:chromosome',     cellsController.getCellChromosomeFile) // ?resolution=1mb|5kb (default: 1mb)
router.get('/:cellName/ab-compartments',             cellsController.getCellAbCompartments)
router.get('/:cellName/tracks/:trackType',           cellsController.getCellAnnotationTrack)
router.get('/:cellName',                             cellsController.getCellByName)

module.exports = router
