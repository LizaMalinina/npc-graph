/**
 * Campaign API Tests
 * 
 * Tests for the campaigns CRUD API endpoints.
 * Following TDD: Write tests first, then fix implementation.
 */

import { prisma } from '@/lib/prisma'

// Helper to clean up test data
async function cleanupTestCampaigns() {
  await prisma.campaign.deleteMany({
    where: { name: { startsWith: 'Test Campaign' } }
  })
}

describe('Campaigns API', () => {
  beforeEach(async () => {
    await cleanupTestCampaigns()
  })

  afterAll(async () => {
    await cleanupTestCampaigns()
    await prisma.$disconnect()
  })

  describe('POST /api/campaigns', () => {
    it('should create a campaign with just a name', async () => {
      // Arrange
      const campaignName = `Test Campaign ${Date.now()}`
      
      // Act
      const response = await fetch('http://localhost:3000/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: campaignName }),
      })
      
      // Assert
      expect(response.status).toBe(201)
      const campaign = await response.json()
      expect(campaign.name).toBe(campaignName)
      expect(campaign.slug).toBeDefined()
      expect(campaign.id).toBeDefined()
    })

    it('should create a campaign with name and description', async () => {
      // Arrange
      const campaignName = `Test Campaign ${Date.now()}`
      const description = 'A test description'
      
      // Act
      const response = await fetch('http://localhost:3000/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: campaignName, description }),
      })
      
      // Assert
      expect(response.status).toBe(201)
      const campaign = await response.json()
      expect(campaign.name).toBe(campaignName)
      expect(campaign.description).toBe(description)
    })

    it('should return 400 if name is missing', async () => {
      // Act
      const response = await fetch('http://localhost:3000/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'No name provided' }),
      })
      
      // Assert
      expect(response.status).toBe(400)
      const error = await response.json()
      expect(error.error).toBe('Campaign name is required')
    })

    it('should return 400 if name is empty string', async () => {
      // Act
      const response = await fetch('http://localhost:3000/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' }),
      })
      
      // Assert
      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/campaigns', () => {
    it('should return all campaigns', async () => {
      // Arrange - create a test campaign first
      const campaignName = `Test Campaign ${Date.now()}`
      await prisma.campaign.create({
        data: { name: campaignName, slug: `test-${Date.now()}` }
      })
      
      // Act
      const response = await fetch('http://localhost:3000/api/campaigns')
      
      // Assert
      expect(response.status).toBe(200)
      const campaigns = await response.json()
      expect(Array.isArray(campaigns)).toBe(true)
      expect(campaigns.some((c: { name: string }) => c.name === campaignName)).toBe(true)
    })
  })

  describe('PUT /api/campaigns/:id', () => {
    it('should update campaign with imageCrop settings', async () => {
      // Arrange - create a test campaign first
      const campaign = await prisma.campaign.create({
        data: { 
          name: `Test Campaign ${Date.now()}`, 
          slug: `test-imagecrop-${Date.now()}`,
          imageUrl: 'https://example.com/image.jpg'
        }
      })
      
      const imageCrop = {
        zoom: 1.5,
        offsetX: 10,
        offsetY: -5,
        aspectRatio: 'square'
      }
      
      // Act
      const response = await fetch(`http://localhost:3000/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: campaign.name,
          imageCrop 
        }),
      })
      
      // Assert
      expect(response.status).toBe(200)
      const updated = await response.json()
      expect(updated.imageCrop).toBeDefined()
      
      // Verify the stored value
      const stored = await prisma.campaign.findUnique({ where: { id: campaign.id } })
      expect(stored?.imageCrop).toBe(JSON.stringify(imageCrop))
      
      // Cleanup
      await prisma.campaign.delete({ where: { id: campaign.id } })
    })
  })
})
