const { test } = require("node:test");
const assert = require("node:assert/strict");
const { authenticate } = require("../src/middleware/auth");
const env = require("../src/config/env");

test("missing cookie middleware state fails closed with an authentication error", async () => {
  for (const req of [
    {},
    { cookies: undefined },
    { cookies: null },
    { cookies: {} },
  ]) {
    await assert.rejects(
      authenticate(req, {}, () => {
        throw new Error("Must not enter protected handler");
      }),
      (error) => error.status === 401 && error.message === "Please sign in",
    );
  }
});

test("malformed session tokens are rejected before any database work", async () => {
  for (const token of [
    "",
    "a".repeat(95),
    "g".repeat(96),
    ["a".repeat(96)],
    { token: "a".repeat(96) },
    42,
  ]) {
    await assert.rejects(
      authenticate({ cookies: { [env.cookieName]: token } }, {}, () => {
        throw new Error("Must not authorize malformed token");
      }),
      (error) => error.status === 401,
    );
  }
});
