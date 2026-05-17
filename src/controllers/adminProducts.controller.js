// src/controllers/adminProducts.controller.js
const { query } = require("../db/db");
const asyncHandler = require("../utils/asyncHandler");
const { httpError } = require("../utils/httpError");

const adminCreateProduct = asyncHandler(async (req, res) => {
  const name      = String(req.body.name || "").trim();
  const price     = Number(req.body.price);
  const quantity  = Number.isFinite(Number(req.body.quantity)) ? Number(req.body.quantity) : 0;
  const image_url = req.body.image_url == null ? null : String(req.body.image_url).trim();
  const description = req.body.description == null ? null : String(req.body.description).trim();
  const category_id = Number(req.body.category_id);

  if (!name) throw httpError(400, "name is required");
  if (!Number.isFinite(price) || price < 0) throw httpError(400, "price must be >= 0");
  if (!Number.isFinite(category_id) || category_id <= 0) throw httpError(400, "category_id is required");

  const cat = await query("SELECT id FROM categories WHERE id=$1 LIMIT 1", [category_id]);
  if (!cat.length) throw httpError(400, "Invalid category_id");

  const inserted = await query(
    `INSERT INTO items (name, price, quantity, image_url, description, category_id, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE)
     RETURNING id`,
    [name, price, Math.max(0, Math.floor(quantity)), image_url, description, category_id],
  );

  const created = await query(
    `SELECT i.id, i.name, i.price, i.quantity, i.image_url, i.description,
            i.category_id, i.is_active, c.name AS category_name, i.created_at
     FROM items i
     JOIN categories c ON c.id = i.category_id
     WHERE i.id = $1`,
    [inserted[0].id],
  );

  res.json({ message: "✅ Product created", product: created[0] });
});

const adminUpdateProduct = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) throw httpError(400, "Invalid product id");

  const exists = await query("SELECT id FROM items WHERE id=$1 LIMIT 1", [id]);
  if (!exists.length) throw httpError(404, "Product not found");

  // Build SET clause dynamically — params are auto-numbered as they are added
  const params = [];
  const p = (val) => { params.push(val); return `$${params.length}`; };
  const fields = [];

  if (req.body.name != null) {
    const name = String(req.body.name || "").trim();
    if (!name) throw httpError(400, "name cannot be empty");
    fields.push(`name = ${p(name)}`);
  }
  if (req.body.price != null) {
    const price = Number(req.body.price);
    if (!Number.isFinite(price) || price < 0) throw httpError(400, "price must be >= 0");
    fields.push(`price = ${p(price)}`);
  }
  if (req.body.quantity != null) {
    const qty = Number(req.body.quantity);
    if (!Number.isFinite(qty) || qty < 0) throw httpError(400, "quantity must be >= 0");
    fields.push(`quantity = ${p(Math.floor(qty))}`);
  }
  if (req.body.image_url != null) {
    const image_url = req.body.image_url === "" ? null : String(req.body.image_url).trim();
    fields.push(`image_url = ${p(image_url)}`);
  }
  if (req.body.description != null) {
    const description = req.body.description === "" ? null : String(req.body.description).trim();
    fields.push(`description = ${p(description)}`);
  }
  if (req.body.category_id != null) {
    const category_id = Number(req.body.category_id);
    if (!Number.isFinite(category_id) || category_id <= 0) throw httpError(400, "Invalid category_id");
    const cat = await query("SELECT id FROM categories WHERE id=$1 LIMIT 1", [category_id]);
    if (!cat.length) throw httpError(400, "Invalid category_id");
    fields.push(`category_id = ${p(category_id)}`);
  }

  if (!fields.length) throw httpError(400, "No fields to update");

  await query(
    `UPDATE items SET ${fields.join(", ")} WHERE id = ${p(id)}`,
    params,
  );

  const updated = await query(
    `SELECT i.id, i.name, i.price, i.quantity, i.image_url, i.description,
            i.category_id, i.is_active, c.name AS category_name, i.created_at
     FROM items i
     JOIN categories c ON c.id = i.category_id
     WHERE i.id = $1`,
    [id],
  );

  res.json({ message: "✅ Product updated", product: updated[0] });
});

const adminDeleteProduct = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) throw httpError(400, "Invalid product id");

  const exists = await query("SELECT id FROM items WHERE id=$1 LIMIT 1", [id]);
  if (!exists.length) throw httpError(404, "Product not found");

  const used = await query(
    "SELECT id FROM order_items WHERE item_id=$1 LIMIT 1",
    [id],
  );
  if (used.length) {
    throw httpError(409, "Cannot delete product: used in orders. Consider disabling instead.");
  }

  await query("DELETE FROM items WHERE id=$1", [id]);
  res.json({ message: "✅ Product deleted" });
});

const adminListProducts = asyncHandler(async (req, res) => {
  const q = String(req.query.q || "").trim();
  const categoryId = String(req.query.categoryId || "").trim();

  let limit = parseInt(req.query.limit, 10);
  let offset = parseInt(req.query.offset, 10);
  if (!Number.isFinite(limit))  limit  = 50;
  if (!Number.isFinite(offset)) offset = 0;
  limit  = Math.min(200, Math.max(1, limit));
  offset = Math.max(0, offset);

  const conditions = [];
  const params = [];
  const p = (val) => { params.push(val); return `$${params.length}`; };

  if (q) {
    conditions.push(`i.name ILIKE ${p(`%${q}%`)}`);
  }
  if (categoryId) {
    const cid = Number(categoryId);
    if (Number.isFinite(cid) && cid > 0) {
      conditions.push(`i.category_id = ${p(cid)}`);
    }
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRows = await query(
    `SELECT COUNT(*) AS total FROM items i ${where}`,
    params,
  );
  const total = Number(countRows?.[0]?.total || 0);

  // LIMIT/OFFSET are clamped integers — safe to interpolate directly
  const rows = await query(
    `SELECT i.id, i.name, i.price, i.quantity, i.image_url, i.description,
            i.category_id, i.is_active, c.name AS category_name, i.created_at
     FROM items i
     JOIN categories c ON c.id = i.category_id
     ${where}
     ORDER BY i.id DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params,
  );

  res.json({ total, limit, offset, products: rows });
});

const adminGetProductById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) throw httpError(400, "Invalid product id");

  const rows = await query(
    `SELECT i.id, i.name, i.price, i.quantity, i.image_url, i.description,
            i.category_id, i.is_active, c.name AS category_name, i.created_at
     FROM items i
     JOIN categories c ON c.id = i.category_id
     WHERE i.id = $1`,
    [id],
  );
  if (!rows.length) throw httpError(404, "Product not found");

  res.json(rows[0]);
});

const adminToggleProductActive = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) throw httpError(400, "Invalid product id");

  const active = req.body?.is_active;
  if (active !== 0 && active !== 1 && active !== true && active !== false) {
    throw httpError(400, "is_active must be 0/1 or true/false");
  }

  const is_active = active === true || Number(active) === 1;

  const exists = await query("SELECT id FROM items WHERE id=$1 LIMIT 1", [id]);
  if (!exists.length) throw httpError(404, "Product not found");

  await query("UPDATE items SET is_active=$1 WHERE id=$2", [is_active, id]);

  const updated = await query(
    `SELECT i.id, i.name, i.price, i.quantity, i.image_url, i.description,
            i.category_id, i.is_active, c.name AS category_name, i.created_at
     FROM items i
     JOIN categories c ON c.id = i.category_id
     WHERE i.id = $1`,
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
