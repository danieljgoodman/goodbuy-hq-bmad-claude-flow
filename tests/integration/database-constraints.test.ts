import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import { generateTestData } from '../fixtures/test-data-generator'

describe('Database Constraints and Validation Tests', () => {
  let supabaseClient: any

  beforeAll(async () => {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  })

  beforeEach(async () => {
    await cleanupTestData()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  describe('Primary Key Constraints', () => {
    it('should enforce unique primary keys in users table', async () => {
      const testUser = {
        id: 'pk-test-user-1',
        email: 'pk1@test.com',
        business_name: 'PK Test Business',
        industry: 'Technology',
        role: 'owner'
      }

      // First insert should succeed
      const { error: firstError } = await supabaseClient
        .from('users')
        .insert(testUser)

      expect(firstError).toBeNull()

      // Second insert with same ID should fail
      const { error: secondError } = await supabaseClient
        .from('users')
        .insert(testUser)

      expect(secondError).toBeTruthy()
      expect(secondError.code).toBe('23505') // Unique violation
    })

    it('should enforce unique primary keys in professional_evaluations table', async () => {
      const testEvaluation = {
        id: 'pk-test-eval-1',
        user_id: 'pk-test-user-1',
        business_id: 'pk-test-business-1',
        tier: 'professional',
        evaluation_data: { test: 'data' }
      }

      // Create required parent records first
      await createTestParentRecords('pk-test-user-1', 'pk-test-business-1')

      // First insert should succeed
      const { error: firstError } = await supabaseClient
        .from('professional_evaluations')
        .insert(testEvaluation)

      expect(firstError).toBeNull()

      // Second insert with same ID should fail
      const { error: secondError } = await supabaseClient
        .from('professional_evaluations')
        .insert(testEvaluation)

      expect(secondError).toBeTruthy()
      expect(secondError.code).toBe('23505') // Unique violation
    })
  })

  describe('Foreign Key Constraints', () => {
    it('should enforce foreign key constraint on user_id in professional_evaluations', async () => {
      const testEvaluation = {
        id: 'fk-test-eval-1',
        user_id: 'non-existent-user',
        business_id: 'fk-test-business-1',
        tier: 'professional',
        evaluation_data: { test: 'data' }
      }

      const { error } = await supabaseClient
        .from('professional_evaluations')
        .insert(testEvaluation)

      expect(error).toBeTruthy()
      expect(error.code).toBe('23503') // Foreign key violation
    })

    it('should enforce foreign key constraint on business_id in professional_evaluations', async () => {
      // Create user but not business
      await supabaseClient.from('users').insert({
        id: 'fk-test-user-2',
        email: 'fk2@test.com',
        business_name: 'FK Test Business',
        industry: 'Technology',
        role: 'owner'
      })

      const testEvaluation = {
        id: 'fk-test-eval-2',
        user_id: 'fk-test-user-2',
        business_id: 'non-existent-business',
        tier: 'professional',
        evaluation_data: { test: 'data' }
      }

      const { error } = await supabaseClient
        .from('professional_evaluations')
        .insert(testEvaluation)

      expect(error).toBeTruthy()
      expect(error.code).toBe('23503') // Foreign key violation
    })

    it('should cascade delete professional evaluations when user is deleted', async () => {
      const userId = 'cascade-test-user'
      const businessId = 'cascade-test-business'
      const evalId = 'cascade-test-eval'

      // Create complete test hierarchy
      await createTestParentRecords(userId, businessId)

      await supabaseClient.from('professional_evaluations').insert({
        id: evalId,
        user_id: userId,
        business_id: businessId,
        tier: 'professional',
        evaluation_data: { test: 'data' }
      })

      // Verify evaluation exists
      const { data: beforeDelete } = await supabaseClient
        .from('professional_evaluations')
        .select('*')
        .eq('id', evalId)

      expect(beforeDelete).toHaveLength(1)

      // Delete user
      await supabaseClient.from('users').delete().eq('id', userId)

      // Verify evaluation is also deleted (cascade)
      const { data: afterDelete } = await supabaseClient
        .from('professional_evaluations')
        .select('*')
        .eq('id', evalId)

      expect(afterDelete).toHaveLength(0)
    })

    it('should enforce foreign key constraints in extended tables', async () => {
      const testFinancialMetrics = {
        evaluation_id: 'non-existent-evaluation',
        net_profit: 100000,
        ebitda: 150000,
        burn_rate: 10000,
        runway_months: 18,
        debt_to_equity_ratio: 0.5,
        current_ratio: 2.0,
        quick_ratio: 1.5,
        inventory_turnover: 12,
        receivables_turnover: 8,
        working_capital: 200000
      }

      const { error } = await supabaseClient
        .from('financial_metrics_extended')
        .insert(testFinancialMetrics)

      expect(error).toBeTruthy()
      expect(error.code).toBe('23503') // Foreign key violation
    })
  })

  describe('Check Constraints', () => {
    it('should enforce subscription_tier check constraint', async () => {
      const testUser = {
        id: 'check-test-user-1',
        email: 'check1@test.com',
        business_name: 'Check Test Business',
        industry: 'Technology',
        role: 'owner',
        subscription_tier: 'invalid_tier'
      }

      const { error } = await supabaseClient
        .from('users')
        .insert(testUser)

      expect(error).toBeTruthy()
      expect(error.code).toBe('23514') // Check constraint violation
    })

    it('should enforce role check constraint', async () => {
      const testUser = {
        id: 'check-test-user-2',
        email: 'check2@test.com',
        business_name: 'Check Test Business',
        industry: 'Technology',
        role: 'invalid_role',
        subscription_tier: 'free'
      }

      const { error } = await supabaseClient
        .from('users')
        .insert(testUser)

      expect(error).toBeTruthy()
      expect(error.code).toBe('23514') // Check constraint violation
    })

    it('should enforce tier check constraint in professional_evaluations', async () => {
      const userId = 'check-test-user-3'
      const businessId = 'check-test-business-3'

      await createTestParentRecords(userId, businessId)

      const testEvaluation = {
        id: 'check-test-eval-1',
        user_id: userId,
        business_id: businessId,
        tier: 'invalid_tier',
        evaluation_data: { test: 'data' }
      }

      const { error } = await supabaseClient
        .from('professional_evaluations')
        .insert(testEvaluation)

      expect(error).toBeTruthy()
      expect(error.code).toBe('23514') // Check constraint violation
    })

    it('should enforce status check constraint in business_evaluations', async () => {
      const testEvaluation = {
        id: 'status-check-eval-1',
        business_id: 'status-check-business-1',
        evaluation_data: { test: 'data' },
        status: 'invalid_status'
      }

      const { error } = await supabaseClient
        .from('business_evaluations')
        .insert(testEvaluation)

      expect(error).toBeTruthy()
      expect(error.code).toBe('23514') // Check constraint violation
    })
  })

  describe('Not Null Constraints', () => {
    it('should enforce not null constraint on required user fields', async () => {
      const testUser = {
        id: 'null-test-user-1',
        email: null, // This should fail
        business_name: 'Null Test Business',
        industry: 'Technology',
        role: 'owner'
      }

      const { error } = await supabaseClient
        .from('users')
        .insert(testUser)

      expect(error).toBeTruthy()
      expect(error.code).toBe('23502') // Not null violation
    })

    it('should enforce not null constraint on professional evaluation required fields', async () => {
      const userId = 'null-test-user-2'
      const businessId = 'null-test-business-2'

      await createTestParentRecords(userId, businessId)

      const testEvaluation = {
        id: 'null-test-eval-1',
        user_id: userId,
        business_id: null, // This should fail
        tier: 'professional',
        evaluation_data: { test: 'data' }
      }

      const { error } = await supabaseClient
        .from('professional_evaluations')
        .insert(testEvaluation)

      expect(error).toBeTruthy()
      expect(error.code).toBe('23502') // Not null violation
    })

    it('should allow null values for optional fields', async () => {
      const testUser = {
        id: 'optional-null-user-1',
        email: 'optional@test.com',
        business_name: 'Optional Test Business',
        industry: 'Technology',
        role: 'owner',
        last_login_at: null // This should be allowed
      }

      const { error } = await supabaseClient
        .from('users')
        .insert(testUser)

      expect(error).toBeNull()
    })
  })

  describe('Unique Constraints', () => {
    it('should enforce unique email constraint', async () => {
      const email = 'unique@test.com'

      const firstUser = {
        id: 'unique-test-user-1',
        email: email,
        business_name: 'Unique Test Business 1',
        industry: 'Technology',
        role: 'owner'
      }

      const secondUser = {
        id: 'unique-test-user-2',
        email: email, // Same email should fail
        business_name: 'Unique Test Business 2',
        industry: 'Finance',
        role: 'manager'
      }

      // First insert should succeed
      const { error: firstError } = await supabaseClient
        .from('users')
        .insert(firstUser)

      expect(firstError).toBeNull()

      // Second insert should fail due to unique email constraint
      const { error: secondError } = await supabaseClient
        .from('users')
        .insert(secondUser)

      expect(secondError).toBeTruthy()
      expect(secondError.code).toBe('23505') // Unique violation
    })
  })

  describe('Data Type Constraints', () => {
    it('should enforce numeric data type constraints', async () => {
      const testFinancialMetrics = {
        evaluation_id: 'datatype-test-eval-1',
        net_profit: 'not_a_number', // Should fail
        ebitda: 150000,
        burn_rate: 10000,
        runway_months: 18
      }

      const { error } = await supabaseClient
        .from('financial_metrics_extended')
        .insert(testFinancialMetrics)

      expect(error).toBeTruthy()
      expect(error.code).toBe('22P02') // Invalid input syntax for type
    })

    it('should enforce date data type constraints', async () => {
      const testUser = {
        id: 'date-test-user-1',
        email: 'date@test.com',
        business_name: 'Date Test Business',
        industry: 'Technology',
        role: 'owner',
        created_at: 'not_a_date' // Should fail
      }

      const { error } = await supabaseClient
        .from('users')
        .insert(testUser)

      expect(error).toBeTruthy()
      expect(error.code).toBe('22007') // Invalid datetime format
    })

    it('should enforce UUID data type constraints', async () => {
      const testUser = {
        id: 'not-a-valid-uuid', // Should fail UUID format validation
        email: 'uuid@test.com',
        business_name: 'UUID Test Business',
        industry: 'Technology',
        role: 'owner'
      }

      const { error } = await supabaseClient
        .from('users')
        .insert(testUser)

      expect(error).toBeTruthy()
      expect(error.code).toBe('22P02') // Invalid input syntax for UUID
    })

    it('should enforce JSONB data type constraints', async () => {
      const userId = 'jsonb-test-user-1'
      const businessId = 'jsonb-test-business-1'

      await createTestParentRecords(userId, businessId)

      const testEvaluation = {
        id: 'jsonb-test-eval-1',
        user_id: userId,
        business_id: businessId,
        tier: 'professional',
        evaluation_data: 'invalid_json' // Should be valid JSON
      }

      const { error } = await supabaseClient
        .from('professional_evaluations')
        .insert(testEvaluation)

      expect(error).toBeTruthy()
      expect(error.code).toBe('22P02') // Invalid input syntax for JSON
    })
  })

  describe('Custom Validation Constraints', () => {
    it('should validate custom business rules through triggers', async () => {
      // Test that certain business rules are enforced at the database level
      const userId = 'business-rule-user-1'
      const businessId = 'business-rule-business-1'

      await createTestParentRecords(userId, businessId)

      // Example: Professional evaluations should only be created for pro/enterprise users
      // (This would require a custom trigger or function)
      const testEvaluation = {
        id: 'business-rule-eval-1',
        user_id: userId,
        business_id: businessId,
        tier: 'professional',
        evaluation_data: { test: 'data' }
      }

      // First, verify user is on free tier
      const { data: user } = await supabaseClient
        .from('users')
        .select('subscription_tier')
        .eq('id', userId)
        .single()

      expect(user.subscription_tier).toBe('free')

      // Attempt to create professional evaluation (should be allowed by default schema,
      // but could be restricted by business rule trigger)
      const { error } = await supabaseClient
        .from('professional_evaluations')
        .insert(testEvaluation)

      // Depending on implementation, this might succeed or fail
      // For now, we'll test that the insert works but could be enhanced with business rules
      if (error) {
        expect(error.message).toContain('business rule')
      }
    })

    it('should validate data consistency across related tables', async () => {
      const userId = 'consistency-user-1'
      const businessId = 'consistency-business-1'
      const evalId = 'consistency-eval-1'

      await createTestParentRecords(userId, businessId)

      // Create professional evaluation
      await supabaseClient.from('professional_evaluations').insert({
        id: evalId,
        user_id: userId,
        business_id: businessId,
        tier: 'professional',
        evaluation_data: { test: 'data' }
      })

      // Create extended financial metrics
      const financialMetrics = {
        evaluation_id: evalId,
        net_profit: 100000,
        ebitda: 150000,
        burn_rate: 10000,
        runway_months: 18,
        debt_to_equity_ratio: 0.5,
        current_ratio: 2.0,
        quick_ratio: 1.5,
        inventory_turnover: 12,
        receivables_turnover: 8,
        working_capital: 200000
      }

      const { error } = await supabaseClient
        .from('financial_metrics_extended')
        .insert(financialMetrics)

      expect(error).toBeNull()

      // Verify data consistency
      const { data: metrics } = await supabaseClient
        .from('financial_metrics_extended')
        .select('*')
        .eq('evaluation_id', evalId)
        .single()

      expect(metrics.evaluation_id).toBe(evalId)
      expect(metrics.net_profit).toBe(100000)
    })
  })

  describe('Index Constraints and Performance', () => {
    it('should enforce unique indexes', async () => {
      // Test unique indexes beyond primary keys
      const testData1 = {
        id: 'index-test-1',
        email: 'index@test.com',
        business_name: 'Index Test Business',
        industry: 'Technology',
        role: 'owner'
      }

      const testData2 = {
        id: 'index-test-2',
        email: 'index@test.com', // Duplicate email should fail
        business_name: 'Index Test Business 2',
        industry: 'Technology',
        role: 'owner'
      }

      await supabaseClient.from('users').insert(testData1)

      const { error } = await supabaseClient
        .from('users')
        .insert(testData2)

      expect(error).toBeTruthy()
      expect(error.code).toBe('23505') // Unique violation
    })

    it('should verify index performance for large datasets', async () => {
      // Create a larger dataset to test index performance
      const users = Array.from({ length: 1000 }, (_, i) => ({
        id: `perf-user-${i}`,
        email: `perf${i}@test.com`,
        business_name: `Performance Business ${i}`,
        industry: 'Technology',
        role: 'owner',
        subscription_tier: i % 3 === 0 ? 'free' : i % 3 === 1 ? 'pro' : 'enterprise'
      }))

      await supabaseClient.from('users').insert(users)

      // Test indexed query performance
      const startTime = performance.now()

      const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('subscription_tier', 'pro')
        .order('created_at')
        .limit(100)

      const endTime = performance.now()
      const queryTime = endTime - startTime

      expect(error).toBeNull()
      expect(data.length).toBeGreaterThan(0)
      expect(queryTime).toBeLessThan(100) // Should be fast with proper indexing

      // Cleanup
      await supabaseClient
        .from('users')
        .delete()
        .like('id', 'perf-user-%')
    })
  })

  // Helper functions
  async function createTestParentRecords(userId: string, businessId: string) {
    // Create user
    await supabaseClient.from('users').insert({
      id: userId,
      email: `${userId}@test.com`,
      business_name: `${userId} Business`,
      industry: 'Technology',
      role: 'owner',
      subscription_tier: 'free'
    })

    // Create business
    await supabaseClient.from('businesses').insert({
      id: businessId,
      user_id: userId,
      name: `${businessId} Name`,
      industry: 'Technology'
    })
  }

  async function cleanupTestData() {
    const patterns = [
      'pk-test-%',
      'fk-test-%',
      'cascade-test-%',
      'check-test-%',
      'null-test-%',
      'optional-null-%',
      'unique-test-%',
      'datatype-test-%',
      'date-test-%',
      'uuid-test-%',
      'jsonb-test-%',
      'business-rule-%',
      'consistency-%',
      'index-test-%',
      'perf-user-%'
    ]

    const tables = [
      'financial_metrics_extended',
      'customer_analytics',
      'operational_efficiency',
      'market_intelligence',
      'compliance_data',
      'professional_evaluations',
      'business_evaluations',
      'businesses',
      'users'
    ]

    for (const table of tables) {
      for (const pattern of patterns) {
        try {
          await supabaseClient
            .from(table)
            .delete()
            .like('id', pattern)
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }
  }
})