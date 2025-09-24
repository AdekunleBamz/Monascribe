import type { NextApiRequest, NextApiResponse } from 'next'
import { publicClient } from '../../lib/config'
import { SUBSCRIPTION_CONTRACT_ABI, SUBSCRIPTION_CONTRACT_ADDRESS, SUBSCRIPTION_PLANS } from '../../lib/subscriptionContract'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { planId, address } = req.query
    const parsedPlanId = Number(planId)
    const userAddress = String(address) as `0x${string}`

    if (!parsedPlanId || !userAddress) {
      return res.status(400).send('Missing planId or address')
    }

    const [isActive, , onChainPlanId] = await publicClient.readContract({
      address: SUBSCRIPTION_CONTRACT_ADDRESS as `0x${string}`,
      abi: SUBSCRIPTION_CONTRACT_ABI as any,
      functionName: 'getSubscriptionStatus',
      args: [userAddress]
    }) as unknown as [boolean, bigint, bigint]

    if (!isActive || Number(onChainPlanId) !== parsedPlanId) {
      return res.status(403).send('Access denied: no active subscription for this plan')
    }

    // Example rich content per plan (can be fetched from CMS in future)
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === parsedPlanId)
    const base = plan?.title || 'Subscriber Content'

    const payload = {
      title: base,
      subtitle: 'Thanks for subscribing! Enjoy your exclusive drops for this cycle.',
      content: `<p>Welcome to <strong>${base}</strong>. Below are your curated items for this month. Save this link for quick access — we’ll refresh content every cycle.</p>`,
      items: [
        { title: 'Weekly Alpha #1', description: 'Market structure overview and catalysts for the week', link: 'https://example.com/reports/alpha-1' },
        { title: 'On-chain Screener', description: 'Top 10 smart money flows on Monad testnet', link: 'https://example.com/tools/screener' },
        { title: 'Bonus: Webinar Invite', description: 'Live session with the research team', link: 'https://example.com/events/webinar' }
      ],
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


