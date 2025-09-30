"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSmartMoneyAlerts = getSmartMoneyAlerts;
exports.saveSmartMoneyAlert = saveSmartMoneyAlert;
exports.getDEXActivity = getDEXActivity;
exports.saveDEXActivity = saveDEXActivity;
exports.getHistoricalComparisons = getHistoricalComparisons;
exports.saveHistoricalComparison = saveHistoricalComparison;
exports.getTokenNarratives = getTokenNarratives;
exports.saveTokenNarrative = saveTokenNarrative;
exports.getPremiumTierData = getPremiumTierData;
exports.generateAnalysisNotes = generateAnalysisNotes;
const db_1 = require("./db");
// Get smart money alerts
async function getSmartMoneyAlerts() {
    const db = await (0, db_1.getDb)();
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
async function saveSmartMoneyAlert(alert) {
    const db = await (0, db_1.getDb)();
    await db.collection('smart_money_alerts').updateOne({
        walletAddress: alert.walletAddress,
        contractAddress: alert.contractAddress
    }, { $set: alert }, { upsert: true });
}
// Get DEX activity
async function getDEXActivity() {
    const db = await (0, db_1.getDb)();
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
async function saveDEXActivity(activity) {
    const db = await (0, db_1.getDb)();
    await db.collection('dex_activity').updateOne({ contractAddress: activity.contractAddress }, { $set: activity }, { upsert: true });
}
// Get historical comparisons
async function getHistoricalComparisons() {
    const db = await (0, db_1.getDb)();
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
async function saveHistoricalComparison(comparison) {
    const db = await (0, db_1.getDb)();
    await db.collection('historical_comparisons').updateOne({ metric: comparison.metric }, { $set: comparison }, { upsert: true });
}
// Get token narratives
async function getTokenNarratives() {
    const db = await (0, db_1.getDb)();
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
async function saveTokenNarrative(narrative) {
    const db = await (0, db_1.getDb)();
    await db.collection('token_narratives').updateOne({ token: narrative.token }, { $set: narrative }, { upsert: true });
}
// Get all premium tier data
async function getPremiumTierData() {
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
async function generateAnalysisNotes() {
    const db = await (0, db_1.getDb)();
    // Get recent contract activity
    const recentActivity = await db.collection('contract_activity')
        .find({})
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray();
    const notes = [];
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
                notes.push(`Contract ${activity.contractName} gained ${change.toFixed(1)}% more activity this week. ` +
                    `Watch out for potential launch or major update.`);
            }
        }
    }
    return notes.slice(0, 5); // Return top 5 analysis notes
}
