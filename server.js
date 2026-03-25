require("dotenv").config();
const app = require("./src/app");
const config = require("./src/config/config");
const { pool } = require("./src/db/db");

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

function shutdown() {
  server.close(() => {
    pool.end().then(() => process.exit(0)).catch(() => process.exit(1));
  });
  setTimeout(() => process.exit(1), 10000);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
