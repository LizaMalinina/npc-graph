/**
 * Character Web Graph Data Tests
 * 
 * These tests define the specification for graph visualization data
 * in the Character Web, supporting three views:
 * - Characters: Shows only characters and their relationships
 * - Orgs: Shows only organisations and their relationships
 * - All: Shows all entities and all relationships
 */

import { 
  CharacterWebNode, 
  CharacterWebLink, 
  CharacterWebData, 
  CharacterWebViewMode,
  CharacterWebFilterState 
} from '@/types'

describe('CharacterWebNode', () => {
  it('should represent a Character node', () => {
    const randomId = `char-${Math.random().toString(36).substring(7)}`
    const randomName = `Character ${Math.floor(Math.random() * 1000)}`
    const randomX = Math.random() * 500
    const randomY = Math.random() * 500

    const node: CharacterWebNode = {
      id: randomId,
      name: randomName,
      entityType: 'character',
      x: randomX,
      y: randomY,
    }

    expect(node.id).toBe(randomId)
    expect(node.name).toBe(randomName)
    expect(node.entityType).toBe('character')
    expect(node.x).toBe(randomX)
    expect(node.y).toBe(randomY)
  })

  it('should represent an Organisation node', () => {
    const randomId = `org-${Math.random().toString(36).substring(7)}`
    const randomName = `Organisation ${Math.floor(Math.random() * 1000)}`

    const node: CharacterWebNode = {
      id: randomId,
      name: randomName,
      entityType: 'organisation',
    }

    expect(node.id).toBe(randomId)
    expect(node.entityType).toBe('organisation')
  })

  it('should support optional descriptive properties', () => {
    const randomTitle = `Title ${Math.floor(Math.random() * 100)}`
    const randomFaction = `Faction ${Math.floor(Math.random() * 10)}`

    const node: CharacterWebNode = {
      id: 'test-id',
      name: 'Test',
      entityType: 'character',
      title: randomTitle,
      description: 'A description',
      imageUrl: 'https://example.com/image.jpg',
      faction: randomFaction,
      location: 'Some Location',
      status: 'alive',
      tags: ['tag1', 'tag2'],
    }

    expect(node.title).toBe(randomTitle)
    expect(node.faction).toBe(randomFaction)
    expect(node.tags).toContain('tag1')
  })

  it('should support optional pinColor for visual identification', () => {
    const pinColors = ['#fbbf24', '#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ec4899', '#06b6d4']
    const randomPinColor = pinColors[Math.floor(Math.random() * pinColors.length)]

    const characterNode: CharacterWebNode = {
      id: 'char-1',
      name: 'Test Character',
      entityType: 'character',
      pinColor: randomPinColor,
    }

    const organisationNode: CharacterWebNode = {
      id: 'org-1',
      name: 'Test Organisation',
      entityType: 'organisation',
      pinColor: '#3b82f6',
    }

    expect(characterNode.pinColor).toBe(randomPinColor)
    expect(organisationNode.pinColor).toBe('#3b82f6')
  })

  it('should allow pinColor to be null or undefined', () => {
    const nodeWithNull: CharacterWebNode = {
      id: 'test-id',
      name: 'Test',
      entityType: 'character',
      pinColor: null,
    }

    const nodeWithoutPinColor: CharacterWebNode = {
      id: 'test-id-2',
      name: 'Test 2',
      entityType: 'organisation',
    }

    expect(nodeWithNull.pinColor).toBeNull()
    expect(nodeWithoutPinColor.pinColor).toBeUndefined()
  })
})

describe('CharacterWebLink', () => {
  it('should connect two entities with relationship metadata', () => {
    const randomStrength = Math.floor(Math.random() * 10) + 1

    const link: CharacterWebLink = {
      id: 'link-1',
      source: 'entity-1',
      sourceType: 'character',
      target: 'entity-2',
      targetType: 'character',
      type: 'friend',
      strength: randomStrength,
    }

    expect(link.source).toBe('entity-1')
    expect(link.target).toBe('entity-2')
    expect(link.type).toBe('friend')
    expect(link.strength).toBe(randomStrength)
  })

  it('should support cross-entity-type relationships', () => {
    const link: CharacterWebLink = {
      id: 'link-2',
      source: 'char-1',
      sourceType: 'character',
      target: 'org-1',
      targetType: 'organisation',
      type: 'member',
      strength: 8,
    }

    expect(link.sourceType).toBe('character')
    expect(link.targetType).toBe('organisation')
  })
})

describe('CharacterWebData', () => {
  it('should contain nodes and links for the graph', () => {
    const nodeCount = Math.floor(Math.random() * 5) + 2
    const nodes: CharacterWebNode[] = Array.from({ length: nodeCount }, (_, i) => ({
      id: `node-${i}`,
      name: `Node ${i}`,
      entityType: i % 2 === 0 ? 'character' as const : 'organisation' as const,
    }))

    const linkCount = Math.floor(Math.random() * 3) + 1
    const links: CharacterWebLink[] = Array.from({ length: linkCount }, (_, i) => ({
      id: `link-${i}`,
      source: nodes[0].id,
      sourceType: nodes[0].entityType,
      target: nodes[1].id,
      targetType: nodes[1].entityType,
      type: 'ally',
      strength: 5,
    }))

    const data: CharacterWebData = {
      nodes,
      links,
    }

    expect(data.nodes).toHaveLength(nodeCount)
    expect(data.links).toHaveLength(linkCount)
  })
})

describe('CharacterWebViewMode', () => {
  it('should support three view modes: characters, organisations, all', () => {
    const charactersView: CharacterWebViewMode = 'characters'
    const orgsView: CharacterWebViewMode = 'organisations'
    const allView: CharacterWebViewMode = 'all'

    expect(charactersView).toBe('characters')
    expect(orgsView).toBe('organisations')
    expect(allView).toBe('all')
  })
})

describe('CharacterWebFilterState', () => {
  it('should track the current view mode', () => {
    const filterState: CharacterWebFilterState = {
      viewMode: 'all',
      selectedEntityIds: [],
      searchQuery: '',
    }

    expect(filterState.viewMode).toBe('all')
  })

  it('should track selected entities for multi-select filtering', () => {
    const selectedCount = Math.floor(Math.random() * 5) + 1
    const selectedIds = Array.from({ length: selectedCount }, (_, i) => `entity-${i}`)

    const filterState: CharacterWebFilterState = {
      viewMode: 'all',
      selectedEntityIds: selectedIds,
      searchQuery: '',
    }

    expect(filterState.selectedEntityIds).toHaveLength(selectedCount)
  })

  it('should support filtering by factions, locations, and statuses', () => {
    const filterState: CharacterWebFilterState = {
      viewMode: 'characters',
      selectedEntityIds: [],
      searchQuery: 'test',
      factions: ['Faction A', 'Faction B'],
      locations: ['Location X'],
      statuses: ['alive'],
      relationshipTypes: ['friend', 'ally'],
    }

    expect(filterState.factions).toContain('Faction A')
    expect(filterState.locations).toContain('Location X')
    expect(filterState.statuses).toContain('alive')
    expect(filterState.relationshipTypes).toContain('friend')
  })
})
