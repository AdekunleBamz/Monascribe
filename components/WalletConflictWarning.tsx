import { useEffect, useState } from 'react'
import { detectWalletConflicts } from '../lib/walletConfig'

interface WalletConflictWarningProps {
  onDismiss?: () => void
}

export default function WalletConflictWarning({ onDismiss }: WalletConflictWarningProps) {
  const [conflicts, setConflicts] = useState<{
    hasConflicts: boolean
    detectedWallets: string[]
    recommendations: string[]
  } | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check for wallet conflicts on mount
    const conflictData = detectWalletConflicts()
    setConflicts(conflictData)
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  if (!conflicts?.hasConflicts || dismissed) {
    return null
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      maxWidth: '400px',
      background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)',
      border: '1px solid #f59e0b',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      zIndex: 1000,
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>⚠️</span>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#92400e' }}>
              Wallet Extension Conflicts Detected
            </h3>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#92400e' }}>
              <strong>Detected Wallets:</strong> {conflicts.detectedWallets.join(', ')}
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#a16207' }}>
              Multiple wallet extensions can interfere with Smart Account creation.
            </p>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <p style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '600', color: '#92400e' }}>
              Recommendations:
            </p>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#a16207' }}>
              {conflicts.recommendations.map((rec, index) => (
                <li key={index} style={{ marginBottom: '2px' }}>{rec}</li>
              ))}
            </ul>
          </div>

          <div style={{ 
            padding: '8px 12px', 
            background: 'rgba(146, 64, 14, 0.1)', 
            borderRadius: '6px',
            fontSize: '12px',
            color: '#92400e'
          }}>
            💡 <strong>Note:</strong> The app will still work with standard MetaMask transactions if Smart Accounts fail.
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '4px',
            color: '#92400e',
            lineHeight: 1,
            marginLeft: '8px'
          }}
          title="Dismiss warning"
        >
          ×
        </button>
      </div>
    </div>
  )
}