const { test } = require("node:test");
const assert = require("node:assert/strict");
const pool = require("../src/config/db");
const env = require("../src/config/env");
const { authenticate } = require("../src/middleware/auth");
test("malformed session cookies fail before hashing or querying", async (t) => {
  const query = t.mock.method(pool, "query", async () => {
    throw new Error("unexpected query");
  });
  for (const token of [
    undefined,
    null,
    {},
    [],
    ["x"],
    123,
    "",
    "a".repeat(95),
    "A".repeat(96),
  ])
    await assert.rejects(
      authenticate({ cookies: { [env.cookieName]: token } }, {}, () => {}),
      (e) => e.status === 401,
    );
  assert.equal(query.mock.callCount(), 0);
});
test("canonical tokens still enforce expiry and CSRF checks", async (t) => {
  const query = t.mock.method(pool, "query", async () => ({
    rowCount: 0,
    rows: [],
  }));
  const req = {
    cookies: { [env.cookieName]: "a".repeat(96) },
    method: "POST",
    get: () => "wrong",
  };
  await assert.rejects(
    authenticate(req, {}, () => {}),
    (e) => e.status === 401,
  );
  query.mock.mockImplementation(async () => ({
    rowCount: 1,
    rows: [{ id: 1, csrf_token: "right" }],
  }));
  await assert.rejects(
    authenticate(req, {}, () => {}),
    (e) => e.status === 403,
  );
  let called = false;
  req.get = () => "right";
  await authenticate(req, {}, () => {
    called = true;
  });
  assert.equal(called, true);
});
