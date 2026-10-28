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

test("malformed records perform the same password derivation as valid records", async () => {
  const fs = require("node:fs");
  const vm = require("node:vm");
  const calls = [];
  const crypto = require("node:crypto");
  const sandbox = {
    Buffer,
    module: { exports: {} },
    require(name) {
      if (name !== "node:crypto") return require(name);
      return {
        ...crypto,
        scrypt(value, salt, length, options, callback) {
          calls.push({ value, salt, length, options });
          callback(null, Buffer.alloc(length));
        },
      };
    },
  };
  vm.runInNewContext(fs.readFileSync(require.resolve("../src/services/password"), "utf8"), sandbox);
  const verify = sandbox.module.exports.verify;
  assert.equal(await verify("secret", "a".repeat(32) + ":" + "0".repeat(128)), true);
  assert.equal(await verify("secret", "broken"), false);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].length, calls[1].length);
  assert.equal(calls[0].value, calls[1].value);
  assert.equal(calls[1].salt.length, 32);
  assert.equal(JSON.stringify(calls[0].options), JSON.stringify(calls[1].options));
});
