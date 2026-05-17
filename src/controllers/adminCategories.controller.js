// src/controllers/adminCategories.controller.js
const { query } = require("../db/db");
const asyncHandler = require("../utils/asyncHandler");
const { httpError } = require("../utils/httpError");

const adminCreateCategory = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) throw httpError(400, "name is required");

  const nameExists = await query(
    "SELECT id FROM categories WHERE name=$1 LIMIT 1",
    [name],
  );
  if (nameExists.length) throw httpError(409, "Category name already exists");

  const created = await query(
    "INSERT INTO categories (name) VALUES ($1) RETURNING id, name",
    [name],
  );

  res.json({ message: "✅ Category created", category: created[0] });
});

const adminUpdateCategory = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const name = String(req.body.name || "").trim();

  if (!Number.isFinite(id) || id <= 0) throw httpError(400, "Invalid category id");
  if (!name) throw httpError(400, "name is required");

  const exists = await query(
    "SELECT id FROM categories WHERE id=$1 LIMIT 1",
    [id],
  );
  if (!exists.length) throw httpError(404, "Category not found");

  const nameExists = await query(
    "SELECT id FROM categories WHERE name=$1 AND id!=$2 LIMIT 1",
    [name, id],
  );
  if (nameExists.length) throw httpError(409, "Category name already exists");

  await query("UPDATE categories SET name=$1 WHERE id=$2", [name, id]);

  const updated = await query(
    "SELECT id, name FROM categories WHERE id=$1 LIMIT 1",
    [id],
  );

  res.json({ message: "✅ Category updated", category: updated[0] });
});

const adminDeleteCategory = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) throw httpError(400, "Invalid category id");

  const exists = await query(
    "SELECT id FROM categories WHERE id=$1 LIMIT 1",
    [id],
  );
  if (!exists.length) throw httpError(404, "Category not found");

  const used = await query(
    "SELECT id FROM items WHERE category_id=$1 LIMIT 1",
    [id],
  );
  if (used.length) {
    throw httpError(409, "Cannot delete category: it has items. Delete/move items first.");
  }

  await query("DELETE FROM categories WHERE id=$1", [id]);
  res.json({ message: "✅ Category deleted" });
});

const adminListCategories = asyncHandler(async (req, res) => {
  const q = String(req.query.q || "").trim();

  if (q) {
    const rows = await query(
      "SELECT id, name FROM categories WHERE name ILIKE $1 ORDER BY id",
      [`%${q}%`],
    );
    return res.json(rows);
  }

  const rows = await query("SELECT id, name FROM categories ORDER BY id");
  res.json(rows);
});

const adminGetCategoryById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) throw httpError(400, "Invalid category id");

  const rows = await query(
    "SELECT id, name FROM categories WHERE id=$1 LIMIT 1",
    [id],
  );
  if (!rows.length) throw httpError(404, "Category not found");

  res.json(rows[0]);
});

module.exports = {
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminListCategories,
  adminGetCategoryById,
};
