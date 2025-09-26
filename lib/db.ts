// Server-side only MongoDB client
let client: any = null
let db: any = null

export async function getDb(): Promise<any> {
  // Ensure this only runs on server side
  if (typeof window !== 'undefined') {
    throw new Error('getDb() should only be called on the server side')
  }

  if (db) return db

  // Dynamic import to prevent client-side bundling
  const { MongoClient } = await import('mongodb')
  
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'
  const dbName = process.env.MONGODB_DB || 'monascribe_analytics'
  
  try {
    client = new MongoClient(uri, {
      // Disable client-side encryption to avoid Node.js module issues
      autoEncryption: undefined,
      monitorCommands: false,
    })
    
    await client.connect()
    db = client.db(dbName)
    
    console.log(`✅ MongoDB connected to database: ${dbName}`)
    return db
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error)
    throw error
  }
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.close()
    client = null
    db = null
  }
}


