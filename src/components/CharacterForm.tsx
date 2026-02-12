'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { Character, Organisation, CHARACTER_STATUSES, CropSettings } from '@/types'
import ImageCropper from '@/components/ImageCropper'

interface CharacterFormProps {
  character?: Character | null
  onSubmit: (data: Partial<Character> & { organisationId?: string }) => void
  onCancel: () => void
  onDelete?: () => void
  organisations?: Organisation[]
  campaignId?: string
}

export default function CharacterForm({ 
  character, 
  onSubmit, 
  onCancel, 
  onDelete, 
  organisations = [], 
  campaignId,
}: CharacterFormProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showImageCropper, setShowImageCropper] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Get first organisation if character has any memberships
  const initialOrgId = character?.organisations?.[0]?.id || ''
  const [selectedOrgId, setSelectedOrgId] = useState<string>(initialOrgId)
  const [orgSearchQuery, setOrgSearchQuery] = useState('')
  const [showOrgDropdown, setShowOrgDropdown] = useState(false)
  const orgDropdownRef = useRef<HTMLDivElement>(null)
  
  // Sort organisations alphabetically and filter by search
  const filteredOrganisations = useMemo(() => {
    const sorted = [...organisations].sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    )
    if (!orgSearchQuery.trim()) return sorted
    const query = orgSearchQuery.toLowerCase()
    return sorted.filter(org => org.name.toLowerCase().includes(query))
  }, [organisations, orgSearchQuery])
  
  // Get the selected organisation name for display
  const selectedOrgName = useMemo(() => {
    if (!selectedOrgId) return 'None'
    const org = organisations.find(o => o.id === selectedOrgId)
    return org?.name || 'None'
  }, [selectedOrgId, organisations])
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(event.target as Node)) {
        setShowOrgDropdown(false)
        setOrgSearchQuery('')
      }
    }
    
    if (showOrgDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showOrgDropdown])
  
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
    console.log('handleFileUpload called', e.target.files)
    const file = e.target.files?.[0]
    if (!file) {
      console.log('No file selected')
      return
    }
    
    console.log('Uploading file:', file.name, file.type, file.size)

    setIsUploading(true)
    setUploadError(null)

    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      console.log('Sending POST to /api/upload')
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setFormData(prev => ({ ...prev, imageUrl: data.url, imageCrop: null }))
      // Open cropper after upload
      setShowImageCropper(true)
    } catch (error) {
      console.error('Upload error:', error)
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
    
    // Submit with optional organisation
    onSubmit({
      ...formData,
      ...(selectedOrgId ? { organisationId: selectedOrgId } : {}),
    })
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200]" onClick={onCancel}>
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-4">
          {character ? 'Edit Character' : 'Create New Character'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="char-name" className="block text-sm font-medium text-gray-300 mb-1">
              Name *
            </label>
            <input
              id="char-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Title */}
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

          {/* Organisation - searchable dropdown */}
          {organisations.length > 0 && (
            <div ref={orgDropdownRef} className="relative">
              <label htmlFor="char-organisation" className="block text-sm font-medium text-gray-300 mb-1">
                Organisation
              </label>
              <button
                type="button"
                id="char-organisation"
                onClick={() => setShowOrgDropdown(!showOrgDropdown)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-left flex items-center justify-between"
              >
                <span>{selectedOrgName}</span>
                <span className="text-gray-400">{showOrgDropdown ? '▲' : '▼'}</span>
              </button>
              
              {showOrgDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-hidden">
                  {/* Search input */}
                  <div className="p-2 border-b border-gray-600">
                    <input
                      type="text"
                      placeholder="Search organisations..."
                      value={orgSearchQuery}
                      onChange={(e) => setOrgSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-500 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  
                  {/* Options list */}
                  <div className="max-h-44 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrgId('')
                        setShowOrgDropdown(false)
                        setOrgSearchQuery('')
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-600 ${
                        selectedOrgId === '' ? 'bg-purple-600 text-white' : 'text-gray-300'
                      }`}
                    >
                      None
                    </button>
                    {filteredOrganisations.map(org => (
                      <button
                        type="button"
                        key={org.id}
                        onClick={() => {
                          setSelectedOrgId(org.id)
                          setShowOrgDropdown(false)
                          setOrgSearchQuery('')
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-600 ${
                          selectedOrgId === org.id ? 'bg-purple-600 text-white' : 'text-gray-300'
                        }`}
                      >
                        {org.name}
                      </button>
                    ))}
                    {filteredOrganisations.length === 0 && orgSearchQuery && (
                      <div className="px-3 py-2 text-gray-400 text-sm italic">
                        No organisations found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description */}
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
                <div className="flex items-center gap-2 p-2 bg-gray-700/50 rounded-lg">
                  <div 
                    className="relative w-12 aspect-[3/4] rounded overflow-hidden bg-gray-900 cursor-pointer group flex-shrink-0"
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
                  </div>
                  <span className="text-xs text-gray-400 flex-1 truncate">Image set</span>
                  <button
                    type="button"
                    onClick={() => setShowImageCropper(true)}
                    className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    ✏️ Crop
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: '', imageCrop: null }))}
                    className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-red-600"
                  >
                    🗑️
                  </button>
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

          {/* Faction */}
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