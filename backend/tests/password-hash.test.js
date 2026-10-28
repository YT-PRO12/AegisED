const { test } = require("node:test");
const assert = require("node:assert/strict");
const password = require("../src/services/password");
test("password verification fails closed for malformed stored hashes", async () => {
  const value = "Synthetic password 123";
  const stored = await password.hash(value);
  assert.equal(await password.verify(value, stored), true);
  assert.equal(await password.verify("wrong", stored), false);
  for (const bad of [
    undefined,
    null,
    {},
    123,
    "",
    "salt:hash",
    stored + ":extra",
    stored + "\n",
    stored + "\r",
    stored + "\u2028",
    stored.slice(0, -1) + "z",
  ])
    assert.equal(await password.verify(value, bad), false);
  assert.equal(await password.verify(Buffer.from(value), stored), false);
});
