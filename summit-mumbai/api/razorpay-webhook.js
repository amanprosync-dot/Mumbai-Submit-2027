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

    if ((paid || failed) && email) {
      const match = { email }; // match on payer email only
      // paid: mark the latest unpaid registration; failed: just record it, never downgrade a paid one
      const upd = paid
        ? { $set: { paid: true, paymentStatus: "paid", paidAt: now, paymentId: pay.id || null, amountPaid: (pay.amount || link.amount_paid || 0) / 100, updatedAt: now } }
        : { $set: { paymentStatus: "failed", lastPaymentFailedAt: now, updatedAt: now } };
      await d.collection("registrations").findOneAndUpdate({ ...match, paid: false }, upd, { sort: { lastSubmittedAt: -1 } });
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
};
module.exports.config = { api: { bodyParser: false } };
