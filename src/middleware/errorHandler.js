function errorHandler(err, req, res, next) {
  // ✅ مهم لك أنت: تشوف الخطأ الحقيقي بالـ logs
  console.error("❌ ERROR:", err);

  const status = err.status || 500;

  // ✅ مهم للـ FE: نفس الفورمات { error: ... }
  res.status(status).json({
    error: err.message || "Server error",
  });
}

module.exports = { errorHandler };
