// src/controllers/menu.controller.js
const { query } = require("../db/db");
const asyncHandler = require("../utils/asyncHandler");
const { httpError } = require("../utils/httpError");

const getCategories = asyncHandler(async (req, res) => {
  const rows = await query("SELECT id, name FROM categories ORDER BY id");
  res.json(rows);
});

const getItems = asyncHandler(async (req, res) => {
  const search = String(req.query.search || "").trim();
  const categoryId = String(req.query.categoryId || "0");

  const conditions = ["is_active = TRUE"];
  const params = [];
  const p = (val) => { params.push(val); return `$${params.length}`; };

  if (categoryId !== "0") {
    const cid = Number(categoryId);
    if (!Number.isFinite(cid) || cid <= 0) throw httpError(400, "Invalid categoryId");
    conditions.push(`category_id = ${p(cid)}`);
  }

  if (search) {
    // ILIKE = case-insensitive LIKE in PostgreSQL (no need to LOWER both sides)
    conditions.push(`name ILIKE ${p(`%${search}%`)}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await query(
    `SELECT id, name, price, quantity, image_url AS image, description, category_id
     FROM items
     ${where}
     ORDER BY id`,
    params,
  );
  res.json(rows);
});

const getItemById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) throw httpError(400, "Invalid item id");

  const rows = await query(
    `SELECT id, name, price, quantity, image_url AS image, description, category_id
     FROM items
     WHERE id = $1 AND is_active = TRUE`,
    [id],
  );
  if (!rows.length) throw httpError(404, "Item not found");

  res.json(rows[0]);
});

module.exports = { getCategories, getItems, getItemById };
