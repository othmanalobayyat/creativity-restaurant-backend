// src/routes/auth.routes.js
const router = require("express").Router();
const rateLimit = require("express-rate-limit");

const {
  register,
  login,
  changePassword,
  setupAdmin,
} = require("../controllers/auth.controller");

const { auth } = require("../middleware/auth");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use("/auth", authLimiter);

router.post("/auth/register", register);
router.post("/auth/login", login);
router.put("/auth/change-password", auth, changePassword);

// First-time admin setup — blocked once an admin exists.
router.post("/auth/setup-admin", setupAdmin);

module.exports = router;
