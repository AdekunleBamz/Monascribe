import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/monascribe';
const DBNAME = process.env.MONGODB_DB || 'monascribe';
const COINGECKO_BASE = process.env.COINGECKO_BASE || 'https://api.coingecko.com/api/v3';
const ENVIO_GRAPHQL_URL = process.env.ENVIO_GRAPHQL_URL || 'http://127.0.0.1:8080/v1/graphql';

export async function fetchTrendingCoins() {
  try {
    const tRes = await fetch(`${COINGECKO_BASE}/search/trending`);
    if (!tRes.ok) throw new Error('CoinGecko trending failed ' + tRes.status);
    const tJson = await tRes.json();
    const ids = tJson.coins.map((c: any) => c.item.id).join(',');

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
    console.error('Failed to fetch trending coins:', error);
    return null;
  }
}

export async function fetchCoinEvents() {
  try {
    const CMC_API_KEY = process.env.COINMARKETCAL_API_KEY;
    if (!CMC_API_KEY) {
      console.warn('COINMARKETCAL_API_KEY not set');
      return [];
    }

    const url = `https://developers.coinmarketcal.com/v1/events?max=50`;
    const res = await fetch(url, { headers: { 'x-api-key': CMC_API_KEY } });
    if (!res.ok) throw new Error('CoinMarketCal failed ' + res.status);
    const data = await res.json();

    return data.body.map((event: any) => ({
      id: `cmc-${event.id}`,
      source: 'CoinMarketCal',
      title: event.title,
      description: event.description || 'No description.',
      date_event: event.date_event,
      coins: event.coins?.map((c: any) => c.symbol).join(', ') || 'N/A',
      url: event.proof || event.source || null
    }));
  } catch (error) {
    console.error('Failed to fetch coin events:', error);
    return [];
  }
}

export async function fetchCoinPanic() {
  try {
    const CP_API_KEY = process.env.CRYPTOPANIC_API_KEY;
    if (!CP_API_KEY) {
      console.warn('CRYPTOPANIC_API_KEY not set');
      return [];
    }

    const url = `https://cryptopanic.com/api/v1/posts/?auth_token=${CP_API_KEY}&public=true`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('CryptoPanic failed ' + res.status);
    const data = await res.json();

    return data.results.map((post: any) => ({
      id: `cp-${post.id}`,
      source: 'CryptoPanic',
      title: post.title,
      description: post.url,
      date_event: post.created_at,
      coins: post.currencies?.map((c: any) => c.code).join(', ') || 'N/A',
      sentiment: post.kind || 'neutral'
    }));
  } catch (error) {
    console.error('Failed to fetch coin panic:', error);
    return [];
  }
}

export async function fetchOnchainMetrics(address?: string) {
  if (!address) return null;

  try {
    const query = `
      query {
        SubscriptionService_Subscribed(
          where: { subscriber: { _eq: "${address.toLowerCase()}" } }
          order_by: { timestamp: desc }
          limit: 1
        ) {
          subscriber
          planId
          expiresAt
          timestamp
        }
      }
    `;

    const res = await fetch(ENVIO_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!res.ok) throw new Error('Envio GraphQL failed ' + res.status);
    const data = await res.json();

    return data.data?.SubscriptionService_Subscribed?.[0] || null;
  } catch (error) {
    console.error('Failed to fetch onchain metrics:', error);
    return null;
  }
}

export async function saveToMongo(collectionName: string, data: any) {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DBNAME);

    await db.collection(collectionName).insertOne({
      ...data,
      timestamp: new Date()
    });

    await client.close();
    return true;
  } catch (error) {
    console.error(`Failed to save to ${collectionName}:`, error);
    return false;
  }
}

export async function getFromMongo(collectionName: string, query: any = {}) {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DBNAME);

    const data = await db.collection(collectionName).find(query).sort({ timestamp: -1 }).limit(1).toArray();

    await client.close();
    return data[0] || null;
  } catch (error) {
    console.error(`Failed to get from ${collectionName}:`, error);
    return null;
  }
}
