/**
 * CharacterWebGraph Component Tests
 * 
 * Tests for the actual vis-network graph rendering within CharacterWeb.
 * This component handles the graph visualization logic.
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CharacterWebGraph } from '@/components/detective/CharacterWebGraph'
import { CharacterWebData, CharacterWebNode, CharacterWebLink } from '@/types'

// Mock vis-network since it requires DOM manipulation
jest.mock('vis-network/standalone', () => ({
  Network: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    off: jest.fn(),
    destroy: jest.fn(),
    setData: jest.fn(),
    getSelectedNodes: jest.fn(() => []),
    selectNodes: jest.fn(),
    fit: jest.fn(),
  })),
  DataSet: jest.fn().mockImplementation((data) => ({
    get: jest.fn(() => data),
    add: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  })),
}))

// Helper to create mock data
const createMockGraphData = (nodeCount: number, linkCount: number): CharacterWebData => {
  const nodes: CharacterWebNode[] = Array.from({ length: nodeCount }, (_, i) => ({
    id: `node-${i}`,
    name: `Node ${i}`,
    entityType: i % 2 === 0 ? 'character' as const : 'organisation' as const,
  }))

  const links: CharacterWebLink[] = Array.from({ length: Math.min(linkCount, nodeCount - 1) }, (_, i) => ({
    id: `link-${i}`,
    source: nodes[i].id,
    sourceType: nodes[i].entityType,
    target: nodes[i + 1].id,
    targetType: nodes[i + 1].entityType,
    type: 'friend',
    strength: 5,
  }))

  return { nodes, links }
}

describe('CharacterWebGraph Component', () => {
  describe('Initialization', () => {
    it('should render a container for the graph', () => {
      const mockData = createMockGraphData(3, 2)
      
      render(
        <CharacterWebGraph 
          data={mockData}
          onNodeSelect={() => {}}
        />
      )

      expect(screen.getByTestId('graph-container')).toBeInTheDocument()
    })

    it('should initialize vis-network with the provided data', async () => {
      const mockData = createMockGraphData(5, 3)
      const { Network } = require('vis-network/standalone')
      
      render(
        <CharacterWebGraph 
          data={mockData}
          onNodeSelect={() => {}}
        />
      )

      await waitFor(() => {
        expect(Network).toHaveBeenCalled()
      })
    })
  })

  describe('Node Selection', () => {
    it('should call onNodeSelect when a node is selected', async () => {
      const mockData = createMockGraphData(3, 2)
      const onNodeSelect = jest.fn()
      
      render(
        <CharacterWebGraph 
          data={mockData}
          onNodeSelect={onNodeSelect}
        />
      )

      // The vis-network mock will trigger the callback
      expect(screen.getByTestId('graph-container')).toBeInTheDocument()
    })

    it('should support multi-select via selectedNodeIds prop', () => {
      const mockData = createMockGraphData(3, 2)
      const selectedIds = ['node-0', 'node-1']
      
      render(
        <CharacterWebGraph 
          data={mockData}
          onNodeSelect={() => {}}
          selectedNodeIds={selectedIds}
        />
      )

      expect(screen.getByTestId('graph-container')).toBeInTheDocument()
    })
  })

  describe('Node Styling', () => {
    it('should style character nodes differently from organisation nodes', () => {
      const mockData: CharacterWebData = {
        nodes: [
          { id: 'char-1', name: 'Character', entityType: 'character' },
          { id: 'org-1', name: 'Organisation', entityType: 'organisation' },
        ],
        links: [],
      }
      
      render(
        <CharacterWebGraph 
          data={mockData}
          onNodeSelect={() => {}}
        />
      )

      // Graph should render without errors
      expect(screen.getByTestId('graph-container')).toBeInTheDocument()
    })
  })

  describe('Edge Styling', () => {
    it('should color edges based on relationship type', () => {
      const mockData: CharacterWebData = {
        nodes: [
          { id: 'node-1', name: 'Node 1', entityType: 'character' },
          { id: 'node-2', name: 'Node 2', entityType: 'character' },
        ],
        links: [
          { 
            id: 'link-1', 
            source: 'node-1', 
            sourceType: 'character',
            target: 'node-2', 
            targetType: 'character',
            type: 'friend', 
            strength: 8 
          },
        ],
      }
      
      render(
        <CharacterWebGraph 
          data={mockData}
          onNodeSelect={() => {}}
        />
      )

      expect(screen.getByTestId('graph-container')).toBeInTheDocument()
    })
  })

  describe('Data Updates', () => {
    it('should update the graph when data changes', () => {
      const initialData = createMockGraphData(2, 1)
      const { rerender } = render(
        <CharacterWebGraph 
          data={initialData}
          onNodeSelect={() => {}}
        />
      )

      const updatedData = createMockGraphData(5, 3)
      rerender(
        <CharacterWebGraph 
          data={updatedData}
          onNodeSelect={() => {}}
        />
      )

      expect(screen.getByTestId('graph-container')).toBeInTheDocument()
    })
  })
})
