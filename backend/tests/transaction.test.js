const { test } = require("node:test");
const assert = require("node:assert/strict");
const transaction = require("../src/services/transaction");

test("transaction commits successful work and returns its result", async (t) => {
  const original = require("../src/config/db");
  const calls = [];
  const client = {
    query: async (sql) => { calls.push(sql); return { rows: [] }; },
    release: () => calls.push("RELEASE"),
  };
  const restore = t.mock.method(original, "connect", async () => client);
  try {
    const result = await transaction(async (c) => {
      assert.equal(c, client);
      calls.push("WORK");
      return { id: 7 };
    });
    assert.deepEqual(result, { id: 7 });
    assert.deepEqual(calls, ["BEGIN", "WORK", "COMMIT", "RELEASE"]);
  } finally {
    restore.mock.restore();
  }
});

test("transaction rolls back failed work and always releases the connection", async (t) => {
  const original = require("../src/config/db");
  const calls = [];
  const client = {
    query: async (sql) => { calls.push(sql); return { rows: [] }; },
    release: () => calls.push("RELEASE"),
  };
  const restore = t.mock.method(original, "connect", async () => client);
  const failure = new Error("synthetic transaction failure");
  try {
    await assert.rejects(transaction(async () => { calls.push("WORK"); throw failure; }), (err) => err === failure);
    assert.deepEqual(calls, ["BEGIN", "WORK", "ROLLBACK", "RELEASE"]);
  } finally {
    restore.mock.restore();
  }
});
