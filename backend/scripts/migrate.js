const fs = require("node:fs/promises");
const path = require("node:path");
const pool = require("../src/config/db");
async function migrate() {
  const c = await pool.connect();
  try {
    await c.query("SELECT pg_advisory_lock(731902)");
    await c.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())",
    );
    const dir = path.join(__dirname, "../migrations");
    for (const name of (await fs.readdir(dir))
      .filter((x) => x.endsWith(".sql"))
      .sort()) {
      if (
        (await c.query("SELECT 1 FROM schema_migrations WHERE name=$1", [name]))
          .rowCount
      )
        continue;
      await c.query("BEGIN");
      try {
        await c.query(await fs.readFile(path.join(dir, name), "utf8"));
        await c.query("INSERT INTO schema_migrations(name) VALUES($1)", [name]);
        await c.query("COMMIT");
        console.log("Applied " + name);
      } catch (e) {
        await c.query("ROLLBACK");
        throw e;
      }
    }
  } finally {
    await c.query("SELECT pg_advisory_unlock(731902)");
    c.release();
  }
}
if (require.main === module)
  migrate()
    .catch((e) => {
      console.error("Migration failed:", e.message);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
module.exports = migrate;
