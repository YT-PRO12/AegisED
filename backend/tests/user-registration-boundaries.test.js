const { test } = require("node:test");
const assert = require("node:assert/strict");
const { schemas } = require("../src/middleware/validation");

const user = {
  name: "  Synthetic User  ",
  email: "SYNTHETIC@EXAMPLE.COM",
  password: "secure-test-123",
  role: "DOCTOR",
};

test("account input normalizes name and email", () => {
  const parsed = schemas.user.parse(user);
  assert.equal(parsed.name, "Synthetic User");
  assert.equal(parsed.email, "synthetic@example.com");
  assert.equal(parsed.role, "DOCTOR");
});

test("user creation rejects weak passwords, unknown roles and extra fields", () => {
  for (const password of ["short", "", "x".repeat(129)]) {
    assert.equal(schemas.user.safeParse({ ...user, password }).success, false);
  }
  assert.equal(schemas.user.safeParse({ ...user, role: "SUPERUSER" }).success, false);
  assert.equal(schemas.user.safeParse({ ...user, isAdmin: true }).success, false);
  assert.equal(schemas.user.safeParse({ ...user, doctorId: 2147483648 }).success, false);
  assert.equal(schemas.user.safeParse({ ...user, doctorId: 1 }).success, true);
});
