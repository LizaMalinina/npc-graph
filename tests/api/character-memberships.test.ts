/**
 * Character Membership API Tests
 * 
 * Manages the many-to-many relationship between Characters and Organisations.
 * - POST /api/characters/:id/memberships - Add character to organisation(s)
 * - DELETE /api/characters/:id/memberships/:orgId - Remove character from organisation
 * - GET /api/characters/:id/memberships - List character's organisations
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

describe('Character Membership API', () => {
  let testCampaignId: string
  let characterId: string
  let org1Id: string
  let org2Id: string
  const testSlug = `test-membership-${Math.random().toString(36).substring(7)}`

  beforeAll(async () => {
    await prisma.$connect()
    
    const campaign = await prisma.campaign.create({
      data: {
        slug: testSlug,
        name: 'Membership API Test Campaign',
      },
    })
    testCampaignId = campaign.id

    const character = await prisma.character.create({
      data: { name: 'Membership Test Character', campaignId: testCampaignId },
    })
    characterId = character.id

    const org1 = await prisma.organisation.create({
      data: { name: 'Organisation Alpha', campaignId: testCampaignId },
    })
    org1Id = org1.id

    const org2 = await prisma.organisation.create({
      data: { name: 'Organisation Beta', campaignId: testCampaignId },
    })
    org2Id = org2.id
  })

  afterAll(async () => {
    await prisma.campaign.delete({ where: { id: testCampaignId } })
    await prisma.$disconnect()
  })

  describe('POST /api/characters/:id/memberships', () => {
    afterEach(async () => {
      // Clean up memberships after each test
      await prisma.character.update({
        where: { id: characterId },
        data: { organisations: { set: [] } },
      })
    })

    it('should add a character to an organisation', async () => {
      const { response, data } = await api(`/api/characters/${characterId}/memberships`, {
        method: 'POST',
        body: JSON.stringify({
          organisationId: org1Id,
        }),
      })

      expect(response.status).toBe(200)
      expect(data.organisations).toBeDefined()
      expect(data.organisations.some((o: { id: string }) => o.id === org1Id)).toBe(true)
    })

    it('should add a character to multiple organisations', async () => {
      const { response, data } = await api(`/api/characters/${characterId}/memberships`, {
        method: 'POST',
        body: JSON.stringify({
          organisationIds: [org1Id, org2Id],
        }),
      })

      expect(response.status).toBe(200)
      expect(data.organisations.length).toBe(2)
    })

    it('should return 400 when no organisation specified', async () => {
      const { response } = await api(`/api/characters/${characterId}/memberships`, {
        method: 'POST',
        body: JSON.stringify({}),
      })

      expect(response.status).toBe(400)
    })

    it('should return 404 for non-existent character', async () => {
      const { response } = await api('/api/characters/non-existent/memberships', {
        method: 'POST',
        body: JSON.stringify({ organisationId: org1Id }),
      })

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/characters/:id/memberships', () => {
    beforeAll(async () => {
      await prisma.character.update({
        where: { id: characterId },
        data: { organisations: { connect: [{ id: org1Id }] } },
      })
    })

    afterAll(async () => {
      await prisma.character.update({
        where: { id: characterId },
        data: { organisations: { set: [] } },
      })
    })

    it('should list all organisations a character belongs to', async () => {
      const { response, data } = await api(`/api/characters/${characterId}/memberships`)

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.some((o: { id: string }) => o.id === org1Id)).toBe(true)
    })

    it('should return empty array for character with no memberships', async () => {
      const loneCharacter = await prisma.character.create({
        data: { name: 'Lone Wolf', campaignId: testCampaignId },
      })

      const { response, data } = await api(`/api/characters/${loneCharacter.id}/memberships`)

      expect(response.status).toBe(200)
      expect(data).toEqual([])

      await prisma.character.delete({ where: { id: loneCharacter.id } })
    })
  })

  describe('DELETE /api/characters/:id/memberships/:orgId', () => {
    beforeEach(async () => {
      await prisma.character.update({
        where: { id: characterId },
        data: { organisations: { connect: [{ id: org1Id }, { id: org2Id }] } },
      })
    })

    afterEach(async () => {
      await prisma.character.update({
        where: { id: characterId },
        data: { organisations: { set: [] } },
      })
    })

    it('should remove a character from an organisation', async () => {
      const { response } = await api(`/api/characters/${characterId}/memberships/${org1Id}`, {
        method: 'DELETE',
      })

      expect(response.status).toBe(200)

      // Verify removal
      const character = await prisma.character.findUnique({
        where: { id: characterId },
        include: { organisations: true },
      })
      expect(character?.organisations.some(o => o.id === org1Id)).toBe(false)
      expect(character?.organisations.some(o => o.id === org2Id)).toBe(true)
    })
  })
})
