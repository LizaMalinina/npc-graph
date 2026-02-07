'use client'

/**
 * Authentication hook for client-side components
 * 
 * Provides easy access to session state and auth functions.
 */

import { useSession, signIn, signOut } from 'next-auth/react'
import { UserRole } from '@/types'

export interface UseAuthResult {
  // Session state
  isAuthenticated: boolean
  isLoading: boolean
  user: {
    id: string
    visitorId: string  // Provider-specific user ID (Entra OID, Google sub, etc.)
    email: string
    name?: string | null
    role: UserRole
  } | null
  
  // Role checks
  isViewer: boolean
  isEditor: boolean
  isAdmin: boolean
  canEdit: boolean  // true for editor or admin
  
  // Auth actions
  login: () => Promise<void>
  logout: () => Promise<void>
}

/**
 * Hook for accessing authentication state and functions
 */
export function useAuth(): UseAuthResult {
  const { data: session, status } = useSession()
  
  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated' && !!session?.user
  
  // Extract user from session
  const user = isAuthenticated && session?.user
    ? {
        id: session.user.id as string,
        visitorId: session.user.visitorId as string,
        email: session.user.email as string,
        name: session.user.name,
        role: (session.user.role as UserRole) || 'viewer',
      }
    : null
  
  // Role checks - unauthenticated users are viewers
  const role = user?.role || 'viewer'
  const isViewer = role === 'viewer'
  const isEditor = role === 'editor'
  const isAdmin = role === 'admin'
  const canEdit = isEditor || isAdmin
  
  // Auth actions
  const login = async () => {
    // Redirect to our custom sign-in page
    await signIn(undefined, { callbackUrl: '/' })
  }
  
  const logout = async () => {
    await signOut({ callbackUrl: '/' })
  }
  
  return {
    isAuthenticated,
    isLoading,
    user,
    isViewer,
    isEditor,
    isAdmin,
    canEdit,
    login,
    logout,
  }
}
