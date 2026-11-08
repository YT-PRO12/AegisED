const { test } = require("node:test");
const assert = require("node:assert/strict");
const { schemas } = require("../src/middleware/validation");

const vitals = {
  heartRate: 80,
  systolicBP: 120,
  respiratoryRate: 16,
  temperature: 37,
  oxygenSaturation: 98,
};

const intake = {
  patientId: 1,
  symptoms: "Synthetic intake",
  priority: "Stable",
  vitals,
};

test("emergency intake accepts a complete valid vital-sign record", () => {
  const parsed = schemas.case.parse(intake);
  assert.deepEqual(parsed.vitals, vitals);
});

test("nested measurements and unknown keys are rejected", () => {
  const bad = [
    { ...vitals, heartRate: 24 },
    { ...vitals, oxygenSaturation: 101 },
    { ...vitals, temperature: "37" },
    { ...vitals, unapprovedField: 1 },
  ];
  for (const record of bad)
    assert.equal(schemas.case.safeParse({ ...intake, vitals: record }).success, false);
});
