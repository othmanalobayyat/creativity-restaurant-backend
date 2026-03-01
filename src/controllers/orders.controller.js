// src/controllers/orders.controller.js
const { query } = require("../db/db");

async function createOrder(req, res) {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const override = req.body.addressOverride;

    if (!items.length) return res.status(400).json({ error: "items required" });

    let city = "";
    let street = "";

    if (override && override.city && override.street) {
      city = String(override.city).trim();
      street = String(override.street).trim();
    } else {
      const addr = await query(
        "SELECT city, street FROM addresses WHERE user_id=? AND is_default=1 LIMIT 1",
        [req.userId],
      );
      if (!addr.length)
        return res
          .status(400)
          .json({ error: "No saved address. Set address first." });
      city = addr[0].city;
      street = addr[0].street;
    }

    const ids = items
      .map((x) => Number(x.itemId))
      .filter((v) => Number.isFinite(v) && v > 0);
    const placeholders = ids.map(() => "?").join(",");

    const dbItems = await query(
      `SELECT id, price FROM items WHERE id IN (${placeholders})`,
      ids,
    );
    const priceMap = new Map(dbItems.map((x) => [x.id, Number(x.price)]));

    let total = 0;
    for (const it of items) {
      const id = Number(it.itemId);
      const qty = Math.max(1, Number(it.quantity || 1));
      const price = priceMap.get(id);
      if (price == null)
        return res.status(400).json({ error: `Invalid itemId ${id}` });
      total += price * qty;
    }

    const r = await query(
      "INSERT INTO orders (user_id, total, city, street) VALUES (?, ?, ?, ?)",
      [req.userId, total, city, street],
    );
    const orderId = r.insertId;

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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function getMyOrders(req, res) {
  try {
    const orders = await query(
      "SELECT id, status, total, city, street, created_at FROM orders WHERE user_id=? ORDER BY created_at DESC",
      [req.userId],
    );
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function getOrderDetails(req, res) {
  try {
    const orderId = Number(req.params.id);

    // تأكد الطلب للمستخدم نفسه
    const orderRows = await query(
      "SELECT id, status, total, city, street, created_at FROM orders WHERE id=? AND user_id=? LIMIT 1",
      [orderId, req.userId],
    );
    if (!orderRows.length)
      return res.status(404).json({ error: "Order not found" });

    const items = await query(
      `SELECT oi.item_id, oi.quantity, oi.price, i.name, i.image_url AS image
       FROM order_items oi
       JOIN items i ON i.id = oi.item_id
       WHERE oi.order_id = ?
       ORDER BY oi.id`,
      [orderId],
    );

    res.json({ order: orderRows[0], items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = { createOrder, getMyOrders, getOrderDetails };
