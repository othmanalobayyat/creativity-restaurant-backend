// Centralized environment configuration and validation

const requiredVars = [];

// Core / app
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Database
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  requiredVars.push("DATABASE_URL");
}

// Auth / JWT
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  requiredVars.push("JWT_SECRET");
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Feature flags
const ENABLE_DEV_ROUTES = process.env.ENABLE_DEV_ROUTES === "true";

// Cloudinary (optional but recommended)
const CLOUD_NAME = process.env.CLOUD_NAME;
const CLOUD_API_KEY = process.env.CLOUD_API_KEY;
const CLOUD_API_SECRET = process.env.CLOUD_API_SECRET;

if (!CLOUD_NAME || !CLOUD_API_KEY || !CLOUD_API_SECRET) {
  console.warn(
    "⚠️ Cloudinary environment variables are missing or incomplete. " +
      "Uploads depending on Cloudinary may fail until they are configured.",
  );
}

if (requiredVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${requiredVars.join(", ")}`,
  );
}

const config = {
  port: PORT,
  nodeEnv: NODE_ENV,
  databaseUrl: DATABASE_URL,
  jwt: {
    secret: JWT_SECRET,
    expiresIn: JWT_EXPIRES_IN,
  },
  features: {
    enableDevRoutes: ENABLE_DEV_ROUTES,
  },
  cloudinary: {
    cloudName: CLOUD_NAME,
    apiKey: CLOUD_API_KEY,
    apiSecret: CLOUD_API_SECRET,
  },
};

module.exports = config;

