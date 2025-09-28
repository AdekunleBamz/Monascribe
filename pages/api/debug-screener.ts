import type { NextApiRequest, NextApiResponse } from 'next'
import { getLatestMarketData } from '../../lib/coingecko'
import { generateSmartMoneyAnalytics } from '../../lib/envioSync'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔍 Debugging screener data flow...')
    
    // Test market data
    const marketData = await getLatestMarketData()
    console.log('📊 Market data:', marketData ? 'Found' : 'Not found')
    
    // Test analytics
    const analytics = await generateSmartMoneyAnalytics()
    console.log('📈 Analytics summary before:', analytics.summary)
    
    // Test enhancement
    if (marketData) {
      analytics.summary = {
        ...analytics.summary,
        marketSentiment: 'test',
        bitcoinPrice: marketData.bitcoin?.usd || 0,
        ethereumPrice: marketData.ethereum?.usd || 0,
        marketCap: (marketData.bitcoin?.usd_market_cap || 0) + (marketData.ethereum?.usd_market_cap || 0)
      }
      console.log('📈 Analytics summary after:', analytics.summary)
    }
    
    res.status(200).json({
      status: 'success',
      marketData: marketData ? 'Found' : 'Not found',
      analyticsSummary: analytics.summary,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('❌ Debug failed:', error)
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack
    })
  }
}
