import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Mock auth store
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  businessName: 'Test Business',
  subscriptionTier: 'professional'
}

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({
    user: mockUser,
    isLoading: false
  })
}))

// Mock dashboard data hook
const mockDashboardData = {
  financial: {
    trends: [
      { year: 2021, revenue: 1000000, profit: 150000, cashFlow: 200000, growthRate: { revenue: 10, profit: 15, cashFlow: 12 } },
      { year: 2022, revenue: 1100000, profit: 172500, cashFlow: 224000, growthRate: { revenue: 10, profit: 15, cashFlow: 12 } },
      { year: 2023, revenue: 1210000, profit: 198375, cashFlow: 250880, growthRate: { revenue: 10, profit: 15, cashFlow: 12 } }
    ],
    projections: [
      { year: 2024, revenue: 1331000, profit: 228131, cashFlow: 281987, growthRate: { revenue: 10, profit: 15, cashFlow: 12 } }
    ],
    benchmarks: {
      industry: [
        { year: 2021, revenue: 850000, profit: 127500, cashFlow: 170000, growthRate: { revenue: 8, profit: 12, cashFlow: 10 } }
      ],
      market: [
        { year: 2021, revenue: 1200000, profit: 180000, cashFlow: 240000, growthRate: { revenue: 12, profit: 18, cashFlow: 15 } }
      ]
    },
    insights: {
      strongestMetric: 'profit' as const,
      volatilityIndex: 15.2,
      trendDirection: 'positive' as const,
      recommendations: ['Focus on revenue diversification', 'Improve profit margins']
    }
  },
  customerRisk: {
    customers: [
      {
        customerId: 'cust-1',
        customerName: 'Customer A',
        revenueContribution: 300000,
        percentageOfTotal: 25,
        contractDuration: 24,
        riskScore: 65,
        riskCategory: 'medium' as const,
        lastOrderDate: new Date('2023-12-01'),
        paymentHistory: 'good' as const
      }
    ],
    topCustomersRisk: {
      top5Percentage: 45,
      top10Percentage: 65,
      concentrationIndex: 55
    },
    riskMetrics: {
      overallRiskScore: 60,
      diversificationScore: 75,
      vulnerabilityIndex: 25
    },
    heatMapData: [],
    recommendations: ['Diversify customer base', 'Improve payment terms']
  },
  competitive: {
    metrics: [
      {
        metric: 'Market Share',
        companyScore: 15,
        industryAverage: 12,
        topPerformerScore: 25,
        weight: 0.3,
        category: 'market' as const
      }
    ],
    overallPosition: {
      score: 72,
      ranking: 25,
      totalCompetitors: 100,
      marketPosition: 'challenger' as const
    },
    strengths: ['Strong market presence'],
    weaknesses: ['Limited product portfolio'],
    opportunities: ['Digital transformation'],
    threats: ['Increased competition'],
    benchmarkData: {}
  },
  investment: {
    scenarios: [
      {
        id: 'scenario-1',
        name: 'Market Expansion',
        investmentAmount: 500000,
        expectedReturn: 20,
        timeHorizon: 3,
        riskLevel: 'medium' as const,
        category: 'expansion' as const
      }
    ],
    calculations: [
      {
        scenario: {
          id: 'scenario-1',
          name: 'Market Expansion',
          investmentAmount: 500000,
          expectedReturn: 20,
          timeHorizon: 3,
          riskLevel: 'medium' as const,
          category: 'expansion' as const
        },
        projectedROI: 20,
        netPresentValue: 150000,
        internalRateOfReturn: 18,
        paybackPeriod: 2.5,
        riskAdjustedReturn: 17,
        cashFlowProjection: [
          { year: 0, cashFlow: -500000, cumulativeCashFlow: -500000 },
          { year: 1, cashFlow: 100000, cumulativeCashFlow: -400000 },
          { year: 2, cashFlow: 200000, cumulativeCashFlow: -200000 },
          { year: 3, cashFlow: 300000, cumulativeCashFlow: 100000 }
        ]
      }
    ],
    comparison: {
      bestROI: {
        scenario: {
          id: 'scenario-1',
          name: 'Market Expansion',
          investmentAmount: 500000,
          expectedReturn: 20,
          timeHorizon: 3,
          riskLevel: 'medium' as const,
          category: 'expansion' as const
        },
        projectedROI: 20,
        netPresentValue: 150000,
        internalRateOfReturn: 18,
        paybackPeriod: 2.5,
        riskAdjustedReturn: 17,
        cashFlowProjection: []
      },
      safestInvestment: {
        scenario: {
          id: 'scenario-1',
          name: 'Market Expansion',
          investmentAmount: 500000,
          expectedReturn: 20,
          timeHorizon: 3,
          riskLevel: 'medium' as const,
          category: 'expansion' as const
        },
        projectedROI: 20,
        netPresentValue: 150000,
        internalRateOfReturn: 18,
        paybackPeriod: 2.5,
        riskAdjustedReturn: 17,
        cashFlowProjection: []
      },
      fastestPayback: {
        scenario: {
          id: 'scenario-1',
          name: 'Market Expansion',
          investmentAmount: 500000,
          expectedReturn: 20,
          timeHorizon: 3,
          riskLevel: 'medium' as const,
          category: 'expansion' as const
        },
        projectedROI: 20,
        netPresentValue: 150000,
        internalRateOfReturn: 18,
        paybackPeriod: 2.5,
        riskAdjustedReturn: 17,
        cashFlowProjection: []
      }
    },
    portfolioOptimization: {
      recommendedMix: [
        { scenarioId: 'scenario-1', allocation: 100 }
      ],
      expectedPortfolioROI: 20,
      riskScore: 50
    }
  },
  operational: {
    metrics: [
      {
        department: 'Sales',
        currentCapacity: 85,
        maximumCapacity: 100,
        utilizationRate: 85,
        bottleneckScore: 30,
        efficiency: 92,
        growthPotential: 15
      }
    ],
    overallUtilization: 82,
    bottlenecks: [
      {
        department: 'Manufacturing',
        severity: 'moderate' as const,
        impact: 65,
        suggestedActions: ['Increase production capacity', 'Optimize workflow']
      }
    ],
    optimization: {
      potentialImprovement: 12,
      quickWins: ['Automate manual processes'],
      longTermStrategy: ['Invest in new equipment']
    },
    forecasting: {
      capacityNeeds: [
        {
          timeframe: '6 months',
          additionalCapacity: 15,
          investmentRequired: 50000
        }
      ]
    }
  },
  lastUpdated: new Date('2023-12-01'),
  dataQuality: {
    completeness: 95,
    accuracy: 90,
    freshness: 85,
    overallScore: 90
  }
}

vi.mock('@/hooks/useProfessionalDashboardData', () => ({
  useProfessionalDashboardData: () => ({
    data: mockDashboardData,
    isLoading: false,
    error: null,
    refresh: vi.fn(),
    lastFetched: new Date('2023-12-01T10:00:00Z')
  })
}))

// Import components after mocks
import ProfessionalDashboardPage from '@/app/(authenticated)/dashboard/professional/page'
import { MultiYearFinancialTrends } from '@/components/dashboard/professional/MultiYearFinancialTrends'
import { CustomerConcentrationRisk } from '@/components/dashboard/professional/CustomerConcentrationRisk'
import { CompetitivePositioningChart } from '@/components/dashboard/professional/CompetitivePositioningChart'
import { InvestmentROICalculator } from '@/components/dashboard/professional/InvestmentROICalculator'
import { OperationalCapacityUtilization } from '@/components/dashboard/professional/OperationalCapacityUtilization'

describe('Professional Dashboard Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('ProfessionalDashboardPage', () => {
    it('renders professional dashboard for subscribed users', async () => {
      render(<ProfessionalDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Professional Dashboard')).toBeInTheDocument()
        expect(screen.getByText(/Advanced business intelligence and analytics for Test Business/)).toBeInTheDocument()
        expect(screen.getByText('Professional Tier')).toBeInTheDocument()
      })
    })

    it('shows upgrade prompt for non-professional users', async () => {
      vi.mocked(vi.importActual('@/stores/auth-store')).useAuthStore = () => ({
        user: { ...mockUser, subscriptionTier: 'basic' },
        isLoading: false
      })

      render(<ProfessionalDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Professional Tier Required')).toBeInTheDocument()
        expect(screen.getByText('Upgrade to Professional')).toBeInTheDocument()
      })
    })

    it('handles tab navigation correctly', async () => {
      render(<ProfessionalDashboardPage />)

      await waitFor(() => {
        const financialTab = screen.getByRole('tab', { name: /Financial/ })
        fireEvent.click(financialTab)
        expect(financialTab).toHaveAttribute('aria-selected', 'true')
      })
    })

    it('handles time range filtering', async () => {
      render(<ProfessionalDashboardPage />)

      await waitFor(() => {
        const timeRangeSelect = screen.getByDisplayValue('3 Years')
        fireEvent.click(timeRangeSelect)

        const oneYearOption = screen.getByText('1 Year')
        fireEvent.click(oneYearOption)

        expect(screen.getByDisplayValue('1 Year')).toBeInTheDocument()
      })
    })

    it('handles refresh functionality', async () => {
      const mockRefresh = vi.fn()
      vi.mocked(vi.importActual('@/hooks/useProfessionalDashboardData')).useProfessionalDashboardData = () => ({
        data: mockDashboardData,
        isLoading: false,
        error: null,
        refresh: mockRefresh,
        lastFetched: new Date()
      })

      render(<ProfessionalDashboardPage />)

      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: /refresh/i })
        fireEvent.click(refreshButton)
        expect(mockRefresh).toHaveBeenCalled()
      })
    })
  })

  describe('MultiYearFinancialTrends', () => {
    it('renders financial trend chart with data', () => {
      render(
        <MultiYearFinancialTrends
          data={mockDashboardData.financial}
          loading={false}
          error={null}
        />
      )

      expect(screen.getByText('Multi-Year Financial Trends')).toBeInTheDocument()
      expect(screen.getByText(/3-year revenue, profit, and cash flow analysis/)).toBeInTheDocument()
    })

    it('shows loading state correctly', () => {
      render(
        <MultiYearFinancialTrends
          data={mockDashboardData.financial}
          loading={true}
          error={null}
        />
      )

      expect(screen.getByText('Loading financial trend data...')).toBeInTheDocument()
    })

    it('handles chart type changes', () => {
      render(
        <MultiYearFinancialTrends
          data={mockDashboardData.financial}
          loading={false}
          error={null}
        />
      )

      const chartTypeSelect = screen.getByDisplayValue('Line')
      fireEvent.click(chartTypeSelect)

      const barOption = screen.getByText('Bar')
      fireEvent.click(barOption)

      expect(screen.getByDisplayValue('Bar')).toBeInTheDocument()
    })

    it('displays key metrics correctly', () => {
      render(
        <MultiYearFinancialTrends
          data={mockDashboardData.financial}
          loading={false}
          error={null}
        />
      )

      expect(screen.getByText('CAGR')).toBeInTheDocument()
      expect(screen.getByText('Latest Revenue')).toBeInTheDocument()
      expect(screen.getByText('Volatility Index')).toBeInTheDocument()
    })
  })

  describe('CustomerConcentrationRisk', () => {
    it('renders customer risk dashboard with data', () => {
      render(
        <CustomerConcentrationRisk
          data={mockDashboardData.customerRisk}
          loading={false}
          error={null}
        />
      )

      expect(screen.getByText('Customer Concentration Risk Dashboard')).toBeInTheDocument()
      expect(screen.getByText(/Heat maps and risk indicators/)).toBeInTheDocument()
    })

    it('displays risk metrics correctly', () => {
      render(
        <CustomerConcentrationRisk
          data={mockDashboardData.customerRisk}
          loading={false}
          error={null}
        />
      )

      expect(screen.getByText('Concentration Risk')).toBeInTheDocument()
      expect(screen.getByText('Top 5 Customers')).toBeInTheDocument()
      expect(screen.getByText('Diversification')).toBeInTheDocument()
    })

    it('handles view mode changes', () => {
      render(
        <CustomerConcentrationRisk
          data={mockDashboardData.customerRisk}
          loading={false}
          error={null}
        />
      )

      const viewSelect = screen.getByDisplayValue('Overview')
      fireEvent.click(viewSelect)

      const heatMapOption = screen.getByText('Heat Map')
      fireEvent.click(heatMapOption)

      expect(screen.getByDisplayValue('Heat Map')).toBeInTheDocument()
    })
  })

  describe('CompetitivePositioningChart', () => {
    it('renders competitive analysis with data', () => {
      render(
        <CompetitivePositioningChart
          data={mockDashboardData.competitive}
          loading={false}
          error={null}
        />
      )

      expect(screen.getByText('Competitive Positioning Analysis')).toBeInTheDocument()
      expect(screen.getByText(/Market position analysis with industry benchmarks/)).toBeInTheDocument()
    })

    it('displays market position summary', () => {
      render(
        <CompetitivePositioningChart
          data={mockDashboardData.competitive}
          loading={false}
          error={null}
        />
      )

      expect(screen.getByText('Overall Score')).toBeInTheDocument()
      expect(screen.getByText('Market Position')).toBeInTheDocument()
      expect(screen.getByText('Market Ranking')).toBeInTheDocument()
    })

    it('handles chart type switching', () => {
      render(
        <CompetitivePositioningChart
          data={mockDashboardData.competitive}
          loading={false}
          error={null}
        />
      )

      const chartTypeSelect = screen.getByDisplayValue('Radar')
      fireEvent.click(chartTypeSelect)

      const barOption = screen.getByText('Bar Chart')
      fireEvent.click(barOption)

      expect(screen.getByDisplayValue('Bar Chart')).toBeInTheDocument()
    })
  })

  describe('InvestmentROICalculator', () => {
    it('renders investment calculator with data', () => {
      render(
        <InvestmentROICalculator
          data={mockDashboardData.investment}
          loading={false}
          error={null}
        />
      )

      expect(screen.getByText('Investment ROI Calculator')).toBeInTheDocument()
      expect(screen.getByText(/Interactive scenario modeling/)).toBeInTheDocument()
    })

    it('displays summary metrics correctly', () => {
      render(
        <InvestmentROICalculator
          data={mockDashboardData.investment}
          loading={false}
          error={null}
        />
      )

      expect(screen.getByText('Best ROI')).toBeInTheDocument()
      expect(screen.getByText('Safest Investment')).toBeInTheDocument()
      expect(screen.getByText('Fastest Payback')).toBeInTheDocument()
      expect(screen.getByText('Portfolio ROI')).toBeInTheDocument()
    })

    it('handles tab navigation between modes', () => {
      render(
        <InvestmentROICalculator
          data={mockDashboardData.investment}
          loading={false}
          error={null}
        />
      )

      const createTab = screen.getByRole('tab', { name: /Create/ })
      fireEvent.click(createTab)
      expect(createTab).toHaveAttribute('aria-selected', 'true')

      const compareTab = screen.getByRole('tab', { name: /Compare/ })
      fireEvent.click(compareTab)
      expect(compareTab).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('OperationalCapacityUtilization', () => {
    it('renders operational capacity analysis with data', () => {
      render(
        <OperationalCapacityUtilization
          data={mockDashboardData.operational}
          loading={false}
          error={null}
        />
      )

      expect(screen.getByText('Operational Capacity Utilization')).toBeInTheDocument()
      expect(screen.getByText(/Current vs maximum capacity analysis/)).toBeInTheDocument()
    })

    it('displays capacity metrics correctly', () => {
      render(
        <OperationalCapacityUtilization
          data={mockDashboardData.operational}
          loading={false}
          error={null}
        />
      )

      expect(screen.getByText('Overall Utilization')).toBeInTheDocument()
      expect(screen.getByText('Active Bottlenecks')).toBeInTheDocument()
      expect(screen.getByText('Improvement Potential')).toBeInTheDocument()
      expect(screen.getByText('Quick Wins')).toBeInTheDocument()
    })

    it('handles view mode switching', () => {
      render(
        <OperationalCapacityUtilization
          data={mockDashboardData.operational}
          loading={false}
          error={null}
        />
      )

      const utilizationTab = screen.getByRole('tab', { name: /Utilization/ })
      fireEvent.click(utilizationTab)
      expect(utilizationTab).toHaveAttribute('aria-selected', 'true')

      const bottlenecksTab = screen.getByRole('tab', { name: /Bottlenecks/ })
      fireEvent.click(bottlenecksTab)
      expect(bottlenecksTab).toHaveAttribute('aria-selected', 'true')
    })

    it('shows bottleneck details correctly', () => {
      render(
        <OperationalCapacityUtilization
          data={mockDashboardData.operational}
          loading={false}
          error={null}
        />
      )

      const bottlenecksTab = screen.getByRole('tab', { name: /Bottlenecks/ })
      fireEvent.click(bottlenecksTab)

      expect(screen.getByText('Manufacturing')).toBeInTheDocument()
      expect(screen.getByText('moderate severity')).toBeInTheDocument()
      expect(screen.getByText('Suggested Actions:')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('displays error states correctly for all components', () => {
      const error = new Error('Test error message')

      const components = [
        { Component: MultiYearFinancialTrends, data: mockDashboardData.financial },
        { Component: CustomerConcentrationRisk, data: mockDashboardData.customerRisk },
        { Component: CompetitivePositioningChart, data: mockDashboardData.competitive },
        { Component: InvestmentROICalculator, data: mockDashboardData.investment },
        { Component: OperationalCapacityUtilization, data: mockDashboardData.operational }
      ]

      components.forEach(({ Component, data }) => {
        const { unmount } = render(
          <Component
            data={data}
            loading={false}
            error={error}
          />
        )

        expect(screen.getByText('Test error message')).toBeInTheDocument()
        unmount()
      })
    })
  })

  describe('Export Functionality', () => {
    it('handles export requests correctly', async () => {
      const mockExport = vi.fn().mockResolvedValue('/mock-export-url')

      render(
        <MultiYearFinancialTrends
          data={mockDashboardData.financial}
          loading={false}
          error={null}
          onExport={mockExport}
        />
      )

      const exportButton = screen.getByRole('button', { name: /download/i })
      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(mockExport).toHaveBeenCalledWith('png')
      })
    })
  })

  describe('Performance Requirements', () => {
    it('loads components within performance requirements', async () => {
      const startTime = performance.now()

      render(<ProfessionalDashboardPage />)

      await waitFor(() => {
        const endTime = performance.now()
        const loadTime = endTime - startTime

        // Should load within 2 seconds (2000ms)
        expect(loadTime).toBeLessThan(2000)
      })
    })

    it('handles interactions within 200ms', async () => {
      render(<ProfessionalDashboardPage />)

      await waitFor(() => {
        const startTime = performance.now()

        const financialTab = screen.getByRole('tab', { name: /Financial/ })
        fireEvent.click(financialTab)

        const endTime = performance.now()
        const interactionTime = endTime - startTime

        // Should respond within 200ms
        expect(interactionTime).toBeLessThan(200)
      })
    })
  })

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      })
    })

    it('renders correctly on mobile devices', async () => {
      render(<ProfessionalDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Professional Dashboard')).toBeInTheDocument()
        // Components should still be accessible on mobile
        expect(screen.getByRole('tablist')).toBeInTheDocument()
      })
    })
  })

  describe('Data Quality Indicators', () => {
    it('displays data quality metrics correctly', async () => {
      render(<ProfessionalDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Data Quality: 90%')).toBeInTheDocument()
        expect(screen.getByText('95%')).toBeInTheDocument() // Data Completeness
        expect(screen.getByText('85%')).toBeInTheDocument() // Data Freshness
      })
    })
  })
})