const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;
const DBNAME = process.env.MONGODB_DB || 'monascribe';

export default async function handler(req, res) {
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(DBNAME);

    const subs = await db
      .collection("subscription_events")
      .find({})
      .sort({ timestamp: -1 })
      .limit(5)
      .toArray();

    await client.close();

    return res.status(200).json({
      status: "ok",
      data: subs,
      count: subs.length,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Compact subscription API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
