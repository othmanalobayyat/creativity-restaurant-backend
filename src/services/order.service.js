const { query, withTransaction } = require("../db/db");
const { httpError } = require("../utils/httpError");

async function createOrder({ userId, items, addressOverride }) {
  const safeItems = Array.isArray(items) ? items : [];
  const override = addressOverride;

  if (!safeItems.length) throw httpError(400, "items required");

  let city = "";
  let street = "";

  // address override OR default address
  if (override?.city && override?.street) {
    city = String(override.city).trim();
    street = String(override.street).trim();
  } else {
    const addr = await query(
      "SELECT city, street FROM addresses WHERE user_id=? AND is_default=1 LIMIT 1",
      [userId],
    );
    if (!addr.length) {
      throw httpError(400, "No saved address. Set address first.");
    }
    city = addr[0].city;
    street = addr[0].street;
  }

  // Validate itemIds
  const ids = safeItems
    .map((x) => Number(x.itemId))
    .filter((v) => Number.isFinite(v) && v > 0);

  // ✅ مهم: إذا user بعت items بس كلها invalid
  if (!ids.length) throw httpError(400, "items required");

  const placeholders = ids.map(() => "?").join(",");

  const dbItems = await query(
    `SELECT id, price, quantity, is_active FROM items WHERE id IN (${placeholders})`,
    ids,
  );

  const itemMap = new Map(
    dbItems.map((x) => [
      Number(x.id),
      {
        price: Number(x.price),
        stock: Number(x.quantity),
        active: !!x.is_active,
      },
    ]),
  );

  let total = 0;

  for (const it of safeItems) {
    const id = Number(it.itemId);
    const qty = Number(it.quantity);

    if (!Number.isFinite(id) || id <= 0) {
      throw httpError(400, `Invalid itemId ${it.itemId}`);
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      throw httpError(400, `quantity for item ${id} must be a positive number`);
    }

    const item = itemMap.get(id);
    if (item == null) {
      throw httpError(400, "One or more items are no longer available");
    }

    if (!item.active) {
      throw httpError(400, "One or more items are no longer available");
    }

    if (qty > item.stock) {
      throw httpError(400, "One or more items exceed available stock");
    }

    total += item.price * qty;
  }

  const { orderId } = await withTransaction(async (tx) => {
    // Create order
    const r = await tx.query(
      "INSERT INTO orders (user_id, total, city, street) VALUES (?, ?, ?, ?)",
      [userId, total, city, street],
    );
    const orderId = r.insertId;

    // Insert order items
    for (const it of safeItems) {
      const id = Number(it.itemId);
      const qty = Number(it.quantity);
      const price = itemMap.get(id).price;

      await tx.query(
        "INSERT INTO order_items (order_id, item_id, quantity, price) VALUES (?, ?, ?, ?)",
        [orderId, id, qty, price],
      );

      await tx.query("UPDATE items SET quantity = quantity - ? WHERE id = ?", [
        qty,
        id,
      ]);
    }

    return { orderId };
  });

  return {
    orderId,
    total: Number(total.toFixed(2)),
    status: "PENDING",
    city,
    street,
  };
}

async function getMyOrders(userId) {
  return await query(
    "SELECT id, status, total, city, street, created_at FROM orders WHERE user_id=? ORDER BY created_at DESC",
    [userId],
  );
}

async function getOrderDetails({ userId, orderId }) {
  const id = Number(orderId);
  if (!Number.isFinite(id) || id <= 0) {
    throw httpError(400, "Invalid order id");
  }

  // ensure order belongs to user
  const orderRows = await query(
    "SELECT id, status, total, city, street, created_at FROM orders WHERE id=? AND user_id=? LIMIT 1",
    [id, userId],
  );

  if (!orderRows.length) throw httpError(404, "Order not found");

  const items = await query(
    `SELECT oi.item_id, oi.quantity, oi.price, i.name, i.image_url AS image
     FROM order_items oi
     JOIN items i ON i.id = oi.item_id
     WHERE oi.order_id = ?
     ORDER BY oi.id`,
    [id],
  );

  return { order: orderRows[0], items };
}

module.exports = { createOrder, getMyOrders, getOrderDetails };
