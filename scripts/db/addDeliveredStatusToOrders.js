// scripts/addDeliveredStatusToOrders.js
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

    await pool.query(`
      ALTER TABLE orders 
      MODIFY status ENUM(
        'PENDING',
        'PROCESSING',
        'DELIVERY',
        'DELIVERED',
        'COMPLETED',
        'REJECTED'
      ) DEFAULT 'PENDING';
    `);

    console.log("DELIVERED status added ✅");

    await pool.end();
    console.log("Done 🎯");
    process.exit(0);
  } catch (err) {
    console.error("Error ❌", err.message);
    process.exit(1);
  }
})();
