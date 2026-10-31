const { test } = require("node:test");
const assert = require("node:assert/strict");
const { literalSearch } = require("../src/utils/search");

test("all SQL LIKE wildcard characters are escaped independently", () => {
  assert.equal(literalSearch("%_"), "%\\%\\_%");
  assert.equal(literalSearch("\\"), "%\\\\%");
});
