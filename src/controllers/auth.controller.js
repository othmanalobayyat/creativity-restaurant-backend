// src/controllers/auth.controller.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query } = require("../db/db");

function signToken({ userId, role, email }) {
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  // خليها آمنة: لو role مش موجود لأي سبب
  const safeRole = role || "user";

  return jwt.sign(
    { userId, role: safeRole, email: email || undefined },
    process.env.JWT_SECRET,
    { expiresIn },
  );
}

async function register(req, res) {
  try {
    const { fullName, email, phone, password } = req.body;

    const e = String(email || "")
      .trim()
      .toLowerCase();
    const p = String(password || "");
    const name = String(fullName || "").trim();

    if (!name) return res.status(400).json({ error: "fullName required" });
    if (!e.includes("@"))
      return res.status(400).json({ error: "Invalid email" });
    if (p.length < 6)
      return res.status(400).json({ error: "Password must be 6+ chars" });

    const exists = await query("SELECT id FROM users WHERE email=? LIMIT 1", [
      e,
    ]);
    if (exists.length)
      return res.status(409).json({ error: "Email already used" });

    const password_hash = await bcrypt.hash(p, 10);

    // role رح يكون default 'user' من DB
    const result = await query(
      "INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)",
      [name, e, phone || null, password_hash],
    );

    const userId = result.insertId;

    const role = "user"; // بما إنه default
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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const e = String(email || "")
      .trim()
      .toLowerCase();
    const p = String(password || "");

    if (!e || !p)
      return res.status(400).json({ error: "Email & password required" });

    // ✅ أضفنا role هنا
    const rows = await query(
      "SELECT id, full_name, email, phone, role, password_hash FROM users WHERE email=? LIMIT 1",
      [e],
    );

    if (!rows.length)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = rows[0];

    const ok = await bcrypt.compare(p, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function changePassword(req, res) {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: "Both passwords required" });

    if (newPassword.length < 6)
      return res.status(400).json({ error: "New password must be 6+ chars" });

    const rows = await query(
      "SELECT password_hash FROM users WHERE id=? LIMIT 1",
      [userId],
    );

    if (!rows.length) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid)
      return res.status(401).json({ error: "Current password incorrect" });

    const newHash = await bcrypt.hash(newPassword, 10);

    await query("UPDATE users SET password_hash=? WHERE id=?", [
      newHash,
      userId,
    ]);

    res.json({ message: "✅ Password updated successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = { register, login, changePassword };
