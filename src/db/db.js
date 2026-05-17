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
  // Supabase uses a self-signed cert on the pooler endpoint.
  ssl: { rejectUnauthorized: false },
  // 5 is safe for Supabase free-tier Session Pooler (PgBouncer).
  // Higher values don't help — PgBouncer itself limits concurrency.
  max: 5,
  // Keep well below PgBouncer's server_idle_timeout so the pool never
  // hands out a connection that PgBouncer has already closed server-side.
  idleTimeoutMillis: 10000,
  // Generous timeout for Render cold-starts (TLS + pooler handshake).
  connectionTimeoutMillis: 10000,
  // TCP keepalive detects silently dropped connections before a query
  // attempts to use them, preventing ECONNRESET mid-request.
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Without this handler, a connection dying while idle in the pool emits
// an uncaught 'error' event that crashes the Node process on Render.
pool.on("error", (err) => {
  console.error("❌ Idle DB client error:", err.message);
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
