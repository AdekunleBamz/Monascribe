import { saveMarketData, fetchMarketData } from '../lib/coingecko.js';
import { saveUpcomingEvents, saveNewsDigest, saveMonadSnapshot } from '../lib/basicTierFeatures.js';
import { saveSmartMoneyAlert, saveDEXActivity, saveHistoricalComparison, saveTokenNarrative } from '../lib/premiumTierFeatures.js';
import { saveWhaleData, createRealTimeAlert, generateAISummary } from '../lib/vipTierFeatures.js';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PID_FILE = path.join(__dirname, 'cron.pid');

async function startCronJobs() {
  // Create a PID file to signal the cron job is running
  fs.writeFileSync(PID_FILE, process.pid.toString());

  // Ensure the PID file is removed on exit
  process.on('exit', () => fs.existsSync(PID_FILE) && fs.unlinkSync(PID_FILE));
  process.on('SIGINT', () => process.exit());
  process.on('SIGTERM', () => process.exit());

  // Dynamically import node-cron
  const cron = await import('node-cron');

  // Market data cron - every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('🔄 Fetching market data...');
    const marketData = await fetchMarketData();
    await saveMarketData(marketData);
    console.log('✅ Market data saved successfully');
  } catch (error) {
    console.error('❌ Error fetching market data:', error);
  }
});

// Upcoming events cron - every 6 hours
cron.schedule('0 */6 * * *', async () => {
  try {
    console.log('🔄 Fetching upcoming events...');
    
    // Fetch from CoinMarketCal API
    const apiKey = process.env.COINMARKETCAL_API_KEY;
    if (!apiKey) {
      console.log('⚠️ CoinMarketCal API key not found, skipping events fetch');
      return;
    }
    const eventsResponse = await fetch(`https://coinmarketcal.com/api/v1/events?max=10&api_key=${apiKey}`);
    const eventsData = await eventsResponse.json() as any;
    
    if (eventsData && eventsData.body) {
      const events = eventsData.body.map((event: any) => ({
        title: event.title,
        date: event.date_event,
        coin: event.coins[0]?.symbol || 'Unknown',
        category: event.categories[0]?.name || 'general',
        url: event.url,
        description: event.description
      }));
      
      await saveUpcomingEvents(events);
      console.log('✅ Upcoming events saved successfully');
    }
  } catch (error) {
    console.error('❌ Error fetching upcoming events:', error);
  }
});

// News digest cron - every 2 hours
cron.schedule('0 */2 * * *', async () => {
  try {
    console.log('🔄 Fetching news digest...');
    
    // Fetch from CryptoPanic API
    const cryptoPanicKey = process.env.CRYPTOPANIC_API_KEY;
    if (!cryptoPanicKey) {
      console.log('⚠️ CryptoPanic API key not found, skipping news fetch');
      return;
    }
    const newsResponse = await fetch(`https://cryptopanic.com/api/developer/v2/posts/?auth_token=${cryptoPanicKey}&public=true`);
    const newsData = await newsResponse.json() as any;
    
    if (newsData && newsData.results) {
      const articles = newsData.results.slice(0, 5).map((article: any) => ({
        title: article.title,
        source: article.source.title,
        url: article.url,
        publishedAt: article.published_at,
        sentiment: article.sentiment || 'neutral',
        description: article.metadata?.description
      }));
      
      await saveNewsDigest(articles);
      console.log('✅ News digest saved successfully');
    }
  } catch (error) {
    console.error('❌ Error fetching news digest:', error);
  }
});

// Monad ecosystem snapshot cron - every 24 hours
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('🔄 Generating Monad ecosystem snapshot...');
    
    // Query Envio GraphQL for current stats
    const envioResponse = await fetch(process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL || 'http://localhost:4000/v1/graphql', {
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
    
    const envioData = await envioResponse.json() as any;
    
    if (envioData.data) {
      const snapshot = {
        week: Math.ceil(Date.now() / (7 * 24 * 60 * 60 * 1000)),
        subsCount: envioData.data.SubscriptionService_Subscribed_aggregate.aggregate.count,
        txCount: envioData.data.TokenTransfer_aggregate.aggregate.count,
        topContracts: [] // Would need additional query
      };
      
      await saveMonadSnapshot(snapshot);
      console.log('✅ Monad ecosystem snapshot saved successfully');
    }
  } catch (error) {
    console.error('❌ Error generating Monad snapshot:', error);
  }
});

// Smart money alerts cron - every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  try {
    console.log('🔄 Updating smart money alerts...');
    
    // Query for high-volume wallets
    const highVolumeWallets = await fetch(process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL || 'http://localhost:4000/v1/graphql', {
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
    
    const walletData = await highVolumeWallets.json() as any;
    
    if (walletData.data && walletData.data.TokenTransfer) {
      const walletStats = new Map();
      
      walletData.data.TokenTransfer.forEach((tx: any) => {
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
          await saveSmartMoneyAlert({
            walletAddress: wallet,
            contractAddress: Array.from(stats.contracts)[0] as string,
            contractName: `Contract ${(Array.from(stats.contracts)[0] as string)?.slice(0, 8)}...`,
            transactionCount: stats.txCount,
            totalVolume: stats.totalVolume,
            lastActivity: new Date(),
            alertType: 'high_volume'
          });
        }
      }
      
      console.log('✅ Smart money alerts updated successfully');
    }
  } catch (error) {
    console.error('❌ Error updating smart money alerts:', error);
  }
});

// Whale tracking cron - every hour
cron.schedule('0 * * * *', async () => {
  try {
    console.log('🔄 Updating whale tracking...');
    
    // Query for large transactions
    const largeTxs = await fetch(process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL || 'http://localhost:4000/v1/graphql', {
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
    
    const txData = await largeTxs.json() as any;
    
    if (txData.data && txData.data.TokenTransfer) {
      const whaleStats = new Map();
      
      txData.data.TokenTransfer.forEach((tx: any) => {
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
          await saveWhaleData({
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
  } catch (error) {
    console.error('❌ Error updating whale tracking:', error);
  }
});

// AI summary generation cron - weekly
cron.schedule('0 0 * * 0', async () => {
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
    
    await generateAISummary(currentWeek, summaryData);
    console.log('✅ AI summary generated successfully');
  } catch (error) {
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
}

startCronJobs().catch(err => {
  console.error("Failed to start cron jobs:", err);
});
