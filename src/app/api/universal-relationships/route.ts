import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all Universal Relationships (optionally filtered by entityId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entityId = searchParams.get('entityId')

    const where = entityId
      ? {
          OR: [
            { fromEntityId: entityId },
            { toEntityId: entityId },
          ],
        }
      : undefined

    const relationships = await prisma.universalRelationship.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(relationships)
  } catch (error) {
    console.error('Error fetching universal relationships:', error)
    return NextResponse.json({ error: 'Failed to fetch relationships' }, { status: 500 })
  }
}

// POST create new Universal Relationship
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.fromEntityId || !body.fromEntityType || !body.toEntityId || !body.toEntityType || !body.type) {
      return NextResponse.json({ 
        error: 'fromEntityId, fromEntityType, toEntityId, toEntityType, and type are required' 
      }, { status: 400 })
    }

    const relationship = await prisma.universalRelationship.create({
      data: {
        fromEntityId: body.fromEntityId,
        fromEntityType: body.fromEntityType,
        toEntityId: body.toEntityId,
        toEntityType: body.toEntityType,
        type: body.type,
        description: body.description,
        strength: body.strength ?? 5,
      },
    })
    return NextResponse.json(relationship, { status: 201 })
  } catch (error) {
    console.error('Error creating universal relationship:', error)
    return NextResponse.json({ error: 'Failed to create relationship' }, { status: 500 })
  }
}
