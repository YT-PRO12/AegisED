module.exports = async function audit(
  c,
  user,
  action,
  type,
  id,
  metadata = {},
) {
  await c.query(
    "INSERT INTO audit_logs(user_id,action,entity_type,entity_id,metadata) VALUES($1,$2,$3,$4,$5)",
    [user?.id || null, action, type, id || null, JSON.stringify(metadata)],
  );
};
