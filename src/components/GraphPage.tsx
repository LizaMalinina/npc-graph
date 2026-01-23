'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import NpcGraph from '@/components/NpcGraph'
import FilterPanel from '@/components/FilterPanel'
import NpcForm from '@/components/NpcForm'
import RelationshipForm from '@/components/RelationshipForm'
import NpcDetailPanel from '@/components/NpcDetailPanel'
import Legend from '@/components/Legend'
import { GraphNode, GraphLink, FilterState, Npc } from '@/types'
import {
  useGraphData,
  useCreateNpc,
  useUpdateNpc,
  useDeleteNpc,
  useCreateRelationship,
  useUpdateRelationship,
  useDeleteRelationship,
} from '@/hooks/useApi'

export default function GraphPage() {
  // For now, we'll use a simple state for user role
  // In production, this would come from authentication
  const [userRole, setUserRole] = useState<'viewer' | 'editor' | 'admin'>('editor')
  const canEdit = userRole === 'editor' || userRole === 'admin'

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    factions: [],
    locations: [],
    statuses: [],
    relationshipTypes: [],
    searchQuery: '',
    crewViewMode: 'collapsed',
    showCrewMembersOnly: false,
    showNpcsOnly: false,
  })

  // Modal states
  const [showNpcForm, setShowNpcForm] = useState(false)
  const [showRelationshipForm, setShowRelationshipForm] = useState(false)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [editingNpc, setEditingNpc] = useState<Npc | null>(null)
  const [editingRelationship, setEditingRelationship] = useState<GraphLink | null>(null)

  // API hooks
  const { data: graphData, isLoading, error } = useGraphData()
  const createNpc = useCreateNpc()
  const updateNpc = useUpdateNpc()
  const deleteNpc = useDeleteNpc()
  const createRelationship = useCreateRelationship()
  const updateRelationship = useUpdateRelationship()
  const deleteRelationship = useDeleteRelationship()

  // Compute relationships for selected node
  // Shows ALL relationships for selected node, filtered only by relationship type if set
  const nodeRelationships = useMemo(() => {
    if (!selectedNode || !graphData) {
      return { from: [], to: [] }
    }

    // Get all links for this node (ignoring search/faction/location filters)
    let relevantLinks = graphData.links

    // Only apply relationship type filter if set
    if (filters.relationshipTypes.length > 0) {
      relevantLinks = relevantLinks.filter(l => filters.relationshipTypes.includes(l.type))
    }

    const from = relevantLinks
      .filter(l => l.source === selectedNode.id || (l.source as any).id === selectedNode.id)
      .map(l => {
        const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target
        const target = graphData.nodes.find(n => n.id === targetId)
        return { type: l.type, target: target!, description: l.description }
      })
      .filter(r => r.target)

    const to = relevantLinks
      .filter(l => l.target === selectedNode.id || (l.target as any).id === selectedNode.id)
      .map(l => {
        const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source
        const source = graphData.nodes.find(n => n.id === sourceId)
        return { type: l.type, source: source!, description: l.description }
      })
      .filter(r => r.source)

    return { from, to }
  }, [selectedNode, graphData, filters.relationshipTypes])

  // Handlers
  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node)
    setEditingRelationship(null)
  }

  const handleLinkClick = (link: GraphLink) => {
    if (canEdit) {
      setEditingRelationship(link)
      setShowRelationshipForm(true)
    }
  }

  const handleCreateNpc = async (data: Partial<Npc>) => {
    await createNpc.mutateAsync(data)
    setShowNpcForm(false)
  }

  const handleUpdateNpc = async (data: Partial<Npc>) => {
    if (editingNpc) {
      await updateNpc.mutateAsync({ id: editingNpc.id, data })
      setEditingNpc(null)
      setSelectedNode(null)
    }
  }

  const handleDeleteNpc = async () => {
    if (editingNpc && confirm('Are you sure you want to delete this NPC?')) {
      await deleteNpc.mutateAsync(editingNpc.id)
      setEditingNpc(null)
      setSelectedNode(null)
    }
  }

  const handleCreateRelationship = async (data: {
    fromNpcId: string
    toNpcId: string
    type: string
    description?: string
    strength: number
  }) => {
    await createRelationship.mutateAsync(data)
    setShowRelationshipForm(false)
  }

  const handleUpdateRelationship = async (data: {
    fromNpcId: string
    toNpcId: string
    type: string
    description?: string
    strength: number
  }) => {
    if (editingRelationship) {
      await updateRelationship.mutateAsync({
        id: editingRelationship.id,
        data: { type: data.type, description: data.description, strength: data.strength },
      })
      setEditingRelationship(null)
      setShowRelationshipForm(false)
    }
  }

  const handleDeleteRelationship = async () => {
    if (editingRelationship && confirm('Are you sure you want to delete this relationship?')) {
      await deleteRelationship.mutateAsync(editingRelationship.id)
      setEditingRelationship(null)
      setShowRelationshipForm(false)
    }
  }

  const handleEditNpc = () => {
    if (selectedNode) {
      setEditingNpc({
        id: selectedNode.id,
        name: selectedNode.name,
        title: selectedNode.title,
        description: null,
        imageUrl: selectedNode.imageUrl,
        faction: selectedNode.faction,
        location: selectedNode.location,
        status: selectedNode.status || 'alive',
        tags: selectedNode.tags?.join(', ') || null,
        posX: selectedNode.x,
        posY: selectedNode.y,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  }

  // Create a stable deep clone of graph data to prevent react-force-graph from mutating the cache
  // This hook must be called before any conditional returns
  const data = useMemo(() => {
    const emptyGraphData = { nodes: [], links: [] }
    if (!graphData) return emptyGraphData
    return {
      nodes: graphData.nodes.map(n => ({ ...n })),
      links: graphData.links.map(l => ({
        ...l,
        // Ensure source/target are always strings (not object refs from previous mutation)
        source: typeof l.source === 'object' ? (l.source as any).id : l.source,
        target: typeof l.target === 'object' ? (l.target as any).id : l.target,
      })),
    }
  }, [graphData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Loading NPC Graph...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-red-500 text-xl">Error loading graph data</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Left Sidebar */}
      <div className="w-72 p-4 space-y-4 overflow-y-auto border-r border-gray-700">
        {/* Detective Board Link */}
        <Link 
          href="/detective" 
          className="block w-full px-4 py-3 bg-amber-700 hover:bg-amber-600 text-white rounded-md transition-colors text-center font-medium"
        >
          🔍 Detective Board View →
        </Link>

        {/* Role Selector (for demo) */}
        <div className="bg-gray-800 rounded-lg p-4 text-white">
          <label className="block text-sm font-medium mb-2">View As:</label>
          <select
            value={userRole}
            onChange={e => setUserRole(e.target.value as any)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
          >
            <option value="viewer">Viewer (Read Only)</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Action Buttons */}
        {canEdit && (
          <div className="space-y-2">
            <button
              onClick={() => {
                setEditingNpc(null)
                setShowNpcForm(true)
              }}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
            >
              + Add NPC
            </button>
            <button
              onClick={() => {
                setEditingRelationship(null)
                setShowRelationshipForm(true)
              }}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              + Add Relationship
            </button>
          </div>
        )}

        {/* Filters */}
        <FilterPanel
          data={data}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Legend */}
        <Legend />
      </div>

      {/* Main Graph Area */}
      <div className="flex-1 relative">
        <NpcGraph
          data={data}
          filters={filters}
          onNodeClick={handleNodeClick}
          onLinkClick={handleLinkClick}
          canEdit={canEdit}
        />

        {/* Stats Overlay */}
        <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-90 rounded-lg px-4 py-2 text-white">
          <span className="text-sm">
            {data.nodes.length} NPCs • {data.links.length} Relationships
          </span>
        </div>
      </div>

      {/* Right Sidebar - Detail Panel */}
      {selectedNode && (
        <div className="w-80 p-4 border-l border-gray-700">
          <NpcDetailPanel
            node={selectedNode}
            relationships={nodeRelationships}
            onClose={() => setSelectedNode(null)}
            onEdit={handleEditNpc}
            canEdit={canEdit}
          />
        </div>
      )}

      {/* Modals */}
      {showNpcForm && (
        <NpcForm
          npc={editingNpc}
          onSubmit={editingNpc ? handleUpdateNpc : handleCreateNpc}
          onCancel={() => {
            setShowNpcForm(false)
            setEditingNpc(null)
          }}
          onDelete={editingNpc ? handleDeleteNpc : undefined}
        />
      )}

      {editingNpc && !showNpcForm && (
        <NpcForm
          npc={editingNpc}
          onSubmit={handleUpdateNpc}
          onCancel={() => setEditingNpc(null)}
          onDelete={handleDeleteNpc}
        />
      )}

      {showRelationshipForm && (
        <RelationshipForm
          nodes={data.nodes}
          relationship={editingRelationship}
          onSubmit={editingRelationship ? handleUpdateRelationship : handleCreateRelationship}
          onCancel={() => {
            setShowRelationshipForm(false)
            setEditingRelationship(null)
          }}
          onDelete={editingRelationship ? handleDeleteRelationship : undefined}
        />
      )}
    </div>
  )
}
