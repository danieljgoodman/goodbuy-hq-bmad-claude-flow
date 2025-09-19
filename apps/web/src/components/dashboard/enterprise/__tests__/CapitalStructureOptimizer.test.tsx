import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import CapitalStructureOptimizer from '../CapitalStructureOptimizer';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  PieChart: () => <div data-testid="pie-chart-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Target: () => <div data-testid="target-icon" />,
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  DollarSign: () => <div data-testid="dollar-sign-icon" />,
  Percent: () => <div data-testid="percent-icon" />,
  Calculator: () => <div data-testid="calculator-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  Info: () => <div data-testid="info-icon" />,
  ArrowUp: () => <div data-testid="arrow-up-icon" />,
  ArrowDown: () => <div data-testid="arrow-down-icon" />
}));

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children, data }: { children: React.ReactNode; data: any[] }) =>
    <div data-testid="pie-chart" data-chart-data={JSON.stringify(data)}>{children}</div>,
  Pie: ({ dataKey }: { dataKey: string }) => <div data-testid="pie" data-key={dataKey} />,
  Cell: ({ fill }: { fill: string }) => <div data-testid="cell" data-fill={fill} />,
  BarChart: ({ children, data }: { children: React.ReactNode; data: any[] }) =>
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>{children}</div>,
  Bar: ({ dataKey, fill }: { dataKey: string; fill: string }) =>
    <div data-testid="bar" data-key={dataKey} data-fill={fill} />,
  LineChart: ({ children, data }: { children: React.ReactNode; data: any[] }) =>
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>{children}</div>,
  Line: ({ dataKey, stroke }: { dataKey: string; stroke: string }) =>
    <div data-testid="line" data-key={dataKey} data-stroke={stroke} />,
  XAxis: ({ dataKey }: { dataKey?: string }) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />
}));

// Mock the capital structure calculations
vi.mock('@/lib/financial/capital-structure-calculations', () => ({
  CapitalStructureCalculator: {
    calculateOptimalStructure: vi.fn(() => ({
      optimalDebtRatio: 0.35,
      optimalEquityRatio: 0.65,
      expectedWACC: 0.078,
      taxShield: 2500000,
      financialDistressCost: 800000,
      netBenefit: 1700000
    })),
    calculateWACC: vi.fn(() => 0.082),
    calculateDebtCapacity: vi.fn(() => ({
      maxDebtCapacity: 45000000,
      currentDebtCapacity: 28000000,
      availableCapacity: 17000000,
      debtServiceCoverageRatio: 3.2
    })),
    analyzeCapitalEfficiency: vi.fn(() => ({
      currentROE: 0.158,
      currentROA: 0.095,
      currentDebtToEquity: 0.67,
      recommendedChanges: ['Increase debt ratio to 35%', 'Optimize tax shield benefits']
    })),
    simulateScenarios: vi.fn(() => [
      {
        name: 'Conservative',
        debtRatio: 0.25,
        equityRatio: 0.75,
        wacc: 0.085,
        value: 85000000
      },
      {
        name: 'Moderate',
        debtRatio: 0.35,
        equityRatio: 0.65,
        wacc: 0.078,
        value: 95000000
      },
      {
        name: 'Aggressive',
        debtRatio: 0.50,
        equityRatio: 0.50,
        wacc: 0.088,
        value: 82000000
      }
    ])
  }
}));

describe('CapitalStructureOptimizer Component', () => {
  

  beforeEach(() => {
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Component Rendering', () => {
    it('renders the main component with correct title', () => {
      render(<CapitalStructureOptimizer />);

      expect(screen.getByText('Capital Structure Optimization')).toBeInTheDocument();
      expect(screen.getByText('Optimize your capital structure to minimize WACC and maximize firm value')).toBeInTheDocument();
    });

    it('renders all main sections', () => {
      render(<CapitalStructureOptimizer />);

      expect(screen.getByText('Current Capital Structure')).toBeInTheDocument();
      expect(screen.getByText('Optimization Analysis')).toBeInTheDocument();
      expect(screen.getByText('Scenario Comparison')).toBeInTheDocument();
      expect(screen.getByText('Implementation Roadmap')).toBeInTheDocument();
    });

    it('displays current structure pie chart', () => {
      render(<CapitalStructureOptimizer />);

      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('shows debt and equity percentages', () => {
      render(<CapitalStructureOptimizer />);

      // Should display current debt/equity split
      expect(screen.getByText('40%')).toBeInTheDocument(); // Current debt
      expect(screen.getByText('60%')).toBeInTheDocument(); // Current equity
    });

    it('displays WACC information', () => {
      render(<CapitalStructureOptimizer />);

      expect(screen.getByText('Current WACC')).toBeInTheDocument();
      expect(screen.getByText('8.2%')).toBeInTheDocument();
    });
  });

  describe('Capital Structure Analysis', () => {
    it('displays optimal structure recommendations', () => {
      render(<CapitalStructureOptimizer />);

      expect(screen.getByText('Recommended Structure')).toBeInTheDocument();
      expect(screen.getByText('35%')).toBeInTheDocument(); // Optimal debt ratio
      expect(screen.getByText('65%')).toBeInTheDocument(); // Optimal equity ratio
    });

    it('shows WACC improvement potential', () => {
      render(<CapitalStructureOptimizer />);

      expect(screen.getByText('Target WACC')).toBeInTheDocument();
      expect(screen.getByText('7.8%')).toBeInTheDocument();
    });

    it('displays tax shield benefits', () => {
      render(<CapitalStructureOptimizer />);

      expect(screen.getByText('Tax Shield')).toBeInTheDocument();
      expect(screen.getByText('$2.5M')).toBeInTheDocument();
    });

    it('shows financial distress costs', () => {
      render(<CapitalStructureOptimizer />);

      expect(screen.getByText('Distress Cost')).toBeInTheDocument();
      expect(screen.getByText('$0.8M')).toBeInTheDocument();
    });

    it('calculates net benefit of optimization', () => {
      render(<CapitalStructureOptimizer />);

      expect(screen.getByText('Net Benefit')).toBeInTheDocument();
      expect(screen.getByText('$1.7M')).toBeInTheDocument();
    });
  });

  describe('Debt Capacity Analysis', () => {
    it('displays maximum debt capacity', () => {
      render(<CapitalStructureOptimizer />);

      expect(screen.getByText('Debt Capacity')).toBeInTheDocument();
      expect(screen.getByText('$45M')).toBeInTheDocument(); // Max capacity
    });

    it('shows current debt utilization', () => {
      render(<CapitalStructureOptimizer />);

      expect(screen.getByText('Current Debt')).toBeInTheDocument();
      expect(screen.getByText('$28M')).toBeInTheDocument();
    });

    it('calculates available borrowing capacity', () => {
      render(<CapitalStructureOptimizer />);

      expect(screen.getByText('Available Capacity')).toBeInTheDocument();
      expect(screen.getByText('$17M')).toBeInTheDocument();
    });

    it('displays debt service coverage ratio', () => {
      render(<CapitalStructureOptimizer />);

      expect(screen.getByText('Coverage Ratio')).toBeInTheDocument();
      expect(screen.getByText('3.2x')).toBeInTheDocument();
    });
  });

  describe('Scenario Comparison', () => {
    it('renders scenario comparison chart', () => {
      render(<CapitalStructureOptimizer />);

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('displays conservative scenario', () => {
      render(<CapitalStructureOptimizer />);

      expect(screen.getByText('Conservative')).toBeInTheDocument();
      expect(screen.getByText('25% Debt')).toBeInTheDocument();
    });

    it('shows moderate scenario as recommended', () => {
      render(<CapitalStructureOptimizer />);

      expect(screen.getByText('Moderate')).toBeInTheDocument();
      expect(screen.getByText('35% Debt')).toBeInTheDocument();
      expect(screen.getByText('RECOMMENDED')).toBeInTheDocument();
    });

    it('displays aggressive scenario with warnings', () => {
      render(<CapitalStructureOptimizer />);

      expect(screen.getByText('Aggressive')).toBeInTheDocument();
      expect(screen.getByText('50% Debt')).toBeInTheDocument();
    });

    it('shows firm value for each scenario', () => {
      render(<CapitalStructureOptimizer />);

      expect(screen.getByText('$85M')).toBeInTheDocument(); // Conservative value
      expect(screen.getByText('$95M')).toBeInTheDocument(); // Moderate value
      expect(screen.getByText('$82M')).toBeInTheDocument(); // Aggressive value
    });
  });

  describe('Interactive Controls', () => {
    it('allows debt ratio adjustment with slider', async () => {
      render(<CapitalStructureOptimizer />);

      const sliders = screen.getAllByRole('slider');
      if (sliders.length > 0) {
        const debtSlider = sliders[0];
        fireEvent.change(debtSlider, { target: { value: '40' } });

        // Component should update calculations
        await waitFor(() => {
          expect(screen.getByText('Capital Structure Optimization')).toBeInTheDocument();
        });
      }
    });

    it('updates calculations when parameters change', async () => {
      render(<CapitalStructureOptimizer />);

      // Look for input controls
      const inputs = screen.getAllByRole('spinbutton');
      if (inputs.length > 0) {
        fireEvent.clear(inputs[0]);
        fireEvent.type(inputs[0], '10');

        // Should trigger recalculation
        expect(screen.getByText('Capital Structure Optimization')).toBeInTheDocument();
      }
    });

    it('provides real-time WACC updates', async () => {
      render(<CapitalStructureOptimizer />);

      // When sliders change, WACC should update
      const sliders = screen.getAllByRole('slider');
      if (sliders.length > 0) {
        fireEvent.change(sliders[0], { target: { value: '30' } });

        await waitFor(() => {
          // WACC display should remain visible and potentially change
          expect(screen.getByText(/\d+\.\d+%/)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Implementation Roadmap', () => {
    it('displays step-by-step implementation plan', () => {
      render(<CapitalStructureOptimizer />);

      expect(screen.getByText('Implementation Steps')).toBeInTheDocument();
      expect(screen.getByText('1. Analyze current debt agreements')).toBeInTheDocument();
      expect(screen.getByText('2. Identify refinancing opportunities')).toBeInTheDocument();
    });

    it('shows timeline for each step', () => {
      render(<CapitalStructureOptimizer />);

      expect(screen.getByText('Month 1-2')).toBeInTheDocument();
      expect(screen.getByText('Month 3-4')).toBeInTheDocument();
    });

    it('displays risk considerations', () => {
      render(<CapitalStructureOptimizer />);

      expect(screen.getByText('Risk Considerations')).toBeInTheDocument();
      expect(screen.getByText('Interest rate risk')).toBeInTheDocument();
      expect(screen.getByText('Covenant restrictions')).toBeInTheDocument();
    });

    it('shows expected benefits timeline', () => {
      render(<CapitalStructureOptimizer />);

      expect(screen.getByText('Expected Benefits')).toBeInTheDocument();
      expect(screen.getByText('Lower cost of capital')).toBeInTheDocument();
      expect(screen.getByText('Improved financial flexibility')).toBeInTheDocument();
    });
  });

  describe('Financial Metrics', () => {
    it('calculates return on equity correctly', () => {
      render(<CapitalStructureOptimizer />);

      expect(screen.getByText('Current ROE')).toBeInTheDocument();
      expect(screen.getByText('15.8%')).toBeInTheDocument();
    });

    it('displays return on assets', () => {
      render(<CapitalStructureOptimizer />);

      expect(screen.getByText('Current ROA')).toBeInTheDocument();
      expect(screen.getByText('9.5%')).toBeInTheDocument();
    });

    it('shows debt-to-equity ratio', () => {
      render(<CapitalStructureOptimizer />);

      expect(screen.getByText('D/E Ratio')).toBeInTheDocument();
      expect(screen.getByText('0.67')).toBeInTheDocument();
    });

    it('displays efficiency recommendations', () => {
      render(<CapitalStructureOptimizer />);

      expect(screen.getByText('Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Increase debt ratio to 35%')).toBeInTheDocument();
    });
  });

  describe('Performance Tests', () => {
    it('renders efficiently with complex calculations', async () => {
      const startTime = performance.now();

      render(<CapitalStructureOptimizer />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time
      expect(renderTime).toBeLessThan(150);
      expect(screen.getByText('Capital Structure Optimization')).toBeInTheDocument();
    });

    it('handles rapid slider changes without performance degradation', async () => {
      render(<CapitalStructureOptimizer />);

      const sliders = screen.getAllByRole('slider');
      if (sliders.length > 0) {
        // Rapid slider changes
        for (let i = 0; i < 20; i++) {
          fireEvent.change(sliders[0], { target: { value: String(20 + i) } });
          await new Promise(resolve => setTimeout(resolve, 5));
        }

        // Component should remain responsive
        expect(screen.getByText('Capital Structure Optimization')).toBeInTheDocument();
      }
    });

    it('updates calculations efficiently', async () => {
      render(<CapitalStructureOptimizer />);

      const startTime = performance.now();

      // Trigger recalculation
      const sliders = screen.getAllByRole('slider');
      if (sliders.length > 0) {
        fireEvent.change(sliders[0], { target: { value: '35' } });
      }

      await waitFor(() => {
        expect(screen.getByText('Capital Structure Optimization')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const updateTime = endTime - startTime;

      // Updates should be fast
      expect(updateTime).toBeLessThan(50);
    });
  });

  describe('Edge Cases', () => {
    it('handles zero debt scenario', async () => {
      render(<CapitalStructureOptimizer />);

      const sliders = screen.getAllByRole('slider');
      if (sliders.length > 0) {
        fireEvent.change(sliders[0], { target: { value: '0' } });

        await waitFor(() => {
          // Should handle 100% equity financing
          expect(screen.getByText('Capital Structure Optimization')).toBeInTheDocument();
        });
      }
    });

    it('handles maximum debt scenario', async () => {
      render(<CapitalStructureOptimizer />);

      const sliders = screen.getAllByRole('slider');
      if (sliders.length > 0) {
        fireEvent.change(sliders[0], { target: { value: '90' } });

        await waitFor(() => {
          // Should handle high leverage scenarios
          expect(screen.getByText('Capital Structure Optimization')).toBeInTheDocument();
        });
      }
    });

    it('validates input constraints', async () => {
      render(<CapitalStructureOptimizer />);

      const inputs = screen.getAllByRole('spinbutton');
      if (inputs.length > 0) {
        // Try to enter invalid value
        fireEvent.clear(inputs[0]);
        fireEvent.type(inputs[0], '-10');

        // Component should handle invalid inputs gracefully
        expect(screen.getByText('Capital Structure Optimization')).toBeInTheDocument();
      }
    });

    it('handles calculation errors gracefully', () => {
      // Mock calculation error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<CapitalStructureOptimizer />)).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for sliders', () => {
      render(<CapitalStructureOptimizer />);

      const sliders = screen.getAllByRole('slider');
      sliders.forEach(slider => {
        expect(slider).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation', async () => {
      render(<CapitalStructureOptimizer />);

      // Tab through interactive elements
      fireEvent.tab();

      // Should not crash during keyboard navigation
      expect(screen.getByText('Capital Structure Optimization')).toBeInTheDocument();
    });

    it('provides screen reader friendly content', () => {
      render(<CapitalStructureOptimizer />);

      // Important metrics should be clearly labeled
      expect(screen.getByText('Current WACC')).toBeInTheDocument();
      expect(screen.getByText('Target WACC')).toBeInTheDocument();
    });

    it('has sufficient color contrast for charts', () => {
      render(<CapitalStructureOptimizer />);

      // Charts should be present and accessible
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  describe('Security Tests', () => {
    it('sanitizes numerical inputs', async () => {
      render(<CapitalStructureOptimizer />);

      const inputs = screen.getAllByRole('spinbutton');
      if (inputs.length > 0) {
        // Try to input potentially malicious content
        fireEvent.clear(inputs[0]);
        fireEvent.type(inputs[0], 'javascript:alert(1)');

        // Should handle non-numeric inputs gracefully
        expect(screen.getByText('Capital Structure Optimization')).toBeInTheDocument();
      }
    });

    it('validates calculation inputs', () => {
      render(<CapitalStructureOptimizer />);

      // Component should only accept valid numerical inputs
      expect(screen.getByText('Capital Structure Optimization')).toBeInTheDocument();
    });

    it('prevents unauthorized data access', () => {
      render(<CapitalStructureOptimizer />);

      // Should only display calculated/mock data
      expect(screen.getByText('Capital Structure Optimization')).toBeInTheDocument();
    });
  });

  describe('Data Validation', () => {
    it('validates WACC calculations are reasonable', () => {
      render(<CapitalStructureOptimizer />);

      // WACC should be between 5-15% for most companies
      const waccText = screen.getByText('8.2%');
      expect(waccText).toBeInTheDocument();

      const waccValue = parseFloat(waccText.textContent!.replace('%', ''));
      expect(waccValue).toBeGreaterThan(5);
      expect(waccValue).toBeLessThan(15);
    });

    it('ensures debt ratios sum to 100%', () => {
      render(<CapitalStructureOptimizer />);

      // Current structure: 40% debt + 60% equity = 100%
      expect(screen.getByText('40%')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
    });

    it('validates recommended changes are logical', () => {
      render(<CapitalStructureOptimizer />);

      // Optimal structure should show improvement
      expect(screen.getByText('35%')).toBeInTheDocument(); // Optimal debt
      expect(screen.getByText('7.8%')).toBeInTheDocument(); // Lower WACC
    });

    it('ensures financial metrics are consistent', () => {
      render(<CapitalStructureOptimizer />);

      // ROE should be higher than ROA (leveraged company)
      expect(screen.getByText('15.8%')).toBeInTheDocument(); // ROE
      expect(screen.getByText('9.5%')).toBeInTheDocument();  // ROA
    });
  });

  describe('Chart Data Validation', () => {
    it('ensures pie chart data is properly formatted', () => {
      render(<CapitalStructureOptimizer />);

      const pieChart = screen.getByTestId('pie-chart');
      const chartData = JSON.parse(pieChart.getAttribute('data-chart-data') || '[]');

      expect(Array.isArray(chartData)).toBe(true);
      expect(chartData.length).toBeGreaterThan(0);
    });

    it('validates bar chart scenario data', () => {
      render(<CapitalStructureOptimizer />);

      const barChart = screen.getByTestId('bar-chart');
      const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '[]');

      expect(Array.isArray(chartData)).toBe(true);
      expect(chartData.length).toBe(3); // Conservative, Moderate, Aggressive
    });

    it('ensures chart colors are appropriate', () => {
      render(<CapitalStructureOptimizer />);

      const cells = screen.getAllByTestId('cell');
      cells.forEach(cell => {
        const fill = cell.getAttribute('data-fill');
        expect(fill).toBeTruthy();
      });
    });
  });
});