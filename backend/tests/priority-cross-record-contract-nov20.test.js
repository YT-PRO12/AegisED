const { test } = require("node:test");
const assert = require("node:assert/strict");
const { schemas, priority } = require("../src/middleware/validation");

const priorities = ["Critical", "Urgent", "Stable"];

test("patient and emergency case agree on every supported triage priority", () => {
  for (const value of priorities) {
    assert.equal(priority.safeParse(value).success, true);
    const patient = schemas.patient.parse({ name: "Patient A", age: 25, priority: value });
    const emergencyCase = schemas.case.parse({
      patientId: 1,
      symptoms: "Breathing difficulty",
      priority: value,
    });
    assert.equal(patient.priority, value);
    assert.equal(emergencyCase.priority, value);
  }
});

test("unexpected or lowercased priorities fail in both payloads", () => {
  for (const value of ["critical", "UNKNOWN", "Low", "", 3, null]) {
    assert.equal(priority.safeParse(value).success, false);
    assert.equal(
      schemas.patient.safeParse({ name: "Patient A", age: 25, priority: value }).success,
      false,
    );
    assert.equal(
      schemas.case.safeParse({
        patientId: 1, symptoms: "Pain", priority: value,
      }).success,
      false,
    );
  }
});
