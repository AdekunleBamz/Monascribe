// scripts/fetch-events-cmc.js
require('dotenv').config({ path: ['.env.local', '.env'], override: true });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const CMCAL_KEY = process.env.COINMARKETCAL_API_KEY;

async function run(){
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB);

  const url = `https://developers.coinmarketcal.com/v1/events?upcoming=true&limit=20`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json', 'x-api-key': CMCAL_KEY }});
  if(!res.ok) throw new Error(`CoinMarketCal ${res.status}`);
  const json = await res.json();

  const events = json.body.map((event) => ({
    id: `cmc-${event.id}`,
    source: 'CoinMarketCal',
    title: event.title,
    description: event.description || 'No description.',
    date_event: event.date_event,
    coins: event.coins.map(c => c.symbol).join(', ')
  }));

  if (events.length > 0) {
    const bulkOps = events.map(event => ({
      updateOne: {
        filter: { id: event.id },
        update: { $set: event },
        upsert: true
      }
    }));
    await db.collection('alpha_events').bulkWrite(bulkOps);
  }

  await client.close();
  console.log(`✅ CoinMarketCal saved: ${events.length} events.`);
}

run().catch(err=>{ console.error(err); process.exit(1); });
