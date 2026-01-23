'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import DetectiveBoard from '@/components/detective/DetectiveBoard'
import DetectiveFilterPanel from '@/components/detective/DetectiveFilterPanel'
import DetectiveNpcPanel from '@/components/detective/DetectiveNpcPanel'
import DetectiveLegend from '@/components/detective/DetectiveLegend'
import NpcForm from '@/components/NpcForm'
import RelationshipForm from '@/components/RelationshipForm'
import { GraphNode, GraphLink, FilterState, Npc, Crew } from '@/types'
import {
  useGraphData,
  useCreateNpc,
  useUpdateNpc,
  useDeleteNpc,
  useCreateRelationship,
  useUpdateRelationship,
  useDeleteRelationship,
  useCrews,
  useAddCrewMember,
} from '@/hooks/useApi'

export default function DetectiveGraphPage() {
  const [userRole, setUserRole] = useState<'viewer' | 'editor' | 'admin'>('editor')
  const canEdit = userRole === 'editor' || userRole === 'admin'

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

  const [showNpcForm, setShowNpcForm] = useState(false)
  const [showRelationshipForm, setShowRelationshipForm] = useState(false)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [parentCrewNode, setParentCrewNode] = useState<GraphNode | null>(null)
  const [editingNpc, setEditingNpc] = useState<Npc | null>(null)
  const [editingRelationship, setEditingRelationship] = useState<GraphLink | null>(null)
  const [showLegend, setShowLegend] = useState(false)

  // API hooks
  const { data: graphData, isLoading, error } = useGraphData()
  const { data: crews = [] } = useCrews()
  const createNpc = useCreateNpc()
  const updateNpc = useUpdateNpc()
  const deleteNpc = useDeleteNpc()
  const createRelationship = useCreateRelationship()
  const updateRelationship = useUpdateRelationship()
  const addCrewMember = useAddCrewMember()
  const deleteRelationship = useDeleteRelationship()

  // Compute relationships for selected node
  const nodeRelationships = useMemo(() => {
    if (!selectedNode || !graphData) {
      return { from: [], to: [] }
    }

    let relevantLinks = graphData.links
    if (filters.relationshipTypes.length > 0) {
      relevantLinks = relevantLinks.filter(l => filters.relationshipTypes.includes(l.type))
    }

    const from = relevantLinks
      .filter(l => {
        const sourceId = typeof l.source === 'object' ? (l.source as { id: string }).id : l.source
        return sourceId === selectedNode.id
      })
      .map(l => {
        const targetId = typeof l.target === 'object' ? (l.target as { id: string }).id : l.target
        const target = graphData.nodes.find(n => n.id === targetId)
        return { type: l.type, target: target!, description: l.description }
      })
      .filter(r => r.target)

    const to = relevantLinks
      .filter(l => {
        const targetId = typeof l.target === 'object' ? (l.target as { id: string }).id : l.target
        return targetId === selectedNode.id
      })
      .map(l => {
        const sourceId = typeof l.source === 'object' ? (l.source as { id: string }).id : l.source
        const source = graphData.nodes.find(n => n.id === sourceId)
        return { type: l.type, source: source!, description: l.description }
      })
      .filter(r => r.source)

    return { from, to }
  }, [selectedNode, graphData, filters.relationshipTypes])

  // Handlers
  const handleNodeClick = (node: GraphNode) => {
    // If clicking from a board node (not from within a panel), clear parent crew
    if (!selectedNode || selectedNode.id !== node.id) {
      setParentCrewNode(null)
    }
    setSelectedNode(node)
    setEditingRelationship(null)
  }

  // Handle clicking a crew member from within a crew panel
  const handleMemberClick = (member: GraphNode) => {
    // Store the current crew node as parent before switching to member
    if (selectedNode?.nodeType === 'crew') {
      setParentCrewNode(selectedNode)
    }
    setSelectedNode(member)
    setEditingRelationship(null)
  }

  // Handle going back to parent crew
  const handleBackToCrew = () => {
    if (parentCrewNode) {
      setSelectedNode(parentCrewNode)
      setParentCrewNode(null)
    }
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

  const handleCreateCrewMember = async (crewId: string, data: { name: string; title?: string; description?: string; imageUrl?: string }) => {
    await addCrewMember.mutateAsync({ crewId, data })
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

  const data = useMemo(() => {
    const emptyGraphData = { nodes: [] as GraphNode[], links: [] as GraphLink[] }
    if (!graphData) return emptyGraphData
    
    // Get graph data with type assertion for extended properties
    const extendedData = graphData as typeof graphData & {
      crews?: GraphNode[]
      crewMemberNodes?: GraphNode[]
      crewLinks?: GraphLink[]
      memberLinks?: (GraphLink & { crewId?: string })[]
    }
    
    // Debug logging
    console.log('[DetectiveGraphPage] Computing data...')
    console.log('[DetectiveGraphPage] filters:', JSON.stringify({ 
      crewViewMode: filters.crewViewMode, 
      showCrewMembersOnly: filters.showCrewMembersOnly, 
      showNpcsOnly: filters.showNpcsOnly 
    }))
    console.log('[DetectiveGraphPage] extendedData crews:', extendedData.crews?.length ?? 0)
    console.log('[DetectiveGraphPage] extendedData crewMemberNodes:', extendedData.crewMemberNodes?.length ?? 0)
    
    // Start with NPC nodes (unless filtering for crew members only)
    let allNodes: GraphNode[] = filters.showCrewMembersOnly 
      ? [] 
      : graphData.nodes.map(n => ({ ...n, nodeType: n.nodeType || 'npc' as const }))
    
    let allLinks: GraphLink[] = filters.showCrewMembersOnly
      ? []
      : graphData.links.map(l => ({
          ...l,
          source: typeof l.source === 'object' ? (l.source as { id: string }).id : l.source,
          target: typeof l.target === 'object' ? (l.target as { id: string }).id : l.target,
        }))
    
    // Add crew-related nodes and links based on view mode
    // If showCrewMembersOnly is true, always show crews/members regardless of NPCs Only filter
    if (!filters.showNpcsOnly) {
      if (filters.crewViewMode === 'collapsed') {
        // Show crews as single nodes
        if (extendedData.crews) {
          allNodes = [...allNodes, ...extendedData.crews.map(c => ({ ...c, nodeType: 'crew' as const }))]
        }
        if (extendedData.crewLinks) {
          allLinks = [...allLinks, ...extendedData.crewLinks]
        }
      } else {
        // Show individual crew members (expanded mode)
        if (extendedData.crewMemberNodes) {
          allNodes = [...allNodes, ...extendedData.crewMemberNodes.map(m => ({ ...m, nodeType: 'crew-member' as const }))]
        }
        if (extendedData.memberLinks) {
          allLinks = [...allLinks, ...extendedData.memberLinks]
        }
      }
    }
    
    console.log('[DetectiveGraphPage] RESULT:', { nodesCount: allNodes.length, linksCount: allLinks.length, nodeTypes: allNodes.map(n => n.nodeType) })
    
    return {
      nodes: allNodes,
      links: allLinks,
    }
  }, [graphData, filters.crewViewMode, filters.showCrewMembersOnly, filters.showNpcsOnly])

  if (isLoading) {
    return (
      <div className="detective-loading">
        <div className="loading-content">
          <div className="magnifying-glass">🔍</div>
          <p>Gathering evidence...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="detective-error">
        <div className="error-content">
          <p className="error-text">Case file corrupted!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="detective-page">
      {/* Wooden frame border */}
      <div className="wood-frame">
        {/* Top toolbar */}
        <div className="detective-toolbar">
          <div className="toolbar-left">
            <Link href="/" className="nav-link">
              ← Classic View
            </Link>
            <h1 className="toolbar-title">📋 Case Board: NPC Network</h1>
          </div>
          <div className="toolbar-center">
            <span className="stats-badge">
              {data.nodes.length} Characters • {data.links.length} Connections
            </span>
          </div>
          <div className="toolbar-right">
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="toolbar-btn"
            >
              🏷️ Legend
            </button>
            <select
              value={userRole}
              onChange={e => setUserRole(e.target.value as 'viewer' | 'editor' | 'admin')}
              className="role-select"
            >
              <option value="viewer">👁️ Viewer</option>
              <option value="editor">✏️ Editor</option>
              <option value="admin">👑 Admin</option>
            </select>
          </div>
        </div>

        {/* Main content */}
        <div className="detective-content">
          {/* Left sidebar - filters & actions */}
          <div className="detective-sidebar">
            {canEdit && (
              <div className="action-buttons">
                <button
                  onClick={() => {
                    setEditingNpc(null)
                    setShowNpcForm(true)
                  }}
                  className="action-btn add-npc"
                >
                  📌 Add Character
                </button>
                <button
                  onClick={() => {
                    setEditingRelationship(null)
                    setShowRelationshipForm(true)
                  }}
                  className="action-btn add-relation"
                >
                  🧵 Add Connection
                </button>
              </div>
            )}

            <DetectiveFilterPanel
              data={data}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>

          {/* Main board area */}
          <div className="detective-board-container">
            <DetectiveBoard
              data={data}
              filters={filters}
              onNodeClick={handleNodeClick}
              onLinkClick={handleLinkClick}
              canEdit={canEdit}
            />
          </div>

          {/* Right panel - selected NPC details */}
          {selectedNode && (
            <div className="detective-detail-panel">
              <DetectiveNpcPanel
                node={selectedNode}
                relationships={nodeRelationships}
                onClose={() => {
                  setSelectedNode(null)
                  setParentCrewNode(null)
                }}
                onEdit={handleEditNpc}
                onMemberClick={handleMemberClick}
                onBackToCrew={handleBackToCrew}
                parentCrew={parentCrewNode}
                canEdit={canEdit}
              />
            </div>
          )}
        </div>

        {/* Legend popup */}
        {showLegend && (
          <div className="legend-overlay" onClick={() => setShowLegend(false)}>
            <div className="legend-popup" onClick={e => e.stopPropagation()}>
              <DetectiveLegend onClose={() => setShowLegend(false)} />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNpcForm && (
        <NpcForm
          npc={editingNpc}
          onSubmit={editingNpc ? handleUpdateNpc : handleCreateNpc}
          onSubmitCrewMember={handleCreateCrewMember}
          onCancel={() => {
            setShowNpcForm(false)
            setEditingNpc(null)
          }}
          onDelete={editingNpc ? handleDeleteNpc : undefined}
          crews={crews}
          allowCharacterTypeSelection={!editingNpc}
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
