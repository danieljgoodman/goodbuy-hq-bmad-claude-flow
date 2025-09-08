import type { HealthDimension, HealthComponent } from '@/types/health-analysis'
import type { BusinessData } from '@/types/evaluation'

export class FinancialHealthAnalyzer {
  private businessData: BusinessData

  constructor(businessData: BusinessData) {
    this.businessData = businessData
  }

  calculateFinancialHealth(): HealthDimension {
    const components = this.calculateComponents()
    const overallScore = this.calculateWeightedScore(components)
    
    return {
      id: 'financial-health',
      dimension: 'financial',
      score: overallScore,
      weight: 0.35, // 35% weight in overall health score
      confidence: this.calculateConfidence(components),
      components,
      benchmarkComparison: this.getBenchmarkComparison(),
      trendDirection: this.analyzeTrendDirection(),
      keyInsights: this.generateKeyInsights(components),
      criticalFactors: this.identifyCriticalFactors(components)
    }
  }

  private calculateComponents(): HealthComponent[] {
    const components: HealthComponent[] = []

    // Profitability metrics
    components.push(this.calculateProfitabilityComponent())
    
    // Liquidity metrics
    components.push(this.calculateLiquidityComponent())
    
    // Growth metrics
    components.push(this.calculateGrowthComponent())
    
    // Efficiency metrics
    components.push(this.calculateEfficiencyComponent())
    
    // Leverage metrics
    components.push(this.calculateLeverageComponent())

    return components
  }

  private calculateProfitabilityComponent(): HealthComponent {
    const netMargin = this.calculateNetMargin()
    const grossMargin = this.businessData.grossMargin
    
    // Score based on profitability benchmarks
    const profitabilityScore = this.scoreProfitability(netMargin, grossMargin)
    
    return {
      id: 'profitability',
      name: 'Profitability',
      category: 'Financial Performance',
      score: profitabilityScore,
      weight: 0.3,
      value: netMargin,
      benchmarkValue: this.getIndustryBenchmark('net_margin'),
      impact: netMargin > this.getIndustryBenchmark('net_margin') ? 'positive' : 'negative',
      description: 'Business ability to generate profit from operations',
      improvementPotential: Math.max(0, 85 - profitabilityScore)
    }
  }

  private calculateLiquidityComponent(): HealthComponent {
    const monthlyBurnRate = this.businessData.expenses / 12
    const cashFlowRatio = this.businessData.cashFlow / monthlyBurnRate
    
    const liquidityScore = this.scoreLiquidity(cashFlowRatio)
    
    return {
      id: 'liquidity',
      name: 'Liquidity',
      category: 'Financial Stability',
      score: liquidityScore,
      weight: 0.25,
      value: cashFlowRatio,
      benchmarkValue: 6, // 6 months of expenses
      impact: cashFlowRatio > 6 ? 'positive' : 'negative',
      description: 'Business ability to meet short-term obligations',
      improvementPotential: Math.max(0, 85 - liquidityScore)
    }
  }

  private calculateGrowthComponent(): HealthComponent {
    // Estimate growth based on revenue vs expenses ratio
    const growthIndicator = this.businessData.annualRevenue / this.businessData.expenses
    const growthScore = this.scoreGrowth(growthIndicator)
    
    return {
      id: 'financial-growth',
      name: 'Financial Growth',
      category: 'Growth Metrics',
      score: growthScore,
      weight: 0.2,
      value: growthIndicator,
      benchmarkValue: 1.2,
      impact: growthIndicator > 1.2 ? 'positive' : 'negative',
      description: 'Revenue growth sustainability and trajectory',
      improvementPotential: Math.max(0, 80 - growthScore)
    }
  }

  private calculateEfficiencyComponent(): HealthComponent {
    const revenuePerEmployee = this.businessData.employeeCount > 0 
      ? this.businessData.annualRevenue / this.businessData.employeeCount 
      : this.businessData.annualRevenue
    
    const efficiencyScore = this.scoreEfficiency(revenuePerEmployee)
    
    return {
      id: 'efficiency',
      name: 'Operational Efficiency',
      category: 'Efficiency Metrics',
      score: efficiencyScore,
      weight: 0.15,
      value: revenuePerEmployee,
      benchmarkValue: this.getIndustryBenchmark('revenue_per_employee'),
      impact: revenuePerEmployee > this.getIndustryBenchmark('revenue_per_employee') ? 'positive' : 'negative',
      description: 'Revenue generation efficiency per resource unit',
      improvementPotential: Math.max(0, 75 - efficiencyScore)
    }
  }

  private calculateLeverageComponent(): HealthComponent {
    const debtToAssetRatio = this.businessData.assets > 0 
      ? this.businessData.liabilities / this.businessData.assets 
      : 0
    
    const leverageScore = this.scoreLeverage(debtToAssetRatio)
    
    return {
      id: 'leverage',
      name: 'Financial Leverage',
      category: 'Risk Metrics',
      score: leverageScore,
      weight: 0.1,
      value: debtToAssetRatio,
      benchmarkValue: 0.4,
      impact: debtToAssetRatio < 0.4 ? 'positive' : 'negative',
      description: 'Business financial leverage and risk exposure',
      improvementPotential: Math.max(0, 70 - leverageScore)
    }
  }

  private calculateNetMargin(): number {
    const profit = this.businessData.annualRevenue - this.businessData.expenses
    return this.businessData.annualRevenue > 0 ? (profit / this.businessData.annualRevenue) * 100 : 0
  }

  private scoreProfitability(netMargin: number, grossMargin: number): number {
    // Industry-specific profitability scoring
    let score = 0
    
    // Net margin scoring (0-50 points)
    if (netMargin >= 20) score += 50
    else if (netMargin >= 15) score += 40
    else if (netMargin >= 10) score += 30
    else if (netMargin >= 5) score += 20
    else if (netMargin >= 0) score += 10
    
    // Gross margin scoring (0-50 points)
    if (grossMargin >= 60) score += 50
    else if (grossMargin >= 40) score += 40
    else if (grossMargin >= 30) score += 30
    else if (grossMargin >= 20) score += 20
    else if (grossMargin >= 10) score += 10
    
    return Math.min(100, score)
  }

  private scoreLiquidity(cashFlowRatio: number): number {
    if (cashFlowRatio >= 12) return 100
    if (cashFlowRatio >= 6) return 80
    if (cashFlowRatio >= 3) return 60
    if (cashFlowRatio >= 1) return 40
    if (cashFlowRatio >= 0) return 20
    return 0
  }

  private scoreGrowth(growthIndicator: number): number {
    if (growthIndicator >= 2.0) return 90
    if (growthIndicator >= 1.5) return 75
    if (growthIndicator >= 1.2) return 65
    if (growthIndicator >= 1.0) return 50
    if (growthIndicator >= 0.8) return 30
    return 15
  }

  private scoreEfficiency(revenuePerEmployee: number): number {
    const benchmark = this.getIndustryBenchmark('revenue_per_employee')
    const ratio = revenuePerEmployee / benchmark
    
    if (ratio >= 1.5) return 90
    if (ratio >= 1.2) return 75
    if (ratio >= 1.0) return 65
    if (ratio >= 0.8) return 50
    if (ratio >= 0.6) return 30
    return 15
  }

  private scoreLeverage(debtToAssetRatio: number): number {
    // Lower leverage is generally better
    if (debtToAssetRatio <= 0.2) return 90
    if (debtToAssetRatio <= 0.4) return 75
    if (debtToAssetRatio <= 0.6) return 55
    if (debtToAssetRatio <= 0.8) return 35
    return 15
  }

  private calculateWeightedScore(components: HealthComponent[]): number {
    const totalWeight = components.reduce((sum, comp) => sum + comp.weight, 0)
    const weightedSum = components.reduce((sum, comp) => sum + (comp.score * comp.weight), 0)
    return Math.round(weightedSum / totalWeight)
  }

  private calculateConfidence(components: HealthComponent[]): number {
    // Confidence based on data completeness and reliability
    let confidence = 85 // Base confidence
    
    // Reduce confidence if missing key financial data
    if (this.businessData.annualRevenue === 0) confidence -= 15
    if (this.businessData.expenses === 0) confidence -= 10
    if (this.businessData.assets === 0) confidence -= 5
    
    return Math.max(50, confidence)
  }

  private getBenchmarkComparison() {
    // This would be replaced with actual industry data
    return {
      industryAverage: 72,
      percentile: 65,
      quartile: 3
    }
  }

  private analyzeTrendDirection(): 'improving' | 'stable' | 'declining' {
    // Simplified trend analysis - would use historical data in real implementation
    const netMargin = this.calculateNetMargin()
    const cashFlowRatio = this.businessData.cashFlow / (this.businessData.expenses / 12)
    
    if (netMargin > 15 && cashFlowRatio > 6) return 'improving'
    if (netMargin < 0 || cashFlowRatio < 1) return 'declining'
    return 'stable'
  }

  private generateKeyInsights(components: HealthComponent[]): string[] {
    const insights: string[] = []
    const netMargin = this.calculateNetMargin()
    
    if (netMargin > 15) {
      insights.push('Strong profitability indicates healthy business operations')
    } else if (netMargin < 5) {
      insights.push('Low profit margins may indicate pricing or cost management challenges')
    }
    
    const liquidityComponent = components.find(c => c.id === 'liquidity')
    if (liquidityComponent && liquidityComponent.score < 50) {
      insights.push('Cash flow management needs attention to ensure operational stability')
    }
    
    return insights
  }

  private identifyCriticalFactors(components: HealthComponent[]): string[] {
    const critical: string[] = []
    
    components.forEach(comp => {
      if (comp.score < 40 && comp.weight > 0.2) {
        critical.push(`${comp.name}: ${comp.description}`)
      }
    })
    
    return critical
  }

  private getIndustryBenchmark(metric: string): number {
    // This would be replaced with actual industry benchmark data
    const benchmarks: { [key: string]: number } = {
      'net_margin': 12,
      'revenue_per_employee': 150000,
      'current_ratio': 2.0,
      'debt_to_equity': 0.4
    }
    
    return benchmarks[metric] || 0
  }
}