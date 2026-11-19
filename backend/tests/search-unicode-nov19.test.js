const test = require("node:test");
const assert = require("node:assert/strict");
const { literalSearch } = require("../src/utils/search");

test("Unicode search terms are preserved around escaped SQL wildcards", () => {
  assert.equal(literalSearch("जयपुर_वार्ड"), "%जयपुर\\_वार्ड%");
  assert.equal(literalSearch("患者%"), "%患者\\%%");
  assert.equal(literalSearch("🏥\\A"), "%🏥\\\\A%");
});

test("apostrophes and quotes are passed as literal parameter data", () => {
  assert.equal(literalSearch("O'Brien"), "%O'Brien%");
  assert.equal(literalSearch('"emergency"'), '%"emergency"%');
});
