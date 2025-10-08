const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI;
const DBNAME = process.env.MONGODB_DB || 'monascribe';

let client = null;
let db = null;

async function connectDB() {
  if (db) {
    return db;
  }

  try {
    client = new MongoClient(MONGO_URI, {
      // Disable client-side encryption to avoid Node.js module issues
      autoEncryption: undefined,
      monitorCommands: false,
    });

    await client.connect();
    db = client.db(DBNAME);

    console.log(`✅ MongoDB connected to database: ${DBNAME}`);
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

module.exports = connectDB;
module.exports.closeDB = closeDB;
