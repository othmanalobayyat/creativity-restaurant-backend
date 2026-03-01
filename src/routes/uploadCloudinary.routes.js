// src/routes/uploadCloudinary.routes.js
const router = require("express").Router();
const { auth } = require("../middleware/auth");
const { adminOnly } = require("../middleware/adminOnly");
const {
  uploadToCloudinary,
} = require("../controllers/uploadCloudinary.controller");

router.post("/admin/upload", auth, adminOnly, uploadToCloudinary);

module.exports = router;
