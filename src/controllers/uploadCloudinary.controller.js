// src/controllers/uploadCloudinary.controller.js
const cloudinary = require("../config/cloudinary");

async function uploadToCloudinary(req, res) {
  try {
    // expecting: { base64 } or { image } as base64 data URL
    const base64 = req.body?.base64 || req.body?.image;
    if (!base64) return res.status(400).json({ error: "base64 is required" });

    const result = await cloudinary.uploader.upload(base64, {
      upload_preset: "creativity-products",
      folder: "creativity-restaurant",
    });

    return res.json({
      ok: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

module.exports = { uploadToCloudinary };
