"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.closeDb = closeDb;
// Server-side only MongoDB client
let client = null;
let db = null;
async function getDb() {
    // Ensure this only runs on server side
    if (typeof window !== 'undefined') {
        throw new Error('getDb() should only be called on the server side');
    }
    if (db)
        return db;
    // Dynamic import to prevent client-side bundling
    const { MongoClient } = await Promise.resolve().then(() => __importStar(require('mongodb')));
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGODB_DB || 'monascribe_analytics';
    try {
        client = new MongoClient(uri, {
            // Disable client-side encryption to avoid Node.js module issues
            autoEncryption: undefined,
            monitorCommands: false,
        });
        await client.connect();
        db = client.db(dbName);
        console.log(`✅ MongoDB connected to database: ${dbName}`);
        return db;
    }
    catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        throw error;
    }
}
async function closeDb() {
    if (client) {
        await client.close();
        client = null;
        db = null;
    }
}
