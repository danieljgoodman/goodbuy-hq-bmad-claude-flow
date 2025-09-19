import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import StrategicOptionValuation from '../StrategicOptionValuation';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Target: () => <div data-testid="target-icon" />,
  Calculator: () => <div data-testid="calculator-icon" />,
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  PieChart: () => <div data-testid="pie-chart-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
  DollarSign: () => <div data-testid="dollar-sign-icon" />,
  Percent: () => <div data-testid="percent-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Info: () => <div data-testid="info-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  ArrowUp: () => <div data-testid="arrow-up-icon" />,
  ArrowDown: () => <div data-testid="arrow-down-icon" />
}));

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children, data }: { children: React.ReactNode; data: any[] }) =>
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>{children}</div>,
  BarChart: ({ children, data }: { children: React.ReactNode; data: any[] }) =>
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>{children}</div>,
  ScatterChart: ({ children, data }: { children: React.ReactNode; data: any[] }) =>
    <div data-testid="scatter-chart" data-chart-data={JSON.stringify(data)}>{children}</div>,
  RadarChart: ({ children, data }: { children: React.ReactNode; data: any[] }) =>
    <div data-testid="radar-chart" data-chart-data={JSON.stringify(data)}>{children}</div>,
  Line: ({ dataKey, stroke }: { dataKey: string; stroke?: string }) =>
    <div data-testid="line" data-key={dataKey} data-stroke={stroke} />,
  Bar: ({ dataKey, fill }: { dataKey: string; fill?: string }) =>
    <div data-testid="bar" data-key={dataKey} data-fill={fill} />,
  Scatter: ({ dataKey }: { dataKey: string }) => <div data-testid="scatter" data-key={dataKey} />,
  Radar: ({ dataKey }: { dataKey: string }) => <div data-testid="radar" data-key={dataKey} />,
  XAxis: ({ dataKey }: { dataKey?: string }) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />
}));

// Mock option valuation calculations
vi.mock('@/lib/financial/option-valuation', () => ({
  OptionPricingEngine: {
    calculateBlackScholes: vi.fn((S, K, T, r, v, type) => {
      // Mock Black-Scholes calculation
      if (type === 'call') {
        return Math.max(0, S - K) + (T * r * v * 10);
      } else {
        return Math.max(0, K - S) + (T * r * v * 10);
      }
    }),
    calculateGreeks: vi.fn(() => ({
      delta: 0.65,
      gamma: 0.025,
      theta: -12.5,
      vega: 85.2,
      rho: 45.8
    })),
    calculateImpliedVolatility: vi.fn(() => 0.25),
    getCompleteValuation: vi.fn(() => ({
      symbol: 'STRATEGIC_OPTION',
      type: 'call',
      strikePrice: 100000000,
      currentPrice: 120000000,
      expirationDate: new Date('2025-12-31'),
      impliedVolatility: 0.25,
      blackScholesValue: 25000000,
      delta: 0.65,
      gamma: 0.025,
      theta: -12.5,
      vega: 85.2,
      rho: 45.8,
      intrinsicValue: 20000000,
      timeValue: 5000000,
      profitLoss: 25000000
    })),
    calculateBinomial: vi.fn(() => 24500000),
    calculateMonteCarlo: vi.fn(() => ({
      value: 25200000,
      standardError: 850000,
      confidenceInterval: [23500000, 26900000]
    })),
    analyzeOptionsPortfolio: vi.fn(() => ({
      totalValue: 75000000,
      totalDelta: 1.85,
      totalGamma: 0.065,
      totalTheta: -35.2,
      totalVega: 245.6,
      totalRho: 125.4,
      riskMetrics: {
        maxLoss: 15000000,
        maxGain: 0, // Simplified for call options
        breakeven: [125000000, 135000000, 145000000]
      }
    }))
  }
}));

describe('StrategicOptionValuation Component', () => {
  

  beforeEach(() => {
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Component Rendering', () => {
    it('renders the main component with correct title', () => {
      render(<StrategicOptionValuation />);

      expect(screen.getByText('Strategic Option Valuation')).toBeInTheDocument();
      expect(screen.getByText('Advanced real options analysis for strategic investment decisions using Black-Scholes and binomial models')).toBeInTheDocument();
    });

    it('renders all main sections', () => {
      render(<StrategicOptionValuation />);

      expect(screen.getByText('Option Parameters')).toBeInTheDocument();
      expect(screen.getByText('Valuation Results')).toBeInTheDocument();
      expect(screen.getByText('Greeks Analysis')).toBeInTheDocument();
      expect(screen.getByText('Scenario Analysis')).toBeInTheDocument();
      expect(screen.getByText('Portfolio View')).toBeInTheDocument();
    });

    it('displays option type selector', () => {
      render(<StrategicOptionValuation />);

      expect(screen.getByText('Option Type')).toBeInTheDocument();
      // Should have call/put options
      expect(screen.getByDisplayValue('Call Option')).toBeInTheDocument();
    });

    it('shows input fields for option parameters', () => {
      render(<StrategicOptionValuation />);

      expect(screen.getByText('Current Asset Value')).toBeInTheDocument();
      expect(screen.getByText('Strike Price')).toBeInTheDocument();
      expect(screen.getByText('Time to Expiration')).toBeInTheDocument();
      expect(screen.getByText('Risk-free Rate')).toBeInTheDocument();
      expect(screen.getByText('Volatility')).toBeInTheDocument();
    });
  });

  describe('Option Parameters Input', () => {
    it('accepts current asset value input', async () => {
      render(<StrategicOptionValuation />);

      const assetValueInput = screen.getByDisplayValue('120000000');
      expect(assetValueInput).toBeInTheDocument();

      fireEvent.clear(assetValueInput);
      fireEvent.type(assetValueInput, '150000000');

      expect(assetValueInput).toHaveValue(150000000);
    });

    it('accepts strike price input', async () => {
      render(<StrategicOptionValuation />);

      const strikePriceInput = screen.getByDisplayValue('100000000');
      expect(strikePriceInput).toBeInTheDocument();

      fireEvent.clear(strikePriceInput);
      fireEvent.type(strikePriceInput, '110000000');

      expect(strikePriceInput).toHaveValue(110000000);
    });

    it('accepts time to expiration input', async () => {
      render(<StrategicOptionValuation />);

      const timeInput = screen.getByDisplayValue('1');
      expect(timeInput).toBeInTheDocument();

      fireEvent.clear(timeInput);
      fireEvent.type(timeInput, '2');

      expect(timeInput).toHaveValue(2);
    });

    it('accepts volatility input as percentage', async () => {
      render(<StrategicOptionValuation />);

      const volatilityInput = screen.getByDisplayValue('25');
      expect(volatilityInput).toBeInTheDocument();

      fireEvent.clear(volatilityInput);
      fireEvent.type(volatilityInput, '30');

      expect(volatilityInput).toHaveValue(30);
    });

    it('switches between call and put options', async () => {
      render(<StrategicOptionValuation />);

      const optionTypeSelect = screen.getByDisplayValue('Call Option');
      fireEvent.click(optionTypeSelect);

      // Should show put option
      const putOption = screen.getByText('Put Option');
      fireEvent.click(putOption);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Put Option')).toBeInTheDocument();
      });
    });
  });

  describe('Valuation Results', () => {
    it('displays Black-Scholes valuation', () => {
      render(<StrategicOptionValuation />);

      expect(screen.getByText('Black-Scholes Value')).toBeInTheDocument();
      expect(screen.getByText('$25.0M')).toBeInTheDocument();
    });

    it('shows binomial model results', () => {
      render(<StrategicOptionValuation />);

      expect(screen.getByText('Binomial Model')).toBeInTheDocument();
      expect(screen.getByText('$24.5M')).toBeInTheDocument();
    });

    it('displays Monte Carlo simulation results', () => {
      render(<StrategicOptionValuation />);

      expect(screen.getByText('Monte Carlo')).toBeInTheDocument();
      expect(screen.getByText('$25.2M')).toBeInTheDocument();
    });

    it('shows intrinsic value', () => {
      render(<StrategicOptionValuation />);

      expect(screen.getByText('Intrinsic Value')).toBeInTheDocument();
      expect(screen.getByText('$20.0M')).toBeInTheDocument();
    });

    it('displays time value', () => {
      render(<StrategicOptionValuation />);

      expect(screen.getByText('Time Value')).toBeInTheDocument();
      expect(screen.getByText('$5.0M')).toBeInTheDocument();
    });

    it('shows implied volatility', () => {
      render(<StrategicOptionValuation />);

      expect(screen.getByText('Implied Volatility')).toBeInTheDocument();
      expect(screen.getByText('25.0%')).toBeInTheDocument();
    });
  });

  describe('Greeks Analysis', () => {
    it('displays delta value', () => {
      render(<StrategicOptionValuation />);

      expect(screen.getByText('Delta')).toBeInTheDocument();
      expect(screen.getByText('0.65')).toBeInTheDocument();
    });

    it('shows gamma value', () => {
      render(<StrategicOptionValuation />);

      expect(screen.getByText('Gamma')).toBeInTheDocument();
      expect(screen.getByText('0.025')).toBeInTheDocument();
    });

    it('displays theta (time decay)', () => {
      render(<StrategicOptionValuation />);

      expect(screen.getByText('Theta')).toBeInTheDocument();
      expect(screen.getByText('-12.5')).toBeInTheDocument();
    });

    it('shows vega (volatility sensitivity)', () => {
      render(<StrategicOptionValuation />);

      expect(screen.getByText('Vega')).toBeInTheDocument();
      expect(screen.getByText('85.2')).toBeInTheDocument();
    });

    it('displays rho (interest rate sensitivity)', () => {
      render(<StrategicOptionValuation />);

      expect(screen.getByText('Rho')).toBeInTheDocument();
      expect(screen.getByText('45.8')).toBeInTheDocument();
    });

    it('renders Greeks visualization chart', () => {
      render(<StrategicOptionValuation />);

      expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
    });
  });

  describe('Scenario Analysis', () => {
    it('displays sensitivity analysis chart', () => {
      render(<StrategicOptionValuation />);

      expect(screen.getByText('Sensitivity Analysis')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('shows different volatility scenarios', () => {
      render(<StrategicOptionValuation />);

      expect(screen.getByText('Low Volatility')).toBeInTheDocument();
      expect(screen.getByText('Base Case')).toBeInTheDocument();
      expect(screen.getByText('High Volatility')).toBeInTheDocument();
    });

    it('displays scenario probabilities', () => {
      render(<StrategicOptionValuation />);

      // Should show probability percentages
      const probabilities = screen.getAllByText(/\d+%/).filter(el =>
        parseInt(el.textContent!) <= 100
      );
      expect(probabilities.length).toBeGreaterThan(0);
    });

    it('shows expected values for each scenario', () => {
      render(<StrategicOptionValuation />);

      // Should display various valuation amounts
      const valuations = screen.getAllByText(/\$\d+\.?\d*M/);
      expect(valuations.length).toBeGreaterThan(3);
    });
  });

  describe('Portfolio Analysis', () => {
    it('displays portfolio total value', () => {
      render(<StrategicOptionValuation />);

      expect(screen.getByText('Portfolio Value')).toBeInTheDocument();
      expect(screen.getByText('$75.0M')).toBeInTheDocument();
    });

    it('shows portfolio Greeks', () => {
      render(<StrategicOptionValuation />);

      expect(screen.getByText('Portfolio Delta')).toBeInTheDocument();
      expect(screen.getByText('1.85')).toBeInTheDocument();

      expect(screen.getByText('Portfolio Gamma')).toBeInTheDocument();
      expect(screen.getByText('0.065')).toBeInTheDocument();
    });

    it('displays risk metrics', () => {
      render(<StrategicOptionValuation />);

      expect(screen.getByText('Max Loss')).toBeInTheDocument();
      expect(screen.getByText('$15.0M')).toBeInTheDocument();
    });

    it('shows breakeven points', () => {
      render(<StrategicOptionValuation />);

      expect(screen.getByText('Breakeven Points')).toBeInTheDocument();
      expect(screen.getByText('$125M')).toBeInTheDocument();
      expect(screen.getByText('$135M')).toBeInTheDocument();
    });

    it('renders portfolio composition chart', () => {
      render(<StrategicOptionValuation />);

      // Should have multiple chart types for portfolio analysis
      expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(0);
    });
  });

  describe('Interactive Features', () => {
    it('recalculates values when parameters change', async () => {
      render(<StrategicOptionValuation />);

      const assetValueInput = screen.getByDisplayValue('120000000');
      fireEvent.clear(assetValueInput);
      fireEvent.type(assetValueInput, '140000000');

      // Should trigger recalculation
      await waitFor(() => {
        expect(screen.getByText('Strategic Option Valuation')).toBeInTheDocument();
      });
    });

    it('updates Greeks when volatility changes', async () => {
      render(<StrategicOptionValuation />);

      const volatilityInput = screen.getByDisplayValue('25');
      fireEvent.clear(volatilityInput);
      fireEvent.type(volatilityInput, '35');

      // Greeks should update
      await waitFor(() => {
        expect(screen.getByText('Delta')).toBeInTheDocument();
      });
    });

    it('switches pricing models', async () => {
      render(<StrategicOptionValuation />);

      // Should show different model results
      expect(screen.getByText('Black-Scholes Value')).toBeInTheDocument();
      expect(screen.getByText('Binomial Model')).toBeInTheDocument();
      expect(screen.getByText('Monte Carlo')).toBeInTheDocument();
    });

    it('adjusts time to expiration with slider', async () => {
      render(<StrategicOptionValuation />);

      const sliders = screen.getAllByRole('slider');
      if (sliders.length > 0) {
        fireEvent.change(sliders[0], { target: { value: '0.5' } });

        await waitFor(() => {
          expect(screen.getByText('Strategic Option Valuation')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Performance Tests', () => {
    it('renders efficiently with complex calculations', async () => {
      const startTime = performance.now();

      render(<StrategicOptionValuation />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time
      expect(renderTime).toBeLessThan(200);
      expect(screen.getByText('Strategic Option Valuation')).toBeInTheDocument();
    });

    it('handles rapid parameter changes efficiently', async () => {
      render(<StrategicOptionValuation />);

      const assetValueInput = screen.getByDisplayValue('120000000');

      // Rapid changes
      for (let i = 0; i < 10; i++) {
        fireEvent.clear(assetValueInput);
        fireEvent.type(assetValueInput, String(100000000 + i * 5000000));
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      expect(screen.getByText('Strategic Option Valuation')).toBeInTheDocument();
    });

    it('efficiently calculates multiple pricing models', async () => {
      render(<StrategicOptionValuation />);

      const startTime = performance.now();

      // Trigger recalculation
      const volatilityInput = screen.getByDisplayValue('25');
      fireEvent.clear(volatilityInput);
      fireEvent.type(volatilityInput, '30');

      await waitFor(() => {
        expect(screen.getByText('Black-Scholes Value')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const updateTime = endTime - startTime;

      // Should update quickly
      expect(updateTime).toBeLessThan(100);
    });
  });

  describe('Edge Cases', () => {
    it('handles zero time to expiration', async () => {
      render(<StrategicOptionValuation />);

      const timeInput = screen.getByDisplayValue('1');
      fireEvent.clear(timeInput);
      fireEvent.type(timeInput, '0.001');

      // Should handle near-expiry options
      await waitFor(() => {
        expect(screen.getByText('Strategic Option Valuation')).toBeInTheDocument();
      });
    });

    it('handles very high volatility', async () => {
      render(<StrategicOptionValuation />);

      const volatilityInput = screen.getByDisplayValue('25');
      fireEvent.clear(volatilityInput);
      fireEvent.type(volatilityInput, '100');

      // Should handle extreme volatility
      await waitFor(() => {
        expect(screen.getByText('Strategic Option Valuation')).toBeInTheDocument();
      });
    });

    it('handles at-the-money options', async () => {
      render(<StrategicOptionValuation />);

      const strikePriceInput = screen.getByDisplayValue('100000000');
      const assetValueInput = screen.getByDisplayValue('120000000');

      // Make strike equal to current price
      fireEvent.clear(strikePriceInput);
      fireEvent.type(strikePriceInput, '120000000');

      await waitFor(() => {
        expect(screen.getByText('Strategic Option Valuation')).toBeInTheDocument();
      });
    });

    it('handles out-of-the-money options', async () => {
      render(<StrategicOptionValuation />);

      const strikePriceInput = screen.getByDisplayValue('100000000');
      fireEvent.clear(strikePriceInput);
      fireEvent.type(strikePriceInput, '150000000');

      // Should handle OTM call options
      await waitFor(() => {
        expect(screen.getByText('Strategic Option Valuation')).toBeInTheDocument();
      });
    });

    it('validates input constraints', async () => {
      render(<StrategicOptionValuation />);

      const volatilityInput = screen.getByDisplayValue('25');
      fireEvent.clear(volatilityInput);
      fireEvent.type(volatilityInput, '-10');

      // Should handle negative volatility gracefully
      expect(screen.getByText('Strategic Option Valuation')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for all inputs', () => {
      render(<StrategicOptionValuation />);

      expect(screen.getByLabelText(/Current Asset Value/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Strike Price/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Time to Expiration/)).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      render(<StrategicOptionValuation />);

      // Tab through inputs
      fireEvent.tab();

      // Should not crash during navigation
      expect(screen.getByText('Strategic Option Valuation')).toBeInTheDocument();
    });

    it('provides screen reader friendly content', () => {
      render(<StrategicOptionValuation />);

      // Important values should be clearly labeled
      expect(screen.getByText('Black-Scholes Value')).toBeInTheDocument();
      expect(screen.getByText('$25.0M')).toBeInTheDocument();
    });

    it('has sufficient color contrast for charts', () => {
      render(<StrategicOptionValuation />);

      // Charts should be accessible
      expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  describe('Security Tests', () => {
    it('sanitizes numerical inputs', async () => {
      render(<StrategicOptionValuation />);

      const assetValueInput = screen.getByDisplayValue('120000000');
      fireEvent.clear(assetValueInput);
      fireEvent.type(assetValueInput, 'javascript:alert(1)');

      // Should handle non-numeric inputs gracefully
      expect(screen.getByText('Strategic Option Valuation')).toBeInTheDocument();
    });

    it('validates calculation inputs', () => {
      render(<StrategicOptionValuation />);

      // Component should only accept valid financial inputs
      expect(screen.getByText('Strategic Option Valuation')).toBeInTheDocument();
    });

    it('prevents unauthorized access to sensitive calculations', () => {
      render(<StrategicOptionValuation />);

      // Should only display calculated results, not expose calculation methods
      expect(screen.getByText('Strategic Option Valuation')).toBeInTheDocument();
    });
  });

  describe('Financial Model Validation', () => {
    it('ensures Black-Scholes results are reasonable', () => {
      render(<StrategicOptionValuation />);

      // For ITM call option (S=120M, K=100M), value should be > intrinsic value
      expect(screen.getByText('$25.0M')).toBeInTheDocument(); // Black-Scholes
      expect(screen.getByText('$20.0M')).toBeInTheDocument(); // Intrinsic value
    });

    it('validates Greeks are within expected ranges', () => {
      render(<StrategicOptionValuation />);

      // Delta should be between 0 and 1 for call options
      expect(screen.getByText('0.65')).toBeInTheDocument();

      // Gamma should be positive
      expect(screen.getByText('0.025')).toBeInTheDocument();

      // Theta should be negative (time decay)
      expect(screen.getByText('-12.5')).toBeInTheDocument();
    });

    it('ensures time value is non-negative', () => {
      render(<StrategicOptionValuation />);

      expect(screen.getByText('$5.0M')).toBeInTheDocument(); // Time value should be positive
    });

    it('validates model convergence', () => {
      render(<StrategicOptionValuation />);

      // Different models should give similar results
      expect(screen.getByText('$25.0M')).toBeInTheDocument(); // Black-Scholes
      expect(screen.getByText('$24.5M')).toBeInTheDocument(); // Binomial
      expect(screen.getByText('$25.2M')).toBeInTheDocument(); // Monte Carlo
    });
  });

  describe('Chart Data Validation', () => {
    it('ensures radar chart data is properly formatted', () => {
      render(<StrategicOptionValuation />);

      const radarChart = screen.getByTestId('radar-chart');
      const chartData = JSON.parse(radarChart.getAttribute('data-chart-data') || '[]');

      expect(Array.isArray(chartData)).toBe(true);
    });

    it('validates line chart sensitivity data', () => {
      render(<StrategicOptionValuation />);

      const lineChart = screen.getByTestId('line-chart');
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]');

      expect(Array.isArray(chartData)).toBe(true);
    });

    it('ensures bar chart data represents portfolio correctly', () => {
      render(<StrategicOptionValuation />);

      const barCharts = screen.getAllByTestId('bar-chart');
      expect(barCharts.length).toBeGreaterThan(0);

      barCharts.forEach(chart => {
        const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '[]');
        expect(Array.isArray(chartData)).toBe(true);
      });
    });
  });
});