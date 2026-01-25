import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper to find campaign by id or slug
async function findCampaignWithData(idOrSlug: string) {
  // Try by id first (cuid format), then by slug
  let campaign = await prisma.campaign.findUnique({
    where: { id: idOrSlug },
    include: {
      crew: {
        include: {
          members: true,
          relationshipsFrom: true
        }
      },
      npcs: true
    }
  })
  
  if (!campaign) {
    campaign = await prisma.campaign.findUnique({
      where: { slug: idOrSlug },
      include: {
        crew: {
          include: {
            members: true,
            relationshipsFrom: true
          }
        },
        npcs: true
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
    
    // Get relationships for this campaign's NPCs
    const npcIds = campaign.npcs.map(n => n.id)
    const relationships = await prisma.relationship.findMany({
      where: {
        OR: [
          { fromNpcId: { in: npcIds } },
          { toNpcId: { in: npcIds } }
        ]
      }
    })
    
    // Get crew member relationships
    const crewMemberIds = campaign.crew?.members.map(m => m.id) || []
    const crewMemberRelationships = await prisma.crewMemberRelationship.findMany({
      where: {
        crewMemberId: { in: crewMemberIds }
      },
      include: {
        crewMember: true
      }
    })
    
    // NPC nodes
    const npcNodes = campaign.npcs.map(npc => ({
      id: npc.id,
      name: npc.name,
      title: npc.title,
      description: npc.description,
      imageUrl: npc.imageUrl,
      faction: npc.faction,
      location: npc.location,
      status: npc.status,
      tags: npc.tags ? npc.tags.split(',').map(t => t.trim()) : [],
      x: npc.posX,
      y: npc.posY,
      nodeType: 'npc' as const,
    }))
    
    // Crew node (for collapsed view)
    const crewNodes = campaign.crew ? [{
      id: `crew-${campaign.crew.id}`,
      name: campaign.crew.name,
      title: `${campaign.crew.members.length} members`,
      description: campaign.crew.description,
      imageUrl: campaign.crew.imageUrl,
      faction: null,
      location: null,
      status: 'alive',
      tags: ['crew'],
      nodeType: 'crew' as const,
      members: campaign.crew.members.map(m => ({
        id: `member-${m.id}`,
        name: m.name,
        title: m.title,
        description: m.description,
        imageUrl: m.imageUrl,
        faction: null,
        location: null,
        status: 'alive',
        tags: ['crew-member'],
        nodeType: 'crew-member' as const,
        crewId: campaign.crew!.id,
      })),
    }] : []
    
    // Crew member nodes (for expanded view)
    const crewMemberNodes = campaign.crew?.members.map(m => ({
      id: `member-${m.id}`,
      name: m.name,
      title: m.title,
      description: m.description,
      imageUrl: m.imageUrl,
      faction: null,
      location: null,
      status: 'alive',
      tags: ['crew-member'],
      nodeType: 'crew-member' as const,
      crewId: campaign.crew!.id,
    })) || []
    
    // NPC to NPC relationships
    const npcLinks = relationships.map(rel => ({
      id: rel.id,
      source: rel.fromNpcId,
      target: rel.toNpcId,
      type: rel.type,
      description: rel.description,
      strength: rel.strength,
      linkSource: 'npc' as const,
    }))
    
    // Crew to NPC relationships
    const crewLinks = campaign.crew?.relationshipsFrom.map(rel => ({
      id: `crew-rel-${rel.id}`,
      source: `crew-${rel.crewId}`,
      target: rel.toNpcId,
      type: rel.type,
      description: rel.description,
      strength: rel.strength,
      linkSource: 'crew' as const,
    })) || []
    
    // Crew member to NPC relationships
    const memberLinks = crewMemberRelationships.map(rel => ({
      id: `member-rel-${rel.id}`,
      source: `member-${rel.crewMemberId}`,
      target: rel.toNpcId,
      type: rel.type,
      description: rel.description,
      strength: rel.strength,
      linkSource: 'crew-member' as const,
      crewId: rel.crewMember.crewId,
    }))
    
    return NextResponse.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
      },
      nodes: npcNodes,
      links: npcLinks,
      crews: crewNodes,
      crewMemberNodes,
      crewLinks,
      memberLinks,
    })
  } catch (error) {
    console.error('Error fetching campaign graph data:', error)
    return NextResponse.json({ error: 'Failed to fetch graph data' }, { status: 500 })
  }
}
