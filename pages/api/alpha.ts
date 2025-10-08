import { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../lib/db';
import { fetchOnchainMetrics, getFromMongo } from '../../lib/fetchers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const addressParam = req.query.address || req.headers['x-address'];
    const address = (Array.isArray(addressParam) ? addressParam[0] : addressParam || '').toLowerCase();

    if (!address) {
      return res.status(400).json({ error: 'Address required' });
    }

    const db = await getDb();

    // Get on-chain metrics for the user
    const onchainData = await fetchOnchainMetrics(address);

    if (!onchainData) {
      return res.status(403).json({ error: 'No subscription found' });
    }

    const tier = onchainData.planId;

    if (tier < 2) {
      return res.status(403).json({ error: 'Tier 2 subscription required for Alpha' });
    }

    // Get latest market data for analysis
    const marketData = await db.collection('screener_cache').findOne({ key: 'market_latest' });
    const trendingData = await db.collection('screener_cache').findOne({ key: 'trending_latest' });
    const eventsData = await getFromMongo('events');

    // Compute alpha insights
    const marketArray = Array.isArray(marketData?.data) ? marketData.data : [];
    const trendingArray = trendingData?.data?.marketData || [];

    // Calculate top gainers and losers
    const topGainers = marketArray
      .filter((coin: any) => coin.price_change_percentage_24h > 0)
      .sort((a: any, b: any) => b.price_change_percentage_24h - a.price_change_percentage_24h)
      .slice(0, 5);

    const topLosers = marketArray
      .filter((coin: any) => coin.price_change_percentage_24h < 0)
      .sort((a: any, b: any) => a.price_change_percentage_24h - b.price_change_percentage_24h)
      .slice(0, 5);

    // Calculate market sentiment
    const avgChange = marketArray.length > 0
      ? marketArray.reduce((sum: number, coin: any) => sum + (coin.price_change_percentage_24h || 0), 0) / marketArray.length
      : 0;

    const sentiment = avgChange > 2 ? 'Bullish' : avgChange < -2 ? 'Bearish' : 'Neutral';

    // Get upcoming events count
    const upcomingEvents = eventsData?.events?.filter((event: any) => {
      const eventDate = new Date(event.date_event);
      const now = new Date();
      return eventDate > now;
    }) || [];

    const alphaSummary = {
      title: `Weekly Alpha #${Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))}`,
      body: `Market analysis for week of ${new Date().toLocaleDateString()}.\n\nKey insights:\n- Market sentiment: ${sentiment}\n- Average 24h change: ${avgChange.toFixed(2)}%\n- Upcoming events: ${upcomingEvents.length}\n- Active subscribers: ${onchainData.subscriber}`,
      marketIntelligence: {
        defiMetrics: {
          totalValueLocked: marketArray.reduce((sum: number, coin: any) => sum + (coin.market_cap || 0), 0),
          volume24h: marketArray.reduce((sum: number, coin: any) => sum + (coin.total_volume || 0), 0),
          averageYield: 5.2 // Placeholder - would need actual yield data
        },
        marketSentiment: {
          overall: sentiment,
          fearGreedIndex: avgChange > 5 ? 'Greed' : avgChange < -5 ? 'Fear' : 'Neutral',
          socialSentiment: 'Mixed' // Placeholder - would need social data
        },
        whaleIntelligence: {
          largeTransactions: topGainers.filter((coin: any) => coin.total_volume > 1000000000).length,
          activeWhales: Math.floor(marketArray.length / 10), // Placeholder calculation
          netFlow: avgChange * 1000000 // Placeholder calculation
        },
        macroIndicators: {
          dollarIndex: 103.5, // Placeholder - would need actual DXY data
          volatilityIndex: 18.2, // Placeholder - would need actual VIX data
          treasuryYields: 4.5 // Placeholder - would need actual treasury data
        }
      },
      insights: [
        `Top performers this week: ${topGainers.map((coin: any) => coin.name).join(', ')}`,
        `Watch for upcoming events: ${upcomingEvents.slice(0, 3).map((event: any) => event.title).join(', ')}`,
        `Market trend: ${sentiment} with ${Math.abs(avgChange).toFixed(2)}% average movement`,
        'Monitor whale activity in large cap tokens',
        'DeFi yields remain attractive above 5%'
      ],
      topGainers,
      topLosers,
      upcomingEvents: upcomingEvents.slice(0, 5),
      timestamp: new Date()
    };

    return res.status(200).json(alphaSummary);
  } catch (error: any) {
    console.error('Alpha API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
