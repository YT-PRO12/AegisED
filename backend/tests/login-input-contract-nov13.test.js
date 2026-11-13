const { test } = require("node:test");
const assert = require("node:assert/strict");
const { schemas } = require("../src/middleware/validation");

test("valid login retains password and normalizes email case", () => {
  const parsed = schemas.login.parse({
    email: "SYNTHETIC@EXAMPLE.COM",
    password: "synthetic-password",
  });
  assert.equal(parsed.email, "synthetic@example.com");
  assert.equal(parsed.password, "synthetic-password");
});

test("login rejects missing credentials and unexpected privilege fields", () => {
  const valid = {
    email: "synthetic@example.com",
    password: "synthetic-password",
  };
  for (const payload of [
    { ...valid, password: "" },
    { ...valid, email: "invalid-address" },
    { ...valid, isAdmin: true },
    { email: valid.email },
    { password: valid.password },
  ]) {
    assert.equal(schemas.login.safeParse(payload).success, false);
  }
});
