import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET a single crew by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const crew = await prisma.crew.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            relationshipsFrom: {
              include: {
                toNpc: true,
              },
            },
          },
        },
        relationshipsFrom: {
          include: {
            toNpc: true,
          },
        },
      },
    })

    if (!crew) {
      return NextResponse.json({ error: 'Crew not found' }, { status: 404 })
    }

    return NextResponse.json(crew)
  } catch (error) {
    console.error('Error fetching crew:', error)
    return NextResponse.json({ error: 'Failed to fetch crew' }, { status: 500 })
  }
}

// PUT update a crew
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, imageUrl } = body

    const crew = await prisma.crew.update({
      where: { id },
      data: {
        name,
        description,
        imageUrl,
      },
      include: {
        members: true,
      },
    })

    return NextResponse.json(crew)
  } catch (error) {
    console.error('Error updating crew:', error)
    return NextResponse.json({ error: 'Failed to update crew' }, { status: 500 })
  }
}

// DELETE a crew
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.crew.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting crew:', error)
    return NextResponse.json({ error: 'Failed to delete crew' }, { status: 500 })
  }
}
