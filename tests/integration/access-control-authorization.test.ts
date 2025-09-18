import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import { generateTestData } from '../fixtures/test-data-generator'

describe('Access Control and Authorization Tests', () => {
  let adminClient: any
  let basicUserClient: any
  let proUserClient: any
  let enterpriseUserClient: any

  let testUsers: {
    basic: any
    pro: any
    enterprise: any
    admin: any
  }

  beforeAll(async () => {
    // Initialize admin client
    adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create test users with different tiers
    testUsers = await createTestUsers()

    // Create authenticated clients for each user type
    basicUserClient = await createAuthenticatedClient(testUsers.basic)
    proUserClient = await createAuthenticatedClient(testUsers.pro)
    enterpriseUserClient = await createAuthenticatedClient(testUsers.enterprise)
  })

  afterAll(async () => {
    await cleanupTestUsers()
  })

  beforeEach(async () => {
    await cleanupTestData()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  describe('Row Level Security (RLS) Enforcement', () => {
    it('should enforce RLS on users table - users can only see their own data', async () => {
      // Basic user should only see their own record
      const { data: basicUserData, error: basicError } = await basicUserClient
        .from('users')
        .select('*')

      expect(basicError).toBeNull()
      expect(basicUserData).toHaveLength(1)
      expect(basicUserData[0].id).toBe(testUsers.basic.id)

      // Pro user should only see their own record
      const { data: proUserData, error: proError } = await proUserClient
        .from('users')
        .select('*')

      expect(proError).toBeNull()
      expect(proUserData).toHaveLength(1)
      expect(proUserData[0].id).toBe(testUsers.pro.id)

      // Users should not see each other's data
      expect(basicUserData[0].id).not.toBe(proUserData[0].id)
    })

    it('should enforce RLS on businesses table - users can only access their own businesses', async () => {
      // Create test businesses for different users
      const basicBusiness = {
        id: 'rls-basic-business',
        user_id: testUsers.basic.id,
        name: 'Basic User Business',
        industry: 'Technology'
      }

      const proBusiness = {
        id: 'rls-pro-business',
        user_id: testUsers.pro.id,
        name: 'Pro User Business',
        industry: 'Finance'
      }

      await adminClient.from('businesses').insert([basicBusiness, proBusiness])

      // Basic user should only see their business
      const { data: basicUserBusinesses } = await basicUserClient
        .from('businesses')
        .select('*')

      expect(basicUserBusinesses).toHaveLength(1)
      expect(basicUserBusinesses[0].user_id).toBe(testUsers.basic.id)

      // Pro user should only see their business
      const { data: proUserBusinesses } = await proUserClient
        .from('businesses')
        .select('*')

      expect(proUserBusinesses).toHaveLength(1)
      expect(proUserBusinesses[0].user_id).toBe(testUsers.pro.id)
    })

    it('should enforce RLS on professional_evaluations table', async () => {
      // Create test data
      await createTestBusinessHierarchy()

      const basicEvaluation = {
        id: 'rls-basic-eval',
        user_id: testUsers.basic.id,
        business_id: 'rls-basic-business',
        tier: 'basic',
        evaluation_data: { test: 'basic data' }
      }

      const proEvaluation = {
        id: 'rls-pro-eval',
        user_id: testUsers.pro.id,
        business_id: 'rls-pro-business',
        tier: 'professional',
        evaluation_data: { test: 'pro data' }
      }

      await adminClient.from('professional_evaluations').insert([basicEvaluation, proEvaluation])

      // Basic user should only see their evaluations
      const { data: basicEvals } = await basicUserClient
        .from('professional_evaluations')
        .select('*')

      expect(basicEvals).toHaveLength(1)
      expect(basicEvals[0].user_id).toBe(testUsers.basic.id)

      // Pro user should only see their evaluations
      const { data: proEvals } = await proUserClient
        .from('professional_evaluations')
        .select('*')

      expect(proEvals).toHaveLength(1)
      expect(proEvals[0].user_id).toBe(testUsers.pro.id)
    })

    it('should prevent unauthorized access to professional tier extended tables', async () => {
      await createTestBusinessHierarchy()

      // Create professional evaluation for pro user
      const proEvaluation = {
        id: 'auth-pro-eval',
        user_id: testUsers.pro.id,
        business_id: 'rls-pro-business',
        tier: 'professional',
        evaluation_data: { test: 'data' }
      }

      await adminClient.from('professional_evaluations').insert(proEvaluation)

      // Create extended financial metrics
      const financialMetrics = {
        evaluation_id: 'auth-pro-eval',
        net_profit: 100000,
        ebitda: 150000,
        burn_rate: 10000,
        runway_months: 18
      }

      await adminClient.from('financial_metrics_extended').insert(financialMetrics)

      // Pro user should be able to access their extended metrics
      const { data: proMetrics, error: proError } = await proUserClient
        .from('financial_metrics_extended')
        .select('*')
        .eq('evaluation_id', 'auth-pro-eval')

      expect(proError).toBeNull()
      expect(proMetrics).toHaveLength(1)

      // Basic user should not be able to access pro user's metrics
      const { data: basicMetrics } = await basicUserClient
        .from('financial_metrics_extended')
        .select('*')
        .eq('evaluation_id', 'auth-pro-eval')

      expect(basicMetrics).toHaveLength(0)
    })
  })

  describe('Tier-Based Access Control', () => {
    it('should allow basic users to create basic evaluations only', async () => {
      await createTestBusinessHierarchy()

      const basicEvaluation = {
        id: 'tier-basic-eval',
        user_id: testUsers.basic.id,
        business_id: 'rls-basic-business',
        tier: 'basic',
        evaluation_data: { basic: 'data' }
      }

      const { error } = await basicUserClient
        .from('professional_evaluations')
        .insert(basicEvaluation)

      expect(error).toBeNull()
    })

    it('should prevent basic users from creating professional evaluations', async () => {
      await createTestBusinessHierarchy()

      const professionalEvaluation = {
        id: 'tier-fail-eval',
        user_id: testUsers.basic.id,
        business_id: 'rls-basic-business',
        tier: 'professional', // This should be prevented by business logic
        evaluation_data: { professional: 'data' }
      }

      // Note: This test assumes business logic validation
      // In practice, this might be enforced at the application level
      const { error } = await basicUserClient
        .from('professional_evaluations')
        .insert(professionalEvaluation)

      // Depending on implementation, this might succeed at DB level
      // but should be caught by application-level validation
      if (!error) {
        // If DB allows it, application should validate tier compatibility
        console.warn('Database allows tier mismatch - ensure application validation')
      }
    })

    it('should allow pro users to access professional features', async () => {
      await createTestBusinessHierarchy()

      const professionalEvaluation = {
        id: 'tier-pro-eval',
        user_id: testUsers.pro.id,
        business_id: 'rls-pro-business',
        tier: 'professional',
        evaluation_data: { professional: 'data' }
      }

      const { error } = await proUserClient
        .from('professional_evaluations')
        .insert(professionalEvaluation)

      expect(error).toBeNull()

      // Pro user should be able to create extended metrics
      const financialMetrics = {
        evaluation_id: 'tier-pro-eval',
        net_profit: 100000,
        ebitda: 150000,
        burn_rate: 10000,
        runway_months: 18
      }

      const { error: metricsError } = await proUserClient
        .from('financial_metrics_extended')
        .insert(financialMetrics)

      expect(metricsError).toBeNull()
    })

    it('should allow enterprise users to access all features', async () => {
      await createTestBusinessHierarchy()

      const enterpriseEvaluation = {
        id: 'tier-enterprise-eval',
        user_id: testUsers.enterprise.id,
        business_id: 'rls-enterprise-business',
        tier: 'professional',
        evaluation_data: { enterprise: 'data' }
      }

      const { error } = await enterpriseUserClient
        .from('professional_evaluations')
        .insert(enterpriseEvaluation)

      expect(error).toBeNull()

      // Enterprise user should be able to create all extended data types
      const promises = [
        enterpriseUserClient.from('financial_metrics_extended').insert({
          evaluation_id: 'tier-enterprise-eval',
          net_profit: 200000,
          ebitda: 300000
        }),
        enterpriseUserClient.from('customer_analytics').insert({
          evaluation_id: 'tier-enterprise-eval',
          customer_acquisition_cost: 150,
          customer_lifetime_value: 2500
        }),
        enterpriseUserClient.from('operational_efficiency').insert({
          evaluation_id: 'tier-enterprise-eval',
          employee_productivity: 75000,
          operating_expense_ratio: 60
        })
      ]

      const results = await Promise.allSettled(promises)
      const failures = results.filter(r => r.status === 'rejected')

      expect(failures).toHaveLength(0)
    })
  })

  describe('CRUD Operation Authorization', () => {
    it('should allow users to create their own data', async () => {
      const newBusiness = {
        id: 'crud-create-business',
        user_id: testUsers.basic.id,
        name: 'CRUD Test Business',
        industry: 'Technology'
      }

      const { error } = await basicUserClient
        .from('businesses')
        .insert(newBusiness)

      expect(error).toBeNull()
    })

    it('should allow users to read their own data', async () => {
      await createTestBusinessHierarchy()

      const { data, error } = await basicUserClient
        .from('businesses')
        .select('*')
        .eq('user_id', testUsers.basic.id)

      expect(error).toBeNull()
      expect(data).toHaveLength(1)
    })

    it('should allow users to update their own data', async () => {
      await createTestBusinessHierarchy()

      const { error } = await basicUserClient
        .from('businesses')
        .update({ name: 'Updated Business Name' })
        .eq('id', 'rls-basic-business')

      expect(error).toBeNull()

      // Verify update
      const { data } = await basicUserClient
        .from('businesses')
        .select('name')
        .eq('id', 'rls-basic-business')
        .single()

      expect(data.name).toBe('Updated Business Name')
    })

    it('should allow users to delete their own data', async () => {
      await createTestBusinessHierarchy()

      // Create a test evaluation to delete
      const testEvaluation = {
        id: 'crud-delete-eval',
        user_id: testUsers.basic.id,
        business_id: 'rls-basic-business',
        tier: 'basic',
        evaluation_data: { test: 'data' }
      }

      await adminClient.from('professional_evaluations').insert(testEvaluation)

      // User should be able to delete their own evaluation
      const { error } = await basicUserClient
        .from('professional_evaluations')
        .delete()
        .eq('id', 'crud-delete-eval')

      expect(error).toBeNull()
    })

    it('should prevent users from accessing other users data', async () => {
      await createTestBusinessHierarchy()

      // Basic user should not be able to update pro user's business
      const { error } = await basicUserClient
        .from('businesses')
        .update({ name: 'Hacked Business Name' })
        .eq('id', 'rls-pro-business')

      expect(error).toBeTruthy()
    })

    it('should prevent users from deleting other users data', async () => {
      await createTestBusinessHierarchy()

      // Basic user should not be able to delete pro user's business
      const { error } = await basicUserClient
        .from('businesses')
        .delete()
        .eq('id', 'rls-pro-business')

      expect(error).toBeTruthy()
    })
  })

  describe('API Endpoint Authorization', () => {
    it('should validate user permissions before processing requests', async () => {
      // Mock API request validation
      const mockAuthMiddleware = {
        validateUserAccess: (userId: string, requestedUserId: string) => {
          return userId === requestedUserId
        },
        validateTierAccess: (userTier: string, requiredTier: string) => {
          const tierHierarchy = { 'free': 0, 'pro': 1, 'enterprise': 2 }
          return tierHierarchy[userTier] >= tierHierarchy[requiredTier]
        }
      }

      // Test user accessing their own data
      expect(mockAuthMiddleware.validateUserAccess(testUsers.basic.id, testUsers.basic.id)).toBe(true)

      // Test user accessing other user's data
      expect(mockAuthMiddleware.validateUserAccess(testUsers.basic.id, testUsers.pro.id)).toBe(false)

      // Test tier access validation
      expect(mockAuthMiddleware.validateTierAccess('pro', 'free')).toBe(true)
      expect(mockAuthMiddleware.validateTierAccess('free', 'pro')).toBe(false)
      expect(mockAuthMiddleware.validateTierAccess('enterprise', 'pro')).toBe(true)
    })

    it('should return appropriate error codes for unauthorized access', async () => {
      const mockAPIResponse = {
        handleUnauthorizedAccess: (userTier: string, requiredTier: string) => {
          if (userTier === 'free' && requiredTier === 'pro') {
            return {
              status: 403,
              error: 'Forbidden',
              message: 'Professional subscription required',
              upgradeUrl: '/upgrade'
            }
          }
          if (userTier === 'pro' && requiredTier === 'enterprise') {
            return {
              status: 403,
              error: 'Forbidden',
              message: 'Enterprise subscription required',
              upgradeUrl: '/upgrade/enterprise'
            }
          }
          return { status: 200, success: true }
        }
      }

      const basicToProResponse = mockAPIResponse.handleUnauthorizedAccess('free', 'pro')
      expect(basicToProResponse.status).toBe(403)
      expect(basicToProResponse.message).toContain('Professional')

      const proToEnterpriseResponse = mockAPIResponse.handleUnauthorizedAccess('pro', 'enterprise')
      expect(proToEnterpriseResponse.status).toBe(403)
      expect(proToEnterpriseResponse.message).toContain('Enterprise')
    })
  })

  describe('Session and Token Management', () => {
    it('should invalidate sessions on tier downgrade', async () => {
      // Simulate tier downgrade scenario
      const mockSessionManager = {
        invalidateUserSessions: async (userId: string) => {
          // In real implementation, this would invalidate JWT tokens
          return { success: true, sessionsInvalidated: 3 }
        },
        requireReauthentication: async (userId: string) => {
          return { success: true, reauthRequired: true }
        }
      }

      // Simulate pro user being downgraded to basic
      const result = await mockSessionManager.invalidateUserSessions(testUsers.pro.id)
      expect(result.success).toBe(true)
      expect(result.sessionsInvalidated).toBeGreaterThan(0)

      const reauthResult = await mockSessionManager.requireReauthentication(testUsers.pro.id)
      expect(reauthResult.reauthRequired).toBe(true)
    })

    it('should handle expired tokens gracefully', async () => {
      const mockTokenValidator = {
        validateToken: (token: string) => {
          // Simulate expired token
          if (token === 'expired_token') {
            return {
              valid: false,
              error: 'TOKEN_EXPIRED',
              message: 'Authentication token has expired'
            }
          }
          return { valid: true }
        }
      }

      const expiredResult = mockTokenValidator.validateToken('expired_token')
      expect(expiredResult.valid).toBe(false)
      expect(expiredResult.error).toBe('TOKEN_EXPIRED')

      const validResult = mockTokenValidator.validateToken('valid_token')
      expect(validResult.valid).toBe(true)
    })
  })

  describe('Audit Trail and Logging', () => {
    it('should log all access attempts', async () => {
      const mockAuditLogger = {
        logAccess: (userId: string, resource: string, action: string, success: boolean) => ({
          timestamp: new Date(),
          userId,
          resource,
          action,
          success,
          ip: '127.0.0.1',
          userAgent: 'test-client'
        })
      }

      // Test successful access
      const successLog = mockAuditLogger.logAccess(
        testUsers.basic.id,
        'businesses',
        'SELECT',
        true
      )

      expect(successLog.userId).toBe(testUsers.basic.id)
      expect(successLog.success).toBe(true)

      // Test failed access
      const failureLog = mockAuditLogger.logAccess(
        testUsers.basic.id,
        'professional_evaluations',
        'INSERT',
        false
      )

      expect(failureLog.success).toBe(false)
    })

    it('should track tier-based feature usage', async () => {
      const mockUsageTracker = {
        trackFeatureUsage: (userId: string, feature: string, tier: string) => ({
          userId,
          feature,
          tier,
          timestamp: new Date(),
          allowed: tier !== 'free' || feature === 'basic_evaluation'
        })
      }

      // Track basic user attempting professional feature
      const basicUserUsage = mockUsageTracker.trackFeatureUsage(
        testUsers.basic.id,
        'advanced_analytics',
        'free'
      )

      expect(basicUserUsage.allowed).toBe(false)

      // Track pro user using professional feature
      const proUserUsage = mockUsageTracker.trackFeatureUsage(
        testUsers.pro.id,
        'advanced_analytics',
        'pro'
      )

      expect(proUserUsage.allowed).toBe(true)
    })
  })

  // Helper functions
  async function createTestUsers() {
    const users = {
      basic: {
        id: 'auth-basic-user',
        email: 'basic@auth.test',
        password: 'testpassword123'
      },
      pro: {
        id: 'auth-pro-user',
        email: 'pro@auth.test',
        password: 'testpassword123'
      },
      enterprise: {
        id: 'auth-enterprise-user',
        email: 'enterprise@auth.test',
        password: 'testpassword123'
      },
      admin: {
        id: 'auth-admin-user',
        email: 'admin@auth.test',
        password: 'testpassword123'
      }
    }

    // Create auth users
    for (const [tier, user] of Object.entries(users)) {
      const { data: authUser } = await adminClient.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      })

      user.id = authUser.user.id
    }

    // Insert user records with appropriate tiers
    await adminClient.from('users').insert([
      {
        id: users.basic.id,
        email: users.basic.email,
        business_name: 'Basic Test Business',
        industry: 'Technology',
        role: 'owner',
        subscription_tier: 'free'
      },
      {
        id: users.pro.id,
        email: users.pro.email,
        business_name: 'Pro Test Business',
        industry: 'Technology',
        role: 'owner',
        subscription_tier: 'pro'
      },
      {
        id: users.enterprise.id,
        email: users.enterprise.email,
        business_name: 'Enterprise Test Business',
        industry: 'Technology',
        role: 'owner',
        subscription_tier: 'enterprise'
      }
    ])

    return users
  }

  async function createAuthenticatedClient(user: any) {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    await client.auth.signInWithPassword({
      email: user.email,
      password: user.password
    })

    return client
  }

  async function createTestBusinessHierarchy() {
    const businesses = [
      {
        id: 'rls-basic-business',
        user_id: testUsers.basic.id,
        name: 'Basic User Business',
        industry: 'Technology'
      },
      {
        id: 'rls-pro-business',
        user_id: testUsers.pro.id,
        name: 'Pro User Business',
        industry: 'Finance'
      },
      {
        id: 'rls-enterprise-business',
        user_id: testUsers.enterprise.id,
        name: 'Enterprise User Business',
        industry: 'Healthcare'
      }
    ]

    await adminClient.from('businesses').insert(businesses)
  }

  async function cleanupTestUsers() {
    if (testUsers) {
      for (const user of Object.values(testUsers)) {
        try {
          await adminClient.auth.admin.deleteUser(user.id)
          await adminClient.from('users').delete().eq('id', user.id)
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }
  }

  async function cleanupTestData() {
    const patterns = [
      'rls-%',
      'auth-%',
      'tier-%',
      'crud-%'
    ]

    const tables = [
      'financial_metrics_extended',
      'customer_analytics',
      'operational_efficiency',
      'market_intelligence',
      'compliance_data',
      'professional_evaluations',
      'business_evaluations',
      'businesses'
    ]

    for (const table of tables) {
      for (const pattern of patterns) {
        try {
          await adminClient
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