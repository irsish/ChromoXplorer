// Admin-only API routes (Cognito Bearer token + admin group/role).

const express = require("express")
const multer = require("multer")
const { requireAdmin } = require("../middleware/requireAdmin")
const adminController = require("../controllers/adminController")

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: adminController.adminUploadLimits.MAX_ZIP_BYTES },
  fileFilter: (req, file, cb) => {
    const name = String(file.originalname || "").toLowerCase()
    const mime = String(file.mimetype || "").toLowerCase()
    const ok =
      name.endsWith(".zip") ||
      mime === "application/zip" ||
      mime === "application/x-zip-compressed"
    if (!ok) {
      return cb(new Error("Only .zip archives are allowed."))
    }
    cb(null, true)
  },
})

// POST multipart: cellName, optional description, file (.zip)
router.post("/cells/upload", requireAdmin, (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: "File too large",
            message: `Zip must be at most ${adminController.adminUploadLimits.MAX_ZIP_BYTES} bytes.`,
          })
        }
      }
      return res.status(400).json({
        error: "Upload rejected",
        message: err.message || "Invalid file upload.",
      })
    }
    return adminController.uploadCellZip(req, res)
  })
})

// DELETE + JSON body: { "key": "..." } OR { "prefix": "..." } — S3 delete + prune Cell metadata
router.delete(
  "/cells/:cellName/objects",
  requireAdmin,
  adminController.deleteCellObjects
)

// DELETE entire cell: all S3 objects under cells/{cellName}/ + Cell document
router.delete("/cells/:cellName", requireAdmin, adminController.deleteCellFromS3)

module.exports = router
