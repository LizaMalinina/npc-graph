'use client'

import React, { useMemo } from 'react'
import { CharacterWebData, CharacterWebViewMode, CharacterWebNode } from '@/types'
import { CharacterWebGraph } from './CharacterWebGraph'
import './CharacterWeb.css'

interface CharacterWebProps {
  data: CharacterWebData
  viewMode: CharacterWebViewMode
  onViewModeChange: (mode: CharacterWebViewMode) => void
  selectedEntityIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  onApplyFilter?: (ids: string[]) => void
}

export function CharacterWeb({
  data,
  viewMode,
  onViewModeChange,
  selectedEntityIds = [],
  onSelectionChange,
  onApplyFilter,
}: CharacterWebProps) {
  // Find the selected entity for bio panel
  const selectedEntity = useMemo(() => {
    if (selectedEntityIds.length === 1) {
      return data.nodes.find(n => n.id === selectedEntityIds[0])
    }
    return null
  }, [selectedEntityIds, data.nodes])

  const isMultiSelect = selectedEntityIds.length > 1

  const handleClosePanel = () => {
    onSelectionChange?.([])
  }

  const handleApplyFilter = () => {
    onApplyFilter?.(selectedEntityIds)
  }

  return (
    <div className="character-web" data-testid="character-web-container">
      {/* View Mode Selector */}
      <div className="character-web-toolbar">
        <div className="view-mode-selector">
          <button
            className={`view-mode-btn ${viewMode === 'characters' ? 'active' : ''}`}
            onClick={() => onViewModeChange('characters')}
          >
            👤 Characters
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'organisations' ? 'active' : ''}`}
            onClick={() => onViewModeChange('organisations')}
          >
            🏛️ Orgs
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => onViewModeChange('all')}
          >
            🌐 All
          </button>
        </div>

        {/* Apply Button for Multi-Select */}
        {isMultiSelect && (
          <button
            className="apply-filter-btn highlighted"
            onClick={handleApplyFilter}
          >
            Apply Filter ({selectedEntityIds.length})
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="character-web-content">
        {/* Graph Container */}
        <div className="character-web-graph">
          {data.nodes.length === 0 ? (
            <div className="empty-state">
              <p>No characters or organisations to display.</p>
              <p>Add some entities to see the web.</p>
            </div>
          ) : (
            <CharacterWebGraph
              data={data}
              onNodeSelect={(nodeIds) => onSelectionChange?.(nodeIds)}
              selectedNodeIds={selectedEntityIds}
            />
          )}
        </div>

        {/* Bio Panel for Single Selection */}
        {selectedEntity && !isMultiSelect && (
          <div className="bio-panel" data-testid="bio-panel">
            <div className="bio-panel-header">
              <h2>{selectedEntity.name}</h2>
              <button 
                className="bio-panel-close" 
                onClick={handleClosePanel}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="bio-panel-content">
              {selectedEntity.entityType === 'character' ? (
                <CharacterBio entity={selectedEntity} />
              ) : (
                <OrganisationBio entity={selectedEntity} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface CharacterBioProps {
  entity: CharacterWebNode
}

function CharacterBio({ entity }: CharacterBioProps) {
  return (
    <div className="character-bio">
      {entity.title && (
        <div className="bio-field">
          <span className="bio-label">Title:</span>
          <span className="bio-value">{entity.title}</span>
        </div>
      )}
      {entity.faction && (
        <div className="bio-field">
          <span className="bio-label">Faction:</span>
          <span className="bio-value">{entity.faction}</span>
        </div>
      )}
      {entity.location && (
        <div className="bio-field">
          <span className="bio-label">Location:</span>
          <span className="bio-value">{entity.location}</span>
        </div>
      )}
      {entity.status && (
        <div className="bio-field">
          <span className="bio-label">Status:</span>
          <span className={`bio-value status-${entity.status}`}>{entity.status}</span>
        </div>
      )}
      {entity.description && (
        <div className="bio-field bio-description">
          <span className="bio-label">Description:</span>
          <p className="bio-value whitespace-pre-wrap">{entity.description}</p>
        </div>
      )}
    </div>
  )
}

interface OrganisationBioProps {
  entity: CharacterWebNode
}

function OrganisationBio({ entity }: OrganisationBioProps) {
  return (
    <div className="organisation-bio">
      <div className="bio-field entity-type">
        <span className="entity-badge organisation">Organisation</span>
      </div>
      {entity.description && (
        <div className="bio-field bio-description">
          <span className="bio-label">Description:</span>
          <p className="bio-value whitespace-pre-wrap">{entity.description}</p>
        </div>
      )}
    </div>
  )
}

export default CharacterWeb
