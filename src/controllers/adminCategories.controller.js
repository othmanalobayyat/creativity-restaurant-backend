// src/controllers/adminCategories.controller.js
const { query } = require("../db/db");

/**
 * POST /api/admin/categories
 * body: { id, name }
 * ملاحظة: جدول categories عندك id NOT NULL وما عليه AUTO_INCREMENT
 */
async function adminCreateCategory(req, res) {
  try {
    const id = Number(req.body.id);
    const name = String(req.body.name || "").trim();

    if (!Number.isFinite(id) || id <= 0) {
      return res
        .status(400)
        .json({ error: "id is required (positive number)" });
    }
    if (!name) return res.status(400).json({ error: "name is required" });

    // unique name
    const nameExists = await query(
      "SELECT id FROM categories WHERE name=? LIMIT 1",
      [name],
    );
    if (nameExists.length) {
      return res.status(409).json({ error: "Category name already exists" });
    }

    const idExists = await query(
      "SELECT id FROM categories WHERE id=? LIMIT 1",
      [id],
    );
    if (idExists.length) {
      return res.status(409).json({ error: "Category id already exists" });
    }

    await query("INSERT INTO categories (id, name) VALUES (?, ?)", [id, name]);

    const created = await query(
      "SELECT id, name FROM categories WHERE id=? LIMIT 1",
      [id],
    );

    return res.json({ message: "✅ Category created", category: created[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

/**
 * PUT /api/admin/categories/:id
 * body: { name }
 */
async function adminUpdateCategory(req, res) {
  try {
    const id = Number(req.params.id);
    const name = String(req.body.name || "").trim();

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid category id" });
    }
    if (!name) return res.status(400).json({ error: "name is required" });

    const exists = await query("SELECT id FROM categories WHERE id=? LIMIT 1", [
      id,
    ]);
    if (!exists.length)
      return res.status(404).json({ error: "Category not found" });

    const nameExists = await query(
      "SELECT id FROM categories WHERE name=? AND id<>? LIMIT 1",
      [name, id],
    );
    if (nameExists.length) {
      return res.status(409).json({ error: "Category name already exists" });
    }

    await query("UPDATE categories SET name=? WHERE id=?", [name, id]);

    const updated = await query(
      "SELECT id, name FROM categories WHERE id=? LIMIT 1",
      [id],
    );

    return res.json({ message: "✅ Category updated", category: updated[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

/**
 * DELETE /api/admin/categories/:id
 * ملاحظة: عندك FK من items.category_id -> categories.id
 * فلازم تمنع الحذف إذا فيه items أو تعمل delete cascade (مش موجود)
 */
async function adminDeleteCategory(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid category id" });
    }

    const exists = await query("SELECT id FROM categories WHERE id=? LIMIT 1", [
      id,
    ]);
    if (!exists.length)
      return res.status(404).json({ error: "Category not found" });

    const used = await query(
      "SELECT id FROM items WHERE category_id=? LIMIT 1",
      [id],
    );
    if (used.length) {
      return res.status(409).json({
        error: "Cannot delete category: it has items. Delete/move items first.",
      });
    }

    await query("DELETE FROM categories WHERE id=?", [id]);
    return res.json({ message: "✅ Category deleted" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// ✅ NEW: list categories
async function adminListCategories(req, res) {
  try {
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
    return res.json(rows);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// ✅ NEW: get category by id
async function adminGetCategoryById(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid category id" });
    }

    const rows = await query(
      "SELECT id, name FROM categories WHERE id=? LIMIT 1",
      [id],
    );

    if (!rows.length)
      return res.status(404).json({ error: "Category not found" });
    return res.json(rows[0]);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

module.exports = {
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminListCategories,
  adminGetCategoryById,
};
