/**
 * Campaign Can-Edit API Tests
 * 
 * Tests for the /api/campaigns/:id/can-edit endpoint.
 * This endpoint returns whether the current user can edit a campaign.
 */

const API_BASE = 'http://localhost:3000/api'

describe('Campaign Can-Edit API', () => {
  // Use a known campaign ID from the seed data
  const existingCampaignId = 'waterdeep-campaign'

  describe('GET /api/campaigns/:id/can-edit', () => {
    it('should return canEdit: false for unauthenticated requests', async () => {
      const response = await fetch(`${API_BASE}/campaigns/${existingCampaignId}/can-edit`)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.canEdit).toBe(false)
    })

    it('should return 200 even for non-existent campaign (returns false)', async () => {
      const response = await fetch(`${API_BASE}/campaigns/non-existent-campaign/can-edit`)

      // The endpoint doesn't check if campaign exists, just returns permission
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.canEdit).toBe(false)
    })

    it('should support campaign slug lookup', async () => {
      const response = await fetch(`${API_BASE}/campaigns/waterdeep/can-edit`)

      expect(response.status).toBe(200)
      const data = await response.json()
      // Should return false for unauthenticated, but should not error
      expect(typeof data.canEdit).toBe('boolean')
    })
  })
})
