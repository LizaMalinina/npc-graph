/**
 * Node Positions API Route
 * 
 * PATCH /api/campaigns/[id]/positions
 * 
 * Persists node positions (posX, posY) for characters and organisations.
 * Only accessible to editors (with campaign access) and admins.
 * Viewers cannot persist positions - their changes are local only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canEditCampaign, getCurrentUser } from '@/lib/auth'
import { NodePositionUpdate, NodePositionsPayload } from '@/types'

// Helper to find campaign by id or slug
async function findCampaign(idOrSlug: string) {
  let campaign = await prisma.campaign.findUnique({
    where: { id: idOrSlug },
  })
  
  if (!campaign) {
    campaign = await prisma.campaign.findUnique({
      where: { slug: idOrSlug },
    })
  }
  
  return campaign
}

/**
 * Validate a single position update
 */
function validatePositionUpdate(update: Partial<NodePositionUpdate>): string[] {
  const errors: string[] = []
  
  if (!update.nodeId || typeof update.nodeId !== 'string') {
    errors.push('nodeId is required and must be a string')
  }
  
  if (!update.entityType || !['character', 'organisation'].includes(update.entityType)) {
    errors.push('entityType must be "character" or "organisation"')
  }
  
  if (typeof update.posX !== 'number' || isNaN(update.posX)) {
    errors.push('posX is required and must be a number')
  }
  
  if (typeof update.posY !== 'number' || isNaN(update.posY)) {
    errors.push('posY is required and must be a number')
  }
  
  return errors
}

/**
 * Group position updates by entity type for efficient database updates
 */
function groupPositionsByEntityType(positions: NodePositionUpdate[]) {
  const characters: NodePositionUpdate[] = []
  const organisations: NodePositionUpdate[] = []
  
  for (const pos of positions) {
    if (pos.entityType === 'character') {
      characters.push(pos)
    } else if (pos.entityType === 'organisation') {
      organisations.push(pos)
    }
  }
  
  return { characters, organisations }
}

/**
 * PATCH - Update node positions for a campaign
 * 
 * Requires authentication and campaign edit access.
 * Viewers cannot persist positions.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params
    
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required to save positions' },
        { status: 401 }
      )
    }
    
    // Check if user is viewer (cannot persist)
    if (user.role === 'viewer') {
      return NextResponse.json(
        { error: 'Viewers cannot persist node positions' },
        { status: 403 }
      )
    }
    
    // Check campaign edit access (supports both ID and slug)
    const hasAccess = await canEditCampaign(campaignId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this campaign' },
        { status: 403 }
      )
    }
    
    // Verify campaign exists (supports both ID and slug)
    const campaign = await findCampaign(campaignId)
    
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }
    
    // Use the actual campaign ID for database updates
    const actualCampaignId = campaign.id
    
    // Parse and validate request body
    const body: NodePositionsPayload = await request.json()
    
    if (!body.positions || !Array.isArray(body.positions)) {
      return NextResponse.json(
        { error: 'positions array is required' },
        { status: 400 }
      )
    }
    
    // Validate each position update
    const allErrors: string[] = []
    for (let i = 0; i < body.positions.length; i++) {
      const errors = validatePositionUpdate(body.positions[i])
      if (errors.length > 0) {
        allErrors.push(`Position ${i}: ${errors.join(', ')}`)
      }
    }
    
    if (allErrors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid position data', details: allErrors },
        { status: 400 }
      )
    }
    
    // Group by entity type for efficient updates
    const { characters, organisations } = groupPositionsByEntityType(body.positions)
    
    // Update positions in a transaction
    await prisma.$transaction(async (tx) => {
      // Update character positions
      for (const charPos of characters) {
        await tx.character.updateMany({
          where: {
            id: charPos.nodeId,
            campaignId: actualCampaignId,
          },
          data: {
            posX: charPos.posX,
            posY: charPos.posY,
          },
        })
      }
      
      // Update organisation positions
      for (const orgPos of organisations) {
        await tx.organisation.updateMany({
          where: {
            id: orgPos.nodeId,
            campaignId: actualCampaignId,
          },
          data: {
            posX: orgPos.posX,
            posY: orgPos.posY,
          },
        })
      }
    })
    
    return NextResponse.json({
      success: true,
      updated: {
        characters: characters.length,
        organisations: organisations.length,
      },
    })
    
  } catch (error) {
    console.error('Error updating node positions:', error)
    return NextResponse.json(
      { error: 'Failed to update node positions' },
      { status: 500 }
    )
  }
}
