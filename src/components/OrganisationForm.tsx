'use client'

import { useState, useRef, useMemo } from 'react'
import { Organisation, CropSettings } from '@/types'
import ImageCropper from '@/components/ImageCropper'

// Available pin colors for organisations
export const PIN_COLORS = [
  { value: '#fbbf24', label: 'Gold' },
  { value: '#ef4444', label: 'Red' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#22c55e', label: 'Green' },
  { value: '#a855f7', label: 'Purple' },
  { value: '#f97316', label: 'Orange' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#f43f5e', label: 'Rose' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#84cc16', label: 'Lime' },
]

// Helper to validate hex color
function isValidHexColor(color: string): boolean {
  return /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(color)
}

// Generate a random hex color that's not in the used set
function generateRandomColor(usedColors: Set<string | undefined>): { value: string; label: string } {
  const hue = Math.floor(Math.random() * 360)
  const saturation = 65 + Math.floor(Math.random() * 25) // 65-90%
  const lightness = 45 + Math.floor(Math.random() * 15) // 45-60%
  
  // Convert HSL to hex
  const h = hue / 360
  const s = saturation / 100
  const l = lightness / 100
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }
  
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const r = Math.round(hue2rgb(p, q, h + 1/3) * 255)
  const g = Math.round(hue2rgb(p, q, h) * 255)
  const b = Math.round(hue2rgb(p, q, h - 1/3) * 255)
  
  const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  
  // Check if this color is too similar to used colors (simple check)
  if (usedColors.has(hex.toLowerCase())) {
    return generateRandomColor(usedColors) // Try again
  }
  
  return { value: hex, label: 'Custom' }
}

interface OrganisationFormProps {
  organisation?: Organisation | null
  onSubmit: (data: Partial<Organisation>) => void
  onCancel: () => void
  onDelete?: () => void
  campaignId?: string
  existingOrganisations?: Organisation[]
}

export default function OrganisationForm({ 
  organisation, 
  onSubmit, 
  onCancel, 
  onDelete,
  campaignId,
  existingOrganisations = [],
}: OrganisationFormProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showImageCropper, setShowImageCropper] = useState(false)
  const [customHex, setCustomHex] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Get colors already used by other organisations (excluding current one being edited)
  const usedColors = useMemo(() => new Set(
    existingOrganisations
      .filter(org => org.id !== organisation?.id && org.pinColor)
      .map(org => org.pinColor?.toLowerCase())
  ), [existingOrganisations, organisation?.id])
  
  // Filter available colors to only show unused ones, ensuring at least 5 options
  const MIN_COLOR_OPTIONS = 5
  const availableColors = useMemo(() => {
    const unusedPresets = PIN_COLORS.filter(
      color => !usedColors.has(color.value.toLowerCase())
    )
    
    // If we have at least 5 unused presets, use them
    if (unusedPresets.length >= MIN_COLOR_OPTIONS) {
      return unusedPresets
    }
    
    // Otherwise, generate random colors to fill up to 5
    const result = [...unusedPresets]
    const allUsedColors = new Set([
      ...usedColors,
      ...PIN_COLORS.map(c => c.value.toLowerCase())
    ])
    
    while (result.length < MIN_COLOR_OPTIONS) {
      const randomColor = generateRandomColor(allUsedColors)
      allUsedColors.add(randomColor.value.toLowerCase())
      result.push(randomColor)
    }
    
    return result
  }, [usedColors])
  
  const [formData, setFormData] = useState({
    name: organisation?.name || '',
    description: organisation?.description || '',
    imageUrl: organisation?.imageUrl || '',
    imageCrop: organisation?.imageCrop || null as CropSettings | null,
    pinColor: organisation?.pinColor || '#fbbf24', // Default gold
    campaignId: organisation?.campaignId || campaignId || '',
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
    onSubmit({
      ...formData,
      imageCrop: formData.imageCrop || undefined,
      pinColor: formData.pinColor,
    })
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200]" onClick={onCancel}>
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-4">
          {organisation ? 'Edit Organisation' : 'Create New Organisation'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="e.g., The Thieves Guild"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              placeholder="Describe the organisation..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  onChange={handleChange}
                  placeholder="Enter image URL or upload"
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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

          {/* Pin Color Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pin Color <span className="text-gray-500">(for members too)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {availableColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, pinColor: color.value }))
                    setCustomHex('')
                  }}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.pinColor?.toLowerCase() === color.value.toLowerCase()
                      ? 'border-white scale-110 ring-2 ring-white/50'
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
            
            {/* Custom hex input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customHex}
                onChange={(e) => {
                  const value = e.target.value
                  setCustomHex(value)
                  if (isValidHexColor(value)) {
                    setFormData(prev => ({ ...prev, pinColor: value }))
                  }
                }}
                placeholder="#ff0000"
                className="w-24 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {/* Color preview */}
              <div
                className={`w-8 h-8 rounded-full border-2 ${
                  isValidHexColor(customHex) ? 'border-white' : 'border-gray-600'
                }`}
                style={{ 
                  backgroundColor: isValidHexColor(customHex) ? customHex : formData.pinColor || '#9ca3af'
                }}
              />
              {customHex && !isValidHexColor(customHex) && (
                <span className="text-red-400 text-xs">Invalid hex</span>
              )}
              {isValidHexColor(customHex) && (
                <span className="text-green-400 text-xs">✓</span>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            {onDelete && organisation && (
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
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              {organisation ? 'Save' : 'Create'}
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
      )}
    </div>
  )
}
