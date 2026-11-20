const { test } = require("node:test");
const assert = require("node:assert/strict");
const { schemas } = require("../src/middleware/validation");

const low = {
  heartRate: 25,
  systolicBP: 50,
  respiratoryRate: 5,
  temperature: 30,
  oxygenSaturation: 50,
};
const high = {
  heartRate: 250,
  systolicBP: 250,
  respiratoryRate: 60,
  temperature: 43,
  oxygenSaturation: 100,
};

test("defined numerical thresholds remain inclusive", () => {
  assert.deepEqual(schemas.vitals.parse(low), low);
  assert.deepEqual(schemas.vitals.parse(high), high);
});

test("nonfinite, string and boolean measurements cannot be coerced", () => {
  for (const key of Object.keys(low)) {
    for (const value of [NaN, Infinity, -Infinity, "72", true, null]) {
      const payload = { ...low, [key]: value };
      assert.equal(
        schemas.vitals.safeParse(payload).success,
        false,
        `Expected ${key}=${String(value)} to be rejected`,
      );
    }
  }
});

test("extra fields and incomplete measurements are rejected", () => {
  assert.equal(schemas.vitals.safeParse({ ...low, deviceAccessToken: "secret" }).success, false);
  const { heartRate, ...missingHeartRate } = low;
  assert.equal(schemas.vitals.safeParse(missingHeartRate).success, false);
  assert.equal(heartRate, 25);
});
