/**
 * AuthButton Component Tests
 * 
 * Tests for the AuthButton component rendering and behavior.
 * Following TDD: Write tests that describe the expected behavior.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

import { useSession } from 'next-auth/react'
import { AuthButton } from '@/components/AuthButton'

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

describe('AuthButton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Loading State', () => {
    it('should show loading spinner when session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn(),
      })

      render(<AuthButton />)
      
      expect(screen.getByLabelText('Loading...')).toBeInTheDocument()
    })
  })

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      })
    })

    it('should show Sign In button when not authenticated', () => {
      render(<AuthButton />)
      
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    })

    it('should show Sign In with icon on mobile variant', () => {
      render(<AuthButton variant="mobile" />)
      
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.getByText('👤')).toBeInTheDocument()
    })
  })

  describe('Authenticated State', () => {
    const mockSession = {
      user: {
        id: 'user-123',
        azureId: 'azure-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'editor' as const,
      },
      expires: '2099-12-31T23:59:59.999Z',
    }

    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })
    })

    it('should show user name when authenticated', () => {
      render(<AuthButton />)
      
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    it('should show user avatar with first letter of name', () => {
      render(<AuthButton />)
      
      expect(screen.getByText('T')).toBeInTheDocument()
    })

    it('should show user role for editors', () => {
      render(<AuthButton />)
      
      // Editor no longer shows role badge (only viewers do)
      expect(screen.queryByText(/editor/i)).not.toBeInTheDocument()
    })

    it('should show sign out button', () => {
      render(<AuthButton />)
      
      expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
    })
  })

  describe('Role Display', () => {
    it('should NOT show role badge for admin (indicated by Admin link instead)', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            azureId: 'azure-123',
            email: 'superuser@example.com',
            name: 'Super User',
            role: 'admin',
          },
          expires: '2099-12-31T23:59:59.999Z',
        },
        status: 'authenticated',
        update: jest.fn(),
      })

      render(<AuthButton />)
      
      // Admin doesn't show a role-text element
      expect(screen.queryByText('Viewer')).not.toBeInTheDocument()
      expect(screen.queryByText('Editor')).not.toBeInTheDocument()
    })

    it('should show Viewer text for viewer role', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            azureId: 'azure-123',
            email: 'viewer@example.com',
            name: 'Viewer User',
            role: 'viewer',
          },
          expires: '2099-12-31T23:59:59.999Z',
        },
        status: 'authenticated',
        update: jest.fn(),
      })

      render(<AuthButton />)
      
      expect(screen.getByText('Viewer')).toBeInTheDocument()
    })
  })
})
