// src/routes/auth.routes.js
const router = require("express").Router();

const {
  register,
  login,
  changePassword, // ✅ لازم تكون موجودة هون
} = require("../controllers/auth.controller");

const { auth } = require("../middleware/auth");

router.post("/auth/register", register);
router.post("/auth/login", login);
router.put("/auth/change-password", auth, changePassword);

module.exports = router;
