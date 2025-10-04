import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h');
    if (!r.ok) return res.status(r.status).json({ error: 'coingecko error' });
    const data = await r.json();
    const sorted = data
      .filter((c: any) => typeof c?.price_change_percentage_24h === 'number')
      .sort((a: any, b: any) => (a.price_change_percentage_24h - b.price_change_percentage_24h))
      .slice(0, 10);
    return res.status(200).json({ source: 'coingecko', data: sorted });
  } catch (e: any) {
    return res.status(500).json({ error: 'server error' });
  }
}


