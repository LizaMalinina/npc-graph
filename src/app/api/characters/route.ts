import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all Characters (optionally filtered by campaignId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    const characters = await prisma.character.findMany({
      where: campaignId ? { campaignId } : undefined,
      include: {
        organisations: true,
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(characters)
  } catch (error) {
    console.error('Error fetching characters:', error)
    return NextResponse.json({ error: 'Failed to fetch characters' }, { status: 500 })
  }
}

// POST create new Character
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const character = await prisma.character.create({
      data: {
        name: body.name,
        title: body.title,
        description: body.description,
        imageUrl: body.imageUrl,
        imageCrop: body.imageCrop ? JSON.stringify(body.imageCrop) : null,
        faction: body.faction,
        location: body.location,
        status: body.status || 'alive',
        tags: body.tags,
        posX: body.posX,
        posY: body.posY,
        campaignId: body.campaignId,
      },
    })
    return NextResponse.json(character, { status: 201 })
  } catch (error) {
    console.error('Error creating character:', error)
    return NextResponse.json({ error: 'Failed to create character' }, { status: 500 })
  }
}
