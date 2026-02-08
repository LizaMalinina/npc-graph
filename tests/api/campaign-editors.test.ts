/**
 * Campaign Editors API Tests
 * 
 * Tests for the /api/campaigns/:id/editors endpoints.
 * Note: These endpoints require admin authentication.
 */

const API_BASE = 'http://localhost:3000/api'

describe('Campaign Editors API', () => {
  // Use a known campaign ID from the seed data
  const existingCampaignId = 'waterdeep-campaign'

  describe('GET /api/campaigns/:id/editors', () => {
    it('should return 403 for unauthenticated requests', async () => {
      const response = await fetch(`${API_BASE}/campaigns/${existingCampaignId}/editors`)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Admin access required')
    })
  })

  describe('POST /api/campaigns/:id/editors', () => {
    it('should return 403 for unauthenticated requests', async () => {
      const response = await fetch(`${API_BASE}/campaigns/${existingCampaignId}/editors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'test-user-id' }),
      })

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Admin access required')
    })
  })

  describe('DELETE /api/campaigns/:id/editors', () => {
    it('should return 403 for unauthenticated requests', async () => {
      const response = await fetch(`${API_BASE}/campaigns/${existingCampaignId}/editors`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'test-user-id' }),
      })

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Admin access required')
    })
  })
})
