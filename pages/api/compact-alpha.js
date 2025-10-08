const { fetchCoinMarketCalEvents, fetchCoinPanicNews, fetchEnvioMetrics } = require('../../lib/fetchers');

export default async function handler(req, res) {
  try {
    const [events, news, envio] = await Promise.all([
      fetchCoinMarketCalEvents(),
      fetchCoinPanicNews(),
      fetchEnvioMetrics(),
    ]);

    // Calculate sentiment based on recent events and news
    const sentiment = events.length > 3 ? 'Bullish' : events.length > 1 ? 'Mixed' : 'Bearish';

    // Get subscription stats from Envio data
    const activeSubs = envio.SubscriptionService_Subscribed?.length || 0;
    const cancelledSubs = envio.SubscriptionService_SubscriptionCancelled?.length || 0;

    const insights = {
      sentiment,
      totalEvents: events.length,
      recentNews: news.map(n => ({
        title: n.title,
        url: n.description, // Using description as URL since that's what the API returns
        source: 'CryptoPanic'
      })),
      subscriptionStats: {
        active: activeSubs,
        cancelled: cancelledSubs,
        net: activeSubs - cancelledSubs
      },
      network: envio,
      timestamp: new Date()
    };

    return res.status(200).json({
      status: "ok",
      data: insights
    });
  } catch (error) {
    console.error('Compact alpha API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
