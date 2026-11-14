const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseId, validId } = require("../src/middleware/validation");

test("canonical decimal IDs accept boundaries without coercion", () => {
  assert.equal(parseId("1"), 1);
  assert.equal(parseId("2147483647"), 2147483647);
});

test("path identifiers reject leading zeros, signs and whitespace", () => {
  for (const value of ["01", "0001", "+1", "-1", " 1", "1 ", "0", "00", "1.0", "1e2"]) {
    assert.throws(
      () => parseId(value),
      (error) => error.status === 400 && error.message === "Invalid ID",
    );
  }
});

test("route middleware rejects noncanonical ID before next handler", () => {
  let nextCalled = false;
  assert.throws(
    () => validId({ params: { id: "001" } }, {}, () => { nextCalled = true; }),
    (error) => error.status === 400,
  );
  assert.equal(nextCalled, false);
});
