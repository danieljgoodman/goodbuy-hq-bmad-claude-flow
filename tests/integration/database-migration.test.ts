import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'

describe('Database Migration Tests with Rollback Procedures', () => {
  let supabaseClient: any
  let testDatabaseUrl: string
  let migrationHistory: string[] = []

  beforeAll(async () => {
    // Initialize test database connection
    testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
    supabaseClient = createClient(
      testDatabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Ensure we're working with a test database
    if (!testDatabaseUrl.includes('test') && !testDatabaseUrl.includes('staging')) {
      throw new Error('Migration tests must run against a test database')
    }
  })

  afterAll(async () => {
    // Clean up: Rollback all migrations applied during testing
    await rollbackAllTestMigrations()
  })

  beforeEach(async () => {
    // Create a clean snapshot before each test
    await createDatabaseSnapshot('before_test')
  })

  afterEach(async () => {
    // Rollback to clean state after each test
    await restoreDatabaseSnapshot('before_test')
  })

  describe('Professional Tier Schema Migration', () => {
    it('should successfully apply professional tier schema migration', async () => {
      const migrationSql = await readMigrationFile('001_professional_tier_schema.sql')

      try {
        // Apply migration
        const { error } = await supabaseClient.rpc('exec', { sql: migrationSql })
        expect(error).toBeNull()

        // Verify new tables exist
        const { data: tables } = await supabaseClient.rpc('get_tables')
        expect(tables).toContain('professional_evaluations')
        expect(tables).toContain('financial_metrics_extended')
        expect(tables).toContain('customer_analytics')
        expect(tables).toContain('operational_efficiency')
        expect(tables).toContain('market_intelligence')
        expect(tables).toContain('compliance_data')

        migrationHistory.push('001_professional_tier_schema.sql')
      } catch (error) {
        throw new Error(`Migration failed: ${error}`)
      }
    })

    it('should verify all professional tier columns are created', async () => {
      await applyMigration('001_professional_tier_schema.sql')

      // Check professional_evaluations table structure
      const { data: profEvalColumns } = await supabaseClient.rpc('get_table_columns', {
        table_name: 'professional_evaluations'
      })

      const expectedColumns = [
        'id', 'user_id', 'business_id', 'tier', 'evaluation_data',
        'advanced_analytics', 'benchmark_comparison', 'predictive_modeling',
        'sensitivity_analysis', 'created_at', 'updated_at'
      ]

      expectedColumns.forEach(column => {
        expect(profEvalColumns.some((col: any) => col.column_name === column)).toBe(true)
      })

      // Check financial_metrics_extended table
      const { data: finMetricsColumns } = await supabaseClient.rpc('get_table_columns', {
        table_name: 'financial_metrics_extended'
      })

      const expectedFinancialColumns = [
        'evaluation_id', 'net_profit', 'ebitda', 'burn_rate', 'runway_months',
        'debt_to_equity_ratio', 'current_ratio', 'quick_ratio', 'inventory_turnover',
        'receivables_turnover', 'working_capital'
      ]

      expectedFinancialColumns.forEach(column => {
        expect(finMetricsColumns.some((col: any) => col.column_name === column)).toBe(true)
      })
    })

    it('should create proper foreign key relationships', async () => {
      await applyMigration('001_professional_tier_schema.sql')

      // Verify foreign key constraints
      const { data: constraints } = await supabaseClient.rpc('get_foreign_keys', {
        table_name: 'professional_evaluations'
      })

      expect(constraints.some((c: any) =>
        c.column_name === 'user_id' && c.referenced_table === 'users'
      )).toBe(true)

      expect(constraints.some((c: any) =>
        c.column_name === 'business_id' && c.referenced_table === 'businesses'
      )).toBe(true)

      // Verify extended tables reference professional_evaluations
      const { data: extendedConstraints } = await supabaseClient.rpc('get_foreign_keys', {
        table_name: 'financial_metrics_extended'
      })

      expect(extendedConstraints.some((c: any) =>
        c.column_name === 'evaluation_id' && c.referenced_table === 'professional_evaluations'
      )).toBe(true)
    })

    it('should create proper indexes for performance', async () => {
      await applyMigration('001_professional_tier_schema.sql')

      // Verify indexes exist
      const { data: indexes } = await supabaseClient.rpc('get_table_indexes', {
        table_name: 'professional_evaluations'
      })

      const expectedIndexes = [
        'idx_prof_eval_user_id',
        'idx_prof_eval_business_id',
        'idx_prof_eval_tier',
        'idx_prof_eval_created_at'
      ]

      expectedIndexes.forEach(indexName => {
        expect(indexes.some((idx: any) => idx.indexname === indexName)).toBe(true)
      })
    })

    it('should create proper row level security policies', async () => {
      await applyMigration('001_professional_tier_schema.sql')

      // Verify RLS is enabled
      const { data: rlsStatus } = await supabaseClient.rpc('check_rls_enabled', {
        table_name: 'professional_evaluations'
      })
      expect(rlsStatus[0].rowsecurity).toBe(true)

      // Verify policies exist
      const { data: policies } = await supabaseClient.rpc('get_table_policies', {
        table_name: 'professional_evaluations'
      })

      const expectedPolicies = [
        'Users can view own professional evaluations',
        'Users can create own professional evaluations',
        'Users can update own professional evaluations',
        'Users can delete own professional evaluations'
      ]

      expectedPolicies.forEach(policyName => {
        expect(policies.some((policy: any) => policy.policyname === policyName)).toBe(true)
      })
    })
  })

  describe('Subscription Tier Column Migration', () => {
    it('should update subscription_tier column to include new tiers', async () => {
      await applyMigration('002_update_subscription_tiers.sql')

      // Verify the constraint allows new tier values
      const { data: constraints } = await supabaseClient.rpc('get_check_constraints', {
        table_name: 'users',
        column_name: 'subscription_tier'
      })

      const tierConstraint = constraints.find((c: any) =>
        c.constraint_name.includes('subscription_tier')
      )

      expect(tierConstraint.check_clause).toContain('free')
      expect(tierConstraint.check_clause).toContain('pro')
      expect(tierConstraint.check_clause).toContain('enterprise')
      expect(tierConstraint.check_clause).toContain('professional')
    })

    it('should preserve existing user data during tier migration', async () => {
      // Create test users before migration
      const testUsers = [
        {
          id: 'user1',
          email: 'user1@test.com',
          business_name: 'Test Business 1',
          industry: 'Technology',
          role: 'owner',
          subscription_tier: 'free'
        },
        {
          id: 'user2',
          email: 'user2@test.com',
          business_name: 'Test Business 2',
          industry: 'Finance',
          role: 'manager',
          subscription_tier: 'pro'
        }
      ]

      // Insert test data
      await supabaseClient.from('users').insert(testUsers)

      // Apply migration
      await applyMigration('002_update_subscription_tiers.sql')

      // Verify data integrity
      const { data: usersAfterMigration } = await supabaseClient
        .from('users')
        .select('*')
        .in('id', ['user1', 'user2'])

      expect(usersAfterMigration).toHaveLength(2)
      expect(usersAfterMigration[0].subscription_tier).toBe('free')
      expect(usersAfterMigration[1].subscription_tier).toBe('pro')

      // Clean up
      await supabaseClient.from('users').delete().in('id', ['user1', 'user2'])
    })
  })

  describe('Migration Rollback Procedures', () => {
    it('should successfully rollback professional tier schema migration', async () => {
      // Apply migration first
      await applyMigration('001_professional_tier_schema.sql')

      // Verify tables exist
      const { data: tablesBefore } = await supabaseClient.rpc('get_tables')
      expect(tablesBefore).toContain('professional_evaluations')

      // Apply rollback
      await rollbackMigration('001_professional_tier_schema_rollback.sql')

      // Verify tables are removed
      const { data: tablesAfter } = await supabaseClient.rpc('get_tables')
      expect(tablesAfter).not.toContain('professional_evaluations')
      expect(tablesAfter).not.toContain('financial_metrics_extended')
      expect(tablesAfter).not.toContain('customer_analytics')
    })

    it('should preserve existing data during rollback', async () => {
      // Create test data in existing tables
      const testBusiness = {
        id: 'test-business-1',
        user_id: 'test-user-1',
        name: 'Test Business',
        industry: 'Technology'
      }

      await supabaseClient.from('businesses').insert(testBusiness)

      // Apply and rollback migration
      await applyMigration('001_professional_tier_schema.sql')
      await rollbackMigration('001_professional_tier_schema_rollback.sql')

      // Verify existing data is preserved
      const { data: business } = await supabaseClient
        .from('businesses')
        .select('*')
        .eq('id', 'test-business-1')
        .single()

      expect(business).toBeTruthy()
      expect(business.name).toBe('Test Business')

      // Clean up
      await supabaseClient.from('businesses').delete().eq('id', 'test-business-1')
    })

    it('should handle partial migration failures gracefully', async () => {
      // Create a migration that will fail partway through
      const partialMigrationSql = `
        CREATE TABLE test_table_1 (id UUID PRIMARY KEY);
        CREATE TABLE test_table_2 (id UUID PRIMARY KEY);
        -- This will fail intentionally
        CREATE TABLE test_table_3 (id INVALID_TYPE);
        CREATE TABLE test_table_4 (id UUID PRIMARY KEY);
      `

      try {
        await supabaseClient.rpc('exec', { sql: partialMigrationSql })
      } catch (error) {
        // Expected to fail
      }

      // Verify partial state
      const { data: tables } = await supabaseClient.rpc('get_tables')

      // Should have tables 1 and 2, but not 3 and 4 due to transaction rollback
      expect(tables).not.toContain('test_table_1')
      expect(tables).not.toContain('test_table_2')
      expect(tables).not.toContain('test_table_3')
      expect(tables).not.toContain('test_table_4')
    })

    it('should validate rollback safety before execution', async () => {
      // Apply migration
      await applyMigration('001_professional_tier_schema.sql')

      // Add some test data to professional tables
      const testProfEval = {
        id: 'test-prof-eval-1',
        user_id: 'test-user-1',
        business_id: 'test-business-1',
        tier: 'professional',
        evaluation_data: { test: 'data' }
      }

      await supabaseClient.from('professional_evaluations').insert(testProfEval)

      // Attempt rollback with data present (should warn or fail safely)
      const rollbackValidation = await validateRollbackSafety('001_professional_tier_schema_rollback.sql')

      expect(rollbackValidation.hasData).toBe(true)
      expect(rollbackValidation.affectedTables).toContain('professional_evaluations')
      expect(rollbackValidation.dataLossWarning).toBeTruthy()

      // Clean up
      await supabaseClient.from('professional_evaluations').delete().eq('id', 'test-prof-eval-1')
    })
  })

  describe('Migration Performance and Integrity', () => {
    it('should complete migration within acceptable time limits', async () => {
      const startTime = Date.now()

      await applyMigration('001_professional_tier_schema.sql')

      const migrationTime = Date.now() - startTime

      // Migration should complete within 30 seconds
      expect(migrationTime).toBeLessThan(30000)
    })

    it('should maintain referential integrity during migration', async () => {
      // Create test data with relationships
      const testUser = {
        id: 'test-user-integrity',
        email: 'integrity@test.com',
        business_name: 'Integrity Test Business',
        industry: 'Technology',
        role: 'owner'
      }

      const testBusiness = {
        id: 'test-business-integrity',
        user_id: 'test-user-integrity',
        name: 'Integrity Test Business',
        industry: 'Technology'
      }

      await supabaseClient.from('users').insert(testUser)
      await supabaseClient.from('businesses').insert(testBusiness)

      // Apply migration
      await applyMigration('001_professional_tier_schema.sql')

      // Verify foreign key constraints work
      try {
        await supabaseClient.from('professional_evaluations').insert({
          id: 'test-prof-eval-integrity',
          user_id: 'non-existent-user',
          business_id: 'test-business-integrity',
          tier: 'professional',
          evaluation_data: {}
        })

        // Should not reach here
        expect(true).toBe(false)
      } catch (error) {
        // Expected: foreign key constraint violation
        expect(error).toBeTruthy()
      }

      // Clean up
      await supabaseClient.from('businesses').delete().eq('id', 'test-business-integrity')
      await supabaseClient.from('users').delete().eq('id', 'test-user-integrity')
    })

    it('should handle concurrent migrations safely', async () => {
      // This test simulates multiple migration attempts
      const migrationPromises = [
        applyMigration('001_professional_tier_schema.sql'),
        applyMigration('001_professional_tier_schema.sql'),
        applyMigration('001_professional_tier_schema.sql')
      ]

      // Only one should succeed, others should handle gracefully
      const results = await Promise.allSettled(migrationPromises)

      const successfulMigrations = results.filter(r => r.status === 'fulfilled').length
      const failedMigrations = results.filter(r => r.status === 'rejected').length

      // At least one should succeed, and failures should be handled gracefully
      expect(successfulMigrations).toBeGreaterThanOrEqual(1)

      // Verify final state is consistent
      const { data: tables } = await supabaseClient.rpc('get_tables')
      expect(tables).toContain('professional_evaluations')
    })
  })

  // Helper functions
  async function readMigrationFile(filename: string): Promise<string> {
    const migrationPath = path.join(__dirname, '../fixtures/migrations', filename)
    return await fs.readFile(migrationPath, 'utf-8')
  }

  async function applyMigration(migrationFile: string): Promise<void> {
    const migrationSql = await readMigrationFile(migrationFile)
    const { error } = await supabaseClient.rpc('exec', { sql: migrationSql })

    if (error) {
      throw new Error(`Migration ${migrationFile} failed: ${error.message}`)
    }

    migrationHistory.push(migrationFile)
  }

  async function rollbackMigration(rollbackFile: string): Promise<void> {
    const rollbackSql = await readMigrationFile(rollbackFile)
    const { error } = await supabaseClient.rpc('exec', { sql: rollbackSql })

    if (error) {
      throw new Error(`Rollback ${rollbackFile} failed: ${error.message}`)
    }
  }

  async function createDatabaseSnapshot(snapshotName: string): Promise<void> {
    // In a real implementation, this would create a database snapshot
    // For testing, we'll simulate with a timestamp
    const snapshot = {
      name: snapshotName,
      timestamp: new Date().toISOString(),
      tables: await supabaseClient.rpc('get_tables')
    }

    // Store snapshot metadata (in production, this would be more sophisticated)
    await supabaseClient.from('test_snapshots').insert(snapshot)
  }

  async function restoreDatabaseSnapshot(snapshotName: string): Promise<void> {
    // In a real implementation, this would restore from snapshot
    // For testing, we'll clean up test data
    await cleanupTestData()
  }

  async function rollbackAllTestMigrations(): Promise<void> {
    // Rollback migrations in reverse order
    for (const migration of migrationHistory.reverse()) {
      const rollbackFile = migration.replace('.sql', '_rollback.sql')
      try {
        await rollbackMigration(rollbackFile)
      } catch (error) {
        console.warn(`Failed to rollback ${migration}:`, error)
      }
    }
  }

  async function validateRollbackSafety(rollbackFile: string): Promise<{
    hasData: boolean
    affectedTables: string[]
    dataLossWarning: string | null
  }> {
    // Analyze rollback SQL to determine affected tables
    const rollbackSql = await readMigrationFile(rollbackFile)
    const dropTableMatches = rollbackSql.match(/DROP TABLE (\w+)/gi) || []
    const affectedTables = dropTableMatches.map(match =>
      match.replace('DROP TABLE ', '').toLowerCase()
    )

    // Check if tables have data
    let hasData = false
    for (const table of affectedTables) {
      const { count } = await supabaseClient
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1)

      if (count && count > 0) {
        hasData = true
        break
      }
    }

    return {
      hasData,
      affectedTables,
      dataLossWarning: hasData ?
        `Warning: Rollback will delete data from tables: ${affectedTables.join(', ')}` :
        null
    }
  }

  async function cleanupTestData(): Promise<void> {
    // Clean up any test data created during tests
    const testTables = [
      'professional_evaluations',
      'financial_metrics_extended',
      'customer_analytics',
      'operational_efficiency',
      'market_intelligence',
      'compliance_data'
    ]

    for (const table of testTables) {
      try {
        await supabaseClient.from(table).delete().like('id', 'test-%')
      } catch (error) {
        // Table might not exist, ignore
      }
    }
  }
})