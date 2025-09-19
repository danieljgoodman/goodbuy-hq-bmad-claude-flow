/**
 * Jest Configuration for Access Control Testing Suite
 * Story 11.10: Comprehensive Testing Configuration
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './'
});

// Custom Jest configuration for access control tests
const customJestConfig = {
  // Test environment
  testEnvironment: 'jest-environment-jsdom',
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup/jest.setup.ts'
  ],
  
  // Test patterns for access control tests
  testMatch: [
    '<rootDir>/src/__tests__/access-control/**/*.test.ts',
    '<rootDir>/src/__tests__/security/**/*.test.ts',
    '<rootDir>/src/__tests__/performance/**/*.test.ts',
    '<rootDir>/src/__tests__/upgrade/**/*.test.ts'
  ],
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@/__tests__/(.*)$': '<rootDir>/src/__tests__/$1'
  },
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/access-control',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
    'clover'
  ],
  
  // Coverage collection patterns
  collectCoverageFrom: [
    'src/lib/access-control/**/*.{ts,tsx}',
    'src/lib/subscription/**/*.{ts,tsx}',
    'src/middleware/**/*.{ts,tsx}',
    'src/components/access-control/**/*.{ts,tsx}',
    'src/components/tier/**/*.{ts,tsx}',
    'src/app/api/**/tier-*/**/*.{ts,tsx}',
    'src/app/api/**/access-control/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/*.config.{js,ts}',
    '!**/*.stories.{js,ts,tsx}',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/coverage/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/lib/access-control/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './src/lib/subscription/tier-upgrade-handler.ts': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/middleware/tier-validation.ts': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Test timeout (important for performance tests)
  testTimeout: 30000,
  
  // Global setup and teardown
  globalSetup: '<rootDir>/src/__tests__/setup/global-setup.ts',
  globalTeardown: '<rootDir>/src/__tests__/setup/global-teardown.ts',
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // Verbose output for detailed test results
  verbose: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Performance monitoring
  detectOpenHandles: true,
  detectLeaks: true,
  
  // Parallel test execution
  maxWorkers: '50%',
  
  // Test result processor for custom reporting
  testResultsProcessor: '<rootDir>/src/__tests__/setup/test-results-processor.js',
  
  // Custom reporters
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/access-control',
        filename: 'test-report.html',
        pageTitle: 'Access Control Test Report',
        includeFailureMsg: true,
        includeSuiteFailure: true
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: './coverage/access-control',
        outputName: 'junit.xml',
        suiteName: 'Access Control Tests'
      }
    ]
  ],
  
  // Mock configuration
  mocks: {
    // Mock Clerk authentication
    '@clerk/nextjs': {
      currentUser: jest.fn(),
      auth: jest.fn(),
      useUser: jest.fn(),
      useAuth: jest.fn()
    },
    
    // Mock Stripe
    'stripe': {
      webhooks: {
        constructEvent: jest.fn()
      }
    },
    
    // Mock toast notifications
    'sonner': {
      toast: {
        success: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
        warning: jest.fn()
      }
    }
  },
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // Watch plugins for development
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Additional configuration for Next.js
  nextConfig: {
    experimental: {
      // Enable experimental features if needed
    }
  }
};

// Create and export the Jest configuration
module.exports = createJestConfig(customJestConfig);
