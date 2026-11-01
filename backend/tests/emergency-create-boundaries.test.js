const { test } = require("node:test");
const assert = require("node:assert/strict");
const { schemas } = require("../src/middleware/validation");

const sample = {
  patientId: 1, symptoms: "Synthetic intake", priority: "Urgent",
};

test("emergency case accepts valid minimum input", () => {
  assert.equal(schemas.case.safeParse(sample).success, true);
  assert.equal(schemas.case.safeParse({ ...sample, recommendation: null }).success, true);
});

test("emergency case rejects invalid references and extra data", () => {
  for (const patientId of [0, -1, 1.5, "1", 2147483648])
    assert.equal(schemas.case.safeParse({ ...sample, patientId }).success, false);
  assert.equal(schemas.case.safeParse({ ...sample, symptoms: "" }).success, false);
  assert.equal(schemas.case.safeParse({ ...sample, privileged: true }).success, false);
});
