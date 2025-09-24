import { useState, useEffect } from 'react'
import Head from 'next/head'
import SubscriptionCard from '../components/SubscriptionCard'
import ConnectButton from '../components/ConnectButton'
import { SUBSCRIPTION_PLANS, SUBSCRIPTION_CONTRACT_ADDRESS, SUBSCRIPTION_CONTRACT_ABI } from '../lib/subscriptionContract'
import { createSmartAccount, subscribeWithSmartAccount } from '../lib/smartAccount'
import { WalletConnector } from '../lib/walletConfig'
import { publicClient } from '../lib/config'
import ContentModal from '../components/ContentModal'

interface ConnectedAccount {
  address: string
  connector: WalletConnector
  chainId?: number
  smartAccountType?: 'smart-account' | 'standard-account'
}

export default function Home() {
  const [smartAccount, setSmartAccount] = useState<any>(null)
  const [connectedAccount, setConnectedAccount] = useState<ConnectedAccount | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<string>('Connect your wallet to get started')
  const [lastTxHash, setLastTxHash] = useState<string>('')
  const [subActive, setSubActive] = useState<boolean>(false)
  const [subExpires, setSubExpires] = useState<number>(0)
  const [subPlanId, setSubPlanId] = useState<number | null>(null)
  const [contentOpen, setContentOpen] = useState(false)
  const [contentData, setContentData] = useState<any>(null)

  const handleWalletConnect = async (address: string, connector: WalletConnector) => {
    setIsLoading(true)
    setStatus('Setting up Smart Account...')
    
    try {
      const { smartAccount: sa, account: acc, type } = await createSmartAccount()
      setSmartAccount(sa)
      
      const connectedAcc: ConnectedAccount = {
        address,
        connector,
        chainId: 10143,
        smartAccountType: type as 'smart-account' | 'standard-account'
      }
      
      setConnectedAccount(connectedAcc)
      
      // Set status based on account type
      if (type === 'smart-account') {
        setStatus(`🚀 Smart Account Ready: Advanced features enabled`)
      } else {
        setStatus(`🦊 MetaMask Connected: Ready for subscriptions`)
      }
    } catch (error: any) {
      console.error('Failed to setup account:', error)
      setStatus('Failed to setup Smart Account - using standard connection')
      
      // Fallback to basic connection
      const connectedAcc: ConnectedAccount = {
        address,
        connector,
        chainId: 10143,
        smartAccountType: 'standard-account'
      }
      setConnectedAccount(connectedAcc)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWalletDisconnect = () => {
    setSmartAccount(null)
    setConnectedAccount(null)
    setStatus('Connect your wallet to get started')
    setLastTxHash('')
    setSubActive(false)
    setSubExpires(0)
    setSubPlanId(null)
  }

  const handleSubscribe = async (planId: number) => {
    if (!smartAccount || !connectedAccount) {
      setStatus('Please connect your wallet first')
      return
    }

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId)
    if (!plan) return

    setStatus(`Processing ${plan.title} subscription (${plan.price} MON)...`)
    
    try {
      const txHash = await subscribeWithSmartAccount(
        smartAccount,
        SUBSCRIPTION_CONTRACT_ADDRESS,
        planId,
        plan.price
      )
      
      setLastTxHash(txHash)
      setStatus(`✅ Subscribed to ${plan.title}! Waiting for confirmation...`)

      // Wait for confirmation then fetch on-chain status
      await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` })

      try {
        const result = await publicClient.readContract({
          address: SUBSCRIPTION_CONTRACT_ADDRESS as `0x${string}`,
          abi: SUBSCRIPTION_CONTRACT_ABI as any,
          functionName: 'getSubscriptionStatus',
          args: [connectedAccount.address as `0x${string}`]
        }) as unknown as [boolean, bigint, bigint]

        const [isActive, expiresAt, planOnChain] = result
        setSubActive(isActive)
        setSubExpires(Number(expiresAt))
        setSubPlanId(Number(planOnChain))

        const planMeta = SUBSCRIPTION_PLANS.find(p => p.id === Number(planOnChain))
        const expiresDate = expiresAt ? new Date(Number(expiresAt) * 1000) : null
        setStatus(
          `✅ Subscription active${planMeta ? `: ${planMeta.title}` : ''}${expiresDate ? ` • Expires ${expiresDate.toLocaleString()}` : ''}`
        )
      } catch (readErr) {
        setStatus('✅ Transaction confirmed. Unable to read status — please refresh or try again.')
      }
      
      // Show success for 3 seconds, then reset
      // keep status visible; user can see status card below
    } catch (error: any) {
      console.error('Subscription failed:', error)
      if (error.message?.includes('User denied')) {
        setStatus(`❌ Transaction cancelled by user`)
      } else if (error.message?.includes('insufficient funds')) {
        setStatus(`❌ Insufficient MON balance for ${plan.title}`)
      } else {
        setStatus(`❌ Subscription failed. Check your wallet and try again.`)
      }
      
      // keep error visible
    }
  }

  return (
    <div className="container">
      <Head>
        <title>MonaScribe — MetaMask Smart Accounts on Monad</title>
        <meta name="description" content="MonaScribe brings frictionless, smart‑account‑powered subscriptions and gated content to Monad with MetaMask." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <div className="header">
          <h1 className="title">
            🔐 MonaScribe
          </h1>
          <p className="subtitle">
            MonaScribe brings frictionless, smart‑account‑powered subscriptions and gated content to Monad with MetaMask.
          </p>
          
          <div className="status-card">
            <div className="status-indicator">
              <div className={`indicator ${connectedAccount ? 'connected' : 'disconnected'}`}></div>
              <span>{status}</span>
            </div>
            
            <div className="wallet-connection">
              <ConnectButton
                account={connectedAccount}
                onConnect={handleWalletConnect}
                onDisconnect={handleWalletDisconnect}
              />
            </div>
            
            {connectedAccount && (
              <div className="features">
                {connectedAccount.smartAccountType === 'standard-account' && (
                  <>
                    🦊 MetaMask Connected • 🔗 Monad Testnet • 💎 Real Transactions
                    <div className="connected-notice">
                      ✅ Ready for real subscriptions on Monad Testnet with MON tokens!
                    </div>
                  </>
                )}
                {connectedAccount.smartAccountType === 'smart-account' && (
                  <>
                    ✨ Smart Account Ready • 🔄 Advanced Features • 🛡️ Secure Transactions
                    <div className="smart-account-notice">
                      🚀 MetaMask Smart Account: Will use standard transactions if bundler unavailable
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="plans-grid">
              {SUBSCRIPTION_PLANS.map((plan) => (
            <SubscriptionCard
              key={plan.id}
              plan={plan}
              onSubscribe={handleSubscribe}
              isLoading={isLoading}
            />
          ))}
        </div>

        <div className="features-section">
          <ContentModal
            open={contentOpen}
            onClose={() => setContentOpen(false)}
            title={contentData?.title || 'Subscriber Content'}
            subtitle={contentData?.subtitle}
            content={contentData?.content}
            items={contentData?.items}
            resources={contentData?.resources}
            explorerUrl={contentData?.explorerUrl}
          />
          {connectedAccount && subActive && subPlanId && (
            <div className="gated-access">
              <h2>Your Subscription</h2>
              <p>Plan: {SUBSCRIPTION_PLANS.find(p => p.id === subPlanId)?.title || `#${subPlanId}`}</p>
              <button
                className="access-content-btn"
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/content?planId=${subPlanId}&address=${connectedAccount.address}`)
                    if (!res.ok) {
                      const t = await res.text()
                      setStatus(t || 'Access denied.')
                      return
                    }
                    const data = await res.json()
                    setContentData({ ...data, explorerUrl: lastTxHash ? `https://testnet.monadexplorer.com/tx/${lastTxHash}` : undefined })
                    setContentOpen(true)
                  } catch (e) {
                    setStatus('Failed to fetch content')
                  }
                }}
              >
                Access Content
              </button>
            </div>
          )}
          {connectedAccount && (
            <div className="onchain-status">
              <h2>Subscription Status</h2>
              <div className="status-grid">
                <div className={`status-card ${subActive ? 'active' : 'inactive'}`}>
                  <div className="status-title">State</div>
                  <div className="status-value">{subActive ? 'Active ✅' : 'Inactive ⏸️'}</div>
                </div>
                <div className="status-card">
                  <div className="status-title">Plan</div>
                  <div className="status-value">
                    {subPlanId ? (SUBSCRIPTION_PLANS.find(p => p.id === subPlanId)?.title || `#${subPlanId}`) : '—'}
                  </div>
                </div>
                <div className="status-card">
                  <div className="status-title">Expires</div>
                  <div className="status-value">
                    {subExpires ? new Date(subExpires * 1000).toLocaleString() : '—'}
                  </div>
                </div>
                <div className="status-card">
                  <div className="status-title">Explorer</div>
                  <div className="status-value">
                    {lastTxHash ? (
                      <a
                        href={`https://testnet.monadexplorer.com/tx/${lastTxHash}`}
                        target="_blank" rel="noopener noreferrer"
                      >View last tx ↗</a>
                    ) : '—'}
                  </div>
                </div>
              </div>
            </div>
          )}
          <h2>Why Choose Smart Account Subscriptions?</h2>
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">⛽</div>
              <h3>Gas Abstracted</h3>
              <p>No need to worry about gas fees - they're handled automatically</p>
            </div>
            <div className="feature">
              <div className="feature-icon">🔄</div>
              <h3>Auto-Renewal</h3>
              <p>Set it once and forget it - subscriptions renew automatically</p>
            </div>
            <div className="feature">
              <div className="feature-icon">🛡️</div>
              <h3>Secure & Flexible</h3>
              <p>MetaMask Smart Accounts provide enhanced security and permissions</p>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .main {
          padding: 2rem 0;
          max-width: 1200px;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          margin-bottom: 3rem;
          padding: 0 1rem;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 3rem;
          color: white;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .subtitle {
          margin: 1rem 0;
          line-height: 1.5;
          font-size: 1.2rem;
          color: rgba(255,255,255,0.9);
        }

        .status-card {
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 1.5rem;
          margin: 2rem auto;
          max-width: 500px;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .status-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 1rem;
          color: white;
          font-weight: 500;
        }

        .indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .indicator.connected {
          background: #4CAF50;
        }

        .indicator.disconnected {
          background: #ff9800;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        .features {
          text-align: center;
          color: rgba(255,255,255,0.8);
          font-size: 0.9rem;
        }


        .connected-notice {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: rgba(76, 175, 80, 0.2);
          border: 1px solid rgba(76, 175, 80, 0.5);
          border-radius: 6px;
          color: #4CAF50;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .smart-account-notice {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: rgba(33, 150, 243, 0.2);
          border: 1px solid rgba(33, 150, 243, 0.5);
          border-radius: 6px;
          color: #2196F3;
          font-size: 0.8rem;
          font-weight: 500;
        }


        .wallet-connection {
          margin-top: 1.5rem;
          display: flex;
          justify-content: center;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
          margin: 2rem 1rem;
        }

        .features-section {
          margin: 4rem 1rem 2rem;
          text-align: center;
          color: white;
        }

            .gated-access {
              margin: 0 auto 2rem;
              max-width: 720px;
              background: rgba(255,255,255,0.1);
              border: 1px solid rgba(255,255,255,0.2);
              border-radius: 12px;
              padding: 16px;
            }

            .access-content-btn {
              margin-top: 8px;
              padding: 10px 16px;
              background: #111827;
              color: white;
              border-radius: 8px;
              border: none;
              font-weight: 600;
              cursor: pointer;
            }

        .onchain-status {
          margin-bottom: 2rem;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;
          margin: 1rem 0 2rem;
        }

        .status-card {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 12px;
          padding: 1rem;
        }

        .status-card.active {
          border-color: rgba(34, 197, 94, 0.5);
        }

        .status-card.inactive {
          border-color: rgba(239, 68, 68, 0.4);
        }

        .status-title {
          color: rgba(255,255,255,0.7);
          font-size: 0.85rem;
          margin-bottom: 0.25rem;
        }

        .status-value {
          font-weight: 600;
          color: white;
        }

        .features-section h2 {
          margin-bottom: 2rem;
          font-size: 2rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }

        .feature {
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 2rem;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .feature-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .feature h3 {
          margin: 1rem 0 0.5rem;
          font-size: 1.3rem;
        }

        .feature p {
          color: rgba(255,255,255,0.8);
          line-height: 1.5;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  )
}
