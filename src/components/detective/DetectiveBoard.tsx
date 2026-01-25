'use client'

import { useEffect, useRef, useMemo, useCallback, useState } from 'react'
import { GraphData, GraphNode, GraphLink, FilterState, RELATIONSHIP_COLORS } from '@/types'

interface DetectiveBoardProps {
  data: GraphData
  filters: FilterState
  onNodeClick: (node: GraphNode) => void
  onLinkClick: (link: GraphLink) => void
  canEdit: boolean
  selectedNodeId?: string | null
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
  selectedNodeId: externalSelectedNodeId,
}: DetectiveBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map())
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 })
  const [draggingNode, setDraggingNode] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  // Use external selectedNodeId if provided, otherwise use internal state
  const [internalSelectedNodeId, setInternalSelectedNodeId] = useState<string | null>(null)
  const selectedNodeId = externalSelectedNodeId !== undefined ? externalSelectedNodeId : internalSelectedNodeId
  const setSelectedNodeId = setInternalSelectedNodeId
  
  // Zoom and pan state
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [isMobile, setIsMobile] = useState(false)
  const [viewInitialized, setViewInitialized] = useState(false)
  
  // Track mouse position for click vs drag detection
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null)
  const DRAG_THRESHOLD = 5 // pixels - if mouse moves less than this, it's a click
  const TOUCH_TAP_THRESHOLD = 15 // pixels - higher threshold for touch (less precise)
  
  // Touch state for pinch zoom and touch interactions
  const lastTouchDistance = useRef<number | null>(null)
  const touchStartPos = useRef<{ x: number; y: number } | null>(null)
  const touchNodeId = useRef<string | null>(null)

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

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fit all nodes in view on initial load - only runs once when positions are first set
  useEffect(() => {
    // Only run when we have positions and haven't initialized yet
    if (viewInitialized || positions.size === 0 || dimensions.width === 0) return
    
    // Mark as initialized immediately via state update
    setViewInitialized(true)
    
    // Calculate bounding box of all nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    positions.forEach(pos => {
      minX = Math.min(minX, pos.x)
      minY = Math.min(minY, pos.y)
      maxX = Math.max(maxX, pos.x)
      maxY = Math.max(maxY, pos.y)
    })
    
    // Add padding for card size (cards are ~100px)
    const padding = 80
    minX -= padding
    minY -= padding
    maxX += padding
    maxY += padding
    
    const contentWidth = maxX - minX
    const contentHeight = maxY - minY
    
    // Calculate zoom to fit all content with some margin
    const margin = 40
    const availableWidth = dimensions.width - margin * 2
    const availableHeight = dimensions.height - margin * 2
    
    const scaleX = availableWidth / contentWidth
    const scaleY = availableHeight / contentHeight
    const fitZoom = Math.max(0.5, Math.min(scaleX, scaleY, 1)) // Clamp between 0.5 and 1
    
    // Calculate pan to center the content
    const contentCenterX = (minX + maxX) / 2
    const contentCenterY = (minY + maxY) / 2
    const viewCenterX = dimensions.width / 2
    const viewCenterY = dimensions.height / 2
    
    const panX = viewCenterX - contentCenterX * fitZoom
    const panY = viewCenterY - contentCenterY * fitZoom
    
    setZoom(fitZoom)
    setPan({ x: panX, y: panY })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewInitialized, positions.size, dimensions.width, dimensions.height])

  // Mouse handlers for dragging nodes
  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault()
    e.stopPropagation()
    mouseDownPos.current = { x: e.clientX, y: e.clientY }
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
    // Check if this was a click (minimal mouse movement) vs a drag
    const wasClick = mouseDownPos.current && 
      Math.abs(e.clientX - mouseDownPos.current.x) < DRAG_THRESHOLD &&
      Math.abs(e.clientY - mouseDownPos.current.y) < DRAG_THRESHOLD
    
    // If we were on a node and didn't drag much, treat it as a click
    if (draggingNode && wasClick) {
      const node = filteredNodes.find(n => n.id === draggingNode)
      if (node) {
        setSelectedNodeId(node.id)
        onNodeClick(node)
      }
    }
    
    mouseDownPos.current = null
    setDraggingNode(null)
    setIsPanning(false)
  }, [draggingNode, filteredNodes, onNodeClick])

  // Handle node click - only used for direct clicks without drag
  const handleNodeClick = useCallback((e: React.MouseEvent, node: GraphNode) => {
    e.stopPropagation()
    // This will be handled by mouseUp if it was a mouseDown without drag
  }, [])

  // Touch handlers for mobile support
  const handleTouchStart = useCallback((e: React.TouchEvent, nodeId?: string) => {
    if (e.touches.length === 2) {
      // Pinch zoom - calculate initial distance between fingers
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      lastTouchDistance.current = distance
    } else if (e.touches.length === 1) {
      const touch = e.touches[0]
      touchStartPos.current = { x: touch.clientX, y: touch.clientY }
      
      if (nodeId) {
        // Touch on a node - prepare for drag
        touchNodeId.current = nodeId
        const pos = positions.get(nodeId)
        if (pos) {
          const rect = containerRef.current?.getBoundingClientRect()
          if (rect) {
            setDragOffset({
              x: (touch.clientX - rect.left - pan.x) / zoom - pos.x,
              y: (touch.clientY - rect.top - pan.y) / zoom - pos.y
            })
            setDraggingNode(nodeId)
          }
        }
      } else {
        // Touch on background - prepare for pan
        setPanStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y })
        setIsPanning(true)
      }
    }
  }, [positions, zoom, pan])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      e.preventDefault()
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      
      if (lastTouchDistance.current !== null) {
        const scale = distance / lastTouchDistance.current
        const newZoom = Math.max(0.3, Math.min(3, zoom * scale))
        
        // Center of pinch
        const centerX = (touch1.clientX + touch2.clientX) / 2
        const centerY = (touch1.clientY + touch2.clientY) / 2
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
          const mouseX = centerX - rect.left
          const mouseY = centerY - rect.top
          const zoomRatio = newZoom / zoom
          const newPanX = mouseX - (mouseX - pan.x) * zoomRatio
          const newPanY = mouseY - (mouseY - pan.y) * zoomRatio
          
          setZoom(newZoom)
          setPan({ x: newPanX, y: newPanY })
        }
      }
      lastTouchDistance.current = distance
    } else if (e.touches.length === 1) {
      const touch = e.touches[0]
      
      if (draggingNode) {
        // Dragging a node
        e.preventDefault()
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
          const newX = (touch.clientX - rect.left - pan.x) / zoom - dragOffset.x
          const newY = (touch.clientY - rect.top - pan.y) / zoom - dragOffset.y
          setPositions(prev => {
            const updated = new Map(prev)
            updated.set(draggingNode, { x: newX, y: newY })
            return updated
          })
        }
      } else if (isPanning) {
        // Panning the board
        setPan({
          x: touch.clientX - panStart.x,
          y: touch.clientY - panStart.y
        })
      }
    }
  }, [zoom, pan, draggingNode, isPanning, dragOffset, panStart])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Check if this was a tap (minimal movement) vs a drag
    if (e.changedTouches.length > 0 && touchStartPos.current) {
      const touch = e.changedTouches[0]
      const wasTap = 
        Math.abs(touch.clientX - touchStartPos.current.x) < TOUCH_TAP_THRESHOLD &&
        Math.abs(touch.clientY - touchStartPos.current.y) < TOUCH_TAP_THRESHOLD
      
      if (wasTap && touchNodeId.current) {
        const node = filteredNodes.find(n => n.id === touchNodeId.current)
        if (node) {
          setSelectedNodeId(node.id)
          onNodeClick(node)
        }
      } else if (wasTap && !touchNodeId.current) {
        // Tap on background - deselect
        setSelectedNodeId(null)
      }
    }
    
    // Reset all touch state
    lastTouchDistance.current = null
    touchStartPos.current = null
    touchNodeId.current = null
    setDraggingNode(null)
    setIsPanning(false)
  }, [filteredNodes, onNodeClick, TOUCH_TAP_THRESHOLD])

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
      onTouchStart={(e) => handleTouchStart(e)}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '600px',
        position: 'relative',
        overflow: 'hidden',
        cursor: isPanning ? 'grabbing' : draggingNode ? 'grabbing' : 'default',
        touchAction: 'none', // Prevent default touch behaviors
      }}
    >
      {/* Cork board texture background */}
      <div className="cork-background" />

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
            onTouchStart={(e) => {
              e.stopPropagation()
              handleTouchStart(e, node.id)
            }}
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

            {/* Name label (sticky note style) - always show on mobile, show on hover/select for desktop */}
            {(isMobile || isHovered || isSelected) && (
              <div className={`name-label ${isMobile && !isSelected && !isHovered ? 'mobile-always-visible' : ''}`}>
                {isCrew && <span className="crew-label-prefix">👥 </span>}
                {isCrewMember && <span className="crew-label-prefix">👤 </span>}
                {node.name}
                {node.title && !isMobile && <span className="title-text">{node.title}</span>}
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
