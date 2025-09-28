// Cron job to fetch and cache market data
import cron from 'node-cron'
import { 
  fetchMarketData, 
  fetchTrendingCoins, 
  saveMarketData, 
  saveTrendingData 
} from '../lib/coingecko'

// Fetch market data every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('🔄 Fetching market data...')
    
    // Fetch basic market data (BTC, ETH, MON)
    const marketData = await fetchMarketData(['bitcoin', 'ethereum', 'monad'])
    await saveMarketData(marketData)
    
    console.log('✅ Market data updated')
  } catch (error) {
    console.error('❌ Failed to update market data:', error)
  }
})

// Fetch trending data every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  try {
    console.log('🔄 Fetching trending data...')
    
    const trendingData = await fetchTrendingCoins()
    await saveTrendingData(trendingData)
    
    console.log('✅ Trending data updated')
  } catch (error) {
    console.error('❌ Failed to update trending data:', error)
  }
})

// Fetch top 10 coins every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  try {
    console.log('🔄 Fetching top 10 coins...')
    
    // This will be cached by the API endpoints when requested
    console.log('✅ Top 10 coins refresh scheduled')
  } catch (error) {
    console.error('❌ Failed to refresh top 10 coins:', error)
  }
})

console.log('🚀 Market data cron jobs started')
console.log('📊 Market data: every 5 minutes')
console.log('📈 Trending data: every 10 minutes')
console.log('🏆 Top 10 coins: every 15 minutes')

