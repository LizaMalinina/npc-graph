import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all crew relationships
export async function GET() {
  try {
    const relationships = await prisma.crewRelationship.findMany({
      include: {
        crew: true,
        toNpc: true,
      },
    })

    return NextResponse.json(relationships)
  } catch (error) {
    console.error('Error fetching crew relationships:', error)
    return NextResponse.json({ error: 'Failed to fetch crew relationships' }, { status: 500 })
  }
}

// POST create a crew relationship (crew to NPC)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { crewId, toNpcId, type, description, strength } = body

    const relationship = await prisma.crewRelationship.create({
      data: {
        crewId,
        toNpcId,
        type,
        description,
        strength: strength || 5,
      },
      include: {
        crew: true,
        toNpc: true,
      },
    })

    return NextResponse.json(relationship, { status: 201 })
  } catch (error) {
    console.error('Error creating crew relationship:', error)
    return NextResponse.json({ error: 'Failed to create crew relationship' }, { status: 500 })
  }
}

// DELETE crew relationship by ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }
    
    await prisma.crewRelationship.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting crew relationship:', error)
    return NextResponse.json({ error: 'Failed to delete crew relationship' }, { status: 500 })
  }
}

// PUT update crew relationship by ID
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }
    
    const body = await request.json()
    const { type, description, strength } = body
    
    const relationship = await prisma.crewRelationship.update({
      where: { id },
      data: {
        type,
        description,
        strength,
      },
      include: {
        crew: true,
        toNpc: true,
      },
    })
    
    return NextResponse.json(relationship)
  } catch (error) {
    console.error('Error updating crew relationship:', error)
    return NextResponse.json({ error: 'Failed to update crew relationship' }, { status: 500 })
  }
}
