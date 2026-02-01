/**
 * Universal Relationship API Tests
 * 
 * These tests define the specification for the UniversalRelationship REST API.
 * Supports all relationship combinations:
 * - Character ↔ Character
 * - Organisation ↔ Organisation
 * - Character ↔ Organisation
 * - Organisation ↔ Character
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const BASE_URL = 'http://localhost:3000'

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

describe('Universal Relationship API', () => {
  let testCampaignId: string
  let char1Id: string
  let char2Id: string
  let org1Id: string
  let org2Id: string
  const testSlug = `test-rel-api-${Math.random().toString(36).substring(7)}`

  beforeAll(async () => {
    await prisma.$connect()
    
    const campaign = await prisma.campaign.create({
      data: {
        slug: testSlug,
        name: 'Relationship API Test Campaign',
      },
    })
    testCampaignId = campaign.id

    const char1 = await prisma.character.create({
      data: { name: 'Character A', campaignId: testCampaignId },
    })
    char1Id = char1.id

    const char2 = await prisma.character.create({
      data: { name: 'Character B', campaignId: testCampaignId },
    })
    char2Id = char2.id

    const org1 = await prisma.organisation.create({
      data: { name: 'Organisation A', campaignId: testCampaignId },
    })
    org1Id = org1.id

    const org2 = await prisma.organisation.create({
      data: { name: 'Organisation B', campaignId: testCampaignId },
    })
    org2Id = org2.id
  })

  afterAll(async () => {
    await prisma.campaign.delete({ where: { id: testCampaignId } })
    await prisma.$disconnect()
  })

  describe('POST /api/universal-relationships', () => {
    afterEach(async () => {
      // Clean up relationships created during tests - only for entities in this test campaign
      await prisma.universalRelationship.deleteMany({
        where: {
          OR: [
            { fromEntityId: { in: [char1Id, char2Id, org1Id, org2Id] } },
            { toEntityId: { in: [char1Id, char2Id, org1Id, org2Id] } },
          ],
        },
      })
    })

    it('should create a Character-to-Character relationship', async () => {
      const randomStrength = Math.floor(Math.random() * 10) + 1

      const { response, data } = await api('/api/universal-relationships', {
        method: 'POST',
        body: JSON.stringify({
          fromEntityId: char1Id,
          fromEntityType: 'character',
          toEntityId: char2Id,
          toEntityType: 'character',
          type: 'friend',
          strength: randomStrength,
        }),
      })

      expect(response.status).toBe(201)
      expect(data.id).toBeDefined()
      expect(data.fromEntityType).toBe('character')
      expect(data.toEntityType).toBe('character')
      expect(data.strength).toBe(randomStrength)
    })

    it('should create an Organisation-to-Organisation relationship', async () => {
      const { response, data } = await api('/api/universal-relationships', {
        method: 'POST',
        body: JSON.stringify({
          fromEntityId: org1Id,
          fromEntityType: 'organisation',
          toEntityId: org2Id,
          toEntityType: 'organisation',
          type: 'rival',
          strength: 8,
        }),
      })

      expect(response.status).toBe(201)
      expect(data.fromEntityType).toBe('organisation')
      expect(data.toEntityType).toBe('organisation')
    })

    it('should create a Character-to-Organisation relationship', async () => {
      const { response, data } = await api('/api/universal-relationships', {
        method: 'POST',
        body: JSON.stringify({
          fromEntityId: char1Id,
          fromEntityType: 'character',
          toEntityId: org1Id,
          toEntityType: 'organisation',
          type: 'ally',
          strength: 7,
        }),
      })

      expect(response.status).toBe(201)
      expect(data.fromEntityType).toBe('character')
      expect(data.toEntityType).toBe('organisation')
    })

    it('should create an Organisation-to-Character relationship', async () => {
      const { response, data } = await api('/api/universal-relationships', {
        method: 'POST',
        body: JSON.stringify({
          fromEntityId: org1Id,
          fromEntityType: 'organisation',
          toEntityId: char1Id,
          toEntityType: 'character',
          type: 'employs',
          strength: 9,
        }),
      })

      expect(response.status).toBe(201)
      expect(data.fromEntityType).toBe('organisation')
      expect(data.toEntityType).toBe('character')
    })

    it('should require fromEntityId', async () => {
      const { response } = await api('/api/universal-relationships', {
        method: 'POST',
        body: JSON.stringify({
          fromEntityType: 'character',
          toEntityId: char2Id,
          toEntityType: 'character',
          type: 'friend',
        }),
      })

      expect(response.status).toBe(400)
    })

    it('should support optional description', async () => {
      const randomDescription = `Relationship description ${Math.random().toString(36)}`

      const { response, data } = await api('/api/universal-relationships', {
        method: 'POST',
        body: JSON.stringify({
          fromEntityId: char1Id,
          fromEntityType: 'character',
          toEntityId: char2Id,
          toEntityType: 'character',
          type: 'mentor',
          description: randomDescription,
          strength: 6,
        }),
      })

      expect(response.status).toBe(201)
      expect(data.description).toBe(randomDescription)
    })
  })

  describe('GET /api/universal-relationships', () => {
    let relationshipId: string

    beforeAll(async () => {
      const rel = await prisma.universalRelationship.create({
        data: {
          fromEntityId: char1Id,
          fromEntityType: 'character',
          toEntityId: char2Id,
          toEntityType: 'character',
          type: 'friend',
          strength: 5,
        },
      })
      relationshipId = rel.id
    })

    afterAll(async () => {
      await prisma.universalRelationship.delete({ where: { id: relationshipId } })
    })

    it('should list all relationships', async () => {
      const { response, data } = await api('/api/universal-relationships')

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.some((r: { id: string }) => r.id === relationshipId)).toBe(true)
    })

    it('should filter relationships by entity', async () => {
      const { response, data } = await api(`/api/universal-relationships?entityId=${char1Id}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.every((r: { fromEntityId: string; toEntityId: string }) => 
        r.fromEntityId === char1Id || r.toEntityId === char1Id
      )).toBe(true)
    })
  })

  describe('DELETE /api/universal-relationships/:id', () => {
    it('should delete a relationship', async () => {
      const rel = await prisma.universalRelationship.create({
        data: {
          fromEntityId: char1Id,
          fromEntityType: 'character',
          toEntityId: char2Id,
          toEntityType: 'character',
          type: 'enemy',
          strength: 10,
        },
      })

      const { response } = await api(`/api/universal-relationships/${rel.id}`, {
        method: 'DELETE',
      })

      expect(response.status).toBe(200)

      const deleted = await prisma.universalRelationship.findUnique({
        where: { id: rel.id },
      })
      expect(deleted).toBeNull()
    })
  })
})
