import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET single Character
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const character = await prisma.character.findUnique({
      where: { id },
      include: {
        organisations: true,
      },
    })
    
    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }
    
    return NextResponse.json(character)
  } catch (error) {
    console.error('Error fetching character:', error)
    return NextResponse.json({ error: 'Failed to fetch character' }, { status: 500 })
  }
}

// PUT update Character
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const character = await prisma.character.update({
      where: { id },
      data: {
        name: body.name,
        title: body.title,
        description: body.description,
        imageUrl: body.imageUrl,
        imageCrop: body.imageCrop ? JSON.stringify(body.imageCrop) : null,
        faction: body.faction,
        location: body.location,
        status: body.status,
        tags: body.tags,
        posX: body.posX,
        posY: body.posY,
        campaignId: body.campaignId,
      },
    })
    
    return NextResponse.json(character)
  } catch (error) {
    console.error('Error updating character:', error)
    return NextResponse.json({ error: 'Failed to update character' }, { status: 500 })
  }
}

// DELETE Character
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.character.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting character:', error)
    return NextResponse.json({ error: 'Failed to delete character' }, { status: 500 })
  }
}
