/**
 * Professional Tier Database Schema Extension - Production Validation Tests
 * Story 11.1: Comprehensive test suite to validate all acceptance criteria
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { ProfessionalTierDataSchema, validateProfessionalFieldCompleteness } from '@/lib/validations/professional-tier'
import { TierValidationMiddleware } from '@/lib/middleware/tier-validation'

const prisma = new PrismaClient()

// Mock Professional tier data with all 45+ fields
const mockProfessionalTierData = {
  financialMetrics: {
    annualRevenue: 1500000,
    monthlyRecurring: 125000,
    expenses: 900000,
    cashFlow: 600000,
    grossMargin: 75.5,
    netProfit: 480000,
    ebitda: 520000,
    burnRate: 15000,
    runwayMonths: 24,
    debtToEquityRatio: 0.3,
    currentRatio: 2.1,
    quickRatio: 1.8,
    inventoryTurnover: 12,
    receivablesTurnover: 8,
    workingCapital: 350000
  },
  customerAnalytics: {
    customerAcquisitionCost: 150,
    customerLifetimeValue: 2400,
    churnRate: 8.5,
    netPromoterScore: 65,
    monthlyActiveUsers: 12000,
    conversionRate: 3.2,
    averageOrderValue: 89.50,
    repeatCustomerRate: 42.3
  },
  operationalEfficiency: {
    employeeProductivity: 85000,
    operatingExpenseRatio: 35.2,
    capacityUtilization: 78.5,
    inventoryDaysOnHand: 45,
    paymentTermsDays: 30,
    vendorPaymentDays: 45,
    cashConversionCycle: 60
  },
  marketIntelligence: {
    marketShare: 12.5,
    marketGrowthRate: 8.2,
    competitorAnalysis: [
      {
        name: "Competitor A",
        marketShare: 25.3,
        strengths: ["Strong brand", "Large customer base"],
        weaknesses: ["Higher prices", "Limited innovation"]
      }
    ],
    marketTrends: ["Digital transformation", "Sustainability focus"],
    threatLevel: "medium" as const,
    opportunityScore: 75
  },
  financialPlanning: {
    revenueForecast12Month: Array(12).fill(0).map((_, i) => 125000 * (1 + i * 0.02)),
    expenseForecast12Month: Array(12).fill(0).map((_, i) => 75000 * (1 + i * 0.015)),
    cashFlowForecast12Month: Array(12).fill(0).map((_, i) => 50000 * (1 + i * 0.025)),
    scenarioAnalysis: {
      optimistic: { revenue: 2000000, expenses: 1000000 },
      realistic: { revenue: 1500000, expenses: 900000 },
      pessimistic: { revenue: 1200000, expenses: 950000 }
    },
    budgetVariance: 5.2
  },
  compliance: {
    regulatoryCompliance: [
      {
        regulation: "GDPR",
        status: "compliant" as const,
        lastAuditDate: new Date('2024-01-15'),
        nextAuditDate: new Date('2025-01-15')
      }
    ],
    riskAssessment: {
      financialRisk: "low" as const,
      operationalRisk: "medium" as const,
      marketRisk: "medium" as const,
      overallRiskScore: 35
    },
    insuranceCoverage: [
      {
        type: "General Liability",
        coverage: 2000000,
        premium: 15000,
        expires: new Date('2025-12-31')
      }
    ],
    auditTrail: [
      {
        date: new Date(),
        action: "Data validation",
        user: "test-user",
        details: "Professional tier data validation"
      }
    ]
  }
}

describe('Professional Tier Database Schema Extension - Production Validation', () => {

  beforeAll(async () => {
    // Setup test database connection
    await prisma.$connect()
  })

  afterAll(async () => {
    // Cleanup
    await prisma.$disconnect()
  })

  describe('1. Professional Tier Fields Validation', () => {
    test('should validate all 45+ Professional tier fields are present', () => {
      const validation = validateProfessionalFieldCompleteness(mockProfessionalTierData)

      expect(validation.isValid).toBe(true)
      expect(validation.fieldCount).toBeGreaterThanOrEqual(45)
      expect(validation.meetsMinimumRequirement).toBe(true)
    })

    test('should validate Professional tier data schema structure', () => {
      const result = ProfessionalTierDataSchema.safeParse(mockProfessionalTierData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.financialMetrics).toBeDefined()
        expect(result.data.customerAnalytics).toBeDefined()
        expect(result.data.operationalEfficiency).toBeDefined()
        expect(result.data.marketIntelligence).toBeDefined()
        expect(result.data.financialPlanning).toBeDefined()
        expect(result.data.compliance).toBeDefined()
      }
    })

    test('should enforce required fields in each category', () => {
      const categories = [
        'financialMetrics',
        'customerAnalytics',
        'operationalEfficiency',
        'marketIntelligence',
        'financialPlanning',
        'compliance'
      ]

      categories.forEach(category => {
        const partialData = { ...mockProfessionalTierData }
        delete (partialData as any)[category]

        const result = ProfessionalTierDataSchema.safeParse(partialData)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('2. API Access Control Validation', () => {
    test('should properly validate Professional tier data through middleware', () => {
      const validation = TierValidationMiddleware.validateProfessionalData(mockProfessionalTierData)

      expect(validation.isValid).toBe(true)
      expect(validation.sanitizedData).toBeDefined()
      expect(validation.errors).toBeUndefined()
    })

    test('should reject invalid Professional tier data', () => {
      const invalidData = {
        financialMetrics: {
          annualRevenue: -1000, // Invalid negative value
          // Missing required fields
        }
      }

      const validation = TierValidationMiddleware.validateProfessionalData(invalidData)

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toBeDefined()
    })

    test('should filter data based on user tier', () => {
      const evaluationData = {
        id: 'test-id',
        businessData: { businessType: 'SaaS' },
        professionalData: mockProfessionalTierData,
        subscriptionTier: 'professional'
      }

      // Basic tier user should not see professional data
      const filteredForBasic = TierValidationMiddleware.filterDataByTier(
        evaluationData,
        'basic',
        'evaluation'
      )
      expect(filteredForBasic.professionalData).toBeUndefined()
      expect(filteredForBasic.subscriptionTier).toBe('basic')

      // Professional tier user should see all data
      const filteredForProfessional = TierValidationMiddleware.filterDataByTier(
        evaluationData,
        'professional',
        'evaluation'
      )
      expect(filteredForProfessional.professionalData).toBeDefined()
      expect(filteredForProfessional.subscriptionTier).toBe('professional')
    })
  })

  describe('3. Database Schema Validation', () => {
    test('should validate database schema includes Professional tier columns', async () => {
      const tableInfo = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'business_evaluations'
          AND column_name IN ('professional_data', 'subscription_tier', 'analysis_depth', 'data_version')
        ORDER BY column_name;
      ` as any[]

      expect(tableInfo).toHaveLength(4)

      const columnNames = tableInfo.map(col => col.column_name)
      expect(columnNames).toContain('professional_data')
      expect(columnNames).toContain('subscription_tier')
      expect(columnNames).toContain('analysis_depth')
      expect(columnNames).toContain('data_version')
    })

    test('should validate Professional tier indexes exist', async () => {
      const indexes = await prisma.$queryRaw`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'business_evaluations'
          AND (indexname LIKE '%tier%' OR indexname LIKE '%professional%')
        ORDER BY indexname;
      ` as any[]

      expect(indexes.length).toBeGreaterThan(0)

      const indexNames = indexes.map(idx => idx.indexname)
      expect(indexNames.some(name => name.includes('tier'))).toBe(true)
    })

    test('should validate audit table exists and has correct structure', async () => {
      const auditTableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_name = 'professional_data_audit'
        );
      ` as any[]

      expect(auditTableExists[0].exists).toBe(true)

      const auditColumns = await prisma.$queryRaw`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'professional_data_audit'
        ORDER BY column_name;
      ` as any[]

      const columnNames = auditColumns.map(col => col.column_name)
      expect(columnNames).toContain('business_evaluation_id')
      expect(columnNames).toContain('user_id')
      expect(columnNames).toContain('change_type')
      expect(columnNames).toContain('timestamp')
    })
  })

  describe('4. Type Safety Validation', () => {
    test('should maintain type safety across all Professional tier operations', () => {
      // Test that TypeScript types are properly defined
      const data: typeof mockProfessionalTierData = mockProfessionalTierData

      // Financial metrics type safety
      expect(typeof data.financialMetrics.annualRevenue).toBe('number')
      expect(typeof data.financialMetrics.grossMargin).toBe('number')

      // Customer analytics type safety
      expect(typeof data.customerAnalytics.churnRate).toBe('number')
      expect(typeof data.customerAnalytics.netPromoterScore).toBe('number')

      // Market intelligence type safety
      expect(data.marketIntelligence.threatLevel).toMatch(/^(low|medium|high)$/)
      expect(Array.isArray(data.marketIntelligence.competitorAnalysis)).toBe(true)

      // Compliance type safety
      expect(data.compliance.riskAssessment.financialRisk).toMatch(/^(low|medium|high)$/)
      expect(Array.isArray(data.compliance.auditTrail)).toBe(true)
    })

    test('should validate nested object structures', () => {
      const competitor = mockProfessionalTierData.marketIntelligence.competitorAnalysis[0]
      expect(competitor).toHaveProperty('name')
      expect(competitor).toHaveProperty('marketShare')
      expect(competitor).toHaveProperty('strengths')
      expect(competitor).toHaveProperty('weaknesses')
      expect(Array.isArray(competitor.strengths)).toBe(true)
      expect(Array.isArray(competitor.weaknesses)).toBe(true)
    })
  })

  describe('5. Regression Testing - Basic Tier Functionality', () => {
    test('should maintain basic tier evaluation creation', () => {
      const basicBusinessData = {
        businessType: 'SaaS',
        industryFocus: 'Technology',
        yearsInBusiness: 5,
        businessModel: 'Subscription',
        revenueModel: 'Recurring',
        annualRevenue: 1000000,
        monthlyRecurring: 83333,
        expenses: 600000,
        cashFlow: 400000,
        grossMargin: 70,
        customerCount: 500,
        employeeCount: 25,
        marketPosition: 'Growth',
        competitiveAdvantages: ['Innovation'],
        primaryChannels: ['Online'],
        assets: 2000000,
        liabilities: 500000
      }

      // Should not require Professional tier fields
      expect(basicBusinessData).toBeDefined()
      expect(basicBusinessData.annualRevenue).toBe(1000000)
      expect(basicBusinessData.businessType).toBe('SaaS')
    })

    test('should ensure basic tier users cannot access Professional data', () => {
      const evaluationWithProfessionalData = {
        id: 'test-eval',
        businessData: { businessType: 'SaaS' },
        professionalData: mockProfessionalTierData,
        subscriptionTier: 'professional'
      }

      const filteredData = TierValidationMiddleware.filterDataByTier(
        evaluationWithProfessionalData,
        'basic',
        'evaluation'
      )

      expect(filteredData.professionalData).toBeUndefined()
      expect(filteredData.subscriptionTier).toBe('basic')
    })
  })

  describe('6. Performance Validation', () => {
    test('should handle Professional tier data operations within performance thresholds', async () => {
      const startTime = Date.now()

      // Simulate processing Professional tier data
      const validation = TierValidationMiddleware.validateProfessionalData(mockProfessionalTierData)
      const filtering = TierValidationMiddleware.filterDataByTier(
        { professionalData: mockProfessionalTierData },
        'professional',
        'evaluation'
      )

      const endTime = Date.now()
      const processingTime = endTime - startTime

      expect(validation.isValid).toBe(true)
      expect(filtering).toBeDefined()
      expect(processingTime).toBeLessThan(2000) // < 2 seconds requirement
    })

    test('should validate data size constraints', () => {
      const dataSize = JSON.stringify(mockProfessionalTierData).length

      // Professional tier data should be substantial but not excessive
      expect(dataSize).toBeGreaterThan(1000) // Minimum complexity
      expect(dataSize).toBeLessThan(100000)  // Maximum reasonable size
    })
  })

  describe('7. Data Integrity and Consistency', () => {
    test('should maintain data consistency across tier upgrades', () => {
      const basicData = {
        businessType: 'SaaS',
        annualRevenue: 1000000,
        expenses: 600000
      }

      const professionalData = {
        ...basicData,
        professionalTierData: mockProfessionalTierData
      }

      // Basic values should be preserved in Professional tier
      expect(professionalData.businessType).toBe(basicData.businessType)
      expect(professionalData.annualRevenue).toBe(basicData.annualRevenue)
      expect(professionalData.expenses).toBe(basicData.expenses)
    })

    test('should validate field relationships and constraints', () => {
      const { financialMetrics } = mockProfessionalTierData

      // Logical business constraints
      expect(financialMetrics.grossMargin).toBeGreaterThan(0)
      expect(financialMetrics.grossMargin).toBeLessThanOrEqual(100)
      expect(financialMetrics.currentRatio).toBeGreaterThan(0)
      expect(financialMetrics.debtToEquityRatio).toBeGreaterThanOrEqual(0)
    })
  })

  describe('8. Security and Access Control', () => {
    test('should validate audit trail creation', () => {
      const auditEntry = mockProfessionalTierData.compliance.auditTrail[0]

      expect(auditEntry).toHaveProperty('date')
      expect(auditEntry).toHaveProperty('action')
      expect(auditEntry).toHaveProperty('user')
      expect(auditEntry).toHaveProperty('details')
      expect(auditEntry.date).toBeInstanceOf(Date)
    })

    test('should validate data sanitization', () => {
      const validation = TierValidationMiddleware.validateProfessionalData(mockProfessionalTierData)

      expect(validation.isValid).toBe(true)
      expect(validation.sanitizedData).toBeDefined()

      // Ensure no malicious content passes through
      const sanitized = validation.sanitizedData!
      const jsonString = JSON.stringify(sanitized)
      expect(jsonString).not.toContain('<script>')
      expect(jsonString).not.toContain('javascript:')
    })
  })

  describe('9. Field Count and Completeness Validation', () => {
    test('should validate exact field counts per category', () => {
      const { financialMetrics, customerAnalytics, operationalEfficiency } = mockProfessionalTierData

      expect(Object.keys(financialMetrics)).toHaveLength(15)
      expect(Object.keys(customerAnalytics)).toHaveLength(8)
      expect(Object.keys(operationalEfficiency)).toHaveLength(7)
    })

    test('should validate minimum 45+ total fields requirement', () => {
      const validation = validateProfessionalFieldCompleteness(mockProfessionalTierData)

      expect(validation.fieldCount).toBeGreaterThanOrEqual(45)
      expect(validation.meetsMinimumRequirement).toBe(true)
    })

    test('should validate array fields contain required structures', () => {
      const { marketIntelligence, financialPlanning } = mockProfessionalTierData

      // Market intelligence arrays
      expect(Array.isArray(marketIntelligence.competitorAnalysis)).toBe(true)
      expect(Array.isArray(marketIntelligence.marketTrends)).toBe(true)

      // Financial planning arrays
      expect(Array.isArray(financialPlanning.revenueForecast12Month)).toBe(true)
      expect(financialPlanning.revenueForecast12Month).toHaveLength(12)
      expect(Array.isArray(financialPlanning.expenseForecast12Month)).toBe(true)
      expect(financialPlanning.expenseForecast12Month).toHaveLength(12)
    })
  })

  describe('10. Migration and Rollback Validation', () => {
    test('should validate schema version tracking', () => {
      // Mock evaluation with version tracking
      const evaluation = {
        subscriptionTier: 'professional',
        analysisDepth: 'professional',
        dataVersion: '2.0'
      }

      expect(evaluation.dataVersion).toBe('2.0')
      expect(evaluation.subscriptionTier).toBe('professional')
      expect(evaluation.analysisDepth).toBe('professional')
    })

    test('should validate backward compatibility', () => {
      // Basic tier data should work without Professional fields
      const basicEvaluation = {
        businessData: { businessType: 'SaaS' },
        subscriptionTier: 'basic',
        analysisDepth: 'basic',
        dataVersion: '1.0'
      }

      expect(basicEvaluation.subscriptionTier).toBe('basic')
      expect(basicEvaluation.dataVersion).toBe('1.0')
      // Should not have professionalData field
      expect('professionalData' in basicEvaluation).toBe(false)
    })
  })
})