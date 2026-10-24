const { test } = require("node:test");
const assert = require("node:assert/strict");
const { schemas } = require("../src/middleware/validation");

test("doctor schema allows documented status values and omitted status", () => {
  const base = { name: "Dr Test", specialization: "Emergency Medicine" };
  assert.equal(schemas.doctor.safeParse(base).success, true);
  assert.equal(schemas.doctor.safeParse({ ...base, status: "Available" }).success, true);
  assert.equal(schemas.doctor.safeParse({ ...base, status: "Off Duty" }).success, true);
});

test("doctor schema rejects unsupported status and unexpected properties", () => {
  const base = { name: "Dr Test", specialization: "Emergency Medicine" };
  assert.equal(schemas.doctor.safeParse({ ...base, status: "Busy" }).success, false);
  assert.equal(schemas.doctor.safeParse({ ...base, userId: 1 }).success, false);
  assert.equal(schemas.doctor.safeParse({ ...base, specialization: "x".repeat(101) }).success, false);
});
