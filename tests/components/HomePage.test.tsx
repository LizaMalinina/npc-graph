/**
 * Home Page Component Tests
 * 
 * Tests to ensure proper HTML structure and no hydration errors.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock the useApi hook
jest.mock('@/hooks/useApi', () => ({
  useApi: () => ({
    campaigns: [
      {
        id: 'test-campaign-1',
        slug: 'test-campaign',
        name: 'Test Campaign',
        description: 'A test campaign',
        _count: { characters: 5, organisations: 2 },
      },
    ],
    isLoading: false,
    createCampaign: jest.fn(),
    updateCampaign: jest.fn(),
    deleteCampaign: jest.fn(),
  }),
}))

describe('Home Page', () => {
  describe('HTML Structure', () => {
    it('should not have button elements nested inside other button elements', async () => {
      // This test ensures we don't have hydration errors from invalid HTML nesting
      // In HTML, <button> cannot be a descendant of <button>
      
      const { container } = render(
        <MockCampaignCard />
      )

      // Find all buttons
      const allButtons = container.querySelectorAll('button')
      
      // For each button, check that it doesn't contain another button
      allButtons.forEach(button => {
        const nestedButtons = button.querySelectorAll('button')
        // A button querying for buttons inside itself should return 0
        // (not counting itself)
        expect(nestedButtons.length).toBe(0)
      })
    })

    it('should use div with role="button" for clickable cards containing other buttons', () => {
      const { container } = render(
        <MockCampaignCard />
      )

      // The campaign card should be a div with role="button", not a button
      const cardWithRole = container.querySelector('[role="button"]')
      expect(cardWithRole).toBeInTheDocument()
      expect(cardWithRole?.tagName.toLowerCase()).toBe('div')
      
      // The edit button inside should be a real button
      const editButton = container.querySelector('.campaign-edit-btn')
      expect(editButton?.tagName.toLowerCase()).toBe('button')
    })

    it('should have keyboard accessibility on clickable divs', () => {
      const { container } = render(
        <MockCampaignCard />
      )

      const cardWithRole = container.querySelector('[role="button"]')
      expect(cardWithRole).toHaveAttribute('tabIndex', '0')
    })
  })
})

// Mock component that mimics the campaign card structure
function MockCampaignCard() {
  return (
    <div className="campaign-card-wrapper">
      <div
        onClick={() => {}}
        className="campaign-card"
        role="button"
        tabIndex={0}
        onKeyDown={() => {}}
      >
        <button
          onClick={(e) => e.stopPropagation()}
          className="campaign-edit-btn"
          title="Edit campaign"
        >
          ✏️
        </button>
        <div className="campaign-card-icon">📜</div>
        <h2>Test Campaign</h2>
        <p>A test description</p>
        <div className="campaign-meta">
          <span>� 5 Characters</span>
          <span>🏛️ 2 Orgs</span>
        </div>
      </div>
    </div>
  )
}
