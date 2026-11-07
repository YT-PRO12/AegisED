const { test } = require("node:test");
const assert = require("node:assert/strict");
const { schemas, parseId } = require("../src/middleware/validation");

test("patient name trimming preserves valid values", () => {
  const parsed = schemas.patient.parse({
    name: "  Synthetic Patient  ", age: 0, priority: "Stable",
  });
  assert.equal(parsed.name, "Synthetic Patient");
});

test("numeric route identifiers reject malformed or overflowing values", () => {
  for (const bad of ["0", "-1", "1.0", "1e2", " 1", "1 ", "2147483648", "x", ""]) {
    assert.throws(() => parseId(bad), /Invalid ID/);
  }
  assert.equal(parseId("2147483647"), 2147483647);
});

test("patient schema rejects unexpected role privileges", () => {
  assert.equal(schemas.patient.safeParse({
    name: "Synthetic Patient", age: 40, priority: "Urgent", role: "ADMIN",
  }).success, false);
});
