import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  ProfessionalFinancialMetricsSchema,
  CustomerAnalyticsSchema,
  OperationalEfficiencySchema,
  MarketIntelligenceSchema,
  FinancialPlanningSchema,
  ComplianceSchema,
  ProfessionalTierDataSchema,
  ProfessionalBusinessDataSchema,
  ProfessionalEvaluationSchema,
  validateProfessionalFinancialMetrics,
  validateCustomerAnalytics,
  validateOperationalEfficiency,
  validateMarketIntelligence,
  validateFinancialPlanning,
  validateCompliance,
  validateProfessionalTierData,
  validateProfessionalBusinessData,
  validateProfessionalEvaluation,
  validateProfessionalFieldCompleteness,
  PROFESSIONAL_TIER_FIELD_COUNT,
  type ProfessionalTierData,
  type ProfessionalFinancialMetrics,
  type CustomerAnalytics,
  type OperationalEfficiency,
  type MarketIntelligence,
  type FinancialPlanning,
  type Compliance
} from '@/lib/validations/professional-tier'

describe('Professional Tier Validation Schemas', () => {
  describe('ProfessionalFinancialMetricsSchema', () => {
    let validFinancialData: ProfessionalFinancialMetrics

    beforeEach(() => {
      validFinancialData = {
        // Core metrics
        annualRevenue: 1000000,
        monthlyRecurring: 83333,
        expenses: 750000,
        cashFlow: 250000,
        grossMargin: 25,
        // Professional additions
        netProfit: 150000,
        ebitda: 200000,
        burnRate: 50000,
        runwayMonths: 18,
        debtToEquityRatio: 0.5,
        currentRatio: 2.0,
        quickRatio: 1.5,
        inventoryTurnover: 12,
        receivablesTurnover: 8,
        workingCapital: 300000
      }
    })

    it('should validate correct financial metrics', () => {
      const result = ProfessionalFinancialMetricsSchema.safeParse(validFinancialData)
      expect(result.success).toBe(true)
    })

    it('should reject negative revenue', () => {
      const invalidData = { ...validFinancialData, annualRevenue: -100000 }
      const result = ProfessionalFinancialMetricsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Annual revenue must be 0 or greater')
      }
    })

    it('should reject invalid gross margin', () => {
      const invalidData = { ...validFinancialData, grossMargin: 150 }
      const result = ProfessionalFinancialMetricsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Gross margin must be between 0-100%')
      }
    })

    it('should accept negative cash flow and net profit', () => {
      const validNegativeData = { ...validFinancialData, cashFlow: -50000, netProfit: -25000 }
      const result = ProfessionalFinancialMetricsSchema.safeParse(validNegativeData)
      expect(result.success).toBe(true)
    })

    it('should validate all 15 required fields are present', () => {
      const fieldCount = Object.keys(validFinancialData).length
      expect(fieldCount).toBe(PROFESSIONAL_TIER_FIELD_COUNT.financialMetrics)
    })

    it('should reject missing required fields', () => {
      const { annualRevenue, ...incompleteData } = validFinancialData
      const result = ProfessionalFinancialMetricsSchema.safeParse(incompleteData)
      expect(result.success).toBe(false)
    })
  })

  describe('CustomerAnalyticsSchema', () => {
    let validCustomerData: CustomerAnalytics

    beforeEach(() => {
      validCustomerData = {
        customerAcquisitionCost: 150,
        customerLifetimeValue: 2500,
        churnRate: 5.2,
        netPromoterScore: 45,
        monthlyActiveUsers: 1500,
        conversionRate: 3.5,
        averageOrderValue: 175,
        repeatCustomerRate: 60
      }
    })

    it('should validate correct customer analytics', () => {
      const result = CustomerAnalyticsSchema.safeParse(validCustomerData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid churn rate', () => {
      const invalidData = { ...validCustomerData, churnRate: 150 }
      const result = CustomerAnalyticsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid NPS score', () => {
      const invalidData = { ...validCustomerData, netPromoterScore: 150 }
      const result = CustomerAnalyticsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should validate all 8 required fields are present', () => {
      const fieldCount = Object.keys(validCustomerData).length
      expect(fieldCount).toBe(PROFESSIONAL_TIER_FIELD_COUNT.customerAnalytics)
    })
  })

  describe('OperationalEfficiencySchema', () => {
    let validOperationalData: OperationalEfficiency

    beforeEach(() => {
      validOperationalData = {
        employeeProductivity: 75000,
        operatingExpenseRatio: 60,
        capacityUtilization: 85,
        inventoryDaysOnHand: 45,
        paymentTermsDays: 30,
        vendorPaymentDays: 60,
        cashConversionCycle: 15
      }
    })

    it('should validate correct operational efficiency data', () => {
      const result = OperationalEfficiencySchema.safeParse(validOperationalData)
      expect(result.success).toBe(true)
    })

    it('should reject negative productivity', () => {
      const invalidData = { ...validOperationalData, employeeProductivity: -1000 }
      const result = OperationalEfficiencySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept negative cash conversion cycle', () => {
      const validNegativeData = { ...validOperationalData, cashConversionCycle: -10 }
      const result = OperationalEfficiencySchema.safeParse(validNegativeData)
      expect(result.success).toBe(true)
    })

    it('should validate all 7 required fields are present', () => {
      const fieldCount = Object.keys(validOperationalData).length
      expect(fieldCount).toBe(PROFESSIONAL_TIER_FIELD_COUNT.operationalEfficiency)
    })
  })

  describe('MarketIntelligenceSchema', () => {
    let validMarketData: MarketIntelligence

    beforeEach(() => {
      validMarketData = {
        marketShare: 15.5,
        marketGrowthRate: 8.2,
        competitorAnalysis: [{
          name: 'Competitor A',
          marketShare: 25,
          strengths: ['Strong brand', 'Wide distribution'],
          weaknesses: ['High prices', 'Poor customer service']
        }],
        marketTrends: ['Digital transformation', 'Sustainability focus'],
        threatLevel: 'medium',
        opportunityScore: 75
      }
    })

    it('should validate correct market intelligence data', () => {
      const result = MarketIntelligenceSchema.safeParse(validMarketData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid threat level', () => {
      const invalidData = { ...validMarketData, threatLevel: 'extreme' as any }
      const result = MarketIntelligenceSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should require at least one competitor', () => {
      const invalidData = { ...validMarketData, competitorAnalysis: [] }
      const result = MarketIntelligenceSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should require competitor strengths and weaknesses', () => {
      const invalidData = {
        ...validMarketData,
        competitorAnalysis: [{
          name: 'Competitor A',
          marketShare: 25,
          strengths: [],
          weaknesses: ['High prices']
        }]
      }
      const result = MarketIntelligenceSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('FinancialPlanningSchema', () => {
    let validPlanningData: FinancialPlanning

    beforeEach(() => {
      validPlanningData = {
        revenueForecast12Month: [100000, 105000, 110000, 115000, 120000, 125000, 130000, 135000, 140000, 145000, 150000, 155000],
        expenseForecast12Month: [80000, 82000, 84000, 86000, 88000, 90000, 92000, 94000, 96000, 98000, 100000, 102000],
        cashFlowForecast12Month: [20000, 23000, 26000, 29000, 32000, 35000, 38000, 41000, 44000, 47000, 50000, 53000],
        scenarioAnalysis: {
          optimistic: { revenue: 2000000, expenses: 1400000 },
          realistic: { revenue: 1600000, expenses: 1200000 },
          pessimistic: { revenue: 1200000, expenses: 1100000 }
        },
        budgetVariance: -5.2
      }
    })

    it('should validate correct financial planning data', () => {
      const result = FinancialPlanningSchema.safeParse(validPlanningData)
      expect(result.success).toBe(true)
    })

    it('should require exactly 12 months for revenue forecast', () => {
      const invalidData = { ...validPlanningData, revenueForecast12Month: [100000, 105000] }
      const result = FinancialPlanningSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject negative values in forecasts', () => {
      const invalidData = {
        ...validPlanningData,
        expenseForecast12Month: [-80000, 82000, 84000, 86000, 88000, 90000, 92000, 94000, 96000, 98000, 100000, 102000]
      }
      const result = FinancialPlanningSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject extreme budget variance', () => {
      const invalidData = { ...validPlanningData, budgetVariance: 150 }
      const result = FinancialPlanningSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('ComplianceSchema', () => {
    let validComplianceData: Compliance

    beforeEach(() => {
      validComplianceData = {
        regulatoryCompliance: [{
          regulation: 'SOX',
          status: 'compliant',
          lastAuditDate: new Date('2023-01-15'),
          nextAuditDate: new Date('2024-01-15')
        }],
        riskAssessment: {
          financialRisk: 'medium',
          operationalRisk: 'low',
          marketRisk: 'high',
          overallRiskScore: 65
        },
        insuranceCoverage: [{
          type: 'General Liability',
          coverage: 1000000,
          premium: 5000,
          expires: new Date('2024-12-31')
        }],
        auditTrail: [{
          date: new Date('2023-06-01'),
          action: 'Risk assessment updated',
          user: 'admin@company.com',
          details: 'Updated market risk from medium to high'
        }]
      }
    })

    it('should validate correct compliance data', () => {
      const result = ComplianceSchema.safeParse(validComplianceData)
      expect(result.success).toBe(true)
    })

    it('should require at least one regulatory compliance entry', () => {
      const invalidData = { ...validComplianceData, regulatoryCompliance: [] }
      const result = ComplianceSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid risk levels', () => {
      const invalidData = {
        ...validComplianceData,
        riskAssessment: {
          ...validComplianceData.riskAssessment,
          financialRisk: 'extreme' as any
        }
      }
      const result = ComplianceSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid overall risk score', () => {
      const invalidData = {
        ...validComplianceData,
        riskAssessment: {
          ...validComplianceData.riskAssessment,
          overallRiskScore: 150
        }
      }
      const result = ComplianceSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('ProfessionalTierDataSchema', () => {
    let validProfessionalData: ProfessionalTierData

    beforeEach(() => {
      validProfessionalData = {
        financialMetrics: {
          annualRevenue: 1000000,
          monthlyRecurring: 83333,
          expenses: 750000,
          cashFlow: 250000,
          grossMargin: 25,
          netProfit: 150000,
          ebitda: 200000,
          burnRate: 50000,
          runwayMonths: 18,
          debtToEquityRatio: 0.5,
          currentRatio: 2.0,
          quickRatio: 1.5,
          inventoryTurnover: 12,
          receivablesTurnover: 8,
          workingCapital: 300000
        },
        customerAnalytics: {
          customerAcquisitionCost: 150,
          customerLifetimeValue: 2500,
          churnRate: 5.2,
          netPromoterScore: 45,
          monthlyActiveUsers: 1500,
          conversionRate: 3.5,
          averageOrderValue: 175,
          repeatCustomerRate: 60
        },
        operationalEfficiency: {
          employeeProductivity: 75000,
          operatingExpenseRatio: 60,
          capacityUtilization: 85,
          inventoryDaysOnHand: 45,
          paymentTermsDays: 30,
          vendorPaymentDays: 60,
          cashConversionCycle: 15
        },
        marketIntelligence: {
          marketShare: 15.5,
          marketGrowthRate: 8.2,
          competitorAnalysis: [{
            name: 'Competitor A',
            marketShare: 25,
            strengths: ['Strong brand'],
            weaknesses: ['High prices']
          }],
          marketTrends: ['Digital transformation'],
          threatLevel: 'medium',
          opportunityScore: 75
        },
        financialPlanning: {
          revenueForecast12Month: [100000, 105000, 110000, 115000, 120000, 125000, 130000, 135000, 140000, 145000, 150000, 155000],
          expenseForecast12Month: [80000, 82000, 84000, 86000, 88000, 90000, 92000, 94000, 96000, 98000, 100000, 102000],
          cashFlowForecast12Month: [20000, 23000, 26000, 29000, 32000, 35000, 38000, 41000, 44000, 47000, 50000, 53000],
          scenarioAnalysis: {
            optimistic: { revenue: 2000000, expenses: 1400000 },
            realistic: { revenue: 1600000, expenses: 1200000 },
            pessimistic: { revenue: 1200000, expenses: 1100000 }
          },
          budgetVariance: -5.2
        },
        compliance: {
          regulatoryCompliance: [{
            regulation: 'SOX',
            status: 'compliant',
            lastAuditDate: new Date('2023-01-15'),
            nextAuditDate: new Date('2024-01-15')
          }],
          riskAssessment: {
            financialRisk: 'medium',
            operationalRisk: 'low',
            marketRisk: 'high',
            overallRiskScore: 65
          },
          insuranceCoverage: [{
            type: 'General Liability',
            coverage: 1000000,
            premium: 5000,
            expires: new Date('2024-12-31')
          }],
          auditTrail: [{
            date: new Date('2023-06-01'),
            action: 'Risk assessment updated',
            user: 'admin@company.com',
            details: 'Updated market risk from medium to high'
          }]
        }
      }
    })

    it('should validate complete professional tier data', () => {
      const result = ProfessionalTierDataSchema.safeParse(validProfessionalData)
      expect(result.success).toBe(true)
    })

    it('should validate field completeness', () => {
      const completenessResult = validateProfessionalFieldCompleteness(validProfessionalData)
      expect(completenessResult.isValid).toBe(true)
      expect(completenessResult.meetsMinimumRequirement).toBe(true)
      expect(completenessResult.fieldCount).toBeGreaterThanOrEqual(PROFESSIONAL_TIER_FIELD_COUNT.total)
    })

    it('should reject incomplete data', () => {
      const { financialMetrics, ...incompleteData } = validProfessionalData
      const result = ProfessionalTierDataSchema.safeParse(incompleteData)
      expect(result.success).toBe(false)
    })
  })

  describe('Validation Helper Functions', () => {
    it('should provide correct validation functions', () => {
      const validFinancialData = {
        annualRevenue: 1000000,
        monthlyRecurring: 83333,
        expenses: 750000,
        cashFlow: 250000,
        grossMargin: 25,
        netProfit: 150000,
        ebitda: 200000,
        burnRate: 50000,
        runwayMonths: 18,
        debtToEquityRatio: 0.5,
        currentRatio: 2.0,
        quickRatio: 1.5,
        inventoryTurnover: 12,
        receivablesTurnover: 8,
        workingCapital: 300000
      }

      const result = validateProfessionalFinancialMetrics(validFinancialData)
      expect(result.success).toBe(true)
    })

    it('should handle validation errors gracefully', () => {
      const invalidData = { annualRevenue: -100000 }
      const result = validateProfessionalFinancialMetrics(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Edge Cases and Boundary Values', () => {
    it('should handle zero values correctly', () => {
      const zeroValueData = {
        annualRevenue: 0,
        monthlyRecurring: 0,
        expenses: 0,
        cashFlow: 0,
        grossMargin: 0,
        netProfit: 0,
        ebitda: 0,
        burnRate: 0,
        runwayMonths: 0,
        debtToEquityRatio: 0,
        currentRatio: 0,
        quickRatio: 0,
        inventoryTurnover: 0,
        receivablesTurnover: 0,
        workingCapital: 0
      }

      const result = ProfessionalFinancialMetricsSchema.safeParse(zeroValueData)
      expect(result.success).toBe(true)
    })

    it('should handle maximum valid percentage values', () => {
      const maxPercentageData = {
        customerAcquisitionCost: 150,
        customerLifetimeValue: 2500,
        churnRate: 100,
        netPromoterScore: 100,
        monthlyActiveUsers: 1500,
        conversionRate: 100,
        averageOrderValue: 175,
        repeatCustomerRate: 100
      }

      const result = CustomerAnalyticsSchema.safeParse(maxPercentageData)
      expect(result.success).toBe(true)
    })

    it('should handle minimum valid NPS values', () => {
      const minNPSData = {
        customerAcquisitionCost: 150,
        customerLifetimeValue: 2500,
        churnRate: 5.2,
        netPromoterScore: -100,
        monthlyActiveUsers: 1500,
        conversionRate: 3.5,
        averageOrderValue: 175,
        repeatCustomerRate: 60
      }

      const result = CustomerAnalyticsSchema.safeParse(minNPSData)
      expect(result.success).toBe(true)
    })

    it('should handle large financial values', () => {
      const largeValueData = {
        annualRevenue: 999999999999,
        monthlyRecurring: 83333333333,
        expenses: 750000000000,
        cashFlow: 250000000000,
        grossMargin: 25,
        netProfit: 150000000000,
        ebitda: 200000000000,
        burnRate: 50000000000,
        runwayMonths: 999,
        debtToEquityRatio: 999.99,
        currentRatio: 999.99,
        quickRatio: 999.99,
        inventoryTurnover: 999,
        receivablesTurnover: 999,
        workingCapital: 999999999999
      }

      const result = ProfessionalFinancialMetricsSchema.safeParse(largeValueData)
      expect(result.success).toBe(true)
    })
  })
})