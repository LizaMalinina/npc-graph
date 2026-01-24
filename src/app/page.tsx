'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCampaigns, useCreateCampaign } from '@/hooks/useApi'

export default function Home() {
  const router = useRouter()
  const { data: campaigns, isLoading } = useCampaigns()
  const createCampaign = useCreateCampaign()
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [newCampaignName, setNewCampaignName] = useState('')
  const [newCampaignDescription, setNewCampaignDescription] = useState('')
  const [crewName, setCrewName] = useState('The Party')

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCampaignName.trim()) return

    try {
      const campaign = await createCampaign.mutateAsync({
        name: newCampaignName,
        description: newCampaignDescription || undefined,
        crewName: crewName || 'The Party',
      })
      router.push(`/campaign/${campaign.id}`)
    } catch (error) {
      console.error('Failed to create campaign:', error)
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
          <button
            key={campaign.id}
            onClick={() => router.push(`/campaign/${campaign.id}`)}
            className="campaign-card"
          >
            <div className="campaign-card-icon">📜</div>
            <h2>{campaign.name}</h2>
            {campaign.description && <p>{campaign.description}</p>}
            <div className="campaign-meta">
              <span>👥 {campaign.crew?.name || 'No crew'}</span>
              <span>🎭 {campaign._count?.npcs || 0} NPCs</span>
            </div>
          </button>
        ))}

        <button
          onClick={() => setShowNewCampaign(true)}
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
              <div className="form-group">
                <label htmlFor="campaignName">Campaign Name *</label>
                <input
                  id="campaignName"
                  type="text"
                  value={newCampaignName}
                  onChange={e => setNewCampaignName(e.target.value)}
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
                  value={crewName}
                  onChange={e => setCrewName(e.target.value)}
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
    </div>
  )
}
