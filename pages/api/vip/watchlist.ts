import { NextApiRequest, NextApiResponse } from 'next';
import { addToWatchlist, removeFromWatchlist } from '../../../lib/vipTierFeatures';
import { withSubscriptionAccess } from '../../../lib/subscriptionTiers';

async function handler(req: NextApiRequest, res: NextApiResponse, user: { address: string, subscription: any }) {
  try {
    if (req.method === 'POST') {
      const { type, identifier, name } = req.body;
      
      if (!type || !identifier || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const itemId = await addToWatchlist({
        userId: user.address,
        type,
        identifier,
        name,
        alerts: {
          priceChange: 10,
          volumeSpike: 50,
          whaleActivity: true
        }
      });
      
      res.status(200).json({
        success: true,
        itemId,
        message: 'Item added to watchlist'
      });
    } else if (req.method === 'DELETE') {
      const { itemId } = req.body;
      
      if (!itemId) {
        return res.status(400).json({ error: 'Missing itemId' });
      }
      
      await removeFromWatchlist(itemId);
      
      res.status(200).json({
        success: true,
        message: 'Item removed from watchlist'
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Watchlist API error:', error);
    res.status(500).json({ error: error.message });
  }
}

export default withSubscriptionAccess('vip', handler);
