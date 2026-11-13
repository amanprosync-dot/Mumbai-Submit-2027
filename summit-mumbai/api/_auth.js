const crypto = require("crypto");
// Session-signing key: ADMIN_SECRET if set, otherwise derived from the DB connection string (always present)
const key = () => process.env.ADMIN_SECRET || process.env.MONGODB_URI || "";
const sign = (v) => crypto.createHmac("sha256", key()).update(v).digest("hex");
const safeEq = (a, b) => {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
};
exports.safeEq = safeEq;
exports.hash = (pw) => {
  const salt = crypto.randomBytes(16).toString("hex");
  return salt + ":" + crypto.scryptSync(String(pw), salt, 64).toString("hex");
};
exports.verify = (pw, stored) => {
  const [salt, h] = String(stored || "").split(":");
  if (!salt || !h) return false;
  return safeEq(crypto.scryptSync(String(pw), salt, 64).toString("hex"), h);
};
exports.makeToken = () => { const exp = Date.now() + 8 * 3600e3; return exp + "." + sign(String(exp)); };
exports.isAdmin = (req) => {
  if (!key()) return false;
  const m = /(?:^|;\s*)admin=(\d+)\.([a-f0-9]+)/.exec(req.headers.cookie || "");
  return !!m && Number(m[1]) > Date.now() && safeEq(m[2], sign(m[1]));
};
