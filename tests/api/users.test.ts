/**
 * Users API Tests
 * 
 * Tests for the /api/users endpoints.
 * Note: These endpoints require admin authentication, so most tests
 * verify that unauthenticated requests are properly rejected.
 */

const API_BASE = 'http://localhost:3000/api'

describe('Users API', () => {
  describe('GET /api/users', () => {
    it('should return 403 for unauthenticated requests', async () => {
      const response = await fetch(`${API_BASE}/users`)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Admin access required')
    })
  })

  describe('GET /api/users/:id', () => {
    it('should return 403 for unauthenticated requests', async () => {
      const response = await fetch(`${API_BASE}/users/test-user-id`)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Admin access required')
    })
  })

  describe('PATCH /api/users/:id', () => {
    it('should return 403 for unauthenticated requests', async () => {
      const response = await fetch(`${API_BASE}/users/test-user-id`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'editor' }),
      })

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Admin access required')
    })
  })

  describe('DELETE /api/users/:id', () => {
    it('should return 403 for unauthenticated requests', async () => {
      const response = await fetch(`${API_BASE}/users/test-user-id`, {
        method: 'DELETE',
      })

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Admin access required')
    })
  })
})
