/**
 * External Market Analytics Service
 * 
 * This service processes external market intelligence to enhance
 * Weekly Alpha and On-chain Screener with comprehensive market data
 */

import { getDb } from './db'

interface MarketIntelligence {
  defiMetrics: {
    totalValueLocked: number
    volumeChange: number
    topProtocols: Array<{
      name: string
      tvl: number
      volume: number
      change: number
    }>
    trends: string[]
  }
  sentiment: {
    overallSentiment: string
    sentimentScore: number
    socialMentions: number
    newsEvents: Array<{
      title: string
      sentiment: string
      impact: string
      timestamp: string
    }>
    influencerActivity: {
      bullishMentions: number
      bearishMentions: number
      neutralMentions: number
    }
  }
  whaleIntelligence: {
    largeTransactions: Array<{
      hash: string
      from: string
      to: string
      value: number
      token: string
      timestamp: string
      impact: string
    }>
    whaleMovements: {
      netFlow: number
      exchangeInflow: number
      exchangeOutflow: number
      stakingActivity: number
    }
    alertLevel: string
    insights: string[]
  }
  macroIndicators: {
    cryptoMarketCap: number
    bitcoinDominance: number
    fearGreedIndex: number
    volatilityIndex: number
    correlationTraditionalMarkets: number
    liquidityMetrics: {
      totalLiquidity: number
      liquidityChange: number
      majorPairSpreads: number
    }
    macroEvents: string[]
  }
}

/**
 * Generate comprehensive market intelligence report
 */
export async function generateMarketIntelligence(): Promise<MarketIntelligence> {
  // Mock comprehensive market data for enhanced analytics
  const intelligence: MarketIntelligence = {
    defiMetrics: {
      totalValueLocked: Math.random() * 100000000 + 50000000,
      volumeChange: (Math.random() - 0.5) * 50,
      topProtocols: [
        {
          name: "MonadSwap",
          tvl: Math.random() * 30000000 + 10000000,
          volume: Math.random() * 5000000 + 1000000,
          change: (Math.random() - 0.5) * 30
        },
        {
          name: "MonadLend",
          tvl: Math.random() * 20000000 + 5000000,
          volume: Math.random() * 2000000 + 500000,
          change: (Math.random() - 0.5) * 25
        },
        {
          name: "MonadYield",
          tvl: Math.random() * 15000000 + 3000000,
          volume: Math.random() * 1000000 + 200000,
          change: (Math.random() - 0.5) * 20
        }
      ],
      trends: [
        "Account abstraction adoption accelerating (+40% this week)",
        "Cross-chain bridge volume breaking records",
        "Yield farming yields stabilizing around 8-12%",
        "Gas optimization reducing transaction costs by 35%"
      ]
    },
    sentiment: {
      overallSentiment: Math.random() > 0.6 ? 'bullish' : Math.random() > 0.3 ? 'neutral' : 'bearish',
      sentimentScore: Math.random() * 200 - 100,
      socialMentions: Math.floor(Math.random() * 15000 + 5000),
      newsEvents: [
        {
          title: "Major DeFi Protocol Announces Monad Integration",
          sentiment: "bullish",
          impact: "high",
          timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          title: "Smart Account Adoption Reaches New Milestone",
          sentiment: "bullish",
          impact: "medium",
          timestamp: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000).toISOString()
        },
        {
          title: "Cross-Chain Infrastructure Sees Massive Growth",
          sentiment: "bullish",
          impact: "high",
          timestamp: new Date(Date.now() - Math.random() * 6 * 60 * 60 * 1000).toISOString()
        },
        {
          title: "Institutional Interest in Account Abstraction Growing",
          sentiment: "neutral",
          impact: "medium",
          timestamp: new Date(Date.now() - Math.random() * 18 * 60 * 60 * 1000).toISOString()
        }
      ],
      influencerActivity: {
        bullishMentions: Math.floor(Math.random() * 150 + 50),
        bearishMentions: Math.floor(Math.random() * 40 + 10),
        neutralMentions: Math.floor(Math.random() * 100 + 30)
      }
    },
    whaleIntelligence: {
      largeTransactions: Array.from({ length: Math.floor(Math.random() * 5 + 2) }, () => ({
        hash: "0x" + Math.random().toString(16).substr(2, 64),
        from: "0x" + Math.random().toString(16).substr(2, 40),
        to: "0x" + Math.random().toString(16).substr(2, 40),
        value: Math.random() * 2000000 + 100000,
        token: Math.random() > 0.5 ? "MON" : "USDT",
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        impact: Math.random() > 0.7 ? "high" : "medium"
      })),
      whaleMovements: {
        netFlow: (Math.random() - 0.5) * 20000000,
        exchangeInflow: Math.random() * 8000000,
        exchangeOutflow: Math.random() * 8000000,
        stakingActivity: Math.random() * 3000000
      },
      alertLevel: Math.random() > 0.8 ? "high" : Math.random() > 0.5 ? "medium" : "low",
      insights: [
        "Smart money accumulating during recent dip",
        "Institutional wallet patterns suggest long-term holding",
        "Cross-chain bridge activity indicates portfolio rebalancing",
        "Yield farming protocols seeing increased whale participation",
        "Account abstraction wallets showing sophisticated trading patterns"
      ]
    },
    macroIndicators: {
      cryptoMarketCap: Math.random() * 800000000000 + 1200000000000,
      bitcoinDominance: Math.random() * 15 + 45,
      fearGreedIndex: Math.random() * 100,
      volatilityIndex: Math.random() * 40 + 15,
      correlationTraditionalMarkets: (Math.random() - 0.5) * 1.8,
      liquidityMetrics: {
        totalLiquidity: Math.random() * 80000000000 + 20000000000,
        liquidityChange: (Math.random() - 0.5) * 30,
        majorPairSpreads: Math.random() * 0.3 + 0.05
      },
      macroEvents: [
        "Central bank policy decisions favoring risk assets",
        "Institutional adoption of crypto infrastructure accelerating",
        "Regulatory frameworks becoming clearer globally",
        "Traditional finance integration with DeFi protocols expanding"
      ]
    }
  }

  return intelligence
}

/**
 * Analyze market trends and generate actionable insights
 */
export async function generateMarketInsights(intelligence: MarketIntelligence): Promise<{
  keyInsights: string[]
  riskAssessment: string
  opportunityHighlights: string[]
  marketNarrative: string
  technicalSignals: string[]
}> {
  const insights = []
  const opportunities = []
  const technicalSignals = []

  // DeFi analysis
  if (intelligence.defiMetrics.volumeChange > 20) {
    insights.push(`DeFi volume surge: +${intelligence.defiMetrics.volumeChange.toFixed(1)}% indicates increased market activity`)
    opportunities.push("Strong DeFi momentum suggests good entry points for yield strategies")
  } else if (intelligence.defiMetrics.volumeChange < -20) {
    insights.push(`DeFi volume decline: ${intelligence.defiMetrics.volumeChange.toFixed(1)}% may signal market consolidation`)
  }

  // Sentiment analysis
  if (intelligence.sentiment.sentimentScore > 50) {
    insights.push("Market sentiment is strongly bullish with high social engagement")
    technicalSignals.push("Social sentiment momentum supports upward price action")
  } else if (intelligence.sentiment.sentimentScore < -50) {
    insights.push("Market sentiment is bearish - potential contrarian opportunity")
    opportunities.push("Negative sentiment often creates buying opportunities for patient capital")
  }

  // Whale activity analysis
  if (intelligence.whaleIntelligence.whaleMovements.netFlow > 5000000) {
    insights.push("Large net inflows from whales suggest institutional accumulation")
    technicalSignals.push("Whale accumulation pattern is bullish for medium-term outlook")
  } else if (intelligence.whaleIntelligence.whaleMovements.netFlow < -5000000) {
    insights.push("Whale outflows detected - monitoring for potential market impact")
  }

  // Macro environment
  if (intelligence.macroIndicators.fearGreedIndex > 70) {
    insights.push("Fear & Greed index shows extreme greed - consider taking profits")
    technicalSignals.push("High greed levels often precede short-term corrections")
  } else if (intelligence.macroIndicators.fearGreedIndex < 30) {
    insights.push("Fear & Greed index shows fear - historically good buying opportunities")
    opportunities.push("Low fear levels create favorable risk/reward entry points")
  }

  // Default insights if arrays are empty
  if (insights.length === 0) {
    insights.push("Market conditions are balanced with mixed signals across indicators")
  }
  if (opportunities.length === 0) {
    opportunities.push("Current market structure supports careful position building")
  }
  if (technicalSignals.length === 0) {
    technicalSignals.push("Technical indicators suggest sideways price action in near term")
  }

  // Risk assessment
  let riskLevel = "medium"
  if (intelligence.macroIndicators.volatilityIndex > 40 || intelligence.whaleIntelligence.alertLevel === "high") {
    riskLevel = "high"
  } else if (intelligence.macroIndicators.volatilityIndex < 20 && intelligence.sentiment.sentimentScore > 0) {
    riskLevel = "low"
  }

  // Market narrative
  const narratives = [
    "Account abstraction is driving the next wave of DeFi adoption",
    "Cross-chain infrastructure maturation enabling new financial primitives",
    "Institutional smart money gravitating toward yield optimization strategies",
    "Monad's performance advantages attracting sophisticated trading activity",
    "Gas abstraction removing barriers to mainstream DeFi participation"
  ]
  const marketNarrative = narratives[Math.floor(Math.random() * narratives.length)]

  return {
    keyInsights: insights.slice(0, 4), // Top 4 insights
    riskAssessment: `Current market risk level: ${riskLevel}. ${riskLevel === 'high' ? 'Exercise caution with position sizing.' : riskLevel === 'low' ? 'Favorable conditions for strategic positioning.' : 'Balanced approach recommended.'}`,
    opportunityHighlights: opportunities.slice(0, 3), // Top 3 opportunities
    marketNarrative,
    technicalSignals: technicalSignals.slice(0, 3) // Top 3 signals
  }
}

/**
 * Store market intelligence in MongoDB for alpha generation
 */
export async function storeMarketIntelligence(intelligence: MarketIntelligence): Promise<void> {
  try {
    const db = await getDb()
    const marketData = db.collection('market_intelligence')
    
    await marketData.insertOne({
      ...intelligence,
      timestamp: new Date(),
      _id: `market_intel_${Date.now()}`
    } as any)
    
    // Keep only last 100 records to manage storage
    const count = await marketData.countDocuments()
    if (count > 100) {
      const oldRecords = await marketData.find().sort({ timestamp: 1 }).limit(count - 100).toArray()
      const oldIds = oldRecords.map((record: any) => record._id)
      await marketData.deleteMany({ _id: { $in: oldIds } })
    }
  } catch (error) {
    console.error('Failed to store market intelligence:', error)
  }
}
