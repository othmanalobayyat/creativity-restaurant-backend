// src/middleware/auth.js
const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return res.status(401).json({ error: "Missing token" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // payload جاي من signToken عندك: { userId, role, email }
    req.userId = payload.userId;
    req.user = {
      id: payload.userId,
      role: payload.role || "user",
      email: payload.email || null,
    };

    return next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = { auth };
