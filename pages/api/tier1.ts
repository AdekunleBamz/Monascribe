import { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../lib/db';
import { getUserTierFromMongo } from '../../lib/subscription';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const addressParam = req.query.address || req.headers['x-address'];
    const address = (Array.isArray(addressParam) ? addressParam[0] : addressParam || '').toLowerCase();

    console.log('Tier 1 API - Address param:', addressParam);
    console.log('Tier 1 API - Normalized address:', address);

    if (!address) {
      return res.status(400).json({ error: 'Address required' });
    }

    const db = await getDb();

    // Check user's subscription tier
    const tier = await getUserTierFromMongo(address);
    console.log('Tier 1 API - User tier:', tier);

    if (tier < 1) {
      return res.status(403).json({ error: 'Tier 1 subscription required' });
    }

    // Get trending coins data
    const trendingData = await db.collection('screener_cache').findOne({ key: 'trending_latest' });

    // Get latest subscription info for the user
    const subscriptionInfo = await db.collection('subscription_events').findOne(
      { subscriber: address.toLowerCase() },
      { sort: { timestamp: -1 } }
    );

    const response = {
      status: 'success',
      tier: 1,
      data: {
        trending: trendingData?.data?.trending || [],
        marketData: trendingData?.data?.marketData || [],
        subscription: subscriptionInfo,
        timestamp: new Date()
      }
    };

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('Tier 1 API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
