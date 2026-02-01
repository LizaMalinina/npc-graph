/**
 * CharacterWebPage Component Tests
 * 
 * Tests for the page component that integrates CharacterWeb with campaign data.
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock the CharacterWeb component
jest.mock('@/components/detective/CharacterWeb', () => ({
  CharacterWeb: ({ data, viewMode, onViewModeChange }: any) => (
    <div data-testid="character-web">
      <span data-testid="view-mode">{viewMode}</span>
      <span data-testid="node-count">{data?.nodes?.length ?? 0}</span>
    </div>
  ),
}))

// Mock fetch for API calls
const mockGraphData = {
  nodes: [
    { id: 'char-1', name: 'Test Character', entityType: 'character' },
    { id: 'org-1', name: 'Test Org', entityType: 'organisation' },
  ],
  links: [
    { id: 'link-1', source: 'char-1', sourceType: 'character', target: 'org-1', targetType: 'organisation', type: 'member' },
  ],
}

// Import after mocks
import { CharacterWebPage } from '@/components/detective/CharacterWebPage'

describe('CharacterWebPage Component', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    
    // Mock fetch
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const renderWithQuery = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  describe('Loading State', () => {
    it('should display loading indicator while fetching data', () => {
      // Return a pending promise
      (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}))
      
      renderWithQuery(<CharacterWebPage campaignId="test-campaign" />)
      
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
    })
  })

  describe('Data Display', () => {
    it('should render CharacterWeb with fetched data', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockGraphData,
      })
      
      renderWithQuery(<CharacterWebPage campaignId="test-campaign" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('character-web')).toBeInTheDocument()
      })
      
      expect(screen.getByTestId('node-count')).toHaveTextContent('2')
    })

    it('should default to "all" view mode', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockGraphData,
      })
      
      renderWithQuery(<CharacterWebPage campaignId="test-campaign" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('view-mode')).toHaveTextContent('all')
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
      
      renderWithQuery(<CharacterWebPage campaignId="test-campaign" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
      })
    })
  })

  describe('View Mode Selection', () => {
    it('should pass viewMode parameter to API when fetching', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockGraphData,
      })
      
      renderWithQuery(<CharacterWebPage campaignId="test-campaign" />)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/campaigns/test-campaign/character-web')
        )
      })
    })
  })

  describe('Selection State', () => {
    it('should track selected entity ids', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockGraphData,
      })
      
      renderWithQuery(<CharacterWebPage campaignId="test-campaign" />)
      
      await waitFor(() => {
        expect(screen.getByTestId('character-web')).toBeInTheDocument()
      })
    })
  })
})
