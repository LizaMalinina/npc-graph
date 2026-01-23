'use client'

import { useEffect, useRef, useMemo, useCallback, useState } from 'react'
import { GraphData, GraphNode, GraphLink, FilterState, RELATIONSHIP_COLORS } from '@/types'

interface DetectiveBoardProps {
  data: GraphData
  filters: FilterState
  onNodeClick: (node: GraphNode) => void
  onLinkClick: (link: GraphLink) => void
  canEdit: boolean
}

// Generate a placeholder avatar URL based on name
function getPlaceholderAvatar(name: string): string {
  const seed = encodeURIComponent(name)
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=3A5F4B`
}

// Get polaroid-style rotation for each node
function getRandomRotation(id: string): number {
  // Use id to generate consistent rotation
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
    hash |= 0
  }
  return (hash % 21) - 10 // -10 to 10 degrees
}

// Get pin color based on relationship to player group
function getPinColor(status: string): string {
  switch (status) {
    case 'dead':
      return '#dc2626' // red
    case 'unknown':
      return '#94a3b8' // slate
    default:
      return '#fbbf24' // yellow
  }
}

// Calculate string path between two points with a natural curve
function calculateStringPath(
  x1: number, y1: number, 
  x2: number, y2: number
): string {
  // Calculate control points for a slightly curved line (like string/yarn)
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2
  
  // Add sag for more natural look
  const sag = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) * 0.05
  const controlY = midY + sag
  
  return `M ${x1} ${y1} Q ${midX} ${controlY} ${x2} ${y2}`
}

export default function DetectiveBoard({
  data,
  filters,
  onNodeClick,
}: DetectiveBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map())
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 })
  const [draggingNode, setDraggingNode] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  // Filter nodes and links
  const { filteredNodes, filteredLinks } = useMemo(() => {
    let filteredNodes = [...data.nodes]

    // Note: Character type filtering (showCrewMembersOnly/showNpcsOnly) is now handled 
    // in DetectiveGraphPage data composition for better performance

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

    // Apply faction filter (only for nodes that have factions - NPCs)
    if (filters.factions.length > 0) {
      filteredNodes = filteredNodes.filter(
        node => !node.faction || filters.factions.includes(node.faction)
      )
    }

    // Apply location filter (only for nodes that have locations - NPCs)
    if (filters.locations.length > 0) {
      filteredNodes = filteredNodes.filter(
        node => !node.location || filters.locations.includes(node.location)
      )
    }

    // Apply status filter (only for nodes that have status - NPCs)
    if (filters.statuses.length > 0) {
      filteredNodes = filteredNodes.filter(node =>
        !node.status || filters.statuses.includes(node.status)
      )
    }

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

    return { filteredNodes, filteredLinks, nodeIds }
  }, [data, filters])

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Calculate initial positions in a circular layout with player group at center
  useEffect(() => {
    if (filteredNodes.length === 0) return

    const centerX = dimensions.width / 2
    const centerY = dimensions.height / 2
    const radius = Math.min(dimensions.width, dimensions.height) * 0.35

    // Find the "player group" node or use first node as center
    const playerGroupNode = filteredNodes.find(n => 
      n.name.toLowerCase().includes('player') || 
      n.name.toLowerCase().includes('group') ||
      n.name.toLowerCase().includes('party')
    )
    const centerNodeId = playerGroupNode?.id
    
    // Use functional update to avoid stale closure issues
    setPositions(prevPositions => {
      // Check if we have new nodes that don't have positions yet
      const nodesWithoutPositions = filteredNodes.filter(n => !prevPositions.has(n.id))
      
      // If all current nodes have positions, skip
      if (nodesWithoutPositions.length === 0) {
        return prevPositions
      }

      console.log('[DetectiveBoard] Calculating positions for', nodesWithoutPositions.length, 'new nodes')
      
      const newPositions = new Map<string, { x: number; y: number }>(prevPositions)
      
      // Only position nodes that don't have positions yet
      nodesWithoutPositions.forEach((node, index) => {
        // If this is the center node, put it in the center
        if (node.id === centerNodeId && !newPositions.has(centerNodeId)) {
          newPositions.set(centerNodeId, { x: centerX, y: centerY })
        } else if (!newPositions.has(node.id)) {
          // Place in a circle around center
          const totalNewNodes = nodesWithoutPositions.length
          const angle = (2 * Math.PI * index) / totalNewNodes - Math.PI / 2
          const x = centerX + radius * Math.cos(angle)
          const y = centerY + radius * Math.sin(angle)
          newPositions.set(node.id, { x, y })
        }
      })

      console.log('[DetectiveBoard] Updated positions, total:', newPositions.size)
      return newPositions
    })
  }, [filteredNodes, dimensions])

  // Mouse handlers for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault()
    const pos = positions.get(nodeId)
    if (pos) {
      setDraggingNode(nodeId)
      setDragOffset({
        x: e.clientX - pos.x,
        y: e.clientY - pos.y
      })
    }
  }, [positions])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingNode) {
      setPositions(prev => {
        const updated = new Map(prev)
        updated.set(draggingNode, {
          x: Math.max(60, Math.min(dimensions.width - 60, e.clientX - dragOffset.x)),
          y: Math.max(60, Math.min(dimensions.height - 60, e.clientY - dragOffset.y))
        })
        return updated
      })
    }
  }, [draggingNode, dragOffset, dimensions])

  const handleMouseUp = useCallback(() => {
    setDraggingNode(null)
  }, [])

  // Handle node click
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNodeId(node.id)
    onNodeClick(node)
  }, [onNodeClick])

  // Get connected nodes for highlighting
  const connectedNodes = useMemo(() => {
    if (!selectedNodeId) return new Set<string>()
    
    const connected = new Set<string>([selectedNodeId])
    filteredLinks.forEach(link => {
      const sourceId = typeof link.source === 'object' ? (link.source as { id: string }).id : link.source
      const targetId = typeof link.target === 'object' ? (link.target as { id: string }).id : link.target
      if (sourceId === selectedNodeId) connected.add(targetId)
      if (targetId === selectedNodeId) connected.add(sourceId)
    })
    return connected
  }, [selectedNodeId, filteredLinks])

  return (
    <div 
      ref={containerRef}
      className="detective-board"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '600px',
        position: 'relative',
        overflow: 'hidden',
        cursor: draggingNode ? 'grabbing' : 'default',
      }}
    >
      {/* Cork board texture background */}
      <div className="cork-background" />

      {/* SVG for red strings/connections */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      >
        <defs>
          {/* Glow filter for strings */}
          <filter id="string-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {filteredLinks.map(link => {
          const sourceId = typeof link.source === 'object' ? (link.source as { id: string }).id : link.source
          const targetId = typeof link.target === 'object' ? (link.target as { id: string }).id : link.target
          const sourcePos = positions.get(sourceId)
          const targetPos = positions.get(targetId)

          if (!sourcePos || !targetPos) return null

          const isHighlighted = selectedNodeId && 
            (sourceId === selectedNodeId || targetId === selectedNodeId)
          
          const isConnected = selectedNodeId ? 
            (connectedNodes.has(sourceId) && connectedNodes.has(targetId)) : true

          return (
            <g key={link.id}>
              {/* Red yarn/string */}
              <path
                d={calculateStringPath(sourcePos.x, sourcePos.y, targetPos.x, targetPos.y)}
                stroke={RELATIONSHIP_COLORS[link.type] || '#dc2626'}
                strokeWidth={isHighlighted ? 3 : 2}
                fill="none"
                opacity={isConnected ? (isHighlighted ? 1 : 0.7) : 0.15}
                filter={isHighlighted ? "url(#string-glow)" : undefined}
                style={{
                  transition: 'opacity 0.3s ease',
                }}
              />
            </g>
          )
        })}
      </svg>

      {/* Photo nodes */}
      {filteredNodes.map(node => {
        const pos = positions.get(node.id)
        if (!pos) {
          console.log('[DetectiveBoard] No position for node:', node.id, node.name)
          return null
        }

        const rotation = getRandomRotation(node.id)
        const isSelected = selectedNodeId === node.id
        const isConnected = selectedNodeId ? connectedNodes.has(node.id) : true
        const isHovered = hoveredNode === node.id
        const isDead = node.status === 'dead'
        const isCrew = node.nodeType === 'crew'
        const isCrewMember = node.nodeType === 'crew-member'
        const isPlayerGroup = node.name.toLowerCase().includes('player') || 
                             node.name.toLowerCase().includes('group') ||
                             node.name.toLowerCase().includes('party') ||
                             isCrew

        // Get member count for crew nodes
        const memberCount = isCrew && node.members ? node.members.length : 0

        return (
          <div
            key={node.id}
            className={`polaroid-card ${isSelected ? 'selected' : ''} ${isDead ? 'dead' : ''} ${isPlayerGroup ? 'player-group' : ''} ${isCrew ? 'crew-node' : ''} ${isCrewMember ? 'crew-member-node' : ''}`}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              transform: `translate(-50%, -50%) rotate(${isHovered || isSelected ? 0 : rotation}deg) ${isHovered ? 'scale(1.1)' : isSelected ? 'scale(1.15)' : 'scale(1)'}`,
              opacity: isConnected ? 1 : 0.3,
              zIndex: isSelected ? 100 : isHovered ? 50 : isCrew ? 15 : 10,
              transition: draggingNode === node.id ? 'none' : 'transform 0.2s ease, opacity 0.3s ease, z-index 0s',
              cursor: draggingNode === node.id ? 'grabbing' : 'grab',
            }}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            onClick={() => handleNodeClick(node)}
          >
            {/* Push pin */}
            <div 
              className="push-pin"
              style={{ backgroundColor: isCrew ? '#3b82f6' : isCrewMember ? '#8b5cf6' : getPinColor(node.status || 'alive') }}
            />

            {/* Photo frame */}
            <div className="photo-frame">
              <img
                src={node.imageUrl || getPlaceholderAvatar(node.name)}
                alt={node.name}
                className="photo-image"
                draggable={false}
              />
              
              {/* Crew member badge */}
              {isCrew && memberCount > 0 && (
                <div className="crew-badge">
                  <span className="crew-badge-count">{memberCount}</span>
                </div>
              )}

              {/* Crew member indicator */}
              {isCrewMember && (
                <div className="crew-member-indicator">👤</div>
              )}
              
              {/* Dead overlay */}
              {isDead && (
                <div className="dead-overlay">
                  <span className="dead-x">✕</span>
                </div>
              )}
            </div>

            {/* Name label (sticky note style) */}
            {(isHovered || isSelected) && (
              <div className="name-label">
                {isCrew && <span className="crew-label-prefix">👥 </span>}
                {isCrewMember && <span className="crew-label-prefix">👤 </span>}
                {node.name}
                {node.title && <span className="title-text">{node.title}</span>}
              </div>
            )}
          </div>
        )
      })}

      {/* Decorative elements */}
      <div className="board-decorations">
        {/* Corner tacks */}
        <div className="corner-tack top-left" />
        <div className="corner-tack top-right" />
        <div className="corner-tack bottom-left" />
        <div className="corner-tack bottom-right" />
      </div>

      {/* Click to deselect */}
      <div 
        className="absolute inset-0"
        style={{ zIndex: 0 }}
        onClick={() => setSelectedNodeId(null)}
      />
    </div>
  )
}
