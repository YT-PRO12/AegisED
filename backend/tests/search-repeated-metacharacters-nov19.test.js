const test = require("node:test");
const assert = require("node:assert/strict");
const { literalSearch } = require("../src/utils/search");

test("escape consecutive SQL LIKE metacharacters independently", () => {
  assert.equal(literalSearch("%%"), "%\\%\\%%");
  assert.equal(literalSearch("__"), "%\\_\\_%");
  assert.equal(literalSearch("\\\\"), "%\\\\\\\\%");
  assert.equal(literalSearch("%_\\%"), "%\\%\\_\\\\\\%%");
});

test("search helper preserves input strings without mutation", () => {
  const term = "Ward_100%\\North";
  assert.equal(literalSearch(term), "%Ward\\_100\\%\\\\North%");
  assert.equal(term, "Ward_100%\\North");
});

test("empty literal term becomes a wildcard-only search", () => {
  assert.equal(literalSearch(""), "%%");
});
