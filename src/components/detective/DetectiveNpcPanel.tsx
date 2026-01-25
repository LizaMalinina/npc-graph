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
  onMemberClick?: (member: GraphNode) => void
  onBackToCrew?: () => void
  parentCrew?: GraphNode | null
  canEdit: boolean
  isMobile?: boolean
}

export default function DetectiveNpcPanel({
  node,
  relationships,
  onClose,
  onEdit,
  onMemberClick,
  onBackToCrew,
  parentCrew,
  canEdit,
  isMobile = false,
}: DetectiveNpcPanelProps) {
  const isCrew = node.nodeType === 'crew'
  const isCrewMember = node.nodeType === 'crew-member'

  // Mobile horizontal layout for NPCs and crew members (not crews)
  if (isMobile && !isCrew) {
    return (
      <div className={`detective-npc-panel mobile-panel ${isCrewMember ? 'crew-member-panel' : ''}`}>
        {/* Case file header */}
        <div className="case-file-header">
          <div className={`case-stamp`}>
            {isCrewMember ? 'CREW MEMBER' : 'CLASSIFIED'}
          </div>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        {/* Back to crew button */}
        {isCrewMember && parentCrew && onBackToCrew && (
          <button className="back-to-crew-btn" onClick={onBackToCrew}>
            ← Back to {parentCrew.name}
          </button>
        )}

        {/* Mobile horizontal layout */}
        <div className="mobile-content-layout">
          {/* Left side - Photo */}
          <div className="mobile-photo-section">
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
                <div className="status-stamp unknown">UNKNOWN</div>
              )}
            </div>
            {/* Quick info under photo */}
            <div className="mobile-quick-info">
              <span className={`status-badge status-${node.status}`}>
                {node.status?.toUpperCase()}
              </span>
              <span className={`type-badge ${isCrewMember ? 'crew-member-type' : 'npc-type'}`}>
                {isCrewMember ? '👤' : '🎭'}
              </span>
            </div>
          </div>

          {/* Right side - Details */}
          <div className="mobile-details-section">
            <h2 className="suspect-name">
              {isCrewMember && <span className="type-icon">👤 </span>}
              {node.name}
            </h2>
            {node.title && <p className="suspect-title">&ldquo;{node.title}&rdquo;</p>}
            
            {node.description && (
              <p className="mobile-description">{node.description}</p>
            )}

            {node.faction && (
              <div className="mobile-detail-row">
                <span className="detail-label">Faction:</span>
                <span className="faction-badge">{node.faction}</span>
              </div>
            )}

            {node.location && (
              <div className="mobile-detail-row">
                <span className="detail-label">Location:</span>
                <span>{node.location}</span>
              </div>
            )}

            {node.tags && node.tags.length > 0 && (
              <div className="mobile-tags">
                {node.tags.map(tag => (
                  <span key={tag} className="evidence-tag">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Connections section - full width */}
        <div className="connections-section compact">
          <h3 className="section-title">
            <span className="yarn-icon">🧵</span> Connections
          </h3>

          {relationships.from.length === 0 && relationships.to.length === 0 ? (
            <p className="no-connections">No known connections</p>
          ) : (
            <div className="connections-list horizontal">
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
              ✏️ Edit
            </button>
          </div>
        )}
      </div>
    )
  }

  // Desktop layout (and mobile crew layout)
  return (
    <div className={`detective-npc-panel ${isCrew ? 'crew-panel' : ''} ${isCrewMember ? 'crew-member-panel' : ''}`}>
      {/* Case file header */}
      <div className="case-file-header">
        <div className={`case-stamp ${isCrew ? 'crew-stamp' : ''}`}>
          {isCrew ? 'CREW DOSSIER' : isCrewMember ? 'CREW MEMBER' : 'CLASSIFIED'}
        </div>
        <button onClick={onClose} className="close-btn">✕</button>
      </div>

      {/* Back to crew button */}
      {isCrewMember && parentCrew && onBackToCrew && (
        <button className="back-to-crew-btn" onClick={onBackToCrew}>
          ← Back to {parentCrew.name}
        </button>
      )}

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
        {isCrew && node.members && (
          <div className="crew-member-count">
            {node.members.length} members
          </div>
        )}
      </div>

      {/* Name and title */}
      <div className="suspect-info">
        <h2 className="suspect-name">
          {isCrew && <span className="type-icon">👥 </span>}
          {isCrewMember && <span className="type-icon">👤 </span>}
          {node.name}
        </h2>
        {node.title && <p className="suspect-title">&ldquo;{node.title}&rdquo;</p>}
      </div>

      {/* Description - new section */}
      {node.description && (
        <div className="description-section">
          <p className="description-text">{node.description}</p>
        </div>
      )}

      {/* Crew Members Section - only for crew nodes */}
      {isCrew && node.members && node.members.length > 0 && (
        <div className="crew-members-section">
          <h3 className="section-title">
            <span className="yarn-icon">👥</span> Crew Members
          </h3>
          <div className="crew-members-grid">
            {node.members.map(member => (
              <button
                key={member.id}
                className="crew-member-card"
                onClick={() => onMemberClick?.(member)}
              >
                <img
                  src={member.imageUrl || getPlaceholderAvatar(member.name)}
                  alt={member.name}
                  className="member-photo"
                />
                <div className="member-info">
                  <span className="member-name">{member.name}</span>
                  {member.title && <span className="member-title">{member.title}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

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

        {!isCrew && node.status && (
          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className={`detail-value status-${node.status}`}>
              {node.status.toUpperCase()}
            </span>
          </div>
        )}

        {!isCrew && (
          <div className="detail-row">
            <span className="detail-label">Type:</span>
            <span className={`detail-value type-badge ${isCrewMember ? 'crew-member-type' : 'npc-type'}`}>
              {isCrewMember ? '👤 Crew Member' : '🎭 NPC'}
            </span>
          </div>
        )}

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
