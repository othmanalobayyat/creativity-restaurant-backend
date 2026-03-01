// src/routes/upload.routes.js
const router = require("express").Router();
const multer = require("multer");
const { upload } = require("../middleware/upload"); // إذا عامل middleware
// أو لو عامل upload هون مباشرة

router.post("/upload", upload.single("file"), (req, res) => {
  // إذا وصل هون يعني الملف وصل تمام
  return res.json({
    ok: true,
    file: req.file ? req.file.filename : null,
  });
});

// ✅ لازم error handler بعد الراوت مباشرة
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `MulterError: ${err.message}` });
  }
  return res.status(400).json({ error: err.message || "Upload failed" });
});

module.exports = router;
