const { test } = require("node:test");
const assert = require("node:assert/strict");
const { listParams } = require("../src/middleware/validation");

test("listing accepts only enumerated sort directions and fields", () => {
  const valid = listParams({
    query: { page: "2", limit: "20", sort: "arrival_time", order: "asc" },
  });
  assert.equal(valid.offset, 20);
  assert.equal(valid.sort, "arrival_time");
  assert.equal(valid.order, "asc");

  for (const query of [
    { sort: "DROP TABLE patients" },
    { sort: "password" },
    { order: "random" },
    { priority: "Unknown" },
    { limit: "101" },
  ]) {
    assert.throws(() => listParams({ query }));
  }
});

test("listing validates the maximum integer offset", () => {
  assert.throws(
    () => listParams({ query: { page: "2147483647", limit: "100" } }),
    /Page offset is too large/,
  );
});
