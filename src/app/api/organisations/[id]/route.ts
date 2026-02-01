import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET single Organisation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const organisation = await prisma.organisation.findUnique({
      where: { id },
      include: {
        members: true,
      },
    })
    
    if (!organisation) {
      return NextResponse.json({ error: 'Organisation not found' }, { status: 404 })
    }
    
    return NextResponse.json(organisation)
  } catch (error) {
    console.error('Error fetching organisation:', error)
    return NextResponse.json({ error: 'Failed to fetch organisation' }, { status: 500 })
  }
}

// PUT update Organisation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const organisation = await prisma.organisation.update({
      where: { id },
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
    
    return NextResponse.json(organisation)
  } catch (error) {
    console.error('Error updating organisation:', error)
    return NextResponse.json({ error: 'Failed to update organisation' }, { status: 500 })
  }
}

// DELETE Organisation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.organisation.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting organisation:', error)
    return NextResponse.json({ error: 'Failed to delete organisation' }, { status: 500 })
  }
}
