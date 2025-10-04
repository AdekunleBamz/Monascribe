import type { NextApiRequest, NextApiResponse } from 'next'
import { withSubscriptionAccess } from '../../../lib/subscriptionTiers'

async function handler(req: NextApiRequest, res: NextApiResponse, _user: any) {
  const { q } = req.query;
  if (!q || typeof q !== 'string') return res.status(400).json({ error: 'q is required' });
  try {
    // 1) search
    const s = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(q)}`);
    if (!s.ok) return res.status(s.status).json({ error: 'coingecko error (search)' });
    const sjson = await s.json();
    const ids: string[] = (sjson?.coins || []).slice(0, 10).map((c: any) => c.id);
    if (ids.length === 0) return res.status(200).json({ source: 'coingecko', data: [] });
    // 2) details for each coin id
    const results = await Promise.all(ids.map(async (id) => {
      const r = await fetch(`https://api.coingecko.com/api/v3/coins/${id}?localization=false&sparkline=true&community_data=false&developer_data=false`);
      if (!r.ok) return null;
      const d = await r.json();
      return {
        id: d.id,
        symbol: d.symbol,
        name: d.name,
        market_data: {
          current_price: { usd: d.market_data?.current_price?.usd || 0 },
          market_cap: { usd: d.market_data?.market_cap?.usd || 0 },
          total_volume: { usd: d.market_data?.total_volume?.usd || 0 },
          price_change_percentage_24h: d.market_data?.price_change_percentage_24h || 0,
          price_change_percentage_7d: d.market_data?.price_change_percentage_7d_in_currency?.usd || 0,
          price_change_percentage_30d: d.market_data?.price_change_percentage_30d_in_currency?.usd || 0,
        },
        description: { en: d.description?.en || '' },
        links: d.links || {},
        sparkline_7d: d.market_data?.sparkline_7d?.price || [],
        image: d.image || {},
      };
    }));
    const filtered = results.filter(Boolean);
    return res.status(200).json({ source: 'coingecko', data: filtered });
  } catch (e: any) {
    return res.status(500).json({ error: 'server error' });
  }
}

export default withSubscriptionAccess('vip', handler)


