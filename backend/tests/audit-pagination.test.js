const { test } = require("node:test");
const assert = require("node:assert/strict");
const { auditQuery } = require("../src/middleware/validation");
test("audit pages reject coercion and PostgreSQL offset overflow", () => {
  for (const page of [
    "",
    " ",
    "0",
    "01",
    "1.0",
    "1e2",
    "0x10",
    "1\n",
    ["1"],
    ["1", "2"],
    "71582790",
    "999999999999999999999",
  ])
    assert.equal(auditQuery.safeParse({ page }).success, false);
  assert.deepEqual(auditQuery.parse({}), { page: 1, action: "" });
  const last = auditQuery.parse({ page: "71582789", action: "LOGIN" });
  assert.equal((last.page - 1) * 30, 2147483640);
  assert.equal(auditQuery.parse({ page: "2" }).page, 2);
});
