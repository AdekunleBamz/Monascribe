import type { NextApiRequest, NextApiResponse } from 'next'
import { getDb } from '../../lib/db'
import { syncSubscriptionEvents, generateSmartMoneyAnalytics } from '../../lib/envioSync'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔍 Testing data flow in production')
    
    // Test MongoDB connection
    const db = await getDb()
    console.log('✅ MongoDB connected')
    
    // Test sync events
    const syncResult = await syncSubscriptionEvents()
    console.log(`📊 Synced ${syncResult.synced} events from Envio`)
    console.log('Sync errors:', syncResult.errors)
    
    // Test analytics generation
    const analytics = await generateSmartMoneyAnalytics()
    console.log('Analytics generated, summary:', {
      whaleCount: analytics.summary?.whaleCount || 0,
      smartMoneyFlow: analytics.summary?.smartMoneyFlow || '$0',
      insightsCount: analytics.insights?.length || 0
    })
    
    return res.status(200).json({
      status: 'success',
      mongodb: 'connected',
      syncResult,
      analytics: {
        whaleCount: analytics.summary?.whaleCount || 0,
        smartMoneyFlow: analytics.summary?.smartMoneyFlow || '$0',
        insightsCount: analytics.insights?.length || 0,
        hasData: (analytics.tokenFlows?.length || 0) > 0
      }
    })
  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
    return res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack
    })
  }
}
