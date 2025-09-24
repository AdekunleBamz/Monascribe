import { ReactNode } from 'react'

interface ContentModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  content?: string
  items?: { title: string, description: string, link?: string }[]
  resources?: { label: string, url: string }[]
  explorerUrl?: string
}

export default function ContentModal({ open, onClose, title, subtitle, content, items, resources, explorerUrl }: ContentModalProps) {
  if (!open) return null

  return (
    <div className="cm-backdrop" onClick={onClose}>
      <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cm-header">
          <div className="cm-titles">
            <h3>{title}</h3>
            {subtitle && <p className="cm-subtitle">{subtitle}</p>}
          </div>
          <button className="cm-close" onClick={onClose}>✕</button>
        </div>

        {content && (
          <div className="cm-content" dangerouslySetInnerHTML={{ __html: content }} />
        )}

        {items && items.length > 0 && (
          <div className="cm-section">
            <h4>Included</h4>
            <ul className="cm-list">
              {items.map((it, idx) => (
                <li key={idx} className="cm-item">
                  <div className="cm-item-title">{it.title}</div>
                  <div className="cm-item-desc">{it.description}</div>
                  {it.link && (
                    <a href={it.link} target="_blank" rel="noopener noreferrer" className="cm-link">Open ↗</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {resources && resources.length > 0 && (
          <div className="cm-section">
            <h4>Resources</h4>
            <div className="cm-resources">
              {resources.map((r, idx) => (
                <a key={idx} href={r.url} target="_blank" rel="noopener noreferrer" className="cm-chip">{r.label}</a>
              ))}
            </div>
          </div>
        )}

        <div className="cm-footer">
          {explorerUrl && (
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="cm-explorer">View last transaction ↗</a>
          )}
          <button className="cm-primary" onClick={onClose}>Close</button>
        </div>
      </div>

      <style jsx>{`
        .cm-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 16px;
          z-index: 1000;
        }
        .cm-modal {
          width: 100%;
          max-width: 720px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.25);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .cm-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          padding: 20px 20px 0 20px;
        }
        .cm-titles h3 {
          margin: 0;
          font-size: 1.4rem;
          color: #111827;
        }
        .cm-subtitle {
          margin: 6px 0 0 0;
          color: #6b7280;
        }
        .cm-close {
          border: none;
          background: transparent;
          font-size: 1rem;
          cursor: pointer;
          color: #6b7280;
        }
        .cm-content {
          padding: 16px 20px 0 20px;
          color: #374151;
          line-height: 1.6;
        }
        .cm-section {
          padding: 16px 20px 0 20px;
        }
        .cm-section h4 {
          margin: 0 0 8px 0;
          color: #111827;
        }
        .cm-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        .cm-item {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 12px;
          background: #fafafa;
        }
        .cm-item-title {
          font-weight: 600;
          color: #111827;
        }
        .cm-item-desc {
          color: #6b7280;
          margin-top: 4px;
        }
        .cm-link {
          display: inline-block;
          margin-top: 8px;
          color: #2563eb;
          text-decoration: none;
        }
        .cm-resources {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .cm-chip {
          display: inline-block;
          padding: 6px 10px;
          background: #111827;
          color: white;
          border-radius: 9999px;
          font-size: 0.85rem;
          text-decoration: none;
        }
        .cm-footer {
          padding: 20px;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          align-items: center;
          border-top: 1px solid #e5e7eb;
          margin-top: 16px;
        }
        .cm-explorer {
          margin-right: auto;
          color: #2563eb;
          text-decoration: none;
        }
        .cm-primary {
          background: #111827;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 16px;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}


