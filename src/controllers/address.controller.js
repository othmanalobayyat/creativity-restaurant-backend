// src/controllers/address.controller.js
const { query } = require("../db/db");
const asyncHandler = require("../utils/asyncHandler");
const { httpError } = require("../utils/httpError");

const getMyAddress = asyncHandler(async (req, res) => {
  const rows = await query(
    "SELECT city, street FROM addresses WHERE user_id=$1 AND is_default=TRUE LIMIT 1",
    [req.userId],
  );
  if (!rows.length) return res.json({ city: "", street: "" });
  res.json(rows[0]);
});

const updateMyAddress = asyncHandler(async (req, res) => {
  const city = String(req.body.city || "").trim();
  const street = String(req.body.street || "").trim();

  if (!city || !street) throw httpError(400, "city and street required");

  const existing = await query(
    "SELECT id FROM addresses WHERE user_id=$1 AND is_default=TRUE LIMIT 1",
    [req.userId],
  );

  if (existing.length) {
    await query(
      "UPDATE addresses SET city=$1, street=$2 WHERE id=$3",
      [city, street, existing[0].id],
    );
  } else {
    await query(
      "INSERT INTO addresses (user_id, city, street, is_default) VALUES ($1, $2, $3, TRUE)",
      [req.userId, city, street],
    );
  }

  res.json({ message: "✅ Address saved", city, street });
});

module.exports = { getMyAddress, updateMyAddress };
