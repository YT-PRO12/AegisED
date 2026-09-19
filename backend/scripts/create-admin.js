const pool = require("../src/config/db");
const { hash } = require("../src/services/password");
const { schemas } = require("../src/middleware/validation");
(async () => {
  const b = schemas.user.parse({
    name: process.env.ADMIN_NAME || "Administrator",
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    role: "ADMIN",
  });
  await pool.query(
    "INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4)",
    [b.name, b.email, await hash(b.password), b.role],
  );
  console.log("Administrator created");
})()
  .catch((e) => {
    console.error(
      e.code || "Invalid administrator configuration or account already exists",
    );
    process.exitCode = 1;
  })
  .finally(() => pool.end());
