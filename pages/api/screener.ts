import { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../lib/db';

const COINGECKO_BASE = process.env.COINGECKO_BASE || 'https://api.coingecko.com/api/v3';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { tier, q } = req.query;

  try {
    if (tier === 'tier1') {
      const resp = await fetch(`${COINGECKO_BASE}/search/trending`);
      if (!resp.ok) throw new Error('Failed to fetch trending data from CoinGecko');
      const data = await resp.json();
      
      const formatted = data.coins.map((c: any) => ({
        id: c.item.id,
        name: c.item.name,
        symbol: c.item.symbol.toUpperCase(),
        logo: c.item.small,
        price: c.item.data?.price || 'N/A'
      }));
      return res.status(200).json(formatted);
    }

    if (tier === 'tier2') {
      const db = await getDb();
      // NOTE: This assumes a cron job is populating 'alpha_events'
      const events = await db.collection('alpha_events').find().sort({ date_event: -1 }).limit(50).toArray();
      return res.status(200).json(events);
    }

    if (tier === 'tier3') {
      if (!q || typeof q !== 'string' || q.length < 3) {
        return res.status(200).json([]);
      }
      
      const searchResp = await fetch(`${COINGECKO_BASE}/search?query=${q}`);
      if (!searchResp.ok) throw new Error('Failed to search coins from CoinGecko');
      const searchData = await searchResp.json();

      if (!searchData.coins || searchData.coins.length === 0) {
        return res.status(200).json([]);
      }

      const ids = searchData.coins.slice(0, 10).map((c: any) => c.id).join(',');
      const marketsResp = await fetch(`${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false`);
      if (!marketsResp.ok) throw new Error('Failed to fetch market data from CoinGecko');
      const marketsData = await marketsResp.json();

      const formatted = marketsData.map((c: any) => ({
        id: c.id,
        name: c.name,
        symbol: c.symbol.toUpperCase(),
        logo: c.image,
        price: c.current_price
      }));
      
      return res.status(200).json(formatted);
    }

    return res.status(400).json({ error: 'Invalid tier specified' });

  } catch (error: any) {
    console.error('API Screener Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
