import type { NextApiRequest, NextApiResponse } from 'next'
import { getSubscriptionStatusIndexed } from '../../lib/indexer'
import { publicClient } from '../../lib/config'
import { SUBSCRIPTION_CONTRACT_ABI, SUBSCRIPTION_CONTRACT_ADDRESS } from '../../lib/subscriptionContract'
import { getDb } from '../../lib/db'
import { syncSubscriptionEvents, generateSmartMoneyAnalytics } from '../../lib/envioSync'
import { monadNetwork } from '../../lib/monadNetworkData'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const db = await getDb()
    const { address, refresh } = req.query
    const user = String(address || '') as `0x${string}`
    if (!user) return res.status(400).send('Missing address')

    // Temporarily bypass subscription check for debugging
    console.log('🔍 Debugging: Bypassing subscription check to test data flow')
    // TODO: Re-enable subscription check after confirming data flow works

    // Try cache first (last 10 minutes) unless refresh requested
    if (!refresh) {
      const cache = await db.collection('screener_cache').findOne({ key: 'weekly' } as any)
      const now = Date.now()
      if (cache && typeof cache.ts === 'number' && now - cache.ts < 10 * 60 * 1000) {
        return res.status(200).json(cache.data)
      }
    }

    // Sync latest events from Envio → MongoDB
    try {
      const syncResult = await syncSubscriptionEvents()
      console.log(`📊 Synced ${syncResult.synced} events from Envio`)
      if (syncResult.errors.length > 0) {
        console.warn('Sync warnings:', syncResult.errors)
      }
    } catch (syncError) {
      console.warn('🔄 Envio sync failed, using cached MongoDB data:', syncError)
    }

    // Get real-time Monad network data
    const networkData = await monadNetwork.getNetworkData()
    const formattedNetwork = monadNetwork.getFormattedData(networkData)

    // Generate real smart money analytics from MongoDB
    const analytics = await generateSmartMoneyAnalytics()
    
    // Get market data for better insights
    const { getLatestMarketData } = await import('../../lib/coingecko')
    const marketData = await getLatestMarketData()
    
    // Generate comprehensive market intelligence
    const { generateMarketIntelligence, generateMarketInsights } = await import('../../lib/externalAnalytics')
    const marketIntel = await generateMarketIntelligence()
    const insights = await generateMarketInsights(marketIntel)
    
    // Enhance analytics with market data
    if (marketData) {
      analytics.summary.marketSentiment = calculateMarketSentiment(marketData)
      analytics.summary.bitcoinPrice = marketData.bitcoin?.usd || 0
      analytics.summary.ethereumPrice = marketData.ethereum?.usd || 0
      analytics.summary.marketCap = (marketData.bitcoin?.usd_market_cap || 0) + (marketData.ethereum?.usd_market_cap || 0)
    }

    // Transform to screener format with enhanced smart money data and market intelligence
    const data = {
      timestamp: analytics.timestamp,
      insights: [
        ...analytics.insights,
        ...insights.keyInsights.slice(0, 2), // Add top market insights
        `Market sentiment: ${marketIntel.sentiment.overallSentiment} (${marketIntel.sentiment.sentimentScore.toFixed(0)} score)`,
        `Whale alert level: ${marketIntel.whaleIntelligence.alertLevel}`
      ],
      tokenFlows: [
        // Include smart money wallets
        ...analytics.topSmartMoney.map((wallet: any, idx: number) => ({
          wallet: wallet.wallet,
          action: wallet.action,
          token: 'Smart Money',
          amount: wallet.score,
          activity: wallet.activity,
          rank: idx + 1,
          tags: wallet.tags
        })),
        // Include large transfers
        ...analytics.largeTransfers.map((transfer: any, idx: number) => ({
          wallet: transfer.wallet,
          action: transfer.action,
          token: 'Large Transfer',
          amount: transfer.amount,
          activity: transfer.activity,
          rank: analytics.topSmartMoney.length + idx + 1,
          tokenCount: transfer.tokenCount
        })),
        // Include whale intelligence
        ...marketIntel.whaleIntelligence.largeTransactions.slice(0, 3).map((tx: any, idx: number) => ({
          wallet: `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`,
          action: 'Whale Movement',
          token: tx.token,
          amount: Math.round(tx.value),
          activity: tx.impact === 'high' ? 'High Impact' : 'Medium Impact',
          rank: analytics.topSmartMoney.length + analytics.largeTransfers.length + idx + 1,
          timestamp: tx.timestamp
        }))
      ],
      hotContracts: [
        { 
          title: 'Smart Money Tracking', 
          insight: `${analytics.whaleCount} whale wallets active (${marketIntel.whaleIntelligence.alertLevel} alert level)` 
        },
        { 
          title: 'DeFi Ecosystem', 
          insight: `$${(marketIntel.defiMetrics.totalValueLocked / 1000000).toFixed(1)}M TVL across ${marketIntel.defiMetrics.topProtocols.length} protocols` 
        },
        { 
          title: 'Market Sentiment', 
          insight: `${marketIntel.sentiment.overallSentiment.toUpperCase()} sentiment with ${marketIntel.sentiment.socialMentions} mentions` 
        },
        { 
          title: 'Large Transfers', 
          insight: `${analytics.largeTransfers.length + marketIntel.whaleIntelligence.largeTransactions.length} high-value movements detected` 
        },
        { 
          title: 'MonaScribe Subscriptions', 
          insight: `${analytics.totalActiveUsers} active subscribers tracked` 
        },
      ],
      summary: {
        activeUsers: analytics.totalActiveUsers,
        whaleCount: analytics.whaleCount,
        topPlan: analytics.planPopularity[0]?.planName || 'Basic Newsletter',
        smartMoneyScore: analytics.topSmartMoney[0]?.score || 0,
        marketSentiment: marketIntel.sentiment.overallSentiment,
        sentimentScore: marketIntel.sentiment.sentimentScore,
        defiTvl: marketIntel.defiMetrics.totalValueLocked,
        whaleAlertLevel: marketIntel.whaleIntelligence.alertLevel,
        fearGreedIndex: marketIntel.macroIndicators.fearGreedIndex,
        dataSource: process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL ? 'Envio + External Intelligence' : 'MongoDB + Market Intelligence',
        note: `Comprehensive smart money & market intelligence from multiple sources`
      },
      planPopularity: analytics.planPopularity,
      dexActivity: [
        ...analytics.dexActivity,
        ...marketIntel.defiMetrics.topProtocols.map(protocol => ({
          _id: protocol.name,
          trades: Math.floor(protocol.volume / 10000), // Estimate trades from volume
          uniqueTraders: Math.floor(protocol.volume / 50000), // Estimate unique traders
          uniqueTraderCount: Math.floor(protocol.volume / 50000),
          totalVolumeIn: protocol.volume
        }))
      ],
      whaleActivity: analytics.whaleActivity,
      marketIntelligence: {
        sentiment: marketIntel.sentiment,
        whaleMovements: marketIntel.whaleIntelligence.whaleMovements,
        defiMetrics: marketIntel.defiMetrics,
        macroIndicators: marketIntel.macroIndicators,
        insights: insights,
        newsEvents: marketIntel.sentiment.newsEvents
      },
      networkInfo: {
        chain: 'Monad Testnet',
        latestBlock: formattedNetwork.network.latestBlock,
        blockTime: formattedNetwork.network.blockTime,
        tps: formattedNetwork.network.tps,
        gasPrice: formattedNetwork.network.gasPrice,
        utilization: formattedNetwork.network.utilization,
        activeAddresses: formattedNetwork.activity.activeToday,
        weeklyGrowth: formattedNetwork.activity.growth,
        smartAccounts: formattedNetwork.activity.smartAccounts,
        subscriptions: formattedNetwork.activity.subscriptions,
        recentTransactions: formattedNetwork.transactions
      }
    }

    const now = Date.now()
    await db.collection('screener_cache').updateOne(
      { key: 'weekly' } as any,
      { $set: { key: 'weekly', ts: now, data } },
      { upsert: true }
    )

    return res.status(200).json(data)
  } catch (e: any) {
    console.error('Screener API error:', e)
    return res.status(500).send(e?.message || 'Internal error')
  }
}

// Helper function to calculate market sentiment from price changes
function calculateMarketSentiment(marketData: any): string {
  const changes = [
    marketData.bitcoin?.usd_24h_change || 0,
    marketData.ethereum?.usd_24h_change || 0,
    marketData.monad?.usd_24h_change || 0
  ]
  
  const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length
  
  if (avgChange > 5) return 'bullish'
  if (avgChange < -5) return 'bearish'
  return 'neutral'
}


