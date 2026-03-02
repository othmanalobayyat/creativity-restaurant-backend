// scripts/updateUsersTable.js
require("dotenv").config();
const mysql = require("mysql2/promise");

(async () => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is missing in .env");
    }

    const pool = mysql.createPool(process.env.DATABASE_URL);

    console.log("Connected ✅");

    // إضافة العمود (لو مش موجود)
    try {
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN role ENUM('user','admin') NOT NULL DEFAULT 'user';
      `);
      console.log("Column added ✅");
    } catch (err) {
      if (err.message.includes("Duplicate column name")) {
        console.log("Column already exists ℹ️");
      } else {
        throw err;
      }
    }

    // جعل المستخدم Admin
    const [result] = await pool.query(`
      UPDATE users SET role='admin' WHERE id=2;
    `);

    console.log("Admin updated ✅", `(affected rows: ${result.affectedRows})`);

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("Error ❌", err.message);
    process.exit(1);
  }
})();
