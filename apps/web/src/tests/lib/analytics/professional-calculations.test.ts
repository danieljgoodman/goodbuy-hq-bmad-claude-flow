import { describe, it, expect } from 'vitest'
import {
  FinancialAnalytics,
  CustomerRiskAnalytics,
  CompetitiveAnalytics,
  InvestmentAnalytics,
  OperationalAnalytics,
  DataQualityAnalytics
} from '@/lib/analytics/professional-calculations'
import type {
  FinancialTrendData,
  CustomerRiskData,
  CompetitiveMetric,
  CapacityMetric
} from '@/types/professional-dashboard'

describe('Professional Analytics Calculations', () => {
  describe('FinancialAnalytics', () => {
    const mockFinancialData: FinancialTrendData[] = [
      { year: 2021, revenue: 1000000, profit: 150000, cashFlow: 200000, growthRate: { revenue: 0, profit: 0, cashFlow: 0 } },
      { year: 2022, revenue: 1100000, profit: 172500, cashFlow: 224000, growthRate: { revenue: 10, profit: 15, cashFlow: 12 } },
      { year: 2023, revenue: 1210000, profit: 198375, cashFlow: 250880, growthRate: { revenue: 10, profit: 15, cashFlow: 12 } }
    ]

    describe('calculateGrowthRate', () => {
      it('calculates positive growth rate correctly', () => {
        const result = FinancialAnalytics.calculateGrowthRate(1100000, 1000000)
        expect(result).toBe(10)
      })

      it('calculates negative growth rate correctly', () => {
        const result = FinancialAnalytics.calculateGrowthRate(900000, 1000000)
        expect(result).toBe(-10)
      })

      it('handles zero previous value', () => {
        const result = FinancialAnalytics.calculateGrowthRate(1000000, 0)
        expect(result).toBe(0)
      })
    })

    describe('calculateCAGR', () => {
      it('calculates CAGR correctly for positive growth', () => {
        const result = FinancialAnalytics.calculateCAGR(1000000, 1210000, 2)
        expect(result).toBeCloseTo(10, 0) // Approximately 10% CAGR
      })

      it('handles edge cases', () => {
        expect(FinancialAnalytics.calculateCAGR(0, 1000000, 2)).toBe(0)
        expect(FinancialAnalytics.calculateCAGR(1000000, 1100000, 0)).toBe(0)
      })
    })

    describe('calculateVolatilityIndex', () => {
      it('calculates volatility correctly', () => {
        const result = FinancialAnalytics.calculateVolatilityIndex(mockFinancialData)
        expect(result).toBeGreaterThan(0)
        expect(result).toBeLessThan(100) // Reasonable volatility range
      })

      it('handles insufficient data', () => {
        const result = FinancialAnalytics.calculateVolatilityIndex([mockFinancialData[0]])
        expect(result).toBe(0)
      })
    })

    describe('generateProjections', () => {
      it('generates realistic projections', () => {
        const projections = FinancialAnalytics.generateProjections(mockFinancialData, 2)

        expect(projections).toHaveLength(2)
        expect(projections[0].year).toBe(2024)
        expect(projections[1].year).toBe(2025)
        expect(projections[0].revenue).toBeGreaterThan(mockFinancialData[2].revenue)
      })

      it('handles insufficient historical data', () => {
        const projections = FinancialAnalytics.generateProjections([mockFinancialData[0]], 2)
        expect(projections).toHaveLength(0)
      })
    })
  })

  describe('CustomerRiskAnalytics', () => {
    const mockCustomerData: CustomerRiskData[] = [
      {
        customerId: 'cust-1',
        customerName: 'Customer A',
        revenueContribution: 500000,
        percentageOfTotal: 50,
        contractDuration: 24,
        riskScore: 75,
        riskCategory: 'high',
        lastOrderDate: new Date('2023-12-01'),
        paymentHistory: 'good'
      },
      {
        customerId: 'cust-2',
        customerName: 'Customer B',
        revenueContribution: 300000,
        percentageOfTotal: 30,
        contractDuration: 12,
        riskScore: 45,
        riskCategory: 'medium',
        lastOrderDate: new Date('2023-11-15'),
        paymentHistory: 'excellent'
      },
      {
        customerId: 'cust-3',
        customerName: 'Customer C',
        revenueContribution: 200000,
        percentageOfTotal: 20,
        contractDuration: 6,
        riskScore: 25,
        riskCategory: 'low',
        lastOrderDate: new Date('2023-10-01'),
        paymentHistory: 'fair'
      }
    ]

    describe('calculateConcentrationRisk', () => {
      it('calculates high risk for concentrated customer base', () => {
        const result = CustomerRiskAnalytics.calculateConcentrationRisk(mockCustomerData)
        expect(result).toBeGreaterThan(60) // High concentration should result in high risk
      })

      it('calculates lower risk for diversified customer base', () => {
        const diversifiedData = Array.from({ length: 10 }, (_, i) => ({
          ...mockCustomerData[0],
          customerId: `cust-${i}`,
          percentageOfTotal: 10,
          revenueContribution: 100000
        }))

        const result = CustomerRiskAnalytics.calculateConcentrationRisk(diversifiedData)
        expect(result).toBeLessThan(40) // Diversified should be lower risk
      })
    })

    describe('calculateDiversificationScore', () => {
      it('calculates diversification score correctly', () => {
        const result = CustomerRiskAnalytics.calculateDiversificationScore(mockCustomerData)
        expect(result).toBeGreaterThan(0)
        expect(result).toBeLessThan(100)
      })

      it('gives higher score for more diversified base', () => {
        const diversifiedData = Array.from({ length: 5 }, (_, i) => ({
          ...mockCustomerData[0],
          customerId: `cust-${i}`,
          percentageOfTotal: 20,
          revenueContribution: 200000
        }))

        const diversifiedScore = CustomerRiskAnalytics.calculateDiversificationScore(diversifiedData)
        const concentratedScore = CustomerRiskAnalytics.calculateDiversificationScore(mockCustomerData)

        expect(diversifiedScore).toBeGreaterThan(concentratedScore)
      })
    })

    describe('generateRiskInsights', () => {
      it('generates insights for high concentration', () => {
        const analysis = {
          customers: mockCustomerData,
          topCustomersRisk: { top5Percentage: 80, top10Percentage: 100, concentrationIndex: 85 },
          riskMetrics: { overallRiskScore: 85, diversificationScore: 40, vulnerabilityIndex: 60 },
          heatMapData: [],
          recommendations: []
        }

        const insights = CustomerRiskAnalytics.generateRiskInsights(analysis)
        expect(insights).toHaveLength(1) // Should generate high concentration warning
        expect(insights[0].category).toBe('risk')
        expect(insights[0].severity).toBe('critical')
      })

      it('generates payment risk insights', () => {
        const dataWithPoorPayment = [
          ...mockCustomerData,
          {
            ...mockCustomerData[0],
            customerId: 'cust-4',
            paymentHistory: 'poor' as const,
            revenueContribution: 100000
          }
        ]

        const analysis = {
          customers: dataWithPoorPayment,
          topCustomersRisk: { top5Percentage: 40, top10Percentage: 60, concentrationIndex: 45 },
          riskMetrics: { overallRiskScore: 45, diversificationScore: 70, vulnerabilityIndex: 30 },
          heatMapData: [],
          recommendations: []
        }

        const insights = CustomerRiskAnalytics.generateRiskInsights(analysis)
        expect(insights.some(insight => insight.id === 'payment-risk')).toBe(true)
      })
    })
  })

  describe('CompetitiveAnalytics', () => {
    const mockCompetitiveMetrics: CompetitiveMetric[] = [
      {
        metric: 'Market Share',
        companyScore: 15,
        industryAverage: 12,
        topPerformerScore: 25,
        weight: 0.3,
        category: 'market'
      },
      {
        metric: 'Product Quality',
        companyScore: 85,
        industryAverage: 75,
        topPerformerScore: 90,
        weight: 0.4,
        category: 'product'
      },
      {
        metric: 'Customer Satisfaction',
        companyScore: 78,
        industryAverage: 70,
        topPerformerScore: 85,
        weight: 0.3,
        category: 'market'
      }
    ]

    describe('calculateCompetitiveScore', () => {
      it('calculates weighted competitive score correctly', () => {
        const result = CompetitiveAnalytics.calculateCompetitiveScore(mockCompetitiveMetrics)
        expect(result).toBeGreaterThan(0)
        expect(result).toBeLessThan(100)
        expect(result).toBeCloseTo(77, 0) // Approximately 77 based on weights
      })

      it('handles zero weights', () => {
        const zeroWeightMetrics = mockCompetitiveMetrics.map(m => ({ ...m, weight: 0 }))
        const result = CompetitiveAnalytics.calculateCompetitiveScore(zeroWeightMetrics)
        expect(result).toBe(0)
      })
    })

    describe('determineMarketPosition', () => {
      it('determines leader position correctly', () => {
        const result = CompetitiveAnalytics.determineMarketPosition(85, 5, 100)
        expect(result).toBe('leader')
      })

      it('determines challenger position correctly', () => {
        const result = CompetitiveAnalytics.determineMarketPosition(70, 25, 100)
        expect(result).toBe('challenger')
      })

      it('determines follower position correctly', () => {
        const result = CompetitiveAnalytics.determineMarketPosition(60, 50, 100)
        expect(result).toBe('follower')
      })

      it('determines niche position correctly', () => {
        const result = CompetitiveAnalytics.determineMarketPosition(40, 80, 100)
        expect(result).toBe('niche')
      })
    })

    describe('analyzeStrengthsWeaknesses', () => {
      it('identifies strengths and weaknesses correctly', () => {
        const { strengths, weaknesses } = CompetitiveAnalytics.analyzeStrengthsWeaknesses(mockCompetitiveMetrics)

        expect(strengths).toContain('Market Share: 125% above industry average')
        expect(strengths).toContain('Product Quality: 113% above industry average')
        expect(strengths).toContain('Customer Satisfaction: 111% above industry average')
        expect(weaknesses).toHaveLength(0) // No metrics below 80% of industry average
      })

      it('identifies weaknesses when performance is below average', () => {
        const weakMetrics = [
          {
            ...mockCompetitiveMetrics[0],
            companyScore: 8, // Below 80% of industry average (12)
            industryAverage: 12
          }
        ]

        const { strengths, weaknesses } = CompetitiveAnalytics.analyzeStrengthsWeaknesses(weakMetrics)
        expect(weaknesses).toContain('Market Share: 33% below industry average')
      })
    })
  })

  describe('InvestmentAnalytics', () => {
    describe('calculateNPV', () => {
      it('calculates NPV correctly for positive cash flows', () => {
        const cashFlows = [-100000, 30000, 40000, 50000, 60000]
        const discountRate = 0.1

        const result = InvestmentAnalytics.calculateNPV(cashFlows, discountRate)
        expect(result).toBeGreaterThan(0) // Should be positive NPV
      })

      it('calculates NPV correctly for negative scenario', () => {
        const cashFlows = [-100000, 10000, 15000, 20000]
        const discountRate = 0.15

        const result = InvestmentAnalytics.calculateNPV(cashFlows, discountRate)
        expect(result).toBeLessThan(0) // Should be negative NPV
      })
    })

    describe('calculateIRR', () => {
      it('calculates IRR for typical investment scenario', () => {
        const cashFlows = [-100000, 30000, 40000, 50000, 60000]

        const result = InvestmentAnalytics.calculateIRR(cashFlows)
        expect(result).toBeGreaterThan(0)
        expect(result).toBeLessThan(100) // Reasonable IRR range
      })

      it('handles edge cases', () => {
        const negativeCashFlows = [-100000, -10000, -5000]
        const result = InvestmentAnalytics.calculateIRR(negativeCashFlows)
        expect(typeof result).toBe('number')
      })
    })

    describe('calculatePaybackPeriod', () => {
      it('calculates payback period correctly', () => {
        const result = InvestmentAnalytics.calculatePaybackPeriod(100000, 25000)
        expect(result).toBe(4) // 100,000 / 25,000 = 4 years
      })

      it('handles zero cash flow', () => {
        const result = InvestmentAnalytics.calculatePaybackPeriod(100000, 0)
        expect(result).toBe(Infinity)
      })

      it('handles negative cash flow', () => {
        const result = InvestmentAnalytics.calculatePaybackPeriod(100000, -10000)
        expect(result).toBe(Infinity)
      })
    })

    describe('calculateRiskAdjustedReturn', () => {
      it('adjusts returns based on risk level', () => {
        const baseReturn = 20

        const lowRisk = InvestmentAnalytics.calculateRiskAdjustedReturn(baseReturn, 'low')
        const mediumRisk = InvestmentAnalytics.calculateRiskAdjustedReturn(baseReturn, 'medium')
        const highRisk = InvestmentAnalytics.calculateRiskAdjustedReturn(baseReturn, 'high')

        expect(lowRisk).toBe(19) // 20 * 0.95
        expect(mediumRisk).toBe(17) // 20 * 0.85
        expect(highRisk).toBe(14) // 20 * 0.70

        expect(lowRisk).toBeGreaterThan(mediumRisk)
        expect(mediumRisk).toBeGreaterThan(highRisk)
      })
    })
  })

  describe('OperationalAnalytics', () => {
    const mockCapacityMetrics: CapacityMetric[] = [
      {
        department: 'Sales',
        currentCapacity: 85,
        maximumCapacity: 100,
        utilizationRate: 85,
        bottleneckScore: 30,
        efficiency: 92,
        growthPotential: 15
      },
      {
        department: 'Manufacturing',
        currentCapacity: 95,
        maximumCapacity: 100,
        utilizationRate: 95,
        bottleneckScore: 75,
        efficiency: 68,
        growthPotential: 5
      },
      {
        department: 'Support',
        currentCapacity: 60,
        maximumCapacity: 100,
        utilizationRate: 60,
        bottleneckScore: 20,
        efficiency: 88,
        growthPotential: 40
      }
    ]

    describe('calculateOverallUtilization', () => {
      it('calculates overall utilization correctly', () => {
        const result = OperationalAnalytics.calculateOverallUtilization(mockCapacityMetrics)
        expect(result).toBeCloseTo(80, 0) // (240/300) * 100 = 80%
      })

      it('handles empty metrics array', () => {
        const result = OperationalAnalytics.calculateOverallUtilization([])
        expect(result).toBe(0)
      })
    })

    describe('identifyBottlenecks', () => {
      it('identifies bottlenecks correctly', () => {
        const bottlenecks = OperationalAnalytics.identifyBottlenecks(mockCapacityMetrics)

        expect(bottlenecks).toHaveLength(1) // Only Manufacturing should be identified
        expect(bottlenecks[0].department).toBe('Manufacturing')
        expect(bottlenecks[0].severity).toBe('severe') // High utilization + low efficiency
      })

      it('sorts bottlenecks by impact', () => {
        const highImpactMetrics = [
          ...mockCapacityMetrics,
          {
            department: 'Critical',
            currentCapacity: 98,
            maximumCapacity: 100,
            utilizationRate: 98,
            bottleneckScore: 90,
            efficiency: 45,
            growthPotential: 2
          }
        ]

        const bottlenecks = OperationalAnalytics.identifyBottlenecks(highImpactMetrics)
        expect(bottlenecks[0].department).toBe('Critical') // Should be first due to higher impact
      })
    })

    describe('calculateOptimizationPotential', () => {
      it('calculates optimization potential correctly', () => {
        const result = OperationalAnalytics.calculateOptimizationPotential(mockCapacityMetrics)

        const avgEfficiency = (92 + 68 + 88) / 3 // 82.67
        const expectedImprovement = 85 - avgEfficiency // ~2.33

        expect(result.potentialImprovement).toBeCloseTo(expectedImprovement, 0)
        expect(result.quickWins).toBeDefined()
        expect(result.longTermStrategy).toBeDefined()
      })

      it('generates appropriate recommendations', () => {
        const result = OperationalAnalytics.calculateOptimizationPotential(mockCapacityMetrics)

        expect(result.quickWins).toContain('Improve Manufacturing efficiency through process optimization')
        expect(result.longTermStrategy).toContain('Expand Manufacturing capacity through investment or automation')
      })
    })
  })

  describe('DataQualityAnalytics', () => {
    const mockData = {
      financial: {
        trends: [
          { revenue: 1000000, profit: 150000, cashFlow: 200000 }
        ]
      },
      customerRisk: {
        customers: [
          { name: 'Customer A', revenue: 100000 }
        ]
      },
      lastUpdated: new Date('2023-12-01T10:00:00Z')
    }

    describe('assessDataQuality', () => {
      it('calculates overall data quality score', () => {
        const result = DataQualityAnalytics.assessDataQuality(mockData)

        expect(result.completeness).toBeGreaterThan(0)
        expect(result.completeness).toBeLessThanOrEqual(100)

        expect(result.accuracy).toBeGreaterThan(0)
        expect(result.accuracy).toBeLessThanOrEqual(100)

        expect(result.freshness).toBeGreaterThan(0)
        expect(result.freshness).toBeLessThanOrEqual(100)

        expect(result.overallScore).toBe((result.completeness + result.accuracy + result.freshness) / 3)
      })

      it('penalizes for negative values in financial data', () => {
        const badData = {
          financial: {
            trends: [
              { revenue: -1000000, profit: -150000, cashFlow: 200000 }
            ]
          },
          lastUpdated: new Date()
        }

        const result = DataQualityAnalytics.assessDataQuality(badData)
        expect(result.accuracy).toBeLessThan(100) // Should be penalized for negative values
      })

      it('adjusts freshness based on last update time', () => {
        const freshData = { ...mockData, lastUpdated: new Date() }
        const staleData = { ...mockData, lastUpdated: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) } // 100 days ago

        const freshResult = DataQualityAnalytics.assessDataQuality(freshData)
        const staleResult = DataQualityAnalytics.assessDataQuality(staleData)

        expect(freshResult.freshness).toBeGreaterThan(staleResult.freshness)
      })
    })
  })

  describe('Integration Tests', () => {
    it('all calculation modules work together without errors', () => {
      const financialData: FinancialTrendData[] = [
        { year: 2021, revenue: 1000000, profit: 150000, cashFlow: 200000, growthRate: { revenue: 0, profit: 0, cashFlow: 0 } },
        { year: 2022, revenue: 1100000, profit: 172500, cashFlow: 224000, growthRate: { revenue: 10, profit: 15, cashFlow: 12 } }
      ]

      // Test that all modules can process realistic data without throwing
      expect(() => {
        FinancialAnalytics.calculateVolatilityIndex(financialData)
        FinancialAnalytics.generateProjections(financialData, 2)

        const customerData: CustomerRiskData[] = [{
          customerId: 'test',
          customerName: 'Test Customer',
          revenueContribution: 100000,
          percentageOfTotal: 10,
          contractDuration: 12,
          riskScore: 50,
          riskCategory: 'medium',
          lastOrderDate: new Date(),
          paymentHistory: 'good'
        }]

        CustomerRiskAnalytics.calculateConcentrationRisk(customerData)
        CustomerRiskAnalytics.calculateDiversificationScore(customerData)

        const competitiveMetrics: CompetitiveMetric[] = [{
          metric: 'Test Metric',
          companyScore: 80,
          industryAverage: 75,
          topPerformerScore: 90,
          weight: 1.0,
          category: 'market'
        }]

        CompetitiveAnalytics.calculateCompetitiveScore(competitiveMetrics)

        InvestmentAnalytics.calculateNPV([-100000, 30000, 40000, 50000], 0.1)
        InvestmentAnalytics.calculateRiskAdjustedReturn(20, 'medium')

        const capacityMetrics: CapacityMetric[] = [{
          department: 'Test',
          currentCapacity: 80,
          maximumCapacity: 100,
          utilizationRate: 80,
          bottleneckScore: 40,
          efficiency: 85,
          growthPotential: 20
        }]

        OperationalAnalytics.calculateOverallUtilization(capacityMetrics)
        OperationalAnalytics.identifyBottlenecks(capacityMetrics)
      }).not.toThrow()
    })
  })
})