const { test } = require("node:test");
const assert = require("node:assert/strict");
const { listParams, parseId } = require("../src/middleware/validation");
const { authenticate } = require("../src/middleware/auth");
const env = require("../src/config/env");
const pool = require("../src/config/db");
test("line terminators cannot bypass cookie, ID, or pagination validation", async (t) => {
  const query = t.mock.method(pool, "query", async () => {
    throw new Error("must not query");
  });
  for (const end of ["\n", "\r", "\r\n", "\u2028", "\u2029"]) {
    assert.throws(
      () => parseId("1" + end),
      (e) => e.status === 400,
    );
    assert.throws(() => listParams({ query: { page: "1" + end } }));
    assert.throws(() => listParams({ query: { limit: "20" + end } }));
    await assert.rejects(
      authenticate(
        { cookies: { [env.cookieName]: "a".repeat(96) + end } },
        {},
        () => {},
      ),
      (e) => e.status === 401,
    );
  }
  assert.equal(query.mock.callCount(), 0);
});
