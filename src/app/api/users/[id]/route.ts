/**
 * Individual User API
 * 
 * Admin-only endpoints for managing a specific user.
 * GET: Get user details
 * PATCH: Update user role (admin can promote/demote users, including to admin)
 * DELETE: Remove user
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import type { UserRole } from '@/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const { id } = await params
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        editableCampaigns: {
          include: {
            campaign: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        createdCampaigns: {
          select: { id: true, name: true, slug: true },
        },
      },
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(user)
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const { id } = await params
    const body = await request.json()
    const { role } = body as { role?: UserRole }
    
    // Validate role
    const validRoles: UserRole[] = ['viewer', 'editor', 'admin']
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be viewer, editor, or admin' },
        { status: 400 }
      )
    }
    
    // Prevent admin from demoting themselves if they're the only admin
    if (role && role !== 'admin' && currentUser.id === id) {
      const adminCount = await prisma.user.count({
        where: { role: 'admin' },
      })
      
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot demote yourself - you are the only admin' },
          { status: 400 }
        )
      }
    }
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(role && { role }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })
    
    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Failed to update user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const { id } = await params
    
    // Prevent admin from deleting themselves
    if (currentUser.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }
    
    await prisma.user.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
