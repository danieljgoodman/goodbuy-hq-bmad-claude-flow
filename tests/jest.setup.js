// Jest setup file for Professional Tier tests
import { TextEncoder, TextDecoder } from 'util'

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.TEST_DATABASE_URL = 'https://test-db.supabase.co'

// Increase timeout for integration tests
jest.setTimeout(30000)

// Mock external services
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      admin: {
        createUser: jest.fn(),
        deleteUser: jest.fn()
      },
      signInWithPassword: jest.fn(),
      signOut: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
      then: jest.fn()
    })),
    rpc: jest.fn()
  }))
}))

// Mock Next.js modules
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200
    }))
  }
}))

// Mock node-mocks-http for API testing
jest.mock('node-mocks-http', () => ({
  createMocks: jest.fn(() => ({
    req: {
      method: 'GET',
      query: {},
      body: {},
      headers: {},
      url: '/'
    },
    res: {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn(),
      _getStatusCode: jest.fn(() => 200),
      _getData: jest.fn(() => '{}')
    }
  }))
}))

// Global test utilities
global.testUtils = {
  // Generate consistent test IDs
  generateTestId: (prefix = 'test') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

  // Wait for async operations
  waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock fetch for API testing
  mockFetch: (response, options = {}) => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: options.ok !== false,
        status: options.status || 200,
        json: () => Promise.resolve(response),
        text: () => Promise.resolve(JSON.stringify(response))
      })
    )
  },

  // Create test user data
  createTestUser: (overrides = {}) => ({
    id: global.testUtils.generateTestId('user'),
    email: 'test@example.com',
    business_name: 'Test Business',
    industry: 'Technology',
    role: 'owner',
    subscription_tier: 'free',
    ...overrides
  }),

  // Create test business data
  createTestBusiness: (userId, overrides = {}) => ({
    id: global.testUtils.generateTestId('business'),
    user_id: userId,
    name: 'Test Business',
    industry: 'Technology',
    description: 'Test business description',
    ...overrides
  }),

  // Create test evaluation data
  createTestEvaluation: (userId, businessId, overrides = {}) => ({
    id: global.testUtils.generateTestId('eval'),
    user_id: userId,
    business_id: businessId,
    tier: 'basic',
    evaluation_data: { test: true },
    health_score: 75,
    confidence_score: 80,
    status: 'completed',
    ...overrides
  })
}

// Setup console methods for better test output
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

console.error = (...args) => {
  // Suppress certain known warnings in tests
  const message = args[0]
  if (
    typeof message === 'string' &&
    (message.includes('Warning: ReactDOM.render') ||
     message.includes('Warning: componentWillReceiveProps'))
  ) {
    return
  }
  originalConsoleError.apply(console, args)
}

console.warn = (...args) => {
  // Suppress certain known warnings in tests
  const message = args[0]
  if (
    typeof message === 'string' &&
    message.includes('deprecated')
  ) {
    return
  }
  originalConsoleWarn.apply(console, args)
}

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks()

  // Clean up any global state
  if (global.fetch && global.fetch.mockClear) {
    global.fetch.mockClear()
  }
})

// Setup before all tests
beforeAll(() => {
  // Initialize any global test state
})

// Cleanup after all tests
afterAll(() => {
  // Final cleanup
})