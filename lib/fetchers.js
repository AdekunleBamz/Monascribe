const axios = require('axios');

const COINGECKO_BASE = process.env.COINGECKO_BASE || 'https://api.coingecko.com/api/v3';
const ENVIO_GRAPHQL = process.env.ENVIO_GRAPHQL_URL || 'http://127.0.0.1:8080/v1/graphql';

export async function fetchTrendingFromCoingecko() {
  try {
    const { data } = await axios.get(`${COINGECKO_BASE}/search/trending`);
    return data.coins.map(c => ({
      name: c.item.name,
      symbol: c.item.symbol,
      thumb: c.item.thumb,
      price_btc: c.item.price_btc,
    }));
  } catch (error) {
    console.error('Failed to fetch trending from CoinGecko:', error);
    return [];
  }
}

export async function fetchEnvioMetrics() {
  try {
    const query = `
      {
        SubscriptionService_Subscribed(limit: 10) {
          subscriber
          planId
          expiresAt
          timestamp
        }
        SubscriptionService_SubscriptionCancelled(limit: 5) {
          subscriber
          timestamp
        }
      }
    `;

    const res = await axios.post(ENVIO_GRAPHQL, { query });
    return res.data.data;
  } catch (error) {
    console.error('Failed to fetch Envio metrics:', error);
    return { SubscriptionService_Subscribed: [], SubscriptionService_SubscriptionCancelled: [] };
  }
}

export async function fetchCoinMarketCalEvents() {
  try {
    const CMC_KEY = process.env.COINMARKETCAL_API_KEY;
    if (!CMC_KEY) {
      console.warn('COINMARKETCAL_API_KEY not set');
      return [];
    }

    const { data } = await axios.get(`https://developers.coinmarketcal.com/v1/events?max=5`, {
      headers: { "x-api-key": CMC_KEY },
    });
    return data.body || [];
  } catch (error) {
    console.error('Failed to fetch CoinMarketCal events:', error);
    return [];
  }
}

export async function fetchCoinPanicNews() {
  try {
    const CP_KEY = process.env.CRYPTOPANIC_API_KEY;
    if (!CP_KEY) {
      console.warn('CRYPTOPANIC_API_KEY not set');
      return [];
    }

    const { data } = await axios.get(`https://cryptopanic.com/api/v1/posts/?auth_token=${CP_KEY}&public=true`);
    return data.results.slice(0, 5);
  } catch (error) {
    console.error('Failed to fetch CoinPanic news:', error);
    return [];
  }
}

export async function getSubscriptionData() {
  try {
    const mongoose = require('mongoose');
    const MONGO_URI = process.env.MONGODB_URI;

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGO_URI, { dbName: "monascribe" });
    }

    const subs = await mongoose.connection
      .collection("subscription_events")
      .find({})
      .sort({ timestamp: -1 })
      .limit(5)
      .toArray();

    return subs;
  } catch (error) {
    console.error('Failed to fetch subscription data:', error);
    return [];
  }
}
