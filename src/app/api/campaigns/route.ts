import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all campaigns
export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: {
        crew: {
          select: {
            id: true,
            name: true,
            _count: {
              select: { members: true }
            }
          }
        },
        _count: {
          select: { npcs: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })
    
    return NextResponse.json(campaigns)
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

// POST create a new campaign with a default crew
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, crewName } = body
    
    if (!name) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 })
    }
    
    // Create campaign with a default crew
    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        crew: {
          create: {
            name: crewName || 'The Party',
            description: `The adventuring party for ${name}`,
          }
        }
      },
      include: {
        crew: true,
        _count: {
          select: { npcs: true }
        }
      }
    })
    
    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}
