// src/controllers/me.controller.js
const { query } = require("../db/db");
const asyncHandler = require("../utils/asyncHandler");
const { httpError } = require("../utils/httpError");

const getMe = asyncHandler(async (req, res) => {
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
    throw httpError(404, "User not found");
  }

  res.json(rows[0]);
});

const updateMe = asyncHandler(async (req, res) => {
  const { fullName, phone, email } = req.body;

  if (!fullName || !String(fullName).trim()) {
    throw httpError(400, "fullName is required");
  }

  const emailVal = email != null ? String(email).trim().toLowerCase() : null;
  if (emailVal && !emailVal.includes("@")) {
    throw httpError(400, "Invalid email format");
  }
  if (emailVal) {
    const existing = await query(
      `SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1`,
      [emailVal, req.userId],
    );
    if (existing.length) {
      throw httpError(409, "Email already in use");
    }
  }

  const emailSet = emailVal != null ? ", email = ?" : "";
  const params = [
    String(fullName).trim(),
    phone ? String(phone).trim() : null,
    ...(emailVal != null ? [emailVal] : []),
    req.userId,
  ];

  await query(
    `UPDATE users SET full_name = ?, phone = ?${emailSet} WHERE id = ?`,
    params,
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

  if (!rows.length) throw httpError(404, "User not found");

  res.json(rows[0]);
});

module.exports = { getMe, updateMe };
