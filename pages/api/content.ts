import type { NextApiRequest, NextApiResponse } from 'next'
import { publicClient } from '../../lib/config'
import { getSubscriptionStatusIndexed } from '../../lib/indexer'
import { SUBSCRIPTION_CONTRACT_ABI, SUBSCRIPTION_CONTRACT_ADDRESS, SUBSCRIPTION_PLANS } from '../../lib/subscriptionContract'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { planId, address } = req.query
    const parsedPlanId = Number(planId)
    const userAddress = String(address) as `0x${string}`

    if (!parsedPlanId || !userAddress) {
      return res.status(400).send('Missing planId or address')
    }

    // Prefer Envio indexer if configured, else fall back to direct RPC
    const indexed = await getSubscriptionStatusIndexed(userAddress)
    let isActive = false
    let onChainPlanId: number | bigint = 0n
    if (indexed) {
      isActive = indexed.isActive
      onChainPlanId = indexed.planId
    } else {
      const result = await publicClient.readContract({
        address: SUBSCRIPTION_CONTRACT_ADDRESS as `0x${string}`,
        abi: SUBSCRIPTION_CONTRACT_ABI as any,
        functionName: 'getSubscriptionStatus',
        args: [userAddress]
      }) as unknown as [boolean, bigint, bigint]
      isActive = result[0]
      onChainPlanId = result[2]
    }

    if (!isActive || Number(onChainPlanId) !== parsedPlanId) {
      return res.status(403).send('Access denied: no active subscription for this plan')
    }

    // Example rich content per plan (can be fetched from CMS in future)
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === parsedPlanId)
    const base = plan?.title || 'Subscriber Content'

    // Build items per plan
    // Basic (1): Weekly Alpha only
    // Premium (2): Weekly Alpha + Screener
    // VIP (3): Weekly Alpha + Screener + Webinar (TBA)
    const items: { title: string, description: string, link?: string }[] = []
    items.push({ title: 'Weekly Alpha #1', description: 'Market structure overview and catalysts for the week', link: '/content/alpha/1' })
    if (parsedPlanId >= 2) {
      items.push({ title: 'On-chain Screener', description: 'Top 10 smart money flows on Monad testnet', link: '/content/screener' })
    }
    if (parsedPlanId >= 3) {
      items.push({ title: 'Bonus: Webinar Invite', description: 'Invite will be announced here. Get notified.', link: '/content/webinar' })
    }

    const payload = {
      title: base,
      subtitle: 'Thanks for subscribing! Enjoy your exclusive drops for this cycle.',
      content: `<p>Welcome to <strong>${base}</strong>. Below are your curated items for this month. Save this link for quick access — we’ll refresh content every cycle.</p>`,
      items,
      resources: [
        { label: 'Telegram', url: 'https://t.me/example' },
        { label: 'Discord', url: 'https://discord.gg/example' }
      ]
    }

    return res.status(200).json(payload)
  } catch (e: any) {
    return res.status(500).send(e?.message || 'Internal error')
  }
}


