import type { HealthDimension, HealthComponent } from '@/types/health-analysis'
import type { BusinessData } from '@/types/evaluation'

export class GrowthHealthAnalyzer {
  private businessData: BusinessData

  constructor(businessData: BusinessData) {
    this.businessData = businessData
  }

  calculateGrowthHealth(): HealthDimension {
    const components = this.calculateComponents()
    const overallScore = this.calculateWeightedScore(components)
    
    return {
      id: 'growth-health',
      dimension: 'growth',
      score: overallScore,
      weight: 0.2, // 20% weight in overall health score
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

    // Scalability potential
    components.push(this.calculateScalabilityComponent())
    
    // Market expansion opportunity
    components.push(this.calculateMarketExpansionComponent())
    
    // Innovation capacity
    components.push(this.calculateInnovationComponent())
    
    // Resource adequacy for growth
    components.push(this.calculateResourceAdequacyComponent())
    
    // Growth sustainability
    components.push(this.calculateSustainabilityComponent())

    return components
  }

  private calculateScalabilityComponent(): HealthComponent {
    const scalabilityScore = this.scoreScalability()
    
    return {
      id: 'scalability',
      name: 'Business Scalability',
      category: 'Growth Potential',
      score: scalabilityScore,
      weight: 0.3,
      value: scalabilityScore,
      benchmarkValue: 70,
      impact: scalabilityScore > 70 ? 'positive' : 'neutral',
      description: 'Ability to scale operations without proportional cost increases',
      improvementPotential: Math.max(0, 90 - scalabilityScore)
    }
  }

  private calculateMarketExpansionComponent(): HealthComponent {
    const expansionScore = this.scoreMarketExpansion()
    
    return {
      id: 'market-expansion',
      name: 'Market Expansion Opportunity',
      category: 'Growth Opportunities',
      score: expansionScore,
      weight: 0.25,
      value: expansionScore,
      benchmarkValue: 65,
      impact: expansionScore > 65 ? 'positive' : 'neutral',
      description: 'Opportunities for geographic or demographic expansion',
      improvementPotential: Math.max(0, 85 - expansionScore)
    }
  }

  private calculateInnovationComponent(): HealthComponent {
    const innovationScore = this.scoreInnovationCapacity()
    
    return {
      id: 'innovation',
      name: 'Innovation Capacity',
      category: 'Future Growth',
      score: innovationScore,
      weight: 0.2,
      value: innovationScore,
      benchmarkValue: 60,
      impact: innovationScore > 60 ? 'positive' : 'neutral',
      description: 'Capacity for product and service innovation',
      improvementPotential: Math.max(0, 80 - innovationScore)
    }
  }

  private calculateResourceAdequacyComponent(): HealthComponent {
    const resourceScore = this.scoreResourceAdequacy()
    
    return {
      id: 'resource-adequacy',
      name: 'Resource Adequacy',
      category: 'Growth Enablement',
      score: resourceScore,
      weight: 0.15,
      value: resourceScore,
      benchmarkValue: 70,
      impact: resourceScore > 70 ? 'positive' : 'negative',
      description: 'Adequacy of resources to support growth initiatives',
      improvementPotential: Math.max(0, 85 - resourceScore)
    }
  }

  private calculateSustainabilityComponent(): HealthComponent {
    const sustainabilityScore = this.scoreGrowthSustainability()
    
    return {
      id: 'growth-sustainability',
      name: 'Growth Sustainability',
      category: 'Long-term Viability',
      score: sustainabilityScore,
      weight: 0.1,
      value: sustainabilityScore,
      benchmarkValue: 75,
      impact: sustainabilityScore > 75 ? 'positive' : 'neutral',
      description: 'Sustainability of growth trajectory and business model',
      improvementPotential: Math.max(0, 90 - sustainabilityScore)
    }
  }

  private scoreScalability(): number {
    let score = 50 // Base score

    // Business model scalability factors
    const businessModel = this.businessData.businessModel.toLowerCase()
    const revenueModel = this.businessData.revenueModel.toLowerCase()
    
    // High scalability models
    if (businessModel.includes('saas') || businessModel.includes('software') || 
        businessModel.includes('platform') || businessModel.includes('digital')) {
      score += 25
    } else if (businessModel.includes('service') && 
               (businessModel.includes('consulting') || businessModel.includes('advisory'))) {
      score += 10 // Services are less scalable
    }

    // Revenue model scalability
    if (revenueModel.includes('subscription') || revenueModel.includes('recurring')) {
      score += 20
    } else if (revenueModel.includes('licensing') || revenueModel.includes('royalty')) {
      score += 15
    }

    // Operational scalability indicators
    const revenuePerEmployee = this.businessData.employeeCount > 0 
      ? this.businessData.annualRevenue / this.businessData.employeeCount 
      : 0

    if (revenuePerEmployee > 300000) score += 15
    else if (revenuePerEmployee > 200000) score += 10
    else if (revenuePerEmployee > 150000) score += 5

    return Math.min(100, score)
  }

  private scoreMarketExpansion(): number {
    let score = 40 // Base score

    // Years in business - more established can expand easier
    if (this.businessData.yearsInBusiness > 10) score += 15
    else if (this.businessData.yearsInBusiness > 5) score += 10
    else if (this.businessData.yearsInBusiness > 3) score += 5

    // Market position strength indicates expansion potential
    const position = this.businessData.marketPosition.toLowerCase()
    if (position.includes('leader') || position.includes('strong')) {
      score += 20
    } else if (position.includes('competitive') || position.includes('established')) {
      score += 15
    } else if (position.includes('growing') || position.includes('emerging')) {
      score += 10
    }

    // Channel diversity supports expansion
    const channelCount = this.businessData.primaryChannels.length
    score += Math.min(15, channelCount * 3)

    // Competitive advantages enable expansion
    const advantageCount = this.businessData.competitiveAdvantages.length
    score += Math.min(15, advantageCount * 3)

    return Math.min(100, score)
  }

  private scoreInnovationCapacity(): number {
    let score = 45 // Base score

    // Industry factors
    const industry = this.businessData.industryFocus.toLowerCase()
    if (industry.includes('technology') || industry.includes('software') || 
        industry.includes('biotech') || industry.includes('fintech')) {
      score += 20
    } else if (industry.includes('healthcare') || industry.includes('education') || 
               industry.includes('media')) {
      score += 15
    } else if (industry.includes('manufacturing') || industry.includes('retail')) {
      score += 10
    }

    // Competitive advantages related to innovation
    const advantages = this.businessData.competitiveAdvantages.join(' ').toLowerCase()
    if (advantages.includes('innovation') || advantages.includes('technology') || 
        advantages.includes('r&d') || advantages.includes('proprietary')) {
      score += 20
    }

    // Business model innovation capacity
    const businessModel = this.businessData.businessModel.toLowerCase()
    if (businessModel.includes('disruptive') || businessModel.includes('innovative') || 
        businessModel.includes('digital') || businessModel.includes('platform')) {
      score += 15
    }

    return Math.min(100, score)
  }

  private scoreResourceAdequacy(): number {
    let score = 50 // Base score

    // Financial resources for growth
    const cashFlowMonths = this.businessData.expenses > 0 
      ? (this.businessData.cashFlow * 12) / this.businessData.expenses 
      : 0

    if (cashFlowMonths > 12) score += 20
    else if (cashFlowMonths > 6) score += 15
    else if (cashFlowMonths > 3) score += 10
    else if (cashFlowMonths > 0) score += 5

    // Asset base for growth
    const assetToRevenueRatio = this.businessData.annualRevenue > 0 
      ? this.businessData.assets / this.businessData.annualRevenue 
      : 0

    if (assetToRevenueRatio > 1.5) score += 15
    else if (assetToRevenueRatio > 1.0) score += 10
    else if (assetToRevenueRatio > 0.5) score += 5

    // Human resource capacity
    const revenuePerEmployee = this.businessData.employeeCount > 0 
      ? this.businessData.annualRevenue / this.businessData.employeeCount 
      : 0

    if (revenuePerEmployee > 200000) score += 15 // High productivity indicates resource efficiency

    return Math.min(100, score)
  }

  private scoreGrowthSustainability(): number {
    let score = 60 // Base score

    // Profitability sustainability
    const netMargin = this.businessData.annualRevenue > 0 
      ? ((this.businessData.annualRevenue - this.businessData.expenses) / this.businessData.annualRevenue) * 100 
      : 0

    if (netMargin > 20) score += 20
    else if (netMargin > 15) score += 15
    else if (netMargin > 10) score += 10
    else if (netMargin > 5) score += 5

    // Revenue model sustainability
    if (this.businessData.revenueModel.includes('recurring') || 
        this.businessData.revenueModel.includes('subscription')) {
      score += 15
    }

    // Market position sustainability
    const advantageCount = this.businessData.competitiveAdvantages.length
    if (advantageCount > 3) score += 10
    else if (advantageCount > 1) score += 5

    // Business maturity
    if (this.businessData.yearsInBusiness > 10) score += 5

    return Math.min(100, score)
  }

  private calculateWeightedScore(components: HealthComponent[]): number {
    const totalWeight = components.reduce((sum, comp) => sum + comp.weight, 0)
    const weightedSum = components.reduce((sum, comp) => sum + (comp.score * comp.weight), 0)
    return Math.round(weightedSum / totalWeight)
  }

  private calculateConfidence(components: HealthComponent[]): number {
    let confidence = 70 // Base confidence - growth metrics are inherently more speculative

    // Reduce confidence for newer businesses
    if (this.businessData.yearsInBusiness < 2) confidence -= 15
    else if (this.businessData.yearsInBusiness < 5) confidence -= 10

    // Reduce confidence if limited data
    if (this.businessData.competitiveAdvantages.length === 0) confidence -= 10
    if (this.businessData.annualRevenue === 0) confidence -= 10

    return Math.max(40, confidence)
  }

  private getBenchmarkComparison() {
    return {
      industryAverage: 62,
      percentile: 55,
      quartile: 2
    }
  }

  private analyzeTrendDirection(): 'improving' | 'stable' | 'declining' {
    const scalabilityScore = this.scoreScalability()
    const sustainabilityScore = this.scoreGrowthSustainability()
    
    if (scalabilityScore > 75 && sustainabilityScore > 75) return 'improving'
    if (scalabilityScore < 50 || sustainabilityScore < 50) return 'declining'
    return 'stable'
  }

  private generateKeyInsights(components: HealthComponent[]): string[] {
    const insights: string[] = []

    const scalabilityComp = components.find(c => c.id === 'scalability')
    if (scalabilityComp && scalabilityComp.score > 80) {
      insights.push('High scalability potential indicates strong growth capability')
    }

    if (this.businessData.revenueModel.includes('recurring') || 
        this.businessData.revenueModel.includes('subscription')) {
      insights.push('Recurring revenue model supports sustainable growth')
    }

    const innovationComp = components.find(c => c.id === 'innovation')
    if (innovationComp && innovationComp.score > 75) {
      insights.push('Strong innovation capacity enables future growth opportunities')
    }

    const expansionComp = components.find(c => c.id === 'market-expansion')
    if (expansionComp && expansionComp.score > 70) {
      insights.push('Market expansion opportunities provide growth pathways')
    }

    return insights
  }

  private identifyCriticalFactors(components: HealthComponent[]): string[] {
    const critical: string[] = []

    components.forEach(comp => {
      if (comp.score < 45 && comp.weight > 0.15) {
        critical.push(`${comp.name}: Critical for sustainable growth`)
      }
    })

    const resourceComp = components.find(c => c.id === 'resource-adequacy')
    if (resourceComp && resourceComp.score < 50) {
      critical.push('Resource constraints may limit growth potential')
    }

    return critical
  }

  private getIndustryBenchmark(metric: string): number {
    const benchmarks: { [key: string]: number } = {
      'scalability': 70,
      'expansion_potential': 65,
      'innovation_index': 60,
      'resource_adequacy': 70,
      'sustainability': 75
    }

    return benchmarks[metric] || 0
  }
}