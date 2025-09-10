import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { VisualizationService, TimeSeriesRequest, PerformanceIndicatorData, ComparisonRequest } from '../../lib/services/VisualizationService'
import { AnalyticsDataRepository } from '../../lib/repositories/AnalyticsDataRepository'
import { BusinessMetricsRepository } from '../../lib/repositories/BusinessMetricsRepository'
import { WidgetConfigurationRepository } from '../../lib/repositories/WidgetConfigurationRepository'
import { PrismaClient } from '@prisma/client'

// Mock the repositories
vi.mock('../../lib/repositories/AnalyticsDataRepository')
vi.mock('../../lib/repositories/BusinessMetricsRepository')
vi.mock('../../lib/repositories/WidgetConfigurationRepository')

describe('VisualizationService', () => {
  let service: VisualizationService
  let mockPrisma: vi.Mocked<PrismaClient>
  let mockAnalyticsRepo: vi.Mocked<AnalyticsDataRepository>
  let mockMetricsRepo: vi.Mocked<BusinessMetricsRepository>
  let mockWidgetRepo: vi.Mocked<WidgetConfigurationRepository>

  const mockTimeSeriesRequest: TimeSeriesRequest = {
    userId: 'user-123',
    metrics: ['valuation', 'health_score'],
    timeRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-03-31')
    },
    aggregation: 'week'
  }

  const mockAnalyticsData = [
    {
      id: 'data-1',
      userId: 'user-123',
      metric: 'valuation',
      value: 1000000,
      timestamp: new Date('2024-01-01'),
      metadata: { source: 'test', confidence: 0.9 },
      category: 'valuation' as const,
      tags: ['test']
    },
    {
      id: 'data-2',
      userId: 'user-123',
      metric: 'health_score',
      value: 75,
      timestamp: new Date('2024-01-01'),
      metadata: { source: 'test', confidence: 0.85 },
      category: 'performance' as const,
      tags: ['test']
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockPrisma = {} as any
    
    mockAnalyticsRepo = {
      getTimeSeriesData: vi.fn(),
      createAnalyticsData: vi.fn(),
      getAnalyticsDataByUserId: vi.fn(),
      getAnalyticsDataByMetric: vi.fn(),
      deleteAnalyticsData: vi.fn(),
      bulkCreateAnalyticsData: vi.fn()
    } as any

    mockMetricsRepo = {
      getPerformanceComparison: vi.fn(),
      getBusinessMetricsByPeriod: vi.fn(),
      createBusinessMetrics: vi.fn(),
      updateBusinessMetrics: vi.fn()
    } as any

    mockWidgetRepo = {
      getWidgetConfiguration: vi.fn(),
      getDefaultWidgetConfiguration: vi.fn(),
      createWidgetConfiguration: vi.fn(),
      updateWidgetConfiguration: vi.fn()
    } as any

    service = new VisualizationService(mockPrisma)
    service['analyticsRepo'] = mockAnalyticsRepo
    service['metricsRepo'] = mockMetricsRepo
    service['widgetRepo'] = mockWidgetRepo
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('generateTimeSeriesData', () => {
    it('should return time series data for valid request', async () => {
      const mockResponse = {
        valuation: [mockAnalyticsData[0]],
        health_score: [mockAnalyticsData[1]]
      }

      mockAnalyticsRepo.getTimeSeriesData.mockResolvedValue(mockResponse)

      const result = await service.generateTimeSeriesData(mockTimeSeriesRequest)

      expect(mockAnalyticsRepo.getTimeSeriesData).toHaveBeenCalledWith(
        'user-123',
        ['valuation', 'health_score'],
        mockTimeSeriesRequest.timeRange
      )
      expect(result).toEqual(expect.objectContaining({
        valuation: expect.any(Array),
        health_score: expect.any(Array)
      }))
    })

    it('should validate input parameters', async () => {
      const invalidRequest = {
        userId: '',
        metrics: [],
        timeRange: { start: new Date(), end: new Date() }
      }

      await expect(service.generateTimeSeriesData(invalidRequest))
        .rejects.toThrow('Invalid request: userId and metrics are required')
    })

    it('should apply aggregation when requested', async () => {
      const rawData = {
        valuation: [
          { ...mockAnalyticsData[0], timestamp: new Date('2024-01-01') },
          { ...mockAnalyticsData[0], timestamp: new Date('2024-01-02') },
          { ...mockAnalyticsData[0], timestamp: new Date('2024-01-08') }
        ]
      }

      mockAnalyticsRepo.getTimeSeriesData.mockResolvedValue(rawData)

      const result = await service.generateTimeSeriesData({
        ...mockTimeSeriesRequest,
        aggregation: 'week'
      })

      expect(result.valuation.length).toBeLessThanOrEqual(rawData.valuation.length)
    })

    it('should return mock data on repository failure', async () => {
      mockAnalyticsRepo.getTimeSeriesData.mockRejectedValue(new Error('Database error'))

      const result = await service.generateTimeSeriesData(mockTimeSeriesRequest)

      expect(result).toHaveProperty('valuation')
      expect(result).toHaveProperty('health_score')
      expect(Array.isArray(result.valuation)).toBe(true)
    })

    it('should use caching for repeated requests', async () => {
      const mockResponse = { valuation: [mockAnalyticsData[0]] }
      mockAnalyticsRepo.getTimeSeriesData.mockResolvedValue(mockResponse)

      // First call
      await service.generateTimeSeriesData(mockTimeSeriesRequest)
      
      // Second call should use cache
      await service.generateTimeSeriesData(mockTimeSeriesRequest)

      expect(mockAnalyticsRepo.getTimeSeriesData).toHaveBeenCalledTimes(1)
    })
  })

  describe('getPerformanceIndicators', () => {
    it('should return performance indicators with proper calculations', async () => {
      const mockComparison = {
        current: { valuation: 1200000, health_score: 80 },
        previous: { valuation: 1000000, health_score: 75 },
        goals: { valuation: 1500000, health_score: 85 },
        industry: { valuation: 1100000, health_score: 78 }
      }

      mockMetricsRepo.getPerformanceComparison.mockResolvedValue(mockComparison)

      const result = await service.getPerformanceIndicators('user-123', ['valuation', 'health_score'])

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        name: 'valuation',
        current: 1200000,
        target: 1500000,
        benchmark: 1100000,
        trend: 'up',
        status: expect.any(String)
      })

      expect(result[0].change_percentage).toBeCloseTo(20, 1) // 20% increase
    })

    it('should handle missing comparison data gracefully', async () => {
      mockMetricsRepo.getPerformanceComparison.mockRejectedValue(new Error('No data'))

      const result = await service.getPerformanceIndicators('user-123', ['valuation'])

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        name: 'valuation',
        trend: expect.stringMatching(/up|down|stable/),
        status: expect.stringMatching(/good|warning|critical/)
      })
    })

    it('should calculate status correctly based on targets and benchmarks', async () => {
      const mockComparison = {
        current: { metric1: 50 }, // Below target (100 * 0.8 = 80)
        previous: { metric1: 45 },
        goals: { metric1: 100 },
        industry: { metric1: 60 }
      }

      mockMetricsRepo.getPerformanceComparison.mockResolvedValue(mockComparison)

      const result = await service.getPerformanceIndicators('user-123', ['metric1'])

      expect(result[0].status).toBe('critical') // Below 80% of target
    })
  })

  describe('generateComparison', () => {
    it('should generate comparison analysis between periods', async () => {
      const comparisonRequest: ComparisonRequest = {
        userId: 'user-123',
        type: 'before_after',
        baseline: { period: new Date('2024-01-01'), label: 'Q1 Start' },
        comparison: { period: new Date('2024-03-31'), label: 'Q1 End' },
        metrics: ['valuation', 'revenue']
      }

      // Mock the getMetricsForPeriod calls
      service['getMetricsForPeriod'] = vi.fn()
        .mockResolvedValueOnce({ valuation: 1000000, revenue: 50000 }) // baseline
        .mockResolvedValueOnce({ valuation: 1200000, revenue: 60000 }) // comparison

      const result = await service.generateComparison(comparisonRequest)

      expect(result).toMatchObject({
        userId: 'user-123',
        comparison_type: 'before_after',
        analysis: {
          improvements: expect.arrayContaining([
            expect.stringContaining('valuation: +200000'),
            expect.stringContaining('revenue: +10000')
          ]),
          declines: [],
          roi_calculation: expect.any(Number)
        }
      })
    })

    it('should handle missing metrics data gracefully', async () => {
      const comparisonRequest: ComparisonRequest = {
        userId: 'user-123',
        type: 'period_over_period',
        baseline: { period: new Date('2024-01-01'), label: 'January' },
        comparison: { period: new Date('2024-02-01'), label: 'February' },
        metrics: ['valuation']
      }

      service['getMetricsForPeriod'] = vi.fn().mockResolvedValue(null)

      const result = await service.generateComparison(comparisonRequest)

      expect(result.comparison_type).toBe('period_over_period')
      expect(result.analysis.improvements).toEqual([])
      expect(result.analysis.declines).toEqual([])
    })
  })

  describe('recordAnalyticsEvent', () => {
    it('should record analytics event with proper data', async () => {
      mockAnalyticsRepo.createAnalyticsData.mockResolvedValue(mockAnalyticsData[0])

      await service.recordAnalyticsEvent(
        'user-123',
        'valuation',
        1000000,
        'valuation',
        { source: 'test' }
      )

      expect(mockAnalyticsRepo.createAnalyticsData).toHaveBeenCalledWith({
        userId: 'user-123',
        metric: 'valuation',
        value: 1000000,
        timestamp: expect.any(Date),
        metadata: { source: 'test' },
        category: 'valuation',
        tags: []
      })
    })
  })

  describe('getDashboardConfiguration', () => {
    it('should return specific dashboard configuration when ID provided', async () => {
      const mockConfig = {
        id: 'config-1',
        userId: 'user-123',
        dashboard_id: 'custom-dashboard',
        widgets: [],
        layout: 'grid',
        is_default: false,
        shared_with: []
      }

      mockWidgetRepo.getWidgetConfiguration.mockResolvedValue(mockConfig)

      const result = await service.getDashboardConfiguration('user-123', 'custom-dashboard')

      expect(mockWidgetRepo.getWidgetConfiguration).toHaveBeenCalledWith('user-123', 'custom-dashboard')
      expect(result).toEqual(mockConfig)
    })

    it('should return default configuration when no ID provided', async () => {
      const mockDefaultConfig = {
        id: 'default-config',
        userId: 'user-123',
        dashboard_id: 'default',
        widgets: [],
        layout: 'grid',
        is_default: true,
        shared_with: []
      }

      mockWidgetRepo.getDefaultWidgetConfiguration.mockResolvedValue(mockDefaultConfig)

      const result = await service.getDashboardConfiguration('user-123')

      expect(mockWidgetRepo.getDefaultWidgetConfiguration).toHaveBeenCalledWith('user-123')
      expect(result).toEqual(mockDefaultConfig)
    })

    it('should create default dashboard if none exists', async () => {
      mockWidgetRepo.getDefaultWidgetConfiguration.mockResolvedValue(null)
      
      const mockCreatedConfig = {
        id: 'new-config',
        userId: 'user-123',
        dashboard_id: 'default',
        widgets: expect.any(Array),
        layout: 'grid',
        is_default: true,
        shared_with: []
      }

      mockWidgetRepo.createWidgetConfiguration.mockResolvedValue(mockCreatedConfig)

      const result = await service.getDashboardConfiguration('user-123')

      expect(mockWidgetRepo.createWidgetConfiguration).toHaveBeenCalled()
      expect(result).toEqual(mockCreatedConfig)
    })
  })

  describe('data aggregation', () => {
    it('should aggregate time series data by week correctly', async () => {
      const dailyData = {
        valuation: [
          { ...mockAnalyticsData[0], value: 100, timestamp: new Date('2024-01-01') },
          { ...mockAnalyticsData[0], value: 200, timestamp: new Date('2024-01-02') },
          { ...mockAnalyticsData[0], value: 300, timestamp: new Date('2024-01-08') } // Next week
        ]
      }

      const aggregated = service['aggregateTimeSeriesData'](dailyData, 'week')

      expect(aggregated.valuation).toHaveLength(2) // Two weeks
      expect(aggregated.valuation[0].value).toBe(150) // Average of 100 and 200
      expect(aggregated.valuation[1].value).toBe(300) // Single value
    })

    it('should aggregate time series data by month correctly', async () => {
      const dailyData = {
        metric: [
          { ...mockAnalyticsData[0], value: 100, timestamp: new Date('2024-01-15') },
          { ...mockAnalyticsData[0], value: 200, timestamp: new Date('2024-01-20') },
          { ...mockAnalyticsData[0], value: 300, timestamp: new Date('2024-02-15') } // Next month
        ]
      }

      const aggregated = service['aggregateTimeSeriesData'](dailyData, 'month')

      expect(aggregated.metric).toHaveLength(2) // Two months
      expect(aggregated.metric[0].value).toBe(150) // Average for January
    })
  })

  describe('error handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockAnalyticsRepo.getTimeSeriesData.mockRejectedValue(new Error('Database connection failed'))

      const result = await service.generateTimeSeriesData(mockTimeSeriesRequest)

      // Should return mock data instead of throwing
      expect(result).toHaveProperty('valuation')
      expect(result).toHaveProperty('health_score')
    })

    it('should validate time ranges properly', async () => {
      const invalidRequest = {
        ...mockTimeSeriesRequest,
        timeRange: {
          start: new Date('2024-12-31'),
          end: new Date('2024-01-01') // End before start
        }
      }

      // This would be caught at the API level, but service should handle gracefully
      mockAnalyticsRepo.getTimeSeriesData.mockRejectedValue(new Error('Invalid time range'))

      const result = await service.generateTimeSeriesData(invalidRequest)
      expect(result).toBeDefined() // Should return mock data
    })
  })
})