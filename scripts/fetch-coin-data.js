require('dotenv').config({ path: ['.env.local', '.env'] });
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DBNAME = process.env.MONGODB_DB || 'monascribe';
const BASE = process.env.COINGECKO_BASE || 'https://api.coingecko.com/api/v3';

async function fetchTrendingCoins() {
  try {
    const tRes = await fetch(`${BASE}/search/trending`);
    if (!tRes.ok) throw new Error('CoinGecko trending failed ' + tRes.status);
    const tJson = await tRes.json();
    const ids = tJson.coins.map((c) => c.item.id).join(',');

    let markets = [];
    if (ids) {
      const mRes = await fetch(`${BASE}/coins/markets?vs_currency=usd&ids=${encodeURIComponent(ids)}&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h`);
      markets = await mRes.json();
    }

    return {
      source: 'coingecko_trending',
      timestamp: new Date(),
      trending: tJson.coins,
      marketData: markets
    };
  } catch (error) {
    console.error('Failed to fetch trending coins:', error);
    return null;
  }
}

async function run() {
  console.log('Fetching coin data...');

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DBNAME);

    // Fetch trending coins
    const trendingData = await fetchTrendingCoins();

    if (trendingData) {
      // Save trending data
      await db.collection('screener_cache').updateOne(
        { key: 'trending_latest' },
        { $set: { data: trendingData, ts: Date.now() } },
        { upsert: true }
      );

      console.log('✅ Trending coins saved');
    }

    // Fetch market data
    const url = `${BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h`;
    const r = await fetch(url);
    if (r.ok) {
      const data = await r.json();

      const doc = { source: 'coingecko_markets', timestamp: new Date(), data };
      await db.collection('screener_history').insertOne(doc);
      await db.collection('screener_cache').updateOne(
        { key: 'market_latest' },
        { $set: { data, ts: Date.now() } },
        { upsert: true }
      );

      console.log('✅ Market data saved');
    }

    await client.close();
  } catch (error) {
    console.error('Error fetching coin data:', error);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
