// Professional Tier Questionnaire Field Mappings
// Maps form fields to database columns and handles data transformations

import type { ProfessionalQuestionnaireFieldMapping } from '../../types/professional-questionnaire'

// Database table structure mapping for Professional questionnaire data
export const PROFESSIONAL_QUESTIONNAIRE_DB_MAPPING = {
  // Main evaluation table - stores basic info and references
  evaluations: {
    tableName: 'business_evaluations',
    fields: {
      id: 'id',
      userId: 'user_id',
      tier: 'tier',
      status: 'status',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  },

  // Professional tier extended data - JSON column in main table
  professionalData: {
    tableName: 'business_evaluations',
    columnName: 'professional_tier_data',
    type: 'json'
  },

  // Business basics - existing columns in main table
  businessBasics: {
    tableName: 'business_evaluations',
    fields: {
      businessType: 'business_type',
      industryFocus: 'industry_focus',
      yearsInBusiness: 'years_in_business',
      businessModel: 'business_model',
      revenueModel: 'revenue_model'
    }
  }
} as const

// Section 1: Financial Performance Mappings
export const FINANCIAL_PERFORMANCE_MAPPINGS: readonly ProfessionalQuestionnaireFieldMapping[] = [
  {
    formField: 'revenueYear1',
    databaseColumn: 'professional_tier_data.financialPerformance.revenueYear1',
    dataType: 'decimal',
    nullable: false,
    transformation: {
      input: 'formatCurrencyToDecimal',
      output: 'formatDecimalToCurrency'
    }
  },
  {
    formField: 'revenueYear2',
    databaseColumn: 'professional_tier_data.financialPerformance.revenueYear2',
    dataType: 'decimal',
    nullable: false,
    transformation: {
      input: 'formatCurrencyToDecimal',
      output: 'formatDecimalToCurrency'
    }
  },
  {
    formField: 'revenueYear3',
    databaseColumn: 'professional_tier_data.financialPerformance.revenueYear3',
    dataType: 'decimal',
    nullable: false,
    transformation: {
      input: 'formatCurrencyToDecimal',
      output: 'formatDecimalToCurrency'
    }
  },
  {
    formField: 'profitYear1',
    databaseColumn: 'professional_tier_data.financialPerformance.profitYear1',
    dataType: 'decimal',
    nullable: false,
    transformation: {
      input: 'formatCurrencyToDecimal',
      output: 'formatDecimalToCurrency'
    }
  },
  {
    formField: 'profitYear2',
    databaseColumn: 'professional_tier_data.financialPerformance.profitYear2',
    dataType: 'decimal',
    nullable: false,
    transformation: {
      input: 'formatCurrencyToDecimal',
      output: 'formatDecimalToCurrency'
    }
  },
  {
    formField: 'profitYear3',
    databaseColumn: 'professional_tier_data.financialPerformance.profitYear3',
    dataType: 'decimal',
    nullable: false,
    transformation: {
      input: 'formatCurrencyToDecimal',
      output: 'formatDecimalToCurrency'
    }
  },
  {
    formField: 'cashFlowYear1',
    databaseColumn: 'professional_tier_data.financialPerformance.cashFlowYear1',
    dataType: 'decimal',
    nullable: false,
    transformation: {
      input: 'formatCurrencyToDecimal',
      output: 'formatDecimalToCurrency'
    }
  },
  {
    formField: 'cashFlowYear2',
    databaseColumn: 'professional_tier_data.financialPerformance.cashFlowYear2',
    dataType: 'decimal',
    nullable: false,
    transformation: {
      input: 'formatCurrencyToDecimal',
      output: 'formatDecimalToCurrency'
    }
  },
  {
    formField: 'cashFlowYear3',
    databaseColumn: 'professional_tier_data.financialPerformance.cashFlowYear3',
    dataType: 'decimal',
    nullable: false,
    transformation: {
      input: 'formatCurrencyToDecimal',
      output: 'formatDecimalToCurrency'
    }
  },
  {
    formField: 'ebitdaMargin',
    databaseColumn: 'professional_tier_data.financialPerformance.ebitdaMargin',
    dataType: 'decimal',
    nullable: false,
    transformation: {
      input: 'formatPercentageToDecimal',
      output: 'formatDecimalToPercentage'
    }
  },
  {
    formField: 'returnOnEquity',
    databaseColumn: 'professional_tier_data.financialPerformance.returnOnEquity',
    dataType: 'decimal',
    nullable: false,
    transformation: {
      input: 'formatPercentageToDecimal',
      output: 'formatDecimalToPercentage'
    }
  },
  {
    formField: 'returnOnAssets',
    databaseColumn: 'professional_tier_data.financialPerformance.returnOnAssets',
    dataType: 'decimal',
    nullable: false,
    transformation: {
      input: 'formatPercentageToDecimal',
      output: 'formatDecimalToPercentage'
    }
  },
  {
    formField: 'totalDebt',
    databaseColumn: 'professional_tier_data.financialPerformance.totalDebt',
    dataType: 'decimal',
    nullable: false,
    transformation: {
      input: 'formatCurrencyToDecimal',
      output: 'formatDecimalToCurrency'
    }
  },
  {
    formField: 'workingCapitalRatio',
    databaseColumn: 'professional_tier_data.financialPerformance.workingCapitalRatio',
    dataType: 'decimal',
    nullable: false
  }
] as const

// Section 2: Customer & Risk Analysis Mappings
export const CUSTOMER_RISK_ANALYSIS_MAPPINGS: readonly ProfessionalQuestionnaireFieldMapping[] = [
  {
    formField: 'largestCustomerRevenue',
    databaseColumn: 'professional_tier_data.customerRiskAnalysis.largestCustomerRevenue',
    dataType: 'decimal',
    nullable: false,
    transformation: {
      input: 'formatCurrencyToDecimal',
      output: 'formatDecimalToCurrency'
    }
  },
  {
    formField: 'top5CustomerRevenue',
    databaseColumn: 'professional_tier_data.customerRiskAnalysis.top5CustomerRevenue',
    dataType: 'decimal',
    nullable: false,
    transformation: {
      input: 'formatCurrencyToDecimal',
      output: 'formatDecimalToCurrency'
    }
  },
  {
    formField: 'customerConcentrationRisk',
    databaseColumn: 'professional_tier_data.customerRiskAnalysis.customerConcentrationRisk',
    dataType: 'enum',
    nullable: false,
    defaultValue: 'medium'
  },
  {
    formField: 'averageCustomerTenure',
    databaseColumn: 'professional_tier_data.customerRiskAnalysis.averageCustomerTenure',
    dataType: 'decimal',
    nullable: false
  },
  {
    formField: 'customerRetentionRate',
    databaseColumn: 'professional_tier_data.customerRiskAnalysis.customerRetentionRate',
    dataType: 'decimal',
    nullable: false,
    transformation: {
      input: 'formatPercentageToDecimal',
      output: 'formatDecimalToPercentage'
    }
  },
  {
    formField: 'customerSatisfactionScore',
    databaseColumn: 'professional_tier_data.customerRiskAnalysis.customerSatisfactionScore',
    dataType: 'decimal',
    nullable: false
  },
  {
    formField: 'averageContractLength',
    databaseColumn: 'professional_tier_data.customerRiskAnalysis.averageContractLength',
    dataType: 'decimal',
    nullable: false
  },
  {
    formField: 'contractRenewalRate',
    databaseColumn: 'professional_tier_data.customerRiskAnalysis.contractRenewalRate',
    dataType: 'decimal',
    nullable: false,
    transformation: {
      input: 'formatPercentageToDecimal',
      output: 'formatDecimalToPercentage'
    }
  },
  {
    formField: 'recurringRevenuePercentage',
    databaseColumn: 'professional_tier_data.customerRiskAnalysis.recurringRevenuePercentage',
    dataType: 'decimal',
    nullable: false,
    transformation: {
      input: 'formatPercentageToDecimal',
      output: 'formatDecimalToPercentage'
    }
  },
  {
    formField: 'seasonalityImpact',
    databaseColumn: 'professional_tier_data.customerRiskAnalysis.seasonalityImpact',
    dataType: 'enum',
    nullable: false,
    defaultValue: 'medium'
  }
] as const

// Section 3: Competitive & Market Position Mappings
export const COMPETITIVE_MARKET_MAPPINGS: readonly ProfessionalQuestionnaireFieldMapping[] = [
  {
    formField: 'marketSharePercentage',
    databaseColumn: 'professional_tier_data.competitiveMarket.marketSharePercentage',
    dataType: 'decimal',
    nullable: false,
    transformation: {
      input: 'formatPercentageToDecimal',
      output: 'formatDecimalToPercentage'
    }
  },
  {
    formField: 'primaryCompetitors',
    databaseColumn: 'professional_tier_data.competitiveMarket.primaryCompetitors',
    dataType: 'json',
    nullable: false,
    transformation: {
      input: 'formatArrayToJson',
      output: 'formatJsonToArray'
    }
  },
  {
    formField: 'competitiveAdvantageStrength',
    databaseColumn: 'professional_tier_data.competitiveMarket.competitiveAdvantageStrength',
    dataType: 'enum',
    nullable: false,
    defaultValue: 'moderate'
  },
  {
    formField: 'marketGrowthRateAnnual',
    databaseColumn: 'professional_tier_data.competitiveMarket.marketGrowthRateAnnual',
    dataType: 'decimal',
    nullable: false,
    transformation: {
      input: 'formatPercentageToDecimal',
      output: 'formatDecimalToPercentage'
    }
  },
  {
    formField: 'scalabilityRating',
    databaseColumn: 'professional_tier_data.competitiveMarket.scalabilityRating',
    dataType: 'enum',
    nullable: false,
    defaultValue: 'moderate'
  },
  {
    formField: 'barrierToEntryLevel',
    databaseColumn: 'professional_tier_data.competitiveMarket.barrierToEntryLevel',
    dataType: 'enum',
    nullable: false,
    defaultValue: 'medium'
  },
  {
    formField: 'competitiveThreats',
    databaseColumn: 'professional_tier_data.competitiveMarket.competitiveThreats',
    dataType: 'json',
    nullable: false,
    transformation: {
      input: 'formatArrayToJson',
      output: 'formatJsonToArray'
    }
  },
  {
    formField: 'technologyAdvantage',
    databaseColumn: 'professional_tier_data.competitiveMarket.technologyAdvantage',
    dataType: 'enum',
    nullable: false,
    defaultValue: 'parity'
  },
  {
    formField: 'intellectualPropertyValue',
    databaseColumn: 'professional_tier_data.competitiveMarket.intellectualPropertyValue',
    dataType: 'enum',
    nullable: false,
    defaultValue: 'limited'
  }
] as const

// Section 4: Operational & Strategic Dependencies Mappings
export const OPERATIONAL_STRATEGIC_MAPPINGS: readonly ProfessionalQuestionnaireFieldMapping[] = [
  {
    formField: 'ownerTimeCommitment',
    databaseColumn: 'professional_tier_data.operationalStrategic.ownerTimeCommitment',
    dataType: 'integer',
    nullable: false
  },
  {
    formField: 'keyPersonRisk',
    databaseColumn: 'professional_tier_data.operationalStrategic.keyPersonRisk',
    dataType: 'enum',
    nullable: false,
    defaultValue: 'medium'
  },
  {
    formField: 'managementDepthRating',
    databaseColumn: 'professional_tier_data.operationalStrategic.managementDepthRating',
    dataType: 'enum',
    nullable: false,
    defaultValue: 'adequate'
  },
  {
    formField: 'supplierConcentrationRisk',
    databaseColumn: 'professional_tier_data.operationalStrategic.supplierConcentrationRisk',
    dataType: 'enum',
    nullable: false,
    defaultValue: 'medium'
  },
  {
    formField: 'operationalComplexity',
    databaseColumn: 'professional_tier_data.operationalStrategic.operationalComplexity',
    dataType: 'enum',
    nullable: false,
    defaultValue: 'moderate'
  },
  {
    formField: 'strategicPlanningHorizon',
    databaseColumn: 'professional_tier_data.operationalStrategic.strategicPlanningHorizon',
    dataType: 'enum',
    nullable: false,
    defaultValue: 'short_term'
  },
  {
    formField: 'businessModelAdaptability',
    databaseColumn: 'professional_tier_data.operationalStrategic.businessModelAdaptability',
    dataType: 'enum',
    nullable: false,
    defaultValue: 'limited'
  }
] as const

// Section 5: Value Enhancement Potential Mappings
export const VALUE_ENHANCEMENT_MAPPINGS: readonly ProfessionalQuestionnaireFieldMapping[] = [
  {
    formField: 'growthInvestmentCapacity',
    databaseColumn: 'professional_tier_data.valueEnhancement.growthInvestmentCapacity',
    dataType: 'decimal',
    nullable: false,
    transformation: {
      input: 'formatCurrencyToDecimal',
      output: 'formatDecimalToCurrency'
    }
  },
  {
    formField: 'marketExpansionOpportunities',
    databaseColumn: 'professional_tier_data.valueEnhancement.marketExpansionOpportunities',
    dataType: 'json',
    nullable: true,
    transformation: {
      input: 'formatArrayToJson',
      output: 'formatJsonToArray'
    }
  },
  {
    formField: 'improvementImplementationTimeline',
    databaseColumn: 'professional_tier_data.valueEnhancement.improvementImplementationTimeline',
    dataType: 'enum',
    nullable: false,
    defaultValue: '6_months'
  },
  {
    formField: 'organizationalChangeCapacity',
    databaseColumn: 'professional_tier_data.valueEnhancement.organizationalChangeCapacity',
    dataType: 'enum',
    nullable: false,
    defaultValue: 'moderate'
  },
  {
    formField: 'valueCreationPotential',
    databaseColumn: 'professional_tier_data.valueEnhancement.valueCreationPotential',
    dataType: 'enum',
    nullable: false,
    defaultValue: 'moderate'
  }
] as const

// Complete field mapping registry
export const PROFESSIONAL_QUESTIONNAIRE_FIELD_MAPPINGS = {
  financialPerformance: FINANCIAL_PERFORMANCE_MAPPINGS,
  customerRiskAnalysis: CUSTOMER_RISK_ANALYSIS_MAPPINGS,
  competitiveMarket: COMPETITIVE_MARKET_MAPPINGS,
  operationalStrategic: OPERATIONAL_STRATEGIC_MAPPINGS,
  valueEnhancement: VALUE_ENHANCEMENT_MAPPINGS
} as const

// Flattened mapping for easy lookup
export const ALL_PROFESSIONAL_FIELD_MAPPINGS: readonly ProfessionalQuestionnaireFieldMapping[] = [
  ...FINANCIAL_PERFORMANCE_MAPPINGS,
  ...CUSTOMER_RISK_ANALYSIS_MAPPINGS,
  ...COMPETITIVE_MARKET_MAPPINGS,
  ...OPERATIONAL_STRATEGIC_MAPPINGS,
  ...VALUE_ENHANCEMENT_MAPPINGS
] as const

// Data transformation functions
export const DATA_TRANSFORMATIONS = {
  // Currency transformations
  formatCurrencyToDecimal: (value: string | number): number => {
    if (typeof value === 'number') return value
    const numericValue = parseFloat(value.toString().replace(/[$,]/g, ''))
    return isNaN(numericValue) ? 0 : numericValue
  },

  formatDecimalToCurrency: (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  },

  // Percentage transformations
  formatPercentageToDecimal: (value: string | number): number => {
    if (typeof value === 'number') return value / 100
    const numericValue = parseFloat(value.toString().replace(/[%]/g, ''))
    return isNaN(numericValue) ? 0 : numericValue / 100
  },

  formatDecimalToPercentage: (value: number): string => {
    return `${(value * 100).toFixed(1)}%`
  },

  // Array transformations
  formatArrayToJson: (value: string[]): string => {
    return JSON.stringify(value || [])
  },

  formatJsonToArray: (value: string): string[] => {
    try {
      return JSON.parse(value) || []
    } catch {
      return []
    }
  },

  // Enum validation
  validateEnum: (value: string, validValues: readonly string[]): string => {
    return validValues.includes(value) ? value : validValues[0]
  }
} as const

// Database query helpers
export const PROFESSIONAL_QUESTIONNAIRE_QUERIES = {
  // Insert new professional evaluation
  insertProfessionalEvaluation: `
    INSERT INTO business_evaluations (
      id, user_id, tier, business_type, industry_focus, years_in_business,
      business_model, revenue_model, professional_tier_data, status, created_at, updated_at
    ) VALUES (
      $1, $2, 'professional', $3, $4, $5, $6, $7, $8, 'processing', NOW(), NOW()
    ) RETURNING id
  `,

  // Update professional tier data
  updateProfessionalTierData: `
    UPDATE business_evaluations
    SET professional_tier_data = $2, updated_at = NOW()
    WHERE id = $1 AND tier = 'professional'
  `,

  // Get professional evaluation with tier data
  getProfessionalEvaluation: `
    SELECT id, user_id, tier, business_type, industry_focus, years_in_business,
           business_model, revenue_model, professional_tier_data, status,
           created_at, updated_at
    FROM business_evaluations
    WHERE id = $1 AND tier = 'professional'
  `,

  // Get user's professional evaluations
  getUserProfessionalEvaluations: `
    SELECT id, tier, business_type, industry_focus, status, created_at, updated_at
    FROM business_evaluations
    WHERE user_id = $1 AND tier = 'professional'
    ORDER BY created_at DESC
  `,

  // Check professional tier field completeness
  checkProfessionalFieldCompleteness: `
    SELECT
      id,
      CASE
        WHEN professional_tier_data IS NULL THEN 0
        ELSE (
          CASE WHEN professional_tier_data->>'financialPerformance' IS NOT NULL THEN 13 ELSE 0 END +
          CASE WHEN professional_tier_data->>'customerRiskAnalysis' IS NOT NULL THEN 10 ELSE 0 END +
          CASE WHEN professional_tier_data->>'competitiveMarket' IS NOT NULL THEN 9 ELSE 0 END +
          CASE WHEN professional_tier_data->>'operationalStrategic' IS NOT NULL THEN 7 ELSE 0 END +
          CASE WHEN professional_tier_data->>'valueEnhancement' IS NOT NULL THEN 5 ELSE 0 END
        )
      END as completed_fields
    FROM business_evaluations
    WHERE id = $1 AND tier = 'professional'
  `
} as const

// Field validation helpers
export const FIELD_VALIDATORS = {
  // Validate required fields for each section
  validateFinancialPerformanceFields: (data: any): string[] => {
    const required = ['revenueYear1', 'revenueYear2', 'revenueYear3', 'profitYear1', 'profitYear2', 'profitYear3',
                     'cashFlowYear1', 'cashFlowYear2', 'cashFlowYear3', 'ebitdaMargin', 'returnOnEquity',
                     'returnOnAssets', 'totalDebt', 'workingCapitalRatio']
    return required.filter(field => data[field] === undefined || data[field] === null)
  },

  validateCustomerRiskAnalysisFields: (data: any): string[] => {
    const required = ['largestCustomerRevenue', 'top5CustomerRevenue', 'customerConcentrationRisk',
                     'averageCustomerTenure', 'customerRetentionRate', 'customerSatisfactionScore',
                     'averageContractLength', 'contractRenewalRate', 'recurringRevenuePercentage', 'seasonalityImpact']
    return required.filter(field => data[field] === undefined || data[field] === null)
  },

  validateCompetitiveMarketFields: (data: any): string[] => {
    const required = ['marketSharePercentage', 'primaryCompetitors', 'competitiveAdvantageStrength',
                     'marketGrowthRateAnnual', 'scalabilityRating', 'barrierToEntryLevel', 'competitiveThreats',
                     'technologyAdvantage', 'intellectualPropertyValue']
    return required.filter(field => data[field] === undefined || data[field] === null)
  },

  validateOperationalStrategicFields: (data: any): string[] => {
    const required = ['ownerTimeCommitment', 'keyPersonRisk', 'managementDepthRating',
                     'supplierConcentrationRisk', 'operationalComplexity', 'strategicPlanningHorizon',
                     'businessModelAdaptability']
    return required.filter(field => data[field] === undefined || data[field] === null)
  },

  validateValueEnhancementFields: (data: any): string[] => {
    const required = ['growthInvestmentCapacity', 'improvementImplementationTimeline',
                     'organizationalChangeCapacity', 'valueCreationPotential']
    return required.filter(field => data[field] === undefined || data[field] === null)
  }
} as const

// Export utility function to get mapping by field name
export const getFieldMapping = (fieldName: string): ProfessionalQuestionnaireFieldMapping | undefined => {
  return ALL_PROFESSIONAL_FIELD_MAPPINGS.find(mapping => mapping.formField === fieldName)
}

// Export utility function to get all mappings for a section
export const getSectionMappings = (sectionName: keyof typeof PROFESSIONAL_QUESTIONNAIRE_FIELD_MAPPINGS) => {
  return PROFESSIONAL_QUESTIONNAIRE_FIELD_MAPPINGS[sectionName]
}

// Professional tier upgrade qualification
export const PROFESSIONAL_TIER_QUALIFICATION = {
  minimumRequiredFields: 30,
  totalAvailableFields: 44,
  minimumCompletionPercentage: 68, // 30/44
  recommendedFields: 35,
  timeToComplete: {
    minimum: 15, // minutes
    average: 25,
    maximum: 45
  }
} as const