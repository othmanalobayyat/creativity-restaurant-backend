// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const { errorHandler } = require("./middleware/errorHandler");
require("./db/db");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (req, res) => res.send("Backend is running ✅"));

app.use("/api", require("./routes"));

app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.use(errorHandler);

module.exports = app;
