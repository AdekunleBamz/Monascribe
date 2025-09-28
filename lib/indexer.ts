// Optional Envio HyperIndex/HyperSync integration for subscription reads
// If GraphQL env vars are not set or a query fails, callers should gracefully fall back to viem.

export interface IndexedSubscriptionStatus {
  isActive: boolean
  expiresAt: number
  planId: number
}

function getEnv(key: string): string | undefined {
  // Next.js exposes NEXT_PUBLIC_* to client; server can also read them
  return process.env[key] as string | undefined
}

export async function getSubscriptionStatusIndexed(subscriber: `0x${string}`): Promise<IndexedSubscriptionStatus | null> {
  try {
    // Skip GraphQL request during Next.js compilation phase
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PHASE && process.env.NEXT_PUBLIC_SKIP_GRAPHQL !== 'true') {
      console.log('⏭️ Skipping GraphQL request during compilation phase in getSubscriptionStatusIndexed')
      return null
    }

    // Use Next.js API proxy instead of direct Envio connection
    const url = getEnv('NEXT_PUBLIC_ENVIO_GRAPHQL_URL')
    if (!url) return null

    const subscribedEntity = getEnv('NEXT_PUBLIC_ENVIO_SUBSCRIBED_ENTITY') || 'SubscriptionService_Subscribed'
    const cancelledEntity = getEnv('NEXT_PUBLIC_ENVIO_CANCELLED_ENTITY') || 'SubscriptionService_SubscriptionCancelled'

    // Build a flexible GraphQL query. If schema differs, this will fail and we return null.
    const query = `
      query SubscriptionStatus($subscriber: String!) {
        subscribed: ${subscribedEntity}(first: 1, orderBy: { blockNumber: desc }, where: { subscriber: $subscriber }) {
          planId
          expiresAt
          blockNumber
        }
        cancelled: ${cancelledEntity}(first: 1, orderBy: { blockNumber: desc }, where: { subscriber: $subscriber }) {
          blockNumber
        }
      }
    `

    const body = JSON.stringify({ query, variables: { subscriber: subscriber.toLowerCase() } })
    
    // For server-side requests, use the full URL
    const graphqlUrl = typeof window === 'undefined' 
      ? `http://localhost:3000${url}`
      : url;
      
    const resp = await fetch(graphqlUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body })
    if (!resp.ok) return null
    const json = await resp.json()
    if (json.errors) return null

    const subscribed = Array.isArray(json.data?.subscribed) ? json.data.subscribed[0] : undefined
    if (!subscribed) return null
    const cancelled = Array.isArray(json.data?.cancelled) ? json.data.cancelled[0] : undefined

    const subBlock = Number(subscribed?.blockNumber ?? 0)
    const cancelBlock = Number(cancelled?.blockNumber ?? 0)
    const expiresAt = Number(subscribed?.expiresAt ?? 0)
    const planId = Number(subscribed?.planId ?? 0)

    const isStillActive = subBlock > cancelBlock && expiresAt > Math.floor(Date.now() / 1000)

    return {
      isActive: !!(planId && isStillActive),
      expiresAt,
      planId: planId || 0,
    }
  } catch {
    return null
  }
}
