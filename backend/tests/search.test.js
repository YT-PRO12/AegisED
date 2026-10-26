const { test } = require("node:test");
const assert = require("node:assert/strict");
const { PGlite } = require("@electric-sql/pglite");
const { literalSearch } = require("../src/utils/search");
test("search treats percent, underscore and backslash as literal characters", async () => {
  const db = new PGlite();
  try {
    await db.exec("CREATE TABLE samples (name TEXT)");
    for (const value of [
      "100% ready",
      "100X ready",
      "ward_one",
      "wardXone",
      "a\\b",
      "ab",
      "O'Brien",
    ])
      await db.query("INSERT INTO samples VALUES ($1)", [value]);
    for (const [query, expected] of [
      ["%", ["100% ready"]],
      ["_", ["ward_one"]],
      ["\\", ["a\\b"]],
      ["o'brien", ["O'Brien"]],
    ]) {
      const rows = (
        await db.query(
          "SELECT name FROM samples WHERE name ILIKE $1 ORDER BY name",
          [literalSearch(query)],
        )
      ).rows;
      assert.deepEqual(
        rows.map((x) => x.name),
        expected,
      );
    }
  } finally {
    await db.close();
  }
});
