import { NextApiRequest, NextApiResponse } from 'next';
import { getBasicTierData } from '../../../lib/basicTierFeatures';
import { withSubscriptionAccess } from '../../../lib/subscriptionTiers';

async function handler(req: NextApiRequest, res: NextApiResponse, user: { address: string, subscription: any }) {
  try {
    const data = await getBasicTierData();
    
    res.status(200).json({
      tier: 'basic',
      data,
      lastUpdated: new Date().toISOString(),
      plan: user.subscription.planId
    });
  } catch (error: any) {
    console.error('Basic features API error:', error);
    res.status(500).json({ error: error.message });
  }
}

export default withSubscriptionAccess('basic', handler);
