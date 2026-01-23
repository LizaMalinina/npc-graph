import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all NPCs
export async function GET() {
  try {
    const npcs = await prisma.npc.findMany({
      include: {
        relationshipsFrom: true,
        relationshipsTo: true,
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(npcs)
  } catch (error) {
    console.error('Error fetching NPCs:', error)
    return NextResponse.json({ error: 'Failed to fetch NPCs' }, { status: 500 })
  }
}

// POST create new NPC
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const npc = await prisma.npc.create({
      data: {
        name: body.name,
        title: body.title,
        description: body.description,
        imageUrl: body.imageUrl,
        faction: body.faction,
        location: body.location,
        status: body.status || 'alive',
        tags: body.tags,
        posX: body.posX,
        posY: body.posY,
      },
    })
    return NextResponse.json(npc, { status: 201 })
  } catch (error) {
    console.error('Error creating NPC:', error)
    return NextResponse.json({ error: 'Failed to create NPC' }, { status: 500 })
  }
}
