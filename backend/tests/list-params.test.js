const { test } = require("node:test");
const assert = require("node:assert/strict");
const { listParams } = require("../src/middleware/validation");

test("list parameters provide stable defaults and calculate offset", () => {
  assert.deepEqual(listParams({ query: {} }), {
    page: 1,
    limit: 20,
    search: "",
    sort: "id",
    order: "desc",
    offset: 0,
  });
  const parsed = listParams({
    query: {
      page: "3",
      limit: "10",
      search: "triage",
      sort: "name",
      order: "asc",
    },
  });
  assert.equal(parsed.offset, 20);
  assert.equal(parsed.search, "triage");
});

test("list parameters reject negative pages, excessive limits, and SQL-like sort values", () => {
  for (const query of [
    { page: "0" },
    { page: "-1" },
    { limit: "101" },
    { limit: "0" },
    { sort: "id;DROP TABLE patients" },
    { order: "random" },
  ])
    assert.throws(() => listParams({ query }));
});

test("pagination rejects alternate numeric syntax, repeated values, and oversized offsets", () => {
  for (const page of [
    "",
    " ",
    "1e2",
    "0x10",
    "1.0",
    "01",
    ["1"],
    ["1", "2"],
    true,
  ])
    assert.throws(() => listParams({ query: { page } }));
  assert.throws(
    () => listParams({ query: { page: "2147483647", limit: "100" } }),
    (e) => e.status === 400,
  );
  assert.equal(
    listParams({ query: { page: "2147483647", limit: "1" } }).offset,
    2147483646,
  );
});
