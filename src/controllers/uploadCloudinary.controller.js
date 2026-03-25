// src/controllers/uploadCloudinary.controller.js
const cloudinary = require("../config/cloudinary");
const asyncHandler = require("../utils/asyncHandler");
const { httpError } = require("../utils/httpError");

const uploadToCloudinary = asyncHandler(async (req, res) => {
  const base64 = req.body?.base64 || req.body?.image;
  if (!base64) throw httpError(400, "base64 is required");

  const result = await cloudinary.uploader.upload(base64, {
    folder: "creativity-restaurant",
  });

  res.json({
    ok: true,
    url: result.secure_url,
    public_id: result.public_id,
  });
});

module.exports = { uploadToCloudinary };
