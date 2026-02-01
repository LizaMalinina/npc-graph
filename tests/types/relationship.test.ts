/**
 * Universal Relationship Tests
 * 
 * These tests define the specification for relationships in the Character Web.
 * Relationships can exist between:
 * - Character ↔ Character
 * - Organisation ↔ Organisation
 * - Character ↔ Organisation
 * - Organisation ↔ Character
 */

import { UniversalRelationship, EntityType } from '@/types'

describe('UniversalRelationship', () => {
  describe('type definition', () => {
    it('should have required properties for a relationship', () => {
      const randomId = `rel-${Math.random().toString(36).substring(7)}`
      const randomStrength = Math.floor(Math.random() * 10) + 1

      const relationship: UniversalRelationship = {
        id: randomId,
        fromEntityId: 'entity-1',
        fromEntityType: 'character',
        toEntityId: 'entity-2',
        toEntityType: 'character',
        type: 'friend',
        strength: randomStrength,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(relationship.id).toBe(randomId)
      expect(relationship.fromEntityId).toBe('entity-1')
      expect(relationship.toEntityId).toBe('entity-2')
      expect(relationship.strength).toBe(randomStrength)
    })

    it('should support Character to Character relationships', () => {
      const relationship: UniversalRelationship = {
        id: 'rel-1',
        fromEntityId: 'char-1',
        fromEntityType: 'character',
        toEntityId: 'char-2',
        toEntityType: 'character',
        type: 'rival',
        strength: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(relationship.fromEntityType).toBe('character')
      expect(relationship.toEntityType).toBe('character')
    })

    it('should support Organisation to Organisation relationships', () => {
      const relationship: UniversalRelationship = {
        id: 'rel-2',
        fromEntityId: 'org-1',
        fromEntityType: 'organisation',
        toEntityId: 'org-2',
        toEntityType: 'organisation',
        type: 'ally',
        strength: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(relationship.fromEntityType).toBe('organisation')
      expect(relationship.toEntityType).toBe('organisation')
    })

    it('should support Character to Organisation relationships', () => {
      const relationship: UniversalRelationship = {
        id: 'rel-3',
        fromEntityId: 'char-1',
        fromEntityType: 'character',
        toEntityId: 'org-1',
        toEntityType: 'organisation',
        type: 'member',
        strength: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(relationship.fromEntityType).toBe('character')
      expect(relationship.toEntityType).toBe('organisation')
    })

    it('should support Organisation to Character relationships', () => {
      const relationship: UniversalRelationship = {
        id: 'rel-4',
        fromEntityId: 'org-1',
        fromEntityType: 'organisation',
        toEntityId: 'char-1',
        toEntityType: 'character',
        type: 'employs',
        strength: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(relationship.fromEntityType).toBe('organisation')
      expect(relationship.toEntityType).toBe('character')
    })

    it('should support optional description', () => {
      const randomDescription = `Relationship description ${Math.random().toString(36)}`

      const relationship: UniversalRelationship = {
        id: 'rel-5',
        fromEntityId: 'char-1',
        fromEntityType: 'character',
        toEntityId: 'char-2',
        toEntityType: 'character',
        type: 'friend',
        description: randomDescription,
        strength: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(relationship.description).toBe(randomDescription)
    })
  })
})
