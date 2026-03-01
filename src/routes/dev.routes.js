// src/routes/dev.routes.js
const router = require("express").Router();
const { query } = require("../db/db");

// ✅ حط بياناتك هنا (انسخ mockData كامل)
const mockData = require("../data/mockData");
// ⚠️ إذا هذا المسار مش موجود عندك في BE، اقرأ ملاحظة تحت

router.get("/seed-items", async (req, res) => {
  try {
    let count = 0;

    for (const it of mockData) {
      await query(
        `INSERT IGNORE INTO items
         (id, name, price, quantity, image_url, description, category_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(it.id),
          String(it.name),
          Number(it.price),
          Number(it.quantity || 0),
          String(it.image),
          String(it.description || ""),
          Number(it.category_id),
        ],
      );
      count++;
    }

    res.json({ message: "✅ Items seeded", count });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
