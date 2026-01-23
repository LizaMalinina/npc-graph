'use client'

import { useMemo } from 'react'
import { GraphData, FilterState, RELATIONSHIP_TYPES, NPC_STATUSES } from '@/types'

interface DetectiveFilterPanelProps {
  data: GraphData
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
}

export default function DetectiveFilterPanel({
  data,
  filters,
  onFiltersChange,
}: DetectiveFilterPanelProps) {
  // Extract unique factions and locations
  const { factions, locations } = useMemo(() => {
    const factionSet = new Set<string>()
    const locationSet = new Set<string>()

    data.nodes.forEach(node => {
      if (node.faction) factionSet.add(node.faction)
      if (node.location) locationSet.add(node.location)
    })

    return {
      factions: Array.from(factionSet).sort(),
      locations: Array.from(locationSet).sort(),
    }
  }, [data.nodes])

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, searchQuery: value })
  }

  const toggleFilter = (
    category: 'factions' | 'locations' | 'statuses' | 'relationshipTypes',
    value: string
  ) => {
    const current = filters[category]
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    onFiltersChange({ ...filters, [category]: updated })
  }

  const clearFilters = () => {
    onFiltersChange({
      factions: [],
      locations: [],
      statuses: [],
      relationshipTypes: [],
      searchQuery: '',
    })
  }

  const hasActiveFilters =
    filters.searchQuery ||
    filters.factions.length > 0 ||
    filters.locations.length > 0 ||
    filters.statuses.length > 0 ||
    filters.relationshipTypes.length > 0

  return (
    <div className="detective-filters">
      {/* Search */}
      <div className="filter-section">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search characters..."
            value={filters.searchQuery}
            onChange={e => handleSearchChange(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button onClick={clearFilters} className="clear-filters-btn">
          ✕ Clear All Filters
        </button>
      )}

      {/* Status Filter */}
      <div className="filter-section">
        <h4 className="filter-title">📋 Status</h4>
        <div className="filter-tags">
          {NPC_STATUSES.map(status => (
            <button
              key={status}
              onClick={() => toggleFilter('statuses', status)}
              className={`filter-tag ${filters.statuses.includes(status) ? 'active' : ''} status-${status}`}
            >
              {status === 'alive' ? '🟢' : status === 'dead' ? '💀' : '❓'} {status}
            </button>
          ))}
        </div>
      </div>

      {/* Faction Filter */}
      {factions.length > 0 && (
        <div className="filter-section">
          <h4 className="filter-title">🏴 Factions</h4>
          <div className="filter-tags">
            {factions.map(faction => (
              <button
                key={faction}
                onClick={() => toggleFilter('factions', faction)}
                className={`filter-tag ${filters.factions.includes(faction) ? 'active' : ''}`}
              >
                {faction}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Location Filter */}
      {locations.length > 0 && (
        <div className="filter-section">
          <h4 className="filter-title">📍 Locations</h4>
          <div className="filter-tags">
            {locations.map(location => (
              <button
                key={location}
                onClick={() => toggleFilter('locations', location)}
                className={`filter-tag ${filters.locations.includes(location) ? 'active' : ''}`}
              >
                {location}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Relationship Type Filter */}
      <div className="filter-section">
        <h4 className="filter-title">🧵 Connection Types</h4>
        <div className="filter-tags">
          {RELATIONSHIP_TYPES.map(type => (
            <button
              key={type}
              onClick={() => toggleFilter('relationshipTypes', type)}
              className={`filter-tag ${filters.relationshipTypes.includes(type) ? 'active' : ''}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
