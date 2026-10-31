const { test } = require("node:test");
const assert = require("node:assert/strict");
const { AppError } = require("../src/utils/errors");

test("typed application error keeps stack and message", () => {
  const error = new AppError(404, "Missing");
  assert.ok(error instanceof Error);
  assert.equal(error.message, "Missing");
  assert.equal(error.status, 404);
  assert.equal(typeof error.stack, "string");
});
