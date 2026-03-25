// src/controllers/adminProducts.controller.js
const { query } = require("../db/db");
const asyncHandler = require("../utils/asyncHandler");
const { httpError } = require("../utils/httpError");

/**
 * POST /api/admin/products
 * body: { name, price, quantity, image_url, description, category_id }
 *
 * ✅ id AUTO_INCREMENT (ما بنستقبل id من الفرونت)
 */
const adminCreateProduct = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const price = Number(req.body.price);
  const quantity = Number.isFinite(Number(req.body.quantity))
    ? Number(req.body.quantity)
    : 0;
  const image_url =
    req.body.image_url == null ? null : String(req.body.image_url).trim();
  const description =
    req.body.description == null ? null : String(req.body.description).trim();
  const category_id = Number(req.body.category_id);

  if (!name) throw httpError(400, "name is required");
  if (!Number.isFinite(price) || price < 0) {
    throw httpError(400, "price must be >= 0");
  }
  if (!Number.isFinite(category_id) || category_id <= 0) {
    throw httpError(400, "category_id is required");
  }

  const cat = await query("SELECT id FROM categories WHERE id=? LIMIT 1", [
    category_id,
  ]);
  if (!cat.length) throw httpError(400, "Invalid category_id");

  const insertResult = await query(
    `INSERT INTO items
      (name, price, quantity, image_url, description, category_id, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [
      name,
      price,
      Math.max(0, Math.floor(quantity)),
      image_url,
      description,
      category_id,
    ],
  );

  const created = await query(
    `SELECT id, name, price, quantity, image_url, description, category_id, is_active, created_at
     FROM items WHERE id = ? LIMIT 1`,
    [insertResult.insertId],
  );

  res.json({ message: "✅ Product created", product: created[0] });
});

/**
 * PUT /api/admin/products/:id
 * body can include: name, price, quantity, image_url, description, category_id
 */
const adminUpdateProduct = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    throw httpError(400, "Invalid product id");
  }

  const exists = await query("SELECT id FROM items WHERE id=? LIMIT 1", [id]);
  if (!exists.length) throw httpError(404, "Product not found");

  const fields = [];
  const params = [];

  if (req.body.name != null) {
    const name = String(req.body.name || "").trim();
    if (!name) throw httpError(400, "name cannot be empty");
    fields.push("name=?");
    params.push(name);
  }

  if (req.body.price != null) {
    const price = Number(req.body.price);
    if (!Number.isFinite(price) || price < 0) {
      throw httpError(400, "price must be a valid number >= 0");
    }
    fields.push("price=?");
    params.push(price);
  }

  if (req.body.quantity != null) {
    const qty = Number(req.body.quantity);
    if (!Number.isFinite(qty) || qty < 0) {
      throw httpError(400, "quantity must be a number >= 0");
    }
    fields.push("quantity=?");
    params.push(Math.floor(qty));
  }

  if (req.body.image_url != null) {
    const image_url =
      req.body.image_url === "" ? null : String(req.body.image_url).trim();
    fields.push("image_url=?");
    params.push(image_url);
  }

  if (req.body.description != null) {
    const description =
      req.body.description === "" ? null : String(req.body.description).trim();
    fields.push("description=?");
    params.push(description);
  }

  if (req.body.category_id != null) {
    const category_id = Number(req.body.category_id);
    if (!Number.isFinite(category_id) || category_id <= 0) {
      throw httpError(400, "Invalid category_id");
    }
    const cat = await query("SELECT id FROM categories WHERE id=? LIMIT 1", [
      category_id,
    ]);
    if (!cat.length) throw httpError(400, "Invalid category_id");

    fields.push("category_id=?");
    params.push(category_id);
  }

  if (!fields.length) throw httpError(400, "No fields to update");

  params.push(id);

  await query(`UPDATE items SET ${fields.join(", ")} WHERE id=?`, params);

  const updated = await query(
    `SELECT id, name, price, quantity, image_url, description, category_id, is_active, created_at
     FROM items WHERE id=? LIMIT 1`,
    [id],
  );

  res.json({ message: "✅ Product updated", product: updated[0] });
});

/**
 * DELETE /api/admin/products/:id
 * ملاحظة: order_items FK item_id -> items.id (بدون ON DELETE CASCADE)
 * فلازم نمنع الحذف إذا المنتج مستخدم في أي order_items
 */
const adminDeleteProduct = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    throw httpError(400, "Invalid product id");
  }

  const exists = await query("SELECT id FROM items WHERE id=? LIMIT 1", [id]);
  if (!exists.length) throw httpError(404, "Product not found");

  const used = await query(
    "SELECT id FROM order_items WHERE item_id=? LIMIT 1",
    [id],
  );
  if (used.length) {
    throw httpError(
      409,
      "Cannot delete product: used in orders. Consider disabling instead.",
    );
  }

  await query("DELETE FROM items WHERE id=?", [id]);
  res.json({ message: "✅ Product deleted" });
});

// ✅ list products (FIXED: no placeholders for LIMIT/OFFSET)
const adminListProducts = asyncHandler(async (req, res) => {
  const q = String(req.query.q || "")
    .trim()
    .toLowerCase();
  const categoryId = String(req.query.categoryId || "").trim();

  let limit = parseInt(req.query.limit, 10);
  let offset = parseInt(req.query.offset, 10);

  if (!Number.isFinite(limit)) limit = 50;
  if (!Number.isFinite(offset)) offset = 0;

  limit = Math.min(200, Math.max(1, limit));
  offset = Math.max(0, offset);

  let where = "WHERE 1=1";
  const params = [];

  if (q) {
    where += " AND LOWER(i.name) LIKE ?";
    params.push(`%${q}%`);
  }

  if (categoryId) {
    const cid = Number(categoryId);
    if (Number.isFinite(cid) && cid > 0) {
      where += " AND i.category_id = ?";
      params.push(cid);
    }
  }

  const countRows = await query(
    `
    SELECT COUNT(*) AS total
    FROM items i
    ${where}
    `,
    params,
  );
  const total = Number(countRows?.[0]?.total || 0);

  const rows = await query(
    `
    SELECT
      i.id,
      i.name,
      i.price,
      i.quantity,
      i.image_url,
      i.description,
      i.category_id,
      i.is_active,
      c.name AS category_name,
      i.created_at
    FROM items i
    JOIN categories c ON c.id = i.category_id
    ${where}
    ORDER BY i.id DESC
    LIMIT ${limit} OFFSET ${offset}
    `,
    params,
  );

  res.json({ total, limit, offset, products: rows });
});

// ✅ get product by id
const adminGetProductById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    throw httpError(400, "Invalid product id");
  }

  const rows = await query(
    `
    SELECT
      i.id,
      i.name,
      i.price,
      i.quantity,
      i.image_url,
      i.description,
      i.category_id,
      i.is_active,
      c.name AS category_name,
      i.created_at
    FROM items i
    JOIN categories c ON c.id = i.category_id
    WHERE i.id=?
    LIMIT 1
    `,
    [id],
  );

  if (!rows.length) throw httpError(404, "Product not found");

  res.json(rows[0]);
});

// ✅ toggle active
const adminToggleProductActive = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    throw httpError(400, "Invalid product id");
  }

  const active = req.body?.is_active;
  if (active !== 0 && active !== 1 && active !== true && active !== false) {
    throw httpError(400, "is_active must be 0/1");
  }

  const is_active = active === true ? 1 : active === false ? 0 : Number(active);

  const exists = await query("SELECT id FROM items WHERE id=? LIMIT 1", [id]);
  if (!exists.length) throw httpError(404, "Product not found");

  await query("UPDATE items SET is_active=? WHERE id=?", [is_active, id]);

  const updated = await query(
    `SELECT id, name, price, quantity, image_url, description, category_id, is_active, created_at
     FROM items WHERE id=? LIMIT 1`,
    [id],
  );

  res.json({ message: "✅ Product updated", product: updated[0] });
});

module.exports = {
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminListProducts,
  adminGetProductById,
  adminToggleProductActive,
};
