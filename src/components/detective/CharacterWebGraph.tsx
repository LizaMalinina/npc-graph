'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { Network, DataSet } from 'vis-network/standalone'
import { CharacterWebData } from '@/types'

interface CharacterWebGraphProps {
  data: CharacterWebData
  onNodeSelect: (nodeIds: string[]) => void
  selectedNodeIds?: string[]
}

// Color scheme for different entity types
const NODE_COLORS = {
  character: {
    background: '#3b82f6', // blue
    border: '#1d4ed8',
    highlight: {
      background: '#60a5fa',
      border: '#2563eb',
    },
  },
  organisation: {
    background: '#8b5cf6', // purple
    border: '#6d28d9',
    highlight: {
      background: '#a78bfa',
      border: '#7c3aed',
    },
  },
}

// Color scheme for relationship types
const EDGE_COLORS: Record<string, string> = {
  friend: '#22c55e',      // green
  ally: '#22c55e',        // green
  enemy: '#ef4444',       // red
  rival: '#f97316',       // orange
  family: '#3b82f6',      // blue
  colleague: '#64748b',   // gray
  member: '#8b5cf6',      // purple (for membership)
  default: '#94a3b8',     // default gray
}

export function CharacterWebGraph({ 
  data, 
  onNodeSelect, 
  selectedNodeIds = [] 
}: CharacterWebGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef = useRef<Network | null>(null)
  const nodesDataSetRef = useRef<DataSet<any> | null>(null)
  const edgesDataSetRef = useRef<DataSet<any> | null>(null)

  // Convert our data format to vis-network format
  const convertToVisNodes = useCallback(() => {
    return data.nodes.map(node => ({
      id: node.id,
      label: node.name,
      color: NODE_COLORS[node.entityType],
      shape: node.entityType === 'character' ? 'dot' : 'diamond',
      size: node.entityType === 'character' ? 25 : 30,
      font: {
        color: '#ffffff',
        size: 14,
      },
      title: `${node.name} (${node.entityType})`, // tooltip
    }))
  }, [data.nodes])

  const convertToVisEdges = useCallback(() => {
    return data.links.map(link => ({
      id: link.id,
      from: link.source,
      to: link.target,
      color: {
        color: EDGE_COLORS[link.type] || EDGE_COLORS.default,
        highlight: EDGE_COLORS[link.type] || EDGE_COLORS.default,
      },
      width: Math.max(1, (link.strength || 5) / 3),
      title: link.type, // tooltip
      smooth: {
        type: 'continuous',
      },
    }))
  }, [data.links])

  // Initialize the network
  useEffect(() => {
    if (!containerRef.current) return

    // Create datasets
    nodesDataSetRef.current = new DataSet(convertToVisNodes())
    edgesDataSetRef.current = new DataSet(convertToVisEdges())

    // Network options
    const options = {
      nodes: {
        borderWidth: 2,
        shadow: true,
      },
      edges: {
        smooth: {
          enabled: true,
          type: 'continuous',
          roundness: 0.5,
        },
        shadow: true,
      },
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springLength: 100,
          springConstant: 0.08,
        },
        stabilization: {
          iterations: 100,
        },
      },
      interaction: {
        hover: true,
        multiselect: true,
        selectConnectedEdges: true,
      },
    }

    // Create network
    networkRef.current = new Network(
      containerRef.current,
      {
        nodes: nodesDataSetRef.current,
        edges: edgesDataSetRef.current,
      },
      options
    )

    // Handle selection events
    networkRef.current.on('selectNode', (params) => {
      onNodeSelect(params.nodes)
    })

    networkRef.current.on('deselectNode', (params) => {
      onNodeSelect(params.nodes)
    })

    // Cleanup
    return () => {
      if (networkRef.current) {
        networkRef.current.destroy()
        networkRef.current = null
      }
    }
  }, []) // Only run on mount

  // Update data when props change
  useEffect(() => {
    if (!nodesDataSetRef.current || !edgesDataSetRef.current) return

    // Clear and update nodes
    const currentNodes = nodesDataSetRef.current.get()
    const newNodes = convertToVisNodes()
    
    // Remove old nodes
    const newNodeIds = new Set(newNodes.map(n => n.id))
    const nodesToRemove = currentNodes.filter(n => !newNodeIds.has(n.id)).map(n => n.id)
    if (nodesToRemove.length > 0) {
      nodesDataSetRef.current.remove(nodesToRemove)
    }
    
    // Update/add nodes
    nodesDataSetRef.current.update(newNodes)

    // Clear and update edges
    const currentEdges = edgesDataSetRef.current.get()
    const newEdges = convertToVisEdges()
    
    // Remove old edges
    const newEdgeIds = new Set(newEdges.map(e => e.id))
    const edgesToRemove = currentEdges.filter(e => !newEdgeIds.has(e.id)).map(e => e.id)
    if (edgesToRemove.length > 0) {
      edgesDataSetRef.current.remove(edgesToRemove)
    }
    
    // Update/add edges
    edgesDataSetRef.current.update(newEdges)
  }, [data, convertToVisNodes, convertToVisEdges])

  // Sync external selection state
  useEffect(() => {
    if (!networkRef.current) return
    
    const currentSelection = networkRef.current.getSelectedNodes() as string[]
    const sortedCurrent = [...currentSelection].sort()
    const sortedNew = [...selectedNodeIds].sort()
    
    // Only update if different
    if (JSON.stringify(sortedCurrent) !== JSON.stringify(sortedNew)) {
      networkRef.current.selectNodes(selectedNodeIds)
    }
  }, [selectedNodeIds])

  return (
    <div 
      ref={containerRef}
      data-testid="graph-container"
      style={{ width: '100%', height: '100%', minHeight: '400px' }}
    />
  )
}
