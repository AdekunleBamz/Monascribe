// scripts/test-db.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db(process.env.MONGODB_DB || 'monascribe');
    const collection = db.collection('test_collection');
    const doc = { name: 'test', value: 1 };
    const insertResult = await collection.insertOne(doc);
    console.log('Insert result:', insertResult);
    const findResult = await collection.findOne({ name: 'test' });
    console.log('Find result:', findResult);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

run();
