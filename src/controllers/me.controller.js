// src/controllers/me.controller.js
const { query } = require("../db/db");

async function getMe(req, res) {
  try {
    const rows = await query(
      `SELECT id,
              full_name AS fullName,
              phone,
              email
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.userId],
    );

    if (!rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function updateMe(req, res) {
  try {
    const { fullName, phone, email } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: "fullName is required" });
    }

    await query(
      `UPDATE users
       SET full_name = ?,
           phone = ?,
           email = ?
       WHERE id = ?`,
      [
        fullName.trim(),
        phone ? phone.trim() : null,
        email ? email.trim().toLowerCase() : null,
        req.userId,
      ],
    );

    const rows = await query(
      `SELECT id,
              full_name AS fullName,
              phone,
              email
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.userId],
    );

    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = { getMe, updateMe };
