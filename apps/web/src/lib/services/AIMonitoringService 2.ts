import { prisma } from '@/lib/prisma'
import { AIPerformanceMetric } from '@/types'

export interface AIModelConfig {
  name: string
  version: string
  endpoint: string
  expectedAccuracy: number
  responseTimeThreshold: number // in milliseconds
}

export interface AIPerformanceAlert {
  model: string
  metric: string
  current_value: number
  threshold: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
}

export class AIMonitoringService {
  private models: Map<string, AIModelConfig> = new Map()
  private performanceBuffer: AIPerformanceMetric[] = []
  private flushInterval: NodeJS.Timeout | null = null

  constructor() {
    this.initializeModelConfigs()
    this.startPerformanceFlush()
  }

  private initializeModelConfigs() {
    this.models.set('business_valuation_v1', {
      name: 'Business Valuation Model',
      version: '1.0',
      endpoint: '/api/ai/valuation',
      expectedAccuracy: 0.85,
      responseTimeThreshold: 5000
    })

    this.models.set('health_score_v1', {
      name: 'Health Score Model',
      version: '1.0',
      endpoint: '/api/ai/health-score',
      expectedAccuracy: 0.88,
      responseTimeThreshold: 3000
    })

    this.models.set('improvement_recommendations_v1', {
      name: 'Improvement Recommendations Model',
      version: '1.0',
      endpoint: '/api/ai/recommendations',
      expectedAccuracy: 0.82,
      responseTimeThreshold: 4000
    })

    this.models.set('document_intelligence_v1', {
      name: 'Document Intelligence Model',
      version: '1.0',
      endpoint: '/api/ai/document-analysis',
      expectedAccuracy: 0.90,
      responseTimeThreshold: 15000
    })
  }

  private startPerformanceFlush() {
    this.flushInterval = setInterval(() => {
      if (this.performanceBuffer.length > 0) {
        this.flushPerformanceMetrics()
      }
    }, 10000) // Flush every 10 seconds
  }

  async recordAccuracyMetric(
    modelName: string,
    version: string,
    accuracy: number,
    context: {
      industry?: string
      business_size?: string
      evaluation_type?: string
    },
    userId?: string,
    batchId?: string
  ): Promise<void> {
    const metric: Omit<AIPerformanceMetric, 'id'> = {
      userId,
      model_name: modelName,
      version,
      metric_type: 'accuracy',
      value: accuracy,
      context,
      timestamp: new Date(),
      batch_id: batchId
    }

    this.performanceBuffer.push(metric as AIPerformanceMetric)
    await this.checkAccuracyThreshold(modelName, accuracy)
  }

  async recordConfidenceScore(
    modelName: string,
    version: string,
    confidence: number,
    context: any = {},
    userId?: string
  ): Promise<void> {
    const metric: Omit<AIPerformanceMetric, 'id'> = {
      userId,
      model_name: modelName,
      version,
      metric_type: 'confidence',
      value: confidence,
      context,
      timestamp: new Date()
    }

    this.performanceBuffer.push(metric as AIPerformanceMetric)
  }

  async recordResponseTime(
    modelName: string,
    version: string,
    responseTime: number,
    context: any = {},
    userId?: string
  ): Promise<void> {
    const metric: Omit<AIPerformanceMetric, 'id'> = {
      userId,
      model_name: modelName,
      version,
      metric_type: 'response_time',
      value: responseTime,
      context,
      timestamp: new Date()
    }

    this.performanceBuffer.push(metric as AIPerformanceMetric)
    await this.checkResponseTimeThreshold(modelName, responseTime)
  }

  async recordUserSatisfaction(
    modelName: string,
    version: string,
    satisfactionScore: number,
    feedback: {
      helpful: boolean
      accuracy_rating: number
      comments?: string
    },
    context: any = {},
    userId?: string
  ): Promise<void> {
    const metric: Omit<AIPerformanceMetric, 'id'> = {
      userId,
      model_name: modelName,
      version,
      metric_type: 'user_satisfaction',
      value: satisfactionScore,
      context,
      user_feedback: feedback,
      timestamp: new Date()
    }

    this.performanceBuffer.push(metric as AIPerformanceMetric)
  }

  async getModelPerformanceSummary(
    modelName: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    model_name: string
    version: string
    metrics: {
      accuracy: {
        average: number
        min: number
        max: number
        trend: 'up' | 'down' | 'stable'
        sample_size: number
      }
      confidence: {
        average: number
        distribution: { range: string; count: number }[]
        trend: 'up' | 'down' | 'stable'
      }
      response_time: {
        average: number
        p50: number
        p95: number
        p99: number
        trend: 'up' | 'down' | 'stable'
      }
      user_satisfaction: {
        average: number
        helpful_percentage: number
        total_feedback: number
        sentiment_distribution: { positive: number; neutral: number; negative: number }
      }
    }
    alerts: AIPerformanceAlert[]
    recommendations: string[]
  }> {
    // Get all metrics for this model in the date range
    const metrics = await prisma.aIPerformanceMetric.findMany({
      where: {
        modelName,
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { timestamp: 'asc' }
    })

    const model = this.models.get(modelName)
    if (!model) {
      throw new Error(`Model ${modelName} not found`)
    }

    // Calculate accuracy metrics
    const accuracyMetrics = metrics.filter(m => m.metricType === 'ACCURACY')
    const accuracyValues = accuracyMetrics.map(m => m.value)
    const accuracyAvg = accuracyValues.length > 0 ? accuracyValues.reduce((sum, val) => sum + val, 0) / accuracyValues.length : 0
    const accuracyTrend = this.calculateTrend(accuracyValues)

    // Calculate confidence metrics
    const confidenceMetrics = metrics.filter(m => m.metricType === 'CONFIDENCE')
    const confidenceValues = confidenceMetrics.map(m => m.value)
    const confidenceAvg = confidenceValues.length > 0 ? confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length : 0
    const confidenceTrend = this.calculateTrend(confidenceValues)

    // Calculate response time metrics
    const responseTimeMetrics = metrics.filter(m => m.metricType === 'RESPONSE_TIME')
    const responseTimeValues = responseTimeMetrics.map(m => m.value).sort((a, b) => a - b)
    const responseTimeAvg = responseTimeValues.length > 0 ? responseTimeValues.reduce((sum, val) => sum + val, 0) / responseTimeValues.length : 0
    const responseTimeTrend = this.calculateTrend(responseTimeValues)

    // Calculate user satisfaction metrics
    const satisfactionMetrics = metrics.filter(m => m.metricType === 'USER_SATISFACTION')
    const satisfactionValues = satisfactionMetrics.map(m => m.value)
    const satisfactionAvg = satisfactionValues.length > 0 ? satisfactionValues.reduce((sum, val) => sum + val, 0) / satisfactionValues.length : 0
    
    const helpfulCount = satisfactionMetrics.filter(m => 
      m.userFeedback && (m.userFeedback as any).helpful
    ).length
    const helpfulPercentage = satisfactionMetrics.length > 0 ? (helpfulCount / satisfactionMetrics.length) * 100 : 0

    // Generate alerts
    const alerts = await this.generatePerformanceAlerts(modelName, {
      accuracy: accuracyAvg,
      responseTime: responseTimeAvg,
      confidence: confidenceAvg,
      satisfaction: satisfactionAvg
    })

    // Generate recommendations
    const recommendations = this.generateRecommendations(modelName, {
      accuracy: accuracyAvg,
      responseTime: responseTimeAvg,
      confidence: confidenceAvg,
      satisfaction: satisfactionAvg
    })

    return {
      model_name: model.name,
      version: model.version,
      metrics: {
        accuracy: {
          average: Math.round(accuracyAvg * 100) / 100,
          min: accuracyValues.length > 0 ? Math.min(...accuracyValues) : 0,
          max: accuracyValues.length > 0 ? Math.max(...accuracyValues) : 0,
          trend: accuracyTrend,
          sample_size: accuracyValues.length
        },
        confidence: {
          average: Math.round(confidenceAvg * 100) / 100,
          distribution: this.calculateDistribution(confidenceValues),
          trend: confidenceTrend
        },
        response_time: {
          average: Math.round(responseTimeAvg),
          p50: this.percentile(responseTimeValues, 0.5),
          p95: this.percentile(responseTimeValues, 0.95),
          p99: this.percentile(responseTimeValues, 0.99),
          trend: responseTimeTrend
        },
        user_satisfaction: {
          average: Math.round(satisfactionAvg * 100) / 100,
          helpful_percentage: Math.round(helpfulPercentage),
          total_feedback: satisfactionMetrics.length,
          sentiment_distribution: this.analyzeSentiment(satisfactionMetrics)
        }
      },
      alerts,
      recommendations
    }
  }

  private calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable'
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
    
    const changeThreshold = 0.05 // 5% change threshold
    const relativeChange = Math.abs(secondAvg - firstAvg) / firstAvg
    
    if (relativeChange < changeThreshold) return 'stable'
    return secondAvg > firstAvg ? 'up' : 'down'
  }

  private calculateDistribution(values: number[]): { range: string; count: number }[] {
    if (values.length === 0) return []
    
    const ranges = [
      { range: '0.0-0.2', min: 0, max: 0.2 },
      { range: '0.2-0.4', min: 0.2, max: 0.4 },
      { range: '0.4-0.6', min: 0.4, max: 0.6 },
      { range: '0.6-0.8', min: 0.6, max: 0.8 },
      { range: '0.8-1.0', min: 0.8, max: 1.0 }
    ]
    
    return ranges.map(range => ({
      range: range.range,
      count: values.filter(val => val >= range.min && val < range.max).length
    }))
  }

  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0
    const index = Math.ceil(values.length * p) - 1
    return values[Math.max(0, Math.min(index, values.length - 1))]
  }

  private analyzeSentiment(metrics: any[]): { positive: number; neutral: number; negative: number } {
    let positive = 0, neutral = 0, negative = 0
    
    metrics.forEach(metric => {
      if (metric.userFeedback) {
        const feedback = metric.userFeedback as any
        if (feedback.accuracy_rating >= 4) positive++
        else if (feedback.accuracy_rating >= 3) neutral++
        else negative++
      }
    })
    
    return { positive, neutral, negative }
  }

  private async generatePerformanceAlerts(
    modelName: string,
    currentMetrics: {
      accuracy: number
      responseTime: number
      confidence: number
      satisfaction: number
    }
  ): Promise<AIPerformanceAlert[]> {
    const alerts: AIPerformanceAlert[] = []
    const model = this.models.get(modelName)
    
    if (!model) return alerts

    // Accuracy alert
    if (currentMetrics.accuracy < model.expectedAccuracy) {
      const severity = currentMetrics.accuracy < model.expectedAccuracy * 0.8 ? 'critical' : 'medium'
      alerts.push({
        model: modelName,
        metric: 'accuracy',
        current_value: currentMetrics.accuracy,
        threshold: model.expectedAccuracy,
        severity,
        message: `Model accuracy (${(currentMetrics.accuracy * 100).toFixed(1)}%) is below expected threshold (${(model.expectedAccuracy * 100).toFixed(1)}%)`
      })
    }

    // Response time alert
    if (currentMetrics.responseTime > model.responseTimeThreshold) {
      const severity = currentMetrics.responseTime > model.responseTimeThreshold * 2 ? 'critical' : 'medium'
      alerts.push({
        model: modelName,
        metric: 'response_time',
        current_value: currentMetrics.responseTime,
        threshold: model.responseTimeThreshold,
        severity,
        message: `Model response time (${currentMetrics.responseTime}ms) exceeds threshold (${model.responseTimeThreshold}ms)`
      })
    }

    // Low confidence alert
    if (currentMetrics.confidence < 0.7) {
      alerts.push({
        model: modelName,
        metric: 'confidence',
        current_value: currentMetrics.confidence,
        threshold: 0.7,
        severity: 'medium',
        message: `Model confidence is low (${(currentMetrics.confidence * 100).toFixed(1)}%)`
      })
    }

    // User satisfaction alert
    if (currentMetrics.satisfaction < 0.6) {
      const severity = currentMetrics.satisfaction < 0.4 ? 'high' : 'medium'
      alerts.push({
        model: modelName,
        metric: 'user_satisfaction',
        current_value: currentMetrics.satisfaction,
        threshold: 0.6,
        severity,
        message: `User satisfaction is low (${(currentMetrics.satisfaction * 100).toFixed(1)}%)`
      })
    }

    return alerts
  }

  private generateRecommendations(
    modelName: string,
    currentMetrics: {
      accuracy: number
      responseTime: number
      confidence: number
      satisfaction: number
    }
  ): string[] {
    const recommendations: string[] = []
    const model = this.models.get(modelName)
    
    if (!model) return recommendations

    if (currentMetrics.accuracy < model.expectedAccuracy) {
      recommendations.push('Consider retraining the model with additional or more diverse training data')
      recommendations.push('Review feature engineering to ensure optimal input representation')
      recommendations.push('Implement model validation with cross-validation techniques')
    }

    if (currentMetrics.responseTime > model.responseTimeThreshold) {
      recommendations.push('Optimize model architecture to reduce inference time')
      recommendations.push('Consider model quantization or pruning techniques')
      recommendations.push('Implement caching for frequently requested predictions')
    }

    if (currentMetrics.confidence < 0.7) {
      recommendations.push('Review model uncertainty quantification methods')
      recommendations.push('Consider ensemble methods to improve confidence calibration')
      recommendations.push('Implement confidence threshold-based routing to human review')
    }

    if (currentMetrics.satisfaction < 0.6) {
      recommendations.push('Conduct user interviews to understand satisfaction drivers')
      recommendations.push('Improve model explainability and transparency')
      recommendations.push('Implement feedback loops for continuous model improvement')
    }

    return recommendations
  }

  private async checkAccuracyThreshold(modelName: string, accuracy: number): Promise<void> {
    const model = this.models.get(modelName)
    if (model && accuracy < model.expectedAccuracy * 0.8) {
      // Create critical alert
      await this.createAlert({
        alert_type: 'ai_accuracy',
        severity: 'critical',
        title: `Critical Accuracy Drop: ${model.name}`,
        description: `Model accuracy (${(accuracy * 100).toFixed(1)}%) has fallen significantly below expected threshold`,
        metric_type: 'accuracy',
        threshold: model.expectedAccuracy,
        current_value: accuracy,
        status: 'active',
        metadata: { model_name: modelName, model_version: model.version }
      })
    }
  }

  private async checkResponseTimeThreshold(modelName: string, responseTime: number): Promise<void> {
    const model = this.models.get(modelName)
    if (model && responseTime > model.responseTimeThreshold * 2) {
      // Create critical alert
      await this.createAlert({
        alert_type: 'performance',
        severity: 'critical',
        title: `Critical Response Time: ${model.name}`,
        description: `Model response time (${responseTime}ms) is critically high`,
        metric_type: 'response_time',
        threshold: model.responseTimeThreshold,
        current_value: responseTime,
        status: 'active',
        metadata: { model_name: modelName, model_version: model.version }
      })
    }
  }

  private async createAlert(alertData: {
    alert_type: string
    severity: string
    title: string
    description: string
    metric_type: string
    threshold: number
    current_value: number
    status: string
    metadata: Record<string, any>
  }): Promise<void> {
    try {
      await prisma.performanceAlert.create({
        data: {
          alertType: alertData.alert_type.toUpperCase() as any,
          severity: alertData.severity.toUpperCase() as any,
          title: alertData.title,
          description: alertData.description,
          metricType: alertData.metric_type,
          threshold: alertData.threshold,
          currentValue: alertData.current_value,
          status: alertData.status.toUpperCase() as any,
          metadata: alertData.metadata
        }
      })
    } catch (error) {
      console.error('Failed to create performance alert:', error)
    }
  }

  private async flushPerformanceMetrics(): Promise<void> {
    if (this.performanceBuffer.length === 0) return

    const metricsToFlush = [...this.performanceBuffer]
    this.performanceBuffer = []

    try {
      // Convert enum values for database
      const metricsForDb = metricsToFlush.map(metric => ({
        userId: metric.userId || null,
        modelName: metric.model_name,
        version: metric.version,
        metricType: metric.metric_type.toUpperCase() as any,
        value: metric.value,
        context: metric.context,
        userFeedback: metric.user_feedback,
        timestamp: metric.timestamp,
        batchId: metric.batch_id
      }))

      await prisma.aIPerformanceMetric.createMany({
        data: metricsForDb
      })
    } catch (error) {
      console.error('Failed to flush AI performance metrics:', error)
      // Re-add failed metrics to buffer (with limit)
      if (this.performanceBuffer.length < 100) {
        this.performanceBuffer.unshift(...metricsToFlush.slice(0, 50))
      }
    }
  }

  async getBiasAnalysis(
    modelName: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    demographic_fairness: {
      industry: { category: string; accuracy: number; sample_size: number }[]
      business_size: { category: string; accuracy: number; sample_size: number }[]
    }
    recommendations: string[]
  }> {
    const metrics = await prisma.aIPerformanceMetric.findMany({
      where: {
        modelName,
        metricType: 'ACCURACY',
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Analyze by industry
    const industryGroups = new Map<string, number[]>()
    const businessSizeGroups = new Map<string, number[]>()

    metrics.forEach(metric => {
      const context = metric.context as any
      
      if (context.industry) {
        if (!industryGroups.has(context.industry)) {
          industryGroups.set(context.industry, [])
        }
        industryGroups.get(context.industry)!.push(metric.value)
      }

      if (context.business_size) {
        if (!businessSizeGroups.has(context.business_size)) {
          businessSizeGroups.set(context.business_size, [])
        }
        businessSizeGroups.get(context.business_size)!.push(metric.value)
      }
    })

    const industryAnalysis = Array.from(industryGroups.entries()).map(([category, values]) => ({
      category,
      accuracy: values.reduce((sum, val) => sum + val, 0) / values.length,
      sample_size: values.length
    }))

    const businessSizeAnalysis = Array.from(businessSizeGroups.entries()).map(([category, values]) => ({
      category,
      accuracy: values.reduce((sum, val) => sum + val, 0) / values.length,
      sample_size: values.length
    }))

    // Generate bias recommendations
    const recommendations = []
    
    // Check for significant accuracy differences
    if (industryAnalysis.length > 1) {
      const accuracies = industryAnalysis.map(a => a.accuracy)
      const maxAccuracy = Math.max(...accuracies)
      const minAccuracy = Math.min(...accuracies)
      
      if ((maxAccuracy - minAccuracy) > 0.1) { // 10% difference threshold
        recommendations.push('Significant accuracy differences detected across industries - consider rebalancing training data')
      }
    }

    if (businessSizeAnalysis.length > 1) {
      const accuracies = businessSizeAnalysis.map(a => a.accuracy)
      const maxAccuracy = Math.max(...accuracies)
      const minAccuracy = Math.min(...accuracies)
      
      if ((maxAccuracy - minAccuracy) > 0.1) {
        recommendations.push('Model performance varies significantly by business size - consider stratified validation')
      }
    }

    return {
      demographic_fairness: {
        industry: industryAnalysis,
        business_size: businessSizeAnalysis
      },
      recommendations
    }
  }

  // Add missing methods referenced by API routes
  async getPerformanceSummary(startDate?: Date, endDate?: Date) {
    return this.getModelPerformanceSummary('business_valuation_v1', 
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
      endDate || new Date()
    )
  }

  async getPerformanceTrends(timeRange: { start: Date, end: Date }) {
    // Implementation for performance trends
    const models = Array.from(this.models.keys())
    const trends = []

    for (const modelName of models) {
      const summary = await this.getModelPerformanceSummary(modelName, timeRange.start, timeRange.end)
      trends.push({
        model: modelName,
        accuracy_trend: summary.metrics.accuracy.trend,
        response_time_trend: summary.metrics.response_time.trend,
        confidence_trend: summary.metrics.confidence.trend
      })
    }

    return trends
  }

  async getRecommendations() {
    // Get recent performance data and generate recommendations
    const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const models = Array.from(this.models.keys())
    const allRecommendations = []

    for (const modelName of models) {
      try {
        const summary = await this.getModelPerformanceSummary(modelName, recentDate, new Date())
        allRecommendations.push(...summary.recommendations)
      } catch (error) {
        console.warn(`Failed to get recommendations for ${modelName}:`, error)
      }
    }

    return [...new Set(allRecommendations)] // Remove duplicates
  }

  async getActiveAlerts() {
    // Get active performance alerts from database
    try {
      const alerts = await prisma.performanceAlert.findMany({
        where: {
          status: 'ACTIVE'
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50
      })

      return alerts.map(alert => ({
        model: alert.metadata ? (alert.metadata as any).model_name : 'unknown',
        metric: alert.metricType?.toLowerCase() || 'unknown',
        current_value: alert.currentValue,
        threshold: alert.threshold,
        severity: alert.severity?.toLowerCase() || 'medium',
        message: alert.description,
        created_at: alert.createdAt
      }))
    } catch (error) {
      console.error('Failed to get active alerts:', error)
      return []
    }
  }

  async trackModelPerformance(modelName: string, metrics: {
    accuracy?: number
    confidence?: number
    responseTime?: number
    userId?: string
    context?: any
  }) {
    const version = this.models.get(modelName)?.version || '1.0'
    
    if (metrics.accuracy !== undefined) {
      await this.recordAccuracyMetric(modelName, version, metrics.accuracy, metrics.context || {}, metrics.userId)
    }
    
    if (metrics.confidence !== undefined) {
      await this.recordConfidenceScore(modelName, version, metrics.confidence, metrics.context || {}, metrics.userId)
    }
    
    if (metrics.responseTime !== undefined) {
      await this.recordResponseTime(modelName, version, metrics.responseTime, metrics.context || {}, metrics.userId)
    }
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
    
    // Final flush
    this.flushPerformanceMetrics().catch(console.error)
  }
}