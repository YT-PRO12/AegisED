const { test } = require("node:test");
const assert = require("node:assert/strict");
const { schemas } = require("../src/middleware/validation");

test("login schema normalizes email case and accepts bounded passwords", () => {
  const result = schemas.login.parse({ email: "USER@EXAMPLE.COM", password: "x" });
  assert.equal(result.email, "user@example.com");
  assert.equal(result.password, "x");
});

test("login schema rejects malformed or oversized inputs and extra fields", () => {
  for (const email of ["plain-address", "x@x", "", "a".repeat(250) + "@example.com"]) {
    assert.equal(schemas.login.safeParse({ email, password: "password" }).success, false);
  }
  assert.equal(schemas.login.safeParse({ email: "user@example.com", password: "" }).success, false);
  assert.equal(schemas.login.safeParse({ email: "user@example.com", password: "p".repeat(129) }).success, false);
  assert.equal(schemas.login.safeParse({ email: "user@example.com", password: "password", role: "ADMIN" }).success, false);
});
