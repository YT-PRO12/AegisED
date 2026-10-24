const { test } = require("node:test");
const assert = require("node:assert/strict");
const { schemas } = require("../src/middleware/validation");

test("patient schema accepts inclusive age boundaries and trims names", () => {
  assert.equal(schemas.patient.parse({ name: "  Test Patient  ", age: 0, priority: "Stable" }).name, "Test Patient");
  assert.equal(schemas.patient.safeParse({ name: "Adult", age: 120, priority: "Urgent" }).success, true);
});

test("patient schema rejects invalid ages, empty names, and extra fields", () => {
  for (const age of [-1, 121, 2.5, "32"]) {
    assert.equal(schemas.patient.safeParse({ name: "Patient", age, priority: "Stable" }).success, false);
  }
  assert.equal(schemas.patient.safeParse({ name: "   ", age: 20, priority: "Stable" }).success, false);
  assert.equal(schemas.patient.safeParse({ name: "Patient", age: 20, priority: "Stable", admin: true }).success, false);
});
