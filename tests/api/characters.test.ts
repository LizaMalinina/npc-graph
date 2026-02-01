/**
 * Character API Endpoint Tests
 * 
 * These tests define the specification for the Character REST API.
 * Following RESTful conventions:
 * - GET /api/characters - List all characters
 * - GET /api/characters/:id - Get a specific character
 * - POST /api/characters - Create a new character
 * - PUT /api/characters/:id - Update a character
 * - DELETE /api/characters/:id - Delete a character
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const BASE_URL = 'http://localhost:3000'

// Helper to make API calls
async function api(path: string, options: RequestInit = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  
  const data = await response.json().catch(() => null)
  return { response, data }
}

describe('Character API', () => {
  let testCampaignId: string
  const testSlug = `test-api-${Math.random().toString(36).substring(7)}`

  beforeAll(async () => {
    await prisma.$connect()
    // Create a test campaign
    const campaign = await prisma.campaign.create({
      data: {
        slug: testSlug,
        name: 'API Test Campaign',
      },
    })
    testCampaignId = campaign.id
  })

  afterAll(async () => {
    // Clean up
    await prisma.campaign.delete({ where: { id: testCampaignId } })
    await prisma.$disconnect()
  })

  describe('POST /api/characters', () => {
    it('should create a new character with required fields', async () => {
      const randomName = `API Test Character ${Math.floor(Math.random() * 10000)}`

      const { response, data } = await api('/api/characters', {
        method: 'POST',
        body: JSON.stringify({
          name: randomName,
          campaignId: testCampaignId,
        }),
      })

      expect(response.status).toBe(201)
      expect(data.id).toBeDefined()
      expect(data.name).toBe(randomName)
      expect(data.campaignId).toBe(testCampaignId)

      // Clean up
      await prisma.character.delete({ where: { id: data.id } })
    })

    it('should create a character with optional fields', async () => {
      const randomTitle = `Title ${Math.floor(Math.random() * 100)}`
      const randomFaction = `Faction ${Math.floor(Math.random() * 10)}`

      const { response, data } = await api('/api/characters', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Detailed Character',
          title: randomTitle,
          description: 'A detailed description',
          faction: randomFaction,
          location: 'Test Location',
          status: 'alive',
          campaignId: testCampaignId,
        }),
      })

      expect(response.status).toBe(201)
      expect(data.title).toBe(randomTitle)
      expect(data.faction).toBe(randomFaction)

      // Clean up
      await prisma.character.delete({ where: { id: data.id } })
    })

    it('should return 400 when name is missing', async () => {
      const { response } = await api('/api/characters', {
        method: 'POST',
        body: JSON.stringify({
          campaignId: testCampaignId,
        }),
      })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/characters', () => {
    let characterId: string

    beforeAll(async () => {
      const character = await prisma.character.create({
        data: {
          name: 'List Test Character',
          campaignId: testCampaignId,
        },
      })
      characterId = character.id
    })

    afterAll(async () => {
      await prisma.character.delete({ where: { id: characterId } })
    })

    it('should list characters for a campaign', async () => {
      const { response, data } = await api(`/api/characters?campaignId=${testCampaignId}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.some((c: { id: string }) => c.id === characterId)).toBe(true)
    })
  })

  describe('GET /api/characters/:id', () => {
    let characterId: string
    const characterName = `Get Test ${Math.floor(Math.random() * 10000)}`

    beforeAll(async () => {
      const character = await prisma.character.create({
        data: {
          name: characterName,
          campaignId: testCampaignId,
        },
      })
      characterId = character.id
    })

    afterAll(async () => {
      await prisma.character.delete({ where: { id: characterId } })
    })

    it('should return a specific character by id', async () => {
      const { response, data } = await api(`/api/characters/${characterId}`)

      expect(response.status).toBe(200)
      expect(data.id).toBe(characterId)
      expect(data.name).toBe(characterName)
    })

    it('should return 404 for non-existent character', async () => {
      const { response } = await api('/api/characters/non-existent-id')

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/characters/:id', () => {
    let characterId: string

    beforeEach(async () => {
      const character = await prisma.character.create({
        data: {
          name: 'Update Test Character',
          campaignId: testCampaignId,
        },
      })
      characterId = character.id
    })

    afterEach(async () => {
      await prisma.character.delete({ where: { id: characterId } }).catch(() => {})
    })

    it('should update a character', async () => {
      const newName = `Updated Name ${Math.floor(Math.random() * 10000)}`

      const { response, data } = await api(`/api/characters/${characterId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: newName,
          status: 'dead',
        }),
      })

      expect(response.status).toBe(200)
      expect(data.name).toBe(newName)
      expect(data.status).toBe('dead')
    })
  })

  describe('DELETE /api/characters/:id', () => {
    it('should delete a character', async () => {
      const character = await prisma.character.create({
        data: {
          name: 'Delete Test Character',
          campaignId: testCampaignId,
        },
      })

      const { response } = await api(`/api/characters/${character.id}`, {
        method: 'DELETE',
      })

      expect(response.status).toBe(200)

      // Verify deletion
      const deleted = await prisma.character.findUnique({
        where: { id: character.id },
      })
      expect(deleted).toBeNull()
    })
  })
})
