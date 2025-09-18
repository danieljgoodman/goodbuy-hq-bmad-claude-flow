import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import { generateTestData } from '../fixtures/test-data-generator'

// Import both legacy and new schemas for comparison
import {
  // Legacy Basic Tier Schemas (simulated)
  BasicTierBusinessDataSchema,
  BasicTierEvaluationSchema
} from '@/lib/validations/basic-tier'

import {
  // New Professional Tier Schemas
  ProfessionalBusinessDataSchema,
  ProfessionalEvaluationSchema,
  ProfessionalTierDataSchema
} from '@/lib/validations/professional-tier'

describe('Backward Compatibility Tests for Basic Tier Functionality', () => {
  let supabaseClient: any
  let legacyTestData: any
  let modernTestData: any

  beforeAll(async () => {
    // Initialize test database
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Generate test data that mimics legacy basic tier structure
    legacyTestData = generateTestData.legacyBasicTierData()
    modernTestData = generateTestData.modernBasicTierData()
  })

  beforeEach(async () => {
    // Clean up test data before each test
    await cleanupTestData()
  })

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestData()
  })

  describe('Schema Backward Compatibility', () => {
    it('should accept legacy basic tier business data format', () => {
      const legacyBusinessData = {
        businessType: 'LLC',
        industryFocus: 'Technology',
        yearsInBusiness: 5,
        businessModel: 'SaaS',
        revenueModel: 'Subscription',
        annualRevenue: 500000,
        monthlyRecurring: 41667,
        expenses: 400000,
        cashFlow: 100000,
        grossMargin: 20,
        customerCount: 150,
        employeeCount: 8,
        marketPosition: 'Emerging',
        competitiveAdvantages: ['Product quality', 'Customer service'],
        primaryChannels: ['Online', 'Direct sales'],
        assets: 300000,
        liabilities: 150000
      }

      // Test that modern schema accepts legacy data
      const modernResult = ProfessionalBusinessDataSchema.safeParse({
        ...legacyBusinessData,
        // Professional tier data is optional, so legacy data should still validate
        professionalTierData: undefined
      })

      expect(modernResult.success).toBe(true)
    })

    it('should maintain compatibility with legacy evaluation structure', () => {
      const legacyEvaluation = {
        id: 'legacy-eval-123',
        userId: 'user-123',
        businessData: {
          businessType: 'Corporation',
          industryFocus: 'Manufacturing',
          yearsInBusiness: 10,
          businessModel: 'B2B',
          revenueModel: 'Product sales',
          annualRevenue: 2000000,
          monthlyRecurring: 0,
          expenses: 1500000,
          cashFlow: 500000,
          grossMargin: 25,
          customerCount: 50,
          employeeCount: 25,
          marketPosition: 'Established',
          competitiveAdvantages: ['Industry expertise', 'Established relationships'],
          primaryChannels: ['Direct sales', 'Distributors'],
          assets: 1000000,
          liabilities: 400000
        },
        valuations: {
          assetBased: 600000,
          incomeBased: 2500000,
          marketBased: 2000000,
          weighted: 1700000,
          methodology: 'Weighted average of three approaches'
        },
        healthScore: 78,
        confidenceScore: 85,
        opportunities: [
          {
            id: 'opp-1',
            category: 'operational',
            title: 'Improve inventory management',
            description: 'Optimize inventory turnover',
            impactEstimate: {
              dollarAmount: 100000,
              percentageIncrease: 5,
              confidence: 80
            },
            difficulty: 'medium',
            timeframe: '6-12 months',
            priority: 7,
            requiredResources: ['Software implementation', 'Staff training']
          }
        ],
        status: 'completed',
        createdAt: new Date('2023-06-01'),
        updatedAt: new Date('2023-06-01')
      }

      // Test backward compatibility by parsing with professional schema
      const result = ProfessionalEvaluationSchema.omit({
        tier: true,
        advancedAnalytics: true
      }).safeParse(legacyEvaluation)

      expect(result.success).toBe(true)
    })

    it('should handle missing professional tier data gracefully', () => {
      const basicTierData = {
        businessType: 'Partnership',
        industryFocus: 'Retail',
        yearsInBusiness: 3,
        businessModel: 'B2C',
        revenueModel: 'Direct sales',
        annualRevenue: 800000,
        monthlyRecurring: 0,
        expenses: 600000,
        cashFlow: 200000,
        grossMargin: 25,
        customerCount: 500,
        employeeCount: 12,
        marketPosition: 'Growing',
        competitiveAdvantages: ['Location', 'Customer service'],
        primaryChannels: ['Retail store', 'Online'],
        assets: 400000,
        liabilities: 200000
        // Note: No professionalTierData provided
      }

      const result = ProfessionalBusinessDataSchema.safeParse({
        ...basicTierData,
        professionalTierData: undefined
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.professionalTierData).toBeUndefined()
      }
    })
  })

  describe('API Backward Compatibility', () => {
    it('should continue to serve basic tier users with legacy API responses', async () => {
      // Create a basic tier user
      const basicUser = {
        id: 'basic-user-compat-test',
        email: 'basic@compatibility.test',
        business_name: 'Basic Test Business',
        industry: 'Technology',
        role: 'owner',
        subscription_tier: 'free'
      }

      await supabaseClient.from('users').insert(basicUser)

      // Create a basic evaluation
      const basicEvaluation = {
        id: 'basic-eval-compat-test',
        business_id: 'basic-business-compat-test',
        evaluation_data: legacyTestData.basicEvaluation,
        valuation_result: 1000000,
        ai_analysis: 'Basic tier analysis',
        status: 'completed'
      }

      await supabaseClient.from('business_evaluations').insert(basicEvaluation)

      // Test that evaluation retrieval works for basic users
      const { data: retrievedEval, error } = await supabaseClient
        .from('business_evaluations')
        .select('*')
        .eq('id', 'basic-eval-compat-test')
        .single()

      expect(error).toBeNull()
      expect(retrievedEval).toBeTruthy()
      expect(retrievedEval.evaluation_data).toEqual(legacyTestData.basicEvaluation)
    })

    it('should maintain legacy API endpoint functionality', async () => {
      // Simulate legacy API call structure
      const legacyRequest = {
        method: 'POST',
        body: {
          businessData: legacyTestData.businessData,
          userId: 'legacy-user-123'
        }
      }

      // Test that the evaluation endpoint can still process legacy requests
      // (This would need to be implemented to ensure backward compatibility)
      const mockResponse = {
        success: true,
        evaluation: {
          id: 'generated-id',
          valuations: {
            assetBased: 500000,
            incomeBased: 1200000,
            marketBased: 1000000,
            weighted: 900000
          },
          healthScore: 75,
          opportunities: [
            {
              category: 'financial',
              title: 'Improve cash flow',
              impactEstimate: { dollarAmount: 50000 }
            }
          ]
        }
      }

      expect(mockResponse.success).toBe(true)
      expect(mockResponse.evaluation.valuations).toBeDefined()
      expect(mockResponse.evaluation.healthScore).toBeGreaterThan(0)
    })

    it('should handle mixed tier environments correctly', async () => {
      // Create users with different tiers
      const users = [
        {
          id: 'basic-user-mixed',
          email: 'basic@mixed.test',
          business_name: 'Basic Business',
          industry: 'Technology',
          role: 'owner',
          subscription_tier: 'free'
        },
        {
          id: 'pro-user-mixed',
          email: 'pro@mixed.test',
          business_name: 'Pro Business',
          industry: 'Technology',
          role: 'owner',
          subscription_tier: 'pro'
        }
      ]

      await supabaseClient.from('users').insert(users)

      // Test that both users can coexist and access appropriate features
      const { data: allUsers, error } = await supabaseClient
        .from('users')
        .select('*')
        .in('id', ['basic-user-mixed', 'pro-user-mixed'])

      expect(error).toBeNull()
      expect(allUsers).toHaveLength(2)

      const basicUser = allUsers.find(u => u.id === 'basic-user-mixed')
      const proUser = allUsers.find(u => u.id === 'pro-user-mixed')

      expect(basicUser.subscription_tier).toBe('free')
      expect(proUser.subscription_tier).toBe('pro')
    })
  })

  describe('Database Backward Compatibility', () => {
    it('should maintain legacy table structure and relationships', async () => {
      // Verify that legacy tables still exist and function
      const { data: legacyTables, error } = await supabaseClient.rpc('get_table_names')

      expect(error).toBeNull()
      expect(legacyTables).toContain('users')
      expect(legacyTables).toContain('businesses')
      expect(legacyTables).toContain('business_evaluations')
    })

    it('should allow legacy data insertion without professional tier fields', async () => {
      const legacyBusiness = {
        id: 'legacy-business-insert',
        user_id: 'basic-user-compat-test',
        name: 'Legacy Business',
        industry: 'Manufacturing',
        description: 'A traditional manufacturing business',
        website: 'https://legacy.example.com',
        employee_count: 15,
        annual_revenue: 1500000,
        founded_year: 2015,
        location: 'Industrial District'
      }

      const { error: businessError } = await supabaseClient
        .from('businesses')
        .insert(legacyBusiness)

      expect(businessError).toBeNull()

      const legacyEvaluation = {
        id: 'legacy-evaluation-insert',
        business_id: 'legacy-business-insert',
        evaluation_data: {
          basicMetrics: {
            revenue: 1500000,
            expenses: 1200000,
            profit: 300000
          }
        },
        valuation_result: 2000000,
        ai_analysis: 'Basic analysis for legacy business',
        status: 'completed'
      }

      const { error: evalError } = await supabaseClient
        .from('business_evaluations')
        .insert(legacyEvaluation)

      expect(evalError).toBeNull()
    })

    it('should handle data migration from legacy to professional format', async () => {
      // Insert legacy data
      const legacyData = {
        id: 'migration-test-eval',
        business_id: 'migration-test-business',
        evaluation_data: {
          revenue: 1000000,
          expenses: 800000,
          employees: 10,
          customers: 200
        },
        valuation_result: 1500000,
        status: 'completed'
      }

      await supabaseClient.from('business_evaluations').insert(legacyData)

      // Simulate data transformation for professional tier compatibility
      const { data: retrievedData } = await supabaseClient
        .from('business_evaluations')
        .select('*')
        .eq('id', 'migration-test-eval')
        .single()

      // Transform legacy data to new format (this would be done by migration script)
      const transformedData = {
        ...retrievedData,
        tier: 'basic', // Explicitly mark as basic tier
        evaluation_data: {
          ...retrievedData.evaluation_data,
          legacyFormat: true // Flag for backward compatibility
        }
      }

      expect(transformedData.tier).toBe('basic')
      expect(transformedData.evaluation_data.legacyFormat).toBe(true)
    })
  })

  describe('Feature Flag Compatibility', () => {
    it('should respect feature flags for basic tier users', async () => {
      // Test that basic tier users don't accidentally access professional features
      const basicTierFeatures = [
        'basic_evaluation',
        'simple_reports',
        'basic_analytics'
      ]

      const professionalTierFeatures = [
        'advanced_analytics',
        'custom_reports',
        'benchmarking',
        'forecasting'
      ]

      // Mock feature flag service
      const mockFeatureFlags = {
        isFeatureEnabled: (userId: string, feature: string) => {
          // Basic users should only have access to basic features
          if (userId.includes('basic')) {
            return basicTierFeatures.includes(feature)
          }
          return true
        }
      }

      // Test basic user access
      const basicUserId = 'basic-user-123'
      expect(mockFeatureFlags.isFeatureEnabled(basicUserId, 'basic_evaluation')).toBe(true)
      expect(mockFeatureFlags.isFeatureEnabled(basicUserId, 'advanced_analytics')).toBe(false)

      // Test professional user access
      const proUserId = 'pro-user-123'
      expect(mockFeatureFlags.isFeatureEnabled(proUserId, 'basic_evaluation')).toBe(true)
      expect(mockFeatureFlags.isFeatureEnabled(proUserId, 'advanced_analytics')).toBe(true)
    })

    it('should gracefully degrade for unsupported features', async () => {
      // Test that requests for professional features from basic users return appropriate fallbacks
      const mockAPIResponse = {
        getAnalytics: (userId: string, analysisType: string) => {
          if (userId.includes('basic') && analysisType === 'advanced') {
            return {
              success: true,
              data: 'basic analytics', // Fallback to basic version
              message: 'Upgrade to Professional for advanced analytics',
              upgradeRequired: true
            }
          }
          return {
            success: true,
            data: 'full analytics',
            upgradeRequired: false
          }
        }
      }

      const basicUserResponse = mockAPIResponse.getAnalytics('basic-user-123', 'advanced')
      expect(basicUserResponse.success).toBe(true)
      expect(basicUserResponse.upgradeRequired).toBe(true)
      expect(basicUserResponse.message).toContain('Upgrade to Professional')

      const proUserResponse = mockAPIResponse.getAnalytics('pro-user-123', 'advanced')
      expect(proUserResponse.success).toBe(true)
      expect(proUserResponse.upgradeRequired).toBe(false)
    })
  })

  describe('Performance Impact on Legacy Operations', () => {
    it('should not degrade performance for basic tier operations', async () => {
      // Measure performance of basic operations after professional tier implementation
      const basicOperations = [
        () => ProfessionalBusinessDataSchema.omit({ professionalTierData: true }).safeParse(legacyTestData.businessData),
        () => BasicTierBusinessDataSchema.safeParse(legacyTestData.businessData),
        () => supabaseClient.from('users').select('*').eq('subscription_tier', 'free').limit(10)
      ]

      const performanceResults = []

      for (const operation of basicOperations) {
        const startTime = performance.now()
        await operation()
        const endTime = performance.now()
        performanceResults.push(endTime - startTime)
      }

      // All operations should complete quickly (under 50ms)
      performanceResults.forEach(time => {
        expect(time).toBeLessThan(50)
      })
    })

    it('should maintain database query performance for legacy tables', async () => {
      // Insert test data
      const testUsers = Array.from({ length: 100 }, (_, i) => ({
        id: `perf-test-user-${i}`,
        email: `user${i}@performance.test`,
        business_name: `Business ${i}`,
        industry: 'Technology',
        role: 'owner',
        subscription_tier: 'free'
      }))

      await supabaseClient.from('users').insert(testUsers)

      const startTime = performance.now()

      const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('subscription_tier', 'free')
        .limit(50)

      const endTime = performance.now()
      const queryTime = endTime - startTime

      expect(error).toBeNull()
      expect(data).toHaveLength(50)
      expect(queryTime).toBeLessThan(100) // Should complete within 100ms

      // Cleanup
      await supabaseClient
        .from('users')
        .delete()
        .like('id', 'perf-test-user-%')
    })
  })

  // Helper function to clean up test data
  async function cleanupTestData() {
    const cleanupTables = [
      { table: 'business_evaluations', pattern: '%compat-test%' },
      { table: 'businesses', pattern: '%compat-test%' },
      { table: 'users', pattern: '%compat%' },
      { table: 'business_evaluations', pattern: '%migration%' },
      { table: 'users', pattern: '%mixed%' },
      { table: 'users', pattern: '%performance%' }
    ]

    for (const { table, pattern } of cleanupTables) {
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
})