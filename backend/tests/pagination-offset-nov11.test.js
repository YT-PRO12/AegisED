const { test } = require("node:test");
const assert = require("node:assert/strict");
const { listParams } = require("../src/middleware/validation");

test("page offsets follow validated one-based pagination", () => {
  assert.equal(listParams({ query: {} }).offset, 0);
  assert.equal(listParams({ query: { page: "2", limit: "25" } }).offset, 25);
  assert.equal(listParams({ query: { page: "3", limit: "25" } }).offset, 50);
});

test("default order and sort are fixed server-side", () => {
  const parsed = listParams({ query: { search: "Synthetic" } });
  assert.equal(parsed.sort, "id");
  assert.equal(parsed.order, "desc");
  assert.equal(parsed.search, "Synthetic");
});

test("invalid page representations never become SQL offsets", () => {
  for (const page of ["-1", "0", "1.5", "1e3", "01", " 1 ", "Infinity"]) {
    assert.throws(() => listParams({ query: { page } }));
  }
});
