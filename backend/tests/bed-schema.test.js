const { test } = require("node:test");
const assert = require("node:assert/strict");
const { schemas } = require("../src/middleware/validation");

test("bed schema accepts supported states and explicit unassignment", () => {
  assert.equal(schemas.bed.safeParse({ bedNumber: "A-01" }).success, true);
  assert.equal(schemas.bed.safeParse({ bedNumber: "A-02", status: "Available", patientId: null }).success, true);
  assert.equal(schemas.bed.safeParse({ bedNumber: "B-03", status: "Cleaning" }).success, true);
});

test("bed schema rejects invalid states, non-null patient ids, and extra fields", () => {
  assert.equal(schemas.bed.safeParse({ bedNumber: "A-01", status: "Occupied" }).success, false);
  assert.equal(schemas.bed.safeParse({ bedNumber: "A-01", patientId: 42 }).success, false);
  assert.equal(schemas.bed.safeParse({ bedNumber: "A-01", patientId: null, doctorId: 2 }).success, false);
  assert.equal(schemas.bed.safeParse({ bedNumber: " ", status: "Available" }).success, false);
});
