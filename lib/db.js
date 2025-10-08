const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI;

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    return mongoose.connection;
  }

  try {
    const connection = await mongoose.connect(MONGO_URI, {
      dbName: "monascribe",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = true;
    console.log('✅ MongoDB connected');
    return connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

module.exports = connectDB;
