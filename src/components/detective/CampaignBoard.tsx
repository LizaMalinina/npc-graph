'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import DetectiveBoard from '@/components/detective/DetectiveBoard'
import DetectiveFilterPanel from '@/components/detective/DetectiveFilterPanel'
import DetectiveNpcPanel from '@/components/detective/DetectiveNpcPanel'
import DetectiveLegend from '@/components/detective/DetectiveLegend'
import NpcForm from '@/components/NpcForm'
import RelationshipForm from '@/components/RelationshipForm'
import { GraphNode, GraphLink, FilterState, Npc, Crew, GraphData } from '@/types'
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
  useUpdateCrewMember,
  useDeleteCrewMember,
  useCreateCrewRelationship,
  useCreateCrewMemberRelationship,
} from '@/hooks/useApi'

interface CampaignBoardProps {
  campaignId: string
}

export default function CampaignBoard({ campaignId }: CampaignBoardProps) {
  const [userRole, setUserRole] = useState<'viewer' | 'editor' | 'admin'>('editor')
  const canEdit = userRole === 'editor' || userRole === 'admin'

  // Mobile detection and responsive states
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [showMobileLegend, setShowMobileLegend] = useState(false)
  const [showMobileRoles, setShowMobileRoles] = useState(false)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close mobile panels when selecting a node
  useEffect(() => {
    if (isMobile) {
      setShowMobileMenu(false)
      setShowMobileFilters(false)
      setShowMobileLegend(false)
      setShowMobileRoles(false)
    }
  }, [selectedNode, isMobile])

  // Helper to toggle mobile menus exclusively
  const toggleMobilePanel = (panel: 'menu' | 'filters' | 'legend' | 'roles') => {
    setShowMobileMenu(panel === 'menu' ? !showMobileMenu : false)
    setShowMobileFilters(panel === 'filters' ? !showMobileFilters : false)
    setShowMobileLegend(panel === 'legend' ? !showMobileLegend : false)
    setShowMobileRoles(panel === 'roles' ? !showMobileRoles : false)
  }

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
  const [preselectedFromId, setPreselectedFromId] = useState<string | null>(null)
  const [parentCrewNode, setParentCrewNode] = useState<GraphNode | null>(null)
  const [editingNpc, setEditingNpc] = useState<Npc | null>(null)
  const [editingCrewMemberId, setEditingCrewMemberId] = useState<string | null>(null)
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
  const updateCrewMember = useUpdateCrewMember()
  const deleteCrewMember = useDeleteCrewMember()
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

    // Get all possible links including crew links
    let allLinks = [...graphData.links]
    const extendedData = graphData as GraphData & { 
      crewLinks?: GraphLink[]
      memberLinks?: GraphLink[]
      crews?: GraphNode[]
      crewMemberNodes?: GraphNode[]
    }
    
    // Include crew links if available
    if (extendedData.crewLinks) {
      allLinks = [...allLinks, ...extendedData.crewLinks]
    }
    // Include member links if available
    if (extendedData.memberLinks) {
      allLinks = [...allLinks, ...extendedData.memberLinks]
    }
    
    // Get all possible nodes including crews and members
    let allNodes = [...graphData.nodes]
    if (extendedData.crews) {
      allNodes = [...allNodes, ...extendedData.crews]
    }
    if (extendedData.crewMemberNodes) {
      allNodes = [...allNodes, ...extendedData.crewMemberNodes]
    }

    let relevantLinks = allLinks
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
        const target = allNodes.find(n => n.id === targetId)
        return { id: l.id, type: l.type, target: target!, description: l.description }
      })
      .filter(r => r.target)

    const to = relevantLinks
      .filter(l => {
        const targetId = typeof l.target === 'object' ? (l.target as { id: string }).id : l.target
        return targetId === selectedNode.id
      })
      .map(l => {
        const sourceId = typeof l.source === 'object' ? (l.source as { id: string }).id : l.source
        const source = allNodes.find(n => n.id === sourceId)
        return { id: l.id, type: l.type, source: source!, description: l.description }
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
    setPreselectedFromId(null)
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
      // Check if this is a crew member (ID starts with "member-")
      const isCrewMember = selectedNode.nodeType === 'crew-member' || selectedNode.id.startsWith('member-')
      
      if (isCrewMember) {
        // Extract the actual crew member ID (remove "member-" prefix if present)
        const actualId = selectedNode.id.startsWith('member-') 
          ? selectedNode.id.replace('member-', '') 
          : selectedNode.id
        setEditingCrewMemberId(actualId)
      } else {
        setEditingCrewMemberId(null)
      }
      
      setEditingNpc({
        id: selectedNode.id,
        name: selectedNode.name,
        title: selectedNode.title,
        description: selectedNode.description || null,
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
      // Check if we're editing a crew member
      if (editingCrewMemberId) {
        await updateCrewMember.mutateAsync({ 
          id: editingCrewMemberId, 
          data: {
            name: npcData.name,
            title: npcData.title || undefined,
            description: npcData.description || undefined,
            imageUrl: npcData.imageUrl || undefined,
          }
        })
      } else {
        await updateNpc.mutateAsync({ id: editingNpc.id, data: npcData })
      }
      setShowNpcForm(false)
      setEditingNpc(null)
      setEditingCrewMemberId(null)
      setSelectedNode(null)
    }
  }

  const handleDeleteNpc = async () => {
    if (editingNpc) {
      // Check if we're deleting a crew member
      if (editingCrewMemberId) {
        await deleteCrewMember.mutateAsync(editingCrewMemberId)
      } else {
        await deleteNpc.mutateAsync(editingNpc.id)
      }
      setShowNpcForm(false)
      setEditingNpc(null)
      setEditingCrewMemberId(null)
      setSelectedNode(null)
    }
  }

  const handleCreateCrewMember = async (crewId: string, data: { name: string; title?: string; description?: string; imageUrl?: string }) => {
    await addCrewMember.mutateAsync({ crewId, data })
    setShowNpcForm(false)
  }

  const handleAddConnectionFromNode = () => {
    if (selectedNode) {
      setPreselectedFromId(selectedNode.id)
      setEditingRelationship(null)
      setShowRelationshipForm(true)
    }
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

  const handleDeleteConnectionFromPanel = async (relationshipId: string) => {
    if (!confirm('Are you sure you want to delete this connection?')) {
      return
    }
    try {
      await deleteRelationship.mutateAsync(relationshipId)
    } catch (error) {
      console.error('Failed to delete connection:', error)
      alert('Failed to delete connection. Please try again.')
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

  // All nodes for relationship form (includes all regardless of view mode)
  const allNodesForForm = useMemo(() => {
    if (!graphData) return []
    
    const extendedData = graphData as typeof graphData & {
      crews?: GraphNode[]
      crewMemberNodes?: GraphNode[]
    }
    
    let nodes: GraphNode[] = graphData.nodes.map(n => ({ ...n, nodeType: n.nodeType || 'npc' as const }))
    
    if (extendedData.crews) {
      nodes = [...nodes, ...extendedData.crews.map(c => ({ ...c, nodeType: 'crew' as const }))]
    }
    if (extendedData.crewMemberNodes) {
      nodes = [...nodes, ...extendedData.crewMemberNodes.map(m => ({ ...m, nodeType: 'crew-member' as const }))]
    }
    
    return nodes
  }, [graphData])

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
    <div className={`detective-page ${isMobile ? 'is-mobile' : ''}`}>
      <div className="wood-frame">
        {/* Top toolbar */}
        <div className={`detective-toolbar ${isMobile ? 'mobile-toolbar' : ''}`}>
          <div className="toolbar-left">
            <Link href="/" className="nav-link">
              {isMobile ? '←' : '← Campaigns'}
            </Link>
            <h1 className="toolbar-title">
              {isMobile ? (campaign?.name || 'Board') : `📋 ${campaign?.name || 'Case Board'}`}
            </h1>
          </div>
          {!isMobile && (
            <div className="toolbar-center">
              <span className="stats-badge">
                {data.nodes.length} Characters • {data.links.length} Connections
              </span>
            </div>
          )}
          {!isMobile && (
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
          )}
        </div>

        {/* Mobile toolbar icons - second row */}
        {isMobile && (
          <div className="mobile-toolbar-icons">
            <button
              onClick={() => toggleMobilePanel('filters')}
              className={`toolbar-btn mobile-btn ${showMobileFilters ? 'active' : ''}`}
              title="Search & Filter"
            >
              🔍
            </button>
            {canEdit && (
              <button
                onClick={() => toggleMobilePanel('menu')}
                className={`toolbar-btn mobile-btn ${showMobileMenu ? 'active' : ''}`}
                title="Add"
              >
                ＋
              </button>
            )}
            <button
              onClick={() => toggleMobilePanel('legend')}
              className={`toolbar-btn mobile-btn ${showMobileLegend ? 'active' : ''}`}
              title="Legend"
            >
              🏷️
            </button>
            <button
              onClick={() => toggleMobilePanel('roles')}
              className={`toolbar-btn mobile-btn ${showMobileRoles ? 'active' : ''}`}
              title="Role"
            >
              {userRole === 'viewer' ? '👁️' : userRole === 'editor' ? '✏️' : '👑'}
            </button>
          </div>
        )}

        {/* Mobile action menu */}
        {isMobile && showMobileMenu && canEdit && (
          <div className="mobile-action-menu">
            <button
              onClick={() => {
                setEditingNpc(null)
                setShowNpcForm(true)
                setShowMobileMenu(false)
              }}
              className="mobile-action-btn add-npc"
            >
              📌 Add Character
            </button>
            <button
              onClick={() => {
                setEditingRelationship(null)
                setPreselectedFromId(null)
                setShowRelationshipForm(true)
                setShowMobileMenu(false)
              }}
              className="mobile-action-btn add-relation"
            >
              🧵 Add Connection
            </button>
          </div>
        )}

        {/* Mobile legend panel */}
        {isMobile && showMobileLegend && (
          <div className="mobile-legend-panel">
            <DetectiveLegend />
          </div>
        )}

        {/* Mobile role selector */}
        {isMobile && showMobileRoles && (
          <div className="mobile-role-menu">
            <button
              onClick={() => { setUserRole('viewer'); setShowMobileRoles(false) }}
              className={`mobile-role-btn ${userRole === 'viewer' ? 'active' : ''}`}
            >
              👁️ Viewer
            </button>
            <button
              onClick={() => { setUserRole('editor'); setShowMobileRoles(false) }}
              className={`mobile-role-btn ${userRole === 'editor' ? 'active' : ''}`}
            >
              ✏️ Editor
            </button>
            <button
              onClick={() => { setUserRole('admin'); setShowMobileRoles(false) }}
              className={`mobile-role-btn ${userRole === 'admin' ? 'active' : ''}`}
            >
              👑 Admin
            </button>
          </div>
        )}

        {/* Mobile filter panel */}
        {isMobile && showMobileFilters && (
          <div className="mobile-filter-panel">
            <DetectiveFilterPanel
              data={data}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
        )}

        {/* Main content */}
        <div className="detective-content">
          {/* Left sidebar - filters & actions (desktop only) */}
          {!isMobile && (
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
                      setPreselectedFromId(null)
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
          )}

          {/* Main board area */}
          <div className="detective-board-container">
            <DetectiveBoard
              data={data}
              filters={filters}
              onNodeClick={handleNodeClick}
              onLinkClick={handleLinkClick}
              canEdit={canEdit}
              selectedNodeId={selectedNode?.id ?? null}
            />
          </div>

          {/* Right panel - selected NPC details (desktop: sidebar, mobile: bottom sheet) */}
          {selectedNode && (
            <>
              {/* Mobile backdrop - click to close */}
              {isMobile && (
                <div 
                  className="mobile-sheet-backdrop"
                  onClick={() => {
                    setSelectedNode(null)
                    setParentCrewNode(null)
                  }}
                />
              )}
              <div className={`detective-detail-panel ${isMobile ? 'mobile-sheet' : ''}`}>
                <DetectiveNpcPanel
                  node={selectedNode}
                  relationships={nodeRelationships}
                  onClose={() => {
                    setSelectedNode(null)
                    setParentCrewNode(null)
                  }}
                  onEdit={handleEditNpc}
                  onAddConnection={handleAddConnectionFromNode}
                  onDeleteConnection={handleDeleteConnectionFromPanel}
                  onMemberClick={handleMemberClick}
                  onBackToCrew={handleBackToCrew}
                  parentCrew={parentCrewNode}
                  canEdit={canEdit}
                  isMobile={isMobile}
                />
              </div>
            </>
          )}
        </div>

        {/* Legend popup */}
        {showLegend && (
          <div className="legend-overlay" onClick={() => setShowLegend(false)}>
            <div className="legend-popup" onClick={e => e.stopPropagation()}>
              <DetectiveLegend />
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
            setEditingCrewMemberId(null)
          }}
          onDelete={editingNpc ? handleDeleteNpc : undefined}
          crews={crews}
          allowCharacterTypeSelection={!editingNpc}
        />
      )}

      {showRelationshipForm && (
        <RelationshipForm
          nodes={allNodesForForm}
          relationship={editingRelationship}
          preselectedFromId={preselectedFromId || undefined}
          onSubmit={editingRelationship ? handleUpdateRelationship : handleCreateRelationship}
          onCancel={() => {
            setShowRelationshipForm(false)
            setEditingRelationship(null)
            setPreselectedFromId(null)
          }}
          onDelete={editingRelationship ? handleDeleteRelationship : undefined}
        />
      )}
    </div>
  )
}
