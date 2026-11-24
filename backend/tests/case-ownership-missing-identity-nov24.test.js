const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ownsCase } = require("../src/middleware/auth");

test("ownership requires authenticated identity", () => {
  for (const user of [null, undefined, {}, { role: null }]) {
    assert.throws(
      () => ownsCase(user, { doctor_id: 7 }),
      (error) => error.status === 403,
    );
  }
});

test("doctor cannot access an absent case or another assignment", () => {
  const doctor = { role: "DOCTOR", doctor_id: 7 };
  for (const record of [null, undefined, {}, { doctor_id: 8 }]) {
    assert.throws(
      () => ownsCase(doctor, record),
      (error) => error.status === 403,
    );
  }
  assert.doesNotThrow(() => ownsCase(doctor, { doctor_id: 7 }));
  assert.doesNotThrow(() => ownsCase({ role: "ADMIN" }, { doctor_id: 8 }));
});
