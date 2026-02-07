'use client'

import { useEffect, useRef, useMemo, useCallback, useState } from 'react'
import { GraphData, GraphNode, FilterState, getRelationshipColor, EntityType } from '@/types'
import { getPlaceholderAvatar } from '@/lib/utils'

interface PositionChange {
  nodeId: string
  entityType: EntityType
  posX: number
  posY: number
}

interface DetectiveBoardProps {
  data: GraphData
  filters: FilterState
  onNodeClick: (node: GraphNode) => void
  selectedNodeId?: string | null
  multiSelectedNodeIds?: Set<string>
  onMultiSelectChange?: (nodeIds: Set<string>) => void
  isMultiSelectFilterActive?: boolean
  onPositionChange?: (position: PositionChange) => void
}

// Get polaroid-style rotation for each node
function getRandomRotation(id: string): number {
  // Use id to generate consistent rotation
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
    hash |= 0
  }
  return (hash % 7) - 3 // -3 to 3 degrees (subtle tilt)
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
  multiSelectedNodeIds = new Set(),
  onMultiSelectChange,
  isMultiSelectFilterActive = false,
  onPositionChange,
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
  const didDrag = useRef(false) // Track if actual dragging happened
  const DRAG_THRESHOLD = 5 // pixels - if mouse moves less than this, it's a click
  const TOUCH_TAP_THRESHOLD = 25 // pixels - higher threshold for touch (less precise)
  const LONG_PRESS_DURATION = 400 // ms - duration for long press detection
  
  // Touch state for pinch zoom and touch interactions
  const lastTouchDistance = useRef<number | null>(null)
  const touchStartPos = useRef<{ x: number; y: number } | null>(null)
  const touchNodeId = useRef<string | null>(null)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)

  // Filter nodes and links
  const { filteredNodes, filteredLinks } = useMemo(() => {
    let filteredNodes = [...data.nodes]

    // Apply entity type filters (Characters Only / Organisations Only)
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

    // Apply multi-select filter ONLY when filter is active (Apply button pressed)
    // Otherwise, just keep all nodes visible (will be faded based on selection)
    if (isMultiSelectFilterActive && multiSelectedNodeIds.size >= 2) {
      filteredNodes = filteredNodes.filter(node => multiSelectedNodeIds.has(node.id))
      filteredLinks = filteredLinks.filter(link => {
        const sourceId = typeof link.source === 'object' ? (link.source as { id: string }).id : link.source
        const targetId = typeof link.target === 'object' ? (link.target as { id: string }).id : link.target
        return multiSelectedNodeIds.has(sourceId) && multiSelectedNodeIds.has(targetId)
      })
    }

    return { filteredNodes, filteredLinks, nodeIds }
  }, [data, filters, multiSelectedNodeIds, isMultiSelectFilterActive])

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
  // But prefer saved positions from database if available
  useEffect(() => {
    if (filteredNodes.length === 0) return

    const centerX = dimensions.width / 2
    const centerY = dimensions.height / 2
    const outerRadius = Math.min(dimensions.width, dimensions.height) * 0.35
    const orgRadius = Math.min(dimensions.width, dimensions.height) * 0.15

    // Separate organisations from characters
    const orgNodes = filteredNodes.filter(n => n.entityType === 'organisation')
    const characterNodes = filteredNodes.filter(n => n.entityType === 'character')
    
    // Use functional update to avoid stale closure issues
    setPositions(prevPositions => {
      // Check if we have new nodes that don't have positions yet
      // A node needs positioning if it's not in prevPositions AND doesn't have saved x/y
      const nodesWithoutPositions = filteredNodes.filter(n => 
        !prevPositions.has(n.id) && (n.x == null || n.y == null)
      )
      
      // First, add any nodes with saved positions from database
      const nodesWithSavedPositions = filteredNodes.filter(n => 
        !prevPositions.has(n.id) && n.x != null && n.y != null
      )
      
      // If no new nodes to position and no saved positions to restore, skip
      if (nodesWithoutPositions.length === 0 && nodesWithSavedPositions.length === 0) {
        return prevPositions
      }

      const newPositions = new Map<string, { x: number; y: number }>(prevPositions)
      
      // Restore saved positions from database
      nodesWithSavedPositions.forEach(node => {
        newPositions.set(node.id, { x: node.x!, y: node.y! })
      })
      
      // Filter for nodes that need new positioning (no saved position)
      const orgsToPosition = orgNodes.filter(n => !newPositions.has(n.id) && (n.x == null || n.y == null))
      const charsToPosition = characterNodes.filter(n => !newPositions.has(n.id) && (n.x == null || n.y == null))
      
      // Position organisation nodes in a cluster near center (if multiple)
      if (orgsToPosition.length === 1) {
        // Single org goes in center
        newPositions.set(orgsToPosition[0].id, { x: centerX, y: centerY })
      } else {
        // Multiple orgs go in a small circle near center
        orgsToPosition.forEach((node, index) => {
          const angle = (2 * Math.PI * index) / orgsToPosition.length - Math.PI / 2
          const x = centerX + orgRadius * Math.cos(angle)
          const y = centerY + orgRadius * Math.sin(angle)
          newPositions.set(node.id, { x, y })
        })
      }
      
      // Position character nodes in outer circle
      charsToPosition.forEach((node, index) => {
        const angle = (2 * Math.PI * index) / Math.max(charsToPosition.length, 1) - Math.PI / 2
        const x = centerX + outerRadius * Math.cos(angle)
        const y = centerY + outerRadius * Math.sin(angle)
        newPositions.set(node.id, { x, y })
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
    didDrag.current = false // Reset drag tracking
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

  // Handle pan start - left click on background or middle mouse button for panning
  const handleBackgroundMouseDown = useCallback((e: React.MouseEvent) => {
    // Pan with middle mouse button OR left click on background (not Ctrl - that's for multi-select)
    if (e.button === 1 || (e.button === 0 && !e.ctrlKey && !e.metaKey)) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      // Also deselect when clicking on background
      setSelectedNodeId(null)
    }
  }, [pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Track if we're dragging (mouse moved enough)
    if (mouseDownPos.current) {
      const dx = Math.abs(e.clientX - mouseDownPos.current.x)
      const dy = Math.abs(e.clientY - mouseDownPos.current.y)
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        didDrag.current = true
      }
    }
    
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    } else if (draggingNode && didDrag.current) {
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

  const handleMouseUp = useCallback(() => {
    // If a node was dragged, notify parent of the position change
    if (draggingNode && didDrag.current && onPositionChange) {
      const pos = positions.get(draggingNode)
      const node = filteredNodes.find(n => n.id === draggingNode)
      if (pos && node) {
        onPositionChange({
          nodeId: draggingNode,
          entityType: node.entityType,
          posX: pos.x,
          posY: pos.y,
        })
      }
    }
    
    // Just clean up - click handling is done in onClick handler
    mouseDownPos.current = null
    setDraggingNode(null)
    setIsPanning(false)
  }, [draggingNode, positions, filteredNodes, onPositionChange])

  // Handle node click - only used for direct clicks without drag
  const handleNodeClick = useCallback((e: React.MouseEvent, node: GraphNode) => {
    e.stopPropagation()
    // This will be handled by mouseUp if it was a mouseDown without drag
  }, [])

  // Touch handlers for mobile support
  const handleTouchStart = useCallback((e: React.TouchEvent, nodeId?: string) => {
    didDrag.current = false // Reset drag tracking
    
    // Clear any existing long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    
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
        // Touch on a node - prepare for drag and long press
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
        
        // Set up long press timer for multi-select
        longPressTimer.current = setTimeout(() => {
          if (!didDrag.current && touchNodeId.current && onMultiSelectChange) {
            // Long press detected - toggle multi-select
            const node = filteredNodes.find(n => n.id === touchNodeId.current)
            if (node) {
              const newSet = new Set(multiSelectedNodeIds)
              if (newSet.has(node.id)) {
                newSet.delete(node.id)
              } else {
                newSet.add(node.id)
              }
              onMultiSelectChange(newSet)
              // Vibrate for feedback if available
              if (navigator.vibrate) {
                navigator.vibrate(50)
              }
            }
            // Prevent regular tap from also triggering
            touchNodeId.current = null
          }
          longPressTimer.current = null
        }, LONG_PRESS_DURATION)
      } else {
        // Touch on background - prepare for pan
        setPanStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y })
        setIsPanning(true)
      }
    }
  }, [positions, zoom, pan, filteredNodes, multiSelectedNodeIds, onMultiSelectChange, LONG_PRESS_DURATION])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom - cancel long press
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
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
      
      // Check if we moved enough to count as a drag
      if (touchStartPos.current) {
        const dx = Math.abs(touch.clientX - touchStartPos.current.x)
        const dy = Math.abs(touch.clientY - touchStartPos.current.y)
        if (dx > TOUCH_TAP_THRESHOLD || dy > TOUCH_TAP_THRESHOLD) {
          didDrag.current = true
          // Cancel long press if movement detected
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current)
            longPressTimer.current = null
          }
        }
      }
      
      if (draggingNode && didDrag.current) {
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
        didDrag.current = true
        setPan({
          x: touch.clientX - panStart.x,
          y: touch.clientY - panStart.y
        })
      }
    }
  }, [zoom, pan, draggingNode, isPanning, dragOffset, panStart, TOUCH_TAP_THRESHOLD])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    
    // Check if this was a tap (minimal movement) vs a drag
    if (e.changedTouches.length > 0 && touchStartPos.current && !didDrag.current) {
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
    
    // If a node was dragged, notify parent of the position change
    if (draggingNode && didDrag.current && onPositionChange) {
      const pos = positions.get(draggingNode)
      const node = filteredNodes.find(n => n.id === draggingNode)
      if (pos && node) {
        onPositionChange({
          nodeId: draggingNode,
          entityType: node.entityType,
          posX: pos.x,
          posY: pos.y,
        })
      }
    }
    
    // Reset all touch state
    lastTouchDistance.current = null
    touchStartPos.current = null
    touchNodeId.current = null
    didDrag.current = false
    setDraggingNode(null)
    setIsPanning(false)
  }, [filteredNodes, onNodeClick, TOUCH_TAP_THRESHOLD, draggingNode, positions, onPositionChange])

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
                stroke={getRelationshipColor(link.type, link.strength)}
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
        const isMultiSelected = multiSelectedNodeIds.has(node.id)
        const isConnected = selectedNodeId ? connectedNodes.has(node.id) : true
        const isHovered = hoveredNode === node.id
        const isDead = node.status === 'dead'
        const isUnknown = node.status === 'unknown'
        const isOrganisation = node.entityType === 'organisation'
        const isCharacter = node.entityType === 'character'
        const isPlayerGroup = node.name.toLowerCase().includes('player') || 
                             node.name.toLowerCase().includes('group') ||
                             node.name.toLowerCase().includes('party') ||
                             isOrganisation

        // Get member count for organisation nodes
        const memberCount = isOrganisation && node.members ? node.members.length : 0

        // Calculate opacity:
        // - If single node is selected, fade unconnected nodes
        // - If multi-selecting (but not yet applied), fade unselected nodes
        // - Otherwise, full opacity
        let nodeOpacity = 1
        if (selectedNodeId && !isConnected) {
          nodeOpacity = 0.3
        } else if (multiSelectedNodeIds.size > 0 && !isMultiSelectFilterActive && !isMultiSelected) {
          nodeOpacity = 0.3
        }

        return (
          <div
            key={node.id}
            className={`polaroid-card ${isSelected || isMultiSelected ? 'selected' : ''} ${isDead ? 'dead' : ''} ${isPlayerGroup ? 'player-group' : ''} ${isOrganisation ? 'org-node' : ''} ${isCharacter ? 'character-node' : ''}`}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              transform: `translate(-50%, -50%) rotate(${isHovered || isSelected ? 0 : rotation}deg) ${isHovered ? 'scale(1.1)' : isSelected ? 'scale(1.15)' : 'scale(1)'}`,
              opacity: nodeOpacity,
              zIndex: isSelected ? 100 : isHovered ? 50 : isOrganisation ? 15 : 10,
              transition: draggingNode === node.id ? 'none' : 'transform 0.2s ease, opacity 0.3s ease, z-index 0s',
              cursor: draggingNode === node.id ? 'grabbing' : 'pointer',
            }}
            onClick={(e) => {
              // Handle click/tap - works for both mouse and touch
              e.stopPropagation()
              if (!didDrag.current) {
                // Handle Ctrl+click for multi-select
                if (e.ctrlKey || e.metaKey) {
                  if (onMultiSelectChange) {
                    const newSelection = new Set(multiSelectedNodeIds)
                    if (newSelection.has(node.id)) {
                      newSelection.delete(node.id)
                    } else {
                      newSelection.add(node.id)
                    }
                    onMultiSelectChange(newSelection)
                  }
                } else {
                  // Clear multi-selection on regular click
                  if (onMultiSelectChange && multiSelectedNodeIds.size > 0) {
                    onMultiSelectChange(new Set())
                  }
                  setSelectedNodeId(node.id)
                  onNodeClick(node)
                }
              }
              didDrag.current = false
            }}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            onTouchStart={(e) => {
              e.stopPropagation()
              didDrag.current = false
              touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
              touchNodeId.current = node.id
              
              // Clear any existing long press timer
              if (longPressTimer.current) {
                clearTimeout(longPressTimer.current)
                longPressTimer.current = null
              }
              
              // Set up for potential drag
              const pos = positions.get(node.id)
              if (pos) {
                const rect = containerRef.current?.getBoundingClientRect()
                if (rect) {
                  setDragOffset({
                    x: (e.touches[0].clientX - rect.left - pan.x) / zoom - pos.x,
                    y: (e.touches[0].clientY - rect.top - pan.y) / zoom - pos.y
                  })
                  setDraggingNode(node.id)
                }
              }
              
              // Set up long press timer for multi-select
              if (onMultiSelectChange) {
                longPressTimer.current = setTimeout(() => {
                  if (!didDrag.current && touchNodeId.current === node.id) {
                    // Long press detected - toggle multi-select
                    const newSet = new Set(multiSelectedNodeIds)
                    if (newSet.has(node.id)) {
                      newSet.delete(node.id)
                    } else {
                      newSet.add(node.id)
                    }
                    onMultiSelectChange(newSet)
                    // Vibrate for feedback if available
                    if (navigator.vibrate) {
                      navigator.vibrate(50)
                    }
                    // Prevent regular tap from also triggering
                    touchNodeId.current = null
                  }
                  longPressTimer.current = null
                }, LONG_PRESS_DURATION)
              }
            }}
            onTouchMove={(e) => {
              e.stopPropagation()
              if (touchStartPos.current && e.touches.length === 1) {
                const touch = e.touches[0]
                const dx = Math.abs(touch.clientX - touchStartPos.current.x)
                const dy = Math.abs(touch.clientY - touchStartPos.current.y)
                if (dx > TOUCH_TAP_THRESHOLD || dy > TOUCH_TAP_THRESHOLD) {
                  didDrag.current = true
                  // Cancel long press timer if movement detected
                  if (longPressTimer.current) {
                    clearTimeout(longPressTimer.current)
                    longPressTimer.current = null
                  }
                  // Move the node - don't call preventDefault, let CSS touch-action handle it
                  const rect = containerRef.current?.getBoundingClientRect()
                  if (rect && draggingNode) {
                    const newX = (touch.clientX - rect.left - pan.x) / zoom - dragOffset.x
                    const newY = (touch.clientY - rect.top - pan.y) / zoom - dragOffset.y
                    setPositions(prev => {
                      const updated = new Map(prev)
                      updated.set(draggingNode, { x: newX, y: newY })
                      return updated
                    })
                  }
                }
              }
            }}
            onTouchEnd={(e) => {
              e.stopPropagation()
              // Clear long press timer
              if (longPressTimer.current) {
                clearTimeout(longPressTimer.current)
                longPressTimer.current = null
              }
              // Reset state - onClick will handle selection if it was a tap
              setDraggingNode(null)
              touchStartPos.current = null
              touchNodeId.current = null
            }}
          >
            {/* Push pin */}
            <div 
              className="push-pin"
              style={{ backgroundColor: node.pinColor || '#9ca3af' }}
            />

            {/* Photo frame - always portrait aspect ratio */}
            <div className="photo-frame aspect-portrait">
              <img
                src={node.imageUrl || getPlaceholderAvatar(node.name)}
                alt={node.name}
                className="photo-image"
                draggable={false}
                style={node.imageCrop ? {
                  transform: `scale(${node.imageCrop.zoom}) translate(${node.imageCrop.offsetX / node.imageCrop.zoom}%, ${node.imageCrop.offsetY / node.imageCrop.zoom}%)`,
                  transformOrigin: 'center',
                } : undefined}
              />
              
              {/* Organisation member count badge */}
              {isOrganisation && memberCount > 0 && (
                <div className="crew-badge">
                  <span className="crew-badge-count">{memberCount}</span>
                </div>
              )}
              
              {/* Dead overlay */}
              {isDead && (
                <div className="dead-overlay">
                  <span className="dead-x">✕</span>
                </div>
              )}
              
              {/* Unknown status overlay */}
              {isUnknown && (
                <div className="unknown-overlay">
                  <span className="unknown-mark">?</span>
                </div>
              )}
            </div>

            {/* Name label (sticky note style) - only show when selected on mobile, show on hover/select for desktop */}
            {((isMobile && isSelected) || (!isMobile && (isHovered || isSelected))) && (
              <div className="name-label">
                {isOrganisation && <span className="crew-label-prefix">🏛️ </span>}
                {isCharacter && <span className="crew-label-prefix">👤 </span>}
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
