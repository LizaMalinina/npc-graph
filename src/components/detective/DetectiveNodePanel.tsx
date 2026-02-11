'use client'

import { useState } from 'react'
import { GraphNode, GraphLink, RELATIONSHIP_COLORS, getRelationshipSubValue, getRelationshipColor } from '@/types'
import { getPlaceholderAvatar } from '@/lib/utils'

interface DetectiveNodePanelProps {
  node: GraphNode
  relationships: {
    from: Array<GraphLink & { targetNode?: GraphNode }>
    to: Array<GraphLink & { sourceNode?: GraphNode }>
  }
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
  onAddRelationship?: () => void
  onEditRelationship?: (link: GraphLink) => void
  onViewRelationship?: (link: GraphLink) => void
  onMemberClick?: (member: GraphNode) => void
  onOrganisationClick?: (orgId: string) => void
  parentOrg?: GraphNode | null
  onBackToOrg?: () => void
}

export default function DetectiveNodePanel({
  node,
  relationships,
  onClose,
  onEdit,
  onDelete,
  onAddRelationship,
  onEditRelationship,
  onViewRelationship,
  onMemberClick,
  onOrganisationClick,
  parentOrg,
  onBackToOrg,
}: DetectiveNodePanelProps) {
  const [showFullDescription, setShowFullDescription] = useState(false)
  const isOrganisation = node.entityType === 'organisation'
  
  const DESCRIPTION_THRESHOLD = 150

  return (
    <div className="w-80 bg-[#1a2f27] border-l border-[#3d5a4e] h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-[#3d5a4e] flex items-center justify-between">
        <div className={`text-xs font-bold px-2 py-1 rounded ${
          isOrganisation ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
        }`}>
          {isOrganisation ? '🏛️ ORGANISATION' : '👤 CHARACTER'}
        </div>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-white text-xl"
        >
          ✕
        </button>
      </div>

      {/* Back to Organisation button (when viewing a character that belongs to an org) */}
      {parentOrg && onBackToOrg && (
        <div className="px-4 pt-4">
          <button
            onClick={onBackToOrg}
            className="w-full px-3 py-2 bg-purple-600/30 text-purple-300 rounded-md hover:bg-purple-600/50 transition-colors text-sm flex items-center gap-2"
          >
            ← Back to {parentOrg.name}
          </button>
        </div>
      )}

      {/* Photo - always portrait aspect ratio */}
      <div className="p-4">
        <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border-4 border-[#8b7355] bg-[#2d4a3e]">
          <img
            src={node.imageUrl || getPlaceholderAvatar(node.name, isOrganisation ? '8b5cf6' : '3b82f6')}
            alt={node.name}
            className="w-full h-full object-cover"
            style={node.imageCrop ? {
              transform: `scale(${node.imageCrop.zoom}) translate(${node.imageCrop.offsetX / node.imageCrop.zoom}%, ${node.imageCrop.offsetY / node.imageCrop.zoom}%)`,
              transformOrigin: 'center',
            } : undefined}
          />
          {node.status === 'dead' && (
            <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded transform rotate-12">
              DECEASED
            </div>
          )}
        </div>
      </div>

      {/* Name & Title */}
      <div className="px-4 pb-4">
        <h2 className="text-xl font-bold text-white">{node.name}</h2>
        {node.title && (
          <p className="text-[#b8860b] italic">{node.title}</p>
        )}
      </div>

      {/* Quick Info */}
      <div className="px-4 pb-4 flex flex-wrap gap-2">
        {node.status && !isOrganisation && (
          <span className={`text-xs px-2 py-1 rounded ${
            node.status === 'alive' ? 'bg-green-600' : 
            node.status === 'dead' ? 'bg-red-600' : 'bg-gray-600'
          } text-white`}>
            {node.status.toUpperCase()}
          </span>
        )}
        {node.faction && (
          <span className="text-xs px-2 py-1 rounded bg-[#8b7355] text-white">
            {node.faction}
          </span>
        )}
        {node.location && (
          <span className="text-xs px-2 py-1 rounded bg-[#3d5a4e] text-white">
            📍 {node.location}
          </span>
        )}
      </div>

      {/* Description */}
      {node.description && (
        <div className="px-4 pb-4">
          <h3 className="text-sm font-bold text-[#b8860b] mb-2">Description</h3>
          <p className="text-gray-300 text-sm">
            {showFullDescription || node.description.length <= DESCRIPTION_THRESHOLD
              ? node.description
              : `${node.description.slice(0, DESCRIPTION_THRESHOLD)}...`}
          </p>
          {node.description.length > DESCRIPTION_THRESHOLD && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-[#b8860b] text-sm mt-1 hover:underline"
            >
              {showFullDescription ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {/* Tags */}
      {node.tags && node.tags.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-1">
            {node.tags.map((tag, i) => (
              <span key={i} className="text-xs px-2 py-1 bg-[#3d5a4e] text-gray-300 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Organisations (for characters) */}
      {!isOrganisation && node.organisations && node.organisations.length > 0 && (
        <div className="px-4 pb-4">
          <h3 className="text-sm font-bold text-[#b8860b] mb-2">
            Organisation{node.organisations.length > 1 ? 's' : ''}
          </h3>
          <div className="space-y-2">
            {node.organisations.map(org => (
              <button 
                key={org.id}
                onClick={() => onOrganisationClick?.(org.id)}
                className={`w-full flex items-center gap-2 p-2 bg-purple-600/20 rounded text-left ${onOrganisationClick ? 'cursor-pointer hover:bg-purple-600/30 transition-colors' : ''}`}
              >
                <span className="text-purple-300">🏛️</span>
                <span className="text-white text-sm">{org.name}</span>
                {onOrganisationClick && <span className="text-purple-300 text-sm ml-auto">→</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Members (for organisations) */}
      {isOrganisation && node.members && node.members.length > 0 && (
        <div className="px-4 pb-4">
          <h3 className="text-sm font-bold text-[#b8860b] mb-2">
            Members ({node.members.length})
          </h3>
          <div className="space-y-2">
            {node.members.map(member => (
              <div 
                key={member.id} 
                className={`flex items-center gap-2 p-2 bg-[#2d4a3e] rounded ${onMemberClick ? 'cursor-pointer hover:bg-[#3d5a4e] transition-colors' : ''}`}
                onClick={() => onMemberClick?.(member)}
              >
                <img
                  src={member.imageUrl || getPlaceholderAvatar(member.name, '3b82f6')}
                  alt={member.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="text-white text-sm">{member.name}</p>
                  {member.title && <p className="text-gray-400 text-xs">{member.title}</p>}
                </div>
                {onMemberClick && (
                  <span className="text-gray-400 text-xs">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Relationships */}
      <div className="px-4 pb-4">
        <h3 className="text-sm font-bold text-[#b8860b] mb-2">Relationships</h3>
        
        {relationships.from.length === 0 && relationships.to.length === 0 ? (
          <p className="text-gray-400 text-sm italic">No relationships yet</p>
        ) : (
          <div className="space-y-2">
            {/* Outgoing relationships */}
            {relationships.from.map(rel => {
              const subValue = getRelationshipSubValue(
                rel.type,
                rel.strength,
                rel.sourceType,
                rel.targetType
              )
              const color = getRelationshipColor(rel.type, rel.strength)
              
              return (
                <div 
                  key={rel.id} 
                  className="p-2 bg-[#2d4a3e] rounded cursor-pointer hover:bg-[#3d5a4e]"
                  onClick={() => (onEditRelationship ?? onViewRelationship)?.(rel)}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-white text-sm">
                      → {rel.targetNode?.name || 'Unknown'} <span className="italic text-gray-300">({subValue})</span>
                    </span>
                  </div>
                </div>
              )
            })}
            
            {/* Incoming relationships */}
            {relationships.to.map(rel => {
              const subValue = getRelationshipSubValue(
                rel.type,
                rel.strength,
                rel.sourceType,
                rel.targetType
              )
              const color = getRelationshipColor(rel.type, rel.strength)
              
              return (
                <div 
                  key={rel.id} 
                  className="p-2 bg-[#2d4a3e] rounded cursor-pointer hover:bg-[#3d5a4e]"
                  onClick={() => (onEditRelationship ?? onViewRelationship)?.(rel)}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-white text-sm">
                      ← {rel.sourceNode?.name || 'Unknown'} <span className="italic text-gray-300">({subValue})</span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 space-y-2">
        {onAddRelationship && (
          <button
            onClick={onAddRelationship}
            className="w-full px-4 py-2 bg-[#b8860b] text-white rounded hover:bg-[#9a7209] text-sm"
          >
            + Add Relationship
          </button>
        )}
        {onEdit && (
          <button
            onClick={onEdit}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Edit {isOrganisation ? 'Organisation' : 'Character'}
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
