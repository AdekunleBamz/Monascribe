// pages/api/alpha.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  try {
    const db = await getDb();
    const alpha = await db.collection('weekly_alpha').findOne({ key: 'latest' });
    const news = await db.collection('news_cache').findOne({ key: 'latest' });
    return res.status(200).json({ alpha: alpha?.data || null, news: news?.data || null });
  } catch (e: any) {
    console.error('alpha api error:', e);
    return res.status(500).json({ error: 'server error' });
  }
}
