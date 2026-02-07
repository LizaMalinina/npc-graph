'use client'

/**
 * AuthButton Component
 * 
 * Shows login button when unauthenticated, or user menu when authenticated.
 * Works on both desktop and mobile layouts.
 */

import { useAuth } from '@/hooks/useAuth'

interface AuthButtonProps {
  /** Variant for different layouts */
  variant?: 'desktop' | 'mobile'
  /** Optional class names */
  className?: string
}

export function AuthButton({ variant = 'desktop', className = '' }: AuthButtonProps) {
  const { isAuthenticated, isLoading, user, canEdit, login, logout } = useAuth()
  
  // Show loading state
  if (isLoading) {
    return (
      <div className={`auth-button auth-button--loading ${className}`}>
        <span className="auth-button__spinner" aria-label="Loading...">⋯</span>
      </div>
    )
  }
  
  // Show login button when not authenticated
  if (!isAuthenticated) {
    return (
      <button
        onClick={() => login()}
        className={`auth-button auth-button--login auth-button--${variant} ${className}`}
        aria-label="Sign in"
      >
        {variant === 'mobile' ? (
          <>
            <span className="auth-button__icon">👤</span>
            <span className="auth-button__text">Sign In</span>
          </>
        ) : (
          <>
            <span className="auth-button__text">Sign In</span>
          </>
        )}
      </button>
    )
  }
  
  // Show user info and logout when authenticated
  return (
    <div className={`auth-button auth-button--authenticated auth-button--${variant} ${className}`}>
      <div className="auth-button__user-info">
        <span className="auth-button__avatar">
          {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
        </span>
        <div className="auth-button__details">
          <span className="auth-button__name">{user?.name || user?.email}</span>
          {user?.role === 'viewer' && (
            <span className="auth-button__role-text">Viewer</span>
          )}
        </div>
      </div>
      <button
        onClick={() => logout()}
        className="auth-button__logout"
        aria-label="Sign out"
      >
        Sign out
      </button>
    </div>
  )
}
