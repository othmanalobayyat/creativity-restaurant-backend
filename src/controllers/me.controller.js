// src/controllers/me.controller.js
const { query } = require("../db/db");
const asyncHandler = require("../utils/asyncHandler");
const { httpError } = require("../utils/httpError");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getMe = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT id,
            full_name AS "fullName",
            phone,
            email
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [req.userId],
  );

  if (!rows.length) throw httpError(404, "User not found");

  res.json(rows[0]);
});

const updateMe = asyncHandler(async (req, res) => {
  const { fullName, phone, email } = req.body;

  if (!fullName || !String(fullName).trim()) {
    throw httpError(400, "fullName is required");
  }

  const emailVal = email != null ? String(email).trim().toLowerCase() : null;
  if (emailVal && !EMAIL_REGEX.test(emailVal)) {
    throw httpError(400, "Invalid email format");
  }
  if (emailVal) {
    const existing = await query(
      "SELECT id FROM users WHERE email = $1 AND id != $2 LIMIT 1",
      [emailVal, req.userId],
    );
    if (existing.length) throw httpError(409, "Email already in use");
  }

  // Build dynamic SET clause with auto-numbered parameters
  const params = [];
  const p = (val) => { params.push(val); return `$${params.length}`; };

  let sql = `UPDATE users SET full_name = ${p(String(fullName).trim())}, phone = ${p(phone ? String(phone).trim() : null)}`;
  if (emailVal != null) sql += `, email = ${p(emailVal)}`;
  sql += ` WHERE id = ${p(req.userId)}`;

  await query(sql, params);

  const rows = await query(
    `SELECT id,
            full_name AS "fullName",
            phone,
            email
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [req.userId],
  );
  if (!rows.length) throw httpError(404, "User not found");

  res.json(rows[0]);
});

module.exports = { getMe, updateMe };
