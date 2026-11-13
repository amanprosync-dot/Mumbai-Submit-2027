const { MongoClient } = require("mongodb");
let cached;
module.exports = async function db() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not set");
  if (!cached) cached = new MongoClient(process.env.MONGODB_URI, { maxPoolSize: 5 }).connect();
  return (await cached).db(process.env.MONGODB_DB || "summit_mumbai_2027");
};
module.exports.PASSES = ["Women", "Men", "Couple", "VIP"];
