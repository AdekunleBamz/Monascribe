import { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../lib/db';
import { fetchTrendingCoins, fetchOnchainMetrics } from '../../lib/fetchers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const addressParam = req.query.address || req.headers['x-address'];
    const address = (Array.isArray(addressParam) ? addressParam[0] : addressParam || '').toLowerCase();

    if (!address) {
      return res.status(400).json({ error: 'Address required' });
    }

    const db = await getDb();

    // Get trending coins data
    const trendingData = await db.collection('screener_cache').findOne({ key: 'trending_latest' });

    // Get on-chain metrics for the user
    const onchainData = await fetchOnchainMetrics(address);

    if (!onchainData) {
      return res.status(403).json({ error: 'No subscription found' });
    }

    const tier = onchainData.planId;

    if (tier < 1) {
      return res.status(403).json({ error: 'Tier 1 subscription required' });
    }

    const response = {
      status: 'success',
      tier: 1,
      data: {
        trending: trendingData?.data?.trending || [],
        marketData: trendingData?.data?.marketData || [],
        onchain: onchainData,
        timestamp: new Date()
      }
    };

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('Tier 1 API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
