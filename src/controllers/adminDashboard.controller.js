const { query } = require("../db/db");

async function adminDashboard(req, res) {
  try {
    // 1) إجمالي الطلبات + إجمالي الإيرادات
    const totalsRows = await query(`
      SELECT
        COUNT(*) AS totalOrders,
        COALESCE(SUM(total), 0) AS totalRevenue
      FROM orders
    `);

    // 2) توزيع الحالات
    const statusRows = await query(`
      SELECT status, COUNT(*) AS count
      FROM orders
      GROUP BY status
    `);

    // 3) آخر 10 طلبات (مع اسم العميل)
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

    // نحول statusRows لكائن مرتب
    const byStatus = {
      PENDING: 0,
      PROCESSING: 0,
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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = { adminDashboard };
