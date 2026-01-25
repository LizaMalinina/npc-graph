import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all crew member relationships
export async function GET() {
  try {
    const relationships = await prisma.crewMemberRelationship.findMany({
      include: {
        crewMember: {
          include: {
            crew: true,
          },
        },
        toNpc: true,
      },
    })

    return NextResponse.json(relationships)
  } catch (error) {
    console.error('Error fetching crew member relationships:', error)
    return NextResponse.json({ error: 'Failed to fetch crew member relationships' }, { status: 500 })
  }
}

// POST create a crew member relationship (crew member to NPC)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { crewMemberId, toNpcId, type, description, strength } = body

    const relationship = await prisma.crewMemberRelationship.create({
      data: {
        crewMemberId,
        toNpcId,
        type,
        description,
        strength: strength || 5,
      },
      include: {
        crewMember: true,
        toNpc: true,
      },
    })

    return NextResponse.json(relationship, { status: 201 })
  } catch (error) {
    console.error('Error creating crew member relationship:', error)
    return NextResponse.json({ error: 'Failed to create crew member relationship' }, { status: 500 })
  }
}

// DELETE crew member relationship by ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }
    
    await prisma.crewMemberRelationship.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting crew member relationship:', error)
    return NextResponse.json({ error: 'Failed to delete crew member relationship' }, { status: 500 })
  }
}
