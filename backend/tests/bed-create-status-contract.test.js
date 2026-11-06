const { test } = require("node:test");
const assert = require("node:assert/strict");
const { schemas } = require("../src/middleware/validation");

test("bed creation accepts available and cleaning states", () => {
  for (const status of ["Available", "Cleaning"]) {
    const result = schemas.bed.safeParse({
      bedNumber: "SYNTH-101", status, patientId: null,
    });
    assert.equal(result.success, true);
  }
});

test("bed creation rejects assigned IDs, unknown states, and extra attributes", () => {
  const base = { bedNumber: "SYNTH-101" };
  for (const payload of [
    { ...base, patientId: 12 },
    { ...base, status: "Occupied" },
    { ...base, bedNumber: " " },
    { ...base, admin: true },
  ]) {
    assert.equal(schemas.bed.safeParse(payload).success, false);
  }
});
