const { test } = require("node:test");
const assert = require("node:assert/strict");
const { schemas } = require("../src/middleware/validation");

test("patient schema allows boundary ages and known priorities", () => {
  for (const age of [0, 120])
    for (const priority of ["Critical", "Urgent", "Stable"])
      assert.equal(schemas.patient.safeParse({ name: "Synthetic", age, priority }).success, true);
});

test("patient schema rejects invalid ages and unknown fields", () => {
  for (const age of [-1, 121, 1.5, "25", null])
    assert.equal(schemas.patient.safeParse({ name: "Synthetic", age, priority: "Stable" }).success, false);
  assert.equal(schemas.patient.safeParse({
    name: "Synthetic", age: 20, priority: "Stable", role: "ADMIN",
  }).success, false);
});
