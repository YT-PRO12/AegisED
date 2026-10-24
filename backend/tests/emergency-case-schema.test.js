const { test } = require("node:test");
const assert = require("node:assert/strict");
const { schemas } = require("../src/middleware/validation");

test("case schema accepts required identifiers and supported priorities", () => {
  for (const priority of ["Critical", "Urgent", "Stable"]) {
    assert.equal(schemas.case.safeParse({ patientId: 1, symptoms: "Shortness of breath", priority }).success, true);
  }
});

test("case schema rejects unsafe identifiers and malformed fields", () => {
  for (const patientId of [0, -1, 1.5, "1"]) {
    assert.equal(schemas.case.safeParse({ patientId, symptoms: "Symptoms", priority: "Urgent" }).success, false);
  }
  assert.equal(schemas.case.safeParse({ patientId: 1, symptoms: " ", priority: "Urgent" }).success, false);
  assert.equal(schemas.case.safeParse({ patientId: 1, symptoms: "Symptoms", priority: "Low" }).success, false);
  assert.equal(schemas.case.safeParse({ patientId: 1, symptoms: "Symptoms", priority: "Urgent", status: "Discharged" }).success, false);
});
