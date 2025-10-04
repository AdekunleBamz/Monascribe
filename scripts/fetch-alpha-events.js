require('dotenv').config({ path: ['.env.local', '.env'] });
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DBNAME = process.env.MONGODB_DB || 'monascribe';
const CMC_API_KEY = process.env.COINMARKETCAL_API_KEY;
const CP_API_KEY = process.env.CRYPTOPANIC_API_KEY;

async function fetchCoinMarketCalEvents() {
  if (!CMC_API_KEY) {
    console.warn('COINMARKETCAL_API_KEY not set. Skipping CoinMarketCal events.');
    return [];
  }
  try {
    const url = `https://developers.coinmarketcal.com/v1/events?max=50`;
    const res = await fetch(url, { headers: { 'x-api-key': CMC_API_KEY } });
    if (!res.ok) {
      console.error(`CoinMarketCal API error: ${res.status}`);
      return [];
    }
    const data = await res.json();
    return data.body.map((event) => ({
      id: `cmc-${event.id}`,
      source: 'CoinMarketCal',
      title: event.title,
      description: event.description || 'No description.',
      date_event: event.date_event,
      coins: event.coins.map(c => c.symbol).join(', ')
    }));
  } catch (error) {
    console.error('Failed to fetch CoinMarketCal events:', error);
    return [];
  }
}

async function fetchCryptoPanicNews() {
  if (!CP_API_KEY) {
    console.warn('CRYPTOPANIC_API_KEY not set. Skipping CryptoPanic news.');
    return [];
  }
  try {
    const url = `https://cryptopanic.com/api/v1/posts/?auth_token=${CP_API_KEY}&public=true`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`CryptoPanic API error: ${res.status}`);
      return [];
    }
    const data = await res.json();
    return data.results.map((post) => ({
      id: `cp-${post.id}`,
      source: 'CryptoPanic',
      title: post.title,
      description: post.url,
      date_event: post.created_at,
      coins: post.currencies?.map(c => c.code).join(', ') || 'N/A'
    }));
  } catch (error) {
    console.error('Failed to fetch CryptoPanic news:', error);
    return [];
  }
}

async function run() {
  console.log('Fetching alpha events...');
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DBNAME);
  const collection = db.collection('alpha_events');

  const cmcEvents = await fetchCoinMarketCalEvents();
  const cpNews = await fetchCryptoPanicNews();

  const allEvents = [...cmcEvents, ...cpNews];

  if (allEvents.length > 0) {
    // Use updateOne with upsert to avoid duplicate entries
    const bulkOps = allEvents.map(event => ({
      updateOne: {
        filter: { id: event.id },
        update: { $set: event },
        upsert: true
      }
    }));
    await collection.bulkWrite(bulkOps);
    console.log(`✅ Alpha events saved: ${allEvents.length} items.`);
  } else {
    console.log('No new alpha events to save.');
  }

  await client.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
