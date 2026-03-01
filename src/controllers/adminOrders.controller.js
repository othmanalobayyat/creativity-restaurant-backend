// src/controllers/adminOrders.controller.js
const { query } = require("../db/db");

const ALLOWED_STATUSES = ["PENDING", "PROCESSING", "REJECTED", "COMPLETED"];

/**
 * GET /api/admin/orders
 * Optional query:
 *  - status=PENDING|PROCESSING|REJECTED|COMPLETED
 *  - q=search by user email or name or order id
 *  - limit=number (default 50, max 200)
 *  - offset=number (default 0)
 */
async function adminListOrders(req, res) {
  try {
    const status = String(req.query.status || "")
      .trim()
      .toUpperCase();
    const q = String(req.query.q || "").trim();
    const limit = Math.min(200, Math.max(1, Number(req.query.limit || 50)));
    const offset = Math.max(0, Number(req.query.offset || 0));

    let where = "WHERE 1=1";
    const params = [];

    if (status) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({ error: "Invalid status filter" });
      }
      where += " AND o.status = ?";
      params.push(status);
    }

    if (q) {
      // search by order id exact, or user email/name partial
      const maybeId = Number(q);
      if (Number.isFinite(maybeId) && maybeId > 0) {
        where += " AND o.id = ?";
        params.push(maybeId);
      } else {
        where += " AND (LOWER(u.email) LIKE ? OR LOWER(u.full_name) LIKE ?)";
        params.push(`%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`);
      }
    }

    // total count
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
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset],
    );

    return res.json({
      total,
      limit,
      offset,
      orders: rows,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

/**
 * PUT /api/admin/orders/:id/status
 * body: { status: "PROCESSING" | "REJECTED" | "COMPLETED" | "PENDING" }
 */
async function adminUpdateOrderStatus(req, res) {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isFinite(orderId) || orderId <= 0) {
      return res.status(400).json({ error: "Invalid order id" });
    }

    const status = String(req.body.status || "")
      .trim()
      .toUpperCase();
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const exists = await query("SELECT id FROM orders WHERE id=? LIMIT 1", [
      orderId,
    ]);
    if (!exists.length)
      return res.status(404).json({ error: "Order not found" });

    await query("UPDATE orders SET status=? WHERE id=?", [status, orderId]);

    const updated = await query(
      "SELECT id, user_id, status, total, city, street, created_at FROM orders WHERE id=? LIMIT 1",
      [orderId],
    );

    return res.json({ message: "✅ Status updated", order: updated[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

module.exports = { adminListOrders, adminUpdateOrderStatus };
