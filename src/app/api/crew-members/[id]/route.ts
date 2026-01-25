import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET a single crew member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const member = await prisma.crewMember.findUnique({
      where: { id },
      include: { crew: true },
    })

    if (!member) {
      return NextResponse.json({ error: 'Crew member not found' }, { status: 404 })
    }

    return NextResponse.json(member)
  } catch (error) {
    console.error('Error fetching crew member:', error)
    return NextResponse.json({ error: 'Failed to fetch crew member' }, { status: 500 })
  }
}

// PUT update a crew member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, title, imageUrl, description } = body

    const member = await prisma.crewMember.update({
      where: { id },
      data: {
        name,
        title,
        imageUrl,
        description,
      },
    })

    return NextResponse.json(member)
  } catch (error) {
    console.error('Error updating crew member:', error)
    return NextResponse.json({ error: 'Failed to update crew member' }, { status: 500 })
  }
}

// DELETE a crew member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.crewMember.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting crew member:', error)
    return NextResponse.json({ error: 'Failed to delete crew member' }, { status: 500 })
  }
}
