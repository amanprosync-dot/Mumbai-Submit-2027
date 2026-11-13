// Form submit -> upsert the lead (one record per email + pass)
const db = require("./_db");
const s = (v, n = 200) => String(v ?? "").trim().slice(0, n);

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const b = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const email = s(b.email).toLowerCase();
    const phone10 = s(b.phone).replace(/\D/g, "").slice(-10);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || phone10.length !== 10 || !s(b.name) || !db.PASSES.includes(b.pass))
      return res.status(400).json({ ok: false, error: "invalid" });
    if (b.pass === "Couple" && (!s(b.partnerName) || s(b.partnerPhone).replace(/\D/g, "").length < 10))
      return res.status(400).json({ ok: false, error: "partner" });
    const now = new Date();
    const d = await db();
    await d.collection("registrations").updateOne(
      { email, pass: b.pass },
      {
        $set: {
          name: s(b.name), phone: s(b.phone, 20), phone10, state: s(b.state, 60),
          partner: b.pass === "Couple" ? { name: s(b.partnerName), email: s(b.partnerEmail).toLowerCase(), phone: s(b.partnerPhone, 20) } : null,
          committed: s(b.committed, 20), consent: !!b.consent, consentAt: s(b.consentAt, 40),
          sessionId: s(b.sessionId, 64), utm: b.utm && typeof b.utm === "object" ? Object.fromEntries(Object.entries(b.utm).slice(0, 10).map(([k, v]) => [s(k, 30), s(v, 100)])) : {},
          referrer: s(b.referrer, 300), userAgent: s(req.headers["user-agent"], 300),
          source: s(b.source, 40), updatedAt: now, lastSubmittedAt: now,
        },
        $setOnInsert: { createdAt: now, paymentStatus: "pending", paid: false },
        $inc: { submitCount: 1 },
      },
      { upsert: true }
    );
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
};
