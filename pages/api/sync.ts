/**
 * Background Sync API - Triggers Envio → MongoDB synchronization
 * 
 * This can be called:
 * 1. Manually for testing: GET /api/sync
 * 2. Via cron job for regular updates: POST /api/sync
 * 3. From frontend for real-time updates
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { syncSubscriptionEvents, generateSmartMoneyAnalytics } from '../../lib/envioSync'
import { getDb } from '../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { force, analytics } = req.query
    const startTime = Date.now()

    // Sync subscription events from Envio
    const syncResult = await syncSubscriptionEvents()
    
    let analyticsResult = null
    if (analytics === 'true' || force === 'true') {
      // Regenerate analytics cache
      analyticsResult = await generateSmartMoneyAnalytics()
      
      // Update cache
      const db = await getDb()
      await db.collection('screener_cache').updateOne(
        { key: 'weekly' } as any,
        { 
          $set: { 
            key: 'weekly', 
            ts: Date.now(), 
            data: analyticsResult 
          }
        },
        { upsert: true }
      )
    }

    const response = {
      success: true,
      duration: Date.now() - startTime,
      sync: {
        eventsProcessed: syncResult.synced,
        errors: syncResult.errors,
        envioConnected: process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL ? true : false
      },
      analytics: analyticsResult ? {
        activeUsers: analyticsResult.totalActiveUsers,
        whaleCount: analyticsResult.whaleCount,
        topPlan: analyticsResult.planPopularity[0]?.planName,
        cacheUpdated: true
      } : null,
      timestamp: new Date().toISOString(),
      dataFlow: process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL 
        ? 'Monad Testnet → Envio GraphQL → MongoDB → VIP Portal'
        : 'Monad Testnet → Direct RPC → MongoDB → VIP Portal'
    }

    return res.status(200).json(response)
  } catch (error: any) {
    console.error('Sync API error:', error)
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}
