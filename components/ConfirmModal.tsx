import { ReactNode } from 'react'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  title: string
  message: ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
}

export default function ConfirmModal({ open, onClose, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm }: ConfirmModalProps) {
  if (!open) return null
  return (
    <div className="cm-backdrop" onClick={onClose}>
      <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cm-header">
          <h3>{title}</h3>
          <button className="cm-close" onClick={onClose}>✕</button>
        </div>
        <div className="cm-body">
          {message}
        </div>
        <div className="cm-footer">
          <button className="btn-secondary" onClick={onClose}>{cancelText}</button>
          <button className="btn-primary" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>

      <style jsx>{`
        .cm-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; padding: 16px; z-index: 1100; }
        .cm-modal { width: 100%; max-width: 520px; background: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.25); overflow: hidden; }
        .cm-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 16px 8px; }
        .cm-header h3 { margin: 0; font-size: 1.2rem; color: #111827; }
        .cm-close { border: none; background: transparent; font-size: 1rem; cursor: pointer; color: #6b7280; }
        .cm-body { padding: 8px 16px 0 16px; color: #374151; line-height: 1.6; }
        .cm-footer { padding: 16px; display: flex; gap: 10px; justify-content: flex-end; border-top: 1px solid #e5e7eb; margin-top: 12px; }
        .btn-secondary { background: #e5e7eb; color: #111827; border: none; border-radius: 8px; padding: 10px 14px; font-weight: 600; cursor: pointer; }
        .btn-primary { background: #7f1d1d; color: white; border: none; border-radius: 8px; padding: 10px 14px; font-weight: 600; cursor: pointer; }
      `}</style>
    </div>
  )
}



