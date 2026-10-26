const { test } = require("node:test");
const assert = require("node:assert/strict");
const { validId } = require("../src/middleware/validation");

test("validId accepts positive safe integer path parameters", () => {
  let called = false;
  validId({ params: { id: "42" } }, {}, () => {
    called = true;
  });
  assert.equal(called, true);
});

test("validId rejects zero, negative, fractional, nonnumeric, and unsafe ids", () => {
  for (const id of ["0", "-1", "1.5", "abc", "", "9007199254740992"]) {
    assert.throws(
      () => validId({ params: { id } }, {}, () => {}),
      (error) => error.status === 400,
    );
  }
});

test("identifier contracts match PostgreSQL integer columns", () => {
  const { parseId, id: schema } = require("../src/middleware/validation");
  assert.equal(parseId("2147483647"), 2147483647);
  for (const value of ["2147483648", ["1"], "", "0", "1e2", "-1"])
    assert.throws(
      () => parseId(value),
      (e) => e.status === 400,
    );
  assert.equal(schema.safeParse(2147483648).success, false);
  assert.equal(schema.safeParse(2147483647).success, true);
});
