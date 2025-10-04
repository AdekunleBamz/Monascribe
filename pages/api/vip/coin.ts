import { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../../lib/db';
import { getUserTierFromMongo } from '../../../lib/subscription';

const BASE = process.env.COINGECKO_BASE || 'https://api.coingecko.com/api/v3';

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  try {
    const addressParam = req.query.address || req.headers['x-address'];
    const address = (Array.isArray(addressParam) ? addressParam[0] : addressParam || '').toLowerCase();
    
    const coinIdParam = req.query.id;
    const coinId = Array.isArray(coinIdParam) ? coinIdParam[0] : coinIdParam;

    if(!coinId) return res.status(400).json({ error: 'id required' });

    const db = await getDb();
    const tier = await getUserTierFromMongo(address);
    if(tier < 3) return res.status(403).json({ error: 'VIP only' });

    // Check cache
    const cached = await db.collection('vip_coin_cache').findOne({ id: coinId });
    const TTL_MS = 1000 * 60 * 60 * 6; // 6 hours
    const now = Date.now();
    if(cached && (now - cached.fetchedAt) < TTL_MS){
      return res.status(200).json({ cached: true, data: cached.data });
    }

    // Fetch from CoinGecko (detailed)
    const r = await fetch(`${BASE}/coins/${encodeURIComponent(coinId as string)}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true&sparkline=false`);
    if(!r.ok) return res.status(502).json({ error: 'coingecko error ' + r.status });
    const data = await r.json();

    await db.collection('vip_coin_cache').updateOne(
      { id: coinId },
      { $set: { id: coinId, data, fetchedAt: Date.now() } },
      { upsert: true }
    );

    return res.status(200).json({ cached: false, data });
  } catch (e: any) {
    console.error('vip coin api error:', e);
    return res.status(500).json({ error: 'server error' });
  }
}
