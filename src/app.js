// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const { errorHandler } = require("./middleware/errorHandler");
require("./db/db");

const app = express();

// Render (and most PaaS hosts) sit behind a reverse proxy that adds
// X-Forwarded-For. Trusting exactly one hop lets Express derive the real
// client IP correctly, which express-rate-limit requires to work.
// Using `1` (not `true`) prevents IP-spoofing via a crafted header chain.
app.set("trust proxy", 1);

app.use(helmet());

// CORS — allow requests from explicitly listed origins.
// Mobile apps (Expo) send no Origin header so they are always allowed.
// In development (non-production) all origins are allowed for convenience.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // No origin = mobile app, curl, Postman → always allow
      if (!origin) return callback(null, true);
      // Explicitly listed origin → allow
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Non-production with no allowlist configured → allow (dev convenience)
      if (process.env.NODE_ENV !== "production" && allowedOrigins.length === 0) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (req, res) => res.send("Backend is running ✅"));

app.use("/api", require("./routes"));

app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.use(errorHandler);

module.exports = app;
