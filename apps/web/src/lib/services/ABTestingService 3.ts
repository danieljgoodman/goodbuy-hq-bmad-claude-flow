import { prisma } from '@/lib/prisma'
import { ABTestExperiment, ABTestParticipant, ABTestResult, ABTestVariant } from '@/types'

interface ExperimentConfig {
  name: string
  description: string
  variants: ABTestVariant[]
  allocation_percentage: number
  target_metric: string
  hypothesis: string
  min_sample_size: number
  max_duration_days: number
  success_criteria: {
    primary_metric: string
    improvement_threshold: number
    confidence_level: number
  }
}

interface StatisticalResult {
  is_significant: boolean
  p_value: number
  confidence_interval: [number, number]
  effect_size: number
  power: number
}

export class ABTestingService {
  async createExperiment(config: ExperimentConfig): Promise<ABTestExperiment> {
    const experiment = await prisma.aBTestExperiment.create({
      data: {
        name: config.name,
        description: config.description,
        status: 'draft',
        allocation_percentage: config.allocation_percentage,
        target_metric: config.target_metric,
        hypothesis: config.hypothesis,
        min_sample_size: config.min_sample_size,
        max_duration_days: config.max_duration_days,
        success_criteria: config.success_criteria,
        variants: config.variants,
        created_at: new Date()
      }
    })

    return experiment
  }

  async startExperiment(experimentId: string): Promise<void> {
    await prisma.aBTestExperiment.update({
      where: { id: experimentId },
      data: {
        status: 'running',
        started_at: new Date()
      }
    })
  }

  async stopExperiment(experimentId: string): Promise<void> {
    await prisma.aBTestExperiment.update({
      where: { id: experimentId },
      data: {
        status: 'completed',
        ended_at: new Date()
      }
    })
  }

  async assignUserToExperiment(
    experimentId: string,
    userId: string,
    userProperties?: Record<string, any>
  ): Promise<string> {
    const experiment = await prisma.aBTestExperiment.findUnique({
      where: { id: experimentId }
    })

    if (!experiment || experiment.status !== 'running') {
      throw new Error('Experiment not found or not running')
    }

    // Check if user already assigned
    const existing = await prisma.aBTestParticipant.findFirst({
      where: {
        experiment_id: experimentId,
        user_id: userId
      }
    })

    if (existing) {
      return existing.variant
    }

    // Check allocation percentage
    if (Math.random() * 100 > experiment.allocation_percentage) {
      return 'control' // Not included in experiment
    }

    // Assign variant based on user hash for consistency
    const variant = this.assignVariant(userId, experiment.variants as ABTestVariant[])

    await prisma.aBTestParticipant.create({
      data: {
        experiment_id: experimentId,
        user_id: userId,
        variant,
        assigned_at: new Date(),
        user_properties: userProperties || {}
      }
    })

    return variant
  }

  private assignVariant(userId: string, variants: ABTestVariant[]): string {
    // Use user ID hash for consistent assignment
    const hash = this.hashUserId(userId)
    const totalWeight = variants.reduce((sum, v) => sum + v.traffic_percentage, 0)
    const random = hash * totalWeight

    let cumulativeWeight = 0
    for (const variant of variants) {
      cumulativeWeight += variant.traffic_percentage
      if (random <= cumulativeWeight) {
        return variant.name
      }
    }

    return variants[0]?.name || 'control'
  }

  private hashUserId(userId: string): number {
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483648 // Normalize to 0-1
  }

  async trackConversion(
    experimentId: string,
    userId: string,
    metric: string,
    value: number,
    properties?: Record<string, any>
  ): Promise<void> {
    const participant = await prisma.aBTestParticipant.findFirst({
      where: {
        experiment_id: experimentId,
        user_id: userId
      }
    })

    if (!participant) {
      return // User not in experiment
    }

    // Store conversion event
    await prisma.userEvent.create({
      data: {
        userId,
        sessionId: `experiment_${experimentId}`,
        event_type: 'conversion',
        event_name: `experiment_conversion_${metric}`,
        properties: {
          experiment_id: experimentId,
          variant: participant.variant,
          metric,
          value,
          ...properties
        },
        timestamp: new Date(),
        experiment_variant: participant.variant
      }
    })

    // Update participant conversion status
    await prisma.aBTestParticipant.update({
      where: { id: participant.id },
      data: {
        converted: true,
        conversion_value: value
      }
    })
  }

  async analyzeExperiment(experimentId: string): Promise<ABTestResult> {
    const experiment = await prisma.aBTestExperiment.findUnique({
      where: { id: experimentId }
    })

    if (!experiment) {
      throw new Error('Experiment not found')
    }

    const participants = await prisma.aBTestParticipant.findMany({
      where: { experiment_id: experimentId }
    })

    const variantResults = await this.calculateVariantResults(experimentId, participants)
    const statisticalResults = await this.performStatisticalAnalysis(variantResults)

    const winningVariant = this.determineWinningVariant(variantResults, statisticalResults)
    const recommendation = this.generateRecommendation(experiment, variantResults, statisticalResults)

    return {
      experiment_id: experimentId,
      experiment_name: experiment.name,
      status: experiment.status,
      start_date: experiment.started_at,
      end_date: experiment.ended_at,
      participants_count: participants.length,
      variant_results: variantResults,
      statistical_significance: statisticalResults,
      winning_variant: winningVariant,
      recommendation,
      confidence_level: experiment.success_criteria.confidence_level,
      is_conclusive: this.isConclusiveResult(statisticalResults, experiment.success_criteria)
    }
  }

  private async calculateVariantResults(
    experimentId: string,
    participants: ABTestParticipant[]
  ): Promise<Array<{
    variant: string
    participants: number
    conversions: number
    conversion_rate: number
    total_value: number
    average_value: number
  }>> {
    const variantGroups = participants.reduce((acc, p) => {
      if (!acc[p.variant]) {
        acc[p.variant] = []
      }
      acc[p.variant].push(p)
      return acc
    }, {} as Record<string, ABTestParticipant[]>)

    const results = []

    for (const [variant, variantParticipants] of Object.entries(variantGroups)) {
      const conversions = variantParticipants.filter(p => p.converted).length
      const totalValue = variantParticipants.reduce((sum, p) => sum + (p.conversion_value || 0), 0)
      const conversionRate = variantParticipants.length > 0 ? conversions / variantParticipants.length : 0

      results.push({
        variant,
        participants: variantParticipants.length,
        conversions,
        conversion_rate: conversionRate,
        total_value: totalValue,
        average_value: conversions > 0 ? totalValue / conversions : 0
      })
    }

    return results.sort((a, b) => b.conversion_rate - a.conversion_rate)
  }

  private async performStatisticalAnalysis(
    variantResults: Array<{
      variant: string
      participants: number
      conversions: number
      conversion_rate: number
    }>
  ): Promise<StatisticalResult> {
    if (variantResults.length < 2) {
      return {
        is_significant: false,
        p_value: 1,
        confidence_interval: [0, 0],
        effect_size: 0,
        power: 0
      }
    }

    const control = variantResults.find(v => v.variant === 'control') || variantResults[0]
    const treatment = variantResults.find(v => v.variant !== 'control') || variantResults[1]

    // Two-proportion z-test
    const p1 = control.conversion_rate
    const p2 = treatment.conversion_rate
    const n1 = control.participants
    const n2 = treatment.participants

    if (n1 === 0 || n2 === 0) {
      return {
        is_significant: false,
        p_value: 1,
        confidence_interval: [0, 0],
        effect_size: 0,
        power: 0
      }
    }

    const pooledP = (control.conversions + treatment.conversions) / (n1 + n2)
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2))
    
    const zScore = se > 0 ? (p2 - p1) / se : 0
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)))

    // Effect size (Cohen's h)
    const effectSize = 2 * (Math.asin(Math.sqrt(p2)) - Math.asin(Math.sqrt(p1)))

    // Confidence interval for difference in proportions
    const seDiff = Math.sqrt(p1 * (1 - p1) / n1 + p2 * (1 - p2) / n2)
    const margin = 1.96 * seDiff
    const confidenceInterval: [number, number] = [
      (p2 - p1) - margin,
      (p2 - p1) + margin
    ]

    // Power calculation (simplified)
    const power = this.calculatePower(effectSize, n1, n2)

    return {
      is_significant: pValue < 0.05,
      p_value: pValue,
      confidence_interval: confidenceInterval,
      effect_size: effectSize,
      power
    }
  }

  private normalCDF(x: number): number {
    // Approximation of standard normal CDF
    const a1 =  0.254829592
    const a2 = -0.284496736
    const a3 =  1.421413741
    const a4 = -1.453152027
    const a5 =  1.061405429
    const p  =  0.3275911

    const sign = x < 0 ? -1 : 1
    x = Math.abs(x) / Math.sqrt(2.0)

    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

    return 0.5 * (1.0 + sign * y)
  }

  private calculatePower(effectSize: number, n1: number, n2: number): number {
    // Simplified power calculation
    const nHarmonic = 2 / (1/n1 + 1/n2)
    const delta = effectSize * Math.sqrt(nHarmonic / 4)
    return this.normalCDF(delta - 1.96) + this.normalCDF(-delta - 1.96)
  }

  private determineWinningVariant(
    variantResults: Array<{ variant: string; conversion_rate: number }>,
    statisticalResults: StatisticalResult
  ): string | null {
    if (!statisticalResults.is_significant) {
      return null
    }

    return variantResults[0]?.variant || null
  }

  private generateRecommendation(
    experiment: ABTestExperiment,
    variantResults: Array<{ variant: string; conversion_rate: number; participants: number }>,
    statisticalResults: StatisticalResult
  ): string {
    if (!statisticalResults.is_significant) {
      if (variantResults.every(v => v.participants < experiment.min_sample_size)) {
        return 'Continue running the experiment to reach minimum sample size for statistical significance.'
      }
      return 'No significant difference detected. Consider running the experiment longer or testing a different variation.'
    }

    const winner = variantResults[0]
    const improvement = ((winner.conversion_rate - (variantResults[1]?.conversion_rate || 0)) / (variantResults[1]?.conversion_rate || 1)) * 100

    if (improvement >= experiment.success_criteria.improvement_threshold) {
      return `Implement ${winner.variant} variant. It shows a ${improvement.toFixed(1)}% improvement with statistical significance (p=${statisticalResults.p_value.toFixed(3)}).`
    }

    return `While ${winner.variant} variant is statistically significant, the improvement (${improvement.toFixed(1)}%) is below the success threshold (${experiment.success_criteria.improvement_threshold}%). Consider the business impact before implementation.`
  }

  private isConclusiveResult(
    statisticalResults: StatisticalResult,
    successCriteria: any
  ): boolean {
    return statisticalResults.is_significant && 
           statisticalResults.power >= 0.8 &&
           statisticalResults.p_value < (1 - successCriteria.confidence_level / 100)
  }

  async getRunningExperiments(): Promise<ABTestExperiment[]> {
    return await prisma.aBTestExperiment.findMany({
      where: { status: 'running' },
      orderBy: { started_at: 'desc' }
    })
  }

  async getUserExperiments(userId: string): Promise<Array<{
    experiment_id: string
    experiment_name: string
    variant: string
    assigned_at: Date
  }>> {
    const participants = await prisma.aBTestParticipant.findMany({
      where: { user_id: userId },
      include: {
        experiment: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return participants.map(p => ({
      experiment_id: p.experiment_id,
      experiment_name: p.experiment.name,
      variant: p.variant,
      assigned_at: p.assigned_at
    }))
  }

  async getExperimentVariant(experimentId: string, userId: string): Promise<string | null> {
    const participant = await prisma.aBTestParticipant.findFirst({
      where: {
        experiment_id: experimentId,
        user_id: userId
      }
    })

    return participant?.variant || null
  }

  async shouldAutoStop(experimentId: string): Promise<{ should_stop: boolean; reason?: string }> {
    const experiment = await prisma.aBTestExperiment.findUnique({
      where: { id: experimentId }
    })

    if (!experiment || experiment.status !== 'running') {
      return { should_stop: false }
    }

    // Check max duration
    if (experiment.started_at) {
      const daysSinceStart = (Date.now() - experiment.started_at.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceStart >= experiment.max_duration_days) {
        return { should_stop: true, reason: 'Maximum duration reached' }
      }
    }

    // Check for statistical significance and sample size
    const results = await this.analyzeExperiment(experimentId)
    
    if (results.is_conclusive && results.participants_count >= experiment.min_sample_size) {
      return { should_stop: true, reason: 'Statistical significance achieved with sufficient sample size' }
    }

    return { should_stop: false }
  }

  async generateSegmentedAnalysis(
    experimentId: string,
    segmentBy: string
  ): Promise<Record<string, ABTestResult>> {
    const participants = await prisma.aBTestParticipant.findMany({
      where: { experiment_id: experimentId }
    })

    // Group participants by segment
    const segments = participants.reduce((acc, p) => {
      const segmentValue = (p.user_properties as any)?.[segmentBy] || 'unknown'
      if (!acc[segmentValue]) {
        acc[segmentValue] = []
      }
      acc[segmentValue].push(p)
      return acc
    }, {} as Record<string, ABTestParticipant[]>)

    const segmentedResults: Record<string, ABTestResult> = {}

    for (const [segment, segmentParticipants] of Object.entries(segments)) {
      if (segmentParticipants.length >= 30) { // Minimum sample size per segment
        const variantResults = await this.calculateVariantResults(experimentId, segmentParticipants)
        const statisticalResults = await this.performStatisticalAnalysis(variantResults)
        
        const experiment = await prisma.aBTestExperiment.findUnique({
          where: { id: experimentId }
        })!

        segmentedResults[segment] = {
          experiment_id: experimentId,
          experiment_name: `${experiment.name} - ${segment}`,
          status: experiment.status,
          start_date: experiment.started_at,
          end_date: experiment.ended_at,
          participants_count: segmentParticipants.length,
          variant_results: variantResults,
          statistical_significance: statisticalResults,
          winning_variant: this.determineWinningVariant(variantResults, statisticalResults),
          recommendation: this.generateRecommendation(experiment, variantResults, statisticalResults),
          confidence_level: experiment.success_criteria.confidence_level,
          is_conclusive: this.isConclusiveResult(statisticalResults, experiment.success_criteria)
        }
      }
    }

    return segmentedResults
  }
}