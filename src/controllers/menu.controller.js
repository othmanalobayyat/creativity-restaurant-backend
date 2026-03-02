// controllers/menu.controller.js
const { query } = require("../db/db");
const asyncHandler = require("../utils/asyncHandler");
const { httpError } = require("../utils/httpError");

const getCategories = asyncHandler(async (req, res) => {
  const rows = await query("SELECT id, name FROM categories ORDER BY id");
  res.json(rows);
});

const getItems = asyncHandler(async (req, res) => {
  const search = String(req.query.search || "")
    .trim()
    .toLowerCase();
  const categoryId = String(req.query.categoryId || "0");

  let sql =
    "SELECT id, name, price, quantity, image_url AS image, description, category_id FROM items WHERE is_active = 1";
  const params = [];

  if (categoryId !== "0") {
    const cid = Number(categoryId);
    if (!Number.isFinite(cid) || cid <= 0) {
      throw httpError(400, "Invalid categoryId");
    }
    sql += " AND category_id = ?";
    params.push(cid);
  }

  if (search) {
    sql += " AND LOWER(name) LIKE ?";
    params.push(`%${search}%`);
  }

  sql += " ORDER BY id";
  const rows = await query(sql, params);
  res.json(rows);
});

const getItemById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    throw httpError(400, "Invalid item id");
  }

  const rows = await query(
    "SELECT id, name, price, quantity, image_url AS image, description, category_id FROM items WHERE id = ? AND is_active = 1",
    [id],
  );

  if (!rows.length) throw httpError(404, "Item not found");

  res.json(rows[0]);
});

module.exports = { getCategories, getItems, getItemById };
