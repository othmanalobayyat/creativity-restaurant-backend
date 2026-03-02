// src/controllers/auth.controller.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query } = require("../db/db");
const asyncHandler = require("../utils/asyncHandler");
const { httpError } = require("../utils/httpError");

function signToken({ userId, role, email }) {
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  const safeRole = role || "user";

  return jwt.sign(
    { userId, role: safeRole, email: email || undefined },
    process.env.JWT_SECRET,
    { expiresIn },
  );
}

const register = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  const e = String(email || "")
    .trim()
    .toLowerCase();
  const p = String(password || "");
  const name = String(fullName || "").trim();

  if (!name) throw httpError(400, "fullName required");
  if (!e.includes("@")) throw httpError(400, "Invalid email");
  if (p.length < 6) throw httpError(400, "Password must be 6+ chars");

  const exists = await query("SELECT id FROM users WHERE email=? LIMIT 1", [e]);
  if (exists.length) throw httpError(409, "Email already used");

  const password_hash = await bcrypt.hash(p, 10);

  const result = await query(
    "INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)",
    [name, e, phone || null, password_hash],
  );

  const userId = result.insertId;
  const role = "user";
  const token = signToken({ userId, role, email: e });

  res.json({
    message: "✅ Registered",
    token,
    user: {
      id: userId,
      fullName: name,
      email: e,
      phone: phone || null,
      role,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const e = String(email || "")
    .trim()
    .toLowerCase();
  const p = String(password || "");

  if (!e || !p) throw httpError(400, "Email & password required");

  const rows = await query(
    "SELECT id, full_name, email, phone, role, password_hash FROM users WHERE email=? LIMIT 1",
    [e],
  );

  if (!rows.length) throw httpError(401, "Invalid credentials");

  const user = rows[0];

  const ok = await bcrypt.compare(p, user.password_hash);
  if (!ok) throw httpError(401, "Invalid credentials");

  const token = signToken({
    userId: user.id,
    role: user.role || "user",
    email: user.email,
  });

  res.json({
    message: "✅ Logged in",
    token,
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role || "user",
    },
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword)
    throw httpError(400, "Both passwords required");

  if (String(newPassword).length < 6)
    throw httpError(400, "New password must be 6+ chars");

  const rows = await query(
    "SELECT password_hash FROM users WHERE id=? LIMIT 1",
    [userId],
  );

  if (!rows.length) throw httpError(404, "User not found");

  const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!valid) throw httpError(401, "Current password incorrect");

  const newHash = await bcrypt.hash(String(newPassword), 10);

  await query("UPDATE users SET password_hash=? WHERE id=?", [newHash, userId]);

  res.json({ message: "✅ Password updated successfully" });
});

module.exports = { register, login, changePassword };
