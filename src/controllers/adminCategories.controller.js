// src/controllers/adminCategories.controller.js
const { query } = require("../db/db");
const asyncHandler = require("../utils/asyncHandler");
const { httpError } = require("../utils/httpError");

const adminCreateCategory = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) throw httpError(400, "name is required");

  const nameExists = await query(
    "SELECT id FROM categories WHERE name=? LIMIT 1",
    [name],
  );
  if (nameExists.length) {
    throw httpError(409, "Category name already exists");
  }

  await query("INSERT INTO categories (name) VALUES (?)", [name]);

  const created = await query(
    "SELECT id, name FROM categories WHERE id = LAST_INSERT_ID() LIMIT 1",
  );

  res.json({ message: "✅ Category created", category: created[0] });
});

const adminUpdateCategory = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const name = String(req.body.name || "").trim();

  if (!Number.isFinite(id) || id <= 0)
    throw httpError(400, "Invalid category id");
  if (!name) throw httpError(400, "name is required");

  const exists = await query("SELECT id FROM categories WHERE id=? LIMIT 1", [
    id,
  ]);
  if (!exists.length) throw httpError(404, "Category not found");

  const nameExists = await query(
    "SELECT id FROM categories WHERE name=? AND id<>? LIMIT 1",
    [name, id],
  );
  if (nameExists.length) {
    throw httpError(409, "Category name already exists");
  }

  await query("UPDATE categories SET name=? WHERE id=?", [name, id]);

  const updated = await query(
    "SELECT id, name FROM categories WHERE id=? LIMIT 1",
    [id],
  );

  res.json({ message: "✅ Category updated", category: updated[0] });
});

const adminDeleteCategory = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0)
    throw httpError(400, "Invalid category id");

  const exists = await query("SELECT id FROM categories WHERE id=? LIMIT 1", [
    id,
  ]);
  if (!exists.length) throw httpError(404, "Category not found");

  const used = await query("SELECT id FROM items WHERE category_id=? LIMIT 1", [
    id,
  ]);
  if (used.length) {
    throw httpError(
      409,
      "Cannot delete category: it has items. Delete/move items first.",
    );
  }

  await query("DELETE FROM categories WHERE id=?", [id]);
  res.json({ message: "✅ Category deleted" });
});

const adminListCategories = asyncHandler(async (req, res) => {
  const q = String(req.query.q || "")
    .trim()
    .toLowerCase();

  if (q) {
    const rows = await query(
      "SELECT id, name FROM categories WHERE LOWER(name) LIKE ? ORDER BY id",
      [`%${q}%`],
    );
    return res.json(rows);
  }

  const rows = await query("SELECT id, name FROM categories ORDER BY id");
  res.json(rows);
});

const adminGetCategoryById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0)
    throw httpError(400, "Invalid category id");

  const rows = await query(
    "SELECT id, name FROM categories WHERE id=? LIMIT 1",
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
