// addDeliveredStatusToOrders.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const mysql = require("mysql2/promise");

(async () => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is missing in .env");
    }

    const pool = mysql.createPool(process.env.DATABASE_URL);

    console.log("Connected ✅");

    // 1️⃣ إضافة العمود
    try {
      await pool.query(`
        ALTER TABLE items  
        ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
      `);
      console.log("Column is_active added ✅");
    } catch (err) {
      if (err.message.includes("Duplicate column name")) {
        console.log("Column is_active already exists ℹ️");
      } else {
        throw err;
      }
    }

    // 2️⃣ إنشاء index
    try {
      await pool.query(`
        CREATE INDEX idx_items_active ON items(is_active);
      `);
      console.log("Index created ✅");
    } catch (err) {
      if (err.message.includes("Duplicate key name")) {
        console.log("Index already exists ℹ️");
      } else {
        throw err;
      }
    }

    await pool.end();
    console.log("Done 🎯");
    process.exit(0);
  } catch (err) {
    console.error("Error ❌", err.message);
    process.exit(1);
  }
})();
