import { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../lib/db';
import { getUserTierFromMongo } from '../../lib/subscription';

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  try {
    const addressParam = req.query.address || req.headers['x-address'];
    const address = (Array.isArray(addressParam) ? addressParam[0] : addressParam || '').toLowerCase();

    const db = await getDb();

    const tier = await getUserTierFromMongo(address); // planId: 0|1|2|3
    // Tier mapping: 1 = Basic, 2 = Premium, 3 = VIP

    // Fetch caches commonly used to enrich UI
    const [marketDoc, trendingDoc] = await Promise.all([
      db.collection('screener_cache').findOne({ key: 'market_latest' }),
      db.collection('screener_cache').findOne({ key: 'trending_latest' }),
    ]);

    const marketArray = Array.isArray(marketDoc?.data) ? (marketDoc?.data as any[]) : [];

    // Derive market sentiment from a few top assets if present
    const byId = (id: string) => marketArray.find((c: any) => c?.id === id);
    const changes: number[] = [];
    const btc = byId('bitcoin');
    const eth = byId('ethereum');
    const mon = byId('monad');
    if (btc?.price_change_percentage_24h != null) changes.push(btc.price_change_percentage_24h);
    if (eth?.price_change_percentage_24h != null) changes.push(eth.price_change_percentage_24h);
    if (mon?.price_change_percentage_24h != null) changes.push(mon.price_change_percentage_24h);
    const avgChange = changes.length ? (changes.reduce((a, b) => a + b, 0) / changes.length) : 0;
    const marketSentiment = avgChange > 2 ? 'Bullish' : avgChange < -2 ? 'Bearish' : 'Neutral';

    // Active subscribers via last-per-subscriber logic
    const nowDate = new Date();
    const lastPerSubscriber = await db.collection('subscription_events').aggregate([
      { $sort: { timestamp: 1 } },
      { $group: { _id: '$subscriber', lastEvent: { $last: '$type' }, lastPlan: { $last: '$planId' }, lastExpires: { $last: '$expiresAt' } } },
    ]).toArray();

    const isActive = (row: any) => {
      const lastEvent = String(row?.lastEvent || '').toLowerCase();
      const expires = row?.lastExpires ? new Date(row.lastExpires) : undefined;
      return (lastEvent === 'subscribed') && (!expires || expires > nowDate);
    };

    const activeUsers = lastPerSubscriber.filter(isActive).length;
    const totalSubscribersEver = lastPerSubscriber.length;

    // Active plan popularity
    const planCountActive: Record<string, number> = {};
    for (const row of lastPerSubscriber) {
      if (!isActive(row)) continue;
      const pid = Number(row?.lastPlan ?? 0);
      if (pid > 0) planCountActive[pid] = (planCountActive[pid] || 0) + 1;
    }
    const planPopularity = Object.entries(planCountActive).map(([k, v]) => ({ _id: Number(k), subscribers: Number(v) })).sort((a, b) => b.subscribers - a.subscribers);

    // All-time plan popularity (based on last plan per subscriber)
    const planCountAll: Record<string, number> = {};
    for (const row of lastPerSubscriber) {
      const pid = Number(row?.lastPlan ?? 0);
      if (pid > 0) planCountAll[pid] = (planCountAll[pid] || 0) + 1;
    }
    const planPopularityAllTime = Object.entries(planCountAll).map(([k, v]) => ({ _id: Number(k), subscribers: Number(v) })).sort((a, b) => b.subscribers - a.subscribers);

    // New subscriptions in last 7 days
    const sevenDaysAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newSubsThisWeek = await db.collection('subscription_events').countDocuments({ type: { $in: ['Subscribed', 'subscribed'] }, timestamp: { $gte: sevenDaysAgoDate } });

    // Large transfers proxy from market total_volume
    const topByVolume = marketArray
      .filter((x: any) => x && typeof x.total_volume === 'number')
      .sort((a: any, b: any) => b.total_volume - a.total_volume)
      .slice(0, 5)
      .map((x: any) => ({ token: x.name, valueUSD: x.total_volume }));

    const rows = {
      tokenFlows: { largeTransfers: topByVolume },
      dexActivity: [],
      hotContracts: [],
      planPopularity,
      planPopularityAllTime,
      networkInfo: {
        latestBlock: '-',
        blockTime: '-',
        tps: '-',
        gasPrice: '-',
        weeklyGrowth: `${newSubsThisWeek} new subs`,
        recentTransactions: []
      },
      marketIntelligence: { sentiment: marketSentiment },
      insights: []
    } as any;

    const summary = {
      activeUsers,
      marketSentiment,
      txChangePct: Math.round(avgChange * 100) / 100,
      topToken: (marketArray[0]?.name as string) || 'BTC',
      smartMoneyScore: 0,
      whaleCount: 0,
      defiTvl: 0,
      note: 'Aggregated from CoinGecko and on-chain subscriptions',
      totalSubscribersEver
    };

    if (tier <= 1) {
      return res.status(200).json({ tier, trending: trendingDoc?.data || null, subsCount: activeUsers, summary, ...rows });
    }

    if (tier === 2) {
      const [alpha, news] = await Promise.all([
        db.collection('weekly_alpha').findOne({ key: 'latest' }),
        db.collection('news_cache').findOne({ key: 'latest' })
      ]);
      return res.status(200).json({ tier, market: marketDoc?.data || null, trending: trendingDoc?.data || null, alpha: alpha?.data || null, news: news?.data || null, subsCount: activeUsers, summary, ...rows });
    }

    // VIP and above
    {
      const [alpha, news] = await Promise.all([
        db.collection('weekly_alpha').findOne({ key: 'latest' }),
        db.collection('news_cache').findOne({ key: 'latest' })
      ]);
      return res.status(200).json({ tier: 3, market: marketDoc?.data || null, trending: trendingDoc?.data || null, alpha: alpha?.data || null, news: news?.data || null, subsCount: activeUsers, summary, ...rows });
    }
  } catch (e: any) {
    console.error('screener api error:', e);
    return res.status(500).json({ error: 'server error' });
  }
}
