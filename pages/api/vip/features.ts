import { NextApiRequest, NextApiResponse } from 'next';
import { getVIPTierData, searchWallet } from '../../../lib/vipTierFeatures';
import { withSubscriptionAccess } from '../../../lib/subscriptionTiers';

async function handler(req: NextApiRequest, res: NextApiResponse, user: { address: string, subscription: any }) {
  try {
    const { action, walletAddress } = req.query;
    
    if (action === 'search-wallet' && walletAddress) {
      const walletData = await searchWallet(walletAddress as string);
      
      if (!walletData) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
      
      return res.status(200).json({
        tier: 'vip',
        action: 'search-wallet',
        data: walletData,
        lastUpdated: new Date().toISOString(),
        plan: user.subscription.planId
      });
    }
    
    // Default: get all VIP tier data
    const data = await getVIPTierData(user.address);
    
    res.status(200).json({
      tier: 'vip',
      data,
      lastUpdated: new Date().toISOString(),
      plan: user.subscription.planId
    });
  } catch (error: any) {
    console.error('VIP features API error:', error);
    res.status(500).json({ error: error.message });
  }
}

export default withSubscriptionAccess('vip', handler);
