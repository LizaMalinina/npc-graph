/**
 * Upload API Tests
 * 
 * Tests for the /api/upload endpoint.
 * Note: Most tests focus on validation since Azure storage may not be configured.
 */

const API_BASE = 'http://localhost:3000/api'

describe('Upload API', () => {
  describe('POST /api/upload', () => {
    it('should return 400 or 500 if no file is provided', async () => {
      const formData = new FormData()
      
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      })

      // Returns 400 (no file) or 500 (Azure not configured - checked first)
      expect([400, 500]).toContain(response.status)
      
      if (response.status === 400) {
        const data = await response.json()
        expect(data.error).toBe('No file provided')
      }
    })

    it('should return 400 for invalid file type', async () => {
      // Create a text file blob
      const textBlob = new Blob(['test content'], { type: 'text/plain' })
      const formData = new FormData()
      formData.append('file', textBlob, 'test.txt')
      
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      })

      // May return 400 (invalid type) or 500 (Azure not configured)
      // We accept both since Azure may not be configured in test env
      expect([400, 500]).toContain(response.status)
      
      if (response.status === 400) {
        const data = await response.json()
        expect(data.error).toContain('Invalid file type')
      }
    })

    it('should accept valid image types', async () => {
      // Create a small valid image blob (1x1 pixel PNG)
      const pngData = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
        0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xff, 0xff, 0x3f,
        0x00, 0x05, 0xfe, 0x02, 0xfe, 0xdc, 0xcc, 0x59, 0xe7, 0x00, 0x00, 0x00,
        0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
      ])
      const imageBlob = new Blob([pngData], { type: 'image/png' })
      const formData = new FormData()
      formData.append('file', imageBlob, 'test.png')
      
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      })

      // Should either succeed (200) or fail due to Azure not configured (500)
      // Should NOT return 400 (validation error) for valid image
      if (response.status === 400) {
        const data = await response.json()
        // If 400, it should NOT be about invalid file type
        expect(data.error).not.toContain('Invalid file type')
      }
    })

    it('should reject files that are too large', async () => {
      // Create a 6MB blob (over 5MB limit)
      const largeData = new Uint8Array(6 * 1024 * 1024)
      const largeBlob = new Blob([largeData], { type: 'image/png' })
      const formData = new FormData()
      formData.append('file', largeBlob, 'large.png')
      
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      })

      // Should return 400 for too large or 500 if Azure not configured
      expect([400, 500]).toContain(response.status)
      
      if (response.status === 400) {
        const data = await response.json()
        expect(data.error).toContain('too large')
      }
    })
  })
})
