"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchWallet = searchWallet;
exports.getWhaleTrackingData = getWhaleTrackingData;
exports.saveWhaleData = saveWhaleData;
exports.getUserWatchlist = getUserWatchlist;
exports.addToWatchlist = addToWatchlist;
exports.removeFromWatchlist = removeFromWatchlist;
exports.getRealTimeAlerts = getRealTimeAlerts;
exports.createRealTimeAlert = createRealTimeAlert;
exports.markAlertAsRead = markAlertAsRead;
exports.getAISummary = getAISummary;
exports.generateAISummary = generateAISummary;
exports.getVIPTierData = getVIPTierData;
const db_1 = require("./db");
// Search wallet
async function searchWallet(address) {
    const db = await (0, db_1.getDb)();
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
async function getWhaleTrackingData() {
    const db = await (0, db_1.getDb)();
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
async function saveWhaleData(whale) {
    const db = await (0, db_1.getDb)();
    await db.collection('whale_tracking').updateOne({ address: whale.address }, { $set: whale }, { upsert: true });
}
// Get user watchlist
async function getUserWatchlist(userId) {
    const db = await (0, db_1.getDb)();
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
async function addToWatchlist(item) {
    const db = await (0, db_1.getDb)();
    const result = await db.collection('user_watchlists').insertOne(Object.assign(Object.assign({}, item), { addedAt: new Date() }));
    return result.insertedId.toString();
}
// Remove from watchlist
async function removeFromWatchlist(itemId) {
    const db = await (0, db_1.getDb)();
    await db.collection('user_watchlists').deleteOne({ _id: itemId });
}
// Get real-time alerts
async function getRealTimeAlerts(userId) {
    const db = await (0, db_1.getDb)();
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
async function createRealTimeAlert(alert) {
    const db = await (0, db_1.getDb)();
    const result = await db.collection('real_time_alerts').insertOne(Object.assign(Object.assign({}, alert), { read: false }));
    return result.insertedId.toString();
}
// Mark alert as read
async function markAlertAsRead(alertId) {
    const db = await (0, db_1.getDb)();
    await db.collection('real_time_alerts').updateOne({ _id: alertId }, { $set: { read: true } });
}
// Get AI-powered summary
async function getAISummary(week) {
    const db = await (0, db_1.getDb)();
    const query = week ? { week } : {};
    const summary = await db.collection('ai_summaries')
        .findOne(query, { sort: { generatedAt: -1 } });
    if (!summary)
        return null;
    return {
        id: summary._id.toString(),
        week: summary.week,
        summary: summary.summary,
        keyMetrics: summary.keyMetrics,
        generatedAt: summary.generatedAt
    };
}
// Generate AI summary
async function generateAISummary(week, data) {
    const db = await (0, db_1.getDb)();
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
async function getVIPTierData(userId) {
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
