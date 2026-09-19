if (process.env.TEST_PGLITE_PATH) {
  if (process.env.NODE_ENV !== "test")
    throw new Error("PGlite adapter is test-only");
  module.exports = require("../../tests/pglite-pool");
} else {
  require("./env");
  const { Pool } = require("pg");
  const fs = require("node:fs");
  const pool = new Pool({
    ...(process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL }
      : {
          user: process.env.DB_USER,
          host: process.env.DB_HOST || "localhost",
          database: process.env.DB_NAME,
          password: process.env.DB_PASSWORD,
          port: Number(process.env.DB_PORT || 5432),
        }),
    max: 10,
    options: "-c timezone=UTC -c statement_timeout=15000",
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    ...(process.env.DB_SSL === "true"
      ? {
          ssl: {
            rejectUnauthorized: true,
            ...(process.env.DB_SSL_CA
              ? { ca: fs.readFileSync(process.env.DB_SSL_CA, "utf8") }
              : {}),
          },
        }
      : {}),
  });
  pool.on("error", (e) =>
    console.error(
      JSON.stringify({ level: "error", event: "database_pool", code: e.code }),
    ),
  );
  module.exports = pool;
}
