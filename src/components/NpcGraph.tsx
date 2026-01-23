'use client'

// Force recompile - version 2
import { useEffect, useRef, useMemo, useCallback, useState } from 'react'
import { GraphData, GraphNode, GraphLink, FilterState, RELATIONSHIP_COLORS } from '@/types'

interface NpcGraphProps {
  data: GraphData
  filters: FilterState
  onNodeClick: (node: GraphNode) => void
  onLinkClick: (link: GraphLink) => void
  canEdit: boolean
}

// Faction colors for node borders
const FACTION_COLORS: Record<string, string> = {
  'Mages Guild': '#8b5cf6',      // Purple
  'Shadow Network': '#1f2937',   // Dark gray
  'Craftsmen Guild': '#f59e0b',  // Amber
  'House Valdris': '#ec4899',    // Pink
  'Bloodfang Clan': '#dc2626',   // Red
  'Temple of Light': '#fbbf24',  // Yellow/Gold
  'City Guard': '#3b82f6',       // Blue
}

// Get faction border color
function getFactionColor(faction: string | null | undefined): string {
  if (!faction) return '#6b7280' // Default gray for no faction
  return FACTION_COLORS[faction] || '#6b7280'
}

// Node opacity based on status (for dead/unknown NPCs)
function getNodeOpacity(status: string): number {
  switch (status) {
    case 'dead':
      return 0.5
    case 'unknown':
      return 0.7
    default:
      return 1
  }
}

// Generate a placeholder avatar URL based on name
function getPlaceholderAvatar(name: string): string {
  // Using DiceBear API for placeholder avatars - generates unique avatars based on seed
  const seed = encodeURIComponent(name)
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=1e293b`
}

export default function NpcGraph({
  data,
  filters,
  onNodeClick,
  onLinkClick,
}: NpcGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef = useRef<any>(null)
  const nodesDataRef = useRef<Map<string, GraphNode>>(new Map())
  const edgesDataRef = useRef<Map<string, GraphLink>>(new Map())
  const fullNodesRef = useRef<any[]>([])
  const fullEdgesRef = useRef<any[]>([])
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null)
  
  // Store callbacks in refs to avoid network reinitialization
  const onNodeClickRef = useRef(onNodeClick)
  const onLinkClickRef = useRef(onLinkClick)
  onNodeClickRef.current = onNodeClick
  onLinkClickRef.current = onLinkClick

  // Filter and transform graph data
  const { visNodes, visEdges } = useMemo(() => {
    // Filter nodes
    let filteredNodes = [...data.nodes]

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

    // Apply faction filter
    if (filters.factions.length > 0) {
      filteredNodes = filteredNodes.filter(
        node => node.faction && filters.factions.includes(node.faction)
      )
    }

    // Apply location filter
    if (filters.locations.length > 0) {
      filteredNodes = filteredNodes.filter(
        node => node.location && filters.locations.includes(node.location)
      )
    }

    // Apply status filter
    if (filters.statuses.length > 0) {
      filteredNodes = filteredNodes.filter(node =>
        node.status && filters.statuses.includes(node.status)
      )
    }

    // Get visible node IDs
    const nodeIds = new Set(filteredNodes.map(n => n.id))

    // Filter links
    let filteredLinks = data.links.filter(link => {
      const sourceId = typeof link.source === 'object' ? (link.source as { id: string }).id : link.source
      const targetId = typeof link.target === 'object' ? (link.target as { id: string }).id : link.target
      return nodeIds.has(sourceId) && nodeIds.has(targetId)
    })

    // Apply relationship type filter
    if (filters.relationshipTypes.length > 0) {
      filteredLinks = filteredLinks.filter(link =>
        filters.relationshipTypes.includes(link.type)
      )
    }

    // Store original data for click handlers
    const nodesMap = new Map<string, GraphNode>()
    const edgesMap = new Map<string, GraphLink>()

    // Transform to vis-network format
    const visNodes = filteredNodes.map(node => {
      nodesMap.set(node.id, node)
      const imageUrl = node.imageUrl || getPlaceholderAvatar(node.name)
      const factionColor = getFactionColor(node.faction)
      const opacity = getNodeOpacity(node.status || 'alive')
      return {
        id: node.id,
        label: node.name,
        shape: 'circularImage',
        image: imageUrl,
        size: 25,
        borderWidth: 4,
        opacity: opacity,
        color: {
          border: factionColor,
          highlight: { border: '#ffffff' },
        },
        font: { color: '#ffffff', size: 14 },
      }
    })

    const visEdges = filteredLinks.map(link => {
      const sourceId = typeof link.source === 'object' ? (link.source as { id: string }).id : link.source
      const targetId = typeof link.target === 'object' ? (link.target as { id: string }).id : link.target
      edgesMap.set(link.id, link)
      return {
        id: link.id,
        from: sourceId,
        to: targetId,
        label: link.type,
        color: { color: RELATIONSHIP_COLORS[link.type] || '#94a3b8', highlight: '#cbd5e1' },
        font: { color: '#94a3b8', size: 12, strokeWidth: 0 },
        arrows: { to: { enabled: true, scaleFactor: 0.5 } },
      }
    })

    nodesDataRef.current = nodesMap
    edgesDataRef.current = edgesMap
    fullNodesRef.current = visNodes
    fullEdgesRef.current = visEdges

    return { visNodes, visEdges }
  }, [data, filters])

  // Get connected nodes for a given node
  const getConnectedNodes = useCallback((nodeId: string, edges: any[]) => {
    const connectedIds = new Set<string>([nodeId])
    edges.forEach(edge => {
      if (edge.from === nodeId) {
        connectedIds.add(edge.to)
      } else if (edge.to === nodeId) {
        connectedIds.add(edge.from)
      }
    })
    return connectedIds
  }, [])

  // Focus on a node - hide unrelated nodes by changing their visibility
  const focusOnNode = useCallback((nodeId: string) => {
    if (!networkRef.current) return

    const connectedIds = getConnectedNodes(nodeId, fullEdgesRef.current)
    
    // Get the current body data from the network
    const body = networkRef.current.body
    
    // Update node visibility and labels
    Object.keys(body.nodes).forEach((id: string) => {
      const node = body.nodes[id]
      if (connectedIds.has(id)) {
        node.setOptions({ hidden: false, opacity: 1, font: { color: '#ffffff' } })
      } else {
        node.setOptions({ hidden: true, opacity: 0, font: { color: 'transparent' } })
      }
    })

    // Update edge visibility
    Object.keys(body.edges).forEach((id: string) => {
      const edge = body.edges[id]
      const fromId = edge.fromId
      const toId = edge.toId
      if (connectedIds.has(fromId) && connectedIds.has(toId)) {
        edge.setOptions({ hidden: false })
      } else {
        edge.setOptions({ hidden: true })
      }
    })

    networkRef.current.redraw()
    setFocusedNodeId(nodeId)
  }, [getConnectedNodes])

  // Restore all nodes
  const restoreAllNodes = useCallback(() => {
    if (!networkRef.current) return

    const body = networkRef.current.body

    // Show all nodes and restore labels
    Object.keys(body.nodes).forEach((id: string) => {
      const node = body.nodes[id]
      node.setOptions({ hidden: false, opacity: 1, font: { color: '#ffffff' } })
    })

    // Show all edges
    Object.keys(body.edges).forEach((id: string) => {
      const edge = body.edges[id]
      edge.setOptions({ hidden: false })
    })

    networkRef.current.redraw()
    setFocusedNodeId(null)
  }, [])

  // Handle node click
  const handleNodeClick = useCallback((nodeId: string) => {
    const node = nodesDataRef.current.get(nodeId)
    if (node) {
      onNodeClick(node)
    }
  }, [onNodeClick])

  // Handle edge click
  const handleEdgeClick = useCallback((edgeId: string) => {
    const edge = edgesDataRef.current.get(edgeId)
    if (edge) {
      onLinkClick(edge)
    }
  }, [onLinkClick])

  // Initialize vis-network
  useEffect(() => {
    if (!containerRef.current) return

    let network: any = null

    const initNetwork = async () => {
      const { Network } = await import('vis-network')
      const { DataSet } = await import('vis-data')

      const nodesDataSet = new DataSet(visNodes)
      const edgesDataSet = new DataSet(visEdges)

      const options = {
        nodes: {
          shape: 'circularImage',
          size: 25,
          borderWidth: 3,
          font: {
            color: '#ffffff',
            size: 14,
          },
          // Fallback for broken images
          brokenImage: 'https://api.dicebear.com/7.x/shapes/svg?seed=fallback&backgroundColor=1e293b',
        },
        edges: {
          width: 2,
          smooth: { enabled: true, type: 'continuous', roundness: 0.5 },
          selectionWidth: 0, // Don't change width on selection
          chosen: {
            edge: false, // Disable default selection styling for edges
          },
        },
        physics: {
          enabled: true,
          solver: 'barnesHut',
          barnesHut: {
            gravitationalConstant: -3000,
            centralGravity: 0.3,
            springLength: 150,
            springConstant: 0.04,
            damping: 0.09,
            avoidOverlap: 0.5,
          },
          stabilization: {
            iterations: 150,
            updateInterval: 25,
          },
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
        },
      }

      network = new Network(containerRef.current!, { nodes: nodesDataSet, edges: edgesDataSet }, options)
      networkRef.current = network

      // Event handlers - using selectNode event to avoid double-click issues
      network.on('selectNode', (params: any) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0]
          const node = nodesDataRef.current.get(nodeId)
          if (node) {
            onNodeClickRef.current(node)
          }
          // Focus on the selected node
          const connectedIds = getConnectedNodes(nodeId, fullEdgesRef.current)
          const body = networkRef.current.body
          
          Object.keys(body.nodes).forEach((id: string) => {
            const n = body.nodes[id]
            if (connectedIds.has(id)) {
              n.setOptions({ hidden: false, opacity: 1, font: { color: '#ffffff' } })
            } else {
              n.setOptions({ hidden: true, opacity: 0, font: { color: 'transparent' } })
            }
          })

          Object.keys(body.edges).forEach((id: string) => {
            const edge = body.edges[id]
            const fromId = edge.fromId
            const toId = edge.toId
            if (connectedIds.has(fromId) && connectedIds.has(toId)) {
              edge.setOptions({ hidden: false })
            } else {
              edge.setOptions({ hidden: true })
            }
          })

          networkRef.current.redraw()
        }
      })

      network.on('selectEdge', (params: any) => {
        if (params.edges.length > 0 && params.nodes.length === 0) {
          const edge = edgesDataRef.current.get(params.edges[0])
          if (edge) {
            onLinkClickRef.current(edge)
          }
        }
      })

      network.on('deselectNode', () => {
        // Restore all nodes when deselected
        const body = networkRef.current.body
        Object.keys(body.nodes).forEach((id: string) => {
          const n = body.nodes[id]
          n.setOptions({ hidden: false, opacity: 1, font: { color: '#ffffff' } })
        })
        Object.keys(body.edges).forEach((id: string) => {
          const edge = body.edges[id]
          edge.setOptions({ hidden: false })
        })
        networkRef.current.redraw()
      })
    }

    initNetwork()

    return () => {
      if (network) {
        network.destroy()
      }
    }
  }, [getConnectedNodes])

  // Update network data when filters change
  useEffect(() => {
    const updateNetwork = async () => {
      if (!networkRef.current) return

      const { DataSet } = await import('vis-data')
      const nodesDataSet = new DataSet(visNodes)
      const edgesDataSet = new DataSet(visEdges)

      networkRef.current.setData({ nodes: nodesDataSet, edges: edgesDataSet })
      setFocusedNodeId(null) // Reset focus when filters change
    }

    updateNetwork()
  }, [visNodes, visEdges])

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full bg-gray-900 rounded-lg"
      style={{ minHeight: '400px' }}
    />
  )
}
