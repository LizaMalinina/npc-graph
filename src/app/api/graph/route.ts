import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET graph data (optimized for visualization)
export async function GET() {
  try {
    const [npcs, relationships] = await Promise.all([
      prisma.npc.findMany(),
      prisma.relationship.findMany(),
    ])
    
    const nodes = npcs.map(npc => ({
      id: npc.id,
      name: npc.name,
      title: npc.title,
      imageUrl: npc.imageUrl,
      faction: npc.faction,
      location: npc.location,
      status: npc.status,
      tags: npc.tags ? npc.tags.split(',').map(t => t.trim()) : [],
      x: npc.posX,
      y: npc.posY,
    }))
    
    const links = relationships.map(rel => ({
      id: rel.id,
      source: rel.fromNpcId,
      target: rel.toNpcId,
      type: rel.type,
      description: rel.description,
      strength: rel.strength,
    }))
    
    return NextResponse.json({ nodes, links })
  } catch (error) {
    console.error('Error fetching graph data:', error)
    return NextResponse.json({ error: 'Failed to fetch graph data' }, { status: 500 })
  }
}
