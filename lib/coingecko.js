"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchMarketData = fetchMarketData;
exports.fetchCoinDetails = fetchCoinDetails;
exports.fetchTrendingCoins = fetchTrendingCoins;
exports.saveMarketData = saveMarketData;
exports.saveTrendingData = saveTrendingData;
exports.getLatestMarketData = getLatestMarketData;
exports.getLatestTrendingData = getLatestTrendingData;
exports.isDataFresh = isDataFresh;
exports.getTop10Coins = getTop10Coins;
exports.searchCoins = searchCoins;
const db_1 = require("./db");
// Fetch market data for multiple coins
async function fetchMarketData(ids = ['bitcoin', 'ethereum', 'monad']) {
    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd&include_market_cap=true&include_24hr_change=true&include_24hr_vol=true&include_last_updated_at=true`);
        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status}`);
        }
        return await response.json();
    }
    catch (error) {
        console.error('Failed to fetch market data:', error);
        throw error;
    }
}
// Fetch detailed coin data
async function fetchCoinDetails(coinId) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&sparkline=true&community_data=false&developer_data=false`);
        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status}`);
        }
        const data = await response.json();
        return {
            id: data.id,
            symbol: data.symbol,
            name: data.name,
            current_price: ((_b = (_a = data.market_data) === null || _a === void 0 ? void 0 : _a.current_price) === null || _b === void 0 ? void 0 : _b.usd) || 0,
            market_cap: ((_d = (_c = data.market_data) === null || _c === void 0 ? void 0 : _c.market_cap) === null || _d === void 0 ? void 0 : _d.usd) || 0,
            market_cap_rank: ((_e = data.market_data) === null || _e === void 0 ? void 0 : _e.market_cap_rank) || 0,
            total_volume: ((_g = (_f = data.market_data) === null || _f === void 0 ? void 0 : _f.total_volume) === null || _g === void 0 ? void 0 : _g.usd) || 0,
            price_change_percentage_24h: ((_h = data.market_data) === null || _h === void 0 ? void 0 : _h.price_change_percentage_24h) || 0,
            price_change_percentage_7d: ((_k = (_j = data.market_data) === null || _j === void 0 ? void 0 : _j.price_change_percentage_7d_in_currency) === null || _k === void 0 ? void 0 : _k.usd) || 0,
            sparkline_7d: ((_m = (_l = data.market_data) === null || _l === void 0 ? void 0 : _l.sparkline_7d) === null || _m === void 0 ? void 0 : _m.price) || [],
            description: ((_o = data.description) === null || _o === void 0 ? void 0 : _o.en) || '',
            image: ((_p = data.image) === null || _p === void 0 ? void 0 : _p.large) || ((_q = data.image) === null || _q === void 0 ? void 0 : _q.small) || '',
            last_updated: data.last_updated || new Date().toISOString()
        };
    }
    catch (error) {
        console.error(`Failed to fetch details for ${coinId}:`, error);
        return null;
    }
}
// Fetch trending coins
async function fetchTrendingCoins() {
    var _a;
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/search/trending');
        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status}`);
        }
        const data = await response.json();
        return ((_a = data.coins) === null || _a === void 0 ? void 0 : _a.map((coin) => ({
            id: coin.item.id,
            name: coin.item.name,
            symbol: coin.item.symbol,
            market_cap_rank: coin.item.market_cap_rank,
            thumb: coin.item.thumb,
            small: coin.item.small,
            large: coin.item.large,
            slug: coin.item.slug,
            price_btc: coin.item.price_btc,
            score: coin.item.score
        }))) || [];
    }
    catch (error) {
        console.error('Failed to fetch trending coins:', error);
        return [];
    }
}
// Save market data to MongoDB
async function saveMarketData(data) {
    try {
        const db = await (0, db_1.getDb)();
        const collection = db.collection('market_data');
        await collection.insertOne({
            data,
            createdAt: new Date(),
            type: 'market_data'
        });
        console.log('✅ Market data saved to MongoDB');
    }
    catch (error) {
        console.error('❌ Failed to save market data:', error);
        throw error;
    }
}
// Save trending data to MongoDB
async function saveTrendingData(data) {
    try {
        const db = await (0, db_1.getDb)();
        const collection = db.collection('trending_data');
        await collection.insertOne({
            data,
            createdAt: new Date(),
            type: 'trending'
        });
        console.log('✅ Trending data saved to MongoDB');
    }
    catch (error) {
        console.error('❌ Failed to save trending data:', error);
        throw error;
    }
}
// Get latest market data from MongoDB
async function getLatestMarketData() {
    try {
        const db = await (0, db_1.getDb)();
        const collection = db.collection('market_data');
        const latest = await collection.findOne({ type: 'market_data' }, { sort: { createdAt: -1 } });
        return (latest === null || latest === void 0 ? void 0 : latest.data) || null;
    }
    catch (error) {
        console.error('❌ Failed to get latest market data:', error);
        return null;
    }
}
// Get latest trending data from MongoDB
async function getLatestTrendingData() {
    try {
        const db = await (0, db_1.getDb)();
        const collection = db.collection('trending_data');
        const latest = await collection.findOne({ type: 'trending' }, { sort: { createdAt: -1 } });
        return (latest === null || latest === void 0 ? void 0 : latest.data) || [];
    }
    catch (error) {
        console.error('❌ Failed to get latest trending data:', error);
        return [];
    }
}
// Check if data is fresh (less than 5 minutes old)
function isDataFresh(createdAt) {
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffMins = diffMs / (1000 * 60);
    return diffMins < 5;
}
// Get top 10 coins by market cap
async function getTop10Coins() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=true&price_change_percentage=24h,7d');
        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status}`);
        }
        const data = await response.json();
        return data.map((coin) => {
            var _a;
            return ({
                id: coin.id,
                symbol: coin.symbol,
                name: coin.name,
                current_price: coin.current_price,
                market_cap: coin.market_cap,
                market_cap_rank: coin.market_cap_rank,
                total_volume: coin.total_volume,
                price_change_percentage_24h: coin.price_change_percentage_24h,
                price_change_percentage_7d: coin.price_change_percentage_7d_in_currency,
                sparkline_7d: ((_a = coin.sparkline_in_7d) === null || _a === void 0 ? void 0 : _a.price) || [],
                image: coin.image,
                last_updated: coin.last_updated
            });
        });
    }
    catch (error) {
        console.error('Failed to fetch top 10 coins:', error);
        return [];
    }
}
// Search coins by name or symbol
async function searchCoins(query) {
    var _a;
    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status}`);
        }
        const data = await response.json();
        // Get details for each coin
        const coinDetails = await Promise.all(((_a = data.coins) === null || _a === void 0 ? void 0 : _a.slice(0, 10).map(async (coin) => {
            return await fetchCoinDetails(coin.id);
        })) || []);
        return coinDetails.filter((coin) => coin !== null);
    }
    catch (error) {
        console.error('Failed to search coins:', error);
        return [];
    }
}
