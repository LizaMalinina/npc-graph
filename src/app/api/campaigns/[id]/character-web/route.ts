import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CharacterWebNode, CharacterWebLink, CharacterWebData, CharacterWebViewMode } from '@/types'

// Helper to find campaign by id or slug
async function findCampaign(idOrSlug: string) {
  // Try by ID first
  let campaign = await prisma.campaign.findUnique({
    where: { id: idOrSlug },
  })
  
  // If not found, try by slug
  if (!campaign) {
    campaign = await prisma.campaign.findUnique({
      where: { slug: idOrSlug },
    })
  }
  
  return campaign
}

// GET Character Web graph data for a campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idOrSlug } = await params
    const { searchParams } = new URL(request.url)
    
    const viewMode = (searchParams.get('viewMode') || 'all') as CharacterWebViewMode
    const selectedEntityIdsParam = searchParams.get('selectedEntityIds')
    const selectedEntityIds = selectedEntityIdsParam ? selectedEntityIdsParam.split(',') : null

    // Verify campaign exists (by ID or slug)
    const campaign = await findCampaign(idOrSlug)

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const campaignId = campaign.id

    // Fetch characters and organisations based on view mode
    let characters: Array<{
      id: string
      name: string
      title: string | null
      description: string | null
      imageUrl: string | null
      faction: string | null
      location: string | null
      status: string
      tags: string | null
      posX: number | null
      posY: number | null
    }> = []
    
    let organisations: Array<{
      id: string
      name: string
      description: string | null
      imageUrl: string | null
      posX: number | null
      posY: number | null
    }> = []

    if (viewMode === 'all' || viewMode === 'characters') {
      characters = await prisma.character.findMany({
        where: { campaignId },
        select: {
          id: true,
          name: true,
          title: true,
          description: true,
          imageUrl: true,
          faction: true,
          location: true,
          status: true,
          tags: true,
          posX: true,
          posY: true,
        },
      })
    }

    if (viewMode === 'all' || viewMode === 'organisations') {
      organisations = await prisma.organisation.findMany({
        where: { campaignId },
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          posX: true,
          posY: true,
        },
      })
    }

    // Build node list
    let nodes: CharacterWebNode[] = [
      ...characters.map(c => ({
        id: c.id,
        name: c.name,
        entityType: 'character' as const,
        title: c.title,
        description: c.description,
        imageUrl: c.imageUrl,
        faction: c.faction,
        location: c.location,
        status: c.status,
        tags: c.tags ? c.tags.split(',').map(t => t.trim()) : undefined,
        x: c.posX ?? undefined,
        y: c.posY ?? undefined,
      })),
      ...organisations.map(o => ({
        id: o.id,
        name: o.name,
        entityType: 'organisation' as const,
        description: o.description,
        imageUrl: o.imageUrl,
        x: o.posX ?? undefined,
        y: o.posY ?? undefined,
      })),
    ]

    // Collect all entity IDs for relationship filtering
    const allEntityIds = nodes.map(n => n.id)

    // Fetch relationships based on view mode
    let relationshipWhere: object = {}
    
    if (viewMode === 'characters') {
      relationshipWhere = {
        fromEntityType: 'character',
        toEntityType: 'character',
        fromEntityId: { in: allEntityIds },
        toEntityId: { in: allEntityIds },
      }
    } else if (viewMode === 'organisations') {
      relationshipWhere = {
        fromEntityType: 'organisation',
        toEntityType: 'organisation',
        fromEntityId: { in: allEntityIds },
        toEntityId: { in: allEntityIds },
      }
    } else {
      // All view - get all relationships between entities in this campaign
      relationshipWhere = {
        fromEntityId: { in: allEntityIds },
        toEntityId: { in: allEntityIds },
      }
    }

    const relationships = await prisma.universalRelationship.findMany({
      where: relationshipWhere,
    })

    // Build links
    let links: CharacterWebLink[] = relationships.map(r => ({
      id: r.id,
      source: r.fromEntityId,
      sourceType: r.fromEntityType as 'character' | 'organisation',
      target: r.toEntityId,
      targetType: r.toEntityType as 'character' | 'organisation',
      type: r.type,
      description: r.description,
      strength: r.strength,
    }))

    // Apply selectedEntityIds filter if provided
    if (selectedEntityIds && selectedEntityIds.length > 0) {
      // Find all entities directly connected to selected entities
      const connectedIds = new Set<string>(selectedEntityIds)
      
      for (const link of links) {
        if (selectedEntityIds.includes(link.source)) {
          connectedIds.add(link.target)
        }
        if (selectedEntityIds.includes(link.target)) {
          connectedIds.add(link.source)
        }
      }

      // Filter nodes to only include selected and directly connected
      nodes = nodes.filter(n => connectedIds.has(n.id))
      
      // Filter links to only include those between remaining nodes
      const remainingNodeIds = new Set(nodes.map(n => n.id))
      links = links.filter(l => 
        remainingNodeIds.has(l.source) && remainingNodeIds.has(l.target)
      )
    }

    const graphData: CharacterWebData = {
      nodes,
      links,
    }

    return NextResponse.json(graphData)
  } catch (error) {
    console.error('Error fetching character web graph:', error)
    return NextResponse.json({ error: 'Failed to fetch graph data' }, { status: 500 })
  }
}
