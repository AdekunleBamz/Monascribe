import { MongoClient } from 'mongodb';

// MongoDB sync service for Envio indexer
export class MongoSyncService {
  private client: MongoClient | null = null;
  private isConnected = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(private mongoUri: string, private dbName: string) {}

  async connect(): Promise<void> {
    try {
      this.client = new MongoClient(this.mongoUri);
      await this.client.connect();
      this.isConnected = true;
      console.log('✅ MongoDB connected for sync service');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      this.isConnected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.isConnected = false;
    }
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncSubscriptionEvents(context: any): Promise<number> {
    if (!this.isConnected || !this.client) {
      console.log('⚠️ MongoDB not connected, skipping sync');
      return 0;
    }

    try {
      const db = this.client.db(this.dbName);
      const collection = db.collection('subscription_events');

      // Get all subscription events from Envio
      const subscribedEvents = await context.SubscriptionService_Subscribed.getAll();
      const cancelledEvents = await context.SubscriptionService_SubscriptionCancelled.getAll();

      let synced = 0;

      // Sync subscribed events
      for (const event of subscribedEvents) {
        const doc = {
          _id: event.id,
          type: 'Subscribed',
          subscriber: event.subscriber,
          planId: Number(event.planId),
          expiresAt: Number(event.expiresAt),
          blockNumber: Number(event.blockNumber),
          transactionHash: event.transactionHash,
          timestamp: Number(event.timestamp),
          syncedAt: Date.now()
        };

        await collection.replaceOne({ _id: event.id }, doc, { upsert: true });
        synced++;
      }

      // Sync cancelled events
      for (const event of cancelledEvents) {
        const doc = {
          _id: event.id,
          type: 'SubscriptionCancelled',
          subscriber: event.subscriber,
          planId: Number(event.planId),
          cancelledAt: Number(event.cancelledAt),
          blockNumber: Number(event.blockNumber),
          transactionHash: event.transactionHash,
          timestamp: Number(event.timestamp),
          syncedAt: Date.now()
        };

        await collection.replaceOne({ _id: event.id }, doc, { upsert: true });
        synced++;
      }

      console.log(`📊 Synced ${synced} subscription events to MongoDB`);
      return synced;
    } catch (error) {
      console.error('❌ MongoDB sync failed:', error);
      return 0;
    }
  }

  async syncSmartMoneyData(context: any): Promise<number> {
    if (!this.isConnected || !this.client) {
      return 0;
    }

    try {
      const db = this.client.db(this.dbName);
      const walletsCollection = db.collection('smart_money_wallets');
      const scoresCollection = db.collection('smart_money_scores');

      // Get all smart money wallets and scores
      const wallets = await context.SmartMoneyWallet.getAll();
      const scores = await context.SmartMoneyScore.getAll();

      let synced = 0;

      // Sync wallets
      for (const wallet of wallets) {
        const doc = {
          _id: wallet.id,
          address: wallet.address,
          totalVolume: wallet.totalVolume.toString(),
          transactionCount: wallet.transactionCount.toString(),
          firstSeen: Number(wallet.firstSeen),
          lastActive: Number(wallet.lastActive),
          isWhale: wallet.isWhale,
          tags: wallet.tags,
          syncedAt: Date.now()
        };

        await walletsCollection.replaceOne({ _id: wallet.id }, doc, { upsert: true });
        synced++;
      }

      // Sync scores
      for (const score of scores) {
        const doc = {
          _id: score.id,
          wallet_id: score.wallet_id,
          totalScore: Number(score.totalScore),
          volumeScore: Number(score.volumeScore),
          frequencyScore: Number(score.frequencyScore),
          diversityScore: Number(score.diversityScore),
          timingScore: Number(score.timingScore),
          lastUpdated: Number(score.lastUpdated),
          syncedAt: Date.now()
        };

        await scoresCollection.replaceOne({ _id: score.id }, doc, { upsert: true });
        synced++;
      }

      console.log(`📊 Synced ${synced} smart money records to MongoDB`);
      return synced;
    } catch (error) {
      console.error('❌ Smart money sync failed:', error);
      return 0;
    }
  }

  startPeriodicSync(context: any, intervalMs: number = 30000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      try {
        const eventsSynced = await this.syncSubscriptionEvents(context);
        const smartMoneySynced = await this.syncSmartMoneyData(context);
        console.log(`🔄 Periodic sync completed: ${eventsSynced + smartMoneySynced} records`);
      } catch (error) {
        console.error('❌ Periodic sync failed:', error);
      }
    }, intervalMs);

    console.log(`🔄 Started periodic MongoDB sync every ${intervalMs}ms`);
  }

  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('🔄 Stopped periodic MongoDB sync');
    }
  }
}

// Global sync service instance
let mongoSyncService: MongoSyncService | null = null;

export function getMongoSyncService(): MongoSyncService | null {
  return mongoSyncService;
}

export function initializeMongoSync(mongoUri: string, dbName: string): MongoSyncService {
  if (!mongoSyncService) {
    mongoSyncService = new MongoSyncService(mongoUri, dbName);
  }
  return mongoSyncService;
}
