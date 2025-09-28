import type { NextApiRequest, NextApiResponse } from 'next'
import { withSubscriptionAccess } from '../../../lib/subscriptionTiers'
import { 
  getLatestMarketData, 
  getLatestTrendingData,
  fetchMarketData, 
  fetchTrendingCoins,
  saveMarketData,
  saveTrendingData,
  getTop10Coins
} from '../../../lib/coingecko'

async function handler(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    // Get cached market data
    let marketData = await getLatestMarketData()
    
    // If no cached data, fetch fresh data
    if (!marketData) {
      console.log('📊 No cached market data, fetching fresh data...')
      marketData = await fetchMarketData(['bitcoin', 'ethereum', 'monad'])
      await saveMarketData(marketData)
    }

    // Get cached trending data
    let trendingData = await getLatestTrendingData()
    
    // If no cached trending data, fetch fresh data
    if (trendingData.length === 0) {
      console.log('📈 No cached trending data, fetching fresh data...')
      trendingData = await fetchTrendingCoins()
      await saveTrendingData(trendingData)
    }

    // Get top 10 coins
    const top10Coins = await getTop10Coins()

    // Premium tier: Top 10 + trending + basic data
    const premiumData = {
      basic: {
        bitcoin: marketData.bitcoin || { usd: 0, usd_market_cap: 0, usd_24h_change: 0 },
        ethereum: marketData.ethereum || { usd: 0, usd_market_cap: 0, usd_24h_change: 0 },
        monad: marketData.monad || { usd: 0, usd_market_cap: 0, usd_24h_change: 0 }
      },
      top10: top10Coins.slice(0, 10),
      trending: trendingData.slice(0, 5),
      marketCap: {
        total: top10Coins.reduce((sum, coin) => sum + coin.market_cap, 0),
        dominance: {
          bitcoin: top10Coins[0]?.market_cap || 0,
          ethereum: top10Coins[1]?.market_cap || 0
        }
      },
      charts: {
        bitcoin_7d: top10Coins.find(coin => coin.id === 'bitcoin')?.sparkline_7d || [],
        ethereum_7d: top10Coins.find(coin => coin.id === 'ethereum')?.sparkline_7d || []
      }
    }

    res.status(200).json({
      tier: 'premium',
      data: premiumData,
      lastUpdated: new Date().toISOString(),
      plan: user.subscription.planId
    })
  } catch (error: any) {
    console.error('Premium market data error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch premium market data',
      message: error.message 
    })
  }
}

export default withSubscriptionAccess('premium', handler)

