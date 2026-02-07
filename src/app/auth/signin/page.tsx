import { Suspense } from 'react'
import SignInContent from './SignInContent'

/**
 * Custom Sign In Page (Server Component)
 *
 * Passes server-side environment variables to the client component.
 */
export default function SignInPage() {
  // Read server-side env vars and pass to client
  const entraConfig = {
    tenantId: process.env.ENTRA_TENANT_ID || '',
    clientId: process.env.ENTRA_CLIENT_ID || '',
    ciamDomain: process.env.ENTRA_CIAM_DOMAIN || '',
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex items-center justify-center p-4">
        <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="text-center">
            <div className="text-3xl mb-4">⏳</div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <SignInContent entraConfig={entraConfig} />
    </Suspense>
  )
}
