import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Npc, Relationship, Crew, CrewMember, CrewRelationship, CrewMemberRelationship } from '@prisma/client'

type CrewWithMembers = Crew & { members: CrewMember[] }
type CrewMemberRelationshipWithMember = CrewMemberRelationship & { crewMember: CrewMember }

// GET graph data (optimized for visualization)
export async function GET() {
  try {
    const [npcs, relationships, crews, crewRelationships, crewMemberRelationships] = await Promise.all([
      prisma.npc.findMany(),
      prisma.relationship.findMany(),
      prisma.crew.findMany({
        include: {
          members: true,
        },
      }),
      prisma.crewRelationship.findMany(),
      prisma.crewMemberRelationship.findMany({
        include: {
          crewMember: true,
        },
      }),
    ]) as [Npc[], Relationship[], CrewWithMembers[], CrewRelationship[], CrewMemberRelationshipWithMember[]]
    
    // NPC nodes
    const npcNodes = npcs.map((npc: Npc) => ({
      id: npc.id,
      name: npc.name,
      title: npc.title,
      imageUrl: npc.imageUrl,
      faction: npc.faction,
      location: npc.location,
      status: npc.status,
      tags: npc.tags ? npc.tags.split(',').map((t: string) => t.trim()) : [],
      x: npc.posX,
      y: npc.posY,
      nodeType: 'npc' as const,
    }))
    
    // Crew nodes (for collapsed view)
    const crewNodes = crews.map((crew: CrewWithMembers) => ({
      id: `crew-${crew.id}`,
      name: crew.name,
      title: `Crew (${crew.members.length} members)`,
      imageUrl: crew.imageUrl,
      faction: null,
      location: null,
      status: 'alive',
      tags: ['crew'],
      nodeType: 'crew' as const,
      members: crew.members.map((m: CrewMember) => ({
        id: `member-${m.id}`,
        name: m.name,
        title: m.title,
        imageUrl: m.imageUrl,
        faction: null,
        location: null,
        status: 'alive',
        tags: ['crew-member'],
        nodeType: 'crew-member' as const,
        crewId: crew.id,
      })),
    }))
    
    // Crew member nodes (for expanded view)
    const crewMemberNodes = crews.flatMap((crew: CrewWithMembers) => 
      crew.members.map((m: CrewMember) => ({
        id: `member-${m.id}`,
        name: m.name,
        title: m.title,
        imageUrl: m.imageUrl,
        faction: null,
        location: null,
        status: 'alive',
        tags: ['crew-member'],
        nodeType: 'crew-member' as const,
        crewId: crew.id,
      }))
    )
    
    // NPC to NPC relationships
    const npcLinks = relationships.map((rel: Relationship) => ({
      id: rel.id,
      source: rel.fromNpcId,
      target: rel.toNpcId,
      type: rel.type,
      description: rel.description,
      strength: rel.strength,
      linkSource: 'npc' as const,
    }))
    
    // Crew to NPC relationships
    const crewLinks = crewRelationships.map((rel: CrewRelationship) => ({
      id: `crew-rel-${rel.id}`,
      source: `crew-${rel.crewId}`,
      target: rel.toNpcId,
      type: rel.type,
      description: rel.description,
      strength: rel.strength,
      linkSource: 'crew' as const,
    }))
    
    // Crew member to NPC relationships
    const memberLinks = crewMemberRelationships.map((rel: CrewMemberRelationshipWithMember) => ({
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
      nodes: npcNodes, 
      links: npcLinks,
      crews: crewNodes,
      crewMemberNodes,
      crewLinks,
      memberLinks,
    })
  } catch (error) {
    console.error('Error fetching graph data:', error)
    return NextResponse.json({ error: 'Failed to fetch graph data' }, { status: 500 })
  }
}
