import { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../lib/db';
import { getUserTierFromMongo } from '../../lib/subscription';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const addressParam = req.query.address || req.headers['x-address'];
    const address = (Array.isArray(addressParam) ? addressParam[0] : addressParam || '').toLowerCase();

    if (!address) {
      return res.status(400).json({ error: 'Address required' });
    }

    const db = await getDb();

    // Check user's subscription tier
    const tier = await getUserTierFromMongo(address);

    if (tier < 2) {
      return res.status(403).json({ error: 'Tier 2 subscription required' });
    }

    // Get events data from MongoDB
    const eventsData = await db.collection('events').findOne({ type: 'latest' });

    // Get market data for additional context
    const marketData = await db.collection('screener_cache').findOne({ key: 'market_latest' });

    // Get latest subscription info for the user
    const subscriptionInfo = await db.collection('subscription_events').findOne(
      { subscriber: address.toLowerCase() },
      { sort: { timestamp: -1 } }
    );

    const response = {
      status: 'success',
      tier: 2,
      data: {
        events: eventsData?.events || [],
        marketData: marketData?.data || [],
        subscription: subscriptionInfo,
        timestamp: new Date()
      }
    };

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('Tier 2 API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
