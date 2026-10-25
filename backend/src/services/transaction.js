const pool = require("../config/db");
module.exports = async function transaction(work) {
  const c = await pool.connect();
  let failed = false;
  let rollbackError;
  try {
    await c.query("BEGIN");
    const result = await work(c);
    await c.query("COMMIT");
    return result;
  } catch (e) {
    failed = true;
    try {
      await c.query("ROLLBACK");
    } catch (error) {
      // Discard a client whose transaction state could not be restored.
      rollbackError = error;
    }
    throw e;
  } finally {
    try {
      c.release(rollbackError);
    } catch (error) {
      // Preserve the operation failure, but surface cleanup-only failures.
      if (!failed) throw error;
    }
  }
};
