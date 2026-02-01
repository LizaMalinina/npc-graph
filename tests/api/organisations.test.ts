/**
 * Organisation API Endpoint Tests
 * 
 * These tests define the specification for the Organisation REST API.
 * Following RESTful conventions:
 * - GET /api/organisations - List all organisations
 * - GET /api/organisations/:id - Get a specific organisation
 * - POST /api/organisations - Create a new organisation
 * - PUT /api/organisations/:id - Update an organisation
 * - DELETE /api/organisations/:id - Delete an organisation
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

describe('Organisation API', () => {
  let testCampaignId: string
  const testSlug = `test-org-api-${Math.random().toString(36).substring(7)}`

  beforeAll(async () => {
    await prisma.$connect()
    const campaign = await prisma.campaign.create({
      data: {
        slug: testSlug,
        name: 'Organisation API Test Campaign',
      },
    })
    testCampaignId = campaign.id
  })

  afterAll(async () => {
    await prisma.campaign.delete({ where: { id: testCampaignId } })
    await prisma.$disconnect()
  })

  describe('POST /api/organisations', () => {
    it('should create a new organisation with required fields', async () => {
      const randomName = `API Test Organisation ${Math.floor(Math.random() * 10000)}`

      const { response, data } = await api('/api/organisations', {
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

      await prisma.organisation.delete({ where: { id: data.id } })
    })

    it('should create an organisation with optional fields', async () => {
      const randomDescription = `Description ${Math.random().toString(36)}`

      const { response, data } = await api('/api/organisations', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Detailed Organisation',
          description: randomDescription,
          imageUrl: 'https://example.com/org.jpg',
          campaignId: testCampaignId,
        }),
      })

      expect(response.status).toBe(201)
      expect(data.description).toBe(randomDescription)

      await prisma.organisation.delete({ where: { id: data.id } })
    })

    it('should create an organisation with pin color', async () => {
      const pinColor = '#3b82f6' // Blue

      const { response, data } = await api('/api/organisations', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Pin Color Organisation',
          pinColor: pinColor,
          campaignId: testCampaignId,
        }),
      })

      expect(response.status).toBe(201)
      expect(data.pinColor).toBe(pinColor)

      await prisma.organisation.delete({ where: { id: data.id } })
    })

    it('should return 400 when name is missing', async () => {
      const { response } = await api('/api/organisations', {
        method: 'POST',
        body: JSON.stringify({
          campaignId: testCampaignId,
        }),
      })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/organisations', () => {
    let organisationId: string

    beforeAll(async () => {
      const organisation = await prisma.organisation.create({
        data: {
          name: 'List Test Organisation',
          campaignId: testCampaignId,
        },
      })
      organisationId = organisation.id
    })

    afterAll(async () => {
      await prisma.organisation.delete({ where: { id: organisationId } })
    })

    it('should list organisations for a campaign', async () => {
      const { response, data } = await api(`/api/organisations?campaignId=${testCampaignId}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.some((o: { id: string }) => o.id === organisationId)).toBe(true)
    })
  })

  describe('GET /api/organisations/:id', () => {
    let organisationId: string
    const orgName = `Get Test Org ${Math.floor(Math.random() * 10000)}`

    beforeAll(async () => {
      const organisation = await prisma.organisation.create({
        data: {
          name: orgName,
          campaignId: testCampaignId,
        },
      })
      organisationId = organisation.id
    })

    afterAll(async () => {
      await prisma.organisation.delete({ where: { id: organisationId } })
    })

    it('should return a specific organisation by id', async () => {
      const { response, data } = await api(`/api/organisations/${organisationId}`)

      expect(response.status).toBe(200)
      expect(data.id).toBe(organisationId)
      expect(data.name).toBe(orgName)
    })

    it('should return 404 for non-existent organisation', async () => {
      const { response } = await api('/api/organisations/non-existent-id')

      expect(response.status).toBe(404)
    })

    it('should include members in the response', async () => {
      // Create a character and add as member
      const character = await prisma.character.create({
        data: {
          name: 'Member Character',
          campaignId: testCampaignId,
          organisations: {
            connect: { id: organisationId },
          },
        },
      })

      const { response, data } = await api(`/api/organisations/${organisationId}`)

      expect(response.status).toBe(200)
      expect(data.members).toBeDefined()
      expect(data.members.some((m: { id: string }) => m.id === character.id)).toBe(true)

      await prisma.character.delete({ where: { id: character.id } })
    })
  })

  describe('PUT /api/organisations/:id', () => {
    let organisationId: string

    beforeEach(async () => {
      const organisation = await prisma.organisation.create({
        data: {
          name: 'Update Test Organisation',
          campaignId: testCampaignId,
        },
      })
      organisationId = organisation.id
    })

    afterEach(async () => {
      await prisma.organisation.delete({ where: { id: organisationId } }).catch(() => {})
    })

    it('should update an organisation', async () => {
      const newName = `Updated Org ${Math.floor(Math.random() * 10000)}`

      const { response, data } = await api(`/api/organisations/${organisationId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: newName,
          description: 'Updated description',
        }),
      })

      expect(response.status).toBe(200)
      expect(data.name).toBe(newName)
      expect(data.description).toBe('Updated description')
    })

    it('should update organisation pin color', async () => {
      const pinColor = '#ef4444' // Red

      const { response, data } = await api(`/api/organisations/${organisationId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Pin Color Test Org',
          pinColor: pinColor,
        }),
      })

      expect(response.status).toBe(200)
      expect(data.pinColor).toBe(pinColor)
    })
  })

  describe('DELETE /api/organisations/:id', () => {
    it('should delete an organisation', async () => {
      const organisation = await prisma.organisation.create({
        data: {
          name: 'Delete Test Organisation',
          campaignId: testCampaignId,
        },
      })

      const { response } = await api(`/api/organisations/${organisation.id}`, {
        method: 'DELETE',
      })

      expect(response.status).toBe(200)

      const deleted = await prisma.organisation.findUnique({
        where: { id: organisation.id },
      })
      expect(deleted).toBeNull()
    })
  })
})
