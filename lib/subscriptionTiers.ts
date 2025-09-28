// Subscription tier definitions and access control
export interface SubscriptionPlan {
  id: number
  name: string
  price: number
  features: string[]
  apiAccess: {
    basic: boolean
    premium: boolean
    vip: boolean
  }
}

export const SUBSCRIPTION_PLANS: Record<number, SubscriptionPlan> = {
  1: {
    id: 1,
    name: "Basic Newsletter",
    price: 0,
    features: [
      "Basic market data (BTC, ETH, MON)",
      "24h price changes",
      "Simple sentiment indicator",
      "Weekly newsletter"
    ],
    apiAccess: {
      basic: true,
      premium: false,
      vip: false
    }
  },
  2: {
    id: 2,
    name: "Premium Analytics",
    price: 29,
    features: [
      "Everything in Basic",
      "Top 10 coins by market cap",
      "Trending coins",
      "7-day historical charts",
      "Advanced analytics",
      "Real-time alerts"
    ],
    apiAccess: {
      basic: true,
      premium: true,
      vip: false
    }
  },
  3: {
    id: 3,
    name: "VIP Intelligence",
    price: 99,
    features: [
      "Everything in Premium",
      "Search any coin",
      "Detailed market data",
      "Full descriptions & links",
      "30-day sparkline charts",
      "Custom alerts",
      "Priority support",
      "API access"
    ],
    apiAccess: {
      basic: true,
      premium: true,
      vip: true
    }
  }
}

export function getPlanById(planId: number): SubscriptionPlan | null {
  return SUBSCRIPTION_PLANS[planId] || null
}

export function hasAccess(planId: number, tier: 'basic' | 'premium' | 'vip'): boolean {
  const plan = getPlanById(planId)
  if (!plan) return false
  
  return plan.apiAccess[tier]
}

export function getPlanName(planId: number): string {
  const plan = getPlanById(planId)
  return plan?.name || 'Unknown Plan'
}

export function getPlanPrice(planId: number): number {
  const plan = getPlanById(planId)
  return plan?.price || 0
}

export function getPlanFeatures(planId: number): string[] {
  const plan = getPlanById(planId)
  return plan?.features || []
}

// Middleware function to check subscription access
export function withSubscriptionAccess(
  requiredTier: 'basic' | 'premium' | 'vip',
  handler: (req: any, res: any, user: any) => Promise<void>
) {
  return async (req: any, res: any) => {
    try {
      const { address } = req.query
      
      if (!address) {
        return res.status(400).json({ error: 'Address required' })
      }

      // Get user's subscription status
      const { getSubscriptionStatusIndexed } = await import('./indexer')
      const subscription = await getSubscriptionStatusIndexed(address as `0x${string}`)
      
      if (!subscription || !subscription.isActive) {
        return res.status(403).json({ 
          error: 'Active subscription required',
          requiredTier,
          currentPlan: 'None'
        })
      }

      // Check if user has access to required tier
      if (!hasAccess(subscription.planId, requiredTier)) {
        const currentPlan = getPlanName(subscription.planId)
        return res.status(403).json({ 
          error: `Upgrade required for ${requiredTier} access`,
          requiredTier,
          currentPlan,
          upgradeTo: requiredTier === 'premium' ? 'Premium Analytics' : 'VIP Intelligence'
        })
      }

      // User has access, proceed with handler
      await handler(req, res, { address, subscription })
      
    } catch (error: any) {
      console.error('Subscription access check failed:', error)
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      })
    }
  }
}

// Get user's current plan info
export async function getUserPlanInfo(address: string) {
  try {
    const { getSubscriptionStatusIndexed } = await import('./indexer')
    const subscription = await getSubscriptionStatusIndexed(address as `0x${string}`)
    
    if (!subscription || !subscription.isActive) {
      return {
        isActive: false,
        plan: null,
        features: [],
        access: {
          basic: false,
          premium: false,
          vip: false
        }
      }
    }

    const plan = getPlanById(subscription.planId)
    
    return {
      isActive: true,
      plan,
      features: plan?.features || [],
      access: plan?.apiAccess || {
        basic: false,
        premium: false,
        vip: false
      },
      expiresAt: subscription.expiresAt
    }
  } catch (error) {
    console.error('Failed to get user plan info:', error)
    return {
      isActive: false,
      plan: null,
      features: [],
      access: {
        basic: false,
        premium: false,
        vip: false
      }
    }
  }
}

