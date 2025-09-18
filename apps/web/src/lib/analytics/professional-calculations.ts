// Professional Tier Analytics Calculation Utilities
// Provides comprehensive business intelligence calculations for Professional tier

import type {
  FinancialTrendData,
  MultiYearFinancialData,
  CustomerRiskData,
  CustomerConcentrationAnalysis,
  CompetitiveMetric,
  CompetitivePositioning,
  InvestmentScenario,
  ROICalculation,
  InvestmentAnalysis,
  CapacityMetric,
  OperationalCapacityData,
  ProfessionalInsight
} from '@/types/professional-dashboard'

// Financial Trend Calculations
export class FinancialAnalytics {
  /**
   * Calculate growth rates between periods
   */
  static calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  /**
   * Calculate compound annual growth rate (CAGR)
   */
  static calculateCAGR(beginningValue: number, endingValue: number, periods: number): number {
    if (beginningValue === 0 || periods === 0) return 0
    return (Math.pow(endingValue / beginningValue, 1 / periods) - 1) * 100
  }

  /**
   * Calculate volatility index based on revenue fluctuations
   */
  static calculateVolatilityIndex(data: FinancialTrendData[]): number {
    if (data.length < 2) return 0

    const growthRates = data.slice(1).map((item, index) =>
      this.calculateGrowthRate(item.revenue, data[index].revenue)
    )

    const mean = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length
    const variance = growthRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / growthRates.length

    return Math.sqrt(variance)
  }

  /**
   * Generate financial projections based on historical trends
   */
  static generateProjections(historicalData: FinancialTrendData[], yearsToProject: number): FinancialTrendData[] {
    if (historicalData.length < 2) return []

    const latestYear = historicalData[historicalData.length - 1]
    const avgGrowthRates = {
      revenue: this.calculateAverageGrowthRate(historicalData, 'revenue'),
      profit: this.calculateAverageGrowthRate(historicalData, 'profit'),
      cashFlow: this.calculateAverageGrowthRate(historicalData, 'cashFlow')
    }

    const projections: FinancialTrendData[] = []
    let lastValues = { ...latestYear }

    for (let i = 1; i <= yearsToProject; i++) {
      const projectedRevenue = lastValues.revenue * (1 + avgGrowthRates.revenue / 100)
      const projectedProfit = lastValues.profit * (1 + avgGrowthRates.profit / 100)
      const projectedCashFlow = lastValues.cashFlow * (1 + avgGrowthRates.cashFlow / 100)

      const projection: FinancialTrendData = {
        year: latestYear.year + i,
        revenue: projectedRevenue,
        profit: projectedProfit,
        cashFlow: projectedCashFlow,
        growthRate: {
          revenue: avgGrowthRates.revenue,
          profit: avgGrowthRates.profit,
          cashFlow: avgGrowthRates.cashFlow
        }
      }

      projections.push(projection)
      lastValues = projection
    }

    return projections
  }

  private static calculateAverageGrowthRate(data: FinancialTrendData[], metric: keyof Omit<FinancialTrendData, 'year' | 'growthRate'>): number {
    if (data.length < 2) return 0

    const growthRates = data.slice(1).map((item, index) =>
      this.calculateGrowthRate(item[metric], data[index][metric])
    )

    return growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length
  }
}

// Customer Risk Analysis
export class CustomerRiskAnalytics {
  /**
   * Calculate customer concentration risk score
   */
  static calculateConcentrationRisk(customers: CustomerRiskData[]): number {
    const sortedCustomers = customers.sort((a, b) => b.revenueContribution - a.revenueContribution)
    const top5Percentage = sortedCustomers.slice(0, 5).reduce((sum, customer) => sum + customer.percentageOfTotal, 0)

    // Risk increases exponentially with concentration
    if (top5Percentage > 80) return 95
    if (top5Percentage > 60) return 80
    if (top5Percentage > 40) return 65
    if (top5Percentage > 30) return 50
    return 25
  }

  /**
   * Calculate diversification score (inverse of concentration)
   */
  static calculateDiversificationScore(customers: CustomerRiskData[]): number {
    const herfindahlIndex = customers.reduce((sum, customer) =>
      sum + Math.pow(customer.percentageOfTotal, 2), 0
    )

    // Convert to 0-100 scale where 100 is perfectly diversified
    return Math.max(0, 100 - (herfindahlIndex / 100))
  }

  /**
   * Identify risk patterns and generate insights
   */
  static generateRiskInsights(analysis: CustomerConcentrationAnalysis): ProfessionalInsight[] {
    const insights: ProfessionalInsight[] = []

    // High concentration warning
    if (analysis.topCustomersRisk.top5Percentage > 50) {
      insights.push({
        id: 'high-concentration-risk',
        category: 'risk',
        title: 'High Customer Concentration Risk',
        description: `Top 5 customers represent ${analysis.topCustomersRisk.top5Percentage.toFixed(1)}% of revenue`,
        severity: 'critical',
        confidence: 95,
        impact: 'high',
        actionRequired: true,
        recommendations: [
          'Diversify customer base through targeted marketing',
          'Develop customer retention strategies for key accounts',
          'Establish backup revenue streams'
        ],
        dataSource: ['customer_revenue_data'],
        generatedAt: new Date()
      })
    }

    // Payment risk assessment
    const poorPaymentCustomers = analysis.customers.filter(c => c.paymentHistory === 'poor')
    if (poorPaymentCustomers.length > 0) {
      const riskRevenue = poorPaymentCustomers.reduce((sum, customer) => sum + customer.revenueContribution, 0)

      insights.push({
        id: 'payment-risk',
        category: 'risk',
        title: 'Payment Risk Detected',
        description: `${poorPaymentCustomers.length} customers with poor payment history representing $${riskRevenue.toLocaleString()}`,
        severity: 'warning',
        confidence: 85,
        impact: 'medium',
        actionRequired: true,
        recommendations: [
          'Implement stricter payment terms for high-risk customers',
          'Consider credit insurance for large accounts',
          'Regular payment follow-ups'
        ],
        dataSource: ['payment_history'],
        generatedAt: new Date()
      })
    }

    return insights
  }
}

// Competitive Analysis
export class CompetitiveAnalytics {
  /**
   * Calculate weighted competitive score
   */
  static calculateCompetitiveScore(metrics: CompetitiveMetric[]): number {
    const totalWeight = metrics.reduce((sum, metric) => sum + metric.weight, 0)
    const weightedScore = metrics.reduce((sum, metric) => {
      const normalizedScore = (metric.companyScore / metric.topPerformerScore) * 100
      return sum + (normalizedScore * metric.weight)
    }, 0)

    return totalWeight > 0 ? weightedScore / totalWeight : 0
  }

  /**
   * Determine market position based on competitive analysis
   */
  static determineMarketPosition(overallScore: number, ranking: number, totalCompetitors: number): CompetitivePositioning['overallPosition']['marketPosition'] {
    const percentile = (totalCompetitors - ranking + 1) / totalCompetitors * 100

    if (percentile >= 90 && overallScore >= 80) return 'leader'
    if (percentile >= 70 && overallScore >= 65) return 'challenger'
    if (percentile >= 40) return 'follower'
    return 'niche'
  }

  /**
   * Identify competitive strengths and weaknesses
   */
  static analyzeStrengthsWeaknesses(metrics: CompetitiveMetric[]): {
    strengths: string[]
    weaknesses: string[]
  } {
    const strengths: string[] = []
    const weaknesses: string[] = []

    metrics.forEach(metric => {
      const relativePerformance = (metric.companyScore / metric.industryAverage) * 100

      if (relativePerformance >= 120) {
        strengths.push(`${metric.metric}: ${relativePerformance.toFixed(0)}% above industry average`)
      } else if (relativePerformance <= 80) {
        weaknesses.push(`${metric.metric}: ${(100 - relativePerformance).toFixed(0)}% below industry average`)
      }
    })

    return { strengths, weaknesses }
  }
}

// Investment ROI Calculations
export class InvestmentAnalytics {
  /**
   * Calculate Net Present Value (NPV)
   */
  static calculateNPV(cashFlows: number[], discountRate: number): number {
    return cashFlows.reduce((npv, cashFlow, index) => {
      return npv + cashFlow / Math.pow(1 + discountRate, index)
    }, 0)
  }

  /**
   * Calculate Internal Rate of Return (IRR)
   */
  static calculateIRR(cashFlows: number[]): number {
    // Newton-Raphson method for IRR calculation
    let rate = 0.1 // Initial guess
    const tolerance = 0.0001
    const maxIterations = 100

    for (let i = 0; i < maxIterations; i++) {
      const npv = this.calculateNPV(cashFlows, rate)
      const derivativeNPV = cashFlows.reduce((sum, cashFlow, index) => {
        return sum - index * cashFlow / Math.pow(1 + rate, index + 1)
      }, 0)

      const newRate = rate - npv / derivativeNPV

      if (Math.abs(newRate - rate) < tolerance) {
        return newRate * 100 // Convert to percentage
      }

      rate = newRate
    }

    return rate * 100
  }

  /**
   * Calculate payback period
   */
  static calculatePaybackPeriod(initialInvestment: number, annualCashFlow: number): number {
    if (annualCashFlow <= 0) return Infinity
    return initialInvestment / annualCashFlow
  }

  /**
   * Calculate risk-adjusted return
   */
  static calculateRiskAdjustedReturn(expectedReturn: number, riskLevel: InvestmentScenario['riskLevel']): number {
    const riskMultipliers = {
      low: 0.95,
      medium: 0.85,
      high: 0.70
    }

    return expectedReturn * riskMultipliers[riskLevel]
  }

  /**
   * Generate portfolio optimization recommendations
   */
  static optimizePortfolio(calculations: ROICalculation[]): InvestmentAnalysis['portfolioOptimization'] {
    // Simple optimization based on risk-adjusted returns
    const totalRiskAdjustedReturn = calculations.reduce((sum, calc) => sum + calc.riskAdjustedReturn, 0)

    const recommendedMix = calculations.map(calc => ({
      scenarioId: calc.scenario.id,
      allocation: (calc.riskAdjustedReturn / totalRiskAdjustedReturn) * 100
    }))

    const expectedPortfolioROI = calculations.reduce((sum, calc, index) => {
      return sum + (calc.projectedROI * recommendedMix[index].allocation / 100)
    }, 0)

    const averageRiskScore = calculations.reduce((sum, calc) => {
      const riskScores = { low: 25, medium: 50, high: 75 }
      return sum + riskScores[calc.scenario.riskLevel]
    }, 0) / calculations.length

    return {
      recommendedMix,
      expectedPortfolioROI,
      riskScore: averageRiskScore
    }
  }
}

// Operational Capacity Analysis
export class OperationalAnalytics {
  /**
   * Calculate overall utilization rate
   */
  static calculateOverallUtilization(metrics: CapacityMetric[]): number {
    if (metrics.length === 0) return 0

    const totalCurrent = metrics.reduce((sum, metric) => sum + metric.currentCapacity, 0)
    const totalMaximum = metrics.reduce((sum, metric) => sum + metric.maximumCapacity, 0)

    return totalMaximum > 0 ? (totalCurrent / totalMaximum) * 100 : 0
  }

  /**
   * Identify bottlenecks based on utilization and efficiency
   */
  static identifyBottlenecks(metrics: CapacityMetric[]): OperationalCapacityData['bottlenecks'] {
    return metrics
      .filter(metric => metric.utilizationRate > 85 || metric.efficiency < 70)
      .map(metric => {
        let severity: 'minor' | 'moderate' | 'severe' | 'critical'

        if (metric.utilizationRate > 95 && metric.efficiency < 50) {
          severity = 'critical'
        } else if (metric.utilizationRate > 90 || metric.efficiency < 60) {
          severity = 'severe'
        } else if (metric.utilizationRate > 85 || metric.efficiency < 70) {
          severity = 'moderate'
        } else {
          severity = 'minor'
        }

        const impact = (metric.utilizationRate / 100) * (1 - metric.efficiency / 100) * 100

        return {
          department: metric.department,
          severity,
          impact,
          suggestedActions: this.generateBottleneckActions(metric, severity)
        }
      })
      .sort((a, b) => b.impact - a.impact)
  }

  /**
   * Calculate potential operational improvements
   */
  static calculateOptimizationPotential(metrics: CapacityMetric[]): {
    potentialImprovement: number
    quickWins: string[]
    longTermStrategy: string[]
  } {
    const currentEfficiency = metrics.reduce((sum, metric) => sum + metric.efficiency, 0) / metrics.length
    const potentialImprovement = 85 - currentEfficiency // Assuming 85% is optimal

    const quickWins: string[] = []
    const longTermStrategy: string[] = []

    metrics.forEach(metric => {
      if (metric.efficiency < 70) {
        quickWins.push(`Improve ${metric.department} efficiency through process optimization`)
      }

      if (metric.utilizationRate > 90) {
        longTermStrategy.push(`Expand ${metric.department} capacity through investment or automation`)
      }
    })

    return {
      potentialImprovement: Math.max(0, potentialImprovement),
      quickWins,
      longTermStrategy
    }
  }

  private static generateBottleneckActions(metric: CapacityMetric, severity: string): string[] {
    const actions: string[] = []

    if (metric.utilizationRate > 90) {
      actions.push('Consider increasing capacity or redistributing workload')
    }

    if (metric.efficiency < 70) {
      actions.push('Analyze and optimize current processes')
      actions.push('Provide additional training to improve efficiency')
    }

    if (severity === 'critical') {
      actions.push('Immediate intervention required to prevent system failure')
      actions.push('Escalate to senior management for resource allocation')
    }

    return actions
  }
}

// Data Quality Assessment
export class DataQualityAnalytics {
  /**
   * Assess overall data quality for professional dashboard
   */
  static assessDataQuality(data: any): {
    completeness: number
    accuracy: number
    freshness: number
    overallScore: number
  } {
    const completeness = this.calculateCompleteness(data)
    const accuracy = this.calculateAccuracy(data)
    const freshness = this.calculateFreshness(data)

    const overallScore = (completeness + accuracy + freshness) / 3

    return {
      completeness,
      accuracy,
      freshness,
      overallScore
    }
  }

  private static calculateCompleteness(data: any): number {
    // Simple completeness check - count non-null fields
    const flatten = (obj: any): any[] => {
      const result: any[] = []
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          result.push(...flatten(obj[key]))
        } else {
          result.push(obj[key])
        }
      }
      return result
    }

    const values = flatten(data)
    const nonNullValues = values.filter(value => value != null && value !== '')

    return values.length > 0 ? (nonNullValues.length / values.length) * 100 : 0
  }

  private static calculateAccuracy(data: any): number {
    // Basic accuracy heuristics
    let accuracyScore = 100

    // Check for negative values where they shouldn't be
    if (data.financial?.trends) {
      data.financial.trends.forEach((trend: FinancialTrendData) => {
        if (trend.revenue < 0 || trend.profit < 0) {
          accuracyScore -= 10
        }
      })
    }

    // Check for unrealistic growth rates
    if (data.financial?.trends) {
      data.financial.trends.forEach((trend: FinancialTrendData) => {
        if (Math.abs(trend.growthRate.revenue) > 1000) {
          accuracyScore -= 20
        }
      })
    }

    return Math.max(0, accuracyScore)
  }

  private static calculateFreshness(data: any): number {
    if (!data.lastUpdated) return 50

    const now = new Date()
    const lastUpdate = new Date(data.lastUpdated)
    const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceUpdate <= 1) return 100
    if (daysSinceUpdate <= 7) return 80
    if (daysSinceUpdate <= 30) return 60
    if (daysSinceUpdate <= 90) return 40
    return 20
  }
}