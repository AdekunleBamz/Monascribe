require('dotenv').config({ path: ['.env.local', '.env'], override: true });
const { MongoClient } = require('mongodb');

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/monascribe';
  const dbName = process.env.MONGODB_DB || 'monascribe';
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const res1 = await db.collection('screener_cache').deleteMany({ key: { $ne: 'market_latest' } });
  const res2 = await db.collection('weekly_alpha').deleteMany({ key: { $ne: 'latest' } });
  console.log(`Deleted from screener_cache: ${res1.deletedCount}, weekly_alpha: ${res2.deletedCount}`);
  await client.close();
}

run().catch(e => { console.error(e); process.exit(1); });


