'use client'

import { Organisation, GraphNode } from '@/types'
import { getPlaceholderAvatar } from '@/lib/utils'

interface OrganisationViewerProps {
  organisation: Organisation
  members?: GraphNode[]
  onClose: () => void
  onMemberClick?: (member: GraphNode) => void
}

export default function OrganisationViewer({ 
  organisation,
  members = [],
  onClose,
  onMemberClick,
}: OrganisationViewerProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200]" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            🏛️ Organisation Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Image */}
          <div className="flex justify-center">
            <div className="w-48 aspect-[3/4] rounded-lg overflow-hidden border-4 border-purple-500 bg-[#2d4a3e]">
              <img
                src={organisation.imageUrl || getPlaceholderAvatar(organisation.name, '8b5cf6')}
                alt={organisation.name}
                className="w-full h-full object-cover"
                style={organisation.imageCrop ? {
                  transform: `scale(${organisation.imageCrop.zoom}) translate(${organisation.imageCrop.offsetX / organisation.imageCrop.zoom}%, ${organisation.imageCrop.offsetY / organisation.imageCrop.zoom}%)`,
                  transformOrigin: 'center',
                } : undefined}
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Name
            </label>
            <div className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
              {organisation.name}
            </div>
          </div>

          {/* Description */}
          {organisation.description && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Description
              </label>
              <div className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white whitespace-pre-wrap">
                {organisation.description}
              </div>
            </div>
          )}

          {/* Pin Color */}
          {organisation.pinColor && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Pin Color
              </label>
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-full border-2 border-gray-500"
                  style={{ backgroundColor: organisation.pinColor }}
                />
                <span className="text-gray-300">{organisation.pinColor}</span>
              </div>
            </div>
          )}

          {/* Members */}
          {members.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Members ({members.length})
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {members.map(member => (
                  <button
                    key={member.id}
                    onClick={() => onMemberClick?.(member)}
                    className={`w-full flex items-center gap-2 p-2 bg-[#2d4a3e] rounded ${onMemberClick ? 'hover:bg-[#3d5a4e] cursor-pointer' : ''}`}
                    disabled={!onMemberClick}
                  >
                    <img
                      src={member.imageUrl || getPlaceholderAvatar(member.name, '3b82f6')}
                      alt={member.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1 text-left">
                      <p className="text-white text-sm">{member.name}</p>
                      {member.title && <p className="text-gray-400 text-xs">{member.title}</p>}
                    </div>
                    {onMemberClick && <span className="text-gray-400 text-xs">→</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="pt-4">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
