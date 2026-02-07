import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'
import Google from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import type { UserRole } from '@/types'

/**
 * NextAuth.js configuration for authentication
 * 
 * Supports multiple providers:
 * - Microsoft Entra External ID
 * - Google (optional - requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)
 * 
 * This provides RBAC with three roles:
 * - viewer: Can view all campaigns (default, no login required)
 * - editor: Can edit assigned campaigns, persist node positions
 * - admin: Full access to all campaigns and user management
 */

// Extend the session type to include our custom fields
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      visitorId: string
      email: string
      name?: string | null
      role: UserRole
    }
  }
  
  interface User {
    visitorId?: string
    role?: UserRole
  }
}

// Build providers array based on available env vars
const providers: NextAuthConfig['providers'] = []

// Microsoft Entra ID (multitenant - allows any Microsoft account)
if (process.env.ENTRA_CLIENT_ID) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.ENTRA_CLIENT_ID!,
      clientSecret: process.env.ENTRA_CLIENT_SECRET!,
      // Use 'common' for multitenant (any org + personal accounts)
      // Use 'organizations' for any work/school account only
      issuer: `https://login.microsoftonline.com/common/v2.0`,
      authorization: {
        params: {
          scope: 'openid profile email User.Read',
        },
      },
    })
  )
}

// Google (optional - only if configured)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  )
}

export const authConfig: NextAuthConfig = {
  providers,
  
  callbacks: {
    /**
     * Handle sign-in and user creation/lookup
     */
    async signIn({ user, account, profile }) {
      if (!account || !profile) return true
      
      try {
        // Get provider-specific ID
        const visitorId = (profile as { oid?: string; sub?: string }).oid || profile.sub || account.providerAccountId
        
        if (!visitorId) {
          console.error('No visitor ID found in profile')
          return false
        }
        
        // Check if user exists in our database
        const existingUser = await prisma.user.findFirst({
          where: { visitorId: visitorId },
        })
        
        if (!existingUser) {
          // Create new user with default editor role
          // First user becomes admin
          const userCount = await prisma.user.count()
          const isFirstUser = userCount === 0
          
          await prisma.user.create({
            data: {
              visitorId: visitorId,
              email: user.email || profile.email as string,
              name: user.name,
              role: isFirstUser ? 'admin' : 'editor',
            },
          })
        }
        
        return true
      } catch (error) {
        console.error('Error during sign in:', error)
        return false
      }
    },
    
    /**
     * Add custom claims to JWT token
     */
    async jwt({ token, account, profile }) {
      // On initial sign in, add visitor ID
      if (account && profile) {
        const visitorId = (profile as { oid?: string; sub?: string }).oid || profile.sub || account.providerAccountId
        token.visitorId = visitorId
      }
      
      // Fetch role from database
      if (token.visitorId) {
        try {
          const dbUser = await prisma.user.findFirst({
            where: { visitorId: token.visitorId as string },
          })
          
          if (dbUser) {
            token.role = dbUser.role as UserRole
            token.userId = dbUser.id
          }
        } catch (error) {
          console.error('Error fetching user role:', error)
        }
      }
      
      return token
    },
    
    /**
     * Add custom claims to session
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string
        session.user.visitorId = token.visitorId as string
        session.user.role = (token.role as UserRole) || 'viewer'
      }
      
      return session
    },
  },
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  session: {
    strategy: 'jwt',
  },
  
  // Trust the host when running in Docker
  trustHost: true,
}

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig)
