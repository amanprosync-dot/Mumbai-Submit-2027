const db = require("./_db");
const { isAdmin } = require("./_auth");

module.exports = async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ ok: false });
  try {
    const d = await db();
    const regs = await d.collection("registrations").find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(5000).toArray();
    const ev = await d.collection("events").aggregate([
      { $match: { pass: { $ne: null } } },
      { $group: { _id: { pass: "$pass", event: "$event" }, sessions: { $addToSet: "$sessionId" } } },
      { $project: { _id: 0, pass: "$_id.pass", event: "$_id.event", n: { $size: "$sessions" } } },
    ]).toArray();
    const recent = await d.collection("events").find({}, { projection: { _id: 0, event: 1, pass: 1, at: 1, email: 1 } }).sort({ at: -1 }).limit(100).toArray();
    const byPass = db.PASSES.map((p) => {
      const g = (e) => (ev.find((x) => x.pass === p && x.event === e) || {}).n || 0;
      const r = regs.filter((x) => x.pass === p);
      return { pass: p, clicks: g("pass_click"), selected: g("pass_selected"), registered: r.length, paid: r.filter((x) => x.paid).length, revenue: r.reduce((s, x) => s + (x.amountPaid || 0), 0) };
    });
    res.status(200).json({
      ok: true,
      totals: { registered: regs.length, paid: regs.filter((x) => x.paid).length, revenue: byPass.reduce((s, x) => s + x.revenue, 0) },
      byPass, regs, recent,
    });
  } catch (e) { console.error(e); res.status(500).json({ ok: false }); }
};
