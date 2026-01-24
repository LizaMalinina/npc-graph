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
  useCampaignGraphData,
  useCampaign,
  useCreateNpc,
  useUpdateNpc,
  useDeleteNpc,
  useCreateRelationship,
  useUpdateRelationship,
  useDeleteRelationship,
  useAddCrewMember,
  useCreateCrewRelationship,
  useCreateCrewMemberRelationship,
} from '@/hooks/useApi'

interface CampaignBoardProps {
  campaignId: string
}

export default function CampaignBoard({ campaignId }: CampaignBoardProps) {
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

  // API hooks - use campaign-specific data
  const { data: graphData, isLoading, error } = useCampaignGraphData(campaignId)
  const { data: campaign } = useCampaign(campaignId)
  const createNpc = useCreateNpc()
  const updateNpc = useUpdateNpc()
  const deleteNpc = useDeleteNpc()
  const createRelationship = useCreateRelationship()
  const updateRelationship = useUpdateRelationship()
  const addCrewMember = useAddCrewMember()
  const deleteRelationship = useDeleteRelationship()
  const createCrewRelationship = useCreateCrewRelationship()
  const createCrewMemberRelationship = useCreateCrewMemberRelationship()

  // Get crew from graph data
  const crews = useMemo(() => {
    if (!graphData?.crews) return []
    return graphData.crews.map(c => ({
      id: c.id.replace('crew-', ''),
      name: c.name,
      description: null,
      imageUrl: c.imageUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
      members: c.members,
    })) as Crew[]
  }, [graphData])

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
    if (!selectedNode || selectedNode.id !== node.id) {
      setParentCrewNode(null)
    }
    setSelectedNode(node)
  }

  const handleLinkClick = (link: GraphLink) => {
    setEditingRelationship(link)
    setShowRelationshipForm(true)
  }

  const handleMemberClick = (member: GraphNode) => {
    // Find the parent crew from graph data
    const crewNode = graphData?.crews?.find(c => 
      c.members?.some(m => m.id === member.id || `member-${m.id}` === member.id)
    )
    if (crewNode) {
      setParentCrewNode(crewNode as GraphNode)
    }
    setSelectedNode(member)
  }

  const handleBackToCrew = () => {
    if (parentCrewNode) {
      setSelectedNode(parentCrewNode)
      setParentCrewNode(null)
    }
  }

  const handleEditNpc = () => {
    if (selectedNode && selectedNode.nodeType !== 'crew') {
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
        campaignId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      setShowNpcForm(true)
    }
  }

  const handleCreateNpc = async (npcData: Partial<Npc>) => {
    await createNpc.mutateAsync({ ...npcData, campaignId })
    setShowNpcForm(false)
  }

  const handleUpdateNpc = async (npcData: Partial<Npc>) => {
    if (editingNpc) {
      await updateNpc.mutateAsync({ id: editingNpc.id, data: npcData })
      setShowNpcForm(false)
      setEditingNpc(null)
      setSelectedNode(null)
    }
  }

  const handleDeleteNpc = async () => {
    if (editingNpc) {
      await deleteNpc.mutateAsync(editingNpc.id)
      setShowNpcForm(false)
      setEditingNpc(null)
      setSelectedNode(null)
    }
  }

  const handleCreateCrewMember = async (crewId: string, data: { name: string; title?: string; description?: string; imageUrl?: string }) => {
    await addCrewMember.mutateAsync({ crewId, data })
    setShowNpcForm(false)
  }

  const handleCreateRelationship = async (relData: {
    fromNpcId: string
    toNpcId: string
    type: string
    description?: string
    strength: number
  }) => {
    const { fromNpcId, toNpcId, type, description, strength } = relData
    if (fromNpcId && toNpcId && type) {
      try {
        const isFromCrew = fromNpcId.startsWith('crew-')
        const isFromCrewMember = fromNpcId.startsWith('member-')
        const isToCrew = toNpcId.startsWith('crew-')
        const isToCrewMember = toNpcId.startsWith('member-')
        
        if (isFromCrew && !isToCrew && !isToCrewMember) {
          // Crew to NPC relationship
          const crewId = fromNpcId.replace('crew-', '')
          await createCrewRelationship.mutateAsync({
            crewId,
            toNpcId,
            type,
            description: description ?? undefined,
            strength: strength ?? 5,
          })
        } else if (isFromCrewMember && !isToCrew && !isToCrewMember) {
          // Crew member to NPC relationship
          const crewMemberId = fromNpcId.replace('member-', '')
          await createCrewMemberRelationship.mutateAsync({
            crewMemberId,
            toNpcId,
            type,
            description: description ?? undefined,
            strength: strength ?? 5,
          })
        } else if (!isFromCrew && !isFromCrewMember && isToCrew) {
          // NPC to Crew relationship - create as crew to NPC (reverse direction)
          const crewId = toNpcId.replace('crew-', '')
          await createCrewRelationship.mutateAsync({
            crewId,
            toNpcId: fromNpcId,
            type,
            description: description ?? undefined,
            strength: strength ?? 5,
          })
        } else if (!isFromCrew && !isFromCrewMember && isToCrewMember) {
          // NPC to Crew Member relationship - create as crew member to NPC (reverse direction)
          const crewMemberId = toNpcId.replace('member-', '')
          await createCrewMemberRelationship.mutateAsync({
            crewMemberId,
            toNpcId: fromNpcId,
            type,
            description: description ?? undefined,
            strength: strength ?? 5,
          })
        } else if (!isFromCrew && !isFromCrewMember && !isToCrew && !isToCrewMember) {
          // NPC to NPC relationship
          await createRelationship.mutateAsync({
            fromNpcId,
            toNpcId,
            type,
            description: description ?? undefined,
            strength: strength ?? 5,
          })
        } else {
          console.error('Unsupported relationship type combination')
        }
      } catch (error) {
        console.error('Failed to create relationship:', error)
      }
    }
    setShowRelationshipForm(false)
  }

  const handleUpdateRelationship = async (relData: {
    fromNpcId: string
    toNpcId: string
    type: string
    description?: string
    strength: number
  }) => {
    if (editingRelationship) {
      await updateRelationship.mutateAsync({ 
        id: editingRelationship.id, 
        data: {
          type: relData.type,
          description: relData.description,
          strength: relData.strength,
        }
      })
      setShowRelationshipForm(false)
      setEditingRelationship(null)
    }
  }

  const handleDeleteRelationship = async () => {
    if (editingRelationship) {
      await deleteRelationship.mutateAsync(editingRelationship.id)
      setShowRelationshipForm(false)
      setEditingRelationship(null)
    }
  }

  // Compose data for board
  const data = useMemo(() => {
    const emptyGraphData = { nodes: [] as GraphNode[], links: [] as GraphLink[] }
    if (!graphData) return emptyGraphData
    
    const extendedData = graphData as typeof graphData & {
      crews?: GraphNode[]
      crewMemberNodes?: GraphNode[]
      crewLinks?: GraphLink[]
      memberLinks?: (GraphLink & { crewId?: string })[]
    }
    
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
    
    if (!filters.showNpcsOnly) {
      if (filters.crewViewMode === 'collapsed') {
        if (extendedData.crews) {
          allNodes = [...allNodes, ...extendedData.crews.map(c => ({ ...c, nodeType: 'crew' as const }))]
        }
        if (extendedData.crewLinks) {
          allLinks = [...allLinks, ...extendedData.crewLinks]
        }
      } else {
        if (extendedData.crewMemberNodes) {
          allNodes = [...allNodes, ...extendedData.crewMemberNodes.map(m => ({ ...m, nodeType: 'crew-member' as const }))]
        }
        if (extendedData.memberLinks) {
          allLinks = [...allLinks, ...extendedData.memberLinks]
        }
      }
    }
    
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
      <div className="wood-frame">
        {/* Top toolbar */}
        <div className="detective-toolbar">
          <div className="toolbar-left">
            <Link href="/" className="nav-link">
              ← Campaigns
            </Link>
            <h1 className="toolbar-title">📋 {campaign?.name || 'Case Board'}</h1>
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
