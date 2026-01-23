import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT update relationship
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const relationship = await prisma.relationship.update({
      where: { id },
      data: {
        type: body.type,
        description: body.description,
        strength: body.strength,
      },
      include: {
        fromNpc: true,
        toNpc: true,
      },
    })
    
    return NextResponse.json(relationship)
  } catch (error) {
    console.error('Error updating relationship:', error)
    return NextResponse.json({ error: 'Failed to update relationship' }, { status: 500 })
  }
}

// DELETE relationship
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.relationship.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting relationship:', error)
    return NextResponse.json({ error: 'Failed to delete relationship' }, { status: 500 })
  }
}
