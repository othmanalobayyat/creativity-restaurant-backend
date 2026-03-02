// src/routes/upload.routes.js
const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".bin";
    cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.post("/upload", upload.single("file"), (req, res) => {
  return res.json({
    ok: true,
    file: req.file ? req.file.filename : null,
    url: req.file ? `/uploads/${req.file.filename}` : null,
  });
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `MulterError: ${err.message}` });
  }
  return res.status(400).json({ error: err.message || "Upload failed" });
});

module.exports = router;
