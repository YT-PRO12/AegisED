const { test } = require("node:test");
const assert = require("node:assert/strict");
const { AppError, assert: requireCondition } = require("../src/utils/errors");

test("application errors retain public status and message", () => {
  const error = new AppError(403, "Forbidden");
  assert.equal(error.status, 403);
  assert.equal(error.message, "Forbidden");
  assert.equal(error instanceof Error, true);
});

test("assertion helper accepts true predicates", () => {
  assert.doesNotThrow(() => requireCondition(true, 400, "Invalid"));
});

test("assertion helper throws typed error on false predicate", () => {
  assert.throws(() => requireCondition(false, 409, "Conflict"), error =>
    error instanceof AppError && error.status === 409 && error.message === "Conflict"
  );
});
