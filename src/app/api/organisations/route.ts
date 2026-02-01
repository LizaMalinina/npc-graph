import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all Organisations (optionally filtered by campaignId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    const organisations = await prisma.organisation.findMany({
      where: campaignId ? { campaignId } : undefined,
      include: {
        members: true,
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(organisations)
  } catch (error) {
    console.error('Error fetching organisations:', error)
    return NextResponse.json({ error: 'Failed to fetch organisations' }, { status: 500 })
  }
}

// POST create new Organisation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const organisation = await prisma.organisation.create({
      data: {
        name: body.name,
        description: body.description,
        imageUrl: body.imageUrl,
        imageCrop: body.imageCrop ? JSON.stringify(body.imageCrop) : null,
        pinColor: body.pinColor,
        posX: body.posX,
        posY: body.posY,
        campaignId: body.campaignId,
      },
    })
    return NextResponse.json(organisation, { status: 201 })
  } catch (error) {
    console.error('Error creating organisation:', error)
    return NextResponse.json({ error: 'Failed to create organisation' }, { status: 500 })
  }
}
