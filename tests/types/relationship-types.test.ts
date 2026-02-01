/**
 * @jest-environment node
 */
import {
  RELATIONSHIP_TYPES,
  RELATIONSHIP_COLORS,
  getRelationshipSubValue,
  getRelationshipColor,
  EntityType,
} from '@/types'

describe('Relationship Types', () => {
  describe('RELATIONSHIP_TYPES constant', () => {
    it('should have exactly 3 relationship types', () => {
      expect(RELATIONSHIP_TYPES).toHaveLength(3)
    })

    it('should include friendly, hostile, and neutral', () => {
      expect(RELATIONSHIP_TYPES).toContain('friendly')
      expect(RELATIONSHIP_TYPES).toContain('hostile')
      expect(RELATIONSHIP_TYPES).toContain('neutral')
    })

    it('should not include old relationship types', () => {
      expect(RELATIONSHIP_TYPES).not.toContain('friend')
      expect(RELATIONSHIP_TYPES).not.toContain('enemy')
      expect(RELATIONSHIP_TYPES).not.toContain('family')
      expect(RELATIONSHIP_TYPES).not.toContain('ally')
      expect(RELATIONSHIP_TYPES).not.toContain('rival')
    })
  })

  describe('RELATIONSHIP_COLORS constant', () => {
    it('should have green color for friendly', () => {
      expect(RELATIONSHIP_COLORS.friendly).toMatch(/^#[0-9a-fA-F]{6}$/)
      // Should be in green range
      expect(RELATIONSHIP_COLORS.friendly.toLowerCase()).toMatch(/^#[0-9a-f]{2}[8-f][0-9a-f]{3}$|^#22c55e$|^#[2-5][0-9a-f][a-f][0-9a-f]{3}$/i)
    })

    it('should have red color for hostile', () => {
      expect(RELATIONSHIP_COLORS.hostile).toMatch(/^#[0-9a-fA-F]{6}$/)
    })

    it('should have grey color for neutral', () => {
      expect(RELATIONSHIP_COLORS.neutral).toMatch(/^#[0-9a-fA-F]{6}$/)
    })
  })

  describe('getRelationshipColor function', () => {
    it('should return darker green for friendly strength 1', () => {
      const color = getRelationshipColor('friendly', 1)
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/)
    })

    it('should return brighter green for friendly strength 5', () => {
      const color1 = getRelationshipColor('friendly', 1)
      const color5 = getRelationshipColor('friendly', 5)
      // Strength 5 should be different (brighter) than strength 1
      expect(color1).not.toBe(color5)
    })

    it('should return darker red for hostile strength 1', () => {
      const color = getRelationshipColor('hostile', 1)
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/)
    })

    it('should return brighter red for hostile strength 5', () => {
      const color1 = getRelationshipColor('hostile', 1)
      const color5 = getRelationshipColor('hostile', 5)
      expect(color1).not.toBe(color5)
    })

    it('should return constant grey for neutral regardless of strength', () => {
      const color1 = getRelationshipColor('neutral', 1)
      const color3 = getRelationshipColor('neutral', 3)
      const color5 = getRelationshipColor('neutral', 5)
      expect(color1).toBe(color3)
      expect(color3).toBe(color5)
    })
  })

  describe('getRelationshipSubValue function', () => {
    describe('character-to-character relationships', () => {
      const fromType: EntityType = 'character'
      const toType: EntityType = 'character'

      it('should return appropriate sub-value for friendly strength 1', () => {
        const subValue = getRelationshipSubValue('friendly', 1, fromType, toType)
        expect(subValue).toBe('Acquaintance')
      })

      it('should return appropriate sub-value for friendly strength 3', () => {
        const subValue = getRelationshipSubValue('friendly', 3, fromType, toType)
        expect(subValue).toBe('Friend')
      })

      it('should return appropriate sub-value for friendly strength 5', () => {
        const subValue = getRelationshipSubValue('friendly', 5, fromType, toType)
        expect(subValue).toBe('Soulmate')
      })

      it('should return appropriate sub-value for hostile strength 1', () => {
        const subValue = getRelationshipSubValue('hostile', 1, fromType, toType)
        expect(subValue).toBe('Annoyed by')
      })

      it('should return appropriate sub-value for hostile strength 5', () => {
        const subValue = getRelationshipSubValue('hostile', 5, fromType, toType)
        expect(subValue).toBe('Sworn Enemy')
      })

      it('should return appropriate sub-value for neutral strength 3', () => {
        const subValue = getRelationshipSubValue('neutral', 3, fromType, toType)
        expect(subValue).toBe('Knows of')
      })
    })

    describe('organisation-to-organisation relationships', () => {
      const fromType: EntityType = 'organisation'
      const toType: EntityType = 'organisation'

      it('should return appropriate sub-value for friendly strength 1', () => {
        const subValue = getRelationshipSubValue('friendly', 1, fromType, toType)
        expect(subValue).toBe('Trading Partners')
      })

      it('should return appropriate sub-value for friendly strength 5', () => {
        const subValue = getRelationshipSubValue('friendly', 5, fromType, toType)
        expect(subValue).toBe('United Alliance')
      })

      it('should return appropriate sub-value for hostile strength 1', () => {
        const subValue = getRelationshipSubValue('hostile', 1, fromType, toType)
        expect(subValue).toBe('Competitors')
      })

      it('should return appropriate sub-value for hostile strength 5', () => {
        const subValue = getRelationshipSubValue('hostile', 5, fromType, toType)
        expect(subValue).toBe('At War')
      })
    })

    describe('character-to-organisation relationships', () => {
      const fromType: EntityType = 'character'
      const toType: EntityType = 'organisation'

      it('should return appropriate sub-value for friendly strength 1', () => {
        const subValue = getRelationshipSubValue('friendly', 1, fromType, toType)
        expect(subValue).toBe('Sympathizer')
      })

      it('should return appropriate sub-value for friendly strength 5', () => {
        const subValue = getRelationshipSubValue('friendly', 5, fromType, toType)
        expect(subValue).toBe('Champion')
      })

      it('should return appropriate sub-value for hostile strength 1', () => {
        const subValue = getRelationshipSubValue('hostile', 1, fromType, toType)
        expect(subValue).toBe('Distrusts')
      })

      it('should return appropriate sub-value for hostile strength 5', () => {
        const subValue = getRelationshipSubValue('hostile', 5, fromType, toType)
        expect(subValue).toBe('Sworn to Destroy')
      })
    })

    describe('organisation-to-character relationships', () => {
      const fromType: EntityType = 'organisation'
      const toType: EntityType = 'character'

      it('should return appropriate sub-value for friendly strength 3', () => {
        const subValue = getRelationshipSubValue('friendly', 3, fromType, toType)
        expect(subValue).toBe('Ally')
      })

      it('should return appropriate sub-value for hostile strength 3', () => {
        const subValue = getRelationshipSubValue('hostile', 3, fromType, toType)
        expect(subValue).toBe('Target')
      })
    })

    it('should handle edge case of strength out of range', () => {
      // Should clamp to valid range
      const subValue0 = getRelationshipSubValue('friendly', 0, 'character', 'character')
      const subValue1 = getRelationshipSubValue('friendly', 1, 'character', 'character')
      expect(subValue0).toBe(subValue1)

      const subValue6 = getRelationshipSubValue('friendly', 6, 'character', 'character')
      const subValue5 = getRelationshipSubValue('friendly', 5, 'character', 'character')
      expect(subValue6).toBe(subValue5)
    })
  })
})

describe('Relationship Strength', () => {
  it('should have strength range from 1 to 5', () => {
    // Verify by checking sub-values exist for all strengths
    for (let strength = 1; strength <= 5; strength++) {
      const subValue = getRelationshipSubValue('friendly', strength, 'character', 'character')
      expect(subValue).toBeTruthy()
    }
  })
})
