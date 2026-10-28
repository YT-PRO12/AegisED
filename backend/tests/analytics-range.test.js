const { test } = require("node:test");
const assert = require("node:assert/strict");
const pool = require("../src/config/db");
const { analytics } = require("../src/controllers/analyticsController");
test("analytics includes the requested number of days ending on an explicit date", async (t) => {
  const query = t.mock.method(pool, "query", async () => ({
    rows: [{ total: 0, occupied_bed_hours: 0 }],
  }));
  for (const [input, from, to] of [
    [
      { days: "1", to: "2026-10-28" },
      "2026-10-28T00:00:00.000Z",
      "2026-10-29T00:00:00.000Z",
    ],
    [
      { days: "2", to: "2024-03-01" },
      "2024-02-29T00:00:00.000Z",
      "2024-03-02T00:00:00.000Z",
    ],
    [
      { from: "2026-01-01", to: "2026-01-01" },
      "2026-01-01T00:00:00.000Z",
      "2026-01-02T00:00:00.000Z",
    ],
  ]) {
    let body;
    await analytics(
      { query: input },
      {
        json: (value) => {
          body = value;
        },
      },
    );
    assert.equal(body.data.range.from, from);
    assert.equal(body.data.range.to, to);
    const args = query.mock.calls.at(-1).arguments[1];
    assert.equal(args[0].toISOString(), from);
    assert.equal(args[1].toISOString(), to);
  }
});
test("analytics rejects reversed date ranges before querying", async (t) => {
  const query = t.mock.method(pool, "query", async () => {
    throw new Error("must not query");
  });
  await assert.rejects(
    analytics({ query: { from: "2026-10-29", to: "2026-10-28" } }, {}),
    (e) => e.status === 400,
  );
  assert.equal(query.mock.callCount(), 0);
});
