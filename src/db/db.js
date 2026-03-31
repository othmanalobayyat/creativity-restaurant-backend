// src/db/db.js
const mysql = require("mysql2/promise");

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL is missing");
}

// Do NOT pass `uri` alongside `ssl` — mysql2's URL parser does not
// recognise the `ssl-mode=REQUIRED` query parameter (it is a MySQL
// CLI flag, not a mysql2 option). When both `uri` and `ssl` are
// given, the parsed URI fields can overwrite the ssl object, leaving
// the connection without TLS. Aiven then closes it immediately.
//
// Fix: parse DATABASE_URL with Node's URL class and pass every field
// explicitly so the ssl config is never shadowed or ignored.
const {
  hostname: host,
  port: rawPort,
  username,
  password,
  pathname,
} = new URL(process.env.DATABASE_URL);

const pool = mysql.createPool({
  host,
  port:     parseInt(rawPort, 10) || 3306,
  user:     decodeURIComponent(username),
  password: decodeURIComponent(password),
  database: pathname.replace(/^\//, ""),
  ssl: {
    // Aiven uses a custom CA not in Node's built-in bundle.
    // The connection is still fully encrypted; we only skip
    // certificate chain validation.
    rejectUnauthorized: false,
  },
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
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
