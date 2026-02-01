import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET single Universal Relationship
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const relationship = await prisma.universalRelationship.findUnique({
      where: { id },
    })
    
    if (!relationship) {
      return NextResponse.json({ error: 'Relationship not found' }, { status: 404 })
    }
    
    return NextResponse.json(relationship)
  } catch (error) {
    console.error('Error fetching universal relationship:', error)
    return NextResponse.json({ error: 'Failed to fetch relationship' }, { status: 500 })
  }
}

// PUT update Universal Relationship
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const relationship = await prisma.universalRelationship.update({
      where: { id },
      data: {
        type: body.type,
        description: body.description,
        strength: body.strength,
      },
    })
    
    return NextResponse.json(relationship)
  } catch (error) {
    console.error('Error updating universal relationship:', error)
    return NextResponse.json({ error: 'Failed to update relationship' }, { status: 500 })
  }
}

// DELETE Universal Relationship
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.universalRelationship.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting universal relationship:', error)
    return NextResponse.json({ error: 'Failed to delete relationship' }, { status: 500 })
  }
}
