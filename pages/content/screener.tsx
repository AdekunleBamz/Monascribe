import { useEffect, useState } from 'react'

export default function OnchainScreener() {
  const [status, setStatus] = useState<string>('Checking access...')
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)

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
        const res = await fetch(`/api/screener?address=${user}`)
        if (!res.ok) {
          const t = await res.text()
          setStatus(t || 'Access denied.')
          setAllowed(false)
        } else {
          const data = await res.json()
          setAllowed(true)
          setStatus('')
          setRows(data)
          setSummary(data.summary)
        }
      } catch (e) {
        setStatus('Failed to verify access')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const [rows, setRows] = useState<any>(null)
  const [summary, setSummary] = useState<any>(null)

  return (
    <div style={{ maxWidth: 960, margin: '40px auto', padding: 16 }}>
      <h1>On-chain Screener</h1>
      {loading && <p>Loading...</p>}
      {!loading && !allowed && <p style={{ color: '#b91c1c' }}>{status}</p>}
      {!loading && allowed && (
        <>
          <p style={{ color: '#374151' }}>Live signals from Monad testnet: top flows, contracts, and momentum.</p>
          
          {/* Enhanced Summary */}
          {summary && (
            <div style={{ 
              margin: '16px 0', 
              padding: '16px', 
              background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
              borderRadius: '12px',
              border: '1px solid #d1d5db'
            }}>
              <div style={{ color: '#111827', marginBottom: '8px' }}>
                <strong>This week:</strong> {summary.txChangePct}% activity change • Top token: {summary.topToken} • {summary.note}
              </div>
              {summary.marketSentiment && (
                <div style={{ fontSize: '14px', color: '#4b5563' }}>
                  Market Sentiment: <strong style={{ color: summary.marketSentiment === 'Bullish' ? '#059669' : summary.marketSentiment === 'Bearish' ? '#dc2626' : '#d97706' }}>
                    {summary.marketSentiment}
                  </strong>
                  {summary.fearGreedIndex && ` • Fear/Greed: ${summary.fearGreedIndex}`}
                  {summary.whaleAlertLevel && ` • Whale Alert: ${summary.whaleAlertLevel}`}
                </div>
              )}
            </div>
          )}

          {/* Enhanced Grid Layout */}
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            
            {/* Smart Money Tracking */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#fefce8' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#111827', display: 'flex', alignItems: 'center' }}>
                🐋 Smart Money Tracking
              </h3>
              <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '12px' }}>
                <div>— {rows?.insights?.smartMoneyCount || 0} whale wallets active this week</div>
                <div>— ${(rows?.insights?.totalSmartVolume || 0).toLocaleString()} in smart money flow</div>
                <div>— {rows?.insights?.avgSmartScore || 0} average smart money score</div>
              </div>
              {rows?.tokenFlows?.topSmartMoney?.length > 0 && (
                <div>
                  <strong style={{ fontSize: '13px' }}>Top Smart Money:</strong>
                  <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', fontSize: '12px' }}>
                    {rows.tokenFlows.topSmartMoney.map((wallet: any, i: number) => (
                      <li key={i}>{wallet.wallet.slice(0,8)}... — Score: {wallet.score}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Token Flows (Enhanced) */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#f0f9ff' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#111827', display: 'flex', alignItems: 'center' }}>
                💰 Token Flows
              </h3>
              {rows?.tokenFlows?.largeTransfers?.length > 0 ? (
                <div>
                  <strong style={{ fontSize: '13px' }}>Large Transfers:</strong>
                  <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', fontSize: '12px' }}>
                    {rows.tokenFlows.largeTransfers.slice(0, 5).map((transfer: any, i: number) => (
                      <li key={i}>
                        {transfer.token} — ${transfer.valueUSD?.toLocaleString() || 'N/A'}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  — 0 high-value token movements detected
                </div>
              )}
            </div>

            {/* DEX Activity */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#f8fafc' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#111827', display: 'flex', alignItems: 'center' }}>
                🔄 DEX Activity
              </h3>
              <div style={{ fontSize: '14px', color: '#4b5563' }}>
                <div>— {rows?.insights?.dexProtocolCount || 0} protocols with {rows?.insights?.totalDexTrades || 0} total trades</div>
                <div>— ${(rows?.insights?.totalDexVolume || 0).toLocaleString()} 24h volume</div>
                <div>— {rows?.insights?.uniqueTraders || 0} unique traders</div>
              </div>
            </div>

            {/* Hot Contracts (Enhanced) */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#fdf2f8' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#111827', display: 'flex', alignItems: 'center' }}>
                🔥 Hot Contracts
              </h3>
              {rows?.hotContracts?.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px' }}>
                  {rows.hotContracts.map((c: any, i: number) => (
                    <li key={i} style={{ marginBottom: '6px' }}>
                      <strong>{c.title}</strong> — {c.insight}
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  — Monitoring for emerging contract activity
                </div>
              )}
            </div>

            {/* MonaScribe Subscriptions */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#f0fdf4' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#111827', display: 'flex', alignItems: 'center' }}>
                📝 MonaScribe Activity
              </h3>
              <div style={{ fontSize: '14px', color: '#4b5563' }}>
                <div>— {rows?.insights?.activeSubscribers || 0} active subscribers tracked</div>
                <div>— {rows?.insights?.newSubscriptions || 0} new subscriptions this week</div>
                <div>— {rows?.insights?.totalRevenue ? `$${rows.insights.totalRevenue.toLocaleString()}` : '$0'} total revenue</div>
              </div>
            </div>

            {/* Network Statistics */}
            {rows?.networkInfo && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ marginBottom: 16, color: '#111827' }}>🌐 Monad Network Status</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#ffffff' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#1f2937' }}>Latest Block</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>{rows.networkInfo.latestBlock}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: 4 }}>Block Time: {rows.networkInfo.blockTime}</div>
                  </div>
                  
                  <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#ffffff' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#1f2937' }}>Network Performance</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626' }}>{rows.networkInfo.tps}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: 4 }}>Gas: {rows.networkInfo.gasPrice}</div>
                  </div>
                  
                  <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#ffffff' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#1f2937' }}>Active Users</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#7c3aed' }}>{rows.networkInfo.activeAddresses}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: 4 }}>Growth: {rows.networkInfo.weeklyGrowth}</div>
                  </div>
                  
                  <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#ffffff' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#1f2937' }}>Smart Accounts</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>{rows.networkInfo.smartAccounts}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: 4 }}>Subscriptions: {rows.networkInfo.subscriptions}</div>
                  </div>
                </div>
                
                {/* Recent Transactions */}
                {rows.networkInfo.recentTransactions?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <h4 style={{ marginBottom: 12, color: '#111827' }}>Latest Transactions</h4>
                    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
                      {rows.networkInfo.recentTransactions.slice(0, 3).map((tx: any, i: number) => (
                        <div key={i} style={{ 
                          padding: '8px 0',
                          borderBottom: i < 2 ? '1px solid #e5e7eb' : 'none',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '13px'
                        }}>
                          <span style={{ fontFamily: 'monospace' }}>{tx.hash}</span>
                          <span style={{ 
                            background: tx.type === 'swap' ? '#fef3c7' : tx.type === 'contract' ? '#ddd6fe' : '#dcfce7',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: '11px',
                            textTransform: 'uppercase'
                          }}>{tx.type}</span>
                          <span style={{ color: '#6b7280' }}>{tx.age}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Market Intelligence Summary */}
            {rows?.marketIntelligence && (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#fffbeb' }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#111827', display: 'flex', alignItems: 'center' }}>
                  📊 Market Context
                </h3>
                <div style={{ fontSize: '14px', color: '#4b5563' }}>
                  <div>DeFi TVL: <strong>${rows.marketIntelligence.defiMetrics?.totalValueLocked?.toLocaleString() || 'N/A'}</strong></div>
                  <div>Market Sentiment: <strong>{rows.marketIntelligence.marketSentiment?.overall || 'N/A'}</strong></div>
                  <div>Active Whales: <strong>{rows.marketIntelligence.whaleIntelligence?.activeWhales || 0}</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* Insights Section */}
          {rows?.insights?.topInsights?.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ marginBottom: 16, color: '#111827' }}>💡 Key Market Insights</h3>
              <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#ffffff' }}>
                {rows.insights.topInsights.map((insight: string, index: number) => (
                  <div key={index} style={{ 
                    padding: '8px 0', 
                    borderBottom: index < rows.insights.topInsights.length - 1 ? '1px solid #f3f4f6' : 'none',
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
    </div>
  )
}


