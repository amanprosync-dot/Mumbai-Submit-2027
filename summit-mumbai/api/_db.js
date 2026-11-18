const { MongoClient } = require("mongodb");
let cached;
module.exports = async function db() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not set");
  if (!cached) cached = new MongoClient(process.env.MONGODB_URI, { maxPoolSize: 5 }).connect();
  return (await cached).db(process.env.MONGODB_DB || "summit_mumbai_2027");
};
module.exports.PASSES = ["Women", "Men", "Couple", "VIP", "VIP Couple"];
module.exports.PRICES = { Women: 4995, Men: 5995, Couple: 9995, VIP: 9995, "VIP Couple": 14995 }; // INR, keep in sync with index.html
module.exports.COUPLE_PASSES = ["Couple", "VIP Couple"];
