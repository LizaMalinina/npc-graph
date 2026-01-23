'use client'

import { useState, useEffect } from 'react'
import { GraphData, FilterState } from '@/types'

interface FilterPanelProps {
  data: GraphData
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
}

export default function FilterPanel({ data, filters, onFiltersChange }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  // Extract unique values from data
  const factions = [...new Set(data.nodes.map(n => n.faction).filter(Boolean))] as string[]
  const locations = [...new Set(data.nodes.map(n => n.location).filter(Boolean))] as string[]
  const statuses = [...new Set(data.nodes.map(n => n.status))]
  const relationshipTypes = [...new Set(data.links.map(l => l.type))]

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, searchQuery: e.target.value })
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
      crewViewMode: 'all',
      showCrewMembersOnly: false,
      showNpcsOnly: false,
    })
  }

  const hasActiveFilters =
    filters.factions.length > 0 ||
    filters.locations.length > 0 ||
    filters.statuses.length > 0 ||
    filters.relationshipTypes.length > 0 ||
    filters.searchQuery !== ''

  return (
    <div className="bg-gray-800 rounded-lg p-4 text-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Filters</h2>
        <div className="flex gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              value={filters.searchQuery}
              onChange={handleSearchChange}
              placeholder="Search NPCs..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Factions */}
          {factions.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Factions</label>
              <div className="flex flex-wrap gap-2">
                {factions.map(faction => (
                  <button
                    key={faction}
                    onClick={() => toggleFilter('factions', faction)}
                    className={`px-2 py-1 text-xs rounded ${
                      filters.factions.includes(faction)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {faction}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Locations */}
          {locations.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Locations</label>
              <div className="flex flex-wrap gap-2">
                {locations.map(location => (
                  <button
                    key={location}
                    onClick={() => toggleFilter('locations', location)}
                    className={`px-2 py-1 text-xs rounded ${
                      filters.locations.includes(location)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {location}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {statuses.map(status => (
                <button
                  key={status}
                  onClick={() => toggleFilter('statuses', status)}
                  className={`px-2 py-1 text-xs rounded ${
                    filters.statuses.includes(status)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Relationship Types */}
          {relationshipTypes.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Relationship Types</label>
              <div className="flex flex-wrap gap-2">
                {relationshipTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => toggleFilter('relationshipTypes', type)}
                    className={`px-2 py-1 text-xs rounded ${
                      filters.relationshipTypes.includes(type)
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
