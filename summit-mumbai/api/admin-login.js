// Admin accounts live in the MongoDB "admins" collection (passwords stored as salted scrypt hashes).
// One-time bootstrap: if the collection is empty, the first account is created from the
// ADMIN_EMAIL / ADMIN_PASSWORD env vars. After that the database is the source of truth.
const db = require("./_db");
const { verify, hash, makeToken } = require("./_auth");
const COOKIE = "Path=/api; HttpOnly; Secure; SameSite=Strict";

module.exports = async (req, res) => {
  if (req.method === "DELETE") { res.setHeader("Set-Cookie", `admin=; ${COOKIE}; Max-Age=0`); return res.status(200).end(); }
  if (req.method !== "POST") return res.status(405).end();
  let b = req.body || {};
  if (typeof b === "string") { try { b = JSON.parse(b); } catch (_) { b = {}; } }
  try {
    const admins = (await db()).collection("admins");
    if ((await admins.countDocuments({}, { limit: 1 })) === 0 && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      await admins.updateOne(
        { email: process.env.ADMIN_EMAIL.trim().toLowerCase() },
        { $setOnInsert: { passwordHash: hash(process.env.ADMIN_PASSWORD), createdAt: new Date() } },
        { upsert: true }
      );
    }
    const a = await admins.findOne({ email: String(b.email || "").trim().toLowerCase() });
    // always run a hash check so response time doesn't reveal whether the email exists
    const ok = verify(String(b.password || ""), a ? a.passwordHash : "00:00") && !!a;
    await new Promise((r) => setTimeout(r, 500));
    if (!ok) return res.status(401).json({ ok: false });
    res.setHeader("Set-Cookie", `admin=${makeToken()}; ${COOKIE}; Max-Age=28800`);
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
};
