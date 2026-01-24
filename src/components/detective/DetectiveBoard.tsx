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
  
  // Zoom and pan state
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [didDrag, setDidDrag] = useState(false)

  // Filter nodes and links
  const { filteredNodes, filteredLinks } = useMemo(() => {
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

  // Handle mouse wheel zoom
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      
      const rect = container.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      // Calculate zoom
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.3, Math.min(3, zoom * zoomFactor))
      
      // Adjust pan to zoom towards mouse position
      const zoomRatio = newZoom / zoom
      const newPanX = mouseX - (mouseX - pan.x) * zoomRatio
      const newPanY = mouseY - (mouseY - pan.y) * zoomRatio
      
      setZoom(newZoom)
      setPan({ x: newPanX, y: newPanY })
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [zoom, pan])

  // Calculate initial positions in a circular layout with player group at center
  useEffect(() => {
    if (filteredNodes.length === 0) return

    const centerX = dimensions.width / 2
    const centerY = dimensions.height / 2
    const outerRadius = Math.min(dimensions.width, dimensions.height) * 0.35
    const innerRadius = Math.min(dimensions.width, dimensions.height) * 0.18

    // Find the node to center: prioritize crew nodes, then player group nodes
    const crewNode = filteredNodes.find(n => n.nodeType === 'crew')
    const playerGroupNode = filteredNodes.find(n => 
      n.name.toLowerCase().includes('player') || 
      n.name.toLowerCase().includes('group') ||
      n.name.toLowerCase().includes('party')
    )
    const centerNodeId = crewNode?.id || playerGroupNode?.id
    
    // Use functional update to avoid stale closure issues
    setPositions(prevPositions => {
      // Check if we have new nodes that don't have positions yet
      const nodesWithoutPositions = filteredNodes.filter(n => !prevPositions.has(n.id))
      
      // If all current nodes have positions, skip
      if (nodesWithoutPositions.length === 0) {
        return prevPositions
      }

      const newPositions = new Map<string, { x: number; y: number }>(prevPositions)
      
      // Separate crew members from other nodes
      const crewMemberNodes = nodesWithoutPositions.filter(n => n.nodeType === 'crew-member')
      const otherNodes = nodesWithoutPositions.filter(n => 
        n.nodeType !== 'crew-member' && n.nodeType !== 'crew' && n.id !== centerNodeId
      )
      
      // Position crew/center nodes in the center
      nodesWithoutPositions.forEach(node => {
        if ((node.nodeType === 'crew' || node.id === centerNodeId) && !newPositions.has(node.id)) {
          newPositions.set(node.id, { x: centerX, y: centerY })
        }
      })
      
      // Position crew members in inner circle
      crewMemberNodes.forEach((node, index) => {
        if (!newPositions.has(node.id)) {
          const angle = (2 * Math.PI * index) / crewMemberNodes.length - Math.PI / 2
          const x = centerX + innerRadius * Math.cos(angle)
          const y = centerY + innerRadius * Math.sin(angle)
          newPositions.set(node.id, { x, y })
        }
      })
      
      // Position other nodes (NPCs) in outer circle
      otherNodes.forEach((node, index) => {
        if (!newPositions.has(node.id)) {
          const angle = (2 * Math.PI * index) / otherNodes.length - Math.PI / 2
          const x = centerX + outerRadius * Math.cos(angle)
          const y = centerY + outerRadius * Math.sin(angle)
          newPositions.set(node.id, { x, y })
        }
      })

      return newPositions
    })
  }, [filteredNodes, dimensions])

  // Mouse handlers for dragging nodes
  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDidDrag(false)
    const pos = positions.get(nodeId)
    if (pos) {
      setDraggingNode(nodeId)
      // Account for zoom and pan when calculating offset
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        setDragOffset({
          x: (e.clientX - rect.left - pan.x) / zoom - pos.x,
          y: (e.clientY - rect.top - pan.y) / zoom - pos.y
        })
      }
    }
  }, [positions, zoom, pan])

  // Handle pan start - ONLY Ctrl+click, otherwise deselect
  const handleBackgroundMouseDown = useCallback((e: React.MouseEvent) => {
    // Only pan with Ctrl+left click
    if (e.button === 0 && e.ctrlKey) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    } else if (e.button === 0) {
      // Regular click on background - deselect
      setSelectedNodeId(null)
    }
  }, [pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    } else if (draggingNode) {
      setDidDrag(true)
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        const newX = (e.clientX - rect.left - pan.x) / zoom - dragOffset.x
        const newY = (e.clientY - rect.top - pan.y) / zoom - dragOffset.y
        setPositions(prev => {
          const updated = new Map(prev)
          updated.set(draggingNode, { x: newX, y: newY })
          return updated
        })
      }
    }
  }, [isPanning, panStart, draggingNode, dragOffset, zoom, pan])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    // If we were dragging a node and didn't actually move, treat it as a click
    if (draggingNode && !didDrag) {
      const node = filteredNodes.find(n => n.id === draggingNode)
      if (node) {
        setSelectedNodeId(node.id)
        onNodeClick(node)
      }
    }
    setDraggingNode(null)
    setIsPanning(false)
    setDidDrag(false)
  }, [draggingNode, didDrag, filteredNodes, onNodeClick])

  // Handle node click - only used for direct clicks without drag
  const handleNodeClick = useCallback((e: React.MouseEvent, node: GraphNode) => {
    e.stopPropagation()
    // This will be handled by mouseUp if it was a mouseDown without drag
  }, [])

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
      onMouseDown={handleBackgroundMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '600px',
        position: 'relative',
        overflow: 'hidden',
        cursor: isPanning ? 'grabbing' : draggingNode ? 'grabbing' : 'default',
      }}
    >
      {/* Cork board texture background */}
      <div className="cork-background" />

      {/* Zoom controls */}
      <div className="zoom-controls" style={{
        position: 'absolute',
        bottom: '1rem',
        right: '1rem',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
      }}>
        <button
          onClick={() => setZoom(z => Math.min(3, z * 1.2))}
          className="zoom-btn"
          title="Zoom In"
          style={{
            width: '32px',
            height: '32px',
            background: 'rgba(45, 74, 58, 0.9)',
            border: '1px solid #a7f3d0',
            borderRadius: '4px',
            color: '#a7f3d0',
            cursor: 'pointer',
            fontSize: '1.2rem',
          }}
        >+</button>
        <button
          onClick={() => setZoom(z => Math.max(0.3, z / 1.2))}
          className="zoom-btn"
          title="Zoom Out"
          style={{
            width: '32px',
            height: '32px',
            background: 'rgba(45, 74, 58, 0.9)',
            border: '1px solid #a7f3d0',
            borderRadius: '4px',
            color: '#a7f3d0',
            cursor: 'pointer',
            fontSize: '1.2rem',
          }}
        >−</button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="zoom-btn"
          title="Reset View"
          style={{
            width: '32px',
            height: '32px',
            background: 'rgba(45, 74, 58, 0.9)',
            border: '1px solid #a7f3d0',
            borderRadius: '4px',
            color: '#a7f3d0',
            cursor: 'pointer',
            fontSize: '0.7rem',
          }}
        >Reset</button>
        <div style={{
          marginTop: '0.5rem',
          fontSize: '0.65rem',
          color: '#a7f3d0',
          textAlign: 'center',
          opacity: 0.7,
          lineHeight: 1.3,
        }}>
          Scroll to zoom<br/>
          Ctrl+drag to pan
        </div>
      </div>

      {/* Transformed content container */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* SVG for red strings/connections */}
        <svg 
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 5,
            width: dimensions.width,
            height: dimensions.height,
            overflow: 'visible',
            pointerEvents: 'none',
          }}
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
        if (!pos) return null

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
              cursor: draggingNode === node.id ? 'grabbing' : 'pointer',
            }}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
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
      </div>

      {/* Decorative elements */}
      <div className="board-decorations">
        {/* Corner tacks */}
        <div className="corner-tack top-left" />
        <div className="corner-tack top-right" />
        <div className="corner-tack bottom-left" />
        <div className="corner-tack bottom-right" />
      </div>
    </div>
  )
}
