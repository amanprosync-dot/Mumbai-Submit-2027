// Fallback payment recording: called by thank-you.html after Razorpay redirects the payer back.
// The Razorpay webhook is the primary source; if a webhook payment already exists for this person, this does nothing.
// Needs the Razorpay callback params (razorpay_payment_id + payment_link_status=paid). If RAZORPAY_KEY_SECRET is set,
// the callback signature is verified too (strongly recommended, otherwise anyone can fake the thank-you URL).
const crypto = require("crypto");
const db = require("./_db");
const s = (v, n = 200) => String(v ?? "").trim().slice(0, n);

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const b = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const payId = s(b.razorpay_payment_id, 60);
    if (!/^pay_\w{6,40}$/.test(payId) || s(b.razorpay_payment_link_status, 20) !== "paid")
      return res.status(400).json({ ok: false, error: "not-a-paid-callback" });

    // Verify Razorpay's callback signature when we have the key secret
    const key = process.env.RAZORPAY_KEY_SECRET;
    let verified = false;
    if (key) {
      const msg = [b.razorpay_payment_link_id, b.razorpay_payment_link_reference_id, b.razorpay_payment_link_status, payId].map((x) => s(x, 80)).join("|");
      const exp = crypto.createHmac("sha256", key).update(msg).digest("hex");
      const got = s(b.razorpay_signature, 100);
      if (got.length !== exp.length || !crypto.timingSafeEqual(Buffer.from(got), Buffer.from(exp)))
        return res.status(400).json({ ok: false, error: "bad-signature" });
      verified = true;
    }

    const email = s(b.email).toLowerCase(), sid = s(b.sessionId, 64);
    if (!email && !sid) return res.status(400).json({ ok: false, error: "no-identity" });
    const d = await db();

    // Which registration? The pass the person submitted on the form (latest unpaid one for this browser session / email)
    const who = [];
    if (sid) who.push({ sessionId: sid });
    if (email) who.push({ email });
    let reg = null;
    for (const m of who) {
      reg = await d.collection("registrations").findOne({ ...m, paid: { $ne: true } }, { sort: { lastSubmittedAt: -1 } });
      if (reg) break;
    }
    if (!reg) return res.status(200).json({ ok: true, skipped: "no-unpaid-registration" });

    // Webhook has priority: if it already recorded this payment, or any paid payment for this person, do nothing
    const hook = await d.collection("payments").findOne({ event: { $in: ["payment_link.paid", "payment.captured"] }, $or: [{ paymentId: payId }, { email: reg.email }] });
    if (hook) return res.status(200).json({ ok: true, skipped: "webhook-already-recorded" });

    const amount = db.PRICES[reg.pass] || 0;
    const now = new Date();
    await d.collection("payments").updateOne(
      { event: "thankyou_confirmed", paymentId: payId },
      { $setOnInsert: { event: "thankyou_confirmed", paymentId: payId, amount, status: "paid", email: reg.email, phone10: reg.phone10, pass: reg.pass, verified, receivedAt: now } },
      { upsert: true }
    );
    await d.collection("registrations").updateOne(
      { _id: reg._id, paid: { $ne: true } },
      { $set: { paid: true, paymentStatus: "paid", paidAt: now, paymentId: payId, amountPaid: amount, paymentSource: "thankyou", paymentVerified: verified, updatedAt: now } }
    );
    res.status(200).json({ ok: true, pass: reg.pass, amount, verified });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
};
