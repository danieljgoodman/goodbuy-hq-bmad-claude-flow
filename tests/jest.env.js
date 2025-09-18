// Environment configuration for tests

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'
process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'https://test-db.supabase.co'

// Feature flags for testing
process.env.ENABLE_PROFESSIONAL_TIER = 'true'
process.env.ENABLE_TIER_VALIDATION = 'true'
process.env.ENABLE_PREMIUM_ACCESS_CHECKS = 'true'

// Test-specific configurations
process.env.TEST_TIMEOUT = '30000'
process.env.TEST_BATCH_SIZE = '10'
process.env.TEST_MAX_CONCURRENT = '5'

// Performance testing thresholds
process.env.PERF_MAX_RESPONSE_TIME = '1000'
process.env.PERF_MIN_THROUGHPUT = '10'
process.env.PERF_MAX_MEMORY_MB = '100'

// Coverage thresholds
process.env.COVERAGE_THRESHOLD_LINES = '90'
process.env.COVERAGE_THRESHOLD_FUNCTIONS = '85'
process.env.COVERAGE_THRESHOLD_BRANCHES = '80'
process.env.COVERAGE_THRESHOLD_STATEMENTS = '90'

console.log('Test environment configured with:', {
  NODE_ENV: process.env.NODE_ENV,
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  PROFESSIONAL_TIER_ENABLED: process.env.ENABLE_PROFESSIONAL_TIER
})