/**
 * Campaign Editors API
 * 
 * Admin-only endpoints for managing which editors have access to a campaign.
 * GET: List editors assigned to this campaign
 * POST: Add an editor to this campaign
 * DELETE: Remove an editor from this campaign
 * 
 * Note: Editors can view all campaigns but can only edit:
 * 1. Campaigns they created
 * 2. Campaigns an admin has assigned them to via this API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: List all editors assigned to this campaign
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const { id: campaignId } = await params
    
    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, name: true, creatorId: true },
    })
    
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }
    
    // Get all editors assigned to this campaign
    const editors = await prisma.campaignEditor.findMany({
      where: { campaignId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    })
    
    // Also get the creator if they exist
    let creator = null
    if (campaign.creatorId) {
      creator = await prisma.user.findUnique({
        where: { id: campaign.creatorId },
        select: { id: true, email: true, name: true, role: true },
      })
    }
    
    return NextResponse.json({
      campaign: { id: campaign.id, name: campaign.name },
      creator,
      editors: editors.map((e) => ({
        assignmentId: e.id,
        ...e.user,
        assignedAt: e.createdAt,
      })),
    })
  } catch (error) {
    console.error('Failed to fetch campaign editors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign editors' },
      { status: 500 }
    )
  }
}

// POST: Assign an editor to this campaign
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const { id: campaignId } = await params
    const body = await request.json()
    const { userId } = body as { userId: string }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }
    
    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    })
    
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }
    
    // Verify user exists and is an editor (or admin)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    if (user.role === 'viewer') {
      return NextResponse.json(
        { error: 'Cannot assign campaign access to viewers. Promote to editor first.' },
        { status: 400 }
      )
    }
    
    // Check if already assigned
    const existing = await prisma.campaignEditor.findUnique({
      where: {
        campaignId_userId: { campaignId, userId },
      },
    })
    
    if (existing) {
      return NextResponse.json(
        { error: 'User is already assigned to this campaign' },
        { status: 400 }
      )
    }
    
    // Create the assignment
    const assignment = await prisma.campaignEditor.create({
      data: { campaignId, userId },
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
    })
    
    return NextResponse.json({
      assignmentId: assignment.id,
      ...assignment.user,
      assignedAt: assignment.createdAt,
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to assign editor:', error)
    return NextResponse.json(
      { error: 'Failed to assign editor' },
      { status: 500 }
    )
  }
}

// DELETE: Remove an editor from this campaign
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const { id: campaignId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }
    
    // Delete the assignment
    await prisma.campaignEditor.delete({
      where: {
        campaignId_userId: { campaignId, userId },
      },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove editor:', error)
    return NextResponse.json(
      { error: 'Failed to remove editor' },
      { status: 500 }
    )
  }
}
