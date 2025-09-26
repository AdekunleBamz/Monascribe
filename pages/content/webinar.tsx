import { useEffect, useState } from 'react'
import { publicClient } from '../../lib/config'
import { SUBSCRIPTION_CONTRACT_ABI, SUBSCRIPTION_CONTRACT_ADDRESS } from '../../lib/subscriptionContract'

export default function WebinarInvite() {
  const [allowed, setAllowed] = useState(false)
  const [status, setStatus] = useState<string>('Checking access...')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const run = async () => {
      try {
        if (typeof window === 'undefined' || !(window as any).ethereum) {
          setStatus('Please open with MetaMask available')
          return
        }
        const ethereum = (window as any).ethereum
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
        const user = accounts?.[0]
        if (!user) {
          setStatus('Please connect your wallet')
          return
        }
        const [isActive, , planId] = await publicClient.readContract({
          address: SUBSCRIPTION_CONTRACT_ADDRESS as `0x${string}`,
          abi: SUBSCRIPTION_CONTRACT_ABI as any,
          functionName: 'getSubscriptionStatus',
          args: [user as `0x${string}`]
        }) as unknown as [boolean, bigint, bigint]
        if (!isActive || Number(planId) < 3) {
          setStatus('Webinar access is for VIP subscribers. Upgrade to receive invites.')
          setAllowed(false)
        } else {
          setAllowed(true)
          setStatus('')
        }
      } catch (e) {
        setStatus('Failed to verify access')
      }
    }
    run()
  }, [])

  const submit = async () => {
    try {
      const res = await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      if (res.ok) setSubmitted(true)
    } catch {}
  }

  return (
    <div style={{ maxWidth: 640, margin: '40px auto', padding: 16 }}>
      <h1>Webinar Invite</h1>
      {!allowed && <p style={{ color: '#b91c1c' }}>{status}</p>}
      {allowed && (
        <>
          <p style={{ color: '#374151' }}>Invite will be announced here. Leave your email to get notified the moment it goes live.</p>
          {!submitted ? (
            <div style={{ marginTop: 12 }}>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email" style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', width: '100%' }} />
              <button onClick={submit} style={{ marginTop: 8, padding: '10px 16px', background: '#111827', color: 'white', borderRadius: 8, border: 'none', fontWeight: 600 }}>Notify me</button>
            </div>
          ) : (
            <p>Thanks! We’ll notify you ahead of time.</p>
          )}
        </>
      )}
    </div>
  )
}


