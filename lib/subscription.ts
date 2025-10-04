import { getDb } from './db'

export async function getUserTierFromMongo(address?: string): Promise<number> {
  if (!address) return 0
  const db = await getDb()
  const arr = await db.collection('subscription_events').aggregate([
    { $match: { subscriber: address.toLowerCase() } },
    { $sort: { timestamp: 1 } },
    { $group: { _id: '$subscriber', lastEvent: { $last: '$type' }, lastPlan: { $last: '$planId' } } }
  ]).toArray()
  if (!arr.length) return 0
  const lastEvent = String(arr[0].lastEvent || '').toLowerCase()
  if (lastEvent !== 'subscribed') return 0
  const planId = Number(arr[0].lastPlan || 0)
  return Number.isFinite(planId) ? planId : 0
}


