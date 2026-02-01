/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock modules
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

// Mock the mobile detection hook
let mockIsMobile = false
jest.mock('@/hooks/useMobileDetection', () => ({
  useMobileDetection: () => mockIsMobile,
}))

import DetectiveFilterPanel from '@/components/detective/DetectiveFilterPanel'
import { FilterState } from '@/types'

describe('Mobile UI', () => {
  const mockFilters: FilterState = {
    factions: [],
    locations: [],
    statuses: [],
    relationshipTypes: [],
    searchQuery: '',
    viewMode: 'collapsed',
    showOrganisationsOnly: false,
    showCharactersOnly: false,
  }

  const mockGraphData = {
    nodes: [
      { id: '1', name: 'Test Character', entityType: 'character' as const, faction: 'Test Faction', location: 'Test Location' },
    ],
    links: [],
  }

  beforeEach(() => {
    mockIsMobile = false
  })

  describe('DetectiveFilterPanel', () => {
    it('should show create buttons when NOT on mobile and callbacks provided', () => {
      const onCreateCharacter = jest.fn()
      const onCreateOrganisation = jest.fn()

      render(
        <DetectiveFilterPanel
          filters={mockFilters}
          onFiltersChange={() => {}}
          graphData={mockGraphData}
          onCreateCharacter={onCreateCharacter}
          onCreateOrganisation={onCreateOrganisation}
          isMobile={false}
        />
      )

      expect(screen.getByText('+ Character')).toBeInTheDocument()
      expect(screen.getByText('+ Organisation')).toBeInTheDocument()
    })

    it('should NOT show create buttons when on mobile even if callbacks provided', () => {
      const onCreateCharacter = jest.fn()
      const onCreateOrganisation = jest.fn()

      render(
        <DetectiveFilterPanel
          filters={mockFilters}
          onFiltersChange={() => {}}
          graphData={mockGraphData}
          onCreateCharacter={onCreateCharacter}
          onCreateOrganisation={onCreateOrganisation}
          isMobile={true}
        />
      )

      expect(screen.queryByText('+ Character')).not.toBeInTheDocument()
      expect(screen.queryByText('+ Organisation')).not.toBeInTheDocument()
    })

    it('should apply mobile-compact class when isMobile is true', () => {
      const { container } = render(
        <DetectiveFilterPanel
          filters={mockFilters}
          onFiltersChange={() => {}}
          graphData={mockGraphData}
          isMobile={true}
        />
      )

      expect(container.firstChild).toHaveClass('mobile-compact')
    })

    it('should NOT apply mobile-compact class when isMobile is false', () => {
      const { container } = render(
        <DetectiveFilterPanel
          filters={mockFilters}
          onFiltersChange={() => {}}
          graphData={mockGraphData}
          isMobile={false}
        />
      )

      expect(container.firstChild).not.toHaveClass('mobile-compact')
    })
  })
})
