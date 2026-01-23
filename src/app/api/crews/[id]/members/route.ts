import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST add a member to a crew
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: crewId } = await params
    const body = await request.json()
    const { name, title, imageUrl, description } = body

    const member = await prisma.crewMember.create({
      data: {
        crewId,
        name,
        title,
        imageUrl,
        description,
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error adding crew member:', error)
    return NextResponse.json({ error: 'Failed to add crew member' }, { status: 500 })
  }
}
