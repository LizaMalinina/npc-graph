'use client'

import { GraphNode, RELATIONSHIP_COLORS } from '@/types'

function getPlaceholderAvatar(name: string): string {
  const seed = encodeURIComponent(name)
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=b8860b`
}

interface DetectiveNpcPanelProps {
  node: GraphNode
  relationships: {
    from: { type: string; target: GraphNode; description?: string | null }[]
    to: { type: string; source: GraphNode; description?: string | null }[]
  }
  onClose: () => void
  onEdit?: () => void
  canEdit: boolean
}

export default function DetectiveNpcPanel({
  node,
  relationships,
  onClose,
  onEdit,
  canEdit,
}: DetectiveNpcPanelProps) {
  return (
    <div className="detective-npc-panel">
      {/* Case file header */}
      <div className="case-file-header">
        <div className="case-stamp">CLASSIFIED</div>
        <button onClick={onClose} className="close-btn">✕</button>
      </div>

      {/* Photo */}
      <div className="suspect-photo-wrapper">
        <img
          src={node.imageUrl || getPlaceholderAvatar(node.name)}
          alt={node.name}
          className="suspect-photo"
        />
        {node.status === 'dead' && (
          <div className="status-stamp dead">DECEASED</div>
        )}
        {node.status === 'unknown' && (
          <div className="status-stamp unknown">WHEREABOUTS UNKNOWN</div>
        )}
      </div>

      {/* Name and title */}
      <div className="suspect-info">
        <h2 className="suspect-name">{node.name}</h2>
        {node.title && <p className="suspect-title">&ldquo;{node.title}&rdquo;</p>}
      </div>

      {/* Details on torn paper */}
      <div className="case-details">
        {node.faction && (
          <div className="detail-row">
            <span className="detail-label">Affiliation:</span>
            <span className="detail-value faction-badge">{node.faction}</span>
          </div>
        )}

        {node.location && (
          <div className="detail-row">
            <span className="detail-label">Last Seen:</span>
            <span className="detail-value">{node.location}</span>
          </div>
        )}

        <div className="detail-row">
          <span className="detail-label">Status:</span>
          <span className={`detail-value status-${node.status}`}>
            {node.status.toUpperCase()}
          </span>
        </div>

        {node.tags && node.tags.length > 0 && (
          <div className="tags-section">
            <span className="detail-label">Notes:</span>
            <div className="tag-list">
              {node.tags.map(tag => (
                <span key={tag} className="evidence-tag">#{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Connections section */}
      <div className="connections-section">
        <h3 className="section-title">
          <span className="yarn-icon">🧵</span> Known Connections
        </h3>

        {relationships.from.length === 0 && relationships.to.length === 0 ? (
          <p className="no-connections">No known connections</p>
        ) : (
          <div className="connections-list">
            {[
              ...relationships.from.map((rel, i) => ({ 
                ...rel, 
                key: `from-${i}`, 
                name: rel.target.name,
                direction: 'to'
              })),
              ...relationships.to.map((rel, i) => ({ 
                ...rel, 
                key: `to-${i}`, 
                name: rel.source.name,
                direction: 'from'
              }))
            ]
              .sort((a, b) => a.type.localeCompare(b.type))
              .map(rel => (
                <div key={rel.key} className="connection-item">
                  <span 
                    className="connection-string"
                    style={{ backgroundColor: RELATIONSHIP_COLORS[rel.type] }}
                  />
                  <span className="connection-name">{rel.name}</span>
                  <span className="connection-type">[{rel.type}]</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {canEdit && onEdit && (
        <div className="panel-actions">
          <button onClick={onEdit} className="edit-btn">
            ✏️ Edit Case File
          </button>
        </div>
      )}
    </div>
  )
}
