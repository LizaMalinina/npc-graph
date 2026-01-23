import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all crews with members
export async function GET() {
  try {
    const crews = await prisma.crew.findMany({
      include: {
        members: true,
        relationshipsFrom: {
          include: {
            toNpc: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(crews)
  } catch (error) {
    console.error('Error fetching crews:', error)
    return NextResponse.json({ error: 'Failed to fetch crews' }, { status: 500 })
  }
}

// POST create a new crew
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, imageUrl, members } = body

    const crew = await prisma.crew.create({
      data: {
        name,
        description,
        imageUrl,
        members: members ? {
          create: members.map((m: { name: string; title?: string; imageUrl?: string; description?: string }) => ({
            name: m.name,
            title: m.title,
            imageUrl: m.imageUrl,
            description: m.description,
          })),
        } : undefined,
      },
      include: {
        members: true,
      },
    })

    return NextResponse.json(crew, { status: 201 })
  } catch (error) {
    console.error('Error creating crew:', error)
    return NextResponse.json({ error: 'Failed to create crew' }, { status: 500 })
  }
}
