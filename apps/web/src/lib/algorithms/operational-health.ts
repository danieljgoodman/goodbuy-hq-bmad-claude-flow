import type { HealthDimension, HealthComponent } from '@/types/health-analysis'
import type { BusinessData } from '@/types/evaluation'

export class OperationalHealthAnalyzer {
  private businessData: BusinessData

  constructor(businessData: BusinessData) {
    this.businessData = businessData
  }

  calculateOperationalHealth(): HealthDimension {
    const components = this.calculateComponents()
    const overallScore = this.calculateWeightedScore(components)
    
    return {
      id: 'operational-health',
      dimension: 'operational',
      score: overallScore,
      weight: 0.25, // 25% weight in overall health score
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

    // Productivity metrics
    components.push(this.calculateProductivityComponent())
    
    // Process efficiency
    components.push(this.calculateProcessEfficiencyComponent())
    
    // Resource utilization
    components.push(this.calculateResourceUtilizationComponent())
    
    // Scalability indicators
    components.push(this.calculateScalabilityComponent())
    
    // Quality metrics
    components.push(this.calculateQualityComponent())

    return components
  }

  private calculateProductivityComponent(): HealthComponent {
    const revenuePerEmployee = this.businessData.employeeCount > 0 
      ? this.businessData.annualRevenue / this.businessData.employeeCount 
      : this.businessData.annualRevenue

    const productivityScore = this.scoreProductivity(revenuePerEmployee)
    
    return {
      id: 'productivity',
      name: 'Employee Productivity',
      category: 'Operational Performance',
      score: productivityScore,
      weight: 0.3,
      value: revenuePerEmployee,
      benchmarkValue: this.getIndustryBenchmark('productivity'),
      impact: revenuePerEmployee > this.getIndustryBenchmark('productivity') ? 'positive' : 'negative',
      description: 'Revenue generation efficiency per employee',
      improvementPotential: Math.max(0, 85 - productivityScore)
    }
  }

  private calculateProcessEfficiencyComponent(): HealthComponent {
    // Calculate process efficiency based on cost structure
    const operatingEfficiency = this.businessData.annualRevenue > 0 
      ? (1 - (this.businessData.expenses / this.businessData.annualRevenue)) * 100 
      : 0

    const efficiencyScore = this.scoreProcessEfficiency(operatingEfficiency)
    
    return {
      id: 'process-efficiency',
      name: 'Process Efficiency',
      category: 'Operational Excellence',
      score: efficiencyScore,
      weight: 0.25,
      value: operatingEfficiency,
      benchmarkValue: 25, // 25% operating margin benchmark
      impact: operatingEfficiency > 25 ? 'positive' : 'negative',
      description: 'Operational process optimization and cost management',
      improvementPotential: Math.max(0, 80 - efficiencyScore)
    }
  }

  private calculateResourceUtilizationComponent(): HealthComponent {
    // Asset turnover as a proxy for resource utilization
    const assetTurnover = this.businessData.assets > 0 
      ? this.businessData.annualRevenue / this.businessData.assets 
      : 0

    const utilizationScore = this.scoreResourceUtilization(assetTurnover)
    
    return {
      id: 'resource-utilization',
      name: 'Resource Utilization',
      category: 'Asset Management',
      score: utilizationScore,
      weight: 0.2,
      value: assetTurnover,
      benchmarkValue: 1.5,
      impact: assetTurnover > 1.5 ? 'positive' : 'negative',
      description: 'Efficiency of asset and resource deployment',
      improvementPotential: Math.max(0, 75 - utilizationScore)
    }
  }

  private calculateScalabilityComponent(): HealthComponent {
    // Scalability based on business model and operational structure
    const scalabilityScore = this.scoreScalability()
    
    return {
      id: 'scalability',
      name: 'Operational Scalability',
      category: 'Growth Enablement',
      score: scalabilityScore,
      weight: 0.15,
      value: scalabilityScore,
      benchmarkValue: 70,
      impact: scalabilityScore > 70 ? 'positive' : 'neutral',
      description: 'Ability to scale operations efficiently',
      improvementPotential: Math.max(0, 85 - scalabilityScore)
    }
  }

  private calculateQualityComponent(): HealthComponent {
    // Quality metrics based on competitive advantages and market position
    const qualityScore = this.scoreQuality()
    
    return {
      id: 'quality',
      name: 'Operational Quality',
      category: 'Service Excellence',
      score: qualityScore,
      weight: 0.1,
      value: qualityScore,
      benchmarkValue: 75,
      impact: qualityScore > 75 ? 'positive' : 'neutral',
      description: 'Quality of products, services, and operations',
      improvementPotential: Math.max(0, 90 - qualityScore)
    }
  }

  private scoreProductivity(revenuePerEmployee: number): number {
    const benchmark = this.getIndustryBenchmark('productivity')
    const ratio = revenuePerEmployee / benchmark
    
    if (ratio >= 1.5) return 90
    if (ratio >= 1.2) return 75
    if (ratio >= 1.0) return 65
    if (ratio >= 0.8) return 50
    if (ratio >= 0.6) return 30
    return 15
  }

  private scoreProcessEfficiency(operatingEfficiency: number): number {
    if (operatingEfficiency >= 40) return 90
    if (operatingEfficiency >= 30) return 75
    if (operatingEfficiency >= 20) return 65
    if (operatingEfficiency >= 10) return 50
    if (operatingEfficiency >= 0) return 30
    return 15
  }

  private scoreResourceUtilization(assetTurnover: number): number {
    if (assetTurnover >= 3.0) return 90
    if (assetTurnover >= 2.0) return 75
    if (assetTurnover >= 1.5) return 65
    if (assetTurnover >= 1.0) return 50
    if (assetTurnover >= 0.5) return 30
    return 15
  }

  private scoreScalability(): number {
    let score = 50 // Base score

    // Business model scalability factors
    if (this.businessData.businessModel.includes('saas') || 
        this.businessData.businessModel.includes('software')) {
      score += 25
    }

    if (this.businessData.revenueModel.includes('recurring') ||
        this.businessData.revenueModel.includes('subscription')) {
      score += 15
    }

    // Operational efficiency indicators
    const revenuePerEmployee = this.businessData.employeeCount > 0 
      ? this.businessData.annualRevenue / this.businessData.employeeCount 
      : 0

    if (revenuePerEmployee > 200000) score += 10

    return Math.min(100, score)
  }

  private scoreQuality(): number {
    let score = 60 // Base score

    // Competitive advantages as quality indicators
    const advantageCount = this.businessData.competitiveAdvantages.length
    score += Math.min(20, advantageCount * 5)

    // Market position as quality indicator
    if (this.businessData.marketPosition.includes('leader') || 
        this.businessData.marketPosition.includes('dominant')) {
      score += 15
    } else if (this.businessData.marketPosition.includes('strong')) {
      score += 10
    }

    return Math.min(100, score)
  }

  private calculateWeightedScore(components: HealthComponent[]): number {
    const totalWeight = components.reduce((sum, comp) => sum + comp.weight, 0)
    const weightedSum = components.reduce((sum, comp) => sum + (comp.score * comp.weight), 0)
    return Math.round(weightedSum / totalWeight)
  }

  private calculateConfidence(components: HealthComponent[]): number {
    let confidence = 80 // Base confidence

    // Reduce confidence if missing key operational data
    if (this.businessData.employeeCount === 0) confidence -= 10
    if (this.businessData.assets === 0) confidence -= 8
    if (this.businessData.competitiveAdvantages.length === 0) confidence -= 5

    return Math.max(50, confidence)
  }

  private getBenchmarkComparison() {
    return {
      industryAverage: 68,
      percentile: 72,
      quartile: 3
    }
  }

  private analyzeTrendDirection(): 'improving' | 'stable' | 'declining' {
    const revenuePerEmployee = this.businessData.employeeCount > 0 
      ? this.businessData.annualRevenue / this.businessData.employeeCount 
      : this.businessData.annualRevenue

    const benchmark = this.getIndustryBenchmark('productivity')
    
    if (revenuePerEmployee > benchmark * 1.2) return 'improving'
    if (revenuePerEmployee < benchmark * 0.8) return 'declining'
    return 'stable'
  }

  private generateKeyInsights(components: HealthComponent[]): string[] {
    const insights: string[] = []

    const productivityComp = components.find(c => c.id === 'productivity')
    if (productivityComp && productivityComp.score > 80) {
      insights.push('High productivity levels indicate efficient operations')
    }

    const efficiencyComp = components.find(c => c.id === 'process-efficiency')
    if (efficiencyComp && efficiencyComp.score < 50) {
      insights.push('Process optimization could significantly improve operational efficiency')
    }

    if (this.businessData.competitiveAdvantages.length > 3) {
      insights.push('Multiple competitive advantages provide operational strength')
    }

    return insights
  }

  private identifyCriticalFactors(components: HealthComponent[]): string[] {
    const critical: string[] = []

    components.forEach(comp => {
      if (comp.score < 40 && comp.weight > 0.15) {
        critical.push(`${comp.name}: Requires immediate attention for operational improvement`)
      }
    })

    return critical
  }

  private getIndustryBenchmark(metric: string): number {
    const benchmarks: { [key: string]: number } = {
      'productivity': 180000, // Revenue per employee
      'efficiency': 25, // Operating margin %
      'utilization': 1.5, // Asset turnover
      'quality': 75 // Quality score
    }

    return benchmarks[metric] || 0
  }
}