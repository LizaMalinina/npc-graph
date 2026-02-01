'use client'

import { useMemo } from 'react'
import { GraphData, FilterState, RELATIONSHIP_TYPES, CHARACTER_STATUSES } from '@/types'

interface DetectiveFilterPanelProps {
  graphData: GraphData
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onCreateCharacter?: () => void
  onCreateOrganisation?: () => void
  isMobile?: boolean
}

export default function DetectiveFilterPanel({
  graphData,
  filters,
  onFiltersChange,
  onCreateCharacter,
  onCreateOrganisation,
  isMobile = false,
}: DetectiveFilterPanelProps) {
  // Extract unique factions and locations
  const { factions, locations } = useMemo(() => {
    const factionSet = new Set<string>()
    const locationSet = new Set<string>()

    graphData.nodes.forEach(node => {
      if (node.faction) factionSet.add(node.faction)
      if (node.location) locationSet.add(node.location)
    })

    return {
      factions: Array.from(factionSet).sort(),
      locations: Array.from(locationSet).sort(),
    }
  }, [graphData.nodes])

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
      viewMode: 'collapsed',
      showOrganisationsOnly: false,
      showCharactersOnly: false,
    })
  }

  const hasActiveFilters =
    filters.searchQuery ||
    filters.factions.length > 0 ||
    filters.locations.length > 0 ||
    filters.statuses.length > 0 ||
    filters.relationshipTypes.length > 0

  return (
    <div className={`${isMobile ? 'mobile-compact' : 'w-64 bg-[#1a2f27] border-r border-[#3d5a4e] p-4 overflow-y-auto'}`}>
      {/* Create Buttons - only show on desktop */}
      {!isMobile && (onCreateCharacter || onCreateOrganisation) && (
        <div className="mb-4 flex flex-col gap-2">
          {onCreateCharacter && (
            <button
              onClick={onCreateCharacter}
              className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              + Character
            </button>
          )}
          {onCreateOrganisation && (
            <button
              onClick={onCreateOrganisation}
              className="w-full px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
            >
              + Organisation
            </button>
          )}
        </div>
      )}

      {/* Search */}
      <div className={isMobile ? 'mb-2' : 'mb-4'}>
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Search..."
            value={filters.searchQuery}
            onChange={e => handleSearchChange(e.target.value)}
            className={`w-full pl-8 pr-3 ${isMobile ? 'py-1.5 text-xs' : 'py-2 text-sm'} bg-[#2d4a3e] border border-[#3d5a4e] rounded text-white placeholder-gray-400 focus:outline-none focus:border-[#b8860b]`}
          />
        </div>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button 
          onClick={clearFilters} 
          className={`w-full ${isMobile ? 'mb-2' : 'mb-4'} px-3 py-1 bg-red-600/20 text-red-400 rounded text-xs hover:bg-red-600/30`}
        >
          ✕ Clear All Filters
        </button>
      )}

      {/* Filter sections container - horizontal on mobile */}
      <div className={isMobile ? 'flex flex-wrap gap-3' : ''}>
        {/* Status Filter */}
        <div className={isMobile ? 'flex-shrink-0' : 'mb-4'}>
          <h4 className="text-xs font-bold text-[#b8860b] mb-1">📋 Status</h4>
          <div className="flex flex-wrap gap-1">
            {CHARACTER_STATUSES.map(status => (
              <button
                key={status}
                onClick={() => toggleFilter('statuses', status)}
                className={`px-2 py-1 text-xs rounded ${
                  filters.statuses.includes(status) 
                    ? status === 'alive' ? 'bg-green-600 text-white' 
                      : status === 'dead' ? 'bg-red-600 text-white' 
                      : 'bg-gray-600 text-white'
                    : 'bg-[#2d4a3e] text-gray-300'
                }`}
              >
                {status === 'alive' ? '🟢' : status === 'dead' ? '💀' : '❓'} {status}
              </button>
            ))}
          </div>
        </div>

        {/* Faction Filter */}
        {factions.length > 0 && (
          <div className={isMobile ? 'flex-shrink-0' : 'mb-4'}>
            <h4 className="text-xs font-bold text-[#b8860b] mb-1">🏴 Factions</h4>
            <div className="flex flex-wrap gap-1">
              {factions.map(faction => (
                <button
                  key={faction}
                  onClick={() => toggleFilter('factions', faction)}
                  className={`px-2 py-1 text-xs rounded ${
                    filters.factions.includes(faction) 
                      ? 'bg-[#b8860b] text-white' 
                      : 'bg-[#2d4a3e] text-gray-300'
                  }`}
                >
                  {faction}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Location Filter */}
        {locations.length > 0 && (
          <div className={isMobile ? 'flex-shrink-0' : 'mb-4'}>
            <h4 className="text-xs font-bold text-[#b8860b] mb-1">📍 Locations</h4>
            <div className="flex flex-wrap gap-1">
              {locations.map(location => (
                <button
                  key={location}
                  onClick={() => toggleFilter('locations', location)}
                  className={`px-2 py-1 text-xs rounded ${
                    filters.locations.includes(location) 
                      ? 'bg-[#b8860b] text-white' 
                      : 'bg-[#2d4a3e] text-gray-300'
                  }`}
                >
                  {location}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Relationship Type Filter */}
        <div className={isMobile ? 'flex-shrink-0' : 'mb-4'}>
          <h4 className="text-xs font-bold text-[#b8860b] mb-1">🧵 Connection Types</h4>
          <div className="flex flex-wrap gap-1">
            {RELATIONSHIP_TYPES.map(type => (
              <button
                key={type}
                onClick={() => toggleFilter('relationshipTypes', type)}
                className={`px-2 py-1 text-xs rounded ${
                  filters.relationshipTypes.includes(type) 
                    ? 'bg-[#b8860b] text-white' 
                    : 'bg-[#2d4a3e] text-gray-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
