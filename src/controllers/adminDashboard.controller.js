// src/controllers/adminDashboard.controller.js
const { query } = require("../db/db");
const asyncHandler = require("../utils/asyncHandler");

const adminDashboard = asyncHandler(async (req, res) => {
  // 1) totals
  const totalsRows = await query(`
    SELECT
      COUNT(*) AS totalOrders,
      COALESCE(
        SUM(CASE WHEN status IN ('DELIVERED','COMPLETED') THEN total ELSE 0 END),
        0
      ) AS totalRevenue
    FROM orders
  `);

  // 2) by status
  const statusRows = await query(`
    SELECT status, COUNT(*) AS count
    FROM orders
    GROUP BY status
  `);

  // 3) last 10 orders
  const lastOrders = await query(`
    SELECT
      o.id,
      o.status,
      o.total,
      o.city,
      o.street,
      o.created_at,
      u.id AS userId,
      u.full_name AS fullName,
      u.email
    FROM orders o
    JOIN users u ON u.id = o.user_id
    ORDER BY o.created_at DESC
    LIMIT 10
  `);

  const totals = totalsRows?.[0] || { totalOrders: 0, totalRevenue: 0 };

  const byStatus = {
    PENDING: 0,
    PROCESSING: 0,
    DELIVERY: 0,
    DELIVERED: 0,
    COMPLETED: 0,
    REJECTED: 0,
  };

  for (const r of statusRows) {
    if (r?.status) byStatus[r.status] = Number(r.count || 0);
  }

  res.json({
    totals: {
      totalOrders: Number(totals.totalOrders || 0),
      totalRevenue: Number(totals.totalRevenue || 0),
    },
    byStatus,
    lastOrders,
  });
});

module.exports = { adminDashboard };
