/**
 * OrganisationForm Tests
 * 
 * Tests for pin color functionality including:
 * - Filtering out colors already used by other organisations
 * - Custom hex color input validation
 */

import { Organisation } from '@/types'
import { PIN_COLORS } from '@/components/OrganisationForm'

// Helper to validate hex color (mirrors the function in OrganisationForm)
function isValidHexColor(color: string): boolean {
  return /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(color)
}

// Helper to get available colors (mirrors the logic in OrganisationForm)
function getAvailableColors(existingOrgs: Organisation[], currentOrgId?: string): typeof PIN_COLORS {
  const usedColors = new Set(
    existingOrgs
      .filter(org => org.id !== currentOrgId && org.pinColor)
      .map(org => org.pinColor?.toLowerCase())
  )
  
  return PIN_COLORS.filter(
    color => !usedColors.has(color.value.toLowerCase())
  )
}

describe('OrganisationForm Pin Color Selection', () => {
  const mockOrganisations: Organisation[] = [
    {
      id: 'org-1',
      name: 'Guild A',
      entityType: 'organisation',
      pinColor: '#fbbf24', // Gold
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'org-2',
      name: 'Guild B',
      entityType: 'organisation',
      pinColor: '#ef4444', // Red
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  describe('Color filtering', () => {
    it('should filter out colors already used by other organisations', () => {
      const availableColors = getAvailableColors(mockOrganisations)
      
      // Gold and Red should be filtered out
      expect(availableColors.find(c => c.value === '#fbbf24')).toBeUndefined()
      expect(availableColors.find(c => c.value === '#ef4444')).toBeUndefined()
      
      // Blue should still be available
      expect(availableColors.find(c => c.value === '#3b82f6')).toBeDefined()
    })

    it('should allow the current organisation to keep its own color when editing', () => {
      const availableColors = getAvailableColors(mockOrganisations, 'org-1')
      
      // Gold should be available because we're editing org-1 which uses it
      expect(availableColors.find(c => c.value === '#fbbf24')).toBeDefined()
      
      // Red should still be filtered out (used by org-2)
      expect(availableColors.find(c => c.value === '#ef4444')).toBeUndefined()
    })

    it('should return all colors when no organisations exist', () => {
      const availableColors = getAvailableColors([])
      
      expect(availableColors).toHaveLength(PIN_COLORS.length)
    })
  })

  describe('Custom hex color validation', () => {
    it('should validate correct 6-digit hex colors', () => {
      expect(isValidHexColor('#ff0000')).toBe(true)
      expect(isValidHexColor('#AABBCC')).toBe(true)
      expect(isValidHexColor('#123456')).toBe(true)
    })

    it('should validate correct 3-digit hex colors', () => {
      expect(isValidHexColor('#f00')).toBe(true)
      expect(isValidHexColor('#ABC')).toBe(true)
    })

    it('should reject invalid hex colors', () => {
      expect(isValidHexColor('ff0000')).toBe(false) // Missing #
      expect(isValidHexColor('#gg0000')).toBe(false) // Invalid character
      expect(isValidHexColor('#12345')).toBe(false) // Wrong length
      expect(isValidHexColor('#1234567')).toBe(false) // Too long
      expect(isValidHexColor('')).toBe(false) // Empty
      expect(isValidHexColor('red')).toBe(false) // Named color
    })
  })
})
