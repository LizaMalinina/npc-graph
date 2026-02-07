/**
 * Authentication utility functions
 * 
 * Provides helper functions for auth checks in API routes and components.
 */

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { UserRole } from '@/types'

export interface AuthUser {
  id: string
  visitorId: string
  email: string
  name?: string | null
  role: UserRole
}

/**
 * Get the current authenticated user from the session
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth()
  
  if (!session?.user) {
    return null
  }
  
  return session.user as AuthUser
}

/**
 * Check if the current user has at least the specified role level
 * Role hierarchy: admin > editor > viewer
 */
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  const user = await getCurrentUser()
  
  if (!user) {
    // Unauthenticated users are viewers
    return requiredRole === 'viewer'
  }
  
  const roleHierarchy: Record<UserRole, number> = {
    viewer: 0,
    editor: 1,
    admin: 2,
  }
  
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
}

/**
 * Check if the user can edit a specific campaign
 * Admins can edit all, editors can only edit assigned campaigns
 * Supports both campaign ID and slug lookup
 */
export async function canEditCampaign(campaignIdOrSlug: string): Promise<boolean> {
  const user = await getCurrentUser()
  
  if (!user) {
    return false
  }
  
  // Admins can edit everything
  if (user.role === 'admin') {
    return true
  }
  
  // Viewers cannot edit
  if (user.role === 'viewer') {
    return false
  }
  
  // Try to find campaign by ID first, then by slug
  let campaign = await prisma.campaign.findUnique({
    where: { id: campaignIdOrSlug },
    include: {
      editors: {
        where: { userId: user.id },
      },
    },
  })
  
  if (!campaign) {
    campaign = await prisma.campaign.findUnique({
      where: { slug: campaignIdOrSlug },
      include: {
        editors: {
          where: { userId: user.id },
        },
      },
    })
  }
  
  if (!campaign) {
    return false
  }
  
  // Check if user is creator or assigned editor
  return campaign.creatorId === user.id || campaign.editors.length > 0
}

/**
 * Require authentication for an API route
 * Throws an error if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
}

/**
 * Require a specific role for an API route
 * Throws an error if requirements not met
 */
export async function requireRole(role: UserRole): Promise<AuthUser> {
  const user = await requireAuth()
  
  if (!(await hasRole(role))) {
    throw new Error(`Role ${role} required`)
  }
  
  return user
}

/**
 * Require campaign edit permission
 * Throws an error if user cannot edit the campaign
 */
export async function requireCampaignEditAccess(campaignId: string): Promise<AuthUser> {
  const user = await requireAuth()
  
  if (!(await canEditCampaign(campaignId))) {
    throw new Error('You do not have permission to edit this campaign')
  }
  
  return user
}
