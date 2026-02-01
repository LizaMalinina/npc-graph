import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper to find campaign by id or slug
async function findCampaign(idOrSlug: string) {
  // Try by id first (cuid format), then by slug
  let campaign = await prisma.campaign.findUnique({
    where: { id: idOrSlug },
    include: {
      characters: {
        include: {
          organisations: true
        }
      },
      organisations: {
        include: {
          members: true
        }
      }
    }
  })
  
  if (!campaign) {
    campaign = await prisma.campaign.findUnique({
      where: { slug: idOrSlug },
      include: {
        characters: {
          include: {
            organisations: true
          }
        },
        organisations: {
          include: {
            members: true
          }
        }
      }
    })
  }
  
  return campaign
}

// GET single campaign with all data
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const campaign = await findCampaign(id)
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }
    
    // Parse imageCrop from JSON string to object
    const parsedCampaign = {
      ...campaign,
      imageCrop: campaign.imageCrop ? JSON.parse(campaign.imageCrop) : null
    }
    
    return NextResponse.json(parsedCampaign)
  } catch (error) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 })
  }
}

// PUT update campaign
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const body = await request.json()
    const { name, description, imageUrl, imageCrop, isActive } = body
    
    // Find campaign by id or slug to get the actual id
    const existing = await findCampaign(id)
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }
    
    const campaign = await prisma.campaign.update({
      where: { id: existing.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(imageCrop !== undefined && { imageCrop: imageCrop ? JSON.stringify(imageCrop) : null }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        _count: {
          select: { 
            characters: true,
            organisations: true 
          }
        }
      }
    })
    
    // Parse imageCrop back to object for response
    const parsedCampaign = {
      ...campaign,
      imageCrop: campaign.imageCrop ? JSON.parse(campaign.imageCrop) : null
    }
    
    return NextResponse.json(parsedCampaign)
  } catch (error) {
    console.error('Error updating campaign:', error)
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
  }
}

// DELETE campaign
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    // Find campaign by id or slug to get the actual id
    const existing = await findCampaign(id)
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }
    
    await prisma.campaign.delete({
      where: { id: existing.id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
  }
}
