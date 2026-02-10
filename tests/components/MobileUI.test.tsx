/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
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

// Import components needed for new tests
import DetectiveNodePanel from '@/components/detective/DetectiveNodePanel'
import DetectiveLegend from '@/components/detective/DetectiveLegend'
import { GraphNode, GraphLink, Organisation } from '@/types'

describe('Mobile Bio Panel Description', () => {
  const mockOnClose = jest.fn()
  const mockNode: GraphNode = {
    id: 'char-1',
    name: 'Test Character',
    entityType: 'character',
    description: 'A'.repeat(200), // Long description over 150 chars
  }
  const mockRelationships = { from: [], to: [] }
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should show "Show more" button for long descriptions', () => {
    render(
      <DetectiveNodePanel
        node={mockNode}
        relationships={mockRelationships}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('Show more')).toBeInTheDocument()
  })

  it('should toggle to "Show less" after clicking "Show more"', () => {
    render(
      <DetectiveNodePanel
        node={mockNode}
        relationships={mockRelationships}
        onClose={mockOnClose}
      />
    )
    
    fireEvent.click(screen.getByText('Show more'))
    expect(screen.getByText('Show less')).toBeInTheDocument()
  })

  it('should NOT show "Show more" button for short descriptions', () => {
    const shortNode = { ...mockNode, description: 'Short text' }
    render(
      <DetectiveNodePanel
        node={shortNode}
        relationships={mockRelationships}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.queryByText('Show more')).not.toBeInTheDocument()
  })
})

describe('Mobile Character Organisation Display', () => {
  const mockOnClose = jest.fn()
  const mockOrg: Organisation = {
    id: 'org-1',
    name: 'Test Organisation',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const mockCharacter: GraphNode = {
    id: 'char-1',
    name: 'Test Character',
    entityType: 'character',
    organisations: [mockOrg],
  }
  const mockRelationships = { from: [], to: [] }
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display character organisations in the panel', () => {
    render(
      <DetectiveNodePanel
        node={mockCharacter}
        relationships={mockRelationships}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('Test Organisation')).toBeInTheDocument()
  })

  it('should show organisations section header for characters', () => {
    render(
      <DetectiveNodePanel
        node={mockCharacter}
        relationships={mockRelationships}
        onClose={mockOnClose}
      />
    )
    
    // Look for the section header specifically (contains count in parentheses)
    expect(screen.getByText(/Organisation.*\(1\)/)).toBeInTheDocument()
  })
})

describe('Mobile Legend Panel Scrolling', () => {
  const mockOnClose = jest.fn()
  
  // Create many organisations to test scrolling
  const manyOrgs: Organisation[] = Array.from({ length: 20 }, (_, i) => ({
    id: `org-${i}`,
    name: `Organisation ${i}`,
    pinColor: `#${i.toString().padStart(6, '0')}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }))

  it('should limit legend height and allow scrolling with many organisations', () => {
    const { container } = render(
      <DetectiveLegend
        onClose={mockOnClose}
        organisations={manyOrgs}
        isMobile={true}
      />
    )
    
    // Find the pin colors list container - it should have max-height and overflow
    const legendContent = container.querySelector('[class*="max-h-"]') || container.querySelector('[style*="max-height"]')
    // The legend should have scrollable content area
    expect(legendContent || container.querySelector('.overflow-y-auto')).toBeTruthy()
  })

  it('should render all organisations in the legend', () => {
    render(
      <DetectiveLegend
        onClose={mockOnClose}
        organisations={manyOrgs}
        isMobile={true}
      />
    )
    
    // Check that at least some orgs are rendered (text includes emoji prefix)
    expect(screen.getByText(/Organisation 0$/)).toBeInTheDocument()
    expect(screen.getByText(/Organisation 19$/)).toBeInTheDocument()
  })
})

describe('Mobile Back to Organisation Button', () => {
  const mockOnClose = jest.fn()
  const mockOnBackToOrg = jest.fn()
  
  const mockParentOrg: GraphNode = {
    id: 'org-1',
    name: 'Parent Organisation',
    entityType: 'organisation',
  }
  
  const mockCharacter: GraphNode = {
    id: 'char-1',
    name: 'Test Character',
    entityType: 'character',
  }
  const mockRelationships = { from: [], to: [] }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should show back to org button when viewing character from org on desktop panel', () => {
    render(
      <DetectiveNodePanel
        node={mockCharacter}
        relationships={mockRelationships}
        onClose={mockOnClose}
        parentOrg={mockParentOrg}
        onBackToOrg={mockOnBackToOrg}
      />
    )
    
    expect(screen.getByText(/Back to Parent Organisation/)).toBeInTheDocument()
  })

  it('should call onBackToOrg when back button is clicked', () => {
    render(
      <DetectiveNodePanel
        node={mockCharacter}
        relationships={mockRelationships}
        onClose={mockOnClose}
        parentOrg={mockParentOrg}
        onBackToOrg={mockOnBackToOrg}
      />
    )
    
    fireEvent.click(screen.getByText(/Back to Parent Organisation/))
    expect(mockOnBackToOrg).toHaveBeenCalled()
  })

  it('should NOT show back button when no parent org', () => {
    render(
      <DetectiveNodePanel
        node={mockCharacter}
        relationships={mockRelationships}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.queryByText(/Back to/)).not.toBeInTheDocument()
  })
})
