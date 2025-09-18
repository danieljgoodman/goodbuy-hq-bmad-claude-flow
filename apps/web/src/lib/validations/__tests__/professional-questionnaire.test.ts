import { describe, it, expect } from 'vitest'
import {
  FinancialPerformanceSchema,
  CustomerRiskAnalysisSchema,
  CompetitiveMarketSchema,
  OperationalStrategicSchema,
  ValueEnhancementSchema,
  ProfessionalQuestionnaireSchema,
  CompleteProfessionalBusinessDataSchema,
  validateFinancialPerformanceSection,
  validateCustomerRiskAnalysisSection,
  validateCompetitiveMarketSection,
  validateOperationalStrategicSection,
  validateValueEnhancementSection,
  validateCompleteProfessionalQuestionnaire,
  PROFESSIONAL_QUESTIONNAIRE_FIELD_COUNTS
} from '../professional-questionnaire'

describe('Professional Questionnaire Schema Validation', () => {
  // Test data fixtures
  const validFinancialData = {
    revenueYear1: 1000000,
    revenueYear2: 1200000,
    revenueYear3: 1500000,
    profitYear1: 100000,
    profitYear2: 150000,
    profitYear3: 200000,
    cashFlowYear1: 120000,
    cashFlowYear2: 180000,
    cashFlowYear3: 250000,
    ebitdaMargin: 15.5,
    returnOnEquity: 12.3,
    returnOnAssets: 8.7,
    totalDebt: 500000,
    workingCapitalRatio: 1.8
  }

  const validCustomerRiskData = {
    largestCustomerRevenue: 300000,
    top5CustomerRevenue: 750000,
    customerConcentrationRisk: 'medium' as const,
    averageCustomerTenure: 24,
    customerRetentionRate: 85,
    customerSatisfactionScore: 8.2,
    averageContractLength: 12,
    contractRenewalRate: 78,
    recurringRevenuePercentage: 65,
    seasonalityImpact: 'low' as const
  }

  const validCompetitiveMarketData = {
    marketSharePercentage: 15,
    primaryCompetitors: ['CompetitorA', 'CompetitorB', 'CompetitorC'],
    competitiveAdvantageStrength: 'strong' as const,
    marketGrowthRateAnnual: 8.5,
    scalabilityRating: 'high' as const,
    barrierToEntryLevel: 'medium' as const,
    competitiveThreats: ['New technology', 'Market consolidation'],
    technologyAdvantage: 'leading' as const,
    intellectualPropertyValue: 'moderate' as const
  }

  const validOperationalStrategicData = {
    ownerTimeCommitment: 45,
    keyPersonRisk: 'medium' as const,
    managementDepthRating: 'adequate' as const,
    supplierConcentrationRisk: 'low' as const,
    operationalComplexity: 'moderate' as const,
    strategicPlanningHorizon: 'medium_term' as const,
    businessModelAdaptability: 'flexible' as const
  }

  const validValueEnhancementData = {
    growthInvestmentCapacity: 200000,
    marketExpansionOpportunities: ['International', 'New product lines'],
    improvementImplementationTimeline: '6_months' as const,
    organizationalChangeCapacity: 'moderate' as const,
    valueCreationPotential: 'high' as const
  }

  describe('FinancialPerformanceSchema', () => {
    it('should validate correct financial performance data', () => {
      const result = FinancialPerformanceSchema.safeParse(validFinancialData)
      expect(result.success).toBe(true)
    })

    it('should reject negative revenue values', () => {
      const invalidData = { ...validFinancialData, revenueYear1: -100000 }
      const result = FinancialPerformanceSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Revenue Year 1 must be 0 or greater')
      }
    })

    it('should reject EBITDA margin outside 0-100% range', () => {
      const invalidData = { ...validFinancialData, ebitdaMargin: 150 }
      const result = FinancialPerformanceSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('EBITDA margin must be between 0-100%')
      }
    })

    it('should validate revenue progression logic', () => {
      const invalidProgressionData = {
        ...validFinancialData,
        revenueYear1: 0,
        revenueYear2: 0,
        revenueYear3: 0
      }
      const result = FinancialPerformanceSchema.safeParse(invalidProgressionData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('realistic revenue progression')
      }
    })

    it('should allow negative profit values (losses)', () => {
      const dataWithLoss = { ...validFinancialData, profitYear1: -50000 }
      const result = FinancialPerformanceSchema.safeParse(dataWithLoss)
      expect(result.success).toBe(true)
    })

    it('should validate all required fields are present', () => {
      const incompleteData = { ...validFinancialData }
      delete incompleteData.totalDebt
      const result = FinancialPerformanceSchema.safeParse(incompleteData)
      expect(result.success).toBe(false)
    })
  })

  describe('CustomerRiskAnalysisSchema', () => {
    it('should validate correct customer risk data', () => {
      const result = CustomerRiskAnalysisSchema.safeParse(validCustomerRiskData)
      expect(result.success).toBe(true)
    })

    it('should enforce top 5 customer revenue >= largest customer revenue', () => {
      const invalidData = {
        ...validCustomerRiskData,
        largestCustomerRevenue: 800000,
        top5CustomerRevenue: 600000
      }
      const result = CustomerRiskAnalysisSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Top 5 customer revenue must be at least as large')
      }
    })

    it('should validate customer retention rate is 0-100%', () => {
      const invalidData = { ...validCustomerRiskData, customerRetentionRate: 150 }
      const result = CustomerRiskAnalysisSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Customer retention rate must be between 0-100%')
      }
    })

    it('should validate customer satisfaction score is 1-10', () => {
      const invalidData = { ...validCustomerRiskData, customerSatisfactionScore: 12 }
      const result = CustomerRiskAnalysisSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Customer satisfaction score must be between 1-10')
      }
    })

    it('should validate recurring revenue percentage is 0-100%', () => {
      const invalidData = { ...validCustomerRiskData, recurringRevenuePercentage: -10 }
      const result = CustomerRiskAnalysisSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should require valid enum values for risk assessments', () => {
      const invalidData = { ...validCustomerRiskData, customerConcentrationRisk: 'invalid' as any }
      const result = CustomerRiskAnalysisSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('CompetitiveMarketSchema', () => {
    it('should validate correct competitive market data', () => {
      const result = CompetitiveMarketSchema.safeParse(validCompetitiveMarketData)
      expect(result.success).toBe(true)
    })

    it('should validate market share is 0-100%', () => {
      const invalidData = { ...validCompetitiveMarketData, marketSharePercentage: 150 }
      const result = CompetitiveMarketSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should require 1-5 primary competitors', () => {
      const invalidData = { ...validCompetitiveMarketData, primaryCompetitors: [] }
      const result = CompetitiveMarketSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('List 1-5 primary competitors')
      }
    })

    it('should reject too many competitors', () => {
      const invalidData = {
        ...validCompetitiveMarketData,
        primaryCompetitors: ['A', 'B', 'C', 'D', 'E', 'F']
      }
      const result = CompetitiveMarketSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should validate competitive threats array limits', () => {
      const invalidData = {
        ...validCompetitiveMarketData,
        competitiveThreats: ['Threat1', 'Threat2', 'Threat3', 'Threat4']
      }
      const result = CompetitiveMarketSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Identify 1-3 key competitive threats')
      }
    })

    it('should validate market growth rate range', () => {
      const invalidData = { ...validCompetitiveMarketData, marketGrowthRateAnnual: 2000 }
      const result = CompetitiveMarketSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Market growth rate must be realistic')
      }
    })
  })

  describe('OperationalStrategicSchema', () => {
    it('should validate correct operational strategic data', () => {
      const result = OperationalStrategicSchema.safeParse(validOperationalStrategicData)
      expect(result.success).toBe(true)
    })

    it('should validate owner time commitment is 0-168 hours/week', () => {
      const invalidData = { ...validOperationalStrategicData, ownerTimeCommitment: 200 }
      const result = OperationalStrategicSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Owner time commitment must be between 0-168 hours')
      }
    })

    it('should require valid enum values for all assessments', () => {
      const invalidData = { ...validOperationalStrategicData, keyPersonRisk: 'invalid' as any }
      const result = OperationalStrategicSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should validate management depth rating enum', () => {
      const validRatings = ['shallow', 'adequate', 'strong', 'exceptional']
      validRatings.forEach(rating => {
        const testData = { ...validOperationalStrategicData, managementDepthRating: rating as any }
        const result = OperationalStrategicSchema.safeParse(testData)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('ValueEnhancementSchema', () => {
    it('should validate correct value enhancement data', () => {
      const result = ValueEnhancementSchema.safeParse(validValueEnhancementData)
      expect(result.success).toBe(true)
    })

    it('should require non-negative growth investment capacity', () => {
      const invalidData = { ...validValueEnhancementData, growthInvestmentCapacity: -50000 }
      const result = ValueEnhancementSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should allow up to 5 market expansion opportunities', () => {
      const maxOpportunities = ['A', 'B', 'C', 'D', 'E']
      const validData = { ...validValueEnhancementData, marketExpansionOpportunities: maxOpportunities }
      const result = ValueEnhancementSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject more than 5 market expansion opportunities', () => {
      const tooManyOpportunities = ['A', 'B', 'C', 'D', 'E', 'F']
      const invalidData = { ...validValueEnhancementData, marketExpansionOpportunities: tooManyOpportunities }
      const result = ValueEnhancementSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should allow empty market expansion opportunities', () => {
      const validData = { ...validValueEnhancementData, marketExpansionOpportunities: [] }
      const result = ValueEnhancementSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('ProfessionalQuestionnaireSchema', () => {
    const validProfessionalData = {
      financialPerformance: validFinancialData,
      customerRiskAnalysis: validCustomerRiskData,
      competitiveMarket: validCompetitiveMarketData,
      operationalStrategic: validOperationalStrategicData,
      valueEnhancement: validValueEnhancementData
    }

    it('should validate complete professional questionnaire', () => {
      const result = ProfessionalQuestionnaireSchema.safeParse(validProfessionalData)
      expect(result.success).toBe(true)
    })

    it('should enforce cross-section validation for consistency', () => {
      const inconsistentData = {
        ...validProfessionalData,
        customerRiskAnalysis: {
          ...validCustomerRiskData,
          customerConcentrationRisk: 'high' as const
        },
        operationalStrategic: {
          ...validOperationalStrategicData,
          ownerTimeCommitment: 10, // Too low for high customer concentration
          keyPersonRisk: 'low' as const
        }
      }
      const result = ProfessionalQuestionnaireSchema.safeParse(inconsistentData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Business dependencies should be consistent')
      }
    })

    it('should allow consistent high-risk scenario', () => {
      const consistentHighRiskData = {
        ...validProfessionalData,
        customerRiskAnalysis: {
          ...validCustomerRiskData,
          customerConcentrationRisk: 'high' as const
        },
        operationalStrategic: {
          ...validOperationalStrategicData,
          ownerTimeCommitment: 50, // Adequate for high customer concentration
          keyPersonRisk: 'high' as const
        }
      }
      const result = ProfessionalQuestionnaireSchema.safeParse(consistentHighRiskData)
      expect(result.success).toBe(true)
    })
  })

  describe('Section Validation Functions', () => {
    it('should return detailed validation results for financial performance', () => {
      const result = validateFinancialPerformanceSection(validFinancialData)
      expect(result.success).toBe(true)
      expect(result.sectionName).toBe('Financial Performance')
      expect(result.fieldCount).toBe(13)
      expect(result.totalFields).toBe(13)
    })

    it('should return validation errors with section context', () => {
      const invalidData = { ...validFinancialData, ebitdaMargin: 150 }
      const result = validateFinancialPerformanceSection(invalidData)
      expect(result.success).toBe(false)
      expect(result.sectionName).toBe('Financial Performance')
    })

    it('should validate customer risk analysis section', () => {
      const result = validateCustomerRiskAnalysisSection(validCustomerRiskData)
      expect(result.success).toBe(true)
      expect(result.sectionName).toBe('Customer & Risk Analysis')
      expect(result.totalFields).toBe(10)
    })

    it('should validate competitive market section', () => {
      const result = validateCompetitiveMarketSection(validCompetitiveMarketData)
      expect(result.success).toBe(true)
      expect(result.sectionName).toBe('Competitive & Market Position')
      expect(result.totalFields).toBe(9)
    })

    it('should validate operational strategic section', () => {
      const result = validateOperationalStrategicSection(validOperationalStrategicData)
      expect(result.success).toBe(true)
      expect(result.sectionName).toBe('Operational & Strategic')
      expect(result.totalFields).toBe(7)
    })

    it('should validate value enhancement section', () => {
      const result = validateValueEnhancementSection(validValueEnhancementData)
      expect(result.success).toBe(true)
      expect(result.sectionName).toBe('Value Enhancement')
      expect(result.totalFields).toBe(5)
    })
  })

  describe('Complete Professional Questionnaire Validation', () => {
    const validCompleteData = {
      financialPerformance: validFinancialData,
      customerRiskAnalysis: validCustomerRiskData,
      competitiveMarket: validCompetitiveMarketData,
      operationalStrategic: validOperationalStrategicData,
      valueEnhancement: validValueEnhancementData
    }

    it('should validate complete questionnaire with metrics', () => {
      const result = validateCompleteProfessionalQuestionnaire(validCompleteData)
      expect(result.success).toBe(true)
      expect(result.totalProfessionalFields).toBe(44)
      expect(result.totalRequiredFields).toBe(30)
      expect(result.meetsRequirement).toBe(true)
    })

    it('should track field completion correctly', () => {
      expect(PROFESSIONAL_QUESTIONNAIRE_FIELD_COUNTS.financialPerformance).toBe(13)
      expect(PROFESSIONAL_QUESTIONNAIRE_FIELD_COUNTS.customerRiskAnalysis).toBe(10)
      expect(PROFESSIONAL_QUESTIONNAIRE_FIELD_COUNTS.competitiveMarket).toBe(9)
      expect(PROFESSIONAL_QUESTIONNAIRE_FIELD_COUNTS.operationalStrategic).toBe(7)
      expect(PROFESSIONAL_QUESTIONNAIRE_FIELD_COUNTS.valueEnhancement).toBe(5)
      expect(PROFESSIONAL_QUESTIONNAIRE_FIELD_COUNTS.total).toBe(44)
      expect(PROFESSIONAL_QUESTIONNAIRE_FIELD_COUNTS.minimumRequired).toBe(30)
    })
  })

  describe('CompleteProfessionalBusinessDataSchema', () => {
    const completeBusinessData = {
      // Basic tier fields
      businessType: 'SaaS',
      industryFocus: 'Technology',
      yearsInBusiness: 5,
      businessModel: 'Subscription',
      revenueModel: 'Recurring',
      annualRevenue: 1500000,
      monthlyRecurring: 125000,
      expenses: 1200000,
      cashFlow: 300000,
      grossMargin: 75,
      customerCount: 1000,
      employeeCount: 50,
      marketPosition: 'Growing',
      competitiveAdvantages: ['Technology', 'Customer Service'],
      primaryChannels: ['Online', 'Direct Sales'],
      assets: 800000,
      liabilities: 200000,
      // Professional tier enhancement
      professionalQuestionnaire: {
        financialPerformance: validFinancialData,
        customerRiskAnalysis: validCustomerRiskData,
        competitiveMarket: validCompetitiveMarketData,
        operationalStrategic: validOperationalStrategicData,
        valueEnhancement: validValueEnhancementData
      }
    }

    it('should validate complete professional business data', () => {
      const result = CompleteProfessionalBusinessDataSchema.safeParse(completeBusinessData)
      expect(result.success).toBe(true)
    })

    it('should require all basic tier fields', () => {
      const incompleteData = { ...completeBusinessData }
      delete incompleteData.businessType
      const result = CompleteProfessionalBusinessDataSchema.safeParse(incompleteData)
      expect(result.success).toBe(false)
    })

    it('should require professional questionnaire', () => {
      const incompleteData = { ...completeBusinessData }
      delete incompleteData.professionalQuestionnaire
      const result = CompleteProfessionalBusinessDataSchema.safeParse(incompleteData)
      expect(result.success).toBe(false)
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should handle large datasets efficiently', () => {
      const startTime = performance.now()
      for (let i = 0; i < 1000; i++) {
        ProfessionalQuestionnaireSchema.safeParse({
          financialPerformance: validFinancialData,
          customerRiskAnalysis: validCustomerRiskData,
          competitiveMarket: validCompetitiveMarketData,
          operationalStrategic: validOperationalStrategicData,
          valueEnhancement: validValueEnhancementData
        })
      }
      const endTime = performance.now()
      const duration = endTime - startTime

      // Should complete 1000 validations in under 1 second
      expect(duration).toBeLessThan(1000)
    })

    it('should handle malformed data gracefully', () => {
      const malformedData = {
        financialPerformance: null,
        customerRiskAnalysis: undefined,
        competitiveMarket: 'invalid',
        operationalStrategic: 123,
        valueEnhancement: []
      }

      expect(() => {
        ProfessionalQuestionnaireSchema.safeParse(malformedData)
      }).not.toThrow()
    })

    it('should validate with minimal required data', () => {
      const minimalData = {
        financialPerformance: {
          revenueYear1: 100000,
          revenueYear2: 120000,
          revenueYear3: 150000,
          profitYear1: 10000,
          profitYear2: 15000,
          profitYear3: 20000,
          cashFlowYear1: 12000,
          cashFlowYear2: 18000,
          cashFlowYear3: 25000,
          ebitdaMargin: 10,
          returnOnEquity: 8,
          returnOnAssets: 5,
          totalDebt: 50000,
          workingCapitalRatio: 1.2
        },
        customerRiskAnalysis: {
          largestCustomerRevenue: 30000,
          top5CustomerRevenue: 60000,
          customerConcentrationRisk: 'low' as const,
          averageCustomerTenure: 12,
          customerRetentionRate: 80,
          customerSatisfactionScore: 7,
          averageContractLength: 6,
          contractRenewalRate: 70,
          recurringRevenuePercentage: 50,
          seasonalityImpact: 'medium' as const
        },
        competitiveMarket: {
          marketSharePercentage: 5,
          primaryCompetitors: ['Competitor1'],
          competitiveAdvantageStrength: 'moderate' as const,
          marketGrowthRateAnnual: 5,
          scalabilityRating: 'moderate' as const,
          barrierToEntryLevel: 'low' as const,
          competitiveThreats: ['New entrants'],
          technologyAdvantage: 'parity' as const,
          intellectualPropertyValue: 'limited' as const
        },
        operationalStrategic: {
          ownerTimeCommitment: 40,
          keyPersonRisk: 'medium' as const,
          managementDepthRating: 'adequate' as const,
          supplierConcentrationRisk: 'medium' as const,
          operationalComplexity: 'simple' as const,
          strategicPlanningHorizon: 'short_term' as const,
          businessModelAdaptability: 'limited' as const
        },
        valueEnhancement: {
          growthInvestmentCapacity: 50000,
          marketExpansionOpportunities: [],
          improvementImplementationTimeline: '3_months' as const,
          organizationalChangeCapacity: 'limited' as const,
          valueCreationPotential: 'moderate' as const
        }
      }

      const result = ProfessionalQuestionnaireSchema.safeParse(minimalData)
      expect(result.success).toBe(true)
    })
  })
})