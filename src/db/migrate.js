// src/db/migrate.js
// Initializes the database by executing schema.sql.
// All statements use IF NOT EXISTS so it is safe to re-run.
//
// Usage:
//   node src/db/migrate.js

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { pool } = require("./db");

async function migrate() {
  const schemaPath = path.join(__dirname, "schema.sql");

  if (!fs.existsSync(schemaPath)) {
    console.error("❌ schema.sql not found at:", schemaPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, "utf8");

  try {
    await pool.query(sql);
    console.log("✅ Database schema initialized (all tables + indexes ready)");
    process.exit(0);
  } catch (e) {
    console.error("❌ Migration failed:", e.message);
    process.exit(1);
  }
}

migrate();
