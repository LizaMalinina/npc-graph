/**
 * Campaign Edit Permission Check API
 * 
 * GET /api/campaigns/[id]/can-edit
 * 
 * Returns whether the current user can edit this campaign.
 */

import { NextRequest, NextResponse } from 'next/server'
import { canEditCampaign } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = await params
    
    const canEdit = await canEditCampaign(campaignId)
    
    return NextResponse.json({ canEdit })
  } catch (error) {
    console.error('Failed to check campaign edit permission:', error)
    return NextResponse.json(
      { error: 'Failed to check permission', canEdit: false },
      { status: 500 }
    )
  }
}
