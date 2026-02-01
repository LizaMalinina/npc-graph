'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCampaigns, useCreateCampaign, useDeleteCampaign, useUpdateCampaign } from '@/hooks/useApi'
import { Campaign, CropSettings } from '@/types'
import ImageCropper from '@/components/ImageCropper'

export default function Home() {
  const router = useRouter()
  const { data: campaigns, isLoading } = useCampaigns()
  const createCampaign = useCreateCampaign()
  const deleteCampaign = useDeleteCampaign()
  const updateCampaign = useUpdateCampaign()
  
  // Create modal state
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [newCampaignName, setNewCampaignName] = useState('')
  const [newCampaignDescription, setNewCampaignDescription] = useState('')
  const [newCampaignImage, setNewCampaignImage] = useState<File | null>(null)
  const [newCampaignImagePreview, setNewCampaignImagePreview] = useState<string | null>(null)
  const [newCampaignImageCrop, setNewCampaignImageCrop] = useState<CropSettings | null>(null)
  const [showCreateCropper, setShowCreateCropper] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [isUploadingCreate, setIsUploadingCreate] = useState(false)
  
  // Edit modal state
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editImageUrl, setEditImageUrl] = useState('')
  const [editImageCrop, setEditImageCrop] = useState<CropSettings | null>(null)
  const [showEditCropper, setShowEditCropper] = useState(false)
  const [editImage, setEditImage] = useState<File | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const [isUploadingEdit, setIsUploadingEdit] = useState(false)

  const handleImageChange = (file: File | null, setImage: (f: File | null) => void, setPreview: (s: string | null) => void) => {
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setImage(null)
      setPreview(null)
    }
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!response.ok) {
        console.error('Upload failed:', await response.text())
        return null
      }
      const data = await response.json()
      return data.url
    } catch (error) {
      console.error('Upload error:', error)
      return null
    }
  }

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCampaignName.trim()) return
    
    // Check for duplicate name
    const existingCampaign = campaigns?.find(
      c => c.name.toLowerCase() === newCampaignName.trim().toLowerCase()
    )
    if (existingCampaign) {
      setCreateError('A campaign with this name already exists. Please choose a different name.')
      return
    }

    try {
      setCreateError(null)
      setIsUploadingCreate(true)
      
      let imageUrl: string | undefined
      if (newCampaignImage) {
        const url = await uploadImage(newCampaignImage)
        if (url) imageUrl = url
        // Continue even if upload fails - campaign will be created without image
      }
      
      const campaign = await createCampaign.mutateAsync({
        name: newCampaignName.trim(),
        description: newCampaignDescription || undefined,
        imageUrl,
        imageCrop: newCampaignImageCrop || undefined,
      })
      setShowNewCampaign(false)
      setNewCampaignName('')
      setNewCampaignDescription('')
      setNewCampaignImage(null)
      setNewCampaignImagePreview(null)
      setNewCampaignImageCrop(null)
      router.push(`/campaign/${campaign.slug || campaign.id}`)
    } catch (error) {
      console.error('Failed to create campaign:', error)
      setCreateError('Failed to create campaign. Please try again.')
    } finally {
      setIsUploadingCreate(false)
    }
  }

  const openEditModal = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setEditName(campaign.name)
    setEditDescription(campaign.description || '')
    setEditImageUrl(campaign.imageUrl || '')
    setEditImageCrop(campaign.imageCrop || null)
  }

  const closeEditModal = () => {
    setEditingCampaign(null)
    setEditName('')
    setEditDescription('')
    setEditImageUrl('')
    setEditImage(null)
    setEditImagePreview(null)
    setEditImageCrop(null)
    setShowEditCropper(false)
  }

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCampaign || !editName.trim()) return

    try {
      setIsUploadingEdit(true)
      
      // Determine the imageUrl to send
      let imageUrl: string | null | undefined
      if (editImage) {
        // New image uploaded
        const url = await uploadImage(editImage)
        imageUrl = url || undefined
      } else if (editImageUrl === '' && editingCampaign.imageUrl) {
        // Image was cleared (had one before, now empty)
        imageUrl = null
      } else if (editImageUrl) {
        // Keep existing image
        imageUrl = editImageUrl
      }
      // If imageUrl is undefined, don't update the field
      
      // Update campaign
      await updateCampaign.mutateAsync({
        id: editingCampaign.id,
        name: editName.trim(),
        description: editDescription || undefined,
        imageUrl,
        imageCrop: editImageCrop || undefined,
      })
      
      closeEditModal()
    } catch (error) {
      console.error('Failed to update campaign:', error)
      alert('Failed to update campaign. Please try again.')
    } finally {
      setIsUploadingEdit(false)
    }
  }

  const handleDeleteCampaign = async () => {
    if (!editingCampaign) return
    
    if (!confirm(`Are you sure you want to delete "${editingCampaign.name}"?\n\nThis will permanently delete all characters, organisations, relationships, and data associated with this campaign. This action cannot be undone.`)) {
      return
    }
    
    try {
      await deleteCampaign.mutateAsync(editingCampaign.id)
      closeEditModal()
    } catch (error) {
      console.error('Failed to delete campaign:', error)
      alert('Failed to delete campaign. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="campaign-loading">
        <div className="loading-content">
          <div className="loading-icon">🎲</div>
          <p>Loading campaigns...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="campaign-select-page">
      <div className="campaign-header">
        <h1>� Character Web</h1>
        <p>Select a campaign or create a new one</p>
      </div>

      <div className="campaign-grid">
        {campaigns?.map(campaign => (
          <div key={campaign.id} className="campaign-card-wrapper">
            <div
              onClick={() => router.push(`/campaign/${campaign.slug}`)}
              className="campaign-card"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && router.push(`/campaign/${campaign.slug}`)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  openEditModal(campaign)
                }}
                className="campaign-edit-btn"
                title="Edit campaign"
              >
                ✏️
              </button>
              <div className="campaign-card-icon">
                {campaign.imageUrl ? (
                  <img 
                    src={campaign.imageUrl} 
                    alt="" 
                    className="campaign-icon-img"
                    style={campaign.imageCrop ? {
                      transform: `scale(${campaign.imageCrop.zoom}) translate(${campaign.imageCrop.offsetX}%, ${campaign.imageCrop.offsetY}%)`
                    } : undefined}
                  />
                ) : '📜'}
              </div>
              <h2>{campaign.name}</h2>
              {campaign.description && <p>{campaign.description}</p>}
              <div className="campaign-meta">
                <span>👤 {campaign._count?.characters || 0} Characters</span>
                <span>🏛️ {campaign._count?.organisations || 0} Orgs</span>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={() => {
            setCreateError(null)
            setShowNewCampaign(true)
          }}
          className="campaign-card new-campaign"
        >
          <div className="campaign-card-icon">➕</div>
          <h2>New Campaign</h2>
          <p>Start a new adventure</p>
        </button>
      </div>

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <div className="modal-overlay" onClick={() => setShowNewCampaign(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>🗺️ Create New Campaign</h2>
            <form onSubmit={handleCreateCampaign}>
              {createError && (
                <div className="form-error">{createError}</div>
              )}
              
              <div className="form-group">
                <label htmlFor="campaignName">Campaign Name *</label>
                <input
                  id="campaignName"
                  type="text"
                  value={newCampaignName}
                  onChange={e => {
                    setNewCampaignName(e.target.value)
                    setCreateError(null)
                  }}
                  placeholder="e.g., Curse of Strahd"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="campaignDescription">Description</label>
                <textarea
                  id="campaignDescription"
                  value={newCampaignDescription}
                  onChange={e => setNewCampaignDescription(e.target.value)}
                  placeholder="A brief description of your campaign..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="campaignImage">Campaign Icon</label>
                <div className="image-upload-area">
                  {newCampaignImagePreview ? (
                    <div className="image-preview">
                      <img 
                        src={newCampaignImagePreview} 
                        alt="Preview"
                        style={newCampaignImageCrop ? {
                          transform: `scale(${newCampaignImageCrop.zoom}) translate(${newCampaignImageCrop.offsetX}%, ${newCampaignImageCrop.offsetY}%)`
                        } : undefined}
                      />
                      <div className="image-preview-buttons">
                        <button
                          type="button"
                          onClick={() => setShowCreateCropper(true)}
                          className="adjust-image-btn"
                          title="Adjust image"
                        >
                          ✂️
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleImageChange(null, setNewCampaignImage, setNewCampaignImagePreview)
                            setNewCampaignImageCrop(null)
                          }}
                          className="remove-image-btn"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="upload-label">
                      <span>📷 Click to upload image</span>
                      <input
                        id="campaignImage"
                        type="file"
                        accept="image/*"
                        onChange={e => handleImageChange(e.target.files?.[0] || null, setNewCampaignImage, setNewCampaignImagePreview)}
                        hidden
                      />
                    </label>
                  )}
                </div>
                <small>Optional: Upload an image for the campaign card</small>
              </div>

              {showCreateCropper && newCampaignImagePreview && (
                <ImageCropper
                  imageUrl={newCampaignImagePreview}
                  initialCropSettings={newCampaignImageCrop || undefined}
                  onChange={(crop) => {
                    setNewCampaignImageCrop(crop)
                    setShowCreateCropper(false)
                  }}
                  onCancel={() => setShowCreateCropper(false)}
                />
              )}

              <div className="form-actions">
                <button type="button" onClick={() => setShowNewCampaign(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={createCampaign.isPending || isUploadingCreate} className="btn-primary">
                  {isUploadingCreate ? 'Uploading...' : createCampaign.isPending ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Campaign Modal */}
      {editingCampaign && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>⚙️ Edit Campaign</h2>
            <form onSubmit={handleUpdateCampaign}>
              <div className="form-group">
                <label htmlFor="editName">Campaign Name *</label>
                <input
                  id="editName"
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Campaign name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="editDescription">Description</label>
                <textarea
                  id="editDescription"
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  placeholder="A brief description of your campaign..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="editImageUpload">Campaign Icon</label>
                <div className="image-upload-area">
                  {(editImagePreview || editImageUrl) ? (
                    <div className="image-preview">
                      <img 
                        src={editImagePreview || editImageUrl} 
                        alt="Preview"
                        style={editImageCrop ? {
                          transform: `scale(${editImageCrop.zoom}) translate(${editImageCrop.offsetX}%, ${editImageCrop.offsetY}%)`
                        } : undefined}
                      />
                      <div className="image-preview-buttons">
                        <button
                          type="button"
                          onClick={() => setShowEditCropper(true)}
                          className="adjust-image-btn"
                          title="Adjust image"
                        >
                          ✂️
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditImage(null)
                            setEditImagePreview(null)
                            setEditImageUrl('')
                            setEditImageCrop(null)
                          }}
                          className="remove-image-btn"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="upload-label">
                      <span>📷 Click to upload image</span>
                      <input
                        id="editImageUpload"
                        type="file"
                        accept="image/*"
                        onChange={e => handleImageChange(e.target.files?.[0] || null, setEditImage, setEditImagePreview)}
                        hidden
                      />
                    </label>
                  )}
                </div>
                <small>Optional: Upload an image for the campaign card</small>
              </div>

              {showEditCropper && (editImagePreview || editImageUrl) && (
                <ImageCropper
                  imageUrl={editImagePreview || editImageUrl}
                  initialCropSettings={editImageCrop || undefined}
                  onChange={(crop) => {
                    setEditImageCrop(crop)
                    setShowEditCropper(false)
                  }}
                  onCancel={() => setShowEditCropper(false)}
                />
              )}

              <div className="form-actions campaign-edit-actions">
                <div className="form-actions-row">
                  <button type="button" onClick={closeEditModal} className="btn-secondary">
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={updateCampaign.isPending || isUploadingEdit} 
                    className="btn-primary"
                  >
                    {isUploadingEdit ? 'Uploading...' : updateCampaign.isPending ? 'Saving...' : 'Save'}
                  </button>
                </div>
                <button 
                  type="button" 
                  onClick={handleDeleteCampaign} 
                  className="btn-danger btn-full-width"
                  disabled={deleteCampaign.isPending}
                >
                  {deleteCampaign.isPending ? 'Deleting...' : '🗑️ Delete Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
