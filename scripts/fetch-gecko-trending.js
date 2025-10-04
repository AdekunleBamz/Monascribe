// scripts/fetch-gecko-trending.js
require('dotenv').config({ path: ['.env.local', '.env'], override: true });
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DBNAME = process.env.MONGODB_DB || 'monascribe';
const BASE = process.env.COINGECKO_BASE || 'https://api.coingecko.com/api/v3';

async function run(){
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DBNAME);

  const tRes = await fetch(`${BASE}/search/trending`);
  if(!tRes.ok) throw new Error('CoinGecko trending failed ' + tRes.status);
  const tJson = await tRes.json();
  const ids = Array.isArray(tJson?.coins) ? tJson.coins.map(c=>c?.item?.id).filter(Boolean).join(',') : '';

  let markets = [];
  if(ids) {
    const mRes = await fetch(`${BASE}/coins/markets?vs_currency=usd&ids=${encodeURIComponent(ids)}&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h`);
    if (!mRes.ok) throw new Error('CoinGecko markets failed ' + mRes.status);
    markets = await mRes.json();
  }

  const doc = {
    source: 'coingecko_trending',
    timestamp: new Date(),
    trending: tJson.coins || [],
    marketData: markets
  };

  await db.collection('screener_history').insertOne(doc);
  await db.collection('screener_cache').updateOne(
    { key: 'trending_latest' },
    { $set: { data: doc, ts: Date.now() } },
    { upsert: true }
  );

  await client.close();
  console.log('✅ CoinGecko trending saved');
}

run().catch(err => { console.error(err); process.exit(1); });


