const { randomBytes } = require("node:crypto");
const pool = require("../config/db");
const env = require("../config/env");
const password = require("../services/password");
const transaction = require("../services/transaction");
const audit = require("../services/audit");
const { tokenHash } = require("../middleware/auth");
const { assert } = require("../utils/errors");
const dummy = password.hash(randomBytes(32).toString("hex"));
const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  doctor_id: u.doctor_id,
});
exports.login = async (req, res) => {
  const u = (
    await pool.query("SELECT * FROM users WHERE email=$1 AND active", [
      req.body.email,
    ])
  ).rows[0];
  const valid = await password.verify(
    req.body.password,
    u?.password_hash || (await dummy),
  );
  assert(u && valid, 401, "Email or password is incorrect");
  const token = randomBytes(48).toString("hex"),
    csrf = randomBytes(32).toString("hex");
  await transaction(async (c) => {
    await c.query("DELETE FROM sessions WHERE expires_at<NOW()");
    await c.query(
      "INSERT INTO sessions(token_hash,user_id,csrf_token,expires_at) VALUES($1,$2,$3,NOW()+interval '8 hours')",
      [tokenHash(token), u.id, csrf],
    );
    await audit(c, u, "LOGIN", "user", u.id);
  });
  res.cookie(env.cookieName, token, {
    httpOnly: true,
    secure: env.production,
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 3600 * 1000,
  });
  res.json({ success: true, data: { user: publicUser(u), csrfToken: csrf } });
};
exports.me = (req, res) =>
  res.json({
    success: true,
    data: { user: publicUser(req.user), csrfToken: req.user.csrf_token },
  });
exports.logout = async (req, res) => {
  await pool.query("DELETE FROM sessions WHERE token_hash=$1", [
    req.user.token_hash,
  ]);
  res.clearCookie(env.cookieName, {
    path: "/",
    secure: env.production,
    httpOnly: true,
    sameSite: "strict",
  });
  res.json({ success: true, data: null });
};
exports.users = async (req, res) =>
  res.json({
    success: true,
    data: (
      await pool.query(
        "SELECT id,name,email,role,doctor_id,active FROM users ORDER BY id",
      )
    ).rows,
  });
exports.createUser = async (req, res) => {
  const b = req.body;
  assert(
    b.role !== "DOCTOR" || b.doctorId,
    400,
    "A doctor account requires a linked doctor",
  );
  assert(
    b.role === "DOCTOR" || !b.doctorId,
    400,
    "Only doctor accounts can link a doctor",
  );
  const hash = await password.hash(b.password);
  const u = await transaction(async (c) => {
    const u = (
      await c.query(
        "INSERT INTO users(name,email,password_hash,role,doctor_id) VALUES($1,$2,$3,$4,$5) RETURNING id,name,email,role,doctor_id",
        [b.name, b.email, hash, b.role, b.doctorId || null],
      )
    ).rows[0];
    await audit(c, req.user, "USER_CREATED", "user", u.id, { role: b.role });
    return u;
  });
  res.status(201).json({ success: true, data: u });
};
exports.changePassword = async (req, res) => {
  const u = (
    await pool.query("SELECT password_hash FROM users WHERE id=$1", [
      req.user.id,
    ])
  ).rows[0];
  assert(
    await password.verify(req.body.currentPassword, u.password_hash),
    400,
    "Current password is incorrect",
  );
  const hash = await password.hash(req.body.newPassword);
  await transaction(async (c) => {
    await c.query("UPDATE users SET password_hash=$1 WHERE id=$2", [
      hash,
      req.user.id,
    ]);
    await c.query("DELETE FROM sessions WHERE user_id=$1", [req.user.id]);
    await audit(c, req.user, "PASSWORD_CHANGED", "user", req.user.id);
  });
  res.clearCookie(env.cookieName, {
    path: "/",
    secure: env.production,
    httpOnly: true,
    sameSite: "strict",
  });
  res.json({ success: true, data: null });
};
