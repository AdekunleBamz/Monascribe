import type { NextApiRequest, NextApiResponse } from 'next'
import { getSubscriptionStatusIndexed } from '../../lib/indexer'
import { publicClient } from '../../lib/config'
import { SUBSCRIPTION_CONTRACT_ABI, SUBSCRIPTION_CONTRACT_ADDRESS } from '../../lib/subscriptionContract'
import { getDb } from '../../lib/db'
import { generateWeeklyAlpha, syncSubscriptionEvents } from '../../lib/envioSync'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const db = await getDb()
    const { address, action, issueId } = req.query
    const user = String(address || '') as `0x${string}`
    if (!user) return res.status(400).send('Missing address')

    // Access: any active plan (>=1) for Weekly Alpha
    let isActive = false
    let planId = 0
    const indexed = await getSubscriptionStatusIndexed(user)
    if (indexed) {
      isActive = indexed.isActive
      planId = indexed.planId
    } else {
      const result = await publicClient.readContract({
        address: SUBSCRIPTION_CONTRACT_ADDRESS as `0x${string}`,
        abi: SUBSCRIPTION_CONTRACT_ABI as any,
        functionName: 'getSubscriptionStatus',
        args: [user]
      }) as unknown as [boolean, bigint, bigint]
      isActive = result[0]
      planId = Number(result[2])
    }
    if (!isActive) return res.status(403).send('Access denied: Weekly Alpha requires an active subscription')

    if (action === 'generate') {
      // Sync latest blockchain data first
      try {
        const syncResult = await syncSubscriptionEvents()
        console.log(`📈 Alpha generation: synced ${syncResult.synced} events`)
      } catch (syncError) {
        console.warn('Sync warning during alpha generation:', syncError)
      }

      // Generate new issue
      const nextIssueNumber = issueId ? Number(issueId) : await getNextIssueNumber(db)
      const alphaReport = await generateWeeklyAlpha(nextIssueNumber)
      
      return res.status(200).json({
        message: `Weekly Alpha #${nextIssueNumber} generated successfully`,
        issueNumber: nextIssueNumber,
        preview: alphaReport.content.substring(0, 200) + '...',
        metrics: alphaReport.metrics
      })
    }

    // Fetch specific issue or latest
    const targetIssue = issueId ? Number(issueId) : null
    let alpha
    
    if (targetIssue) {
      alpha = await db.collection('weekly_alpha').findOne({ _id: targetIssue } as any)
      if (!alpha) {
        return res.status(404).send(`Weekly Alpha #${targetIssue} not found`)
      }
    } else {
      // Get latest issue
      const latest = await db.collection('weekly_alpha').find().sort({ _id: -1 }).limit(1).toArray()
      if (!latest.length) {
        // Generate first issue automatically
        const firstIssue = await generateWeeklyAlpha(1)
        return res.status(200).json({
          issueNumber: 1,
          content: firstIssue.content,
          metrics: firstIssue.metrics,
          generatedAt: new Date().toISOString(),
          isNew: true
        })
      }
      alpha = latest[0]
    }

    return res.status(200).json({
      issueNumber: alpha._id,
      content: alpha.content,
      metrics: alpha.metrics,
      generatedAt: alpha.generatedAt,
      dataSource: process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL ? 'Envio + MongoDB' : 'MongoDB + RPC'
    })
  } catch (e: any) {
    console.error('Alpha API error:', e)
    return res.status(500).send(e?.message || 'Internal error')
  }
}

async function getNextIssueNumber(db: any): Promise<number> {
  const latest = await db.collection('weekly_alpha').find().sort({ _id: -1 }).limit(1).toArray()
  return latest.length > 0 ? latest[0]._id + 1 : 1
}


