// Razorpay -> Settings -> Webhooks: URL https://<your-domain>/api/razorpay-webhook
// Events: payment_link.paid, payment.captured, payment.failed. Set RAZORPAY_WEBHOOK_SECRET to the same secret.
const crypto = require("crypto");
const db = require("./_db");

const raw = (req) => new Promise((ok, no) => { const c = []; req.on("data", (x) => c.push(x)); req.on("end", () => ok(Buffer.concat(c))); req.on("error", no); });

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const body = await raw(req);
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const sig = req.headers["x-razorpay-signature"] || "";
    const expected = crypto.createHmac("sha256", secret || "").update(body).digest("hex");
    if (!secret || sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
      return res.status(401).end();

    const evt = JSON.parse(body.toString("utf8"));
    const pay = evt.payload?.payment?.entity || {};
    const link = evt.payload?.payment_link?.entity || {};
    const email = String(pay.email || link.customer?.email || "").toLowerCase();
    const phone10 = String(pay.contact || link.customer?.contact || "").replace(/\D/g, "").slice(-10);
    const paid = evt.event === "payment_link.paid" || evt.event === "payment.captured";
    const failed = evt.event === "payment.failed";
    const d = await db();
    const now = new Date();

    await d.collection("payments").insertOne({ event: evt.event, paymentId: pay.id || null, linkId: link.id || null, amount: (pay.amount || link.amount_paid || 0) / 100, status: pay.status || link.status || null, email, phone10, receivedAt: now, raw: evt });

    if ((paid || failed) && (email || phone10.length === 10)) {
      // paid: mark the latest unpaid registration; failed: just record it, never downgrade a paid one
      const upd = paid
        ? { $set: { paid: true, paymentStatus: "paid", paidAt: now, paymentId: pay.id || null, amountPaid: (pay.amount || link.amount_paid || 0) / 100, webhookConfirmed: true, updatedAt: now } }
        : { $set: { paymentStatus: "failed", lastPaymentFailedAt: now, updatedAt: now } };
      // The payer can edit the prefilled email/phone on the Razorpay page, so try email first, then fall back to phone
      const tries = [];
      if (email) tries.push({ email });
      if (phone10.length === 10) tries.push({ phone10 });
      let matched = false;
      for (const m of tries) {
        const r = await d.collection("registrations").findOneAndUpdate({ ...m, paid: false }, upd, { sort: { lastSubmittedAt: -1 } });
        if (r && (r.value ?? r)) { matched = true; break; }
      }
      // The thank-you page fallback may have marked it paid first: the webhook is the source of truth, so overwrite with real values
      if (paid && !matched) {
        for (const m of tries) {
          const r = await d.collection("registrations").findOneAndUpdate({ ...m, paid: true, paymentSource: "thankyou" }, { $set: { ...upd.$set, paymentSource: "webhook", paymentVerified: true } }, { sort: { lastSubmittedAt: -1 } });
          if (r && (r.value ?? r)) { matched = true; break; }
        }
      }
      // Already-paid registration (e.g. an earlier/test payment marked it paid) and this is a NEW payment:
      // record its id and real amount on the latest registration instead of dropping it, so revenue stays correct.
      if (paid && !matched && pay.id) {
        for (const m of tries) {
          const r = await d.collection("registrations").findOneAndUpdate({ ...m, paid: true, paymentId: { $ne: pay.id } }, upd, { sort: { lastSubmittedAt: -1 } });
          if (r && (r.value ?? r)) break;
        }
      }
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
};
module.exports.config = { api: { bodyParser: false } };
