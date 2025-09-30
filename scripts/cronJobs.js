"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const coingecko_1 = require("../lib/coingecko");
const basicTierFeatures_1 = require("../lib/basicTierFeatures");
const premiumTierFeatures_1 = require("../lib/premiumTierFeatures");
const vipTierFeatures_1 = require("../lib/vipTierFeatures");
const node_fetch_1 = __importDefault(require("node-fetch"));
// Market data cron - every 5 minutes
node_cron_1.default.schedule('*/5 * * * *', async () => {
    try {
        console.log('🔄 Fetching market data...');
        await (0, coingecko_1.saveMarketData)({});
        console.log('✅ Market data saved successfully');
    }
    catch (error) {
        console.error('❌ Error fetching market data:', error);
    }
});
// Upcoming events cron - every 6 hours
node_cron_1.default.schedule('0 */6 * * *', async () => {
    try {
        console.log('🔄 Fetching upcoming events...');
        // Fetch from CoinMarketCal API
        const apiKey = process.env.COINMARKETCAL_API_KEY;
        if (!apiKey) {
            console.log('⚠️ CoinMarketCal API key not found, skipping events fetch');
            return;
        }
        const eventsResponse = await (0, node_fetch_1.default)(`https://coinmarketcal.com/api/v1/events?max=10&api_key=${apiKey}`);
        const eventsData = await eventsResponse.json();
        if (eventsData && eventsData.body) {
            const events = eventsData.body.map((event) => {
                var _a, _b;
                return ({
                    title: event.title,
                    date: event.date_event,
                    coin: ((_a = event.coins[0]) === null || _a === void 0 ? void 0 : _a.symbol) || 'Unknown',
                    category: ((_b = event.categories[0]) === null || _b === void 0 ? void 0 : _b.name) || 'general',
                    url: event.url,
                    description: event.description
                });
            });
            await (0, basicTierFeatures_1.saveUpcomingEvents)(events);
            console.log('✅ Upcoming events saved successfully');
        }
    }
    catch (error) {
        console.error('❌ Error fetching upcoming events:', error);
    }
});
// News digest cron - every 2 hours
node_cron_1.default.schedule('0 */2 * * *', async () => {
    try {
        console.log('🔄 Fetching news digest...');
        // Fetch from CryptoPanic API
        const cryptoPanicKey = process.env.CRYPTOPANIC_API_KEY;
        if (!cryptoPanicKey) {
            console.log('⚠️ CryptoPanic API key not found, skipping news fetch');
            return;
        }
        const newsResponse = await (0, node_fetch_1.default)(`https://cryptopanic.com/api/developer/v2/posts/?auth_token=${cryptoPanicKey}&public=true`);
        const newsData = await newsResponse.json();
        if (newsData && newsData.results) {
            const articles = newsData.results.slice(0, 5).map((article) => {
                var _a;
                return ({
                    title: article.title,
                    source: article.source.title,
                    url: article.url,
                    publishedAt: article.published_at,
                    sentiment: article.sentiment || 'neutral',
                    description: (_a = article.metadata) === null || _a === void 0 ? void 0 : _a.description
                });
            });
            await (0, basicTierFeatures_1.saveNewsDigest)(articles);
            console.log('✅ News digest saved successfully');
        }
    }
    catch (error) {
        console.error('❌ Error fetching news digest:', error);
    }
});
// Monad ecosystem snapshot cron - every 24 hours
node_cron_1.default.schedule('0 0 * * *', async () => {
    try {
        console.log('🔄 Generating Monad ecosystem snapshot...');
        // Query Envio GraphQL for current stats
        const envioResponse = await (0, node_fetch_1.default)(process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL || 'http://localhost:4000/v1/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
          query {
            SubscriptionService_Subscribed_aggregate {
              aggregate {
                count
              }
            }
            TokenTransfer_aggregate {
              aggregate {
                count
              }
            }
          }
        `
            })
        });
        const envioData = await envioResponse.json();
        if (envioData.data) {
            const snapshot = {
                week: Math.ceil(Date.now() / (7 * 24 * 60 * 60 * 1000)),
                subsCount: envioData.data.SubscriptionService_Subscribed_aggregate.aggregate.count,
                txCount: envioData.data.TokenTransfer_aggregate.aggregate.count,
                topContracts: [] // Would need additional query
            };
            await (0, basicTierFeatures_1.saveMonadSnapshot)(snapshot);
            console.log('✅ Monad ecosystem snapshot saved successfully');
        }
    }
    catch (error) {
        console.error('❌ Error generating Monad snapshot:', error);
    }
});
// Smart money alerts cron - every 30 minutes
node_cron_1.default.schedule('*/30 * * * *', async () => {
    var _a;
    try {
        console.log('🔄 Updating smart money alerts...');
        // Query for high-volume wallets
        const highVolumeWallets = await (0, node_fetch_1.default)(process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL || 'http://localhost:4000/v1/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
          query {
            TokenTransfer(limit: 100, order_by: {value: desc}) {
              from
              to
              value
              contractAddress
              timestamp
            }
          }
        `
            })
        });
        const walletData = await highVolumeWallets.json();
        if (walletData.data && walletData.data.TokenTransfer) {
            const walletStats = new Map();
            walletData.data.TokenTransfer.forEach((tx) => {
                const wallet = tx.from;
                if (!walletStats.has(wallet)) {
                    walletStats.set(wallet, {
                        totalVolume: 0,
                        txCount: 0,
                        contracts: new Set()
                    });
                }
                const stats = walletStats.get(wallet);
                stats.totalVolume += parseFloat(tx.value || 0);
                stats.txCount++;
                stats.contracts.add(tx.contractAddress);
            });
            // Save top wallets as smart money alerts
            for (const [wallet, stats] of Array.from(walletStats.entries())) {
                if (stats.totalVolume > 1000) { // Threshold for smart money
                    await (0, premiumTierFeatures_1.saveSmartMoneyAlert)({
                        walletAddress: wallet,
                        contractAddress: Array.from(stats.contracts)[0],
                        contractName: `Contract ${(_a = Array.from(stats.contracts)[0]) === null || _a === void 0 ? void 0 : _a.slice(0, 8)}...`,
                        transactionCount: stats.txCount,
                        totalVolume: stats.totalVolume,
                        lastActivity: new Date(),
                        alertType: 'high_volume'
                    });
                }
            }
            console.log('✅ Smart money alerts updated successfully');
        }
    }
    catch (error) {
        console.error('❌ Error updating smart money alerts:', error);
    }
});
// Whale tracking cron - every hour
node_cron_1.default.schedule('0 * * * *', async () => {
    try {
        console.log('🔄 Updating whale tracking...');
        // Query for large transactions
        const largeTxs = await (0, node_fetch_1.default)(process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL || 'http://localhost:4000/v1/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
          query {
            TokenTransfer(where: {value: {_gt: "1000000"}}, limit: 50, order_by: {value: desc}) {
              from
              to
              value
              timestamp
            }
          }
        `
            })
        });
        const txData = await largeTxs.json();
        if (txData.data && txData.data.TokenTransfer) {
            const whaleStats = new Map();
            txData.data.TokenTransfer.forEach((tx) => {
                const wallet = tx.from;
                if (!whaleStats.has(wallet)) {
                    whaleStats.set(wallet, {
                        totalVolume: 0,
                        txCount: 0,
                        movements: []
                    });
                }
                const stats = whaleStats.get(wallet);
                stats.totalVolume += parseFloat(tx.value || 0);
                stats.txCount++;
                stats.movements.push({
                    token: 'MON', // Assuming Monad token
                    amount: parseFloat(tx.value || 0),
                    value: parseFloat(tx.value || 0),
                    timestamp: new Date(tx.timestamp),
                    type: 'out'
                });
            });
            // Save top whales
            let rank = 1;
            for (const [wallet, stats] of Array.from(whaleStats.entries())) {
                if (stats.totalVolume > 1000000) { // 1M threshold for whales
                    await (0, vipTierFeatures_1.saveWhaleData)({
                        address: wallet,
                        rank,
                        totalVolume: stats.totalVolume,
                        transactionCount: stats.txCount,
                        lastActivity: new Date(),
                        topMovements: stats.movements.slice(0, 5),
                        portfolioValue: stats.totalVolume,
                        riskScore: Math.min(100, stats.txCount * 10)
                    });
                    rank++;
                }
            }
            console.log('✅ Whale tracking updated successfully');
        }
    }
    catch (error) {
        console.error('❌ Error updating whale tracking:', error);
    }
});
// AI summary generation cron - weekly
node_cron_1.default.schedule('0 0 * * 0', async () => {
    try {
        console.log('🔄 Generating AI summary...');
        const currentWeek = Math.ceil(Date.now() / (7 * 24 * 60 * 60 * 1000));
        // Generate summary data
        const summaryData = {
            whaleActivity: Math.random() * 100, // Would be calculated from real data
            dexVolume: Math.random() * 1000000,
            sentimentScore: (Math.random() - 0.5) * 100,
            topNarratives: ['DeFi', 'Layer 2', 'NFTs', 'Gaming', 'AI']
        };
        await (0, vipTierFeatures_1.generateAISummary)(currentWeek, summaryData);
        console.log('✅ AI summary generated successfully');
    }
    catch (error) {
        console.error('❌ Error generating AI summary:', error);
    }
});
console.log('🚀 Cron jobs started successfully!');
console.log('📊 Market data: Every 5 minutes');
console.log('📅 Events: Every 6 hours');
console.log('📰 News: Every 2 hours');
console.log('🌐 Monad snapshot: Daily');
console.log('💰 Smart money alerts: Every 30 minutes');
console.log('🐋 Whale tracking: Hourly');
console.log('🤖 AI summary: Weekly');
