import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET single NPC
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const npc = await prisma.npc.findUnique({
      where: { id },
      include: {
        relationshipsFrom: {
          include: { toNpc: true },
        },
        relationshipsTo: {
          include: { fromNpc: true },
        },
      },
    })
    
    if (!npc) {
      return NextResponse.json({ error: 'NPC not found' }, { status: 404 })
    }
    
    return NextResponse.json(npc)
  } catch (error) {
    console.error('Error fetching NPC:', error)
    return NextResponse.json({ error: 'Failed to fetch NPC' }, { status: 500 })
  }
}

// PUT update NPC
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const npc = await prisma.npc.update({
      where: { id },
      data: {
        name: body.name,
        title: body.title,
        description: body.description,
        imageUrl: body.imageUrl,
        faction: body.faction,
        location: body.location,
        status: body.status,
        tags: body.tags,
        posX: body.posX,
        posY: body.posY,
        campaignId: body.campaignId,
      },
    })
    
    return NextResponse.json(npc)
  } catch (error) {
    console.error('Error updating NPC:', error)
    return NextResponse.json({ error: 'Failed to update NPC' }, { status: 500 })
  }
}

// DELETE NPC
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.npc.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting NPC:', error)
    return NextResponse.json({ error: 'Failed to delete NPC' }, { status: 500 })
  }
}
