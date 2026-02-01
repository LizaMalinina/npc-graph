/**
 * Character Web Graph API Tests
 * 
 * This endpoint returns the complete graph data for the Character Web visualization.
 * It supports filtering by view mode: 'characters', 'organisations', 'all'
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

describe('Character Web Graph API', () => {
  let testCampaignId: string
  let char1Id: string
  let char2Id: string
  let org1Id: string
  let org2Id: string
  let charToCharRelId: string
  let orgToOrgRelId: string
  let charToOrgRelId: string
  const testSlug = `test-graph-${Math.random().toString(36).substring(7)}`

  beforeAll(async () => {
    await prisma.$connect()
    
    // Create test campaign
    const campaign = await prisma.campaign.create({
      data: {
        slug: testSlug,
        name: 'Graph API Test Campaign',
      },
    })
    testCampaignId = campaign.id

    // Create characters
    const char1 = await prisma.character.create({
      data: { 
        name: 'Hero', 
        title: 'The Brave',
        faction: 'Good Guys',
        status: 'alive',
        campaignId: testCampaignId,
        posX: 100,
        posY: 200,
      },
    })
    char1Id = char1.id

    const char2 = await prisma.character.create({
      data: { 
        name: 'Sidekick', 
        faction: 'Good Guys',
        campaignId: testCampaignId,
        posX: 300,
        posY: 200,
      },
    })
    char2Id = char2.id

    // Create organisations
    const org1 = await prisma.organisation.create({
      data: { 
        name: 'Heroes Guild',
        description: 'A guild of heroes',
        campaignId: testCampaignId,
        posX: 200,
        posY: 400,
      },
    })
    org1Id = org1.id

    const org2 = await prisma.organisation.create({
      data: { 
        name: 'Villains Corp',
        campaignId: testCampaignId,
      },
    })
    org2Id = org2.id

    // Create relationships
    const charToChar = await prisma.universalRelationship.create({
      data: {
        fromEntityId: char1Id,
        fromEntityType: 'character',
        toEntityId: char2Id,
        toEntityType: 'character',
        type: 'friend',
        strength: 8,
      },
    })
    charToCharRelId = charToChar.id

    const orgToOrg = await prisma.universalRelationship.create({
      data: {
        fromEntityId: org1Id,
        fromEntityType: 'organisation',
        toEntityId: org2Id,
        toEntityType: 'organisation',
        type: 'rival',
        strength: 9,
      },
    })
    orgToOrgRelId = orgToOrg.id

    const charToOrg = await prisma.universalRelationship.create({
      data: {
        fromEntityId: char1Id,
        fromEntityType: 'character',
        toEntityId: org1Id,
        toEntityType: 'organisation',
        type: 'member',
        strength: 10,
      },
    })
    charToOrgRelId = charToOrg.id
  })

  afterAll(async () => {
    await prisma.universalRelationship.deleteMany({
      where: { id: { in: [charToCharRelId, orgToOrgRelId, charToOrgRelId] } },
    })
    await prisma.campaign.delete({ where: { id: testCampaignId } })
    await prisma.$disconnect()
  })

  describe('GET /api/campaigns/:id/character-web', () => {
    it('should return graph data with nodes and links', async () => {
      const { response, data } = await api(`/api/campaigns/${testCampaignId}/character-web`)

      expect(response.status).toBe(200)
      expect(data.nodes).toBeDefined()
      expect(data.links).toBeDefined()
      expect(Array.isArray(data.nodes)).toBe(true)
      expect(Array.isArray(data.links)).toBe(true)
    })

    it('should return all entities when viewMode is "all"', async () => {
      const { response, data } = await api(`/api/campaigns/${testCampaignId}/character-web?viewMode=all`)

      expect(response.status).toBe(200)
      
      // Should have both characters and organisations
      const characterNodes = data.nodes.filter((n: { entityType: string }) => n.entityType === 'character')
      const orgNodes = data.nodes.filter((n: { entityType: string }) => n.entityType === 'organisation')
      
      expect(characterNodes.length).toBeGreaterThanOrEqual(2)
      expect(orgNodes.length).toBeGreaterThanOrEqual(2)
    })

    it('should return only characters when viewMode is "characters"', async () => {
      const { response, data } = await api(`/api/campaigns/${testCampaignId}/character-web?viewMode=characters`)

      expect(response.status).toBe(200)
      
      // Should only have character nodes
      expect(data.nodes.every((n: { entityType: string }) => n.entityType === 'character')).toBe(true)
      expect(data.nodes.length).toBeGreaterThanOrEqual(2)
      
      // Links should only be character-to-character
      expect(data.links.every((l: { sourceType: string; targetType: string }) => 
        l.sourceType === 'character' && l.targetType === 'character'
      )).toBe(true)
    })

    it('should return only organisations when viewMode is "organisations"', async () => {
      const { response, data } = await api(`/api/campaigns/${testCampaignId}/character-web?viewMode=organisations`)

      expect(response.status).toBe(200)
      
      // Should only have organisation nodes
      expect(data.nodes.every((n: { entityType: string }) => n.entityType === 'organisation')).toBe(true)
      expect(data.nodes.length).toBeGreaterThanOrEqual(2)
      
      // Links should only be organisation-to-organisation
      expect(data.links.every((l: { sourceType: string; targetType: string }) => 
        l.sourceType === 'organisation' && l.targetType === 'organisation'
      )).toBe(true)
    })

    it('should include node properties for visualization', async () => {
      const { response, data } = await api(`/api/campaigns/${testCampaignId}/character-web?viewMode=characters`)

      expect(response.status).toBe(200)
      
      const heroNode = data.nodes.find((n: { name: string }) => n.name === 'Hero')
      expect(heroNode).toBeDefined()
      expect(heroNode.id).toBe(char1Id)
      expect(heroNode.entityType).toBe('character')
      expect(heroNode.title).toBe('The Brave')
      expect(heroNode.faction).toBe('Good Guys')
      expect(heroNode.status).toBe('alive')
      expect(heroNode.x).toBe(100)
      expect(heroNode.y).toBe(200)
    })

    it('should include link properties for visualization', async () => {
      const { response, data } = await api(`/api/campaigns/${testCampaignId}/character-web?viewMode=all`)

      expect(response.status).toBe(200)
      
      const friendLink = data.links.find((l: { type: string }) => l.type === 'friend')
      expect(friendLink).toBeDefined()
      expect(friendLink.source).toBe(char1Id)
      expect(friendLink.target).toBe(char2Id)
      expect(friendLink.sourceType).toBe('character')
      expect(friendLink.targetType).toBe('character')
      expect(friendLink.strength).toBe(8)
    })

    it('should return 404 for non-existent campaign', async () => {
      const { response } = await api('/api/campaigns/non-existent-id/character-web')

      expect(response.status).toBe(404)
    })

    it('should support lookup by campaign slug', async () => {
      const { response, data } = await api(`/api/campaigns/${testSlug}/character-web`)

      expect(response.status).toBe(200)
      expect(data.nodes).toBeDefined()
      expect(data.links).toBeDefined()
      expect(data.nodes.length).toBeGreaterThanOrEqual(2)
    })

    it('should filter entities by selectedEntityIds', async () => {
      // When entities are selected, return only those entities and their direct connections
      const { response, data } = await api(
        `/api/campaigns/${testCampaignId}/character-web?selectedEntityIds=${char1Id}`
      )

      expect(response.status).toBe(200)
      
      // Should include char1 and its directly connected entities
      const nodeIds = data.nodes.map((n: { id: string }) => n.id)
      expect(nodeIds).toContain(char1Id)
      // char2 is connected via friend relationship
      expect(nodeIds).toContain(char2Id)
      // org1 is connected via member relationship
      expect(nodeIds).toContain(org1Id)
      // org2 should NOT be included (not directly connected to char1)
      expect(nodeIds).not.toContain(org2Id)
    })
  })
})
