/**
 * Campaign Graph API Tests
 * 
 * Tests for the /api/campaigns/:id/graph endpoint.
 * Returns graph data (nodes and links) for the campaign board visualization.
 */

import { prisma } from '@/lib/prisma'

const API_BASE = 'http://localhost:3000/api'

// Helper to make API calls
async function api(path: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, options)
  const data = await response.json()
  return { response, data }
}

describe('Campaign Graph API', () => {
  let testCampaignId: string
  let testCampaignSlug: string
  let testCharacterId: string
  let testOrgId: string

  beforeAll(async () => {
    // Create test campaign
    const campaign = await prisma.campaign.create({
      data: {
        name: 'Test Graph Campaign',
        slug: `test-graph-${Date.now()}`,
        description: 'Campaign for graph API tests',
      },
    })
    testCampaignId = campaign.id
    testCampaignSlug = campaign.slug

    // Create test organisation
    const org = await prisma.organisation.create({
      data: {
        name: 'Test Organisation',
        campaignId: testCampaignId,
        pinColor: '#ff6b6b',
      },
    })
    testOrgId = org.id

    // Create test character
    const character = await prisma.character.create({
      data: {
        name: 'Test Character',
        title: 'Hero',
        campaignId: testCampaignId,
        status: 'alive',
        posX: 100,
        posY: 200,
      },
    })
    testCharacterId = character.id

    // Create a relationship between character and org
    await prisma.universalRelationship.create({
      data: {
        fromEntityId: testCharacterId,
        fromEntityType: 'character',
        toEntityId: testOrgId,
        toEntityType: 'organisation',
        type: 'ally',
        strength: 4,
      },
    })
  })

  afterAll(async () => {
    // Clean up in correct order
    await prisma.universalRelationship.deleteMany({
      where: {
        OR: [
          { fromEntityId: testCharacterId },
          { toEntityId: testCharacterId },
          { fromEntityId: testOrgId },
          { toEntityId: testOrgId },
        ],
      },
    })
    await prisma.character.deleteMany({ where: { campaignId: testCampaignId } })
    await prisma.organisation.deleteMany({ where: { campaignId: testCampaignId } })
    await prisma.campaign.delete({ where: { id: testCampaignId } })
    await prisma.$disconnect()
  })

  describe('GET /api/campaigns/:id/graph', () => {
    it('should return graph data with nodes and links', async () => {
      const { response, data } = await api(`/campaigns/${testCampaignId}/graph`)

      expect(response.status).toBe(200)
      expect(data.nodes).toBeDefined()
      expect(data.links).toBeDefined()
      expect(Array.isArray(data.nodes)).toBe(true)
      expect(Array.isArray(data.links)).toBe(true)
    })

    it('should include campaign metadata', async () => {
      const { response, data } = await api(`/campaigns/${testCampaignId}/graph`)

      expect(response.status).toBe(200)
      expect(data.campaign).toBeDefined()
      expect(data.campaign.id).toBe(testCampaignId)
      expect(data.campaign.name).toBe('Test Graph Campaign')
    })

    it('should return character nodes with correct properties', async () => {
      const { response, data } = await api(`/campaigns/${testCampaignId}/graph`)

      expect(response.status).toBe(200)
      
      const characterNode = data.nodes.find((n: any) => n.entityType === 'character')
      expect(characterNode).toBeDefined()
      expect(characterNode.name).toBe('Test Character')
      expect(characterNode.title).toBe('Hero')
      expect(characterNode.x).toBe(100)
      expect(characterNode.y).toBe(200)
    })

    it('should return organisation nodes with correct properties', async () => {
      const { response, data } = await api(`/campaigns/${testCampaignId}/graph`)

      expect(response.status).toBe(200)
      
      const orgNode = data.nodes.find((n: any) => n.entityType === 'organisation')
      expect(orgNode).toBeDefined()
      expect(orgNode.name).toBe('Test Organisation')
      expect(orgNode.pinColor).toBe('#ff6b6b')
    })

    it('should return relationship links', async () => {
      const { response, data } = await api(`/campaigns/${testCampaignId}/graph`)

      expect(response.status).toBe(200)
      expect(data.links.length).toBeGreaterThanOrEqual(1)
      
      const link = data.links[0]
      expect(link.source).toBeDefined()
      expect(link.target).toBeDefined()
      expect(link.type).toBe('ally')
      expect(link.strength).toBe(4)
    })

    it('should work with campaign slug instead of id', async () => {
      const { response, data } = await api(`/campaigns/${testCampaignSlug}/graph`)

      expect(response.status).toBe(200)
      expect(data.campaign.id).toBe(testCampaignId)
    })

    it('should return 404 for non-existent campaign', async () => {
      const { response } = await api('/campaigns/non-existent-campaign/graph')

      expect(response.status).toBe(404)
    })

    it('should return empty nodes array for campaign with no entities', async () => {
      // Create empty campaign
      const emptyCampaign = await prisma.campaign.create({
        data: {
          name: 'Empty Test Campaign',
          slug: `empty-test-${Date.now()}`,
        },
      })

      try {
        const { response, data } = await api(`/campaigns/${emptyCampaign.id}/graph`)

        expect(response.status).toBe(200)
        expect(data.nodes).toEqual([])
        expect(data.links).toEqual([])
      } finally {
        await prisma.campaign.delete({ where: { id: emptyCampaign.id } })
      }
    })
  })
})
