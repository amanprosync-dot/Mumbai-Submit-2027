// Sends a signed, Razorpay-shaped test event to YOUR OWN webhook endpoint (api/razorpay-webhook.js).
//
// Usage (PowerShell):
//   $env:RAZORPAY_WEBHOOK_SECRET = "<same secret you set in Razorpay + Vercel>"
//   node scripts/test-razorpay-webhook.js --url https://YOUR-DOMAIN/api/razorpay-webhook --email test@example.com --phone 9876543210 --amount 15995
//
// Options: --event payment_link.paid | payment.captured | payment.failed   (default payment_link.paid)
//          --name "Test User"
// The email/phone must match a registration submitted through the form, otherwise nothing is marked paid.
// Note: this writes a real row to the "payments" collection of whatever database the target uses.
const crypto = require("crypto");

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > -1 ? process.argv[i + 1] : d; };
const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
const url = arg("url");
if (!secret || !url) { console.error("Set RAZORPAY_WEBHOOK_SECRET and pass --url"); process.exit(1); }

const event = arg("event", "payment_link.paid");
const email = arg("email", "test@example.com");
const phone = "+91" + arg("phone", "9876543210").replace(/\D/g, "").slice(-10);
const name = arg("name", "Test User");
const amountPaise = Math.round(Number(arg("amount", "15995")) * 100);
const rid = (p) => p + crypto.randomBytes(7).toString("base64url").replace(/[-_]/g, "x").slice(0, 14);
const now = Math.floor(Date.now() / 1000);

const payment = {
  entity: {
    id: rid("pay_"), entity: "payment", amount: amountPaise, currency: "INR",
    status: event === "payment.failed" ? "failed" : "captured", order_id: rid("order_"),
    method: "upi", captured: event !== "payment.failed", description: "#" + rid("").slice(0, 8),
    email, contact: phone, created_at: now,
  },
};
const body = {
  entity: "event", account_id: "acc_TEST000000000", event, contains: ["payment"], created_at: now,
  payload: { payment },
};
if (event === "payment_link.paid") {
  body.contains = ["payment_link", "order", "payment"];
  body.payload.payment_link = {
    entity: {
      id: rid("plink_"), entity: "payment_link", amount: amountPaise, amount_paid: amountPaise, currency: "INR",
      status: "paid", customer: { name, email, contact: phone }, created_at: now, short_url: "https://rzp.io/rzp/TEST",
    },
  };
}

const raw = JSON.stringify(body);
const signature = crypto.createHmac("sha256", secret).update(raw).digest("hex");

fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "X-Razorpay-Signature": signature }, body: raw })
  .then(async (r) => console.log(r.status, await r.text()))
  .catch((e) => { console.error(e); process.exit(1); });
