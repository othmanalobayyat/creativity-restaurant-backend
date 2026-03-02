// src/middleware/requireUser.js
function requireUser(req, res, next) {
  const userId = Number(req.header("x-user-id") || 0);
  if (!userId) return res.status(401).json({ error: "Missing x-user-id" });
  req.userId = userId;
  next();
}

module.exports = { requireUser };
