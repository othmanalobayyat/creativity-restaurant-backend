// src/middleware/adminOnly.js
function adminOnly(req, res, next) {
  const role = req.user?.role || "user";
  if (role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}

module.exports = { adminOnly };
