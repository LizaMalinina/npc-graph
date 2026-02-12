'use client'

/**
 * Read-only relationship detail viewer for non-editors
 */

import { GraphLink, GraphNode, getRelationshipColor, getRelationshipSubValue } from '@/types'

interface RelationshipViewerProps {
  relationship: GraphLink
  sourceNode?: GraphNode
  targetNode?: GraphNode
  onClose: () => void
}

export default function RelationshipViewer({
  relationship,
  sourceNode,
  targetNode,
  onClose,
}: RelationshipViewerProps) {
  const subValue = getRelationshipSubValue(
    relationship.type,
    relationship.strength,
    relationship.sourceType,
    relationship.targetType
  )
  const color = getRelationshipColor(relationship.type, relationship.strength)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[250] p-4">
      <div className="bg-[#1a2e23] rounded-lg p-6 max-w-md w-full border border-[#3d5a4e]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Relationship Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Visual representation */}
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#2d4a3e] flex items-center justify-center text-xl">
                {sourceNode?.entityType === 'organisation' ? '🏛️' : '👤'}
              </div>
              <p className="text-white text-sm mt-1">{sourceNode?.name || 'Unknown'}</p>
            </div>
            
            <div className="flex-1 flex items-center justify-center">
              <div 
                className="h-1 flex-1 rounded"
                style={{ backgroundColor: color }}
              />
              <span 
                className="px-2 text-xs font-medium rounded"
                style={{ color }}
              >
                {subValue}
              </span>
              <div 
                className="h-1 flex-1 rounded"
                style={{ backgroundColor: color }}
              />
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#2d4a3e] flex items-center justify-center text-xl">
                {targetNode?.entityType === 'organisation' ? '🏛️' : '👤'}
              </div>
              <p className="text-white text-sm mt-1">{targetNode?.name || 'Unknown'}</p>
            </div>
          </div>

          {/* Details */}
          <div className="bg-[#2d4a3e] rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Type:</span>
              <span className="text-white capitalize">{relationship.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Strength:</span>
              <span className="text-white">{relationship.strength}/5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Relationship:</span>
              <span className="text-white">{subValue}</span>
            </div>
            {relationship.description && (
              <div className="pt-2 border-t border-[#3d5a4e]">
                <span className="text-gray-400 block mb-1">Description:</span>
                <p className="text-white text-sm whitespace-pre-wrap">{relationship.description}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
