require('dotenv').config({ path: ['.env.local', '.env'] });
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DBNAME = process.env.MONGODB_DB || 'monascribe';
const CMC_API_KEY = process.env.COINMARKETCAL_API_KEY;
const CP_API_KEY = process.env.CRYPTOPANIC_API_KEY;

async function fetchCoinEvents() {
  if (!CMC_API_KEY) {
    console.warn('COINMARKETCAL_API_KEY not set');
    return [];
  }
  try {
    const url = `https://developers.coinmarketcal.com/v1/events?max=50`;
    const res = await fetch(url, { headers: { 'x-api-key': CMC_API_KEY } });
    if (!res.ok) throw new Error('CoinMarketCal failed ' + res.status);
    const data = await res.json();

    return data.body.map((event) => ({
      id: `cmc-${event.id}`,
      source: 'CoinMarketCal',
      title: event.title,
      description: event.description || 'No description.',
      date_event: event.date_event,
      coins: event.coins?.map((c) => c.symbol).join(', ') || 'N/A',
      url: event.proof || event.source || null
    }));
  } catch (error) {
    console.error('Failed to fetch coin events:', error);
    return [];
  }
}

async function fetchCoinPanic() {
  if (!CP_API_KEY) {
    console.warn('CRYPTOPANIC_API_KEY not set');
    return [];
  }
  try {
    const url = `https://cryptopanic.com/api/v1/posts/?auth_token=${CP_API_KEY}&public=true`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('CryptoPanic failed ' + res.status);
    const data = await res.json();

    return data.results.map((post) => ({
      id: `cp-${post.id}`,
      source: 'CryptoPanic',
      title: post.title,
      description: post.url,
      date_event: post.created_at,
      coins: post.currencies?.map((c) => c.code).join(', ') || 'N/A',
      sentiment: post.kind || 'neutral'
    }));
  } catch (error) {
    console.error('Failed to fetch coin panic:', error);
    return [];
  }
}

async function run() {
  console.log('Fetching events data...');

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DBNAME);

    // Fetch CoinMarketCal events
    const cmcEvents = await fetchCoinEvents();

    // Fetch CryptoPanic news
    const cpNews = await fetchCoinPanic();

    const allEvents = [...cmcEvents, ...cpNews];

    if (allEvents.length > 0) {
      // Save events data
      await db.collection('events').updateOne(
        { type: 'latest' },
        { $set: {
          events: allEvents,
          count: allEvents.length,
          sources: {
            coinmarketcal: cmcEvents.length,
            cryptopanic: cpNews.length
          },
          timestamp: new Date()
        }},
        { upsert: true }
      );

      console.log(`✅ Events saved: ${allEvents.length} items (${cmcEvents.length} CMC, ${cpNews.length} CP)`);
    } else {
      console.log('No events to save');
    }

    await client.close();
  } catch (error) {
    console.error('Error fetching events:', error);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
