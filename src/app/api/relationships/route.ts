import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all relationships
export async function GET() {
  try {
    const relationships = await prisma.relationship.findMany({
      include: {
        fromNpc: true,
        toNpc: true,
      },
    })
    return NextResponse.json(relationships)
  } catch (error) {
    console.error('Error fetching relationships:', error)
    return NextResponse.json({ error: 'Failed to fetch relationships' }, { status: 500 })
  }
}

// POST create new relationship
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Check if relationship already exists
    const existing = await prisma.relationship.findFirst({
      where: {
        fromNpcId: body.fromNpcId,
        toNpcId: body.toNpcId,
        type: body.type,
      },
    })
    
    if (existing) {
      return NextResponse.json(
        { error: 'Relationship already exists' },
        { status: 400 }
      )
    }
    
    const relationship = await prisma.relationship.create({
      data: {
        fromNpcId: body.fromNpcId,
        toNpcId: body.toNpcId,
        type: body.type,
        description: body.description,
        strength: body.strength || 5,
      },
      include: {
        fromNpc: true,
        toNpc: true,
      },
    })
    
    return NextResponse.json(relationship, { status: 201 })
  } catch (error) {
    console.error('Error creating relationship:', error)
    return NextResponse.json({ error: 'Failed to create relationship' }, { status: 500 })
  }
}
