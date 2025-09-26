import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { publicClient } from '../../../lib/config'
import { SUBSCRIPTION_CONTRACT_ABI, SUBSCRIPTION_CONTRACT_ADDRESS } from '../../../lib/subscriptionContract'

export default function WeeklyAlphaIssue() {
  const router = useRouter()
  const { issue } = router.query
  const [status, setStatus] = useState<string>('Checking access...')
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [address, setAddress] = useState<string>('')
  const [alpha, setAlpha] = useState<any>(null)

  useEffect(() => {
    const run = async () => {
      try {
        if (typeof window === 'undefined' || !(window as any).ethereum) {
          setStatus('Please open with MetaMask available')
          setLoading(false)
          return
        }
        const ethereum = (window as any).ethereum
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
        const user = accounts?.[0]
        if (!user) {
          setStatus('Please connect your wallet')
          setLoading(false)
          return
        }
        setAddress(user)
        const [isActive] = await publicClient.readContract({
          address: SUBSCRIPTION_CONTRACT_ADDRESS as `0x${string}`,
          abi: SUBSCRIPTION_CONTRACT_ABI as any,
          functionName: 'getSubscriptionStatus',
          args: [user as `0x${string}`]
        }) as unknown as [boolean, bigint, bigint]
        if (!isActive) {
          setStatus('Access denied. You need an active subscription.')
          setAllowed(false)
        } else {
          setAllowed(true)
          setStatus('')
          // Fetch latest alpha (or per-issue in future).
          try {
            const res = await fetch(`/api/alpha?address=${user}`)
            if (res.ok) {
              const data = await res.json()
              setAlpha(data)
            }
          } catch {}
        }
      } catch (e) {
        setStatus('Failed to verify access')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return (
    <div style={{ maxWidth: 820, margin: '40px auto', padding: 16 }}>
      <h1>Weekly Alpha #{issue}</h1>
      {loading && <p>Loading...</p>}
      {!loading && !allowed && <p style={{ color: '#b91c1c' }}>{status}</p>}
      {!loading && allowed && (
        <>
          <p style={{ color: '#374151' }}>Deep-dive market notes, catalysts, and actionable insights for this week on Monad.</p>
          
          {alpha && (
            <>
              {/* Main Alpha Content */}
              <div style={{ marginTop: 16, padding: 20, border: '1px solid #e5e7eb', borderRadius: 12, background: '#fafafa' }}>
                <h2 style={{ margin: '0 0 16px 0', color: '#111827' }}>{alpha.title}</h2>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#374151' }}>{alpha.body}</div>
              </div>

              {/* Market Intelligence Dashboard */}
              {alpha.marketIntelligence && (
                <div style={{ marginTop: 20 }}>
                  <h3 style={{ marginBottom: 16, color: '#111827' }}>📊 Market Intelligence</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    {/* DeFi Metrics */}
                    <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#f8fafc' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#1f2937', display: 'flex', alignItems: 'center' }}>
                        🏦 DeFi Metrics
                      </h4>
                      <div style={{ fontSize: '14px', color: '#4b5563' }}>
                        <div>TVL: <strong>${alpha.marketIntelligence.defiMetrics.totalValueLocked.toLocaleString()}</strong></div>
                        <div>Volume (24h): <strong>${alpha.marketIntelligence.defiMetrics.volume24h.toLocaleString()}</strong></div>
                        <div>Yield: <strong>{alpha.marketIntelligence.defiMetrics.averageYield}%</strong></div>
                      </div>
                    </div>

                    {/* Market Sentiment */}
                    <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#f0f9ff' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#1f2937', display: 'flex', alignItems: 'center' }}>
                        📈 Market Sentiment
                      </h4>
                      <div style={{ fontSize: '14px', color: '#4b5563' }}>
                        <div>Overall: <strong style={{ color: alpha.marketIntelligence.marketSentiment.overall === 'Bullish' ? '#059669' : alpha.marketIntelligence.marketSentiment.overall === 'Bearish' ? '#dc2626' : '#d97706' }}>
                          {alpha.marketIntelligence.marketSentiment.overall}
                        </strong></div>
                        <div>Fear/Greed: <strong>{alpha.marketIntelligence.marketSentiment.fearGreedIndex}</strong></div>
                        <div>Social: <strong>{alpha.marketIntelligence.marketSentiment.socialSentiment}</strong></div>
                      </div>
                    </div>

                    {/* Whale Intelligence */}
                    <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#fefce8' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#1f2937', display: 'flex', alignItems: 'center' }}>
                        🐋 Whale Activity
                      </h4>
                      <div style={{ fontSize: '14px', color: '#4b5563' }}>
                        <div>Large Txs: <strong>{alpha.marketIntelligence.whaleIntelligence.largeTransactions.length}</strong></div>
                        <div>Active Whales: <strong>{alpha.marketIntelligence.whaleIntelligence.activeWhales}</strong></div>
                        <div>Net Flow: <strong style={{ color: alpha.marketIntelligence.whaleIntelligence.netFlow > 0 ? '#059669' : '#dc2626' }}>
                          {alpha.marketIntelligence.whaleIntelligence.netFlow > 0 ? '+' : ''}${alpha.marketIntelligence.whaleIntelligence.netFlow.toLocaleString()}
                        </strong></div>
                      </div>
                    </div>

                    {/* Macro Indicators */}
                    <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#fdf2f8' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#1f2937', display: 'flex', alignItems: 'center' }}>
                        🌍 Macro Indicators
                      </h4>
                      <div style={{ fontSize: '14px', color: '#4b5563' }}>
                        <div>DXY: <strong>{alpha.marketIntelligence.macroIndicators.dollarIndex}</strong></div>
                        <div>VIX: <strong>{alpha.marketIntelligence.macroIndicators.volatilityIndex}</strong></div>
                        <div>Yields: <strong>{alpha.marketIntelligence.macroIndicators.treasuryYields}%</strong></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Insights Section */}
              {alpha.insights && alpha.insights.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <h3 style={{ marginBottom: 16, color: '#111827' }}>💡 Key Insights</h3>
                  <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#ffffff' }}>
                    {alpha.insights.map((insight: string, index: number) => (
                      <div key={index} style={{ 
                        padding: '8px 0', 
                        borderBottom: index < alpha.insights.length - 1 ? '1px solid #f3f4f6' : 'none',
                        fontSize: '14px',
                        color: '#374151'
                      }}>
                        • {insight}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Static Highlights if no dynamic content */}
          {!alpha && (
            <div style={{ marginTop: 16, padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <h3>Highlights</h3>
              <ul>
                <li>Macro: Liquidity and narrative rotation</li>
                <li>On-chain: Smart flows and active contracts</li>
                <li>Opportunities: Risk-managed entries and exits</li>
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}


