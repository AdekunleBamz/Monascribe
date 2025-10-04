// scripts/fetch-market-coingecko.js
require('dotenv').config();
const { MongoClient } = require('mongodb');
const MONGODB_URI = process.env.MONGODB_URI;
const DBNAME = process.env.MONGODB_DB || 'monascribe';
const BASE = process.env.COINGECKO_BASE || 'https://api.coingecko.com/api/v3';

async function run(){
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DBNAME);

  const url = `${BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h`;
  const r = await fetch(url);
  if(!r.ok) throw new Error('CoinGecko markets failed ' + r.status);
  const data = await r.json();

  const doc = { source:'coingecko_markets', timestamp: new Date(), data };
  await db.collection('screener_history').insertOne(doc);
  await db.collection('screener_cache').updateOne(
    { key: 'market_latest' },
    { $set: { data, ts: Date.now() } },
    { upsert: true }
  );

  await client.close();
  console.log('✅ CoinGecko market snapshot saved');
}

run().catch(err => { console.error(err); process.exit(1); });
