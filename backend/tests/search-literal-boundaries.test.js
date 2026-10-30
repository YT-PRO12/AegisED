const { test } = require("node:test");
const assert = require("node:assert/strict");
const { literalSearch } = require("../src/utils/search");

test("search wraps a plain term in wildcards", () => {
  assert.equal(literalSearch("ward"), "%ward%");
});

test("search escapes percent, underscore and backslash", () => {
  assert.equal(literalSearch("a%b_c\\d"), "%a\\%b\\_c\\\\d%");
});

test("search preserves spaces and apostrophes for parameterized SQL", () => {
  assert.equal(literalSearch("O'Brien Ward"), "%O'Brien Ward%");
});
