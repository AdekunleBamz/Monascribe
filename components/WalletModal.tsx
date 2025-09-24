import { useState, useEffect } from 'react'
import { WalletConnector, detectWallets, connectWallet, WalletConnectionError } from '../lib/walletConfig'

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (address: string, connector: WalletConnector) => void
}

export default function WalletModal({ isOpen, onClose, onConnect }: WalletModalProps) {
  const [wallets, setWallets] = useState<WalletConnector[]>([])
  const [connecting, setConnecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      detectWallets().then(setWallets)
    }
  }, [isOpen])

  const handleConnect = async (walletId: string) => {
    setConnecting(walletId)
    setError(null)

    try {
      const result = await connectWallet(walletId)
      onConnect(result.address, result.connector!)
      onClose()
    } catch (err: any) {
      console.error('Wallet connection failed:', err)
      if (err instanceof WalletConnectionError) {
        setError(err.message)
      } else {
        setError('Failed to connect wallet. Please try again.')
      }
    } finally {
      setConnecting(null)
    }
  }

  const handleDownload = (wallet: WalletConnector) => {
    const userAgent = navigator.userAgent.toLowerCase()
    let downloadUrl = ''
    
    if (wallet.downloadUrls) {
      if (userAgent.includes('chrome')) {
        downloadUrl = wallet.downloadUrls.chrome || ''
      } else if (userAgent.includes('firefox')) {
        downloadUrl = wallet.downloadUrls.firefox || ''
      } else if (userAgent.includes('edge')) {
        downloadUrl = wallet.downloadUrls.edge || ''
      } else {
        downloadUrl = wallet.downloadUrls.chrome || ''
      }
    }
    
    if (downloadUrl) {
      window.open(downloadUrl, '_blank')
    }
  }

  if (!isOpen) return null

  return (
    <div className="wallet-modal-overlay">
      <div className="wallet-modal">
        <div className="modal-header">
          <h2>Connect Wallet</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}
        
        <div className="wallet-list">
          {wallets.map((wallet) => (
            <WalletOption
              key={wallet.id}
              wallet={wallet}
              connecting={connecting === wallet.id}
              onConnect={() => handleConnect(wallet.id)}
              onDownload={() => handleDownload(wallet)}
            />
          ))}
        </div>
        
        <div className="modal-footer">
          <p className="footer-text">
            New to Ethereum wallets?{' '}
            <a href="https://ethereum.org/wallets/" target="_blank" rel="noopener noreferrer">
              Learn more
            </a>
          </p>
        </div>
      </div>

      <style jsx>{`
        .wallet-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .wallet-modal {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          width: 100%;
          max-width: 420px;
          max-height: 90vh;
          overflow: hidden;
          animation: modalSlideIn 0.3s ease;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-header h2 {
          margin: 0;
          color: white;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .error-message {
          margin: 1rem 1.5rem;
          padding: 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          color: #fca5a5;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .error-icon {
          font-size: 1rem;
        }

        .wallet-list {
          padding: 1rem 1.5rem;
          max-height: 400px;
          overflow-y: auto;
        }

        .modal-footer {
          padding: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
        }

        .footer-text {
          margin: 0;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.85rem;
        }

        .footer-text a {
          color: #60a5fa;
          text-decoration: none;
        }

        .footer-text a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}

interface WalletOptionProps {
  wallet: WalletConnector
  connecting: boolean
  onConnect: () => void
  onDownload: () => void
}

function WalletOption({ wallet, connecting, onConnect, onDownload }: WalletOptionProps) {
  const isDisabled = !wallet.installed && wallet.id !== 'metamask'
  const isComingSoon = wallet.description === 'Coming Soon'

  return (
    <div className={`wallet-option ${isDisabled || isComingSoon ? 'disabled' : ''} ${connecting ? 'connecting' : ''}`}>
      <button 
        className="wallet-button"
        onClick={wallet.installed ? onConnect : onDownload}
        disabled={connecting || isComingSoon}
      >
        <div className="wallet-icon" style={{ background: wallet.iconBackground }}>
          {wallet.icon}
        </div>
        
        <div className="wallet-info">
          <div className="wallet-name">{wallet.name}</div>
          <div className="wallet-description">{wallet.description}</div>
        </div>
        
        <div className="wallet-status">
          {connecting ? (
            <div className="spinner" />
          ) : !wallet.installed && wallet.id === 'metamask' ? (
            <span className="install-text">Install</span>
          ) : wallet.installed ? (
            <span className="connect-text">Connect</span>
          ) : (
            <span className="coming-soon">Soon</span>
          )}
        </div>
      </button>

      <style jsx>{`
        .wallet-option {
          margin-bottom: 0.75rem;
        }

        .wallet-option:last-child {
          margin-bottom: 0;
        }

        .wallet-button {
          width: 100%;
          display: flex;
          align-items: center;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .wallet-button:hover:not(:disabled):not(.disabled .wallet-button) {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .wallet-option.disabled .wallet-button {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .wallet-option.connecting .wallet-button {
          background: rgba(96, 165, 250, 0.1);
          border-color: rgba(96, 165, 250, 0.3);
        }

        .wallet-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          margin-right: 1rem;
          flex-shrink: 0;
        }

        .wallet-info {
          flex: 1;
        }

        .wallet-name {
          color: white;
          font-weight: 600;
          font-size: 1rem;
          margin-bottom: 0.25rem;
        }

        .wallet-description {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.85rem;
        }

        .wallet-status {
          display: flex;
          align-items: center;
        }

        .connect-text, .install-text {
          color: #60a5fa;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .coming-soon {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.85rem;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(96, 165, 250, 0.3);
          border-top: 2px solid #60a5fa;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
