'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import DetectiveBoard from '@/components/detective/DetectiveBoard'
import DetectiveFilterPanel from '@/components/detective/DetectiveFilterPanel'
import DetectiveNodePanel from '@/components/detective/DetectiveNodePanel'
import DetectiveLegend from '@/components/detective/DetectiveLegend'
import CharacterForm from '@/components/CharacterForm'
import OrganisationForm from '@/components/OrganisationForm'
import RelationshipForm from '@/components/RelationshipForm'
import { GraphNode, GraphLink, FilterState, Character, Organisation, GraphData, EntityType, getRelationshipColor } from '@/types'
import {
  useCampaignGraphData,
  useCampaign,
  useCreateCharacter,
  useUpdateCharacter,
  useDeleteCharacter,
  useCreateOrganisation,
  useUpdateOrganisation,
  useDeleteOrganisation,
  useCreateRelationship,
  useUpdateRelationship,
  useDeleteRelationship,
  useAddMember,
  useRemoveMember,
} from '@/hooks/useApi'
import { useMobileDetection } from '@/hooks/useMobileDetection'

interface CampaignBoardProps {
  campaignId: string
}

export default function CampaignBoard({ campaignId }: CampaignBoardProps) {
  const [userRole, setUserRole] = useState<'viewer' | 'editor' | 'admin'>('editor')
  const canEdit = userRole === 'editor' || userRole === 'admin'

  // Mobile detection and responsive states
  const isMobile = useMobileDetection()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [showMobileLegend, setShowMobileLegend] = useState(false)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)

  // Close mobile panels when selecting a node
  useEffect(() => {
    if (isMobile && selectedNode) {
      setShowMobileMenu(false)
      setShowMobileFilters(false)
      setShowMobileLegend(false)
    }
  }, [selectedNode, isMobile])

  const [filters, setFilters] = useState<FilterState>({
    factions: [],
    locations: [],
    statuses: [],
    relationshipTypes: [],
    searchQuery: '',
    viewMode: 'collapsed',
    showOrganisationsOnly: false,
    showCharactersOnly: false,
  })

  const [showCharacterForm, setShowCharacterForm] = useState(false)
  const [showOrganisationForm, setShowOrganisationForm] = useState(false)
  const [showRelationshipForm, setShowRelationshipForm] = useState(false)
  const [preselectedFromId, setPreselectedFromId] = useState<string | null>(null)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [editingOrganisation, setEditingOrganisation] = useState<Organisation | null>(null)
  const [editingRelationship, setEditingRelationship] = useState<GraphLink | null>(null)
  const [showLegend, setShowLegend] = useState(false)
  const [multiSelectedNodeIds, setMultiSelectedNodeIds] = useState<Set<string>>(new Set())
  const [isMultiSelectFilterActive, setIsMultiSelectFilterActive] = useState(false)
  const [parentOrg, setParentOrg] = useState<GraphNode | null>(null)

  // API hooks
  const { data: graphData, isLoading, error } = useCampaignGraphData(campaignId)
  const { data: campaign } = useCampaign(campaignId)
  const createCharacter = useCreateCharacter()
  const updateCharacter = useUpdateCharacter()
  const deleteCharacter = useDeleteCharacter()
  const createOrganisation = useCreateOrganisation()
  const updateOrganisation = useUpdateOrganisation()
  const deleteOrganisation = useDeleteOrganisation()
  const createRelationship = useCreateRelationship()
  const updateRelationship = useUpdateRelationship()
  const deleteRelationship = useDeleteRelationship()
  const addMember = useAddMember()
  const removeMember = useRemoveMember()

  // Get organisations from graph data
  const organisations = useMemo(() => {
    if (!graphData?.organisations) return []
    return graphData.organisations
  }, [graphData])

  // Compute relationships for selected node
  const nodeRelationships = useMemo(() => {
    if (!selectedNode || !graphData) {
      return { from: [], to: [] }
    }

    const allLinks = graphData.links || []
    const allNodes = graphData.nodes || []
    
    const fromLinks = allLinks.filter(link => link.source === selectedNode.id)
    const toLinks = allLinks.filter(link => link.target === selectedNode.id)
    
    return {
      from: fromLinks.map(link => ({
        ...link,
        targetNode: allNodes.find(n => n.id === link.target),
      })),
      to: toLinks.map(link => ({
        ...link,
        sourceNode: allNodes.find(n => n.id === link.source),
      })),
    }
  }, [selectedNode, graphData])

  // Handle node selection
  const handleNodeClick = (node: GraphNode) => {
    if (selectedNode?.id === node.id) {
      setSelectedNode(null)
    } else {
      setSelectedNode(node)
    }
  }

  // Handle creating a new character
  const handleCreateCharacter = async (data: Partial<Character>) => {
    try {
      await createCharacter.mutateAsync({
        ...data,
        campaignId: campaign?.id, // Use actual campaign ID, not slug
      })
      setShowCharacterForm(false)
    } catch (error) {
      console.error('Failed to create character:', error)
    }
  }

  // Handle creating a character as an org member
  const handleCreateOrgMember = async (orgId: string, data: { name: string; title?: string; description?: string; imageUrl?: string }) => {
    try {
      // First create the character
      const newCharacter = await createCharacter.mutateAsync({
        name: data.name,
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        campaignId: campaign?.id,
      })
      // Then add them to the organisation
      await addMember.mutateAsync({
        characterId: newCharacter.id,
        organisationId: orgId,
      })
      setShowCharacterForm(false)
    } catch (error) {
      console.error('Failed to create org member:', error)
    }
  }

  // Handle updating a character
  const handleUpdateCharacter = async (data: Partial<Character>) => {
    if (!editingCharacter) return
    try {
      await updateCharacter.mutateAsync({
        id: editingCharacter.id,
        data,
      })
      setEditingCharacter(null)
      setSelectedNode(null)
    } catch (error) {
      console.error('Failed to update character:', error)
    }
  }

  // Handle deleting a character
  const handleDeleteCharacter = async () => {
    if (!editingCharacter) return
    try {
      await deleteCharacter.mutateAsync(editingCharacter.id)
      setEditingCharacter(null)
      setSelectedNode(null)
    } catch (error) {
      console.error('Failed to delete character:', error)
    }
  }

  // Handle creating a new organisation
  const handleCreateOrganisation = async (data: Partial<Organisation>) => {
    try {
      await createOrganisation.mutateAsync({
        ...data,
        campaignId: campaign?.id, // Use actual campaign ID, not slug
      })
      setShowOrganisationForm(false)
    } catch (error) {
      console.error('Failed to create organisation:', error)
    }
  }

  // Handle updating an organisation
  const handleUpdateOrganisation = async (data: Partial<Organisation>) => {
    if (!editingOrganisation) return
    try {
      await updateOrganisation.mutateAsync({
        id: editingOrganisation.id,
        data,
      })
      setEditingOrganisation(null)
      setSelectedNode(null)
    } catch (error) {
      console.error('Failed to update organisation:', error)
    }
  }

  // Handle deleting an organisation
  const handleDeleteOrganisation = async () => {
    if (!editingOrganisation) return
    try {
      await deleteOrganisation.mutateAsync(editingOrganisation.id)
      setEditingOrganisation(null)
      setSelectedNode(null)
    } catch (error) {
      console.error('Failed to delete organisation:', error)
    }
  }

  // Handle creating a relationship
  const handleCreateRelationship = async (data: {
    fromEntityId: string
    fromEntityType: EntityType
    toEntityId: string
    toEntityType: EntityType
    type: string
    description?: string
    strength: number
  }) => {
    try {
      await createRelationship.mutateAsync(data)
      setShowRelationshipForm(false)
      setPreselectedFromId(null)
    } catch (error) {
      console.error('Failed to create relationship:', error)
    }
  }

  // Handle updating a relationship
  const handleUpdateRelationship = async (data: Partial<GraphLink>) => {
    if (!editingRelationship) return
    try {
      await updateRelationship.mutateAsync({
        id: editingRelationship.id,
        data,
      })
      setEditingRelationship(null)
    } catch (error) {
      console.error('Failed to update relationship:', error)
    }
  }

  // Handle deleting a relationship
  const handleDeleteRelationship = async () => {
    if (!editingRelationship) return
    try {
      await deleteRelationship.mutateAsync(editingRelationship.id)
      setEditingRelationship(null)
    } catch (error) {
      console.error('Failed to delete relationship:', error)
    }
  }

  // Handle adding relationship from node panel
  const handleAddRelationship = () => {
    if (!selectedNode) return
    setPreselectedFromId(selectedNode.id)
    setShowRelationshipForm(true)
  }

  // Handle editing from node panel
  const handleEditNode = () => {
    if (!selectedNode) return
    if (selectedNode.entityType === 'organisation') {
      setEditingOrganisation({
        id: selectedNode.id,
        name: selectedNode.name,
        description: selectedNode.description,
        imageUrl: selectedNode.imageUrl,
        imageCrop: selectedNode.imageCrop,
        pinColor: selectedNode.pinColor,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    } else {
      setEditingCharacter({
        id: selectedNode.id,
        name: selectedNode.name,
        title: selectedNode.title,
        description: selectedNode.description,
        imageUrl: selectedNode.imageUrl,
        imageCrop: selectedNode.imageCrop,
        faction: selectedNode.faction,
        location: selectedNode.location,
        status: selectedNode.status || 'alive',
        tags: selectedNode.tags?.join(', '),
        organisations: selectedNode.organisations as Organisation[] | undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  }

  // Handle deleting from node panel
  const handleDeleteNode = async () => {
    if (!selectedNode) return
    if (selectedNode.entityType === 'organisation') {
      await deleteOrganisation.mutateAsync(selectedNode.id)
    } else {
      await deleteCharacter.mutateAsync(selectedNode.id)
    }
    setSelectedNode(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#2d4a3e] flex items-center justify-center">
        <div className="text-white text-xl">Loading campaign...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#2d4a3e] flex items-center justify-center">
        <div className="text-red-400 text-xl">Error loading campaign</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#2d4a3e] relative overflow-hidden">
      {/* Header */}
      <header className="bg-[#1a2f27] border-b border-[#3d5a4e] px-4 py-3 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-white hover:text-gray-300 transition-colors">
            ← {!isMobile && 'Back'}
          </Link>
          <h1 className={`font-bold text-white ${isMobile ? 'text-base' : 'text-xl'}`}>{campaign?.name || 'Campaign'}</h1>
        </div>
        
        {/* View Toggle - Center (Desktop only) */}
        {!isMobile && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#2d4a3e] rounded-lg p-1">
              <button
                onClick={() => setFilters(prev => ({ ...prev, showCharactersOnly: false, showOrganisationsOnly: false }))}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  !filters.showCharactersOnly && !filters.showOrganisationsOnly
                    ? 'bg-[#4a7c59] text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, showCharactersOnly: true, showOrganisationsOnly: false }))}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filters.showCharactersOnly
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                👤 Characters
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, showOrganisationsOnly: true, showCharactersOnly: false }))}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filters.showOrganisationsOnly
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                🏛️ Organisations
              </button>
            </div>
            
            {/* Multi-select Apply/Clear buttons */}
            {multiSelectedNodeIds.size >= 2 && !isMultiSelectFilterActive && (
              <button
                onClick={() => {
                  setIsMultiSelectFilterActive(true)
                  setSelectedNode(null) // Close the details panel
                }}
                className="px-4 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium animate-pulse"
              >
                Apply ({multiSelectedNodeIds.size} selected)
              </button>
            )}
            {isMultiSelectFilterActive && (
              <button
                onClick={() => {
                  setIsMultiSelectFilterActive(false)
                  setMultiSelectedNodeIds(new Set())
                }}
                className="px-4 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
              >
                ✕ Clear Filter
              </button>
            )}
          </div>
        )}
        
        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          {isMobile && (
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-500 text-sm"
            >
              ☰
            </button>
          )}
          {!isMobile && (
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-500 text-sm"
            >
              Legend
            </button>
          )}
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {isMobile && showMobileMenu && (
        <div className="absolute top-14 right-4 z-[100] bg-gray-800 rounded-lg shadow-xl p-4 min-w-[200px]">
          <div className="space-y-3">
            {/* View Toggle */}
            <div className="space-y-2">
              <p className="text-gray-400 text-xs uppercase tracking-wide">View</p>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, showCharactersOnly: false, showOrganisationsOnly: false }))
                    setShowMobileMenu(false)
                  }}
                  className={`px-3 py-2 rounded-md text-sm text-left ${
                    !filters.showCharactersOnly && !filters.showOrganisationsOnly
                      ? 'bg-[#4a7c59] text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, showCharactersOnly: true, showOrganisationsOnly: false }))
                    setShowMobileMenu(false)
                  }}
                  className={`px-3 py-2 rounded-md text-sm text-left ${
                    filters.showCharactersOnly
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  👤 Characters
                </button>
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, showOrganisationsOnly: true, showCharactersOnly: false }))
                    setShowMobileMenu(false)
                  }}
                  className={`px-3 py-2 rounded-md text-sm text-left ${
                    filters.showOrganisationsOnly
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  🏛️ Organisations
                </button>
              </div>
            </div>
            
            {/* Actions */}
            {canEdit && (
              <div className="space-y-2 border-t border-gray-700 pt-3">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Create</p>
                <button
                  onClick={() => {
                    setShowCharacterForm(true)
                    setShowMobileMenu(false)
                  }}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded-md text-sm text-left"
                >
                  + Character
                </button>
                <button
                  onClick={() => {
                    setShowOrganisationForm(true)
                    setShowMobileMenu(false)
                  }}
                  className="w-full px-3 py-2 bg-purple-600 text-white rounded-md text-sm text-left"
                >
                  + Organisation
                </button>
              </div>
            )}
            
            {/* Other */}
            <div className="space-y-2 border-t border-gray-700 pt-3">
              <button
                onClick={() => {
                  setShowLegend(true)
                  setShowMobileMenu(false)
                }}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md text-sm text-left"
              >
                📊 Legend
              </button>
              <button
                onClick={() => {
                  setShowMobileFilters(!showMobileFilters)
                  setShowMobileMenu(false)
                }}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md text-sm text-left"
              >
                🔍 Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Filters Panel */}
      {isMobile && showMobileFilters && (
        <div className="absolute top-14 left-0 right-0 z-[99] bg-gray-800 border-b border-gray-700 p-3">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-white font-bold text-sm">Filters</h3>
            <button
              onClick={() => setShowMobileFilters(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <DetectiveFilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            graphData={graphData || { nodes: [], links: [] }}
            isMobile={true}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex h-[calc(100vh-60px)]">
        {/* Filter Panel */}
        {!isMobile && (
          <DetectiveFilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            graphData={graphData || { nodes: [], links: [] }}
            onCreateCharacter={canEdit ? () => setShowCharacterForm(true) : undefined}
            onCreateOrganisation={canEdit ? () => setShowOrganisationForm(true) : undefined}
          />
        )}

        {/* Detective Board */}
        <div className="flex-1 relative">
          <DetectiveBoard
            data={graphData || { nodes: [], links: [] }}
            filters={filters}
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedNode?.id}
            multiSelectedNodeIds={multiSelectedNodeIds}
            onMultiSelectChange={setMultiSelectedNodeIds}
            isMultiSelectFilterActive={isMultiSelectFilterActive}
          />
          
          {/* Multi-select hint overlay */}
          {multiSelectedNodeIds.size > 0 && multiSelectedNodeIds.size < 2 && !isMultiSelectFilterActive && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm">
              {isMobile 
                ? `Long-press to select more nodes (${multiSelectedNodeIds.size}/2 minimum)`
                : `Hold Ctrl and click to select more nodes (${multiSelectedNodeIds.size}/2 minimum)`
              }
            </div>
          )}
          
          {/* Mobile multi-select Apply/Clear buttons */}
          {isMobile && multiSelectedNodeIds.size >= 2 && !isMultiSelectFilterActive && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
              <button
                onClick={() => {
                  setIsMultiSelectFilterActive(true)
                  setSelectedNode(null)
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-lg animate-pulse"
              >
                Apply ({multiSelectedNodeIds.size} selected)
              </button>
            </div>
          )}
          {isMobile && isMultiSelectFilterActive && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
              <button
                onClick={() => {
                  setIsMultiSelectFilterActive(false)
                  setMultiSelectedNodeIds(new Set())
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium shadow-lg"
              >
                ✕ Clear Filter
              </button>
            </div>
          )}
        </div>

        {/* Node Panel - conditionally rendered inline on desktop */}
        {!isMobile && selectedNode && (
          <DetectiveNodePanel
            node={selectedNode}
            relationships={nodeRelationships}
            onClose={() => {
              setSelectedNode(null)
              setParentOrg(null)
            }}
            onEdit={canEdit ? handleEditNode : undefined}
            onDelete={canEdit ? handleDeleteNode : undefined}
            onAddRelationship={canEdit ? handleAddRelationship : undefined}
            onEditRelationship={canEdit ? (link: GraphLink) => setEditingRelationship(link) : undefined}
            onMemberClick={(member: GraphNode) => {
              // Remember the current org before navigating to member
              if (selectedNode.entityType === 'organisation') {
                setParentOrg(selectedNode)
              }
              setSelectedNode(member)
            }}
            parentOrg={parentOrg}
            onBackToOrg={() => {
              if (parentOrg) {
                setSelectedNode(parentOrg)
                setParentOrg(null)
              }
            }}
          />
        )}
      </div>

      {/* Mobile Bottom Sheet Panel */}
      {isMobile && selectedNode && (
        <div className="fixed bottom-0 left-0 right-0 z-[200] bg-[#1a2f27] border-t border-[#3d5a4e] max-h-[50vh] rounded-t-xl shadow-2xl animate-slide-up flex flex-col">
          {/* Fixed header */}
          <div className="flex-shrink-0 bg-[#1a2f27] border-b border-[#3d5a4e] p-3 flex items-center justify-between rounded-t-xl">
            <div className="flex items-center gap-2">
              {parentOrg && (
                <button
                  onClick={() => {
                    if (parentOrg) {
                      setSelectedNode(parentOrg)
                      setParentOrg(null)
                    }
                  }}
                  className="text-purple-300 hover:text-purple-200 text-sm"
                >
                  ←
                </button>
              )}
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                selectedNode.entityType === 'organisation' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
              }`}>
                {selectedNode.entityType === 'organisation' ? '🏛️ ORG' : '👤 CHAR'}
              </span>
              <span className="text-white font-bold text-sm truncate max-w-[150px]">{selectedNode.name}</span>
              {selectedNode.status === 'dead' && (
                <span className="text-red-400 text-xs font-bold">✕ DECEASED</span>
              )}
            </div>
            <button 
              onClick={() => {
                setSelectedNode(null)
                setParentOrg(null)
              }} 
              className="text-gray-400 hover:text-white text-lg"
            >
              ✕
            </button>
          </div>
          
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-3">
            {/* Quick info row */}
            <div className="flex gap-3 mb-3">
              {selectedNode.imageUrl && (
                <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-[#8b7355] flex-shrink-0">
                  <img
                    src={selectedNode.imageUrl}
                    alt={selectedNode.name}
                    className="w-full h-full object-cover"
                    style={selectedNode.imageCrop ? {
                      transform: `scale(${selectedNode.imageCrop.zoom}) translate(${selectedNode.imageCrop.offsetX / selectedNode.imageCrop.zoom}%, ${selectedNode.imageCrop.offsetY / selectedNode.imageCrop.zoom}%)`,
                      transformOrigin: 'center',
                    } : undefined}
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                {selectedNode.title && (
                  <p className="text-[#b8860b] text-sm italic truncate">{selectedNode.title}</p>
                )}
                {selectedNode.description && (
                  <p className="text-gray-300 text-xs line-clamp-2">{selectedNode.description}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedNode.faction && (
                    <span className="text-xs bg-green-600/30 text-green-300 px-1.5 py-0.5 rounded">{selectedNode.faction}</span>
                  )}
                  {selectedNode.location && (
                    <span className="text-xs bg-blue-600/30 text-blue-300 px-1.5 py-0.5 rounded">📍 {selectedNode.location}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Connections - one per row, clickable */}
            {(nodeRelationships.from.length > 0 || nodeRelationships.to.length > 0) && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-[#b8860b]">Connections ({nodeRelationships.from.length + nodeRelationships.to.length})</h4>
                  {canEdit && (
                    <button
                      onClick={handleAddRelationship}
                      className="text-xs bg-green-600/30 text-green-300 px-2 py-0.5 rounded hover:bg-green-600/50"
                    >
                      + Add
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {[...nodeRelationships.from, ...nodeRelationships.to].map((rel, idx) => {
                    const otherNode = 'targetNode' in rel ? rel.targetNode : rel.sourceNode
                    const isOutgoing = 'targetNode' in rel
                    const relationshipColor = getRelationshipColor(rel.type, rel.strength || 3)
                    return otherNode ? (
                      <div 
                        key={rel.id || idx} 
                        className="flex items-center gap-2 p-2 bg-[#2d4a3e] rounded-lg"
                      >
                        {/* Color indicator */}
                        <div 
                          className="w-2 h-8 rounded-full flex-shrink-0"
                          style={{ backgroundColor: relationshipColor }}
                        />
                        {/* Connection info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400 text-xs">{isOutgoing ? '→' : '←'}</span>
                            <button
                              onClick={() => {
                                const targetNode = graphData?.nodes.find(n => n.id === otherNode.id)
                                if (targetNode) {
                                  if (selectedNode.entityType === 'organisation') {
                                    setParentOrg(selectedNode)
                                  }
                                  setSelectedNode(targetNode)
                                }
                              }}
                              className="text-white text-sm font-medium truncate hover:text-[#b8860b]"
                            >
                              {otherNode.name}
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <span 
                              className="text-xs px-1.5 py-0.5 rounded"
                              style={{ 
                                backgroundColor: `${relationshipColor}30`,
                                color: relationshipColor 
                              }}
                            >
                              {rel.type}
                            </span>
                            {rel.description && (
                              <span className="text-gray-400 text-xs truncate">{rel.description}</span>
                            )}
                          </div>
                        </div>
                        {/* Edit/Delete buttons */}
                        {canEdit && (
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => setEditingRelationship(rel)}
                              className="w-7 h-7 bg-blue-600/30 text-blue-300 rounded flex items-center justify-center text-xs hover:bg-blue-600/50"
                            >
                              ✏️
                            </button>
                          </div>
                        )}
                      </div>
                    ) : null
                  })}
                </div>
              </div>
            )}

            {/* No connections message with add button */}
            {nodeRelationships.from.length === 0 && nodeRelationships.to.length === 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-[#b8860b]">Connections</h4>
                  {canEdit && (
                    <button
                      onClick={handleAddRelationship}
                      className="text-xs bg-green-600/30 text-green-300 px-2 py-0.5 rounded hover:bg-green-600/50"
                    >
                      + Add
                    </button>
                  )}
                </div>
                <p className="text-gray-500 text-xs italic">No connections yet</p>
              </div>
            )}

            {/* Organisation members - one per row */}
            {selectedNode.entityType === 'organisation' && selectedNode.members && selectedNode.members.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-bold text-[#b8860b] mb-2">Members ({selectedNode.members.length})</h4>
                <div className="space-y-1">
                  {selectedNode.members.map(member => (
                    <button
                      key={member.id}
                      onClick={() => {
                        setParentOrg(selectedNode)
                        setSelectedNode(member as GraphNode)
                      }}
                      className="w-full flex items-center gap-2 p-2 bg-purple-600/20 rounded-lg hover:bg-purple-600/30 text-left"
                    >
                      {/* Member avatar */}
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-600/30 flex-shrink-0">
                        {member.imageUrl ? (
                          <img src={member.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-purple-300 text-xs">
                            👤
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{member.name}</p>
                        {member.title && (
                          <p className="text-purple-300 text-xs truncate">{member.title}</p>
                        )}
                      </div>
                      <span className="text-purple-300 text-sm">→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Fixed footer actions */}
          {canEdit && (
            <div className="flex-shrink-0 border-t border-[#3d5a4e] p-3 bg-[#1a2f27]">
              <div className="flex gap-2">
                <button
                  onClick={handleEditNode}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                >
                  ✏️ Edit
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <DetectiveLegend 
          onClose={() => setShowLegend(false)} 
          organisations={organisations}
        />
      )}

      {/* Character Form Modal */}
      {showCharacterForm && (
        <CharacterForm
          onSubmit={handleCreateCharacter}
          onSubmitOrgMember={handleCreateOrgMember}
          onCancel={() => setShowCharacterForm(false)}
          organisations={organisations}
          allowCharacterTypeSelection={true}
          campaignId={campaign?.id}
        />
      )}

      {/* Edit Character Form Modal */}
      {editingCharacter && (
        <CharacterForm
          character={editingCharacter}
          onSubmit={handleUpdateCharacter}
          onCancel={() => setEditingCharacter(null)}
          onDelete={handleDeleteCharacter}
          organisations={organisations}
          campaignId={campaign?.id}
          onAddToOrg={async (characterId, orgId) => {
            await addMember.mutateAsync({ characterId, organisationId: orgId })
          }}
          onRemoveFromOrg={async (characterId, orgId) => {
            await removeMember.mutateAsync({ characterId, organisationId: orgId })
          }}
        />
      )}

      {/* Organisation Form Modal */}
      {showOrganisationForm && (
        <OrganisationForm
          onSubmit={handleCreateOrganisation}
          onCancel={() => setShowOrganisationForm(false)}
          campaignId={campaign?.id}
          existingOrganisations={organisations}
        />
      )}

      {/* Edit Organisation Form Modal */}
      {editingOrganisation && (
        <OrganisationForm
          organisation={editingOrganisation}
          onSubmit={handleUpdateOrganisation}
          onCancel={() => setEditingOrganisation(null)}
          onDelete={handleDeleteOrganisation}
          campaignId={campaign?.id}
          existingOrganisations={organisations}
        />
      )}

      {/* Relationship Form Modal */}
      {showRelationshipForm && (
        <RelationshipForm
          nodes={graphData?.nodes || []}
          existingLinks={graphData?.links || []}
          preselectedFromId={preselectedFromId}
          onSubmit={handleCreateRelationship}
          onCancel={() => {
            setShowRelationshipForm(false)
            setPreselectedFromId(null)
          }}
        />
      )}

      {/* Edit Relationship Form Modal */}
      {editingRelationship && (
        <RelationshipForm
          nodes={graphData?.nodes || []}
          existingLinks={graphData?.links || []}
          relationship={editingRelationship}
          onSubmit={handleUpdateRelationship}
          onCancel={() => setEditingRelationship(null)}
          onDelete={handleDeleteRelationship}
        />
      )}
    </div>
  )
}
