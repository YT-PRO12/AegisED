const { test } = require("node:test");
const assert = require("node:assert/strict");
const { schemas } = require("../src/middleware/validation");

const sample = {
  heartRate: 80, systolicBP: 120, respiratoryRate: 16,
  temperature: 37, oxygenSaturation: 98,
};

test("vitals schema accepts documented numerical boundaries", () => {
  for (const [field, bounds] of Object.entries({
    heartRate: [25, 250],
    systolicBP: [50, 250],
    respiratoryRate: [5, 60],
    temperature: [30, 43],
    oxygenSaturation: [50, 100],
  })) for (const value of bounds)
    assert.equal(schemas.vitals.safeParse({ ...sample, [field]: value }).success, true);
});

test("vitals schema rejects omitted, unexpected and out-of-range fields", () => {
  const missing = { ...sample }; delete missing.heartRate;
  assert.equal(schemas.vitals.safeParse(missing).success, false);
  assert.equal(schemas.vitals.safeParse({ ...sample, oxygenSaturation: 101 }).success, false);
  assert.equal(schemas.vitals.safeParse({ ...sample, extra: 1 }).success, false);
});
