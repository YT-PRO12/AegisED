const { test } = require("node:test");
const assert = require("node:assert/strict");
const { allow, ownsCase } = require("../src/middleware/auth");

test("role middleware denies requests without an authenticated user", () => {
  const requireAdmin = allow("ADMIN");
  assert.throws(
    () => requireAdmin({}, {}, () => {}),
    (error) => error.status === 403,
  );
  assert.throws(
    () => requireAdmin({ user: { role: "NURSE" } }, {}, () => {}),
    (error) => error.status === 403,
  );

  let called = false;
  requireAdmin({ user: { role: "ADMIN" } }, {}, () => {
    called = true;
  });
  assert.equal(called, true);
});

test("doctor ownership rejects unassigned legacy records", () => {
  for (const doctorId of [null, 0, undefined, "5"]) {
    assert.throws(
      () => ownsCase(
        { role: "DOCTOR", doctor_id: doctorId },
        { doctor_id: doctorId },
      ),
      (error) => error.status === 403,
    );
  }
});

test("doctor access requires an exact valid assignment", () => {
  assert.doesNotThrow(() => ownsCase(
    { role: "DOCTOR", doctor_id: 5 },
    { doctor_id: 5 },
  ));
  assert.throws(
    () => ownsCase(
      { role: "DOCTOR", doctor_id: 5 },
      { doctor_id: 6 },
    ),
    (error) => error.status === 403,
  );
  assert.throws(
    () => ownsCase(
      { role: "DOCTOR", doctor_id: 5 },
      { doctor_id: null },
    ),
    (error) => error.status === 403,
  );
  assert.doesNotThrow(() => ownsCase(
    { role: "ADMIN" },
    { doctor_id: null },
  ));
});
