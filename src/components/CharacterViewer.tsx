'use client'

import { Character, Organisation } from '@/types'
import { getPlaceholderAvatar } from '@/lib/utils'

interface CharacterViewerProps {
  character: Character
  organisations?: Organisation[]
  onClose: () => void
}

export default function CharacterViewer({ 
  character, 
  organisations = [],
  onClose,
}: CharacterViewerProps) {
  // Find organisation name if character has membership
  const orgName = character.organisations?.[0]?.id
    ? organisations.find(o => o.id === character.organisations?.[0]?.id)?.name || character.organisations?.[0]?.name
    : null

  const statusColors: Record<string, string> = {
    alive: 'bg-green-600',
    dead: 'bg-red-600',
    unknown: 'bg-gray-600',
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200]" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            👤 Character Details
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
            <div className="w-48 aspect-[3/4] rounded-lg overflow-hidden border-4 border-[#8b7355] bg-[#2d4a3e]">
              <img
                src={character.imageUrl || getPlaceholderAvatar(character.name, '3b82f6')}
                alt={character.name}
                className="w-full h-full object-cover"
                style={character.imageCrop ? {
                  transform: `scale(${character.imageCrop.zoom}) translate(${character.imageCrop.offsetX / character.imageCrop.zoom}%, ${character.imageCrop.offsetY / character.imageCrop.zoom}%)`,
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
              {character.name}
            </div>
          </div>

          {/* Title */}
          {character.title && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Title
              </label>
              <div className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                {character.title}
              </div>
            </div>
          )}

          {/* Organisation */}
          {orgName && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Organisation
              </label>
              <div className="px-3 py-2 bg-purple-600/20 border border-purple-500/30 rounded-md text-purple-300 flex items-center gap-2">
                <span>🏛️</span>
                {orgName}
              </div>
            </div>
          )}

          {/* Description */}
          {character.description && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Description
              </label>
              <div className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white whitespace-pre-wrap">
                {character.description}
              </div>
            </div>
          )}

          {/* Faction */}
          {character.faction && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Faction
              </label>
              <div className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                {character.faction}
              </div>
            </div>
          )}

          {/* Location */}
          {character.location && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Location
              </label>
              <div className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white flex items-center gap-2">
                <span>📍</span>
                {character.location}
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Status
            </label>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded text-white text-sm font-medium ${statusColors[character.status || 'alive']}`}>
                {(character.status || 'alive').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Tags */}
          {character.tags && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Tags
              </label>
              <div className="flex flex-wrap gap-1">
                {(typeof character.tags === 'string' ? character.tags.split(',') : character.tags).map((tag, i) => (
                  <span key={i} className="px-2 py-1 bg-[#3d5a4e] text-gray-300 rounded text-sm">
                    {typeof tag === 'string' ? tag.trim() : tag}
                  </span>
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
