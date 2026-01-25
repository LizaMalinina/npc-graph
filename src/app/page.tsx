'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCampaigns, useCreateCampaign, useDeleteCampaign, useUpdateCampaign, useUpdateCrew } from '@/hooks/useApi'
import { Campaign } from '@/types'

export default function Home() {
  const router = useRouter()
  const { data: campaigns, isLoading } = useCampaigns()
  const createCampaign = useCreateCampaign()
  const deleteCampaign = useDeleteCampaign()
  const updateCampaign = useUpdateCampaign()
  const updateCrew = useUpdateCrew()
  
  // Create modal state
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [newCampaignName, setNewCampaignName] = useState('')
  const [newCampaignDescription, setNewCampaignDescription] = useState('')
  const [newCrewName, setNewCrewName] = useState('The Party')
  const [createError, setCreateError] = useState<string | null>(null)
  
  // Edit modal state
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCrewName, setEditCrewName] = useState('')
  const [editImageUrl, setEditImageUrl] = useState('')

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
      const campaign = await createCampaign.mutateAsync({
        name: newCampaignName.trim(),
        description: newCampaignDescription || undefined,
        crewName: newCrewName || 'The Party',
      })
      setShowNewCampaign(false)
      setNewCampaignName('')
      setNewCampaignDescription('')
      setNewCrewName('The Party')
      router.push(`/campaign/${campaign.id}`)
    } catch (error) {
      console.error('Failed to create campaign:', error)
      setCreateError('Failed to create campaign. Please try again.')
    }
  }

  const openEditModal = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setEditName(campaign.name)
    setEditDescription(campaign.description || '')
    setEditCrewName(campaign.crew?.name || '')
    setEditImageUrl(campaign.imageUrl || '')
  }

  const closeEditModal = () => {
    setEditingCampaign(null)
    setEditName('')
    setEditDescription('')
    setEditCrewName('')
    setEditImageUrl('')
  }

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCampaign || !editName.trim()) return

    try {
      // Update campaign
      await updateCampaign.mutateAsync({
        id: editingCampaign.id,
        name: editName.trim(),
        description: editDescription || undefined,
        imageUrl: editImageUrl || undefined,
      })
      
      // Update crew name if changed
      if (editingCampaign.crew && editCrewName.trim() && editCrewName !== editingCampaign.crew.name) {
        await updateCrew.mutateAsync({
          id: editingCampaign.crew.id,
          data: { name: editCrewName.trim() },
        })
      }
      
      closeEditModal()
    } catch (error) {
      console.error('Failed to update campaign:', error)
      alert('Failed to update campaign. Please try again.')
    }
  }

  const handleDeleteCampaign = async () => {
    if (!editingCampaign) return
    
    if (!confirm(`Are you sure you want to delete "${editingCampaign.name}"?\n\nThis will permanently delete all NPCs, relationships, and data associated with this campaign. This action cannot be undone.`)) {
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
        <h1>🎭 NPC Relationship Manager</h1>
        <p>Select a campaign or create a new one</p>
      </div>

      <div className="campaign-grid">
        {campaigns?.map(campaign => (
          <div key={campaign.id} className="campaign-card-wrapper">
            <button
              onClick={() => router.push(`/campaign/${campaign.id}`)}
              className="campaign-card"
            >
              <div className="campaign-card-icon">
                {campaign.imageUrl ? (
                  <img src={campaign.imageUrl} alt="" className="campaign-icon-img" />
                ) : '📜'}
              </div>
              <h2>{campaign.name}</h2>
              {campaign.description && <p>{campaign.description}</p>}
              <div className="campaign-meta">
                <span>👥 {campaign.crew?.name || 'No crew'} ({campaign.crew?._count?.members || 0})</span>
                <span>🎭 {campaign._count?.npcs || 0} NPCs</span>
              </div>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                openEditModal(campaign)
              }}
              className="campaign-edit-btn"
              title="Edit campaign"
            >
              ⚙️
            </button>
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
                <label htmlFor="crewName">Party/Crew Name</label>
                <input
                  id="crewName"
                  type="text"
                  value={newCrewName}
                  onChange={e => setNewCrewName(e.target.value)}
                  placeholder="e.g., The Iron Wolves"
                />
                <small>A crew will be automatically created for your party</small>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowNewCampaign(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={createCampaign.isPending} className="btn-primary">
                  {createCampaign.isPending ? 'Creating...' : 'Create Campaign'}
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
                <label htmlFor="editCrewName">Party/Crew Name</label>
                <input
                  id="editCrewName"
                  type="text"
                  value={editCrewName}
                  onChange={e => setEditCrewName(e.target.value)}
                  placeholder="e.g., The Iron Wolves"
                />
              </div>

              <div className="form-group">
                <label htmlFor="editImageUrl">Campaign Icon URL</label>
                <input
                  id="editImageUrl"
                  type="url"
                  value={editImageUrl}
                  onChange={e => setEditImageUrl(e.target.value)}
                  placeholder="https://example.com/image.png"
                />
                <small>Optional: URL to an image for the campaign card</small>
              </div>

              <div className="form-actions edit-actions">
                <button 
                  type="button" 
                  onClick={handleDeleteCampaign} 
                  className="btn-danger"
                  disabled={deleteCampaign.isPending}
                >
                  {deleteCampaign.isPending ? 'Deleting...' : '🗑️ Delete'}
                </button>
                <div className="form-actions-right">
                  <button type="button" onClick={closeEditModal} className="btn-secondary">
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={updateCampaign.isPending || updateCrew.isPending} 
                    className="btn-primary"
                  >
                    {updateCampaign.isPending || updateCrew.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
