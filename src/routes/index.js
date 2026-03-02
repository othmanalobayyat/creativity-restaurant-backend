// src/routes/index.js
const router = require("express").Router();

router.use(require("./auth.routes"));
router.use(require("./me.routes"));
router.use(require("./menu.routes"));
router.use(require("./address.routes"));
router.use(require("./orders.routes"));
router.use(require("./upload.routes"));
router.use(require("./admin.routes"));
router.use(require("./uploadCloudinary.routes"));

// ✅ Dev routes only when enabled (safe for production)
if (process.env.ENABLE_DEV_ROUTES === "true") {
  router.use(require("./dev.routes"));
}

module.exports = router;
