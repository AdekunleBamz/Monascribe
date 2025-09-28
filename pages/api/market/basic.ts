import type { NextApiRequest, NextApiResponse } from 'next'
import { withSubscriptionAccess } from '../../../lib/subscriptionTiers'
import { getLatestMarketData, fetchMarketData, saveMarketData, isDataFresh } from '../../../lib/coingecko'

async function handler(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    // Get cached data first
    let marketData = await getLatestMarketData()
    
    // If no cached data or data is stale, fetch fresh data
    if (!marketData) {
      console.log('📊 No cached market data, fetching fresh data...')
      marketData = await fetchMarketData(['bitcoin', 'ethereum', 'monad'])
      await saveMarketData(marketData)
    }

    // Basic tier: Only BTC, ETH, MON
    const basicData = {
      bitcoin: marketData.bitcoin || {
        usd: 0,
        usd_market_cap: 0,
        usd_24h_change: 0,
        usd_24h_vol: 0,
        last_updated_at: Date.now()
      },
      ethereum: marketData.ethereum || {
        usd: 0,
        usd_market_cap: 0,
        usd_24h_change: 0,
        usd_24h_vol: 0,
        last_updated_at: Date.now()
      },
      monad: marketData.monad || {
        usd: 0,
        usd_market_cap: 0,
        usd_24h_change: 0,
        usd_24h_vol: 0,
        last_updated_at: Date.now()
      }
    }

    // Add simple sentiment indicator
    const sentiment = calculateBasicSentiment(basicData)

    res.status(200).json({
      tier: 'basic',
      data: basicData,
      sentiment,
      lastUpdated: new Date().toISOString(),
      plan: user.subscription.planId
    })
  } catch (error: any) {
    console.error('Basic market data error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch market data',
      message: error.message 
    })
  }
}

function calculateBasicSentiment(data: any): string {
  const changes = [
    data.bitcoin.usd_24h_change || 0,
    data.ethereum.usd_24h_change || 0,
    data.monad.usd_24h_change || 0
  ]
  
  const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length
  
  if (avgChange > 5) return 'bullish'
  if (avgChange < -5) return 'bearish'
  return 'neutral'
}

export default withSubscriptionAccess('basic', handler)

