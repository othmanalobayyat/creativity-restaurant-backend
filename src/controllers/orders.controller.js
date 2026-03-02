// src/controllers/orders.controller.js
const { query } = require("../db/db");
const asyncHandler = require("../utils/asyncHandler");
const { httpError } = require("../utils/httpError");

const createOrder = asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const override = req.body.addressOverride;

  if (!items.length) throw httpError(400, "items required");

  let city = "";
  let street = "";

  // address override OR default address
  if (override && override.city && override.street) {
    city = String(override.city).trim();
    street = String(override.street).trim();
  } else {
    const addr = await query(
      "SELECT city, street FROM addresses WHERE user_id=? AND is_default=1 LIMIT 1",
      [req.userId],
    );
    if (!addr.length) {
      throw httpError(400, "No saved address. Set address first.");
    }
    city = addr[0].city;
    street = addr[0].street;
  }

  // Validate itemIds
  const ids = items
    .map((x) => Number(x.itemId))
    .filter((v) => Number.isFinite(v) && v > 0);

  // ✅ مهم: إذا user بعت items بس كلها invalid
  if (!ids.length) throw httpError(400, "items required");

  const placeholders = ids.map(() => "?").join(",");

  const dbItems = await query(
    `SELECT id, price FROM items WHERE id IN (${placeholders})`,
    ids,
  );

  const priceMap = new Map(dbItems.map((x) => [Number(x.id), Number(x.price)]));

  let total = 0;

  for (const it of items) {
    const id = Number(it.itemId);
    const qty = Math.max(1, Number(it.quantity || 1));

    if (!Number.isFinite(id) || id <= 0) {
      throw httpError(400, `Invalid itemId ${it.itemId}`);
    }

    const price = priceMap.get(id);
    if (price == null) {
      throw httpError(400, `Invalid itemId ${id}`);
    }

    total += price * qty;
  }

  // Create order
  const r = await query(
    "INSERT INTO orders (user_id, total, city, street) VALUES (?, ?, ?, ?)",
    [req.userId, total, city, street],
  );
  const orderId = r.insertId;

  // Insert order items
  for (const it of items) {
    const id = Number(it.itemId);
    const qty = Math.max(1, Number(it.quantity || 1));
    const price = priceMap.get(id);

    await query(
      "INSERT INTO order_items (order_id, item_id, quantity, price) VALUES (?, ?, ?, ?)",
      [orderId, id, qty, price],
    );
  }

  res.json({
    orderId,
    total: Number(total.toFixed(2)),
    status: "PENDING",
    city,
    street,
  });
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await query(
    "SELECT id, status, total, city, street, created_at FROM orders WHERE user_id=? ORDER BY created_at DESC",
    [req.userId],
  );
  res.json(orders);
});

const getOrderDetails = asyncHandler(async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isFinite(orderId) || orderId <= 0) {
    throw httpError(400, "Invalid order id");
  }

  // ensure order belongs to user
  const orderRows = await query(
    "SELECT id, status, total, city, street, created_at FROM orders WHERE id=? AND user_id=? LIMIT 1",
    [orderId, req.userId],
  );

  if (!orderRows.length) throw httpError(404, "Order not found");

  const items = await query(
    `SELECT oi.item_id, oi.quantity, oi.price, i.name, i.image_url AS image
     FROM order_items oi
     JOIN items i ON i.id = oi.item_id
     WHERE oi.order_id = ?
     ORDER BY oi.id`,
    [orderId],
  );

  res.json({ order: orderRows[0], items });
});

module.exports = { createOrder, getMyOrders, getOrderDetails };
