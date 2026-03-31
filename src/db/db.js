// src/db/db.js
const mysql = require("mysql2/promise");

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL is missing");
}

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

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

async function withTransaction(work) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const tx = {
      query: async (sql, params = []) => {
        const [rows] = await conn.execute(sql, params);
        return rows;
      },
    };
    const result = await work(tx);
    await conn.commit();
    return result;
  } catch (err) {
    try {
      await conn.rollback();
    } catch (rollbackErr) {
      if (process.env.NODE_ENV !== "test") {
        console.warn("❌ Transaction rollback failed:", rollbackErr.message);
      }
    }
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { pool, query, withTransaction };
