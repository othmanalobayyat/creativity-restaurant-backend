// src/controllers/adminOrders.controller.js
const { query } = require("../db/db");
const asyncHandler = require("../utils/asyncHandler");
const { httpError } = require("../utils/httpError");

const ALLOWED_STATUSES = [
  "PENDING", "PROCESSING", "DELIVERY",
  "DELIVERED", "COMPLETED", "REJECTED",
];

const adminListOrders = asyncHandler(async (req, res) => {
  const status = String(req.query.status || "").trim().toUpperCase();
  const q      = String(req.query.q || "").trim();

  let limit  = parseInt(req.query.limit,  10);
  let offset = parseInt(req.query.offset, 10);
  if (!Number.isFinite(limit))  limit  = 50;
  if (!Number.isFinite(offset)) offset = 0;
  limit  = Math.min(200, Math.max(1, limit));
  offset = Math.max(0, offset);

  const conditions = [];
  const params = [];
  const p = (val) => { params.push(val); return `$${params.length}`; };

  if (status) {
    if (!ALLOWED_STATUSES.includes(status)) throw httpError(400, "Invalid status filter");
    conditions.push(`o.status = ${p(status)}`);
  }

  if (q) {
    const maybeId = Number(q);
    if (Number.isFinite(maybeId) && maybeId > 0) {
      conditions.push(`o.id = ${p(maybeId)}`);
    } else {
      const qq = `%${q.toLowerCase()}%`;
      conditions.push(`(u.email ILIKE ${p(qq)} OR u.full_name ILIKE ${p(qq)})`);
    }
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRows = await query(
    `SELECT COUNT(*) AS total
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ${where}`,
    params,
  );
  const total = Number(countRows?.[0]?.total || 0);

  const rows = await query(
    `SELECT
       o.id,
       o.user_id,
       o.status,
       o.total,
       o.city,
       o.street,
       o.created_at,
       u.full_name AS "userFullName",
       u.email     AS "userEmail",
       u.phone     AS "userPhone",
       (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS "itemsCount"
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ${where}
     ORDER BY o.created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params,
  );

  res.json({ total, limit, offset, orders: rows });
});

const adminGetOrderDetails = asyncHandler(async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isFinite(orderId) || orderId <= 0) throw httpError(400, "Invalid order id");

  const orderRows = await query(
    `SELECT
       o.id,
       o.user_id,
       o.status,
       o.total,
       o.city,
       o.street,
       o.created_at,
       u.full_name AS "userFullName",
       u.email     AS "userEmail",
       u.phone     AS "userPhone"
     FROM orders o
     JOIN users u ON u.id = o.user_id
     WHERE o.id = $1
     LIMIT 1`,
    [orderId],
  );
  if (!orderRows.length) throw httpError(404, "Order not found");

  const items = await query(
    `SELECT oi.item_id, oi.quantity, oi.price, i.name, i.image_url AS image
     FROM order_items oi
     JOIN items i ON i.id = oi.item_id
     WHERE oi.order_id = $1
     ORDER BY oi.id`,
    [orderId],
  );

  res.json({ order: orderRows[0], items });
});

const adminUpdateOrderStatus = asyncHandler(async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isFinite(orderId) || orderId <= 0) throw httpError(400, "Invalid order id");

  const status = String(req.body.status || "").trim().toUpperCase();
  if (!ALLOWED_STATUSES.includes(status)) throw httpError(400, "Invalid status");

  const existing = await query(
    "SELECT id, status FROM orders WHERE id=$1 LIMIT 1",
    [orderId],
  );
  if (!existing.length) throw httpError(404, "Order not found");

  const previousStatus = String(existing[0].status || "").toUpperCase();

  // Restore stock when an order is rejected (only if it wasn't already rejected)
  if (status === "REJECTED" && previousStatus !== "REJECTED") {
    const orderItems = await query(
      "SELECT item_id, quantity FROM order_items WHERE order_id=$1",
      [orderId],
    );
    for (const item of orderItems) {
      await query(
        "UPDATE items SET quantity = quantity + $1 WHERE id = $2",
        [Number(item.quantity) || 0, Number(item.item_id)],
      );
    }
  }

  await query("UPDATE orders SET status=$1 WHERE id=$2", [status, orderId]);

  const updated = await query(
    "SELECT id, user_id, status, total, city, street, created_at FROM orders WHERE id=$1 LIMIT 1",
    [orderId],
  );

  res.json({ message: "✅ Status updated", order: updated[0] });
});

module.exports = { adminListOrders, adminGetOrderDetails, adminUpdateOrderStatus };
