const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: '../apps/web',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Test environment
  testEnvironment: 'node',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Test directories and patterns
  testMatch: [
    '<rootDir>/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/**/__tests__/**/*.{js,jsx,ts,tsx}'
  ],

  // Module paths
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/../apps/web/src/$1',
    '^@/lib/(.*)$': '<rootDir>/../apps/web/src/lib/$1',
    '^@/components/(.*)$': '<rootDir>/../apps/web/src/components/$1',
    '^@/app/(.*)$': '<rootDir>/../apps/web/src/app/$1',
    '^@/types/(.*)$': '<rootDir>/../apps/web/src/types/$1',
    '^@/middleware/(.*)$': '<rootDir>/../apps/web/src/middleware/$1'
  },

  // Coverage settings
  collectCoverage: true,
  collectCoverageFrom: [
    '../apps/web/src/**/*.{js,jsx,ts,tsx}',
    '!../apps/web/src/**/*.d.ts',
    '!../apps/web/src/**/node_modules/**',
    '!../apps/web/src/**/*.stories.{js,jsx,ts,tsx}',
    '!../apps/web/src/**/*.config.{js,jsx,ts,tsx}',
    // Focus on Professional tier components
    '../apps/web/src/lib/validations/professional-tier.ts',
    '../apps/web/src/app/api/premium/**/*.ts',
    '../apps/web/src/lib/services/*Service.ts',
    '../apps/web/src/middleware/tier-validation.ts'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90
    },
    // Specific thresholds for Professional tier components
    '../apps/web/src/lib/validations/professional-tier.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    },
    '../apps/web/src/app/api/premium/**/*.ts': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },

  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json',
    'json-summary'
  ],

  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',

  // Test timeout
  testTimeout: 30000,

  // Globals
  globals: {
    'ts-jest': {
      useESM: true
    }
  },

  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['ts-jest', {
      useESM: true
    }]
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/../apps/web/.next/',
    '<rootDir>/../apps/web/out/',
    '<rootDir>/coverage/'
  ],

  // Clear mocks
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Max workers for parallel testing
  maxWorkers: '50%',

  // Test categories for parallel execution
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: ['<rootDir>/unit/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'node'
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['<rootDir>/integration/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'node',
      testTimeout: 60000
    },
    {
      displayName: 'Performance Tests',
      testMatch: ['<rootDir>/performance/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'node',
      testTimeout: 120000
    }
  ],

  // Environment variables for testing
  setupFiles: ['<rootDir>/jest.env.js'],

  // Reporter configuration
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: '<rootDir>/coverage/html-report',
      filename: 'test-report.html',
      expand: true,
      hideIcon: false,
      pageTitle: 'Professional Tier Test Results'
    }],
    ['jest-junit', {
      outputDirectory: '<rootDir>/coverage',
      outputName: 'junit.xml',
      suiteName: 'Professional Tier Tests'
    }]
  ]
}

// Export Jest configuration
module.exports = createJestConfig(customJestConfig)