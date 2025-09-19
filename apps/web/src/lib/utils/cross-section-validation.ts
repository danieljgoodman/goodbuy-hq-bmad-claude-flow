/**
 * Cross-Section Validation and Business Rules Engine
 * Advanced validation logic for Enterprise questionnaire consistency
 */

import {
  EnterpriseTierData,
  StrategicValueDrivers,
  OperationalScalability,
  FinancialOptimization,
  StrategicScenarioPlanning,
  MultiYearProjections
} from '@/lib/validations/enterprise-tier'
import {
  ProfessionalQuestionnaire,
  FinancialPerformance,
  CustomerRiskAnalysis,
  CompetitiveMarket,
  OperationalStrategic,
  ValueEnhancement
} from '@/lib/validations/professional-questionnaire'

/**
 * Validation rule definition
 */
export interface ValidationRule {
  id: string
  name: string
  description: string
  category: 'consistency' | 'business_logic' | 'regulatory' | 'best_practice'
  severity: 'error' | 'warning' | 'info'
  sections: string[]
  validate: (data: CrossSectionData) => ValidationRuleResult
}

/**
 * Validation rule result
 */
export interface ValidationRuleResult {
  passed: boolean
  message: string
  affectedFields?: string[]
  suggestedAction?: string
  relatedSections?: string[]
}

/**
 * Cross-section data structure
 */
export interface CrossSectionData {
  professional?: {
    financialPerformance?: FinancialPerformance
    customerRiskAnalysis?: CustomerRiskAnalysis
    competitiveMarket?: CompetitiveMarket
    operationalStrategic?: OperationalStrategic
    valueEnhancement?: ValueEnhancement
  }
  enterprise?: {
    strategicValueDrivers?: StrategicValueDrivers
    operationalScalability?: OperationalScalability
    financialOptimization?: FinancialOptimization
    strategicScenarioPlanning?: StrategicScenarioPlanning
    multiYearProjections?: MultiYearProjections
  }
}

/**
 * Comprehensive validation result
 */
export interface CrossSectionValidationResult {
  isValid: boolean
  score: number
  errors: ValidationRuleResult[]
  warnings: ValidationRuleResult[]
  info: ValidationRuleResult[]
  summary: {
    totalRules: number
    passedRules: number
    failedRules: number
    byCategory: Record<string, { passed: number; failed: number }>
    bySeverity: Record<string, number>
  }
  recommendations: string[]
  criticalIssues: string[]
}

/**
 * Validation rules registry
 */
const VALIDATION_RULES: ValidationRule[] = [
  // Financial Consistency Rules
  {
    id: 'revenue-growth-consistency',
    name: 'Revenue Growth Consistency',
    description: 'Revenue projections should align with historical growth patterns',
    category: 'consistency',
    severity: 'warning',
    sections: ['financial-performance', 'multi-year-projections'],
    validate: (data) => {
      const financial = data.professional?.financialPerformance
      const projections = data.enterprise?.multiYearProjections

      if (!financial || !projections?.baseCase) {
        return { passed: true, message: 'Insufficient data for validation' }
      }

      // Calculate historical growth rate
      const years = [financial.revenueYear1, financial.revenueYear2, financial.revenueYear3]
      const historicalGrowth = years.length >= 2
        ? ((years[years.length - 1] - years[0]) / years[0]) * 100 / (years.length - 1)
        : 0

      // Calculate projected growth rate (first 3 years)
      const projectedGrowth = projections.baseCase.length >= 2
        ? ((projections.baseCase[2].revenue - projections.baseCase[0].revenue) / projections.baseCase[0].revenue) * 100 / 2
        : 0

      const difference = Math.abs(projectedGrowth - historicalGrowth)

      if (difference > 50) {
        return {
          passed: false,
          message: `Projected growth rate (${projectedGrowth.toFixed(1)}%) significantly differs from historical rate (${historicalGrowth.toFixed(1)}%)`,
          affectedFields: ['multiYearProjections.baseCase', 'financialPerformance.revenueYear3'],
          suggestedAction: 'Review projection assumptions or provide justification for growth rate changes'
        }
      }

      return { passed: true, message: 'Revenue growth projections are consistent with historical data' }
    }
  },

  // Working Capital Optimization Rule
  {
    id: 'working-capital-optimization',
    name: 'Working Capital Optimization',
    description: 'Working capital should be optimized relative to business size and industry',
    category: 'business_logic',
    severity: 'warning',
    sections: ['financial-performance', 'financial-optimization'],
    validate: (data) => {
      const financial = data.professional?.financialPerformance
      const optimization = data.enterprise?.financialOptimization

      if (!financial || !optimization) {
        return { passed: true, message: 'Insufficient data for validation' }
      }

      const revenue = financial.revenueYear3
      const workingCapitalRatio = financial.workingCapitalRatio
      const workingCapitalPercentage = optimization.workingCapitalPercentage

      // Large businesses (>$10M) should have lower working capital percentages
      if (revenue > 10000000 && workingCapitalPercentage > 20) {
        return {
          passed: false,
          message: `Working capital percentage (${workingCapitalPercentage}%) is high for a business of this size ($${(revenue/1000000).toFixed(1)}M revenue)`,
          affectedFields: ['financialOptimization.workingCapitalPercentage'],
          suggestedAction: 'Consider working capital optimization strategies for larger businesses'
        }
      }

      // Check if working capital reduction opportunity exists
      if (workingCapitalPercentage > 15 && optimization.workingCapitalReduction === 0) {
        return {
          passed: false,
          message: 'Working capital reduction opportunity not identified despite high working capital percentage',
          affectedFields: ['financialOptimization.workingCapitalReduction'],
          suggestedAction: 'Identify specific working capital reduction opportunities'
        }
      }

      return { passed: true, message: 'Working capital appears optimized for business size' }
    }
  },

  // Key Person Risk Consistency
  {
    id: 'key-person-risk-consistency',
    name: 'Key Person Risk Consistency',
    description: 'Key person risk should align with process documentation and management depth',
    category: 'consistency',
    severity: 'error',
    sections: ['operational-strategic', 'operational-scalability'],
    validate: (data) => {
      const operational = data.professional?.operationalStrategic
      const scalability = data.enterprise?.operationalScalability

      if (!operational || !scalability) {
        return { passed: true, message: 'Insufficient data for validation' }
      }

      const keyPersonRisk = operational.keyPersonRisk
      const processDoc = scalability.processDocumentationPercentage
      const keyPersonDependency = scalability.keyPersonDependencyPercentage

      // High key person risk should correlate with low process documentation
      if (keyPersonRisk === 'high' && processDoc > 80) {
        return {
          passed: false,
          message: 'High key person risk inconsistent with high process documentation (80%+)',
          affectedFields: ['operationalStrategic.keyPersonRisk', 'operationalScalability.processDocumentationPercentage'],
          suggestedAction: 'Reconcile key person risk assessment with actual process documentation level'
        }
      }

      // Low key person risk should correlate with high process documentation
      if (keyPersonRisk === 'low' && processDoc < 60) {
        return {
          passed: false,
          message: 'Low key person risk inconsistent with low process documentation (<60%)',
          affectedFields: ['operationalStrategic.keyPersonRisk', 'operationalScalability.processDocumentationPercentage'],
          suggestedAction: 'Review key person risk assessment or improve process documentation'
        }
      }

      return { passed: true, message: 'Key person risk aligns with operational documentation' }
    }
  },

  // Competitive Advantage IP Consistency
  {
    id: 'competitive-advantage-ip-consistency',
    name: 'Competitive Advantage IP Consistency',
    description: 'IP portfolio should support claimed competitive advantages',
    category: 'consistency',
    severity: 'warning',
    sections: ['competitive-market', 'strategic-value-drivers'],
    validate: (data) => {
      const competitive = data.professional?.competitiveMarket
      const strategic = data.enterprise?.strategicValueDrivers

      if (!competitive || !strategic) {
        return { passed: true, message: 'Insufficient data for validation' }
      }

      const ipValue = competitive.intellectualPropertyValue
      const patents = strategic.patents
      const trademarks = strategic.trademarks
      const hasTradeSecrets = strategic.hasTradeSecrets

      // Significant IP value should be backed by actual IP
      if (ipValue === 'significant' && patents === 0 && trademarks === 0 && !hasTradeSecrets) {
        return {
          passed: false,
          message: 'Claimed significant IP value not supported by actual IP portfolio',
          affectedFields: ['competitiveMarket.intellectualPropertyValue', 'strategicValueDrivers.patents'],
          suggestedAction: 'Document actual IP assets or revise IP value assessment'
        }
      }

      // Substantial IP portfolio should reflect in competitive assessment
      if ((patents > 5 || trademarks > 3) && ipValue === 'none') {
        return {
          passed: false,
          message: 'Substantial IP portfolio not reflected in competitive advantage assessment',
          affectedFields: ['competitiveMarket.intellectualPropertyValue', 'strategicValueDrivers.patents'],
          suggestedAction: 'Update competitive advantage assessment to reflect IP assets'
        }
      }

      return { passed: true, message: 'IP portfolio aligns with competitive advantage claims' }
    }
  },

  // Growth Investment Capacity vs. Scenarios
  {
    id: 'growth-investment-capacity-scenarios',
    name: 'Growth Investment Capacity vs. Scenarios',
    description: 'Growth investment capacity should support strategic scenarios',
    category: 'business_logic',
    severity: 'error',
    sections: ['value-enhancement', 'strategic-scenario-planning'],
    validate: (data) => {
      const enhancement = data.professional?.valueEnhancement
      const scenarios = data.enterprise?.strategicScenarioPlanning

      if (!enhancement || !scenarios) {
        return { passed: true, message: 'Insufficient data for validation' }
      }

      const investmentCapacity = enhancement.growthInvestmentCapacity
      const aggressiveInvestment = scenarios.aggressiveScenario.investmentAmount

      // Investment capacity should support aggressive scenario
      if (aggressiveInvestment > investmentCapacity * 2) {
        return {
          passed: false,
          message: `Aggressive scenario investment ($${(aggressiveInvestment/1000000).toFixed(1)}M) exceeds realistic capacity ($${(investmentCapacity/1000000).toFixed(1)}M)`,
          affectedFields: ['strategicScenarioPlanning.aggressiveScenario', 'valueEnhancement.growthInvestmentCapacity'],
          suggestedAction: 'Adjust scenario investments to realistic capacity or increase investment capacity'
        }
      }

      return { passed: true, message: 'Growth investment scenarios align with stated capacity' }
    }
  },

  // Exit Strategy Readiness
  {
    id: 'exit-strategy-readiness',
    name: 'Exit Strategy Readiness',
    description: 'Exit timeline should align with transaction readiness and advisor engagement',
    category: 'business_logic',
    severity: 'warning',
    sections: ['strategic-scenario-planning'],
    validate: (data) => {
      const scenarios = data.enterprise?.strategicScenarioPlanning

      if (!scenarios) {
        return { passed: true, message: 'Insufficient data for validation' }
      }

      const exitTimeline = scenarios.preferredExitTimeline
      const readiness = scenarios.transactionReadiness
      const advisors = scenarios.advisorsEngaged

      // Short timeline should have high readiness
      if (exitTimeline === 'one2years' && readiness === 'significant') {
        return {
          passed: false,
          message: 'Short exit timeline (1-2 years) inconsistent with significant preparation needs',
          affectedFields: ['strategicScenarioPlanning.preferredExitTimeline', 'strategicScenarioPlanning.transactionReadiness'],
          suggestedAction: 'Extend exit timeline or accelerate transaction preparation'
        }
      }

      // Ready businesses should have advisors
      if (readiness === 'ready' && advisors.includes('none')) {
        return {
          passed: false,
          message: 'Transaction-ready status inconsistent with no advisors engaged',
          affectedFields: ['strategicScenarioPlanning.transactionReadiness', 'strategicScenarioPlanning.advisorsEngaged'],
          suggestedAction: 'Engage transaction advisors or revise readiness assessment'
        }
      }

      return { passed: true, message: 'Exit strategy components are aligned' }
    }
  },

  // Margin Evolution Realism
  {
    id: 'margin-evolution-realism',
    name: 'Margin Evolution Realism',
    description: 'Projected margin improvements should be achievable',
    category: 'business_logic',
    severity: 'warning',
    sections: ['multi-year-projections', 'operational-scalability'],
    validate: (data) => {
      const projections = data.enterprise?.multiYearProjections
      const scalability = data.enterprise?.operationalScalability

      if (!projections || !scalability) {
        return { passed: true, message: 'Insufficient data for validation' }
      }

      const currentGrossMargin = projections.currentGrossMargin
      const projectedGrossMargin = projections.projectedGrossMarginYear5
      const marginImprovement = projectedGrossMargin - currentGrossMargin

      const processOptimizations = scalability.processOptimizationOpportunities
      const totalSavings = processOptimizations.reduce((sum, opt) => sum + opt.annualSavings, 0)

      // Large margin improvements should be supported by specific initiatives
      if (marginImprovement > 10 && totalSavings === 0) {
        return {
          passed: false,
          message: `Projected margin improvement (${marginImprovement.toFixed(1)}%) lacks supporting optimization initiatives`,
          affectedFields: ['multiYearProjections.projectedGrossMarginYear5', 'operationalScalability.processOptimizationOpportunities'],
          suggestedAction: 'Identify specific process optimizations or reduce margin improvement projections'
        }
      }

      // Unrealistic margin improvements
      if (marginImprovement > 25) {
        return {
          passed: false,
          message: `Projected margin improvement (${marginImprovement.toFixed(1)}%) exceeds realistic limits`,
          affectedFields: ['multiYearProjections.projectedGrossMarginYear5'],
          suggestedAction: 'Reduce projected margin improvement to realistic levels (<25%)'
        }
      }

      return { passed: true, message: 'Margin evolution projections appear realistic' }
    }
  },

  // Debt Service Coverage
  {
    id: 'debt-service-coverage',
    name: 'Debt Service Coverage',
    description: 'Debt service requirements should be covered by cash flow',
    category: 'regulatory',
    severity: 'error',
    sections: ['financial-performance', 'financial-optimization'],
    validate: (data) => {
      const financial = data.professional?.financialPerformance
      const optimization = data.enterprise?.financialOptimization

      if (!financial || !optimization) {
        return { passed: true, message: 'Insufficient data for validation' }
      }

      const cashFlow = financial.cashFlowYear3
      const debtService = optimization.debtServiceRequirements

      // Basic debt service coverage ratio should be > 1.25
      const coverageRatio = debtService > 0 ? cashFlow / debtService : 999

      if (coverageRatio < 1.25 && debtService > 0) {
        return {
          passed: false,
          message: `Debt service coverage ratio (${coverageRatio.toFixed(2)}) below acceptable minimum (1.25)`,
          affectedFields: ['financialOptimization.debtServiceRequirements', 'financialPerformance.cashFlowYear3'],
          suggestedAction: 'Improve cash flow or reduce debt service requirements'
        }
      }

      return { passed: true, message: 'Debt service coverage is adequate' }
    }
  },

  // Customer Concentration Risk vs. Revenue Quality
  {
    id: 'customer-concentration-revenue-quality',
    name: 'Customer Concentration vs. Revenue Quality',
    description: 'High customer concentration should align with contract quality',
    category: 'consistency',
    severity: 'warning',
    sections: ['customer-risk'],
    validate: (data) => {
      const customer = data.professional?.customerRiskAnalysis

      if (!customer) {
        return { passed: true, message: 'Insufficient data for validation' }
      }

      const concentration = customer.customerConcentrationRisk
      const renewalRate = customer.contractRenewalRate
      const contractLength = customer.averageContractLength

      // High concentration risk should have strong contract terms
      if (concentration === 'high' && (renewalRate < 80 || contractLength < 12)) {
        return {
          passed: false,
          message: 'High customer concentration risk not mitigated by strong contract terms',
          affectedFields: ['customerRiskAnalysis.contractRenewalRate', 'customerRiskAnalysis.averageContractLength'],
          suggestedAction: 'Improve contract terms or diversify customer base'
        }
      }

      return { passed: true, message: 'Customer concentration risk appropriately managed' }
    }
  },

  // Technology Investment vs. Advantage
  {
    id: 'technology-investment-advantage',
    name: 'Technology Investment vs. Advantage',
    description: 'Technology investments should support competitive advantage claims',
    category: 'consistency',
    severity: 'warning',
    sections: ['competitive-market', 'operational-scalability'],
    validate: (data) => {
      const competitive = data.professional?.competitiveMarket
      const scalability = data.enterprise?.operationalScalability

      if (!competitive || !scalability) {
        return { passed: true, message: 'Insufficient data for validation' }
      }

      const techAdvantage = competitive.technologyAdvantage
      const techInvestment = scalability.technologyInvestmentThreeYear

      // Leading technology should be supported by investment
      if (techAdvantage === 'leading' && techInvestment < 100000) {
        return {
          passed: false,
          message: 'Leading technology advantage not supported by significant investment',
          affectedFields: ['competitiveMarket.technologyAdvantage', 'operationalScalability.technologyInvestmentThreeYear'],
          suggestedAction: 'Increase technology investment or revise advantage assessment'
        }
      }

      return { passed: true, message: 'Technology investment aligns with competitive position' }
    }
  }
]

/**
 * Cross-section validation engine
 */
export class CrossSectionValidator {
  private rules: ValidationRule[]

  constructor(customRules: ValidationRule[] = []) {
    this.rules = [...VALIDATION_RULES, ...customRules]
  }

  /**
   * Validate all cross-section rules
   */
  validate(data: CrossSectionData): CrossSectionValidationResult {
    const results: { rule: ValidationRule; result: ValidationRuleResult }[] = []

    // Execute all rules
    for (const rule of this.rules) {
      try {
        const result = rule.validate(data)
        results.push({ rule, result })
      } catch (error) {
        results.push({
          rule,
          result: {
            passed: false,
            message: `Rule execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            suggestedAction: 'Review rule implementation'
          }
        })
      }
    }

    // Categorize results
    const errors = results.filter(r => !r.result.passed && r.rule.severity === 'error').map(r => r.result)
    const warnings = results.filter(r => !r.result.passed && r.rule.severity === 'warning').map(r => r.result)
    const info = results.filter(r => !r.result.passed && r.rule.severity === 'info').map(r => r.result)

    // Calculate summary statistics
    const totalRules = results.length
    const passedRules = results.filter(r => r.result.passed).length
    const failedRules = totalRules - passedRules

    const byCategory = this.calculateCategoryStats(results)
    const bySeverity = {
      error: errors.length,
      warning: warnings.length,
      info: info.length
    }

    // Calculate overall score (0-100)
    const score = Math.round((passedRules / totalRules) * 100)

    // Generate recommendations and critical issues
    const recommendations = this.generateRecommendations(results)
    const criticalIssues = this.identifyCriticalIssues(results)

    return {
      isValid: errors.length === 0,
      score,
      errors,
      warnings,
      info,
      summary: {
        totalRules,
        passedRules,
        failedRules,
        byCategory,
        bySeverity
      },
      recommendations,
      criticalIssues
    }
  }

  /**
   * Validate specific rule by ID
   */
  validateRule(ruleId: string, data: CrossSectionData): ValidationRuleResult | null {
    const rule = this.rules.find(r => r.id === ruleId)
    if (!rule) return null

    try {
      return rule.validate(data)
    } catch (error) {
      return {
        passed: false,
        message: `Rule execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestedAction: 'Review rule implementation'
      }
    }
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category: string): ValidationRule[] {
    return this.rules.filter(r => r.category === category)
  }

  /**
   * Get rules by severity
   */
  getRulesBySeverity(severity: string): ValidationRule[] {
    return this.rules.filter(r => r.severity === severity)
  }

  /**
   * Get rules affecting specific sections
   */
  getRulesForSections(sections: string[]): ValidationRule[] {
    return this.rules.filter(r =>
      r.sections.some(section => sections.includes(section))
    )
  }

  /**
   * Add custom rule
   */
  addRule(rule: ValidationRule): void {
    this.rules.push(rule)
  }

  /**
   * Remove rule by ID
   */
  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(r => r.id === ruleId)
    if (index !== -1) {
      this.rules.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Private helper methods
   */
  private calculateCategoryStats(results: { rule: ValidationRule; result: ValidationRuleResult }[]) {
    const categories = ['consistency', 'business_logic', 'regulatory', 'best_practice']
    const stats: Record<string, { passed: number; failed: number }> = {}

    for (const category of categories) {
      const categoryResults = results.filter(r => r.rule.category === category)
      stats[category] = {
        passed: categoryResults.filter(r => r.result.passed).length,
        failed: categoryResults.filter(r => !r.result.passed).length
      }
    }

    return stats
  }

  private generateRecommendations(results: { rule: ValidationRule; result: ValidationRuleResult }[]): string[] {
    const recommendations: string[] = []

    // Priority recommendations based on errors
    const errors = results.filter(r => !r.result.passed && r.rule.severity === 'error')
    if (errors.length > 0) {
      recommendations.push(`Address ${errors.length} critical validation error(s) before proceeding`)
    }

    // Category-specific recommendations
    const consistencyIssues = results.filter(r =>
      !r.result.passed && r.rule.category === 'consistency'
    ).length

    if (consistencyIssues > 0) {
      recommendations.push(`Resolve ${consistencyIssues} data consistency issue(s) across sections`)
    }

    // Common issues
    const commonActions = results
      .filter(r => !r.result.passed && r.result.suggestedAction)
      .map(r => r.result.suggestedAction!)
      .reduce((acc, action) => {
        acc[action] = (acc[action] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const topActions = Object.entries(commonActions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([action]) => action)

    recommendations.push(...topActions)

    return recommendations.slice(0, 5) // Limit to top 5 recommendations
  }

  private identifyCriticalIssues(results: { rule: ValidationRule; result: ValidationRuleResult }[]): string[] {
    const criticalIssues: string[] = []

    // Regulatory violations
    const regulatoryViolations = results.filter(r =>
      !r.result.passed && r.rule.category === 'regulatory'
    )

    if (regulatoryViolations.length > 0) {
      criticalIssues.push('Regulatory compliance issues detected')
    }

    // Multiple consistency failures
    const consistencyFailures = results.filter(r =>
      !r.result.passed && r.rule.category === 'consistency'
    ).length

    if (consistencyFailures > 3) {
      criticalIssues.push('Widespread data consistency issues')
    }

    // Business logic violations
    const businessLogicViolations = results.filter(r =>
      !r.result.passed && r.rule.category === 'business_logic'
    ).length

    if (businessLogicViolations > 2) {
      criticalIssues.push('Multiple business logic violations')
    }

    return criticalIssues
  }
}

/**
 * Utility functions
 */
export const createCrossSectionValidator = (customRules?: ValidationRule[]): CrossSectionValidator => {
  return new CrossSectionValidator(customRules)
}

export const getValidationRules = (): ValidationRule[] => {
  return [...VALIDATION_RULES]
}

export const getValidationRuleById = (ruleId: string): ValidationRule | undefined => {
  return VALIDATION_RULES.find(r => r.id === ruleId)
}

/**
 * Type exports
 */
export type {
  ValidationRule,
  ValidationRuleResult,
  CrossSectionData,
  CrossSectionValidationResult
}