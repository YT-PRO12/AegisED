const { test } = require("node:test");
const assert = require("node:assert/strict");
const { PGlite } = require("@electric-sql/pglite");
const pool = require("../src/config/db");
const env = require("../src/config/env");
const app = require("../src/app");

test("audit search returns matching literal actions and an accurate total", async (t) => {
  const db = new PGlite();
  let server;
  try {
    await db.exec(
      "CREATE TABLE users (id INT, name TEXT, role TEXT); CREATE TABLE audit_logs (id SERIAL PRIMARY KEY, user_id INT, action TEXT)",
    );
    for (const action of [
      "bed_assigned",
      "bedXassigned",
      "100%",
      "100X",
      "a\\b",
      "ab",
    ])
      await db.query("INSERT INTO audit_logs (action) VALUES ($1)", [action]);
    t.mock.method(pool, "query", async (sql, args) =>
      sql.includes("FROM sessions")
        ? { rowCount: 1, rows: [{ id: 1, role: "ADMIN" }] }
        : db.query(sql, args),
    );
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    for (const [action, expected] of [
      ["_", "bed_assigned"],
      ["%", "100%"],
      ["\\", "a\\b"],
    ]) {
      const response = await fetch(
        `http://127.0.0.1:${server.address().port}/api/audit?action=${encodeURIComponent(action)}`,
        {
          headers: { cookie: `${env.cookieName}=${"a".repeat(96)}` },
        },
      );
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.pagination.total, 1);
      assert.deepEqual(
        body.data.map((row) => row.action),
        [expected],
      );
    }
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await db.close();
  }
});
