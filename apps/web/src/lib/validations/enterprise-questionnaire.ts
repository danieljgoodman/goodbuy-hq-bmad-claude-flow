/**
 * Enterprise Questionnaire Validation Utilities
 * Comprehensive validation for all 10 sections (5 Professional + 5 Enterprise)
 */

import { z } from 'zod'
import {
  EnterpriseTierData,
  StrategicValueDriversSchema,
  OperationalScalabilitySchema,
  FinancialOptimizationSchema,
  StrategicScenarioPlanningSchema,
  MultiYearProjectionsSchema,
  validateEnterpriseTierData
} from './enterprise-tier'
import {
  ProfessionalQuestionnaire,
  FinancialPerformanceSchema,
  CustomerRiskAnalysisSchema,
  CompetitiveMarketSchema,
  OperationalStrategicSchema,
  ValueEnhancementSchema,
  validateCompleteProfessionalQuestionnaire
} from './professional-questionnaire'

/**
 * Complete Enterprise Questionnaire Schema
 * Combines all Professional (5) + Enterprise (5) sections
 */
export const CompleteEnterpriseQuestionnaireSchema = z.object({
  // Professional Tier Sections (1-5)
  professionalData: z.object({
    financialPerformance: FinancialPerformanceSchema,
    customerRiskAnalysis: CustomerRiskAnalysisSchema,
    competitiveMarket: CompetitiveMarketSchema,
    operationalStrategic: OperationalStrategicSchema,
    valueEnhancement: ValueEnhancementSchema
  }),

  // Enterprise Tier Sections (6-10)
  enterpriseData: z.object({
    strategicValueDrivers: StrategicValueDriversSchema,
    operationalScalability: OperationalScalabilitySchema,
    financialOptimization: FinancialOptimizationSchema,
    strategicScenarioPlanning: StrategicScenarioPlanningSchema,
    multiYearProjections: MultiYearProjectionsSchema
  }),

  // Metadata
  metadata: z.object({
    completedAt: z.date(),
    timeSpent: z.number().min(0),
    sectionsCompleted: z.array(z.string()).length(10),
    professionalDataImported: z.boolean(),
    validationPassed: z.boolean(),
    userId: z.string().optional(),
    businessEvaluationId: z.string()
  }).optional()
})

/**
 * Partial Enterprise Questionnaire Schema for progressive validation
 */
export const PartialEnterpriseQuestionnaireSchema = CompleteEnterpriseQuestionnaireSchema.partial({
  professionalData: true,
  enterpriseData: true
})

/**
 * Section-specific validation functions
 */

// Professional Section Validators
export const validateFinancialPerformanceSection = (data: unknown) => {
  const result = FinancialPerformanceSchema.safeParse(data)
  return {
    ...result,
    sectionId: 'financial-performance',
    sectionName: 'Financial Performance',
    tier: 'professional' as const,
    fieldCount: result.success ? Object.keys(result.data).length : 0,
    totalFields: 13,
    completionPercentage: result.success ? 100 : 0
  }
}

export const validateCustomerRiskSection = (data: unknown) => {
  const result = CustomerRiskAnalysisSchema.safeParse(data)
  return {
    ...result,
    sectionId: 'customer-risk',
    sectionName: 'Customer & Risk Analysis',
    tier: 'professional' as const,
    fieldCount: result.success ? Object.keys(result.data).length : 0,
    totalFields: 10,
    completionPercentage: result.success ? 100 : 0
  }
}

export const validateCompetitiveMarketSection = (data: unknown) => {
  const result = CompetitiveMarketSchema.safeParse(data)
  return {
    ...result,
    sectionId: 'competitive-market',
    sectionName: 'Competitive & Market Position',
    tier: 'professional' as const,
    fieldCount: result.success ? Object.keys(result.data).length : 0,
    totalFields: 9,
    completionPercentage: result.success ? 100 : 0
  }
}

export const validateOperationalStrategicSection = (data: unknown) => {
  const result = OperationalStrategicSchema.safeParse(data)
  return {
    ...result,
    sectionId: 'operational-strategic',
    sectionName: 'Operational & Strategic',
    tier: 'professional' as const,
    fieldCount: result.success ? Object.keys(result.data).length : 0,
    totalFields: 7,
    completionPercentage: result.success ? 100 : 0
  }
}

export const validateValueEnhancementSection = (data: unknown) => {
  const result = ValueEnhancementSchema.safeParse(data)
  return {
    ...result,
    sectionId: 'value-enhancement',
    sectionName: 'Value Enhancement',
    tier: 'professional' as const,
    fieldCount: result.success ? Object.keys(result.data).length : 0,
    totalFields: 5,
    completionPercentage: result.success ? 100 : 0
  }
}

// Enterprise Section Validators
export const validateStrategicValueDriversSection = (data: unknown) => {
  const result = StrategicValueDriversSchema.safeParse(data)
  return {
    ...result,
    sectionId: 'strategic-value-drivers',
    sectionName: 'Strategic Value Drivers',
    tier: 'enterprise' as const,
    fieldCount: result.success ? Object.keys(result.data).length : 0,
    totalFields: 15,
    completionPercentage: result.success ? 100 : 0
  }
}

export const validateOperationalScalabilitySection = (data: unknown) => {
  const result = OperationalScalabilitySchema.safeParse(data)
  return {
    ...result,
    sectionId: 'operational-scalability',
    sectionName: 'Operational Scalability',
    tier: 'enterprise' as const,
    fieldCount: result.success ? Object.keys(result.data).length : 0,
    totalFields: 12,
    completionPercentage: result.success ? 100 : 0
  }
}

export const validateFinancialOptimizationSection = (data: unknown) => {
  const result = FinancialOptimizationSchema.safeParse(data)
  return {
    ...result,
    sectionId: 'financial-optimization',
    sectionName: 'Financial Optimization',
    tier: 'enterprise' as const,
    fieldCount: result.success ? Object.keys(result.data).length : 0,
    totalFields: 16,
    completionPercentage: result.success ? 100 : 0
  }
}

export const validateStrategicScenarioPlanningSection = (data: unknown) => {
  const result = StrategicScenarioPlanningSchema.safeParse(data)
  return {
    ...result,
    sectionId: 'strategic-scenario-planning',
    sectionName: 'Strategic Scenario Planning',
    tier: 'enterprise' as const,
    fieldCount: result.success ? Object.keys(result.data).length : 0,
    totalFields: 18,
    completionPercentage: result.success ? 100 : 0
  }
}

export const validateMultiYearProjectionsSection = (data: unknown) => {
  const result = MultiYearProjectionsSchema.safeParse(data)
  return {
    ...result,
    sectionId: 'multi-year-projections',
    sectionName: 'Multi-Year Projections',
    tier: 'enterprise' as const,
    fieldCount: result.success ? Object.keys(result.data).length : 0,
    totalFields: 20,
    completionPercentage: result.success ? 100 : 0
  }
}

/**
 * Section validation registry
 */
export const SECTION_VALIDATORS = {
  'financial-performance': validateFinancialPerformanceSection,
  'customer-risk': validateCustomerRiskSection,
  'competitive-market': validateCompetitiveMarketSection,
  'operational-strategic': validateOperationalStrategicSection,
  'value-enhancement': validateValueEnhancementSection,
  'strategic-value-drivers': validateStrategicValueDriversSection,
  'operational-scalability': validateOperationalScalabilitySection,
  'financial-optimization': validateFinancialOptimizationSection,
  'strategic-scenario-planning': validateStrategicScenarioPlanningSection,
  'multi-year-projections': validateMultiYearProjectionsSection
} as const

/**
 * Cross-section validation rules specific to Enterprise tier
 */
export const validateCrossSectionConsistency = (data: z.infer<typeof CompleteEnterpriseQuestionnaireSchema>) => {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    const { professionalData, enterpriseData } = data

    // Financial consistency checks
    if (professionalData?.financialPerformance && enterpriseData?.financialOptimization) {
      const profRevenue = professionalData.financialPerformance.revenueYear3
      const entWorkingCapital = enterpriseData.financialOptimization.workingCapitalPercentage

      // Working capital should align with business size
      if (profRevenue > 10000000 && entWorkingCapital > 25) {
        warnings.push('Large businesses typically have lower working capital percentages')
      }

      // Owner compensation should be reasonable
      const ownerComp = enterpriseData.financialOptimization.ownerCompensation
      const marketComp = enterpriseData.financialOptimization.marketRateCompensation
      if (ownerComp > marketComp * 3) {
        warnings.push('Owner compensation significantly exceeds market rates')
      }
    }

    // Strategic consistency checks
    if (professionalData?.competitiveMarket && enterpriseData?.strategicValueDrivers) {
      const marketPosition = professionalData.competitiveMarket.marketSharePercentage
      const brandInvestment = enterpriseData.strategicValueDrivers.brandDevelopmentInvestment

      // Market leaders should have significant brand investment
      if (marketPosition > 25 && brandInvestment < 100000) {
        warnings.push('Market leaders typically have substantial brand development investments')
      }
    }

    // Operational consistency checks
    if (professionalData?.operationalStrategic && enterpriseData?.operationalScalability) {
      const keyPersonRisk = professionalData.operationalStrategic.keyPersonRisk
      const processDoc = enterpriseData.operationalScalability.processDocumentationPercentage

      // High key person risk should align with low process documentation
      if (keyPersonRisk === 'high' && processDoc > 80) {
        errors.push('High key person risk inconsistent with high process documentation')
      }

      if (keyPersonRisk === 'low' && processDoc < 50) {
        warnings.push('Low key person risk typically correlates with higher process documentation')
      }
    }

    // Growth and scalability consistency
    if (professionalData?.valueEnhancement && enterpriseData?.strategicScenarioPlanning) {
      const growthCapacity = professionalData.valueEnhancement.organizationalChangeCapacity
      const growthRate = enterpriseData.strategicScenarioPlanning.realisticGrowthRate

      // Organizational capacity should support growth plans
      if (growthCapacity === 'limited' && growthRate > 25) {
        errors.push('Limited organizational change capacity cannot support aggressive growth plans')
      }

      if (growthCapacity === 'exceptional' && growthRate < 10) {
        warnings.push('Exceptional change capacity suggests higher growth potential')
      }
    }

    // Investment and scenario consistency
    if (enterpriseData?.strategicScenarioPlanning && enterpriseData?.multiYearProjections) {
      const conservativeScenario = enterpriseData.strategicScenarioPlanning.conservativeScenario
      const aggressiveScenario = enterpriseData.strategicScenarioPlanning.aggressiveScenario
      const baseCase = enterpriseData.multiYearProjections.baseCase

      // Conservative scenario should align with base case projections
      if (conservativeScenario.revenueImpactPercentage > 20 && baseCase[4]?.revenue) {
        const year5Growth = ((baseCase[4].revenue - baseCase[0].revenue) / baseCase[0].revenue) * 100
        if (Math.abs(year5Growth - conservativeScenario.revenueImpactPercentage) > 10) {
          warnings.push('Conservative scenario projections should align with base case financial projections')
        }
      }

      // Aggressive scenario should exceed conservative
      if (aggressiveScenario.revenueImpactPercentage <= conservativeScenario.revenueImpactPercentage) {
        errors.push('Aggressive scenario should exceed conservative scenario returns')
      }
    }

    // Exit strategy and readiness consistency
    if (enterpriseData?.strategicScenarioPlanning) {
      const exitTimeline = enterpriseData.strategicScenarioPlanning.preferredExitTimeline
      const transactionReadiness = enterpriseData.strategicScenarioPlanning.transactionReadiness
      const advisorsEngaged = enterpriseData.strategicScenarioPlanning.advisorsEngaged

      // Short exit timeline should align with high readiness
      if (exitTimeline === 'one2years' && transactionReadiness === 'significant') {
        errors.push('Short exit timeline inconsistent with significant preparation needs')
      }

      // Ready businesses should have advisors
      if (transactionReadiness === 'ready' && advisorsEngaged.includes('none')) {
        warnings.push('Transaction-ready businesses typically have advisors engaged')
      }
    }

    // IP and competitive advantage consistency
    if (professionalData?.competitiveMarket && enterpriseData?.strategicValueDrivers) {
      const ipValue = professionalData.competitiveMarket.intellectualPropertyValue
      const patents = enterpriseData.strategicValueDrivers.patents
      const trademarks = enterpriseData.strategicValueDrivers.trademarks

      // IP value should align with IP portfolio
      if (ipValue === 'significant' && patents === 0 && trademarks === 0) {
        errors.push('Significant IP value should be supported by actual IP portfolio')
      }

      if (ipValue === 'none' && (patents > 0 || trademarks > 0)) {
        warnings.push('IP portfolio suggests value beyond "none" assessment')
      }
    }

  } catch (error) {
    console.error('Cross-section validation error:', error)
    errors.push('Cross-section validation failed due to data structure issues')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasWarnings: warnings.length > 0
  }
}

/**
 * Complete Enterprise questionnaire validation
 */
export const validateCompleteEnterpriseQuestionnaire = (data: unknown) => {
  // First, validate the overall structure
  const structuralResult = CompleteEnterpriseQuestionnaireSchema.safeParse(data)

  if (!structuralResult.success) {
    return {
      isValid: false,
      errors: structuralResult.error.issues.map(issue =>
        `${issue.path.join('.')}: ${issue.message}`
      ),
      warnings: [],
      sectionResults: {},
      crossSectionResult: { isValid: false, errors: [], warnings: [] },
      summary: {
        totalSections: 10,
        completedSections: 0,
        totalFields: 125, // Sum of all field counts
        completedFields: 0,
        professionalSections: 0,
        enterpriseSections: 0,
        overallCompletion: 0
      }
    }
  }

  const validData = structuralResult.data

  // Validate each section individually
  const sectionResults: Record<string, any> = {}
  const sectionIds = Object.keys(SECTION_VALIDATORS) as Array<keyof typeof SECTION_VALIDATORS>

  for (const sectionId of sectionIds) {
    const validator = SECTION_VALIDATORS[sectionId]
    const sectionData = sectionId.startsWith('financial-') ||
                       sectionId.startsWith('customer-') ||
                       sectionId.startsWith('competitive-') ||
                       sectionId.startsWith('operational-') ||
                       sectionId.startsWith('value-')
      ? validData.professionalData?.[sectionId.replace('-', '') as keyof typeof validData.professionalData]
      : validData.enterpriseData?.[sectionId.replace('-', '') as keyof typeof validData.enterpriseData]

    sectionResults[sectionId] = validator(sectionData)
  }

  // Perform cross-section validation
  const crossSectionResult = validateCrossSectionConsistency(validData)

  // Calculate summary statistics
  const completedSections = Object.values(sectionResults).filter(r => r.success).length
  const completedFields = Object.values(sectionResults).reduce((acc: number, r: any) => acc + r.fieldCount, 0)
  const professionalSections = Object.values(sectionResults).filter((r: any) => r.tier === 'professional' && r.success).length
  const enterpriseSections = Object.values(sectionResults).filter((r: any) => r.tier === 'enterprise' && r.success).length

  // Compile all errors and warnings
  const allErrors = [
    ...Object.values(sectionResults).flatMap((r: any) => r.success ? [] : r.error?.issues?.map((i: any) => `${r.sectionName}: ${i.message}`) || []),
    ...crossSectionResult.errors
  ]

  const allWarnings = [
    ...crossSectionResult.warnings
  ]

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    sectionResults,
    crossSectionResult,
    summary: {
      totalSections: 10,
      completedSections,
      totalFields: 125,
      completedFields,
      professionalSections,
      enterpriseSections,
      overallCompletion: Math.round((completedSections / 10) * 100)
    }
  }
}

/**
 * Real-time section validation helper
 */
export const validateSectionInRealTime = (sectionId: string, data: unknown) => {
  const validator = SECTION_VALIDATORS[sectionId as keyof typeof SECTION_VALIDATORS]
  if (!validator) {
    return {
      isValid: false,
      errors: [`Unknown section: ${sectionId}`],
      warnings: []
    }
  }

  const result = validator(data)
  return {
    isValid: result.success,
    errors: result.success ? [] : result.error?.issues?.map((i: any) => i.message) || [],
    warnings: [],
    completionPercentage: result.completionPercentage,
    fieldCount: result.fieldCount,
    totalFields: result.totalFields
  }
}

/**
 * Business rule validation for Enterprise tier
 */
export const validateBusinessRules = (data: Partial<EnterpriseTierData>) => {
  const rules: Array<{
    id: string
    description: string
    validate: (data: Partial<EnterpriseTierData>) => boolean
    severity: 'error' | 'warning'
    message: string
  }> = [
    {
      id: 'working-capital-reasonable',
      description: 'Working capital percentage should be reasonable for business size',
      validate: (data) => {
        const workingCapital = data.financialOptimization?.workingCapitalPercentage
        return !workingCapital || workingCapital <= 50
      },
      severity: 'warning',
      message: 'Working capital percentage exceeds typical industry ranges'
    },
    {
      id: 'debt-ratio-sustainable',
      description: 'Debt to equity ratio should be sustainable',
      validate: (data) => {
        const debtRatio = data.financialOptimization?.debtToEquityRatio
        return !debtRatio || debtRatio <= 5
      },
      severity: 'error',
      message: 'Debt to equity ratio indicates high financial risk'
    },
    {
      id: 'growth-scenarios-consistent',
      description: 'Growth scenarios should be logically consistent',
      validate: (data) => {
        const conservative = data.strategicScenarioPlanning?.conservativeScenario
        const aggressive = data.strategicScenarioPlanning?.aggressiveScenario
        if (!conservative || !aggressive) return true
        return aggressive.revenueImpactPercentage > conservative.revenueImpactPercentage
      },
      severity: 'error',
      message: 'Aggressive scenario should exceed conservative scenario projections'
    },
    {
      id: 'competitive-advantages-ranked',
      description: 'Competitive advantages should have unique rankings',
      validate: (data) => {
        const advantages = data.strategicValueDrivers?.competitiveAdvantages
        if (!advantages) return true
        const ranks = advantages.map(a => a.rank)
        return ranks.length === new Set(ranks).size
      },
      severity: 'error',
      message: 'Competitive advantages must have unique rankings'
    },
    {
      id: 'margin-evolution-reasonable',
      description: 'Margin evolution should be realistic',
      validate: (data) => {
        const current = data.multiYearProjections?.currentGrossMargin
        const projected = data.multiYearProjections?.projectedGrossMarginYear5
        if (!current || !projected) return true
        return Math.abs(projected - current) <= 20
      },
      severity: 'warning',
      message: 'Margin evolution exceeds typical improvement ranges'
    }
  ]

  const violations = rules.filter(rule => !rule.validate(data))
  const errors = violations.filter(v => v.severity === 'error')
  const warnings = violations.filter(v => v.severity === 'warning')

  return {
    isValid: errors.length === 0,
    errors: errors.map(e => e.message),
    warnings: warnings.map(w => w.message),
    ruleViolations: violations.map(v => ({
      ruleId: v.id,
      description: v.description,
      severity: v.severity,
      message: v.message
    }))
  }
}

/**
 * Field completion tracking constants
 */
export const ENTERPRISE_QUESTIONNAIRE_FIELD_COUNTS = {
  // Professional tier sections
  'financial-performance': 13,
  'customer-risk': 10,
  'competitive-market': 9,
  'operational-strategic': 7,
  'value-enhancement': 5,

  // Enterprise tier sections
  'strategic-value-drivers': 15,
  'operational-scalability': 12,
  'financial-optimization': 16,
  'strategic-scenario-planning': 18,
  'multi-year-projections': 20,

  // Totals
  professionalTotal: 44,
  enterpriseTotal: 81,
  grandTotal: 125,
  minimumRequired: 100 // 80% completion required
} as const

/**
 * Type exports for use in API and components
 */
export type CompleteEnterpriseQuestionnaire = z.infer<typeof CompleteEnterpriseQuestionnaireSchema>
export type PartialEnterpriseQuestionnaire = z.infer<typeof PartialEnterpriseQuestionnaireSchema>
export type SectionValidationResult = ReturnType<typeof validateSectionInRealTime>
export type CrossSectionValidationResult = ReturnType<typeof validateCrossSectionConsistency>
export type BusinessRuleValidationResult = ReturnType<typeof validateBusinessRules>
export type CompleteValidationResult = ReturnType<typeof validateCompleteEnterpriseQuestionnaire>