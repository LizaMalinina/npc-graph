'use client'

import { useState, useRef } from 'react'
import { Character, Organisation, CHARACTER_STATUSES, CropSettings } from '@/types'
import ImageCropper from '@/components/ImageCropper'

type CharacterType = 'character' | 'org-member'

interface CharacterFormProps {
  character?: Character | null
  onSubmit: (data: Partial<Character>) => void
  onSubmitOrgMember?: (orgId: string, data: { name: string; title?: string; description?: string; imageUrl?: string; imageCrop?: CropSettings }) => void
  onCancel: () => void
  onDelete?: () => void
  organisations?: Organisation[]
  allowCharacterTypeSelection?: boolean
  campaignId?: string
  onAddToOrg?: (characterId: string, orgId: string) => Promise<void>
  onRemoveFromOrg?: (characterId: string, orgId: string) => Promise<void>
}

export default function CharacterForm({ 
  character, 
  onSubmit, 
  onSubmitOrgMember, 
  onCancel, 
  onDelete, 
  organisations = [], 
  allowCharacterTypeSelection = false,
  campaignId,
  onAddToOrg,
  onRemoveFromOrg,
}: CharacterFormProps) {
  const [characterType, setCharacterType] = useState<CharacterType>('character')
  const [selectedOrgId, setSelectedOrgId] = useState<string>(organisations[0]?.id || '')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [orgUpdateLoading, setOrgUpdateLoading] = useState(false)
  const [showImageCropper, setShowImageCropper] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Track current memberships for editing
  const [currentMemberships, setCurrentMemberships] = useState<{ id: string; name: string }[]>(
    character?.organisations || []
  )
  
  const [formData, setFormData] = useState({
    name: character?.name || '',
    title: character?.title || '',
    description: character?.description || '',
    imageUrl: character?.imageUrl || '',
    imageCrop: character?.imageCrop || null as CropSettings | null,
    faction: character?.faction || '',
    location: character?.location || '',
    status: character?.status || 'alive',
    tags: character?.tags || '',
    campaignId: character?.campaignId || campaignId || '',
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

      setFormData(prev => ({ ...prev, imageUrl: data.url, imageCrop: null }))
      // Open cropper after upload
      setShowImageCropper(true)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageCropChange = (settings: CropSettings) => {
    setFormData(prev => ({ ...prev, imageCrop: settings }))
    setShowImageCropper(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (characterType === 'org-member' && onSubmitOrgMember && selectedOrgId) {
      onSubmitOrgMember(selectedOrgId, {
        name: formData.name,
        title: formData.title || undefined,
        description: formData.description || undefined,
        imageUrl: formData.imageUrl || undefined,
        imageCrop: formData.imageCrop || undefined,
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

  const isOrgMember = characterType === 'org-member'

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200]" onClick={onCancel}>
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-4">
          {character ? 'Edit Character' : 'Create New Character'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Character Type Selection - only for new characters */}
          {!character && allowCharacterTypeSelection && organisations.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Add to Organisation?
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCharacterType('character')}
                  className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                    characterType === 'character'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  🎭 Independent
                </button>
                <button
                  type="button"
                  onClick={() => setCharacterType('org-member')}
                  className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                    characterType === 'org-member'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  🏛️ Org Member
                </button>
              </div>
            </div>
          )}

          {/* Organisation Selection - only for org members */}
          {isOrgMember && organisations.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Add to Organisation *
              </label>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {organisations.map(org => (
                  <option key={org.id} value={org.id}>
                    🏛️ {org.name}
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
              {formData.imageUrl && (
                <div className="flex items-start gap-3">
                  <div 
                    className={`relative rounded-lg overflow-hidden bg-gray-900 cursor-pointer group ${
                      formData.imageCrop?.aspectRatio === 'portrait' ? 'w-20 aspect-[3/4]' :
                      formData.imageCrop?.aspectRatio === 'landscape' ? 'w-32 aspect-[4/3]' :
                      'w-24 aspect-square'
                    }`}
                    onClick={() => setShowImageCropper(true)}
                    title="Click to adjust"
                  >
                    <img 
                      src={formData.imageUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      style={formData.imageCrop ? {
                        transform: `scale(${formData.imageCrop.zoom}) translate(${formData.imageCrop.offsetX / formData.imageCrop.zoom}%, ${formData.imageCrop.offsetY / formData.imageCrop.zoom}%)`,
                        transformOrigin: 'center',
                      } : undefined}
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs">✏️ Edit</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => setShowImageCropper(true)}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, imageUrl: '', imageCrop: null }))}
                      className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                    >
                      × Remove
                    </button>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => {
                    handleChange(e)
                    // Reset crop when URL changes manually
                    setFormData(prev => ({ ...prev, imageCrop: null }))
                  }}
                  placeholder="Enter image URL or upload"
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 disabled:opacity-50"
                >
                  {isUploading ? '...' : '📤'}
                </button>
              </div>
              {uploadError && (
                <p className="text-red-400 text-sm">{uploadError}</p>
              )}
            </div>
          </div>

          {/* Only show these fields for regular characters, not org members */}
          {!isOrgMember && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Faction
                </label>
                <input
                  type="text"
                  name="faction"
                  value={formData.faction}
                  onChange={handleChange}
                  placeholder="e.g., The Crown"
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
                  placeholder="e.g., Capital City"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                  {CHARACTER_STATUSES.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="Comma-separated tags"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {/* Organisation membership - for editing existing characters */}
          {character && organisations.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Organisation Membership
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Characters can belong to one organisation maximum
              </p>
              <div className="space-y-2">
                {currentMemberships.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {currentMemberships.map(org => (
                      <span key={org.id} className="inline-flex items-center bg-purple-600/30 text-purple-300 px-2 py-1 rounded">
                        🏛️ {org.name}
                        {onRemoveFromOrg && (
                          <button
                            type="button"
                            onClick={async () => {
                              setOrgUpdateLoading(true)
                              try {
                                await onRemoveFromOrg(character.id, org.id)
                                setCurrentMemberships(prev => prev.filter(o => o.id !== org.id))
                              } catch (error) {
                                console.error('Failed to remove from org:', error)
                              }
                              setOrgUpdateLoading(false)
                            }}
                            disabled={orgUpdateLoading}
                            className="ml-2 text-purple-400 hover:text-red-400 disabled:opacity-50"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Not a member of any organisation</p>
                )}
                
                {/* Add to organisation dropdown - only show if character has no org (limit 1) */}
                {onAddToOrg && currentMemberships.length === 0 && (
                  <div className="flex gap-2 mt-2">
                    <select
                      value={selectedOrgId}
                      onChange={(e) => setSelectedOrgId(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select organisation...</option>
                      {organisations
                        .filter(org => !currentMemberships.some(m => m.id === org.id))
                        .map(org => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!selectedOrgId) return
                        setOrgUpdateLoading(true)
                        try {
                          await onAddToOrg(character.id, selectedOrgId)
                          const addedOrg = organisations.find(o => o.id === selectedOrgId)
                          if (addedOrg) {
                            setCurrentMemberships(prev => [...prev, { id: addedOrg.id, name: addedOrg.name }])
                          }
                          setSelectedOrgId('')
                        } catch (error) {
                          console.error('Failed to add to org:', error)
                        }
                        setOrgUpdateLoading(false)
                      }}
                      disabled={orgUpdateLoading || !selectedOrgId}
                      className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 text-sm"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            {onDelete && character && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {character ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Image Cropper Modal */}
      {showImageCropper && formData.imageUrl && (
        <ImageCropper
          imageUrl={formData.imageUrl}
          onChange={handleImageCropChange}
          onCancel={() => setShowImageCropper(false)}
          initialCropSettings={formData.imageCrop || undefined}
        />
      )}    </div>
  )
}