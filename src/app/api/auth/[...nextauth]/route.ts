/**
 * NextAuth.js API Route Handler
 * 
 * This handles all authentication routes:
 * - GET/POST /api/auth/signin - Sign in page/action
 * - GET/POST /api/auth/signout - Sign out
 * - GET/POST /api/auth/callback/azure-ad-b2c - OAuth callback
 * - GET /api/auth/session - Get current session
 */

import { handlers } from '@/auth'

export const { GET, POST } = handlers
