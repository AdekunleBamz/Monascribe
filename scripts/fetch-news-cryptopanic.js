// scripts/fetch-news-cryptopanic.js
require('dotenv').config({ path: ['.env.local', '.env'], override: true });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const CP_KEY = process.env.CRYPTOPANIC_API_KEY;

async function run(){
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB);

  // CryptoPanic v1 example (auth token param)
  const url = `https://cryptopanic.com/api/v1/posts/?auth_token=${CP_KEY}&filter=hot&public=true&kind=news`;
  const res = await fetch(url);
  if(!res.ok) throw new Error(`CryptoPanic ${res.status}`);
  const json = await res.json();

  const news = json.results.map((post) => ({
    id: `cp-${post.id}`,
    source: 'CryptoPanic',
    title: post.title,
    description: post.url,
    date_event: post.created_at,
    coins: post.currencies?.map(c => c.code).join(', ') || 'N/A'
  }));

  if (news.length > 0) {
    const bulkOps = news.map(item => ({
      updateOne: {
        filter: { id: item.id },
        update: { $set: item },
        upsert: true
      }
    }));
    await db.collection('alpha_events').bulkWrite(bulkOps);
  }

  await client.close();
  console.log(`✅ CryptoPanic saved: ${news.length} items.`);
}

run().catch(err=>{ console.error(err); process.exit(1); });
