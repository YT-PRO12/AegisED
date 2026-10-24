const { test } = require("node:test");
const assert = require("node:assert/strict");
const { schemas } = require("../src/middleware/validation");

const minimum = { heartRate: 25, systolicBP: 50, respiratoryRate: 5, temperature: 30, oxygenSaturation: 50 };
const maximum = { heartRate: 250, systolicBP: 250, respiratoryRate: 60, temperature: 43, oxygenSaturation: 100 };

test("vitals schema accepts each configured lower and upper bound", () => {
  assert.equal(schemas.vitals.safeParse(minimum).success, true);
  assert.equal(schemas.vitals.safeParse(maximum).success, true);
});

test("vitals schema rejects out-of-range values and unexpected measurements", () => {
  const invalid = [
    { ...minimum, heartRate: 24 },
    { ...minimum, systolicBP: 251 },
    { ...minimum, respiratoryRate: 4 },
    { ...minimum, temperature: 43.1 },
    { ...minimum, oxygenSaturation: 101 },
    { ...minimum, glucose: 100 },
  ];
  for (const value of invalid) assert.equal(schemas.vitals.safeParse(value).success, false);
});
