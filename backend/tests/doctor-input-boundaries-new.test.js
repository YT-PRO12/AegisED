const { test } = require("node:test");
const assert = require("node:assert/strict");
const { schemas } = require("../src/middleware/validation");

test("doctor input accepts documented optional status", () => {
  assert.equal(schemas.doctor.safeParse({
    name: "Synthetic Doctor", specialization: "General", status: "Available",
  }).success, true);
});

test("doctor input rejects unrecognized status and extra fields", () => {
  const sample = { name: "Synthetic Doctor", specialization: "General" };
  assert.equal(schemas.doctor.safeParse({ ...sample, status: "Busy" }).success, false);
  assert.equal(schemas.doctor.safeParse({ ...sample, admin: true }).success, false);
  assert.equal(schemas.doctor.safeParse({ ...sample, specialization: "" }).success, false);
});
