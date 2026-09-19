require("dotenv").config({ quiet: true });
const production = process.env.NODE_ENV === "production";
const origin = process.env.APP_ORIGIN || "http://localhost:5173";
if (
  production &&
  (!process.env.DATABASE_URL ||
    !process.env.APP_ORIGIN ||
    !origin.startsWith("https://") ||
    !process.env.ML_SERVICE_TOKEN)
) {
  throw new Error(
    "Production requires DATABASE_URL, HTTPS APP_ORIGIN and ML_SERVICE_TOKEN",
  );
}
module.exports = {
  production,
  origin,
  port: Number(process.env.PORT || 5000),
  mlUrl: process.env.ML_SERVICE_URL || "http://127.0.0.1:8000",
  mlToken: process.env.ML_SERVICE_TOKEN || "",
  cookieName: production ? "__Host-careflow" : "careflow_session",
};
