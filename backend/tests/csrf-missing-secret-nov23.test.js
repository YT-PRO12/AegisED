const { test } = require("node:test");
const assert = require("node:assert/strict");
const pool = require("../src/config/db");
const env = require("../src/config/env");
const { authenticate } = require("../src/middleware/auth");

test("missing or corrupted CSRF secrets can never authorize a write", async (t) => {
  let stored = "b".repeat(64);
  t.mock.method(pool, "query", async () => ({
    rowCount: 1,
    rows: [{ id: 1, role: "NURSE", csrf_token: stored }],
  }));
  const req = {
    method: "POST",
    cookies: { [env.cookieName]: "a".repeat(96) },
    get: () => undefined,
  };

  for (const invalid of [undefined, null, "", "bad", "A".repeat(64), 42]) {
    stored = invalid;
    await assert.rejects(
      authenticate(req, {}, () => {
        throw new Error("Invalid CSRF must not reach protected handlers");
      }),
      (error) => error.status === 403,
    );
  }

  stored = "b".repeat(64);
  for (const header of [undefined, null, "", "a".repeat(64), ["b".repeat(64)]]) {
    req.get = () => header;
    await assert.rejects(
      authenticate(req, {}, () => {
        throw new Error("Invalid header must not authorize write");
      }),
      (error) => error.status === 403,
    );
  }

  req.get = () => stored;
  let called = false;
  await authenticate(req, {}, () => {
    called = true;
  });
  assert.equal(called, true);
});

test("read-only access does not require CSRF header", async (t) => {
  t.mock.method(pool, "query", async () => ({
    rowCount: 1,
    rows: [{ id: 1, role: "NURSE", csrf_token: "b".repeat(64) }],
  }));
  let authorized = false;
  await authenticate(
    { method: "GET", cookies: { [env.cookieName]: "a".repeat(96) } },
    {},
    () => { authorized = true; },
  );
  assert.equal(authorized, true);
});
