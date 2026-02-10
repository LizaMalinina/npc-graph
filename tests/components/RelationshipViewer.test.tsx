/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import RelationshipViewer from '@/components/RelationshipViewer'
import { GraphLink, GraphNode } from '@/types'

describe('RelationshipViewer Component', () => {
  const mockOnClose = jest.fn()

  const mockRelationship: GraphLink = {
    id: 'rel-1',
    source: 'char-1',
    target: 'char-2',
    type: 'friend',
    strength: 4,
    sourceType: 'character',
    targetType: 'character',
    description: 'Best friends since childhood',
  }

  const mockSourceNode: GraphNode = {
    id: 'char-1',
    name: 'Alice',
    entityType: 'character',
  }

  const mockTargetNode: GraphNode = {
    id: 'char-2',
    name: 'Bob',
    entityType: 'character',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render relationship details modal', () => {
      render(
        <RelationshipViewer
          relationship={mockRelationship}
          sourceNode={mockSourceNode}
          targetNode={mockTargetNode}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Relationship Details')).toBeInTheDocument()
    })

    it('should show source and target node names', () => {
      render(
        <RelationshipViewer
          relationship={mockRelationship}
          sourceNode={mockSourceNode}
          targetNode={mockTargetNode}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })

    it('should show relationship type', () => {
      render(
        <RelationshipViewer
          relationship={mockRelationship}
          sourceNode={mockSourceNode}
          targetNode={mockTargetNode}
          onClose={mockOnClose}
        />
      )

      // Type appears multiple times (in subValue and details)
      const friendElements = screen.getAllByText(/friend/i)
      expect(friendElements.length).toBeGreaterThanOrEqual(1)
    })

    it('should show relationship strength', () => {
      render(
        <RelationshipViewer
          relationship={mockRelationship}
          sourceNode={mockSourceNode}
          targetNode={mockTargetNode}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('4/5')).toBeInTheDocument()
    })

    it('should show description when provided', () => {
      render(
        <RelationshipViewer
          relationship={mockRelationship}
          sourceNode={mockSourceNode}
          targetNode={mockTargetNode}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Best friends since childhood')).toBeInTheDocument()
    })

    it('should not show description section when not provided', () => {
      const relWithoutDescription: GraphLink = {
        ...mockRelationship,
        description: undefined,
      }

      render(
        <RelationshipViewer
          relationship={relWithoutDescription}
          sourceNode={mockSourceNode}
          targetNode={mockTargetNode}
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByText('Description:')).not.toBeInTheDocument()
    })
  })

  describe('Entity Type Icons', () => {
    it('should show person icon for character entities', () => {
      render(
        <RelationshipViewer
          relationship={mockRelationship}
          sourceNode={mockSourceNode}
          targetNode={mockTargetNode}
          onClose={mockOnClose}
        />
      )

      // Both nodes are characters, so should show 👤 icons
      const personIcons = screen.getAllByText('👤')
      expect(personIcons).toHaveLength(2)
    })

    it('should show organisation icon for organisation entities', () => {
      const orgNode: GraphNode = {
        id: 'org-1',
        name: 'The Guild',
        entityType: 'organisation',
      }

      const orgRelationship: GraphLink = {
        ...mockRelationship,
        sourceType: 'organisation',
      }

      render(
        <RelationshipViewer
          relationship={orgRelationship}
          sourceNode={orgNode}
          targetNode={mockTargetNode}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('🏛️')).toBeInTheDocument()
    })
  })

  describe('Unknown Nodes', () => {
    it('should show "Unknown" when source node is not provided', () => {
      render(
        <RelationshipViewer
          relationship={mockRelationship}
          sourceNode={undefined}
          targetNode={mockTargetNode}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Unknown')).toBeInTheDocument()
    })

    it('should show "Unknown" when target node is not provided', () => {
      render(
        <RelationshipViewer
          relationship={mockRelationship}
          sourceNode={mockSourceNode}
          targetNode={undefined}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Unknown')).toBeInTheDocument()
    })
  })

  describe('Close Functionality', () => {
    it('should call onClose when X button is clicked', () => {
      render(
        <RelationshipViewer
          relationship={mockRelationship}
          sourceNode={mockSourceNode}
          targetNode={mockTargetNode}
          onClose={mockOnClose}
        />
      )

      fireEvent.click(screen.getByText('×'))

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when Close button is clicked', () => {
      render(
        <RelationshipViewer
          relationship={mockRelationship}
          sourceNode={mockSourceNode}
          targetNode={mockTargetNode}
          onClose={mockOnClose}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /close/i }))

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Different Relationship Types', () => {
    const relationshipTypes = ['friend', 'enemy', 'family', 'ally', 'rival', 'romantic', 'business', 'mentor', 'servant']

    relationshipTypes.forEach((type) => {
      it(`should render ${type} relationship type`, () => {
        const rel: GraphLink = {
          ...mockRelationship,
          type,
        }

        render(
          <RelationshipViewer
            relationship={rel}
            sourceNode={mockSourceNode}
            targetNode={mockTargetNode}
            onClose={mockOnClose}
          />
        )

        // Find the type in the details section (appears after "Type:" label)
        const allElements = screen.getAllByText(type)
        expect(allElements.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('Mobile z-index', () => {
    it('should have z-index higher than mobile bottom sheet (z-200)', () => {
      const { container } = render(
        <RelationshipViewer
          relationship={mockRelationship}
          sourceNode={mockSourceNode}
          targetNode={mockTargetNode}
          onClose={mockOnClose}
        />
      )

      // The modal overlay should have z-index class higher than 200
      const overlay = container.querySelector('.fixed.inset-0')
      expect(overlay).toHaveClass('z-[250]')
    })
  })
})
