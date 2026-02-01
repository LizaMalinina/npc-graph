import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils'

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
    const campaigns = await prisma.campaign.findMany({
      include: {
        _count: {
          select: { 
            characters: true,
            organisations: true 
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })
    
    // Parse imageCrop from JSON string to object
    const parsedCampaigns = campaigns.map(campaign => ({
      ...campaign,
      imageCrop: campaign.imageCrop ? JSON.parse(campaign.imageCrop) : null
    }))
    
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
