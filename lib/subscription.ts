import { getDb } from './db'

export async function getUserTierFromMongo(address?: string): Promise<number> {
  if (!address) return 0

  try {
    const db = await getDb()

    // Normalize address to lowercase for comparison
    const normalizedAddress = address.toLowerCase().trim()

    console.log('Checking subscription for address:', normalizedAddress)

    // Get the latest subscription event for this user
    const latestEvent = await db.collection('subscription_events').findOne(
      { subscriber: normalizedAddress },
      { sort: { timestamp: -1 } }
    )

    console.log('Latest subscription event found:', latestEvent)

    if (!latestEvent) {
      console.log('No subscription event found for address:', normalizedAddress)
      return 0
    }

    // If the latest event is a cancellation, user has no active subscription
    if (latestEvent.type === 'cancelled' || latestEvent.type === 'SubscriptionCancelled') {
      console.log('Latest event is cancellation for address:', normalizedAddress)
      return 0
    }

    // Check if subscription is still active (not expired)
    if (latestEvent.expiresAt) {
      const expiryDate = new Date(latestEvent.expiresAt)
      const now = new Date()

      console.log('Subscription expires:', expiryDate.toISOString())
      console.log('Current time:', now.toISOString())
      console.log('Is expired:', expiryDate <= now)

      if (expiryDate <= now) {
        // Subscription has expired
        console.log('Subscription expired for address:', normalizedAddress)
        return 0
      }
    }

    const planId = Number(latestEvent.planId) || 0
    console.log('Active subscription found - Plan ID:', planId, 'for address:', normalizedAddress)

    // Return the plan ID for active subscription
    return planId

  } catch (error) {
    console.error('Error checking subscription tier:', error)
    return 0
  }
}
