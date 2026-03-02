// scripts/fixAutoIncrementWithFK.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const mysql = require("mysql2/promise");

(async () => {
  let conn;

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is missing in .env");
    }

    conn = await mysql.createConnection(process.env.DATABASE_URL);
    console.log("Connected ✅");

    await conn.beginTransaction();

    // 1) جيب اسم الـ FK الحقيقي من قاعدة البيانات (بدون ما نفترض)
    const [fkRows] = await conn.query(`
      SELECT CONSTRAINT_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'items'
        AND COLUMN_NAME = 'category_id'
        AND REFERENCED_TABLE_NAME = 'categories'
        AND REFERENCED_COLUMN_NAME = 'id'
      LIMIT 1;
    `);

    if (!fkRows.length) {
      throw new Error(
        "Foreign key (items.category_id -> categories.id) not found",
      );
    }

    const fkName = fkRows[0].CONSTRAINT_NAME;
    console.log("Found FK:", fkName);

    // 2) فك الـ FK مؤقتًا
    console.log("Dropping FK...");
    await conn.query(`ALTER TABLE items DROP FOREIGN KEY \`${fkName}\`;`);
    console.log("FK dropped ✅");

    // 3) أولاً categories.id
    console.log("Updating categories.id ...");
    await conn.query(`
      ALTER TABLE categories
      MODIFY id INT NOT NULL AUTO_INCREMENT;
    `);
    console.log("categories updated ✅");

    // 4) ثم items.id
    console.log("Updating items.id ...");
    await conn.query(`
      ALTER TABLE items
      MODIFY id INT NOT NULL AUTO_INCREMENT;
    `);
    console.log("items updated ✅");

    // 5) رجّع الـ FK (بنفس الاسم القديم)
    console.log("Re-adding FK...");
    await conn.query(`
      ALTER TABLE items
      ADD CONSTRAINT \`${fkName}\`
      FOREIGN KEY (category_id) REFERENCES categories(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
    `);
    console.log("FK re-added ✅");

    await conn.commit();
    console.log("All changes committed 🎯");
  } catch (err) {
    if (conn) {
      await conn.rollback();
      console.log("Rolled back ❌");
    }
    console.error("Error ❌", err.message || err);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
})();
