import { NextApiRequest, NextApiResponse } from 'next';
import { getPremiumTierData, generateAnalysisNotes } from '../../../lib/premiumTierFeatures';
import { withSubscriptionAccess } from '../../../lib/subscriptionTiers';

async function handler(req: NextApiRequest, res: NextApiResponse, user: { address: string, subscription: any }) {
  try {
    const [data, analysisNotes] = await Promise.all([
      getPremiumTierData(),
      generateAnalysisNotes()
    ]);
    
    res.status(200).json({
      tier: 'premium',
      data: {
        ...data,
        analysisNotes
      },
      lastUpdated: new Date().toISOString(),
      plan: user.subscription.planId
    });
  } catch (error: any) {
    console.error('Premium features API error:', error);
    res.status(500).json({ error: error.message });
  }
}

export default withSubscriptionAccess('premium', handler);
