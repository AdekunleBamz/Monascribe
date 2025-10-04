// scripts/fetch-market.js
require('dotenv').config({ path: ['.env.local', '.env'], override: true });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

async function fetchFromCoinGecko() {
  const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  const json = await res.json();
  return { source: 'coingecko', data: json };
}

async function run(){
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'monascribe');

  const payload = await fetchFromCoinGecko();

  const doc = {
    source: payload.source,
    timestamp: new Date(),
    data: payload.data,
  };

  // insert history (time series)
  await db.collection('screener_history').insertOne(doc);
  // update latest cache
  await db.collection('screener_cache').updateOne(
    { key: 'market_latest' },
    { $set: { data: payload.data, ts: Date.now(), source: payload.source } },
    { upsert: true }
  );

  await client.close();
  console.log(`✅ Market saved via ${payload.source}`);
}

run().catch(err=>{ console.error(err); process.exit(1); });


