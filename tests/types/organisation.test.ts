/**
 * Organisation Entity Type Tests
 * 
 * These tests define the specification for the Organisation entity,
 * which replaces the old Crew concept in the Character Web domain model.
 */

import { Organisation, EntityType } from '@/types'

describe('Organisation Entity', () => {
  describe('type definition', () => {
    it('should have required properties for an Organisation', () => {
      // Generate test values through randomization
      const randomId = `org-${Math.random().toString(36).substring(7)}`
      const randomName = `Test Organisation ${Math.floor(Math.random() * 1000)}`
      
      const organisation: Organisation = {
        id: randomId,
        name: randomName,
        entityType: 'organisation',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(organisation.id).toBe(randomId)
      expect(organisation.name).toBe(randomName)
      expect(organisation.entityType).toBe('organisation')
      expect(organisation.createdAt).toBeInstanceOf(Date)
      expect(organisation.updatedAt).toBeInstanceOf(Date)
    })

    it('should support optional descriptive properties', () => {
      const randomDescription = `Description ${Math.random().toString(36)}`

      const organisation: Organisation = {
        id: 'test-id',
        name: 'Test Organisation',
        entityType: 'organisation',
        description: randomDescription,
        imageUrl: 'https://example.com/org-image.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(organisation.description).toBe(randomDescription)
      expect(organisation.imageUrl).toBe('https://example.com/org-image.jpg')
    })

    it('should support graph position properties for layout persistence', () => {
      const randomPosX = Math.random() * 1000
      const randomPosY = Math.random() * 1000

      const organisation: Organisation = {
        id: 'test-id',
        name: 'Test Organisation',
        entityType: 'organisation',
        posX: randomPosX,
        posY: randomPosY,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(organisation.posX).toBe(randomPosX)
      expect(organisation.posY).toBe(randomPosY)
    })

    it('should support campaign association', () => {
      const randomCampaignId = `campaign-${Math.random().toString(36).substring(7)}`

      const organisation: Organisation = {
        id: 'test-id',
        name: 'Test Organisation',
        entityType: 'organisation',
        campaignId: randomCampaignId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(organisation.campaignId).toBe(randomCampaignId)
    })

    it('should support having Character members', () => {
      const memberCount = Math.floor(Math.random() * 5) + 1
      const members = Array.from({ length: memberCount }, (_, i) => ({
        id: `char-${i}`,
        name: `Character ${i}`,
        entityType: 'character' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))

      const organisation: Organisation = {
        id: 'test-id',
        name: 'Test Organisation',
        entityType: 'organisation',
        members: members,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(organisation.members).toHaveLength(memberCount)
      expect(organisation.members?.[0].entityType).toBe('character')
    })

    it('should support optional pin color for visual identification', () => {
      const pinColors = ['#fbbf24', '#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ec4899', '#06b6d4']
      const randomPinColor = pinColors[Math.floor(Math.random() * pinColors.length)]

      const organisation: Organisation = {
        id: 'test-id',
        name: 'Test Organisation',
        entityType: 'organisation',
        pinColor: randomPinColor,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(organisation.pinColor).toBe(randomPinColor)
    })

    it('should allow pinColor to be null or undefined', () => {
      const organisationWithNull: Organisation = {
        id: 'test-id',
        name: 'Test Organisation',
        entityType: 'organisation',
        pinColor: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const organisationWithoutPinColor: Organisation = {
        id: 'test-id-2',
        name: 'Test Organisation 2',
        entityType: 'organisation',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(organisationWithNull.pinColor).toBeNull()
      expect(organisationWithoutPinColor.pinColor).toBeUndefined()
    })
  })
})
