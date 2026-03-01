// src/controllers/menu.controller.js
const { query } = require("../db/db");

async function getCategories(req, res) {
  try {
    const rows = await query("SELECT id, name FROM categories ORDER BY id");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function getItems(req, res) {
  try {
    const search = String(req.query.search || "")
      .trim()
      .toLowerCase();
    const categoryId = String(req.query.categoryId || "0");

    let sql =
      "SELECT id, name, price, quantity, image_url AS image, description, category_id FROM items WHERE is_active = 1";
    const params = [];

    if (categoryId !== "0") {
      sql += " AND category_id = ?";
      params.push(Number(categoryId));
    }
    if (search) {
      sql += " AND LOWER(name) LIKE ?";
      params.push(`%${search}%`);
    }

    sql += " ORDER BY id";
    const rows = await query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function getItemById(req, res) {
  try {
    const id = Number(req.params.id);
    const rows = await query(
      "SELECT id, name, price, quantity, image_url AS image, description, category_id FROM items WHERE id = ? AND is_active = 1",
      [id],
    );
    if (!rows.length) return res.status(404).json({ error: "Item not found" });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = { getCategories, getItems, getItemById };
