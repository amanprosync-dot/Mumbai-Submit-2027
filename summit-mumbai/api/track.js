// Funnel events: pass_click, form_start, payment_redirect ...
const db = require("./_db");
const ALLOWED = ["pass_click", "pass_selected", "form_start", "form_submit", "payment_redirect"];
const s = (v, n = 100) => String(v ?? "").slice(0, n);

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const b = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    if (!ALLOWED.includes(b.event)) return res.status(400).end();
    await (await db()).collection("events").insertOne({
      event: b.event, pass: db.PASSES.includes(b.pass) ? b.pass : null, sessionId: s(b.sessionId, 64),
      email: s(b.email, 200).toLowerCase() || null,
      utm: b.utm && typeof b.utm === "object" ? Object.fromEntries(Object.entries(b.utm).slice(0, 10).map(([k, v]) => [s(k, 30), s(v)])) : {},
      page: s(b.page, 300), userAgent: s(req.headers["user-agent"], 300), at: new Date(),
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
};
