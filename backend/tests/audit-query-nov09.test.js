const { test } = require("node:test");
const assert = require("node:assert/strict");
const { auditQuery } = require("../src/middleware/validation");

test("audit query defaults to page one and an empty action", () => {
  assert.deepEqual(auditQuery.parse({}), { page: 1, action: "" });
});

test("audit query accepts a bounded page and action", () => {
  const parsed = auditQuery.parse({ page: "10", action: "case.created" });
  assert.equal(parsed.page, 10);
  assert.equal(parsed.action, "case.created");
});

test("audit query rejects ambiguous and out-of-range pages", () => {
  for (const page of ["0", "-1", "01", "1.0", "1e2", "71582790", ["1"]]) {
    assert.equal(auditQuery.safeParse({ page }).success, false);
  }
});

test("audit query rejects excessively long action names", () => {
  assert.equal(auditQuery.safeParse({ action: "a".repeat(81) }).success, false);
});
