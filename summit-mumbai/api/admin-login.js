const { safeEq, makeToken } = require("./_auth");
const COOKIE = "Path=/api; HttpOnly; Secure; SameSite=Strict";
module.exports = async (req, res) => {
  if (req.method === "DELETE") { res.setHeader("Set-Cookie", `admin=; ${COOKIE}; Max-Age=0`); return res.status(200).end(); }
  if (req.method !== "POST") return res.status(405).end();
  let b = req.body || {};
  if (typeof b === "string") { try { b = JSON.parse(b); } catch (_) { b = {}; } }
  const E = process.env.ADMIN_EMAIL, P = process.env.ADMIN_PASSWORD;
  await new Promise((r) => setTimeout(r, 600)); // slow down guessing
  const okEmail = E && safeEq(String(b.email || "").trim().toLowerCase(), E.trim().toLowerCase());
  const okPass = P && safeEq(String(b.password || ""), P);
  if (!okEmail || !okPass) return res.status(401).json({ ok: false });
  res.setHeader("Set-Cookie", `admin=${makeToken()}; ${COOKIE}; Max-Age=28800`);
  res.status(200).json({ ok: true });
};
