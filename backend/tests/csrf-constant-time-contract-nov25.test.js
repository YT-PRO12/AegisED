const { test } = require("node:test");
const assert = require("node:assert/strict");
const { csrfMatches } = require("../src/middleware/auth");

test("CSRF comparison accepts only identical canonical 32-byte hex tokens", () => {
  const valid = "ab".repeat(32);
  assert.equal(csrfMatches(valid, valid), true);
  assert.equal(csrfMatches("cd".repeat(32), valid), false);
});

test("malformed and non-string CSRF values fail before byte comparison", () => {
  const valid = "ab".repeat(32);
  for (const value of [undefined, null, "", "ab", "AB".repeat(32), "ag".repeat(32), 42, []]) {
    assert.equal(csrfMatches(value, valid), false);
    assert.equal(csrfMatches(valid, value), false);
  }
});

test("different positions and same-length secrets are compared correctly", () => {
  const stored = "00".repeat(31) + "01";
  const sameLengthDifferent = "01" + "00".repeat(31);
  assert.equal(csrfMatches(stored, sameLengthDifferent), false);
  assert.equal(csrfMatches(stored, stored), true);
});
