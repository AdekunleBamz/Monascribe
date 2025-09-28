import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchMarketData, saveMarketData, getLatestMarketData } from '../../lib/coingecko'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔄 Testing market data flow...')
    
    // Fetch fresh market data
    const marketData = await fetchMarketData(['bitcoin', 'ethereum', 'monad'])
    console.log('📊 Fetched market data:', marketData)
    
    // Save to MongoDB
    await saveMarketData(marketData)
    console.log('💾 Saved market data to MongoDB')
    
    // Retrieve from MongoDB
    const cachedData = await getLatestMarketData()
    console.log('📥 Retrieved cached data:', cachedData)
    
    res.status(200).json({
      status: 'success',
      fetched: marketData,
      cached: cachedData,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('❌ Market data test failed:', error)
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack
    })
  }
}
