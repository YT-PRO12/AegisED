const { createHash } = require("node:crypto");
const pool = require("../config/db");
const env = require("../config/env");
const { assert } = require("../utils/errors");
const tokenHash = (token) => createHash("sha256").update(token).digest("hex");
async function authenticate(req, res, next) {
  const token = req.cookies[env.cookieName];
  assert(token && token.length < 200, 401, "Please sign in");
  const r = await pool.query(
    `SELECT u.id,u.name,u.email,u.role,u.doctor_id,s.csrf_token,s.token_hash
 FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>NOW() AND u.active`,
    [tokenHash(token)],
  );
  assert(r.rowCount, 401, "Session expired. Please sign in");
  req.user = r.rows[0];
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method))
    assert(
      req.get("x-csrf-token") === req.user.csrf_token,
      403,
      "Invalid request token",
    );
  next();
}
const allow =
  (...roles) =>
  (req, res, next) => {
    assert(
      roles.includes(req.user.role),
      403,
      "Your role cannot perform this action",
    );
    next();
  };
function ownsCase(user, ec) {
  assert(
    user.role !== "DOCTOR" || ec.doctor_id === user.doctor_id,
    403,
    "Only the assigned doctor can access this case",
  );
}
module.exports = { authenticate, allow, ownsCase, tokenHash };
