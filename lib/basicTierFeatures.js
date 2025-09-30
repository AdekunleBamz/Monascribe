"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cryptoTips = void 0;
exports.getCurrentWeek = getCurrentWeek;
exports.getTipOfTheWeek = getTipOfTheWeek;
exports.saveUpcomingEvents = saveUpcomingEvents;
exports.getUpcomingEvents = getUpcomingEvents;
exports.saveNewsDigest = saveNewsDigest;
exports.getNewsDigest = getNewsDigest;
exports.saveMonadSnapshot = saveMonadSnapshot;
exports.getLatestMonadSnapshot = getLatestMonadSnapshot;
exports.getBasicTierData = getBasicTierData;
const db_1 = require("./db");
// Crypto tips collection - pre-loaded educational content
exports.cryptoTips = [
    "Always check gas fees before swapping on a DEX - they can be higher than expected during network congestion.",
    "Never share your private keys or seed phrases with anyone - legitimate services will never ask for them.",
    "Diversify your portfolio across different asset classes and sectors to reduce risk.",
    "Use hardware wallets for large amounts of cryptocurrency to keep them secure offline.",
    "Research projects thoroughly before investing - check their whitepaper, team, and community.",
    "Set up price alerts to stay informed about market movements without constant monitoring.",
    "Understand the difference between market cap and fully diluted valuation (FDV) when evaluating tokens.",
    "Keep track of your crypto taxes - most jurisdictions require reporting cryptocurrency transactions.",
    "Use two-factor authentication (2FA) on all your crypto exchange accounts.",
    "Never invest more than you can afford to lose - crypto markets are highly volatile.",
    "Learn about different consensus mechanisms (PoW, PoS, etc.) to understand how networks operate.",
    "Check if a project has been audited by reputable security firms before investing.",
    "Use dollar-cost averaging (DCA) to reduce the impact of market volatility on your investments.",
    "Keep your software wallets updated to the latest version for security patches.",
    "Understand the concept of impermanent loss when providing liquidity to DEX pools.",
    "Research the tokenomics of a project - how tokens are distributed and used affects price.",
    "Use reputable exchanges with good security track records and regulatory compliance.",
    "Learn about different types of wallets - hot wallets for daily use, cold wallets for long-term storage.",
    "Understand the difference between centralized and decentralized exchanges (CEX vs DEX).",
    "Keep backups of your wallet files and seed phrases in secure, separate locations.",
    "Monitor the development activity of projects you're invested in - active development is a good sign.",
    "Understand the risks of yield farming and liquidity mining before participating.",
    "Use stop-loss orders to limit potential losses in volatile markets.",
    "Research the team behind a project - their experience and track record matter.",
    "Understand the concept of market cycles and avoid FOMO (fear of missing out) buying.",
    "Use multiple sources for market information to avoid confirmation bias.",
    "Learn about different blockchain networks and their unique features and use cases.",
    "Understand the concept of staking and how it can generate passive income.",
    "Research the competitive landscape before investing in a project.",
    "Keep your investment strategy simple and stick to it - avoid emotional trading decisions.",
    "Understand the difference between fungible and non-fungible tokens (FT vs NFT).",
    "Learn about DeFi protocols and how they work before investing in DeFi tokens.",
    "Use portfolio tracking tools to monitor your investments and performance.",
    "Understand the concept of token burns and how they can affect token supply and price.",
    "Research the regulatory environment in your jurisdiction before investing in crypto.",
    "Learn about different types of crypto derivatives and their risks.",
    "Understand the concept of cross-chain bridges and their security implications.",
    "Use reputable price aggregators to get accurate market data.",
    "Learn about different types of crypto mining and their environmental impact.",
    "Understand the concept of governance tokens and how they work in DAOs.",
    "Research the liquidity of tokens before investing - low liquidity can cause price slippage.",
    "Learn about different types of crypto scams and how to avoid them.",
    "Understand the concept of token vesting schedules and how they affect token supply.",
    "Use hardware security keys for additional protection of your crypto accounts.",
    "Learn about different types of crypto wallets and their security features.",
    "Understand the concept of token inflation and deflation mechanisms.",
    "Research the partnerships and integrations of projects you're interested in.",
    "Learn about different types of crypto trading strategies and their risks.",
    "Understand the concept of token utility and how it drives demand and value.",
    "Use reputable crypto news sources to stay informed about market developments."
];
// Get current week number
function getCurrentWeek() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}
// Get tip of the week
async function getTipOfTheWeek() {
    const db = await (0, db_1.getDb)();
    const currentWeek = getCurrentWeek();
    // Check if we have a tip for this week
    const existingTip = await db.collection('crypto_tips').findOne({ week: currentWeek });
    if (existingTip) {
        return existingTip.tip;
    }
    // Generate a new tip for this week
    const tipIndex = currentWeek % exports.cryptoTips.length;
    const tip = exports.cryptoTips[tipIndex];
    // Save the tip for this week
    await db.collection('crypto_tips').insertOne({
        week: currentWeek,
        tip,
        createdAt: new Date()
    });
    return tip;
}
// Save upcoming events
async function saveUpcomingEvents(events) {
    const db = await (0, db_1.getDb)();
    // Clear old events
    await db.collection('upcoming_events').deleteMany({});
    // Insert new events
    if (events.length > 0) {
        await db.collection('upcoming_events').insertMany(events.map(event => (Object.assign(Object.assign({}, event), { createdAt: new Date() }))));
    }
}
// Get upcoming events
async function getUpcomingEvents() {
    const db = await (0, db_1.getDb)();
    const events = await db.collection('upcoming_events')
        .find({})
        .sort({ date: 1 })
        .limit(10)
        .toArray();
    return events.map(event => ({
        title: event.title,
        date: event.date,
        coin: event.coin,
        category: event.category,
        url: event.url,
        description: event.description
    }));
}
// Save news digest
async function saveNewsDigest(articles) {
    const db = await (0, db_1.getDb)();
    // Clear old news
    await db.collection('news_digest').deleteMany({});
    // Insert new articles
    if (articles.length > 0) {
        await db.collection('news_digest').insertMany(articles.map(article => (Object.assign(Object.assign({}, article), { createdAt: new Date() }))));
    }
}
// Get news digest
async function getNewsDigest() {
    const db = await (0, db_1.getDb)();
    const articles = await db.collection('news_digest')
        .find({})
        .sort({ publishedAt: -1 })
        .limit(5)
        .toArray();
    return articles.map(article => ({
        title: article.title,
        source: article.source,
        url: article.url,
        publishedAt: article.publishedAt,
        sentiment: article.sentiment,
        description: article.description
    }));
}
// Save Monad ecosystem snapshot
async function saveMonadSnapshot(snapshot) {
    const db = await (0, db_1.getDb)();
    const fullSnapshot = Object.assign(Object.assign({}, snapshot), { timestamp: new Date() });
    await db.collection('monad_snapshots').insertOne(fullSnapshot);
}
// Get latest Monad snapshot
async function getLatestMonadSnapshot() {
    const db = await (0, db_1.getDb)();
    const snapshot = await db.collection('monad_snapshots')
        .findOne({}, { sort: { timestamp: -1 } });
    if (!snapshot)
        return null;
    return {
        week: snapshot.week,
        subsCount: snapshot.subsCount,
        txCount: snapshot.txCount,
        topContracts: snapshot.topContracts,
        timestamp: snapshot.timestamp
    };
}
// Get all basic tier data
async function getBasicTierData() {
    const [tip, events, news, monadSnapshot] = await Promise.all([
        getTipOfTheWeek(),
        getUpcomingEvents(),
        getNewsDigest(),
        getLatestMonadSnapshot()
    ]);
    return {
        tip,
        events,
        news,
        monadSnapshot
    };
}
