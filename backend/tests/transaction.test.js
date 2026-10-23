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


test("transaction preserves the original operation error if rollback also fails", async (t) => {
  const original = require("../src/config/db");
  const calls = [];
  const operationError = new Error("synthetic operation failure");
  const rollbackError = new Error("synthetic rollback failure");
  const client = {
    query: async (sql) => {
      calls.push(sql);
      if (sql === "ROLLBACK") throw rollbackError;
      return { rows: [] };
    },
    release: () => calls.push("RELEASE"),
  };
  const restore = t.mock.method(original, "connect", async () => client);
  try {
    await assert.rejects(transaction(async () => { throw operationError; }), (err) => err === operationError);
    assert.deepEqual(calls, ["BEGIN", "ROLLBACK", "RELEASE"]);
  } finally {
    restore.mock.restore();
  }
});


test("transaction releases a connection when BEGIN fails", async (t) => {
  const original = require("../src/config/db");
  const calls = [];
  const beginError = new Error("synthetic begin failure");
  const client = {
    query: async (sql) => { calls.push(sql); if (sql === "BEGIN") throw beginError; return { rows: [] }; },
    release: () => calls.push("RELEASE"),
  };
  const restore = t.mock.method(original, "connect", async () => client);
  try {
    await assert.rejects(transaction(async () => assert.fail("work must not run")), (err) => err === beginError);
    assert.deepEqual(calls, ["BEGIN", "ROLLBACK", "RELEASE"]);
  } finally {
    restore.mock.restore();
  }
});


test("transaction does not mask work errors when connection release throws", async (t) => {
  const original = require("../src/config/db");
  const calls = [];
  const operationError = new Error("synthetic work error");
  const releaseError = new Error("synthetic release error");
  const client = {
    query: async (sql) => { calls.push(sql); return { rows: [] }; },
    release: () => { calls.push("RELEASE"); throw releaseError; },
  };
  const restore = t.mock.method(original, "connect", async () => client);
  try {
    await assert.rejects(transaction(async () => { throw operationError; }), (err) => err === operationError);
    assert.deepEqual(calls, ["BEGIN", "ROLLBACK", "RELEASE"]);
  } finally {
    restore.mock.restore();
  }
});


test("transaction releases a client after COMMIT failure and attempts rollback", async (t) => {
  const original = require("../src/config/db");
  const calls = [];
  const commitError = new Error("synthetic commit failure");
  const client = {
    query: async (sql) => { calls.push(sql); if (sql === "COMMIT") throw commitError; return { rows: [] }; },
    release: () => calls.push("RELEASE"),
  };
  const restore = t.mock.method(original, "connect", async () => client);
  try {
    await assert.rejects(transaction(async () => "result"), (err) => err === commitError);
    assert.deepEqual(calls, ["BEGIN", "COMMIT", "ROLLBACK", "RELEASE"]);
  } finally {
    restore.mock.restore();
  }
});
