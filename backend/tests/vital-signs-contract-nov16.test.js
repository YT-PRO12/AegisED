const { test } = require("node:test");
const assert = require("node:assert/strict");
const { schemas } = require("../src/middleware/validation");

const baseline = {
  heartRate: 80,
  systolicBP: 120,
  respiratoryRate: 16,
  temperature: 37,
  oxygenSaturation: 98,
};

test("inclusive physiologic bounds are accepted by intake schema", () => {
  const lower = {
    heartRate: 25, systolicBP: 50, respiratoryRate: 5,
    temperature: 30, oxygenSaturation: 50,
  };
  const upper = {
    heartRate: 250, systolicBP: 250, respiratoryRate: 60,
    temperature: 43, oxygenSaturation: 100,
  };
  assert.equal(schemas.vitals.safeParse(lower).success, true);
  assert.equal(schemas.vitals.safeParse(upper).success, true);
});

test("out-of-range or untrusted fields fail strict validation", () => {
  for (const record of [
    { ...baseline, heartRate: 24 },
    { ...baseline, oxygenSaturation: 101 },
    { ...baseline, respiratoryRate: true },
    { ...baseline, temperature: "37" },
    { ...baseline, medicationOverride: true },
  ]) {
    assert.equal(schemas.vitals.safeParse(record).success, false);
  }
});
