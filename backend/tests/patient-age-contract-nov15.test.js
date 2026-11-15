const { test } = require("node:test");
const assert = require("node:assert/strict");
const { schemas } = require("../src/middleware/validation");

test("patient age accepts newborn and documented upper boundary", () => {
  for (const age of [0, 1, 120]) {
    const parsed = schemas.patient.parse({
      name: "  Synthetic Patient  ",
      age,
      priority: "Stable",
    });
    assert.equal(parsed.age, age);
    assert.equal(parsed.name, "Synthetic Patient");
  }
});

test("patient payload rejects unsafe age values and privilege fields", () => {
  for (const age of [-1, 121, 2.5, true, "20", null]) {
    assert.equal(
      schemas.patient.safeParse({ name: "Patient", age, priority: "Urgent" }).success,
      false,
    );
  }
  assert.equal(
    schemas.patient.safeParse({
      name: "Patient", age: 40, priority: "Stable", isAdmin: true,
    }).success,
    false,
  );
});
