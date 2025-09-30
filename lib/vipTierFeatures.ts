import { getDb } from './db';

// Wallet search result
export interface WalletSearchResult {
  address: string;
  transactionCount: number;
  totalVolume: number;
  firstSeen: Date;
  lastActivity: Date;
  topContracts: Array<{
    address: string;
    name: string;
    txCount: number;
    volume: number;
  }>;
  tokenHoldings: Array<{
    token: string;
    symbol: string;
    balance: number;
    value: number;
  }>;
}

// Whale tracking data
export interface WhaleData {
  address: string;
  rank: number;
  totalVolume: number;
  transactionCount: number;
  lastActivity: Date;
  topMovements: Array<{
    token: string;
    amount: number;
    value: number;
    timestamp: Date;
    type: 'in' | 'out';
  }>;
  portfolioValue: number;
  riskScore: number;
}

// Custom watchlist item
export interface WatchlistItem {
  id: string;
  userId: string;
  type: 'token' | 'wallet' | 'contract';
  identifier: string;
  name: string;
  addedAt: Date;
  alerts: {
    priceChange: number;
    volumeSpike: number;
    whaleActivity: boolean;
  };
}

// Real-time alert
export interface RealTimeAlert {
  id: string;
  userId: string;
  type: 'whale_tx' | 'big_swap' | 'sentiment_flip' | 'price_alert' | 'volume_spike';
  title: string;
  message: string;
  timestamp: Date;
  data: any;
  read: boolean;
}

// AI-powered summary
export interface AISummary {
  id: string;
  week: number;
  summary: string;
  keyMetrics: {
    whaleActivity: number;
    dexVolume: number;
    sentimentScore: number;
    topNarratives: string[];
  };
  generatedAt: Date;
}

// Search wallet
export async function searchWallet(address: string): Promise<WalletSearchResult | null> {
  const db = await getDb();
  
  // Get wallet transactions
  const transactions = await db.collection('token_transfers')
    .find({
      $or: [
        { from: address },
        { to: address }
      ]
    })
    .sort({ timestamp: -1 })
    .toArray();
  
  if (transactions.length === 0) {
    return null;
  }
  
  // Calculate metrics
  const totalVolume = transactions.reduce((sum, tx) => sum + (tx.value || 0), 0);
  const firstSeen = transactions[transactions.length - 1].timestamp;
  const lastActivity = transactions[0].timestamp;
  
  // Get top contracts
  const contractStats = new Map();
  transactions.forEach(tx => {
    const contract = tx.contractAddress || 'native';
    if (!contractStats.has(contract)) {
      contractStats.set(contract, { txCount: 0, volume: 0 });
    }
    const stats = contractStats.get(contract);
    stats.txCount++;
    stats.volume += tx.value || 0;
  });
  
  const topContracts = Array.from(contractStats.entries())
    .map(([address, stats]) => ({
      address,
      name: address === 'native' ? 'Native Token' : `Contract ${address.slice(0, 8)}...`,
      txCount: stats.txCount,
      volume: stats.volume
    }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5);
  
  return {
    address,
    transactionCount: transactions.length,
    totalVolume,
    firstSeen,
    lastActivity,
    topContracts,
    tokenHoldings: [] // Would need additional data source
  };
}

// Get whale tracking data
export async function getWhaleTrackingData(): Promise<WhaleData[]> {
  const db = await getDb();
  
  const whales = await db.collection('whale_tracking')
    .find({})
    .sort({ totalVolume: -1 })
    .limit(10)
    .toArray();
  
  return whales.map((whale, index) => ({
    address: whale.address,
    rank: index + 1,
    totalVolume: whale.totalVolume,
    transactionCount: whale.transactionCount,
    lastActivity: whale.lastActivity,
    topMovements: whale.topMovements || [],
    portfolioValue: whale.portfolioValue || 0,
    riskScore: whale.riskScore || 0
  }));
}

// Save whale data
export async function saveWhaleData(whale: WhaleData): Promise<void> {
  const db = await getDb();
  
  await db.collection('whale_tracking').updateOne(
    { address: whale.address },
    { $set: whale },
    { upsert: true }
  );
}

// Get user watchlist
export async function getUserWatchlist(userId: string): Promise<WatchlistItem[]> {
  const db = await getDb();
  
  const watchlist = await db.collection('user_watchlists')
    .find({ userId })
    .sort({ addedAt: -1 })
    .toArray();
  
  return watchlist.map(item => ({
    id: item._id.toString(),
    userId: item.userId,
    type: item.type,
    identifier: item.identifier,
    name: item.name,
    addedAt: item.addedAt,
    alerts: item.alerts
  }));
}

// Add to watchlist
export async function addToWatchlist(item: Omit<WatchlistItem, 'id' | 'addedAt'>): Promise<string> {
  const db = await getDb();
  
  const result = await db.collection('user_watchlists').insertOne({
    ...item,
    addedAt: new Date()
  });
  
  return result.insertedId.toString();
}

// Remove from watchlist
export async function removeFromWatchlist(itemId: string): Promise<void> {
  const db = await getDb();
  
  await db.collection('user_watchlists').deleteOne({ _id: itemId });
}

// Get real-time alerts
export async function getRealTimeAlerts(userId: string): Promise<RealTimeAlert[]> {
  const db = await getDb();
  
  const alerts = await db.collection('real_time_alerts')
    .find({ userId })
    .sort({ timestamp: -1 })
    .limit(50)
    .toArray();
  
  return alerts.map(alert => ({
    id: alert._id.toString(),
    userId: alert.userId,
    type: alert.type,
    title: alert.title,
    message: alert.message,
    timestamp: alert.timestamp,
    data: alert.data,
    read: alert.read || false
  }));
}

// Create real-time alert
export async function createRealTimeAlert(alert: Omit<RealTimeAlert, 'id' | 'read'>): Promise<string> {
  const db = await getDb();
  
  const result = await db.collection('real_time_alerts').insertOne({
    ...alert,
    read: false
  });
  
  return result.insertedId.toString();
}

// Mark alert as read
export async function markAlertAsRead(alertId: string): Promise<void> {
  const db = await getDb();
  
  await db.collection('real_time_alerts').updateOne(
    { _id: alertId },
    { $set: { read: true } }
  );
}

// Get AI-powered summary
export async function getAISummary(week?: number): Promise<AISummary | null> {
  const db = await getDb();
  
  const query = week ? { week } : {};
  const summary = await db.collection('ai_summaries')
    .findOne(query, { sort: { generatedAt: -1 } });
  
  if (!summary) return null;
  
  return {
    id: summary._id.toString(),
    week: summary.week,
    summary: summary.summary,
    keyMetrics: summary.keyMetrics,
    generatedAt: summary.generatedAt
  };
}

// Generate AI summary
export async function generateAISummary(week: number, data: {
  whaleActivity: number;
  dexVolume: number;
  sentimentScore: number;
  topNarratives: string[];
}): Promise<string> {
  const db = await getDb();
  
  // Simple AI summary generation (in production, you'd use a real AI service)
  const summary = `
    This week in the Monad ecosystem: Whale activity increased by ${data.whaleActivity}% with significant movements detected. 
    DEX volume reached $${data.dexVolume.toLocaleString()} across major protocols. 
    Market sentiment remains ${data.sentimentScore > 0 ? 'bullish' : 'bearish'} with a score of ${data.sentimentScore}. 
    Key narratives driving the market: ${data.topNarratives.join(', ')}. 
    Overall, the ecosystem shows ${data.sentimentScore > 0 ? 'positive' : 'negative'} momentum with increased activity across all metrics.
  `;
  
  await db.collection('ai_summaries').insertOne({
    week,
    summary: summary.trim(),
    keyMetrics: data,
    generatedAt: new Date()
  });
  
  return summary.trim();
}

// Get all VIP tier data
export async function getVIPTierData(userId: string): Promise<{
  whaleTracking: WhaleData[];
  watchlist: WatchlistItem[];
  recentAlerts: RealTimeAlert[];
  aiSummary: AISummary | null;
}> {
  const [whaleTracking, watchlist, recentAlerts, aiSummary] = await Promise.all([
    getWhaleTrackingData(),
    getUserWatchlist(userId),
    getRealTimeAlerts(userId),
    getAISummary()
  ]);
  
  return {
    whaleTracking,
    watchlist,
    recentAlerts: recentAlerts.slice(0, 10),
    aiSummary
  };
}
