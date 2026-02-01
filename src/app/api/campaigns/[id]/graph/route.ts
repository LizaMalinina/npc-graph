import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EntityType, CropSettings } from '@/types'

// Helper to parse imageCrop JSON string
function parseImageCrop(imageCrop: string | null): CropSettings | null {
  if (!imageCrop) return null
  try {
    return JSON.parse(imageCrop) as CropSettings
  } catch {
    return null
  }
}

// Helper to find campaign by id or slug
async function findCampaignWithData(idOrSlug: string) {
  // Try by id first (cuid format), then by slug
  let campaign = await prisma.campaign.findUnique({
    where: { id: idOrSlug },
    include: {
      characters: {
        include: {
          organisations: true
        }
      },
      organisations: {
        include: {
          members: true
        }
      }
    }
  })
  
  if (!campaign) {
    campaign = await prisma.campaign.findUnique({
      where: { slug: idOrSlug },
      include: {
        characters: {
          include: {
            organisations: true
          }
        },
        organisations: {
          include: {
            members: true
          }
        }
      }
    })
  }
  
  return campaign
}

// GET graph data for a specific campaign
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const campaign = await findCampaignWithData(id)
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }
    
    // Get all entity IDs for relationship lookup
    const characterIds = campaign.characters.map(c => c.id)
    const organisationIds = campaign.organisations.map(o => o.id)
    const allEntityIds = [...characterIds, ...organisationIds]
    
    // Get all relationships involving these entities
    const relationships = await prisma.universalRelationship.findMany({
      where: {
        OR: [
          { fromEntityId: { in: allEntityIds } },
          { toEntityId: { in: allEntityIds } }
        ]
      }
    })
    
    // Character nodes
    const characterNodes = campaign.characters.map(char => ({
      id: char.id,
      name: char.name,
      title: char.title,
      description: char.description,
      imageUrl: char.imageUrl,
      imageCrop: parseImageCrop(char.imageCrop),
      faction: char.faction,
      location: char.location,
      status: char.status,
      tags: char.tags ? char.tags.split(',').map(t => t.trim()) : [],
      x: char.posX,
      y: char.posY,
      entityType: 'character' as EntityType,
      // Get pin color from first organisation, or null for white pin
      pinColor: char.organisations.length > 0 ? char.organisations[0].pinColor : null,
      organisations: char.organisations.map(org => ({
        id: org.id,
        name: org.name,
        pinColor: org.pinColor,
      })),
    }))
    
    // Organisation nodes
    const organisationNodes = campaign.organisations.map(org => ({
      id: org.id,
      name: org.name,
      title: `${org.members.length} members`,
      description: org.description,
      imageUrl: org.imageUrl,
      imageCrop: parseImageCrop(org.imageCrop),
      pinColor: org.pinColor,
      faction: null,
      location: null,
      status: 'active',
      tags: ['organisation'],
      x: org.posX,
      y: org.posY,
      entityType: 'organisation' as EntityType,
      members: org.members.map(m => ({
        id: m.id,
        name: m.name,
        title: m.title,
        description: m.description,
        imageUrl: m.imageUrl,
        imageCrop: parseImageCrop(m.imageCrop),
        faction: m.faction,
        location: m.location,
        status: m.status,
        tags: m.tags ? m.tags.split(',').map(t => t.trim()) : [],
        entityType: 'character' as EntityType,
        pinColor: org.pinColor, // Inherit from org
      })),
    }))
    
    // All relationship links
    const links = relationships.map(rel => ({
      id: rel.id,
      source: rel.fromEntityId,
      sourceType: rel.fromEntityType as EntityType,
      target: rel.toEntityId,
      targetType: rel.toEntityType as EntityType,
      type: rel.type,
      description: rel.description,
      strength: rel.strength,
    }))
    
    return NextResponse.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
      },
      nodes: [...characterNodes, ...organisationNodes],
      links,
      organisations: campaign.organisations.map(o => ({
        id: o.id,
        name: o.name,
        description: o.description,
        imageUrl: o.imageUrl,
        pinColor: o.pinColor,
        members: o.members,
        _count: { members: o.members.length }
      })),
    })
  } catch (error) {
    console.error('Error fetching campaign graph data:', error)
    return NextResponse.json({ error: 'Failed to fetch graph data' }, { status: 500 })
  }
}
