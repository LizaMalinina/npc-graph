'use client'

import { useState, useRef } from 'react'
import { Npc, NPC_STATUSES, Crew } from '@/types'

type CharacterType = 'npc' | 'crew-member'

interface NpcFormProps {
  npc?: Npc | null
  onSubmit: (data: Partial<Npc>) => void
  onSubmitCrewMember?: (crewId: string, data: { name: string; title?: string; description?: string; imageUrl?: string }) => void
  onCancel: () => void
  onDelete?: () => void
  crews?: Crew[]
  allowCharacterTypeSelection?: boolean
}

export default function NpcForm({ npc, onSubmit, onSubmitCrewMember, onCancel, onDelete, crews = [], allowCharacterTypeSelection = false }: NpcFormProps) {
  const [characterType, setCharacterType] = useState<CharacterType>('npc')
  const [selectedCrewId, setSelectedCrewId] = useState<string>(crews[0]?.id || '')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    name: npc?.name || '',
    title: npc?.title || '',
    description: npc?.description || '',
    imageUrl: npc?.imageUrl || '',
    faction: npc?.faction || '',
    location: npc?.location || '',
    status: npc?.status || 'alive',
    tags: npc?.tags || '',
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setFormData(prev => ({ ...prev, imageUrl: data.url }))
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (characterType === 'crew-member' && onSubmitCrewMember && selectedCrewId) {
      onSubmitCrewMember(selectedCrewId, {
        name: formData.name,
        title: formData.title || undefined,
        description: formData.description || undefined,
        imageUrl: formData.imageUrl || undefined,
      })
    } else {
      onSubmit(formData)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const isCrewMember = characterType === 'crew-member'

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200]" onClick={onCancel}>
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-4">
          {npc ? 'Edit Character' : 'Create New Character'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Character Type Selection - only for new characters */}
          {!npc && allowCharacterTypeSelection && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Character Type *
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCharacterType('npc')}
                  className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                    characterType === 'npc'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  🎭 NPC
                </button>
                <button
                  type="button"
                  onClick={() => setCharacterType('crew-member')}
                  disabled={crews.length === 0}
                  className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                    characterType === 'crew-member'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  } ${crews.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  👤 Crew Member
                </button>
              </div>
              {crews.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">No crews available. Create a crew first.</p>
              )}
            </div>
          )}

          {/* Crew Selection - only for crew members */}
          {isCrewMember && crews.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Add to Crew *
              </label>
              <select
                value={selectedCrewId}
                onChange={(e) => setSelectedCrewId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {crews.map(crew => (
                  <option key={crew.id} value={crew.id}>
                    👥 {crew.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., The Blacksmith"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Image
            </label>
            <div className="space-y-2">
              {/* File Upload */}
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  {isUploading ? '📤 Uploading...' : '📁 Upload Image'}
                </button>
              </div>
              
              {/* Upload Error */}
              {uploadError && (
                <p className="text-red-400 text-sm">{uploadError}</p>
              )}
              
              {/* URL Input - only show if no uploaded image (URLs from Azure have SAS tokens) */}
              {!formData.imageUrl?.includes('blob.core.windows.net') && (
                <div className="relative">
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="Or paste image URL..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              {/* Image Preview */}
              {formData.imageUrl && (
                <div className="relative">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-md border border-gray-600"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 text-sm hover:bg-red-700"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* NPC-specific fields - hidden for crew members */}
          {!isCrewMember && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Faction
                  </label>
                  <input
                    type="text"
                    name="faction"
                    value={formData.faction}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {NPC_STATUSES.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="merchant, quest-giver, friendly"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={isUploading}
              className={`flex-1 px-4 py-2 ${isCrewMember ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md transition-colors disabled:opacity-50`}
            >
              {isUploading ? 'Uploading...' : (npc ? 'Update' : 'Create')}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
          
          {npc && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            >
              Delete NPC
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
