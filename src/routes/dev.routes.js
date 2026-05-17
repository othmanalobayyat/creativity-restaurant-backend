// src/routes/dev.routes.js
// ⚠️ Only mounted when ENABLE_DEV_ROUTES=true (development only).
// Never enable in production.

const router = require("express").Router();
const { query } = require("../db/db");
const mockData = require("../data/mockData");

router.get("/seed-items", async (req, res) => {
  try {
    let count = 0;

    for (const it of mockData) {
      // ON CONFLICT (id) DO NOTHING = PostgreSQL equivalent of MySQL's INSERT IGNORE
      await query(
        `INSERT INTO items (id, name, price, quantity, image_url, description, category_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
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

    // Reset the sequence so future auto-increment inserts don't conflict
    // with the explicitly-seeded IDs above.
    await query(
      "SELECT setval('items_id_seq', (SELECT COALESCE(MAX(id), 0) FROM items))",
    );

    res.json({ message: "✅ Items seeded", count });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
