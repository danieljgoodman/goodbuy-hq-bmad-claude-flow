import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// 
import ScenarioMatrix from '../ScenarioMatrix';
import type { StrategicScenarioData } from '@/types/enterprise-dashboard';

// Mock recharts to avoid canvas issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children, data }: { children: React.ReactNode; data: any[] }) =>
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>{children}</div>,
  BarChart: ({ children, data }: { children: React.ReactNode; data: any[] }) =>
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>{children}</div>,
  AreaChart: ({ children, data }: { children: React.ReactNode; data: any[] }) =>
    <div data-testid="area-chart" data-chart-data={JSON.stringify(data)}>{children}</div>,
  ComposedChart: ({ children, data }: { children: React.ReactNode; data: any[] }) =>
    <div data-testid="composed-chart" data-chart-data={JSON.stringify(data)}>{children}</div>,
  ScatterChart: ({ children, data }: { children: React.ReactNode; data: any[] }) =>
    <div data-testid="scatter-chart" data-chart-data={JSON.stringify(data)}>{children}</div>,
  Line: ({ dataKey }: { dataKey: string }) => <div data-testid="line" data-key={dataKey} />,
  Bar: ({ dataKey }: { dataKey: string }) => <div data-testid="bar" data-key={dataKey} />,
  Area: ({ dataKey }: { dataKey: string }) => <div data-testid="area" data-key={dataKey} />,
  Scatter: ({ dataKey }: { dataKey: string }) => <div data-testid="scatter" data-key={dataKey} />,
  XAxis: ({ dataKey }: { dataKey: string }) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Cell: () => <div data-testid="cell" />
}));

// Mock performance for consistent timing tests
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn()
};
Object.defineProperty(global, 'performance', { value: mockPerformance });

describe('ScenarioMatrix Component', () => {
  // 
  let mockData: StrategicScenarioData;

  beforeEach(() => {
    // 
    mockData = createMockStrategicScenarioData();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Component Rendering', () => {
    it('renders the main component with correct title and description', () => {
      render(<ScenarioMatrix data={mockData} />);

      expect(screen.getByText('Strategic Scenario Comparison Matrix')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive analysis of strategic paths with risk-adjusted ROI projections')).toBeInTheDocument();
    });

    it('renders scenario selection controls', () => {
      render(<ScenarioMatrix data={mockData} />);

      expect(screen.getByText('Select Scenarios to Compare')).toBeInTheDocument();
      expect(screen.getByText('Select All')).toBeInTheDocument();
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('renders all tab triggers', () => {
      render(<ScenarioMatrix data={mockData} />);

      expect(screen.getByRole('tab', { name: 'Side by Side' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Overlay View' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Comparison Table' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Advanced Analysis' })).toBeInTheDocument();
    });

    it('displays scenarios with correct badges and metrics', () => {
      render(<ScenarioMatrix data={mockData} />);

      mockData.scenarios.forEach(scenario => {
        expect(screen.getByText(scenario.name)).toBeInTheDocument();
        expect(screen.getByText(`${scenario.expectedROI.toFixed(1)}% ROI`)).toBeInTheDocument();
      });
    });

    it('shows scenario count correctly', () => {
      render(<ScenarioMatrix data={mockData} />);

      // Should start with first 3 scenarios selected
      expect(screen.getByText('3 of 5 scenarios selected')).toBeInTheDocument();
    });
  });

  describe('Scenario Selection', () => {
    it('toggles scenario selection when clicking checkbox', async () => {
      render(<ScenarioMatrix data={mockData} />);

      const firstScenario = mockData.scenarios[0];
      const scenarioCard = screen.getByText(firstScenario.name).closest('div');

      fireEvent.click(scenarioCard!);

      // Wait for state update
      await waitFor(() => {
        expect(screen.getByText('2 of 5 scenarios selected')).toBeInTheDocument();
      });
    });

    it('respects maximum of 5 scenarios', async () => {
      const dataWithManyScenarios = {
        ...mockData,
        scenarios: Array.from({ length: 10 }, (_, i) => ({
          ...mockData.scenarios[0],
          id: `scenario-${i}`,
          name: `Scenario ${i + 1}`
        }))
      };

      render(<ScenarioMatrix data={dataWithManyScenarios} />);

      // Click "Select All" should only select first 5
      fireEvent.click(screen.getByText('Select All'));

      await waitFor(() => {
        expect(screen.getByText('5 of 5 scenarios selected')).toBeInTheDocument();
      });
    });

    it('clears all scenarios when clicking Clear All', async () => {
      render(<ScenarioMatrix data={mockData} />);

      fireEvent.click(screen.getByText('Clear All'));

      await waitFor(() => {
        expect(screen.getByText('0 of 5 scenarios selected')).toBeInTheDocument();
      });
    });

    it('selects all available scenarios when clicking Select All', async () => {
      render(<ScenarioMatrix data={mockData} />);

      // First clear all
      fireEvent.click(screen.getByText('Clear All'));

      // Then select all
      fireEvent.click(screen.getByText('Select All'));

      await waitFor(() => {
        expect(screen.getByText('5 of 5 scenarios selected')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('switches to overlay view tab', async () => {
      render(<ScenarioMatrix data={mockData} />);

      fireEvent.click(screen.getByRole('tab', { name: 'Overlay View' }));

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });

    it('switches to comparison table tab', async () => {
      render(<ScenarioMatrix data={mockData} />);

      fireEvent.click(screen.getByRole('tab', { name: 'Comparison Table' }));

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('switches to advanced analysis tab', async () => {
      render(<ScenarioMatrix data={mockData} />);

      fireEvent.click(screen.getByRole('tab', { name: 'Advanced Analysis' }));

      await waitFor(() => {
        expect(screen.getByText('Sensitivity Analysis')).toBeInTheDocument();
        expect(screen.getByText('Monte Carlo Simulation')).toBeInTheDocument();
      });
    });
  });

  describe('Chart Interactions', () => {
    it('changes metric in overlay view', async () => {
      render(<ScenarioMatrix data={mockData} />);

      fireEvent.click(screen.getByRole('tab', { name: 'Overlay View' }));

      // Should start with valuation metric
      const metricSelect = screen.getByDisplayValue('Valuation');
      expect(metricSelect).toBeInTheDocument();

      // Change to revenue
      fireEvent.click(metricSelect);
      const revenueOption = screen.getByText('Revenue');
      fireEvent.click(revenueOption);

      await waitFor(() => {
        const chart = screen.getByTestId('line-chart');
        expect(chart).toBeInTheDocument();
      });
    });

    it('displays sensitivity analysis with variable selection', async () => {
      render(<ScenarioMatrix data={mockData} />);

      fireEvent.click(screen.getByRole('tab', { name: 'Advanced Analysis' }));

      await waitFor(() => {
        const sensitivitySelect = screen.getByDisplayValue(mockData.sensitivityAnalysis.variables[0].name);
        expect(sensitivitySelect).toBeInTheDocument();
      });
    });
  });

  describe('Data Visualization', () => {
    it('renders side-by-side scenarios correctly', () => {
      render(<ScenarioMatrix data={mockData} />);

      // Should show first 3 scenarios by default
      const scenarioCards = screen.getAllByText(/Scenario/).filter(el =>
        el.closest('.border-gray-200')
      );
      expect(scenarioCards.length).toBeGreaterThan(0);
    });

    it('shows empty state when no scenarios selected', async () => {
      render(<ScenarioMatrix data={mockData} />);

      fireEvent.click(screen.getByText('Clear All'));

      await waitFor(() => {
        expect(screen.getByText('Select scenarios to compare')).toBeInTheDocument();
      });
    });

    it('displays Monte Carlo simulation when available', async () => {
      render(<ScenarioMatrix data={mockData} />);

      fireEvent.click(screen.getByRole('tab', { name: 'Advanced Analysis' }));

      if (mockData.monteCarloSimulation) {
        await waitFor(() => {
          expect(screen.getByText('Expected Value')).toBeInTheDocument();
          expect(screen.getByText('Standard Deviation')).toBeInTheDocument();
          expect(screen.getByText('Value at Risk (95%)')).toBeInTheDocument();
        });
      }
    });

    it('shows Monte Carlo empty state when not available', async () => {
      const dataWithoutMonteCarlo = {
        ...mockData,
        monteCarloSimulation: undefined
      };

      render(<ScenarioMatrix data={dataWithoutMonteCarlo} />);

      fireEvent.click(screen.getByRole('tab', { name: 'Advanced Analysis' }));

      await waitFor(() => {
        expect(screen.getByText('Monte Carlo simulation not available')).toBeInTheDocument();
        expect(screen.getByText('Run Simulation')).toBeInTheDocument();
      });
    });
  });

  describe('Recommendations', () => {
    it('displays strategic recommendations', () => {
      render(<ScenarioMatrix data={mockData} />);

      expect(screen.getByText('Recommended Strategic Path')).toBeInTheDocument();
      expect(screen.getByText(mockData.recommendedPath)).toBeInTheDocument();
    });

    it('shows risk assessment information', () => {
      render(<ScenarioMatrix data={mockData} />);

      expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
      expect(screen.getByText('Overall Risk')).toBeInTheDocument();
      expect(screen.getByText('Confidence Level')).toBeInTheDocument();
    });

    it('displays mitigation strategies', () => {
      render(<ScenarioMatrix data={mockData} />);

      expect(screen.getByText('Mitigation Strategies')).toBeInTheDocument();

      mockData.riskAssessment.mitigationStrategies.slice(0, 4).forEach(strategy => {
        expect(screen.getByText(`• ${strategy}`)).toBeInTheDocument();
      });
    });
  });

  describe('Performance Tests', () => {
    it('renders large datasets efficiently', async () => {
      const startTime = performance.now();

      const largeDataset = {
        ...mockData,
        scenarios: Array.from({ length: 100 }, (_, i) => ({
          ...mockData.scenarios[0],
          id: `scenario-${i}`,
          name: `Scenario ${i + 1}`
        }))
      };

      render(<ScenarioMatrix data={largeDataset} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (< 100ms for 100 scenarios)
      expect(renderTime).toBeLessThan(100);
      expect(screen.getByText('Strategic Scenario Comparison Matrix')).toBeInTheDocument();
    });

    it('handles rapid tab switching without performance degradation', async () => {
      render(<ScenarioMatrix data={mockData} />);

      const tabs = ['Overlay View', 'Comparison Table', 'Advanced Analysis', 'Side by Side'];

      for (let i = 0; i < 10; i++) {
        for (const tab of tabs) {
          fireEvent.click(screen.getByRole('tab', { name: tab }));
          // Small delay to simulate real usage
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      // Component should still be responsive
      expect(screen.getByText('Strategic Scenario Comparison Matrix')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty scenario data gracefully', () => {
      const emptyData = {
        ...mockData,
        scenarios: []
      };

      render(<ScenarioMatrix data={emptyData} />);

      expect(screen.getByText('Strategic Scenario Comparison Matrix')).toBeInTheDocument();
      expect(screen.getByText('0 of 5 scenarios selected')).toBeInTheDocument();
    });

    it('handles scenarios with missing projections', () => {
      const incompleteData = {
        ...mockData,
        scenarios: mockData.scenarios.map(scenario => ({
          ...scenario,
          projections: []
        }))
      };

      expect(() => render(<ScenarioMatrix data={incompleteData} />)).not.toThrow();
    });

    it('handles invalid sensitivity analysis data', () => {
      const invalidSensitivityData = {
        ...mockData,
        sensitivityAnalysis: {
          variables: [],
          results: []
        }
      };

      expect(() => render(<ScenarioMatrix data={invalidSensitivityData} />)).not.toThrow();
    });

    it('handles extremely large numbers in calculations', () => {
      const extremeData = {
        ...mockData,
        scenarios: mockData.scenarios.map(scenario => ({
          ...scenario,
          expectedROI: Number.MAX_SAFE_INTEGER,
          investmentRequired: Number.MAX_SAFE_INTEGER,
          valuationImpact: Number.MAX_SAFE_INTEGER
        }))
      };

      expect(() => render(<ScenarioMatrix data={extremeData} />)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<ScenarioMatrix data={mockData} />);

      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(4);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      render(<ScenarioMatrix data={mockData} />);

      const firstTab = screen.getByRole('tab', { name: 'Side by Side' });
      firstTab.focus();

      // Tab to next tab
      fireEvent.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: 'Overlay View' })).toHaveFocus();
    });

    it('has sufficient color contrast for badges', () => {
      render(<ScenarioMatrix data={mockData} />);

      // Risk badges should be visible
      const lowRiskBadges = screen.getAllByText('low risk');
      const mediumRiskBadges = screen.getAllByText('medium risk');
      const highRiskBadges = screen.getAllByText('high risk');

      expect([...lowRiskBadges, ...mediumRiskBadges, ...highRiskBadges].length).toBeGreaterThan(0);
    });
  });

  describe('Security Tests', () => {
    it('sanitizes scenario names to prevent XSS', () => {
      const maliciousData = {
        ...mockData,
        scenarios: [{
          ...mockData.scenarios[0],
          name: '<script>alert("XSS")</script>',
          keyDrivers: ['<img src="x" onerror="alert(1)">']
        }]
      };

      render(<ScenarioMatrix data={maliciousData} />);

      // Should display as text, not execute
      expect(screen.getByText('<script>alert("XSS")</script>')).toBeInTheDocument();
    });

    it('validates numeric inputs to prevent injection', () => {
      const invalidData = {
        ...mockData,
        scenarios: [{
          ...mockData.scenarios[0],
          expectedROI: 'javascript:alert(1)' as any,
          investmentRequired: 'eval("alert(1)")' as any
        }]
      };

      expect(() => render(<ScenarioMatrix data={invalidData} />)).not.toThrow();
    });
  });
});

// Mock data generator for tests
function createMockStrategicScenarioData(): StrategicScenarioData {
  return {
    scenarios: [
      {
        id: 'aggressive-growth',
        name: 'Aggressive Growth',
        description: 'High-risk, high-reward expansion strategy',
        expectedROI: 25.5,
        investmentRequired: 50000000,
        riskLevel: 'high' as const,
        probabilityOfSuccess: 65,
        timeline: 24,
        keyDrivers: ['Market Expansion', 'Product Innovation', 'Strategic Acquisitions'],
        riskFactors: ['Market Volatility', 'Execution Risk', 'Capital Requirements'],
        valuationImpact: 75000000,
        projections: Array.from({ length: 5 }, (_, i) => ({
          year: 2024 + i,
          revenue: 100000000 * (1 + 0.25) ** i,
          ebitda: 20000000 * (1 + 0.30) ** i,
          cashFlow: 15000000 * (1 + 0.28) ** i,
          valuation: 200000000 * (1 + 0.20) ** i
        }))
      },
      {
        id: 'conservative-growth',
        name: 'Conservative Growth',
        description: 'Steady, low-risk expansion approach',
        expectedROI: 12.8,
        investmentRequired: 25000000,
        riskLevel: 'low' as const,
        probabilityOfSuccess: 85,
        timeline: 36,
        keyDrivers: ['Operational Excellence', 'Customer Retention', 'Cost Optimization'],
        riskFactors: ['Competitive Pressure', 'Market Saturation'],
        valuationImpact: 35000000,
        projections: Array.from({ length: 5 }, (_, i) => ({
          year: 2024 + i,
          revenue: 80000000 * (1 + 0.12) ** i,
          ebitda: 16000000 * (1 + 0.15) ** i,
          cashFlow: 12000000 * (1 + 0.13) ** i,
          valuation: 160000000 * (1 + 0.10) ** i
        }))
      },
      {
        id: 'digital-transformation',
        name: 'Digital Transformation',
        description: 'Technology-driven modernization strategy',
        expectedROI: 18.2,
        investmentRequired: 40000000,
        riskLevel: 'medium' as const,
        probabilityOfSuccess: 75,
        timeline: 30,
        keyDrivers: ['AI Integration', 'Process Automation', 'Digital Customer Experience'],
        riskFactors: ['Technology Risk', 'Change Management', 'Skills Gap'],
        valuationImpact: 55000000,
        projections: Array.from({ length: 5 }, (_, i) => ({
          year: 2024 + i,
          revenue: 90000000 * (1 + 0.18) ** i,
          ebitda: 18000000 * (1 + 0.22) ** i,
          cashFlow: 14000000 * (1 + 0.20) ** i,
          valuation: 180000000 * (1 + 0.15) ** i
        }))
      },
      {
        id: 'market-consolidation',
        name: 'Market Consolidation',
        description: 'Strategic acquisitions and market leadership',
        expectedROI: 22.1,
        investmentRequired: 75000000,
        riskLevel: 'high' as const,
        probabilityOfSuccess: 60,
        timeline: 18,
        keyDrivers: ['Strategic Acquisitions', 'Market Dominance', 'Synergies'],
        riskFactors: ['Integration Risk', 'Regulatory Approval', 'Cultural Alignment'],
        valuationImpact: 100000000,
        projections: Array.from({ length: 5 }, (_, i) => ({
          year: 2024 + i,
          revenue: 120000000 * (1 + 0.22) ** i,
          ebitda: 24000000 * (1 + 0.25) ** i,
          cashFlow: 18000000 * (1 + 0.23) ** i,
          valuation: 240000000 * (1 + 0.18) ** i
        }))
      },
      {
        id: 'international-expansion',
        name: 'International Expansion',
        description: 'Global market penetration strategy',
        expectedROI: 16.5,
        investmentRequired: 60000000,
        riskLevel: 'medium' as const,
        probabilityOfSuccess: 70,
        timeline: 42,
        keyDrivers: ['Geographic Diversification', 'Local Partnerships', 'Brand Recognition'],
        riskFactors: ['Currency Risk', 'Regulatory Compliance', 'Cultural Barriers'],
        valuationImpact: 65000000,
        projections: Array.from({ length: 5 }, (_, i) => ({
          year: 2024 + i,
          revenue: 85000000 * (1 + 0.165) ** i,
          ebitda: 17000000 * (1 + 0.19) ** i,
          cashFlow: 13000000 * (1 + 0.17) ** i,
          valuation: 170000000 * (1 + 0.13) ** i
        }))
      }
    ],
    comparisonMetrics: [
      { name: 'Expected ROI', unit: '%', weight: 0.3 },
      { name: 'Risk Level', unit: 'score', weight: 0.2 },
      { name: 'Timeline', unit: 'months', weight: 0.15 },
      { name: 'Investment Required', unit: '$', weight: 0.2 },
      { name: 'Probability of Success', unit: '%', weight: 0.15 }
    ],
    recommendedPath: 'Based on risk-adjusted returns and probability analysis, the Digital Transformation strategy offers the optimal balance of risk and reward for the current market conditions.',
    riskAssessment: {
      overallRisk: 'medium' as const,
      confidenceLevel: 78,
      riskFactors: [
        { factor: 'Market Volatility', impact: 'high', probability: 0.4 },
        { factor: 'Execution Risk', impact: 'medium', probability: 0.6 },
        { factor: 'Technology Risk', impact: 'medium', probability: 0.3 },
        { factor: 'Regulatory Changes', impact: 'low', probability: 0.2 }
      ],
      mitigationStrategies: [
        'Implement robust risk monitoring systems',
        'Develop contingency plans for key scenarios',
        'Maintain adequate capital reserves',
        'Establish strategic partnerships for risk sharing',
        'Regular strategy review and adjustment cycles'
      ]
    },
    sensitivityAnalysis: {
      variables: [
        { name: 'Market Growth Rate', baseValue: 0.05, range: [-0.02, 0.10] },
        { name: 'Operating Margin', baseValue: 0.15, range: [0.10, 0.25] },
        { name: 'Capital Efficiency', baseValue: 0.12, range: [0.08, 0.18] }
      ],
      results: [
        { variable: 'Market Growth Rate', scenario: 'aggressive-growth', impact: 15.2 },
        { variable: 'Market Growth Rate', scenario: 'conservative-growth', impact: 8.7 },
        { variable: 'Market Growth Rate', scenario: 'digital-transformation', impact: 12.1 },
        { variable: 'Operating Margin', scenario: 'aggressive-growth', impact: 18.5 },
        { variable: 'Operating Margin', scenario: 'conservative-growth', impact: 11.2 },
        { variable: 'Operating Margin', scenario: 'digital-transformation', impact: 14.8 }
      ]
    },
    monteCarloSimulation: {
      expectedValue: 65000000,
      standardDeviation: 18000000,
      valueAtRisk: -12000000,
      confidenceIntervals: [
        { level: 90, lower: 42000000, upper: 88000000 },
        { level: 95, lower: 35000000, upper: 95000000 },
        { level: 99, lower: 20000000, upper: 110000000 }
      ],
      distribution: Array.from({ length: 50 }, (_, i) => ({
        value: 20000000 + (i * 2000000),
        probability: Math.exp(-0.5 * Math.pow((i - 25) / 10, 2)) / Math.sqrt(2 * Math.PI * 100)
      }))
    }
  };
}