/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import CharacterForm from '@/components/CharacterForm'
import { Organisation } from '@/types'

describe('CharacterForm Component', () => {
  const mockOnSubmit = jest.fn()
  const mockOnCancel = jest.fn()
  const mockOrganisations: Organisation[] = [
    { id: 'org-1', name: 'The Guild', createdAt: new Date(), updatedAt: new Date() },
    { id: 'org-2', name: 'The Order', createdAt: new Date(), updatedAt: new Date() },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Unified Character Creation Layout', () => {
    it('should NOT show Independent/Org Member toggle buttons', () => {
      render(
        <CharacterForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          organisations={mockOrganisations}
          allowCharacterTypeSelection={true}
        />
      )
      
      // Should NOT have the toggle buttons
      expect(screen.queryByText('Independent')).not.toBeInTheDocument()
      expect(screen.queryByText('Org Member')).not.toBeInTheDocument()
    })

    it('should show organisation selector as optional dropdown', () => {
      render(
        <CharacterForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          organisations={mockOrganisations}
        />
      )
      
      // Should have an organisation dropdown with "None" option
      const orgSelect = screen.getByLabelText(/organisation/i)
      expect(orgSelect).toBeInTheDocument()
      expect(screen.getByText('None')).toBeInTheDocument()
    })

    it('should have organisation selector after Title field', () => {
      render(
        <CharacterForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          organisations={mockOrganisations}
        />
      )
      
      // Get the form container and check field order via DOM structure
      const container = document.querySelector('form')
      const labels = container?.querySelectorAll('label')
      const labelTexts = Array.from(labels || []).map(l => l.textContent?.trim())
      
      const titleIndex = labelTexts.findIndex(t => t === 'Title')
      const orgIndex = labelTexts.findIndex(t => t?.includes('Organisation'))
      const descIndex = labelTexts.findIndex(t => t === 'Description')
      
      // Organisation should be between Title and Description
      expect(orgIndex).toBeGreaterThan(titleIndex)
      expect(orgIndex).toBeLessThan(descIndex)
    })

    it('should allow submitting character without organisation', () => {
      render(
        <CharacterForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          organisations={mockOrganisations}
        />
      )
      
      // Fill required name field
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test Character' } })
      
      // Submit without selecting organisation
      fireEvent.click(screen.getByRole('button', { name: /create|save/i }))
      
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Character',
        })
      )
      // Should NOT include organisationId when none selected
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.not.objectContaining({
          organisationId: expect.any(String),
        })
      )
    })

    it('should allow submitting character with organisation', () => {
      render(
        <CharacterForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          organisations={mockOrganisations}
        />
      )
      
      // Fill required name field
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Guild Member' } })
      
      // Open organisation dropdown and select an organisation
      const orgButton = screen.getByLabelText(/organisation/i)
      fireEvent.click(orgButton)
      
      // Click on the organisation option
      fireEvent.click(screen.getByRole('button', { name: 'The Guild' }))
      
      // Submit
      fireEvent.click(screen.getByRole('button', { name: /create|save/i }))
      
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Guild Member',
          organisationId: 'org-1',
        })
      )
    })

    it('should show all organisation options plus None in alphabetical order', () => {
      render(
        <CharacterForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          organisations={mockOrganisations}
        />
      )
      
      // Open the dropdown
      const orgButton = screen.getByLabelText(/organisation/i)
      fireEvent.click(orgButton)
      
      // Should have None + all organisations (sorted alphabetically)
      expect(screen.getByRole('button', { name: 'None' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'The Guild' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'The Order' })).toBeInTheDocument()
      
      // Check alphabetical order: The Guild, The Order
      const options = screen.getAllByRole('button').filter(b => 
        ['None', 'The Guild', 'The Order'].includes(b.textContent || '')
      )
      expect(options[0]).toHaveTextContent('None')
      expect(options[1]).toHaveTextContent('The Guild')
      expect(options[2]).toHaveTextContent('The Order')
    })

    it('should filter organisations when searching', () => {
      render(
        <CharacterForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          organisations={mockOrganisations}
        />
      )
      
      // Open the dropdown
      const orgButton = screen.getByLabelText(/organisation/i)
      fireEvent.click(orgButton)
      
      // Type in search
      const searchInput = screen.getByPlaceholderText(/search organisations/i)
      fireEvent.change(searchInput, { target: { value: 'Guild' } })
      
      // Should show only matching organisation
      expect(screen.getByRole('button', { name: 'The Guild' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'The Order' })).not.toBeInTheDocument()
    })
  })

  describe('Field Layout', () => {
    it('should show all character fields in unified layout', () => {
      render(
        <CharacterForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          organisations={mockOrganisations}
        />
      )
      
      // All these fields should be visible for all characters
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByLabelText(/organisation/i)).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Image')).toBeInTheDocument()
      expect(screen.getByText('Faction')).toBeInTheDocument()
      expect(screen.getByText('Location')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Tags')).toBeInTheDocument()
    })
  })

  describe('Editing existing character', () => {
    it('should pre-select organisation when editing character with membership', () => {
      const characterWithOrg = {
        id: 'char-1',
        name: 'Guild Member',
        status: 'alive',
        createdAt: new Date(),
        updatedAt: new Date(),
        organisations: [mockOrganisations[0]],
      }
      
      render(
        <CharacterForm
          character={characterWithOrg}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          organisations={mockOrganisations}
        />
      )
      
      // The dropdown button should show the pre-selected organisation name
      const orgButton = screen.getByLabelText(/organisation/i)
      expect(orgButton).toHaveTextContent('The Guild')
    })
  })
})
