import type { NextApiRequest, NextApiResponse } from 'next'
import { withSubscriptionAccess } from '../../../lib/subscriptionTiers'
import { 
  fetchCoinDetails, 
  searchCoins,
  getTop10Coins,
  getLatestTrendingData
} from '../../../lib/coingecko'

async function handler(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { coinId, search, action } = req.query

    // VIP tier: Full access + search + historical data
    if (action === 'search' && search) {
      // Search coins by name/symbol
      const searchResults = await searchCoins(search as string)
      
      return res.status(200).json({
        tier: 'vip',
        action: 'search',
        results: searchResults,
        lastUpdated: new Date().toISOString(),
        plan: user.subscription.planId
      })
    }

    if (action === 'details' && coinId) {
      // Get detailed coin information
      const coinDetails = await fetchCoinDetails(coinId as string)
      
      if (!coinDetails) {
        return res.status(404).json({ 
          error: 'Coin not found',
          coinId 
        })
      }

      return res.status(200).json({
        tier: 'vip',
        action: 'details',
        coin: coinDetails,
        lastUpdated: new Date().toISOString(),
        plan: user.subscription.planId
      })
    }

    // Default: Full market overview
    const [top10Coins, trendingData] = await Promise.all([
      getTop10Coins(),
      getLatestTrendingData()
    ])

    const vipData = {
      overview: {
        top10: top10Coins,
        trending: trendingData.slice(0, 10),
        marketStats: {
          totalMarketCap: top10Coins.reduce((sum, coin) => sum + coin.market_cap, 0),
          totalVolume: top10Coins.reduce((sum, coin) => sum + coin.total_volume, 0),
          activeCoins: top10Coins.length,
          avgChange24h: top10Coins.reduce((sum, coin) => sum + (coin.price_change_percentage_24h || 0), 0) / top10Coins.length
        }
      },
      features: {
        search: true,
        details: true,
        charts: true,
        alerts: true,
        apiAccess: true
      },
      charts: {
        marketCap: top10Coins.map(coin => ({
          id: coin.id,
          name: coin.name,
          market_cap: coin.market_cap,
          sparkline_7d: coin.sparkline_7d
        })),
        volume: top10Coins.map(coin => ({
          id: coin.id,
          name: coin.name,
          volume: coin.total_volume,
          change_24h: coin.price_change_percentage_24h
        }))
      }
    }

    res.status(200).json({
      tier: 'vip',
      action: 'overview',
      data: vipData,
      lastUpdated: new Date().toISOString(),
      plan: user.subscription.planId
    })
  } catch (error: any) {
    console.error('VIP market data error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch VIP market data',
      message: error.message 
    })
  }
}

export default withSubscriptionAccess('vip', handler)

