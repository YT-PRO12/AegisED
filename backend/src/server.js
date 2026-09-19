const env = require("./config/env");
const app = require("./app");
const pool = require("./config/db");
const server = app.listen(env.port, "0.0.0.0", () =>
  console.log(JSON.stringify({ event: "listening", port: env.port })),
);
function shutdown() {
  server.close(() => pool.end().then(() => process.exit(0)));
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
