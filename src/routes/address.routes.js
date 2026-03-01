// src/routes/address.routes.js
const router = require("express").Router();
const { auth } = require("../middleware/auth");
const {
  getMyAddress,
  updateMyAddress,
} = require("../controllers/address.controller");

router.get("/me/address", auth, getMyAddress);
router.put("/me/address", auth, updateMyAddress);

module.exports = router;
