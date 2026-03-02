const express = require("express");
const cors = require("cors");
const path = require("path");

require("./db/db");

const app = express();

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (req, res) => res.send("Backend is running ✅"));

app.use("/api", require("./routes"));

module.exports = app;
