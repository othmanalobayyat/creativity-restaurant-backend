// fixAutoIncrementWithAllFKs.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const mysql = require("mysql2/promise");

async function getReferencingFKs(conn, referencedTable, referencedColumn) {
  // يجمع معلومات القيود + قواعد UPDATE/DELETE
  const [rows] = await conn.query(
    `
    SELECT 
      kcu.CONSTRAINT_NAME,
      kcu.TABLE_NAME,
      kcu.COLUMN_NAME,
      kcu.REFERENCED_TABLE_NAME,
      kcu.REFERENCED_COLUMN_NAME,
      kcu.ORDINAL_POSITION,
      rc.UPDATE_RULE,
      rc.DELETE_RULE
    FROM information_schema.KEY_COLUMN_USAGE kcu
    JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
      ON rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
     AND rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
    WHERE kcu.TABLE_SCHEMA = DATABASE()
      AND kcu.REFERENCED_TABLE_NAME = ?
      AND kcu.REFERENCED_COLUMN_NAME = ?
    ORDER BY kcu.CONSTRAINT_NAME, kcu.ORDINAL_POSITION;
  `,
    [referencedTable, referencedColumn],
  );

  // Group by constraint
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.CONSTRAINT_NAME)) {
      map.set(r.CONSTRAINT_NAME, {
        constraintName: r.CONSTRAINT_NAME,
        tableName: r.TABLE_NAME,
        columns: [],
        refTable: r.REFERENCED_TABLE_NAME,
        refColumns: [],
        updateRule: r.UPDATE_RULE,
        deleteRule: r.DELETE_RULE,
      });
    }
    const obj = map.get(r.CONSTRAINT_NAME);
    obj.columns.push(r.COLUMN_NAME);
    obj.refColumns.push(r.REFERENCED_COLUMN_NAME);
  }

  return Array.from(map.values());
}

function ruleToSql(rule, fallback) {
  // MySQL عادة: RESTRICT | CASCADE | SET NULL | NO ACTION
  const r = (rule || fallback || "RESTRICT").toUpperCase();
  return r === "NO ACTION" ? "RESTRICT" : r;
}

(async () => {
  let conn;
  const dropped = []; // نخزن القيود عشان نرجعها

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is missing in .env");
    }

    conn = await mysql.createConnection(process.env.DATABASE_URL);
    console.log("Connected ✅");

    await conn.beginTransaction();

    // 1) كل الـ FKs اللي تشير إلى categories(id)
    const catsFKs = await getReferencingFKs(conn, "categories", "id");

    // 2) كل الـ FKs اللي تشير إلى items(id) (مثل order_items)
    const itemsFKs = await getReferencingFKs(conn, "items", "id");

    // Drop FKs referencing categories
    for (const fk of catsFKs) {
      console.log(`Dropping FK ${fk.constraintName} on ${fk.tableName}...`);
      await conn.query(
        `ALTER TABLE \`${fk.tableName}\` DROP FOREIGN KEY \`${fk.constraintName}\`;`,
      );
      dropped.push(fk);
      console.log("  dropped ✅");
    }

    // Drop FKs referencing items
    for (const fk of itemsFKs) {
      console.log(`Dropping FK ${fk.constraintName} on ${fk.tableName}...`);
      await conn.query(
        `ALTER TABLE \`${fk.tableName}\` DROP FOREIGN KEY \`${fk.constraintName}\`;`,
      );
      dropped.push(fk);
      console.log("  dropped ✅");
    }

    // 3) تعديل categories أولاً
    console.log("Updating categories.id ...");
    await conn.query(`
      ALTER TABLE categories
      MODIFY id INT NOT NULL AUTO_INCREMENT;
    `);
    console.log("categories updated ✅");

    // 4) ثم items
    console.log("Updating items.id ...");
    await conn.query(`
      ALTER TABLE items
      MODIFY id INT NOT NULL AUTO_INCREMENT;
    `);
    console.log("items updated ✅");

    // 5) رجّع القيود (نرجع بالعكس)
    for (const fk of dropped.reverse()) {
      const cols = fk.columns.map((c) => `\`${c}\``).join(", ");
      const refCols = fk.refColumns.map((c) => `\`${c}\``).join(", ");

      const onUpdate = ruleToSql(fk.updateRule, "CASCADE");
      const onDelete = ruleToSql(fk.deleteRule, "RESTRICT");

      console.log(`Re-adding FK ${fk.constraintName} on ${fk.tableName}...`);
      await conn.query(`
        ALTER TABLE \`${fk.tableName}\`
        ADD CONSTRAINT \`${fk.constraintName}\`
        FOREIGN KEY (${cols}) REFERENCES \`${fk.refTable}\`(${refCols})
        ON UPDATE ${onUpdate}
        ON DELETE ${onDelete};
      `);
      console.log("  re-added ✅");
    }

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
