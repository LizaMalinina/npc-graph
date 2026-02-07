'use client'

/**
 * Custom Auth Error Page
 * 
 * Displays authentication errors with helpful messages.
 */

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration. Please contact support.'
      case 'AccessDenied':
        return 'You do not have permission to sign in.'
      case 'Verification':
        return 'The sign in link is no longer valid. It may have been used already or expired.'
      case 'OAuthSignin':
        return 'Error starting the sign in process. Please try again.'
      case 'OAuthCallback':
        return 'Error during the OAuth callback. Please try again.'
      case 'OAuthCreateAccount':
        return 'Could not create OAuth account. Please try again.'
      case 'Callback':
        return 'Error during the callback. Please try again.'
      case 'OAuthAccountNotLinked':
        return 'This email is already associated with another account.'
      case 'Default':
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }

  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-8 max-w-md w-full shadow-2xl">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Authentication Error
        </h1>
        <p className="text-red-400">
          {getErrorMessage(error)}
        </p>
      </div>

      <div className="space-y-3">
        <Link
          href="/auth/signin"
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center"
        >
          Try Again
        </Link>
        
        <Link
          href="/"
          className="block w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center"
        >
          Go to Home
        </Link>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      }>
        <AuthErrorContent />
      </Suspense>
    </div>
  )
}
