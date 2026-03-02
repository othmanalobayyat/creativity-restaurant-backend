// scripts/showTablesStructure.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const mysql = require("mysql2/promise");

(async () => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is missing in .env");
    }

    const pool = mysql.createPool(process.env.DATABASE_URL);

    console.log("Connected ✅\n");

    const tables = [
      "users",
      "orders",
      "order_items",
      "items",
      "categories",
      "addresses",
    ];

    for (const table of tables) {
      try {
        const [rows] = await pool.query(`SHOW CREATE TABLE ${table}`);
        console.log(`\n========== ${table.toUpperCase()} ==========\n`);
        console.log(rows[0]["Create Table"]);
      } catch (err) {
        console.log(`\n❌ Could not read table: ${table}`);
      }
    }

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("Error ❌", err.message);
    process.exit(1);
  }
})();
