// src/controllers/address.controller.js
const { query } = require("../db/db");

async function getMyAddress(req, res) {
  try {
    const rows = await query(
      "SELECT city, street FROM addresses WHERE user_id=? AND is_default=1 LIMIT 1",
      [req.userId],
    );
    if (!rows.length) return res.json({ city: "", street: "" });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function updateMyAddress(req, res) {
  try {
    const city = String(req.body.city || "").trim();
    const street = String(req.body.street || "").trim();
    if (!city || !street)
      return res.status(400).json({ error: "city and street required" });

    const existing = await query(
      "SELECT id FROM addresses WHERE user_id=? AND is_default=1 LIMIT 1",
      [req.userId],
    );

    if (existing.length) {
      await query("UPDATE addresses SET city=?, street=? WHERE id=?", [
        city,
        street,
        existing[0].id,
      ]);
    } else {
      await query(
        "INSERT INTO addresses (user_id, city, street, is_default) VALUES (?, ?, ?, 1)",
        [req.userId, city, street],
      );
    }

    res.json({ message: "✅ Address saved", city, street });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = { getMyAddress, updateMyAddress };
