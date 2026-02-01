import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all organisations a character belongs to
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const character = await prisma.character.findUnique({
      where: { id },
      include: { organisations: true },
    })

    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    return NextResponse.json(character.organisations)
  } catch (error) {
    console.error('Error fetching character memberships:', error)
    return NextResponse.json({ error: 'Failed to fetch memberships' }, { status: 500 })
  }
}

// POST add character to organisation(s)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if character exists
    const existingCharacter = await prisma.character.findUnique({
      where: { id },
    })

    if (!existingCharacter) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    // Get organisation IDs from either single or multiple format
    const organisationIds: string[] = body.organisationIds || 
      (body.organisationId ? [body.organisationId] : [])

    if (organisationIds.length === 0) {
      return NextResponse.json({ 
        error: 'organisationId or organisationIds is required' 
      }, { status: 400 })
    }

    // Connect character to organisations
    const character = await prisma.character.update({
      where: { id },
      data: {
        organisations: {
          connect: organisationIds.map(orgId => ({ id: orgId })),
        },
      },
      include: { organisations: true },
    })

    return NextResponse.json(character)
  } catch (error) {
    console.error('Error adding character membership:', error)
    return NextResponse.json({ error: 'Failed to add membership' }, { status: 500 })
  }
}
