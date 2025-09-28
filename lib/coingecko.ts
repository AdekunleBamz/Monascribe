import { getDb } from './db'

// CoinGecko API integration with MongoDB caching
export interface MarketData {
  id: string
  symbol: string
  name: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  total_volume: number
  price_change_percentage_24h: number
  price_change_percentage_7d: number
  sparkline_7d?: number[]
  description?: string
  image?: string
  last_updated: string
}

export interface TrendingCoin {
  id: string
  name: string
  symbol: string
  market_cap_rank: number
  thumb: string
  small: string
  large: string
  slug: string
  price_btc: number
  score: number
}

// Fetch market data for multiple coins
export async function fetchMarketData(ids: string[] = ['bitcoin', 'ethereum', 'monad']): Promise<Record<string, any>> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd&include_market_cap=true&include_24hr_change=true&include_24hr_vol=true&include_last_updated_at=true`
    )
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch market data:', error)
    throw error
  }
}

// Fetch detailed coin data
export async function fetchCoinDetails(coinId: string): Promise<MarketData | null> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&sparkline=true&community_data=false&developer_data=false`
    )
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      current_price: data.market_data?.current_price?.usd || 0,
      market_cap: data.market_data?.market_cap?.usd || 0,
      market_cap_rank: data.market_data?.market_cap_rank || 0,
      total_volume: data.market_data?.total_volume?.usd || 0,
      price_change_percentage_24h: data.market_data?.price_change_percentage_24h || 0,
      price_change_percentage_7d: data.market_data?.price_change_percentage_7d_in_currency?.usd || 0,
      sparkline_7d: data.market_data?.sparkline_7d?.price || [],
      description: data.description?.en || '',
      image: data.image?.large || data.image?.small || '',
      last_updated: data.last_updated || new Date().toISOString()
    }
  } catch (error) {
    console.error(`Failed to fetch details for ${coinId}:`, error)
    return null
  }
}

// Fetch trending coins
export async function fetchTrendingCoins(): Promise<TrendingCoin[]> {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/search/trending')
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.coins?.map((coin: any) => ({
      id: coin.item.id,
      name: coin.item.name,
      symbol: coin.item.symbol,
      market_cap_rank: coin.item.market_cap_rank,
      thumb: coin.item.thumb,
      small: coin.item.small,
      large: coin.item.large,
      slug: coin.item.slug,
      price_btc: coin.item.price_btc,
      score: coin.item.score
    })) || []
  } catch (error) {
    console.error('Failed to fetch trending coins:', error)
    return []
  }
}

// Save market data to MongoDB
export async function saveMarketData(data: Record<string, any>): Promise<void> {
  try {
    const db = await getDb()
    const collection = db.collection('market_data')
    
    await collection.insertOne({
      data,
      createdAt: new Date(),
      type: 'market_data'
    })
    
    console.log('✅ Market data saved to MongoDB')
  } catch (error) {
    console.error('❌ Failed to save market data:', error)
    throw error
  }
}

// Save trending data to MongoDB
export async function saveTrendingData(data: TrendingCoin[]): Promise<void> {
  try {
    const db = await getDb()
    const collection = db.collection('trending_data')
    
    await collection.insertOne({
      data,
      createdAt: new Date(),
      type: 'trending'
    })
    
    console.log('✅ Trending data saved to MongoDB')
  } catch (error) {
    console.error('❌ Failed to save trending data:', error)
    throw error
  }
}

// Get latest market data from MongoDB
export async function getLatestMarketData(): Promise<Record<string, any> | null> {
  try {
    const db = await getDb()
    const collection = db.collection('market_data')
    
    const latest = await collection.findOne(
      { type: 'market_data' },
      { sort: { createdAt: -1 } }
    )
    
    return latest?.data || null
  } catch (error) {
    console.error('❌ Failed to get latest market data:', error)
    return null
  }
}

// Get latest trending data from MongoDB
export async function getLatestTrendingData(): Promise<TrendingCoin[]> {
  try {
    const db = await getDb()
    const collection = db.collection('trending_data')
    
    const latest = await collection.findOne(
      { type: 'trending' },
      { sort: { createdAt: -1 } }
    )
    
    return latest?.data || []
  } catch (error) {
    console.error('❌ Failed to get latest trending data:', error)
    return []
  }
}

// Check if data is fresh (less than 5 minutes old)
export function isDataFresh(createdAt: Date): boolean {
  const now = new Date()
  const diffMs = now.getTime() - createdAt.getTime()
  const diffMins = diffMs / (1000 * 60)
  return diffMins < 5
}

// Get top 10 coins by market cap
export async function getTop10Coins(): Promise<MarketData[]> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=true&price_change_percentage=24h,7d'
    )
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    return data.map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      current_price: coin.current_price,
      market_cap: coin.market_cap,
      market_cap_rank: coin.market_cap_rank,
      total_volume: coin.total_volume,
      price_change_percentage_24h: coin.price_change_percentage_24h,
      price_change_percentage_7d: coin.price_change_percentage_7d_in_currency,
      sparkline_7d: coin.sparkline_in_7d?.price || [],
      image: coin.image,
      last_updated: coin.last_updated
    }))
  } catch (error) {
    console.error('Failed to fetch top 10 coins:', error)
    return []
  }
}

// Search coins by name or symbol
export async function searchCoins(query: string): Promise<MarketData[]> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`
    )
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Get details for each coin
    const coinDetails = await Promise.all(
      data.coins?.slice(0, 10).map(async (coin: any) => {
        return await fetchCoinDetails(coin.id)
      }) || []
    )
    
    return coinDetails.filter((coin): coin is MarketData => coin !== null)
  } catch (error) {
    console.error('Failed to search coins:', error)
    return []
  }
}

