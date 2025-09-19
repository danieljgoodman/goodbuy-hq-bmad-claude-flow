/**
 * Professional Tier Data Import Utilities
 * Import and map Professional tier data to Enterprise questionnaire
 */

import {
  ProfessionalQuestionnaire,
  FinancialPerformance,
  CustomerRiskAnalysis,
  CompetitiveMarket,
  OperationalStrategic,
  ValueEnhancement
} from '@/lib/validations/professional-questionnaire'

/**
 * Professional data import result
 */
export interface ProfessionalDataImportResult {
  success: boolean
  data?: MappedProfessionalData
  errors: string[]
  warnings: string[]
  importedSections: string[]
  skippedSections: string[]
}

/**
 * Mapped professional data for Enterprise use
 */
export interface MappedProfessionalData {
  'financial-performance': FinancialPerformance
  'customer-risk': CustomerRiskAnalysis
  'competitive-market': CompetitiveMarket
  'operational-strategic': OperationalStrategic
  'value-enhancement': ValueEnhancement
  metadata: {
    importedAt: Date
    sourceType: 'professional-questionnaire'
    mappingVersion: string
    fieldsImported: number
    totalFields: number
    completionPercentage: number
  }
}

/**
 * Field mapping configuration
 */
interface FieldMapping {
  sourceField: string
  targetField: string
  transform?: (value: any) => any
  required?: boolean
  validate?: (value: any) => boolean
}

/**
 * Section mapping configurations
 */
const SECTION_MAPPINGS: Record<string, FieldMapping[]> = {
  'financial-performance': [
    { sourceField: 'revenueYear1', targetField: 'revenueYear1', required: true },
    { sourceField: 'revenueYear2', targetField: 'revenueYear2', required: true },
    { sourceField: 'revenueYear3', targetField: 'revenueYear3', required: true },
    { sourceField: 'profitYear1', targetField: 'profitYear1', required: true },
    { sourceField: 'profitYear2', targetField: 'profitYear2', required: true },
    { sourceField: 'profitYear3', targetField: 'profitYear3', required: true },
    { sourceField: 'cashFlowYear1', targetField: 'cashFlowYear1', required: true },
    { sourceField: 'cashFlowYear2', targetField: 'cashFlowYear2', required: true },
    { sourceField: 'cashFlowYear3', targetField: 'cashFlowYear3', required: true },
    { sourceField: 'ebitdaMargin', targetField: 'ebitdaMargin', required: true },
    { sourceField: 'returnOnEquity', targetField: 'returnOnEquity', required: true },
    { sourceField: 'returnOnAssets', targetField: 'returnOnAssets', required: true },
    { sourceField: 'totalDebt', targetField: 'totalDebt', required: true },
    { sourceField: 'workingCapitalRatio', targetField: 'workingCapitalRatio', required: true }
  ],
  'customer-risk': [
    { sourceField: 'largestCustomerRevenue', targetField: 'largestCustomerRevenue', required: true },
    { sourceField: 'top5CustomerRevenue', targetField: 'top5CustomerRevenue', required: true },
    { sourceField: 'customerConcentrationRisk', targetField: 'customerConcentrationRisk', required: true },
    { sourceField: 'averageCustomerTenure', targetField: 'averageCustomerTenure', required: true },
    { sourceField: 'customerRetentionRate', targetField: 'customerRetentionRate', required: true },
    { sourceField: 'customerSatisfactionScore', targetField: 'customerSatisfactionScore', required: true },
    { sourceField: 'averageContractLength', targetField: 'averageContractLength', required: true },
    { sourceField: 'contractRenewalRate', targetField: 'contractRenewalRate', required: true },
    { sourceField: 'recurringRevenuePercentage', targetField: 'recurringRevenuePercentage', required: true },
    { sourceField: 'seasonalityImpact', targetField: 'seasonalityImpact', required: true }
  ],
  'competitive-market': [
    { sourceField: 'marketSharePercentage', targetField: 'marketSharePercentage', required: true },
    { sourceField: 'primaryCompetitors', targetField: 'primaryCompetitors', required: true },
    { sourceField: 'competitiveAdvantageStrength', targetField: 'competitiveAdvantageStrength', required: true },
    { sourceField: 'marketGrowthRateAnnual', targetField: 'marketGrowthRateAnnual', required: true },
    { sourceField: 'scalabilityRating', targetField: 'scalabilityRating', required: true },
    { sourceField: 'barrierToEntryLevel', targetField: 'barrierToEntryLevel', required: true },
    { sourceField: 'competitiveThreats', targetField: 'competitiveThreats', required: true },
    { sourceField: 'technologyAdvantage', targetField: 'technologyAdvantage', required: true },
    { sourceField: 'intellectualPropertyValue', targetField: 'intellectualPropertyValue', required: true }
  ],
  'operational-strategic': [
    { sourceField: 'ownerTimeCommitment', targetField: 'ownerTimeCommitment', required: true },
    { sourceField: 'keyPersonRisk', targetField: 'keyPersonRisk', required: true },
    { sourceField: 'managementDepthRating', targetField: 'managementDepthRating', required: true },
    { sourceField: 'supplierConcentrationRisk', targetField: 'supplierConcentrationRisk', required: true },
    { sourceField: 'operationalComplexity', targetField: 'operationalComplexity', required: true },
    { sourceField: 'strategicPlanningHorizon', targetField: 'strategicPlanningHorizon', required: true },
    { sourceField: 'businessModelAdaptability', targetField: 'businessModelAdaptability', required: true }
  ],
  'value-enhancement': [
    { sourceField: 'growthInvestmentCapacity', targetField: 'growthInvestmentCapacity', required: true },
    { sourceField: 'marketExpansionOpportunities', targetField: 'marketExpansionOpportunities', required: true },
    { sourceField: 'improvementImplementationTimeline', targetField: 'improvementImplementationTimeline', required: true },
    { sourceField: 'organizationalChangeCapacity', targetField: 'organizationalChangeCapacity', required: true },
    { sourceField: 'valueCreationPotential', targetField: 'valueCreationPotential', required: true }
  ]
}

/**
 * Professional data importer class
 */
export class ProfessionalDataImporter {
  private errors: string[] = []
  private warnings: string[] = []
  private importedSections: string[] = []
  private skippedSections: string[] = []

  /**
   * Import professional questionnaire data
   */
  async importProfessionalData(professionalData: any): Promise<ProfessionalDataImportResult> {
    this.reset()

    try {
      // Validate source data structure
      if (!this.validateSourceData(professionalData)) {
        return {
          success: false,
          errors: this.errors,
          warnings: this.warnings,
          importedSections: [],
          skippedSections: Object.keys(SECTION_MAPPINGS)
        }
      }

      const mappedData: Partial<MappedProfessionalData> = {
        metadata: {
          importedAt: new Date(),
          sourceType: 'professional-questionnaire',
          mappingVersion: '1.0.0',
          fieldsImported: 0,
          totalFields: 0,
          completionPercentage: 0
        }
      }

      let totalFieldsImported = 0
      let totalFieldsAttempted = 0

      // Process each section
      for (const [sectionId, mappings] of Object.entries(SECTION_MAPPINGS)) {
        const sectionResult = this.mapSection(
          sectionId,
          professionalData,
          mappings
        )

        if (sectionResult.success && sectionResult.data) {
          mappedData[sectionId as keyof MappedProfessionalData] = sectionResult.data
          this.importedSections.push(sectionId)
          totalFieldsImported += sectionResult.fieldsImported
        } else {
          this.skippedSections.push(sectionId)
          this.errors.push(...sectionResult.errors)
        }

        totalFieldsAttempted += mappings.length
        this.warnings.push(...sectionResult.warnings)
      }

      // Update metadata
      if (mappedData.metadata) {
        mappedData.metadata.fieldsImported = totalFieldsImported
        mappedData.metadata.totalFields = totalFieldsAttempted
        mappedData.metadata.completionPercentage = Math.round(
          (totalFieldsImported / totalFieldsAttempted) * 100
        )
      }

      const success = this.importedSections.length > 0 && this.errors.length === 0

      return {
        success,
        data: success ? mappedData as MappedProfessionalData : undefined,
        errors: this.errors,
        warnings: this.warnings,
        importedSections: this.importedSections,
        skippedSections: this.skippedSections
      }
    } catch (error) {
      this.errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)

      return {
        success: false,
        errors: this.errors,
        warnings: this.warnings,
        importedSections: this.importedSections,
        skippedSections: Object.keys(SECTION_MAPPINGS)
      }
    }
  }

  /**
   * Map individual section data
   */
  private mapSection(
    sectionId: string,
    sourceData: any,
    mappings: FieldMapping[]
  ): {
    success: boolean
    data?: any
    errors: string[]
    warnings: string[]
    fieldsImported: number
  } {
    const errors: string[] = []
    const warnings: string[] = []
    const mappedData: any = {}
    let fieldsImported = 0

    // Get source section data
    const sourceSectionData = this.getSourceSectionData(sourceData, sectionId)
    if (!sourceSectionData) {
      errors.push(`Source data for section ${sectionId} not found`)
      return { success: false, errors, warnings, fieldsImported: 0 }
    }

    // Map each field
    for (const mapping of mappings) {
      try {
        const sourceValue = this.getNestedValue(sourceSectionData, mapping.sourceField)

        // Check if required field is missing
        if (mapping.required && (sourceValue === undefined || sourceValue === null)) {
          errors.push(`Required field ${mapping.sourceField} missing in section ${sectionId}`)
          continue
        }

        // Skip undefined/null optional fields
        if (sourceValue === undefined || sourceValue === null) {
          continue
        }

        // Validate field if validator provided
        if (mapping.validate && !mapping.validate(sourceValue)) {
          warnings.push(`Field ${mapping.sourceField} failed validation in section ${sectionId}`)
          continue
        }

        // Transform value if transformer provided
        const targetValue = mapping.transform ? mapping.transform(sourceValue) : sourceValue

        // Set target field
        this.setNestedValue(mappedData, mapping.targetField, targetValue)
        fieldsImported++

      } catch (error) {
        warnings.push(
          `Failed to map field ${mapping.sourceField} in section ${sectionId}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        )
      }
    }

    const success = errors.length === 0 && fieldsImported > 0

    return {
      success,
      data: success ? mappedData : undefined,
      errors,
      warnings,
      fieldsImported
    }
  }

  /**
   * Get source section data based on section ID
   */
  private getSourceSectionData(sourceData: any, sectionId: string): any {
    // Try different possible paths for professional data
    const possiblePaths = [
      `professionalQuestionnaire.${sectionId.replace('-', '')}`,
      `professionalQuestionnaire.${sectionId}`,
      sectionId.replace('-', ''),
      sectionId,
      `${sectionId.replace('-', '')}Section`,
      `${sectionId}Section`
    ]

    for (const path of possiblePaths) {
      const data = this.getNestedValue(sourceData, path)
      if (data) return data
    }

    return null
  }

  /**
   * Get nested object value using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  }

  /**
   * Set nested object value using dot notation
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {}
      return current[key]
    }, obj)
    target[lastKey] = value
  }

  /**
   * Validate source data structure
   */
  private validateSourceData(sourceData: any): boolean {
    if (!sourceData || typeof sourceData !== 'object') {
      this.errors.push('Source data is invalid or missing')
      return false
    }

    // Check for professional questionnaire data
    if (!sourceData.professionalQuestionnaire && !sourceData.financialperformance) {
      this.errors.push('No professional questionnaire data found in source')
      return false
    }

    return true
  }

  /**
   * Reset importer state
   */
  private reset(): void {
    this.errors = []
    this.warnings = []
    this.importedSections = []
    this.skippedSections = []
  }
}

/**
 * Utility functions for data import
 */

/**
 * Create importer instance
 */
export const createProfessionalDataImporter = (): ProfessionalDataImporter => {
  return new ProfessionalDataImporter()
}

/**
 * Quick import function
 */
export const importProfessionalData = async (
  professionalData: any
): Promise<ProfessionalDataImportResult> => {
  const importer = new ProfessionalDataImporter()
  return importer.importProfessionalData(professionalData)
}

/**
 * Check if data can be imported
 */
export const canImportProfessionalData = (sourceData: any): boolean => {
  return !!(
    sourceData &&
    typeof sourceData === 'object' &&
    (sourceData.professionalQuestionnaire || sourceData.financialperformance)
  )
}

/**
 * Get import compatibility report
 */
export const getImportCompatibilityReport = (sourceData: any): {
  compatible: boolean
  availableSections: string[]
  missingSections: string[]
  fieldCoverage: Record<string, { available: number; total: number; percentage: number }>
} => {
  const availableSections: string[] = []
  const missingSections: string[] = []
  const fieldCoverage: Record<string, { available: number; total: number; percentage: number }> = {}

  if (!canImportProfessionalData(sourceData)) {
    return {
      compatible: false,
      availableSections: [],
      missingSections: Object.keys(SECTION_MAPPINGS),
      fieldCoverage: {}
    }
  }

  for (const [sectionId, mappings] of Object.entries(SECTION_MAPPINGS)) {
    const importer = new ProfessionalDataImporter()
    const sourceSectionData = (importer as any).getSourceSectionData(sourceData, sectionId)

    if (sourceSectionData) {
      availableSections.push(sectionId)

      // Calculate field coverage
      let availableFields = 0
      for (const mapping of mappings) {
        const value = (importer as any).getNestedValue(sourceSectionData, mapping.sourceField)
        if (value !== undefined && value !== null) {
          availableFields++
        }
      }

      fieldCoverage[sectionId] = {
        available: availableFields,
        total: mappings.length,
        percentage: Math.round((availableFields / mappings.length) * 100)
      }
    } else {
      missingSections.push(sectionId)
      fieldCoverage[sectionId] = {
        available: 0,
        total: mappings.length,
        percentage: 0
      }
    }
  }

  return {
    compatible: availableSections.length > 0,
    availableSections,
    missingSections,
    fieldCoverage
  }
}

/**
 * Type exports
 */
export type {
  MappedProfessionalData,
  FieldMapping
}