/**
 * Jest Setup for Access Control Testing Suite
 * Story 11.10: Test Environment Configuration
 */

import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { TextEncoder, TextDecoder } from 'util';
import fixtures from '../fixtures/test-fixtures';

// Polyfills for Node.js environment
Object.assign(global, { TextDecoder, TextEncoder });

// Mock global objects
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => [])
  },
  writable: true
});

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn()
  },
  writable: true
});

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn()
  },
  writable: true
});

// Mock fetch globally
global.fetch = jest.fn();

// Mock console methods for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

console.error = jest.fn();
console.warn = jest.fn();
console.log = jest.fn();

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    prefetch: jest.fn()
  })
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn()
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams()
}));

// Mock Clerk authentication
jest.mock('@clerk/nextjs', () => ({
  currentUser: jest.fn(),
  auth: jest.fn(() => ({
    userId: 'test_user_id',
    sessionId: 'test_session_id',
    getToken: jest.fn()
  })),
  useUser: jest.fn(() => ({
    user: fixtures.users.basic,
    isLoaded: true,
    isSignedIn: true
  })),
  useAuth: jest.fn(() => ({
    userId: 'test_user_id',
    sessionId: 'test_session_id',
    isLoaded: true,
    isSignedIn: true,
    getToken: jest.fn()
  })),
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: ({ children }: { children: React.ReactNode }) => null,
  UserButton: () => 'UserButton',
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children
}));

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn()
  },
  Toaster: () => 'Toaster'
}));

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn()
    },
    customers: {
      retrieve: jest.fn(),
      update: jest.fn()
    },
    subscriptions: {
      retrieve: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      cancel: jest.fn()
    }
  }));
});

// Mock rate limiting
jest.mock('@/lib/utils/rate-limit', () => ({
  rateLimit: jest.fn().mockResolvedValue({
    success: true,
    limit: 100,
    remaining: 99,
    reset: new Date(Date.now() + 60000)
  })
}));

// Mock permission checker
jest.mock('@/lib/access-control/permission-checker', () => ({
  PermissionChecker: {
    getFeaturePermission: jest.fn(),
    getResourcePermission: jest.fn(),
    getAllPermissions: jest.fn(),
    getTierLimits: jest.fn(),
    checkPermission: jest.fn()
  },
  invalidatePermissionCache: jest.fn().mockResolvedValue(undefined)
}));

// Mock database/ORM
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    subscription: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    usageTracking: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}));

// Setup test data and utilities
beforeAll(() => {
  // Initialize test environment
  process.env.NODE_ENV = 'test';
  process.env.CLERK_SECRET_KEY = 'test_clerk_secret';
  process.env.STRIPE_SECRET_KEY = 'sk_test_123';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
  
  // Set up performance monitoring
  if (typeof global !== 'undefined') {
    global.gc = global.gc || (() => {});
  }
});

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Reset fetch mock
  (global.fetch as jest.Mock).mockReset();
  
  // Reset console mocks
  (console.error as jest.Mock).mockReset();
  (console.warn as jest.Mock).mockReset();
  (console.log as jest.Mock).mockReset();
  
  // Clear local/session storage
  (window.localStorage.clear as jest.Mock).mockClear();
  (window.sessionStorage.clear as jest.Mock).mockClear();
  
  // Reset performance timing
  (window.performance.now as jest.Mock).mockReturnValue(Date.now());
});

afterEach(() => {
  // Clean up after each test
  fixtures.utils.cleanup();
});

afterAll(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
  
  // Force garbage collection if available
  if (typeof global !== 'undefined' && global.gc) {
    global.gc();
  }
});

// Error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Custom matchers for access control testing
expect.extend({
  toHavePermission(received: any, permission: string) {
    const pass = received.permission === permission;
    return {
      message: () => `expected permission to be ${permission}, but got ${received.permission}`,
      pass
    };
  },
  
  toBeWithinTierLimit(received: number, limit: number) {
    const pass = limit === -1 || received <= limit;
    return {
      message: () => `expected ${received} to be within tier limit ${limit}`,
      pass
    };
  },
  
  toBeSecureAgainst(received: any, attackType: string) {
    const hasVulnerability = (
      received.toString().includes('<script>') ||
      received.toString().includes('DROP TABLE') ||
      received.toString().includes('../../../')
    );
    
    return {
      message: () => `expected response to be secure against ${attackType} attacks`,
      pass: !hasVulnerability
    };
  },
  
  toCompleteWithinTime(received: number, threshold: number) {
    const pass = received <= threshold;
    return {
      message: () => `expected operation to complete within ${threshold}ms, but took ${received}ms`,
      pass
    };
  }
});

// Type definitions for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHavePermission(permission: string): R;
      toBeWithinTierLimit(limit: number): R;
      toBeSecureAgainst(attackType: string): R;
      toCompleteWithinTime(threshold: number): R;
    }
  }
}

// Export test utilities for use in tests
export { fixtures };
export * from '../fixtures/test-fixtures';
