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

  await query(
    `UPDATE users
     SET full_name = ?,
         phone = ?,
         email = ?
     WHERE id = ?`,
    [
      String(fullName).trim(),
      phone ? String(phone).trim() : null,
      email ? String(email).trim().toLowerCase() : null,
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

  if (!rows.length) throw httpError(404, "User not found");

  res.json(rows[0]);
});

module.exports = { getMe, updateMe };
