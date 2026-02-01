import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE remove character from an organisation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; orgId: string }> }
) {
  try {
    const { id, orgId } = await params

    // Check if character exists
    const existingCharacter = await prisma.character.findUnique({
      where: { id },
    })

    if (!existingCharacter) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    // Disconnect character from organisation
    const character = await prisma.character.update({
      where: { id },
      data: {
        organisations: {
          disconnect: { id: orgId },
        },
      },
      include: { organisations: true },
    })

    return NextResponse.json(character)
  } catch (error) {
    console.error('Error removing character membership:', error)
    return NextResponse.json({ error: 'Failed to remove membership' }, { status: 500 })
  }
}
