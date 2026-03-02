// scripts/updateAutoIncrementIds.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const mysql = require("mysql2/promise");

(async () => {
  let connection;

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is missing in .env");
    }

    connection = await mysql.createConnection(process.env.DATABASE_URL);

    console.log("Connected ✅");

    // نستخدم transaction عشان الأمان
    await connection.beginTransaction();

    // 1️⃣ أولاً تعديل categories
    console.log("Updating categories.id ...");
    await connection.query(`
      ALTER TABLE categories
      MODIFY id INT NOT NULL AUTO_INCREMENT;
    `);
    console.log("categories updated ✅");

    // 2️⃣ ثم تعديل items
    console.log("Updating items.id ...");
    await connection.query(`
      ALTER TABLE items
      MODIFY id INT NOT NULL AUTO_INCREMENT;
    `);
    console.log("items updated ✅");

    await connection.commit();
    console.log("All changes committed 🎯");
  } catch (err) {
    if (connection) {
      await connection.rollback();
      console.log("Rolled back ❌");
    }
    console.error("Error ❌", err.message);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit(0);
  }
})();
