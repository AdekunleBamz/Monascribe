const connectDB = require('../../lib/db');
const { fetchTrendingFromCoingecko, fetchEnvioMetrics } = require('../../lib/fetchers');

export default async function handler(req, res) {
  try {
    await connectDB();

    const [market, onchain] = await Promise.all([
      fetchTrendingFromCoingecko(),
      fetchEnvioMetrics(),
    ]);

    // Get latest subscription data for context
    const mongoose = require('mongoose');
    const latestSubs = await mongoose.connection
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
