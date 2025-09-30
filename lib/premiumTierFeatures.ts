import { getDb } from './db';

// Smart money alert data structure
export interface SmartMoneyAlert {
  walletAddress: string;
  contractAddress: string;
  contractName: string;
  transactionCount: number;
  totalVolume: number;
  lastActivity: Date;
  alertType: 'high_volume' | 'new_contract' | 'unusual_activity';
}

// DEX activity data structure
export interface DEXActivity {
  protocol: string;
  contractAddress: string;
  volume24h: number;
  volume7d: number;
  liquidityChange: number;
  tradeCount: number;
  uniqueTraders: number;
  topTokens: Array<{
    symbol: string;
    volume: number;
    priceChange: number;
  }>;
}

// Historical comparison data
export interface HistoricalComparison {
  metric: string;
  currentWeek: number;
  previousWeek: number;
  change: number;
  changePercentage: number;
}

// Token narrative data
export interface TokenNarrative {
  token: string;
  symbol: string;
  narrative: string;
  category: 'AI' | 'DeFi' | 'Gaming' | 'Infrastructure' | 'Meme' | 'Layer1' | 'Layer2';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  keyEvents: string[];
  marketCap: number;
  priceChange24h: number;
}

// Get smart money alerts
export async function getSmartMoneyAlerts(): Promise<SmartMoneyAlert[]> {
  const db = await getDb();
  
  // Get top wallets by transaction count and volume
  const alerts = await db.collection('smart_money_alerts')
    .find({})
    .sort({ totalVolume: -1 })
    .limit(10)
    .toArray();
  
  return alerts.map(alert => ({
    walletAddress: alert.walletAddress,
    contractAddress: alert.contractAddress,
    contractName: alert.contractName,
    transactionCount: alert.transactionCount,
    totalVolume: alert.totalVolume,
    lastActivity: alert.lastActivity,
    alertType: alert.alertType
  }));
}

// Save smart money alert
export async function saveSmartMoneyAlert(alert: SmartMoneyAlert): Promise<void> {
  const db = await getDb();
  
  await db.collection('smart_money_alerts').updateOne(
    { 
      walletAddress: alert.walletAddress,
      contractAddress: alert.contractAddress 
    },
    { $set: alert },
    { upsert: true }
  );
}

// Get DEX activity
export async function getDEXActivity(): Promise<DEXActivity[]> {
  const db = await getDb();
  
  const activities = await db.collection('dex_activity')
    .find({})
    .sort({ volume24h: -1 })
    .limit(10)
    .toArray();
  
  return activities.map(activity => ({
    protocol: activity.protocol,
    contractAddress: activity.contractAddress,
    volume24h: activity.volume24h,
    volume7d: activity.volume7d,
    liquidityChange: activity.liquidityChange,
    tradeCount: activity.tradeCount,
    uniqueTraders: activity.uniqueTraders,
    topTokens: activity.topTokens
  }));
}

// Save DEX activity
export async function saveDEXActivity(activity: DEXActivity): Promise<void> {
  const db = await getDb();
  
  await db.collection('dex_activity').updateOne(
    { contractAddress: activity.contractAddress },
    { $set: activity },
    { upsert: true }
  );
}

// Get historical comparisons
export async function getHistoricalComparisons(): Promise<HistoricalComparison[]> {
  const db = await getDb();
  
  const comparisons = await db.collection('historical_comparisons')
    .find({})
    .sort({ changePercentage: -1 })
    .toArray();
  
  return comparisons.map(comp => ({
    metric: comp.metric,
    currentWeek: comp.currentWeek,
    previousWeek: comp.previousWeek,
    change: comp.change,
    changePercentage: comp.changePercentage
  }));
}

// Save historical comparison
export async function saveHistoricalComparison(comparison: HistoricalComparison): Promise<void> {
  const db = await getDb();
  
  await db.collection('historical_comparisons').updateOne(
    { metric: comparison.metric },
    { $set: comparison },
    { upsert: true }
  );
}

// Get token narratives
export async function getTokenNarratives(): Promise<TokenNarrative[]> {
  const db = await getDb();
  
  const narratives = await db.collection('token_narratives')
    .find({})
    .sort({ marketCap: -1 })
    .limit(20)
    .toArray();
  
  return narratives.map(narrative => ({
    token: narrative.token,
    symbol: narrative.symbol,
    narrative: narrative.narrative,
    category: narrative.category,
    sentiment: narrative.sentiment,
    keyEvents: narrative.keyEvents,
    marketCap: narrative.marketCap,
    priceChange24h: narrative.priceChange24h
  }));
}

// Save token narrative
export async function saveTokenNarrative(narrative: TokenNarrative): Promise<void> {
  const db = await getDb();
  
  await db.collection('token_narratives').updateOne(
    { token: narrative.token },
    { $set: narrative },
    { upsert: true }
  );
}

// Get all premium tier data
export async function getPremiumTierData(): Promise<{
  smartMoneyAlerts: SmartMoneyAlert[];
  dexActivity: DEXActivity[];
  historicalComparisons: HistoricalComparison[];
  tokenNarratives: TokenNarrative[];
}> {
  const [smartMoneyAlerts, dexActivity, historicalComparisons, tokenNarratives] = await Promise.all([
    getSmartMoneyAlerts(),
    getDEXActivity(),
    getHistoricalComparisons(),
    getTokenNarratives()
  ]);
  
  return {
    smartMoneyAlerts,
    dexActivity,
    historicalComparisons,
    tokenNarratives
  };
}

// Generate exclusive analysis notes
export async function generateAnalysisNotes(): Promise<string[]> {
  const db = await getDb();
  
  // Get recent contract activity
  const recentActivity = await db.collection('contract_activity')
    .find({})
    .sort({ timestamp: -1 })
    .limit(10)
    .toArray();
  
  const notes: string[] = [];
  
  // Analyze contract activity changes
  for (const activity of recentActivity) {
    const previousActivity = await db.collection('contract_activity')
      .findOne({ 
        contractAddress: activity.contractAddress,
        timestamp: { $lt: activity.timestamp }
      }, { sort: { timestamp: -1 } });
    
    if (previousActivity) {
      const change = ((activity.txCount - previousActivity.txCount) / previousActivity.txCount) * 100;
      
      if (Math.abs(change) > 40) {
        notes.push(
          `Contract ${activity.contractName} gained ${change.toFixed(1)}% more activity this week. ` +
          `Watch out for potential launch or major update.`
        );
      }
    }
  }
  
  return notes.slice(0, 5); // Return top 5 analysis notes
}
