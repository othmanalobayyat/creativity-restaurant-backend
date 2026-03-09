// src/routes/auth.routes.js
const router = require("express").Router();
const rateLimit = require("express-rate-limit");

const {
  register,
  login,
  changePassword, // ✅ لازم تكون موجودة هون
} = require("../controllers/auth.controller");

const { auth } = require("../middleware/auth");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
});

router.use("/auth", authLimiter);

router.post("/auth/register", register);
router.post("/auth/login", login);
router.put("/auth/change-password", auth, changePassword);

module.exports = router;
