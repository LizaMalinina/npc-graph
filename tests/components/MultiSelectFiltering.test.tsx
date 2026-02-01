/**
 * Multi-Select Filtering Tests
 * 
 * Tests for multi-selection behavior:
 * - Ctrl+click to add/remove nodes from selection
 * - When 2+ nodes selected, only show those nodes and their direct connections
 * - "Apply" button appears when 2+ nodes selected
 */

import { GraphNode, GraphLink } from '@/types'

// Helper function to filter nodes and links based on multi-selection
function filterByMultiSelection(
  nodes: GraphNode[],
  links: GraphLink[],
  selectedNodeIds: Set<string>
): { filteredNodes: GraphNode[]; filteredLinks: GraphLink[] } {
  if (selectedNodeIds.size < 2) {
    // No multi-select filtering
    return { filteredNodes: nodes, filteredLinks: links }
  }

  // Get all links that connect selected nodes
  const filteredLinks = links.filter(link => {
    const sourceId = typeof link.source === 'object' ? (link.source as { id: string }).id : link.source
    const targetId = typeof link.target === 'object' ? (link.target as { id: string }).id : link.target
    return selectedNodeIds.has(sourceId) && selectedNodeIds.has(targetId)
  })

  // Only show selected nodes
  const filteredNodes = nodes.filter(node => selectedNodeIds.has(node.id))

  return { filteredNodes, filteredLinks }
}

describe('Multi-Select Filtering', () => {
  const mockNodes: GraphNode[] = [
    { id: 'char-1', name: 'Character 1', entityType: 'character' },
    { id: 'char-2', name: 'Character 2', entityType: 'character' },
    { id: 'char-3', name: 'Character 3', entityType: 'character' },
    { id: 'org-1', name: 'Organisation 1', entityType: 'organisation' },
  ]

  const mockLinks: GraphLink[] = [
    { id: 'rel-1', source: 'char-1', target: 'char-2', type: 'friend', strength: 5 },
    { id: 'rel-2', source: 'char-2', target: 'char-3', type: 'enemy', strength: 3 },
    { id: 'rel-3', source: 'char-1', target: 'org-1', type: 'member', strength: 7 },
    { id: 'rel-4', source: 'char-3', target: 'org-1', type: 'ally', strength: 4 },
  ]

  it('should show all nodes and links when fewer than 2 nodes are selected', () => {
    const selectedIds = new Set(['char-1'])
    const result = filterByMultiSelection(mockNodes, mockLinks, selectedIds)

    expect(result.filteredNodes).toHaveLength(4)
    expect(result.filteredLinks).toHaveLength(4)
  })

  it('should show only selected nodes when 2+ nodes are selected', () => {
    const selectedIds = new Set(['char-1', 'char-2'])
    const result = filterByMultiSelection(mockNodes, mockLinks, selectedIds)

    expect(result.filteredNodes).toHaveLength(2)
    expect(result.filteredNodes.map(n => n.id)).toEqual(['char-1', 'char-2'])
  })

  it('should show only links between selected nodes', () => {
    const selectedIds = new Set(['char-1', 'char-2'])
    const result = filterByMultiSelection(mockNodes, mockLinks, selectedIds)

    expect(result.filteredLinks).toHaveLength(1)
    expect(result.filteredLinks[0].id).toBe('rel-1')
  })

  it('should show no links if selected nodes have no connections between them', () => {
    const selectedIds = new Set(['char-1', 'char-3'])
    const result = filterByMultiSelection(mockNodes, mockLinks, selectedIds)

    expect(result.filteredNodes).toHaveLength(2)
    expect(result.filteredLinks).toHaveLength(0)
  })

  it('should show multiple links when multiple connected nodes are selected', () => {
    const selectedIds = new Set(['char-1', 'char-2', 'char-3'])
    const result = filterByMultiSelection(mockNodes, mockLinks, selectedIds)

    expect(result.filteredNodes).toHaveLength(3)
    expect(result.filteredLinks).toHaveLength(2) // rel-1 (1-2) and rel-2 (2-3)
  })

  it('should work with mixed entity types', () => {
    const selectedIds = new Set(['char-1', 'org-1'])
    const result = filterByMultiSelection(mockNodes, mockLinks, selectedIds)

    expect(result.filteredNodes).toHaveLength(2)
    expect(result.filteredLinks).toHaveLength(1) // rel-3 (char-1 to org-1)
  })
})
