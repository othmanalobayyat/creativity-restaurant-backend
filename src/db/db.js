// src/db/db.js
const { Pool, types } = require("pg");

// Parse DECIMAL/NUMERIC (OID 1700) as JavaScript float.
// pg returns these as strings by default to preserve precision;
// we accept the float conversion since all prices use DECIMAL(10,2).
types.setTypeParser(1700, (val) => parseFloat(val));

// Parse INT8/BIGINT (OID 20) as JavaScript integer.
// COUNT(*) returns int8 in PostgreSQL — this keeps it as a number.
types.setTypeParser(20, (val) => parseInt(val, 10));

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is required — set it in Render environment variables or your local .env file",
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Required for Supabase: it uses a self-signed certificate.
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Quick connection test at startup
if (process.env.NODE_ENV !== "test") {
  pool
    .connect()
    .then((client) => {
      client
        .query("SELECT 1")
        .then(() => {
          console.log("✅ Connected to PostgreSQL (Supabase)");
          client.release();
        })
        .catch((err) => {
          console.error("❌ DB ping failed:", err.message);
          client.release();
        });
    })
    .catch((err) => {
      console.error("❌ Database connection failed:", err.message);
    });
}

/**
 * Run a parameterized query and return the rows array.
 *   SELECT             → array of row objects
 *   INSERT RETURNING   → array with inserted row(s)
 *   INSERT/UPDATE/DELETE without RETURNING → empty array []
 */
async function query(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

/**
 * Run multiple queries inside a single transaction.
 * Automatically rolls back on any error.
 *
 * Usage:
 *   const result = await withTransaction(async (tx) => {
 *     const rows = await tx.query("INSERT ... RETURNING id", [...]);
 *     await tx.query("UPDATE ...", [...]);
 *     return rows[0].id;
 *   });
 */
async function withTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const tx = {
      query: async (sql, params = []) => {
        const { rows } = await client.query(sql, params);
        return rows;
      },
    };
    const result = await work(tx);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      if (process.env.NODE_ENV !== "test") {
        console.warn("❌ Transaction rollback failed:", rollbackErr.message);
      }
    }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
