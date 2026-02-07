import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils'
import { getCurrentUser } from '@/lib/auth'

// Ensure slug is unique by appending a number if needed
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug
  let counter = 1
  
  while (await prisma.campaign.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`
    counter++
  }
  
  return slug
}

// GET all campaigns
export async function GET() {
  try {
    const user = await getCurrentUser()
    
    const campaigns = await prisma.campaign.findMany({
      include: {
        _count: {
          select: { 
            characters: true,
            organisations: true 
          }
        },
        editors: user ? {
          where: { userId: user.id },
          select: { id: true }
        } : false
      },
      orderBy: { updatedAt: 'desc' }
    })
    
    // Parse imageCrop from JSON string to object and add canEdit
    const parsedCampaigns = campaigns.map(campaign => {
      // Determine if user can edit this campaign
      let canEdit = false
      if (user) {
        if (user.role === 'admin') {
          canEdit = true
        } else if (user.role === 'editor') {
          // Editor can edit if they created it or are assigned
          const isCreator = campaign.creatorId === user.id
          const isAssigned = campaign.editors && campaign.editors.length > 0
          canEdit = isCreator || isAssigned
        }
      }
      
      // Remove editors array from response (internal only)
      const { editors, ...campaignData } = campaign
      
      return {
        ...campaignData,
        imageCrop: campaign.imageCrop ? JSON.parse(campaign.imageCrop) : null,
        canEdit
      }
    })
    
    return NextResponse.json(parsedCampaigns)
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

// POST create a new campaign
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, imageUrl, imageCrop, organisationName } = body
    
    if (!name) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 })
    }
    
    // Get the current user to set as creator
    const user = await getCurrentUser()
    
    // Generate unique slug from name
    const baseSlug = generateSlug(name)
    const slug = await ensureUniqueSlug(baseSlug || 'campaign')
    
    // Create campaign, optionally with an initial organisation
    const campaign = await prisma.campaign.create({
      data: {
        name,
        slug,
        description,
        imageUrl,
        imageCrop: imageCrop ? JSON.stringify(imageCrop) : null,
        creatorId: user?.id || null,
        ...(organisationName && {
          organisations: {
            create: {
              name: organisationName,
              description: `The adventuring party for ${name}`,
            }
          }
        })
      },
      include: {
        organisations: true,
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
    
    return NextResponse.json(parsedCampaign, { status: 201 })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}
