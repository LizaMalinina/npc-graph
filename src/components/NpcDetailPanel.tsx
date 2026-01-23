'use client'

import { GraphNode, RELATIONSHIP_COLORS } from '@/types'

// Generate placeholder avatar URL (same as in NpcGraph)
function getPlaceholderAvatar(name: string): string {
  const seed = encodeURIComponent(name)
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=1e293b`
}

interface NpcDetailPanelProps {
  node: GraphNode
  relationships: {
    from: { type: string; target: GraphNode; description?: string | null }[]
    to: { type: string; source: GraphNode; description?: string | null }[]
  }
  onClose: () => void
  onEdit?: () => void
  canEdit: boolean
}

export default function NpcDetailPanel({
  node,
  relationships,
  onClose,
  onEdit,
  canEdit,
}: NpcDetailPanelProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 text-white w-80">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">{node.name}</h2>
          {node.title && <p className="text-gray-400 text-sm">{node.title}</p>}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xl"
        >
          ×
        </button>
      </div>

      <div className="mb-4">
        <img
          src={node.imageUrl || getPlaceholderAvatar(node.name)}
          alt={node.name}
          className="w-full h-40 object-cover rounded-lg bg-gray-700"
        />
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded text-xs ${
              node.status === 'alive'
                ? 'bg-green-600'
                : node.status === 'dead'
                ? 'bg-red-600'
                : 'bg-gray-600'
            }`}
          >
            {node.status.toUpperCase()}
          </span>
          {node.faction && (
            <span className="px-2 py-1 bg-blue-600 rounded text-xs">
              {node.faction}
            </span>
          )}
        </div>

        {node.location && (
          <p className="text-sm">
            <span className="text-gray-400">Location:</span> {node.location}
          </p>
        )}

        {node.tags && node.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {node.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-700 rounded text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Relationships */}
      <div className="border-t border-gray-700 pt-4">
        <h3 className="font-semibold mb-2">Relationships</h3>
        
        {relationships.from.length === 0 && relationships.to.length === 0 ? (
          <p className="text-gray-400 text-sm">No relationships</p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {/* Combine and sort all relationships by type */}
            {[
              ...relationships.from.map((rel, i) => ({ ...rel, key: `from-${i}`, name: rel.target.name })),
              ...relationships.to.map((rel, i) => ({ ...rel, key: `to-${i}`, name: rel.source.name }))
            ]
              .sort((a, b) => a.type.localeCompare(b.type))
              .map(rel => (
                <div key={rel.key} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: RELATIONSHIP_COLORS[rel.type] }}
                  />
                  <span>{rel.name}</span>
                  <span className="text-gray-400">{rel.type}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {canEdit && onEdit && (
        <button
          onClick={onEdit}
          className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          Edit NPC
        </button>
      )}
    </div>
  )
}
