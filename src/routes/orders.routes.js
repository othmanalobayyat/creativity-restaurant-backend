// src/routes/orders.routes.js
const router = require("express").Router();
const { auth } = require("../middleware/auth");
const {
  createOrder,
  getMyOrders,
  getOrderDetails,
} = require("../controllers/orders.controller");

router.post("/orders", auth, createOrder);
router.get("/me/orders", auth, getMyOrders);
router.get("/orders/:id", auth, getOrderDetails);

module.exports = router;
