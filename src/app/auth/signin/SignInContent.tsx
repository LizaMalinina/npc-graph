'use client'

/**
 * Custom Sign In Content (Client Component)
 *
 * Provides a branded sign-in experience with multiple provider options.
 * Shows all configured providers (Microsoft, Google, etc.)
 */

import { signIn, getProviders } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface SignInContentProps {
  entraConfig: {
    tenantId: string
    clientId: string
    ciamDomain: string
  }
}

// Provider button configurations
const providerConfig: Record<string, {
  name: string
  bgClass: string
  icon: React.ReactNode
}> = {
  'microsoft-entra-id': {
    name: 'Microsoft',
    bgClass: 'bg-[#2f2f2f] hover:bg-[#3f3f3f]',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 21 21">
        <path d="M0 0h10v10H0zM11 0h10v10H11zM0 11h10v10H0zM11 11h10v10H11z"/>
      </svg>
    ),
  },
  'google': {
    name: 'Google',
    bgClass: 'bg-white hover:bg-gray-100 hover:shadow-lg text-gray-800 shadow-md',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
  },
}

export default function SignInContent({ entraConfig }: SignInContentProps) {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const error = searchParams.get('error')

  const [providers, setProviders] = useState<Record<string, { id: string; name: string }> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProviders().then((p) => {
      setProviders(p)
      setLoading(false)
    })
  }, [])

  const handleSignIn = async (providerId: string) => {
    // Use redirect: true (default) for proper CSRF handling
    await signIn(providerId, { callbackUrl, redirect: true })
  }

  // Build the sign-up URL using the passed entra config
  // For External ID, the user flow name goes in the path
  const getSignUpUrl = () => {
    const redirectUri = typeof window !== 'undefined'
      ? window.location.origin + '/api/auth/callback/microsoft-entra-id'
      : 'http://localhost:3000/api/auth/callback/microsoft-entra-id'
    return `https://${entraConfig.ciamDomain}/${entraConfig.tenantId}/SignupWithEmail/oauth2/v2.0/authorize?client_id=${entraConfig.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20profile%20email&prompt=create`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex items-center justify-center p-4">
      <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 via-red-500 to-pink-500 bg-clip-text text-transparent mb-2">
            🕸 Character Web
          </h1>
          <p className="text-gray-400">Sign in to create and edit campaigns</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm text-center">
              {error === 'OAuthSignin' && 'Error starting sign in. Please try again.'}
              {error === 'OAuthCallback' && 'Error during authentication. Please try again.'}
              {error === 'OAuthCreateAccount' && 'Could not create account. Please try again.'}
              {error === 'Callback' && 'Error during callback. Please try again.'}
              {!['OAuthSignin', 'OAuthCallback', 'OAuthCreateAccount', 'Callback'].includes(error) && 'An error occurred. Please try again.'}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-pulse text-gray-400">Loading sign-in options...</div>
            </div>
          ) : providers && Object.keys(providers).length > 0 ? (
            Object.values(providers).map((provider) => {
              const config = providerConfig[provider.id] || {
                name: provider.name,
                bgClass: 'bg-gray-600 hover:bg-gray-700',
                icon: null,
              }

              return (
                <button
                  key={provider.id}
                  onClick={() => handleSignIn(provider.id)}
                  className={`w-full ${config.bgClass} font-semibold py-3 px-4 rounded-lg transition-all active:scale-95 active:opacity-80 flex items-center justify-center gap-2 border border-transparent hover:border-gray-300`}
                >
                  {config.icon}
                  Sign in with {config.name}
                </button>
              )
            })
          ) : (
            <div className="text-center py-4">
              <p className="text-yellow-400 text-sm">No sign-in providers configured.</p>
              <p className="text-gray-500 text-xs mt-2">Check ENTRA or GOOGLE environment variables.</p>
            </div>
          )}
        </div>

        {/* Sign up with Email section - only show if CIAM is configured */}
        {/* Disabled: CIAM tenant required for self-service signup */}
        {false && entraConfig.tenantId && entraConfig.clientId && entraConfig.ciamDomain && (
          <div className="mt-6 pt-6 border-t border-[#334155]">
            <p className="text-center text-gray-400 text-sm mb-3">Don&apos;t have an account?</p>
            <a
              href={getSignUpUrl()}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Sign up with Email
            </a>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href={callbackUrl}
            className="text-gray-500 hover:text-gray-400 text-sm underline"
          >
            Continue as viewer (read-only)
          </Link>
        </div>
      </div>
    </div>
  )
}
