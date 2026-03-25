// src/controllers/adminOrders.controller.js
const { query } = require("../db/db");
const asyncHandler = require("../utils/asyncHandler");
const { httpError } = require("../utils/httpError");

const ALLOWED_STATUSES = [
  "PENDING",
  "PROCESSING",
  "DELIVERY",
  "DELIVERED",
  "COMPLETED",
  "REJECTED",
];

/**
 * GET /api/admin/orders
 * Optional query:
 *  - status=PENDING|PROCESSING|DELIVERY|DELIVERED|REJECTED|COMPLETED
 *  - q=search by user email or name or order id
 *  - limit=number (default 50, max 200)
 *  - offset=number (default 0)
 */
const adminListOrders = asyncHandler(async (req, res) => {
  const status = String(req.query.status || "")
    .trim()
    .toUpperCase();
  const q = String(req.query.q || "").trim();

  let limit = parseInt(req.query.limit, 10);
  let offset = parseInt(req.query.offset, 10);

  if (!Number.isFinite(limit)) limit = 50;
  if (!Number.isFinite(offset)) offset = 0;

  limit = Math.min(200, Math.max(1, limit));
  offset = Math.max(0, offset);

  let where = "WHERE 1=1";
  const params = [];

  if (status) {
    if (!ALLOWED_STATUSES.includes(status)) {
      throw httpError(400, "Invalid status filter");
    }
    where += " AND o.status = ?";
    params.push(status);
  }

  if (q) {
    const maybeId = Number(q);
    if (Number.isFinite(maybeId) && maybeId > 0) {
      where += " AND o.id = ?";
      params.push(maybeId);
    } else {
      where += " AND (LOWER(u.email) LIKE ? OR LOWER(u.full_name) LIKE ?)";
      const qq = `%${q.toLowerCase()}%`;
      params.push(qq, qq);
    }
  }

  const countRows = await query(
    `
    SELECT COUNT(*) AS total
    FROM orders o
    JOIN users u ON u.id = o.user_id
    ${where}
    `,
    params,
  );
  const total = Number(countRows?.[0]?.total || 0);

  // ✅ IMPORTANT: no placeholders for LIMIT/OFFSET (keeps your fix)
  const rows = await query(
    `
    SELECT
      o.id,
      o.user_id,
      o.status,
      o.total,
      o.city,
      o.street,
      o.created_at,
      u.full_name AS userFullName,
      u.email AS userEmail,
      u.phone AS userPhone,
      (
        SELECT COUNT(*)
        FROM order_items oi
        WHERE oi.order_id = o.id
      ) AS itemsCount
    FROM orders o
    JOIN users u ON u.id = o.user_id
    ${where}
    ORDER BY o.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
    `,
    params,
  );

  res.json({
    total,
    limit,
    offset,
    orders: rows,
  });
});

/**
 * GET /api/admin/orders/:id
 * returns: { order, items }
 */
const adminGetOrderDetails = asyncHandler(async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isFinite(orderId) || orderId <= 0) {
    throw httpError(400, "Invalid order id");
  }

  // ✅ Order + user info (useful for admin)
  const orderRows = await query(
    `
    SELECT
      o.id,
      o.user_id,
      o.status,
      o.total,
      o.city,
      o.street,
      o.created_at,
      u.full_name AS userFullName,
      u.email AS userEmail,
      u.phone AS userPhone
    FROM orders o
    JOIN users u ON u.id = o.user_id
    WHERE o.id=?
    LIMIT 1
    `,
    [orderId],
  );

  if (!orderRows.length) throw httpError(404, "Order not found");

  // ✅ Items (same shape as user OrderDetailsScreen expects)
  const items = await query(
    `
    SELECT
      oi.item_id,
      oi.quantity,
      oi.price,
      i.name,
      i.image_url AS image
    FROM order_items oi
    JOIN items i ON i.id = oi.item_id
    WHERE oi.order_id = ?
    ORDER BY oi.id
    `,
    [orderId],
  );

  res.json({ order: orderRows[0], items });
});

/**
 * PUT /api/admin/orders/:id/status
 * body: { status: "PROCESSING" | "REJECTED" | "COMPLETED" | "PENDING" | "DELIVERY" | "DELIVERED" }
 */
const adminUpdateOrderStatus = asyncHandler(async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isFinite(orderId) || orderId <= 0) {
    throw httpError(400, "Invalid order id");
  }

  const status = String(req.body.status || "")
    .trim()
    .toUpperCase();
  if (!ALLOWED_STATUSES.includes(status)) {
    throw httpError(400, "Invalid status");
  }

  const exists = await query(
    "SELECT id, status FROM orders WHERE id=? LIMIT 1",
    [orderId],
  );
  if (!exists.length) {
    throw httpError(404, "Order not found");
  }

  const previousStatus = String(exists[0].status || "").toUpperCase();

  if (status === "REJECTED" && previousStatus !== "REJECTED") {
    const orderItems = await query(
      "SELECT item_id, quantity FROM order_items WHERE order_id=?",
      [orderId],
    );

    for (const item of orderItems) {
      await query("UPDATE items SET quantity = quantity + ? WHERE id = ?", [
        Number(item.quantity) || 0,
        Number(item.item_id),
      ]);
    }
  }

  await query("UPDATE orders SET status=? WHERE id=?", [status, orderId]);

  const updated = await query(
    "SELECT id, user_id, status, total, city, street, created_at FROM orders WHERE id=? LIMIT 1",
    [orderId],
  );

  res.json({ message: "✅ Status updated", order: updated[0] });
});

module.exports = {
  adminListOrders,
  adminGetOrderDetails,
  adminUpdateOrderStatus,
};
