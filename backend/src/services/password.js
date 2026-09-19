const { scrypt, randomBytes, timingSafeEqual } = require("node:crypto");
const derive = require("node:util").promisify(scrypt);
async function hash(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await derive(password, salt, 64, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return `${salt}:${key.toString("hex")}`;
}
async function verify(password, stored) {
  const [salt, key] = stored.split(":");
  const candidate = await derive(password, salt, 64, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return (
    key.length === 128 && timingSafeEqual(Buffer.from(key, "hex"), candidate)
  );
}
module.exports = { hash, verify };
