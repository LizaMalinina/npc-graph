/**
 * Character Entity Type Tests
 * 
 * These tests define the specification for the Character entity,
 * which replaces the old NPC concept in the Character Web domain model.
 */

import { Character, EntityType } from '@/types'

describe('Character Entity', () => {
  describe('type definition', () => {
    it('should have required properties for a Character', () => {
      // Generate test values through randomization
      const randomId = `char-${Math.random().toString(36).substring(7)}`
      const randomName = `Test Character ${Math.floor(Math.random() * 1000)}`
      
      const character: Character = {
        id: randomId,
        name: randomName,
        entityType: 'character',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(character.id).toBe(randomId)
      expect(character.name).toBe(randomName)
      expect(character.entityType).toBe('character')
      expect(character.createdAt).toBeInstanceOf(Date)
      expect(character.updatedAt).toBeInstanceOf(Date)
    })

    it('should support optional descriptive properties', () => {
      const randomTitle = `Title ${Math.floor(Math.random() * 100)}`
      const randomDescription = `Description ${Math.random().toString(36)}`
      const randomFaction = `Faction ${Math.floor(Math.random() * 10)}`
      const randomLocation = `Location ${Math.floor(Math.random() * 10)}`

      const character: Character = {
        id: 'test-id',
        name: 'Test Character',
        entityType: 'character',
        title: randomTitle,
        description: randomDescription,
        imageUrl: 'https://example.com/image.jpg',
        faction: randomFaction,
        location: randomLocation,
        status: 'alive',
        tags: 'tag1,tag2',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(character.title).toBe(randomTitle)
      expect(character.description).toBe(randomDescription)
      expect(character.faction).toBe(randomFaction)
      expect(character.location).toBe(randomLocation)
      expect(character.status).toBe('alive')
    })

    it('should support graph position properties for layout persistence', () => {
      const randomPosX = Math.random() * 1000
      const randomPosY = Math.random() * 1000

      const character: Character = {
        id: 'test-id',
        name: 'Test Character',
        entityType: 'character',
        posX: randomPosX,
        posY: randomPosY,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(character.posX).toBe(randomPosX)
      expect(character.posY).toBe(randomPosY)
    })

    it('should support campaign association', () => {
      const randomCampaignId = `campaign-${Math.random().toString(36).substring(7)}`

      const character: Character = {
        id: 'test-id',
        name: 'Test Character',
        entityType: 'character',
        campaignId: randomCampaignId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(character.campaignId).toBe(randomCampaignId)
    })
  })
})

describe('EntityType', () => {
  it('should distinguish between character and organisation types', () => {
    const characterType: EntityType = 'character'
    const organisationType: EntityType = 'organisation'

    expect(characterType).toBe('character')
    expect(organisationType).toBe('organisation')
  })
})
