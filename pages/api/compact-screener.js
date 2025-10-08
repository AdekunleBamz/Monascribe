const { MongoClient } = require('mongodb');
const { fetchTrendingFromCoingecko, fetchEnvioMetrics } = require('../../lib/fetchers');

const MONGO_URI = process.env.MONGODB_URI;
const DBNAME = process.env.MONGODB_DB || 'monascribe';

export default async function handler(req, res) {
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(DBNAME);

    const [market, onchain] = await Promise.all([
      fetchTrendingFromCoingecko(),
      fetchEnvioMetrics(),
    ]);

    // Get latest subscription data for context
    const latestSubs = await db
      .collection("subscription_events")
      .find({ type: 'subscribed' })
      .sort({ timestamp: -1 })
      .limit(5)
      .toArray();

    const combined = market.map((coin) => ({
      ...coin,
      onchain: {
        blockHeight: 'N/A', // Would need actual Envio network stats
        txCount: latestSubs.length,
        tps: 'N/A',
        gasUsed: 'N/A',
        validators: 'N/A'
      },
      subscriptionCount: latestSubs.length
    }));

    await client.close();

    return res.status(200).json({
      status: "ok",
      data: combined,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Compact screener API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
