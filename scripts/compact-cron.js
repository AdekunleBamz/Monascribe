require('dotenv').config({ path: ['.env.local', '.env'] });
const cron = require('node-cron');
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DBNAME = process.env.MONGODB_DB || 'monascribe';
const COINGECKO_BASE = process.env.COINGECKO_BASE || 'https://api.coingecko.com/api/v3';

async function fetchTrendingData() {
  try {
    const tRes = await fetch(`${COINGECKO_BASE}/search/trending`);
    if (!tRes.ok) throw new Error('CoinGecko trending failed ' + tRes.status);
    const tJson = await tRes.json();
    const ids = tJson.coins.map((c) => c.item.id).join(',');

    let markets = [];
    if (ids) {
      const mRes = await fetch(`${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${encodeURIComponent(ids)}&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h`);
      markets = await mRes.json();
    }

    return {
      source: 'coingecko_trending',
      timestamp: new Date(),
      trending: tJson.coins,
      marketData: markets
    };
  } catch (error) {
    console.error('Failed to fetch trending data:', error);
    return null;
  }
}

async function fetchMarketData() {
  try {
    const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('CoinGecko markets failed ' + r.status);
    const data = await r.json();

    return {
      source: 'coingecko_markets',
      timestamp: new Date(),
      data
    };
  } catch (error) {
    console.error('Failed to fetch market data:', error);
    return null;
  }
}

async function fetchEventsData() {
  try {
    const CMC_API_KEY = process.env.COINMARKETCAL_API_KEY;
    const CP_API_KEY = process.env.CRYPTOPANIC_API_KEY;

    // Fetch CoinMarketCal events
    let cmcEvents = [];
    if (CMC_API_KEY) {
      const cmcRes = await fetch(`https://developers.coinmarketcal.com/v1/events?max=5`, {
        headers: { 'x-api-key': CMC_API_KEY }
      });
      if (cmcRes.ok) {
        const cmcData = await cmcRes.json();
        cmcEvents = cmcData.body || [];
      }
    }

    // Fetch CryptoPanic news
    let cpNews = [];
    if (CP_API_KEY) {
      const cpRes = await fetch(`https://cryptopanic.com/api/v1/posts/?auth_token=${CP_API_KEY}&public=true`);
      if (cpRes.ok) {
        const cpData = await cpRes.json();
        cpNews = cpData.results.slice(0, 5);
      }
    }

    return {
      events: cmcEvents,
      news: cpNews,
      count: cmcEvents.length + cpNews.length,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Failed to fetch events data:', error);
    return { events: [], news: [], count: 0, timestamp: new Date() };
  }
}

async function run() {
  console.log('🕐 Running compact cron jobs...');

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DBNAME);

  try {
    // Fetch and save trending data
    const trendingData = await fetchTrendingData();
    if (trendingData) {
      await db.collection('screener_cache').updateOne(
        { key: 'trending_latest' },
        { $set: { data: trendingData, ts: Date.now() } },
        { upsert: true }
      );
      console.log('✅ Trending data saved');
    }

    // Fetch and save market data
    const marketData = await fetchMarketData();
    if (marketData) {
      await db.collection('screener_history').insertOne(marketData);
      await db.collection('screener_cache').updateOne(
        { key: 'market_latest' },
        { $set: { data: marketData.data, ts: Date.now() } },
        { upsert: true }
      );
      console.log('✅ Market data saved');
    }

    // Fetch and save events data
    const eventsData = await fetchEventsData();
    await db.collection('events').updateOne(
      { type: 'latest' },
      { $set: eventsData },
      { upsert: true }
    );
    console.log(`✅ Events data saved: ${eventsData.count} items`);

  } catch (error) {
    console.error('❌ Cron job error:', error);
  }

  await client.close();
}

// Run every hour
cron.schedule('0 * * * *', () => {
  console.log('Starting scheduled cron job...');
  run().catch(err => console.error('Cron run failed:', err));
});

console.log('⏰ Compact cron scheduler started - running every hour');
console.log('📊 Will fetch: trending data, market data, events & news');

module.exports = { run };
