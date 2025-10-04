import { useState } from 'react'
import WalletModal from './WalletModal'
import { WalletConnector, promptAccountSelection } from '../lib/walletConfig'

interface ConnectedAccount {
  address: string
  connector: WalletConnector
  chainId?: number
  smartAccountType?: 'smart-account' | 'standard-account'
}

interface ConnectButtonProps {
  account?: ConnectedAccount
  onConnect: (address: string, connector: WalletConnector) => void
  onDisconnect: () => void
  className?: string
}

export default function ConnectButton({ 
  account, 
  onConnect, 
  onDisconnect, 
  className = '' 
}: ConnectButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [showAccountMenu, setShowAccountMenu] = useState(false)

  const handleConnect = (address: string, connector: WalletConnector) => {
    onConnect(address, connector)
    setShowModal(false)
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getAccountStatus = () => {
    if (!account) return ''
    
    if (account.smartAccountType === 'smart-account') {
      return '🚀 Smart Account'
    } else if (account.smartAccountType === 'standard-account') {
      return '🦊 MetaMask'
    }
    return '🔗 Connected'
  }

  if (account) {
    return (
      <div className={`connect-button-container ${className}`}>
        <div className="account-display">
          <div className="chain-indicator">
            <div className="chain-icon">MON</div>
            <span className="chain-name">Monad Testnet</span>
          </div>
          
          <button 
            className="account-button"
            onClick={() => setShowAccountMenu(!showAccountMenu)}
          >
            <div className="account-info">
              <div className="account-status">{getAccountStatus()}</div>
              <div className="account-address">{formatAddress(account.address)}</div>
            </div>
            <div className="account-avatar">
              {account.connector.icon}
            </div>
          </button>
        </div>

        {showAccountMenu && (
          <div className="account-menu">
            <div className="menu-item">
              <span className="menu-label">Connected with {account.connector.name}</span>
            </div>
            <div className="menu-divider" />
            <button className="menu-item menu-button" onClick={() => {
              navigator.clipboard.writeText(account.address)
              setShowAccountMenu(false)
            }}>
              <span>📋 Copy Address</span>
            </button>
            <button className="menu-item menu-button" onClick={() => {
              window.open(`https://testnet.monadexplorer.com/address/${account.address}`, '_blank')
              setShowAccountMenu(false)
            }}>
              <span>🔍 View on Explorer</span>
            </button>
            <div className="menu-divider" />
            <button className="menu-item menu-button" onClick={async () => {
              try {
                await (window as any).ethereum?.request({ method: 'eth_requestAccounts', params: [] })
              } catch {}
              try {
                await (window as any).ethereum?.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] })
              } catch {}
              try {
                await promptAccountSelection()
              } catch {}
              setShowAccountMenu(false)
            }}>
              <span>🔁 Switch Account</span>
            </button>
            <button className="menu-item menu-button disconnect" onClick={async () => {
              onDisconnect()
              try {
                // Clear any dapp-side cached selection
                if (typeof localStorage !== 'undefined') {
                  localStorage.removeItem('wagmi.store')
                  localStorage.removeItem('web3modal.selectedWallet')
                }
              } catch {}
              setShowAccountMenu(false)
            }}>
              <span>🚪 Disconnect</span>
            </button>
          </div>
        )}

        <style jsx>{`
          .connect-button-container {
            position: relative;
          }

          .account-display {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .chain-indicator {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.75rem;
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.3);
            border-radius: 9999px;
            font-size: 0.85rem;
          }

          .chain-icon {
            width: 16px;
            height: 16px;
            background: #22c55e;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.6rem;
            font-weight: bold;
            color: white;
          }

          .chain-name {
            color: #22c55e;
            font-weight: 500;
          }

          .account-button {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.5rem 0.75rem;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 9999px;
            cursor: pointer;
            transition: all 0.2s;
            color: white;
          }

          .account-button:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.3);
          }

          .account-info {
            text-align: left;
          }

          .account-status {
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 0.125rem;
          }

          .account-address {
            font-size: 0.9rem;
            font-weight: 600;
            color: white;
          }

          .account-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: ${account.connector.iconBackground};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
          }

          .account-menu {
            position: absolute;
            top: calc(100% + 0.5rem);
            right: 0;
            background: #1a1a1a;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
            overflow: hidden;
            z-index: 100;
            min-width: 200px;
          }

          .menu-item {
            display: block;
            width: 100%;
            padding: 0.75rem 1rem;
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.85rem;
            text-align: left;
          }

          .menu-button {
            background: none;
            border: none;
            cursor: pointer;
            transition: background 0.2s;
          }

          .menu-button:hover {
            background: rgba(255, 255, 255, 0.05);
            color: white;
          }

          .menu-button.disconnect:hover {
            background: rgba(239, 68, 68, 0.1);
            color: #fca5a5;
          }

          .menu-divider {
            height: 1px;
            background: rgba(255, 255, 255, 0.1);
          }
        `}</style>
      </div>
    )
  }

  return (
    <>
      <button 
        className={`connect-wallet-button ${className}`}
        onClick={() => setShowModal(true)}
      >
        Connect Wallet
      </button>

      <WalletModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConnect={handleConnect}
      />

      <style jsx>{`
        .connect-wallet-button {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          border-radius: 9999px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .connect-wallet-button:hover {
          background: linear-gradient(135deg, #2563eb, #1e40af);
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
        }

        .connect-wallet-button:active {
          transform: translateY(0);
        }
      `}</style>
    </>
  )
}
