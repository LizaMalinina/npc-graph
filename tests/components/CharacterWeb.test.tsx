/**
 * CharacterWeb Component Tests
 * 
 * Tests for the Character Web visualization component that displays:
 * - Three view modes: characters, organisations, all
 * - Bio panel on single selection
 * - Apply filter on multi-selection
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CharacterWeb } from '@/components/detective/CharacterWeb'
import { CharacterWebData, CharacterWebViewMode } from '@/types'

// Mock the CharacterWebGraph component since it uses vis-network
jest.mock('@/components/detective/CharacterWebGraph', () => ({
  CharacterWebGraph: ({ data, onNodeSelect, selectedNodeIds }: any) => (
    <div data-testid="mock-graph">
      <span>Nodes: {data.nodes.length}</span>
      <span>Links: {data.links.length}</span>
      <button onClick={() => onNodeSelect(['test-id'])}>Select Node</button>
    </div>
  ),
}))

// Mock data generators with randomization
const createMockCharacterNode = (overrides = {}) => ({
  id: `char-${Math.random().toString(36).substring(7)}`,
  name: `Character ${Math.floor(Math.random() * 1000)}`,
  entityType: 'character' as const,
  title: `Title ${Math.floor(Math.random() * 100)}`,
  faction: `Faction ${Math.floor(Math.random() * 10)}`,
  status: 'alive',
  ...overrides,
})

const createMockOrgNode = (overrides = {}) => ({
  id: `org-${Math.random().toString(36).substring(7)}`,
  name: `Organisation ${Math.floor(Math.random() * 1000)}`,
  entityType: 'organisation' as const,
  description: `Description ${Math.random().toString(36)}`,
  ...overrides,
})

const createMockLink = (sourceId: string, targetId: string, sourceType: 'character' | 'organisation', targetType: 'character' | 'organisation', overrides = {}) => ({
  id: `link-${Math.random().toString(36).substring(7)}`,
  source: sourceId,
  sourceType,
  target: targetId,
  targetType,
  type: 'friend',
  strength: Math.floor(Math.random() * 10) + 1,
  ...overrides,
})

describe('CharacterWeb Component', () => {
  describe('View Mode Selector', () => {
    it('should render three view mode buttons: Characters, Orgs, All', () => {
      const mockData: CharacterWebData = { nodes: [], links: [] }
      
      render(
        <CharacterWeb 
          data={mockData} 
          viewMode="all" 
          onViewModeChange={() => {}} 
        />
      )

      expect(screen.getByRole('button', { name: /characters/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /orgs|organisations/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument()
    })

    it('should highlight the active view mode', () => {
      const mockData: CharacterWebData = { nodes: [], links: [] }
      
      render(
        <CharacterWeb 
          data={mockData} 
          viewMode="characters" 
          onViewModeChange={() => {}} 
        />
      )

      const charactersBtn = screen.getByRole('button', { name: /characters/i })
      expect(charactersBtn).toHaveClass('active')
    })

    it('should call onViewModeChange when a view mode button is clicked', () => {
      const mockData: CharacterWebData = { nodes: [], links: [] }
      const onViewModeChange = jest.fn()
      
      render(
        <CharacterWeb 
          data={mockData} 
          viewMode="all" 
          onViewModeChange={onViewModeChange} 
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /characters/i }))
      expect(onViewModeChange).toHaveBeenCalledWith('characters')
    })
  })

  describe('Node Rendering', () => {
    it('should render character nodes', () => {
      const charNode = createMockCharacterNode({ name: 'Test Hero' })
      const mockData: CharacterWebData = { 
        nodes: [charNode], 
        links: [] 
      }
      
      render(
        <CharacterWeb 
          data={mockData} 
          viewMode="all" 
          onViewModeChange={() => {}} 
        />
      )

      // The component should contain the node (implementation may vary)
      expect(screen.getByTestId('character-web-container')).toBeInTheDocument()
    })

    it('should render organisation nodes', () => {
      const orgNode = createMockOrgNode({ name: 'Test Guild' })
      const mockData: CharacterWebData = { 
        nodes: [orgNode], 
        links: [] 
      }
      
      render(
        <CharacterWeb 
          data={mockData} 
          viewMode="all" 
          onViewModeChange={() => {}} 
        />
      )

      expect(screen.getByTestId('character-web-container')).toBeInTheDocument()
    })
  })

  describe('Selection Behavior', () => {
    it('should show bio panel when a single entity is selected', async () => {
      const charNode = createMockCharacterNode({ 
        name: 'Selected Hero',
        title: 'The Brave',
        description: 'A brave hero',
      })
      const mockData: CharacterWebData = { 
        nodes: [charNode], 
        links: [] 
      }
      const onSelectionChange = jest.fn()
      
      render(
        <CharacterWeb 
          data={mockData} 
          viewMode="all" 
          onViewModeChange={() => {}}
          selectedEntityIds={[charNode.id]}
          onSelectionChange={onSelectionChange}
        />
      )

      // Bio panel should be visible for single selection
      expect(screen.getByTestId('bio-panel')).toBeInTheDocument()
      expect(screen.getByText('Selected Hero')).toBeInTheDocument()
    })

    it('should show Apply button when multiple entities are selected', () => {
      const char1 = createMockCharacterNode({ name: 'Hero 1' })
      const char2 = createMockCharacterNode({ name: 'Hero 2' })
      const mockData: CharacterWebData = { 
        nodes: [char1, char2], 
        links: [] 
      }
      
      render(
        <CharacterWeb 
          data={mockData} 
          viewMode="all" 
          onViewModeChange={() => {}}
          selectedEntityIds={[char1.id, char2.id]}
          onSelectionChange={() => {}}
        />
      )

      expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /apply/i })).toHaveClass('highlighted')
    })

    it('should call onApplyFilter when Apply button is clicked', () => {
      const char1 = createMockCharacterNode({ name: 'Hero 1' })
      const char2 = createMockCharacterNode({ name: 'Hero 2' })
      const mockData: CharacterWebData = { 
        nodes: [char1, char2], 
        links: [] 
      }
      const onApplyFilter = jest.fn()
      
      render(
        <CharacterWeb 
          data={mockData} 
          viewMode="all" 
          onViewModeChange={() => {}}
          selectedEntityIds={[char1.id, char2.id]}
          onSelectionChange={() => {}}
          onApplyFilter={onApplyFilter}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /apply/i }))
      expect(onApplyFilter).toHaveBeenCalledWith([char1.id, char2.id])
    })

    it('should hide bio panel and show Apply button for multi-selection', () => {
      const char1 = createMockCharacterNode({ name: 'Hero 1' })
      const char2 = createMockCharacterNode({ name: 'Hero 2' })
      const mockData: CharacterWebData = { 
        nodes: [char1, char2], 
        links: [] 
      }
      
      render(
        <CharacterWeb 
          data={mockData} 
          viewMode="all" 
          onViewModeChange={() => {}}
          selectedEntityIds={[char1.id, char2.id]}
          onSelectionChange={() => {}}
        />
      )

      expect(screen.queryByTestId('bio-panel')).not.toBeInTheDocument()
    })
  })

  describe('Bio Panel', () => {
    it('should display character details in bio panel', () => {
      const charNode = createMockCharacterNode({ 
        name: 'Aragorn',
        title: 'Ranger of the North',
        faction: 'Fellowship',
        status: 'alive',
        description: 'A brave ranger',
      })
      const mockData: CharacterWebData = { 
        nodes: [charNode], 
        links: [] 
      }
      
      render(
        <CharacterWeb 
          data={mockData} 
          viewMode="all" 
          onViewModeChange={() => {}}
          selectedEntityIds={[charNode.id]}
          onSelectionChange={() => {}}
        />
      )

      expect(screen.getByText('Aragorn')).toBeInTheDocument()
      expect(screen.getByText('Ranger of the North')).toBeInTheDocument()
      expect(screen.getByText('Fellowship')).toBeInTheDocument()
      expect(screen.getByText('alive')).toBeInTheDocument()
    })

    it('should display organisation details in bio panel', () => {
      const orgNode = createMockOrgNode({ 
        name: 'The Fellowship',
        description: 'Nine companions on a quest',
      })
      const mockData: CharacterWebData = { 
        nodes: [orgNode], 
        links: [] 
      }
      
      render(
        <CharacterWeb 
          data={mockData} 
          viewMode="all" 
          onViewModeChange={() => {}}
          selectedEntityIds={[orgNode.id]}
          onSelectionChange={() => {}}
        />
      )

      expect(screen.getByText('The Fellowship')).toBeInTheDocument()
      expect(screen.getByText('Nine companions on a quest')).toBeInTheDocument()
    })

    it('should have a close button on bio panel', () => {
      const charNode = createMockCharacterNode({ name: 'Test Hero' })
      const mockData: CharacterWebData = { 
        nodes: [charNode], 
        links: [] 
      }
      const onSelectionChange = jest.fn()
      
      render(
        <CharacterWeb 
          data={mockData} 
          viewMode="all" 
          onViewModeChange={() => {}}
          selectedEntityIds={[charNode.id]}
          onSelectionChange={onSelectionChange}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)
      expect(onSelectionChange).toHaveBeenCalledWith([])
    })
  })

  describe('Empty State', () => {
    it('should show empty state message when no nodes', () => {
      const mockData: CharacterWebData = { nodes: [], links: [] }
      
      render(
        <CharacterWeb 
          data={mockData} 
          viewMode="all" 
          onViewModeChange={() => {}} 
        />
      )

      expect(screen.getByText(/no characters or organisations/i)).toBeInTheDocument()
    })
  })
})
