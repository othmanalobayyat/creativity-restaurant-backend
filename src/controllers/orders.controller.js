// src/controllers/orders.controller.js
const asyncHandler = require("../utils/asyncHandler");
const orderService = require("../services/order.service");

const createOrder = asyncHandler(async (req, res) => {
  const result = await orderService.createOrder({
    userId: req.userId,
    items: req.body.items,
    addressOverride: req.body.addressOverride,
  });
  res.json(result);
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getMyOrders(req.userId);
  res.json(orders);
});

const getOrderDetails = asyncHandler(async (req, res) => {
  const result = await orderService.getOrderDetails({
    userId: req.userId,
    orderId: req.params.id,
  });
  res.json(result);
});

module.exports = { createOrder, getMyOrders, getOrderDetails };
