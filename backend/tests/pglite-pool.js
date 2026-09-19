// Test-only PostgreSQL WASM adapter. Serializes clients; cannot verify native row-lock concurrency.
const { PGlite } = require("@electric-sql/pglite");
const db = new PGlite(process.env.TEST_PGLITE_PATH);
let tail = Promise.resolve();
async function acquire() {
  let release;
  const previous = tail;
  tail = new Promise((r) => {
    release = r;
  });
  await previous;
  return release;
}
async function query(sql, params) {
  await db.waitReady;
  const result = params
    ? await db.query(sql, params)
    : (await db.exec(sql)).at(-1) || {};
  return {
    ...result,
    rows: result.rows || [],
    rowCount: result.affectedRows || result.rows?.length || 0,
  };
}
module.exports = {
  async connect() {
    const release = await acquire();
    return { query, release };
  },
  async query(sql, params) {
    const release = await acquire();
    try {
      return await query(sql, params);
    } finally {
      release();
    }
  },
  on() {},
  async end() {
    await tail;
    await db.close();
  },
};
