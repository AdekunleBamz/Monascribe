import { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../lib/db';
import { fetchOnchainMetrics } from '../../lib/fetchers';

const COINGECKO_BASE = process.env.COINGECKO_BASE || 'https://api.coingecko.com/api/v3';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const addressParam = req.query.address || req.headers['x-address'];
    const address = (Array.isArray(addressParam) ? addressParam[0] : addressParam || '').toLowerCase();
    const { q } = req.query;

    if (!address) {
      return res.status(400).json({ error: 'Address required' });
    }

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query required' });
    }

    const db = await getDb();

    // Get on-chain metrics for the user
    const onchainData = await fetchOnchainMetrics(address);

    if (!onchainData) {
      return res.status(403).json({ error: 'No subscription found' });
    }

    const tier = onchainData.planId;

    if (tier < 3) {
      return res.status(403).json({ error: 'Tier 3 subscription required' });
    }

    // Search for coins
    const searchResp = await fetch(`${COINGECKO_BASE}/search?query=${encodeURIComponent(q)}`);
    if (!searchResp.ok) throw new Error('CoinGecko search failed ' + searchResp.status);
    const searchData = await searchResp.json();

    if (!searchData.coins || searchData.coins.length === 0) {
      return res.status(200).json({ status: 'success', tier: 3, data: [], query: q });
    }

    // Get detailed data for found coins
    const ids = searchData.coins.slice(0, 10).map((c: any) => c.id).join(',');
    const marketsResp = await fetch(`${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false`);
    if (!marketsResp.ok) throw new Error('CoinGecko markets failed ' + marketsResp.status);
    const marketsData = await marketsResp.json();

    const response = {
      status: 'success',
      tier: 3,
      data: marketsData.map((coin: any) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        image: coin.image,
        current_price: coin.current_price,
        market_cap: coin.market_cap,
        market_cap_rank: coin.market_cap_rank,
        price_change_24h: coin.price_change_24h,
        price_change_percentage_24h: coin.price_change_percentage_24h,
        total_volume: coin.total_volume
      })),
      query: q,
      onchain: onchainData,
      timestamp: new Date()
    };

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('Tier 3 API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
