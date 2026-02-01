'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CharacterWeb } from './CharacterWeb'
import { CharacterWebData, CharacterWebViewMode } from '@/types'
import './CharacterWebPage.css'

interface CharacterWebPageProps {
  campaignId: string
}

export function CharacterWebPage({ campaignId }: CharacterWebPageProps) {
  const [viewMode, setViewMode] = useState<CharacterWebViewMode>('all')
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([])
  const [filteredEntityIds, setFilteredEntityIds] = useState<string[]>([])

  // Build query params
  const queryParams = new URLSearchParams()
  queryParams.set('viewMode', viewMode)
  if (filteredEntityIds.length > 0) {
    queryParams.set('selectedEntityIds', filteredEntityIds.join(','))
  }

  // Fetch character web data
  const { data, isLoading, error } = useQuery<CharacterWebData>({
    queryKey: ['character-web', campaignId, viewMode, filteredEntityIds],
    queryFn: async () => {
      const response = await fetch(
        `/api/campaigns/${campaignId}/character-web?${queryParams.toString()}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch character web data')
      }
      return response.json()
    },
  })

  const handleViewModeChange = (mode: CharacterWebViewMode) => {
    setViewMode(mode)
  }

  const handleSelectionChange = (ids: string[]) => {
    setSelectedEntityIds(ids)
  }

  const handleApplyFilter = (ids: string[]) => {
    setFilteredEntityIds(ids)
    setSelectedEntityIds([])
  }

  if (isLoading) {
    return (
      <div className="character-web-page loading" data-testid="loading-indicator">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Character Web...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="character-web-page error" data-testid="error-message">
        <div className="error-content">
          <h2>Error Loading Data</h2>
          <p>{error instanceof Error ? error.message : 'An error occurred'}</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="character-web-page">
      {filteredEntityIds.length > 0 && (
        <div className="filter-indicator">
          <span>Showing {filteredEntityIds.length} selected entities</span>
          <button onClick={() => setFilteredEntityIds([])}>
            Clear Filter
          </button>
        </div>
      )}
      <CharacterWeb
        data={data || { nodes: [], links: [] }}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        selectedEntityIds={selectedEntityIds}
        onSelectionChange={handleSelectionChange}
        onApplyFilter={handleApplyFilter}
      />
    </div>
  )
}

export default CharacterWebPage
