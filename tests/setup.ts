// Test setup file
// Add any global test configuration here

import '@testing-library/jest-dom'

// Increase timeout for integration tests
jest.setTimeout(10000)

// Mock fetch for API tests in jsdom environment
if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = jest.fn()
}
