const { test } = require("node:test");
const assert = require("node:assert/strict");
const { literalSearch } = require("../src/utils/search");

test("empty term maps to SQL wildcard envelope", () => {
  assert.equal(literalSearch(""), "%%");
});

test("search helper does not trim meaningful whitespace", () => {
  assert.equal(literalSearch(" ward "), "% ward %");
});
