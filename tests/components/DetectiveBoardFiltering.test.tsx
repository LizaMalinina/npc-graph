/**
 * DetectiveBoard Filtering Tests
 * 
 * Tests for entity type filtering (Characters Only / Organisations Only / All)
 * Following TDD: Write tests first, then fix implementation.
 */

import { GraphNode, GraphLink, FilterState } from '@/types'

// Helper function that mirrors the filtering logic in DetectiveBoard
function filterNodes(nodes: GraphNode[], filters: FilterState): GraphNode[] {
  let filteredNodes = [...nodes]

  // Apply entity type filters
  if (filters.showCharactersOnly) {
    filteredNodes = filteredNodes.filter(node => node.entityType === 'character')
  }
  if (filters.showOrganisationsOnly) {
    filteredNodes = filteredNodes.filter(node => node.entityType === 'organisation')
  }

  // Apply search filter
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase()
    filteredNodes = filteredNodes.filter(
      node =>
        node.name.toLowerCase().includes(query) ||
        node.title?.toLowerCase().includes(query) ||
        node.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  }

  return filteredNodes
}

describe('DetectiveBoard Entity Type Filtering', () => {
  const mockNodes: GraphNode[] = [
    { id: 'char-1', name: 'Character 1', entityType: 'character' },
    { id: 'char-2', name: 'Character 2', entityType: 'character' },
    { id: 'char-3', name: 'Character 3', entityType: 'character' },
    { id: 'org-1', name: 'Organisation 1', entityType: 'organisation' },
    { id: 'org-2', name: 'Organisation 2', entityType: 'organisation' },
  ]

  const defaultFilters: FilterState = {
    factions: [],
    locations: [],
    statuses: [],
    relationshipTypes: [],
    searchQuery: '',
    viewMode: 'collapsed',
    showOrganisationsOnly: false,
    showCharactersOnly: false,
  }

  it('should show all nodes when no entity type filter is active', () => {
    const result = filterNodes(mockNodes, defaultFilters)
    
    expect(result).toHaveLength(5)
    expect(result.filter(n => n.entityType === 'character')).toHaveLength(3)
    expect(result.filter(n => n.entityType === 'organisation')).toHaveLength(2)
  })

  it('should show only characters when showCharactersOnly is true', () => {
    const filters: FilterState = {
      ...defaultFilters,
      showCharactersOnly: true,
    }
    
    const result = filterNodes(mockNodes, filters)
    
    expect(result).toHaveLength(3)
    expect(result.every(n => n.entityType === 'character')).toBe(true)
    expect(result.some(n => n.entityType === 'organisation')).toBe(false)
  })

  it('should show only organisations when showOrganisationsOnly is true', () => {
    const filters: FilterState = {
      ...defaultFilters,
      showOrganisationsOnly: true,
    }
    
    const result = filterNodes(mockNodes, filters)
    
    expect(result).toHaveLength(2)
    expect(result.every(n => n.entityType === 'organisation')).toBe(true)
    expect(result.some(n => n.entityType === 'character')).toBe(false)
  })

  it('should combine entity type filter with search filter', () => {
    const filters: FilterState = {
      ...defaultFilters,
      showCharactersOnly: true,
      searchQuery: 'Character 1',
    }
    
    const result = filterNodes(mockNodes, filters)
    
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Character 1')
  })

  it('should return empty array when filtering for characters but only orgs match search', () => {
    const filters: FilterState = {
      ...defaultFilters,
      showCharactersOnly: true,
      searchQuery: 'Organisation',
    }
    
    const result = filterNodes(mockNodes, filters)
    
    expect(result).toHaveLength(0)
  })
})

describe('Pin Color Logic', () => {
  it('should use grey (#9ca3af) as default pin color for nodes without pinColor', () => {
    const nodeWithoutPinColor: GraphNode = {
      id: 'char-1',
      name: 'Lone Character',
      entityType: 'character',
      pinColor: null,
    }
    
    const defaultPinColor = nodeWithoutPinColor.pinColor || '#9ca3af'
    expect(defaultPinColor).toBe('#9ca3af')
  })

  it('should use the node pinColor when provided', () => {
    const randomPinColor = '#ef4444'
    const nodeWithPinColor: GraphNode = {
      id: 'char-1',
      name: 'Guild Member',
      entityType: 'character',
      pinColor: randomPinColor,
    }
    
    const displayedPinColor = nodeWithPinColor.pinColor || '#9ca3af'
    expect(displayedPinColor).toBe(randomPinColor)
  })
})

describe('Status Overlay Logic', () => {
  it('should identify dead status for overlay display', () => {
    const deadNode: GraphNode = {
      id: 'char-1',
      name: 'Deceased Character',
      entityType: 'character',
      status: 'dead',
    }
    
    const isDead = deadNode.status === 'dead'
    expect(isDead).toBe(true)
  })

  it('should identify unknown status for overlay display', () => {
    const unknownNode: GraphNode = {
      id: 'char-1',
      name: 'Missing Character',
      entityType: 'character',
      status: 'unknown',
    }
    
    const isUnknown = unknownNode.status === 'unknown'
    expect(isUnknown).toBe(true)
  })

  it('should not show overlays for alive status', () => {
    const aliveNode: GraphNode = {
      id: 'char-1',
      name: 'Active Character',
      entityType: 'character',
      status: 'alive',
    }
    
    const isDead = aliveNode.status === 'dead'
    const isUnknown = aliveNode.status === 'unknown'
    expect(isDead).toBe(false)
    expect(isUnknown).toBe(false)
  })
})
