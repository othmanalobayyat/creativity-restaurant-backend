// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

require("./src/db/db"); // connect DB

const app = express();

app.use(cors());
//app.use(express.json());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const menuRoutes = require("./src/routes/menu.routes");
const addressRoutes = require("./src/routes/address.routes");
const ordersRoutes = require("./src/routes/orders.routes");
const uploadRoutes = require("./src/routes/upload.routes");
const authRoutes = require("./src/routes/auth.routes");
const meRoutes = require("./src/routes/me.routes");
const adminRoutes = require("./src/routes/admin.routes");
const uploadCloudinaryRoutes = require("./src/routes/uploadCloudinary.routes");

app.get("/", (req, res) => res.send("Backend is running ✅"));

app.use("/api", authRoutes);
app.use("/api", meRoutes);
app.use("/api", menuRoutes);
app.use("/api", addressRoutes);
app.use("/api", ordersRoutes);
app.use("/api", uploadRoutes);
app.use("/api", adminRoutes);
app.use("/api", uploadCloudinaryRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`),
);
