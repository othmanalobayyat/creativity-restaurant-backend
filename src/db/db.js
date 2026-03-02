// src/db/db.js
const mysql = require("mysql2/promise");

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL is missing");
}

const pool = mysql.createPool(process.env.DATABASE_URL);

// اختبار اتصال سريع عند التشغيل
if (process.env.NODE_ENV !== "test") {
  (async () => {
    try {
      const conn = await pool.getConnection();
      await conn.ping();
      conn.release();
      console.log("✅ Connected to MySQL (pool)");
    } catch (err) {
      console.log("❌ Database connection failed:", err.message);
    }
  })();
}

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

module.exports = { pool, query };
