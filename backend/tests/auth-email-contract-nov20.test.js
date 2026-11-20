const { test } = require("node:test");
const assert = require("node:assert/strict");
const { schemas } = require("../src/middleware/validation");

test("login and user registration normalize email casing consistently", () => {
  const email = "Example.Person+ED@Hospital.ORG";
  const normalized = "example.person+ed@hospital.org";
  const login = schemas.login.parse({ email, password: "password" });
  const user = schemas.user.parse({
    name: "  Staff Member  ",
    email,
    password: "long-password-123",
    role: "NURSE",
  });
  assert.equal(login.email, normalized);
  assert.equal(user.email, normalized);
  assert.equal(user.name, "Staff Member");
});

test("authentication schemas reject extra privileges and malformed passwords", () => {
  const login = { email: "nurse@example.org", password: "password" };
  assert.equal(schemas.login.safeParse({ ...login, role: "ADMIN" }).success, false);
  assert.equal(schemas.user.safeParse({
    name: "Nurse", email: login.email, password: "short", role: "NURSE",
  }).success, false);
  assert.equal(schemas.user.safeParse({
    name: "Nurse", email: login.email, password: "long-password-123",
    role: "SUPERUSER",
  }).success, false);
  assert.equal(schemas.login.safeParse({ ...login, email: "no-at-sign" }).success, false);
});
