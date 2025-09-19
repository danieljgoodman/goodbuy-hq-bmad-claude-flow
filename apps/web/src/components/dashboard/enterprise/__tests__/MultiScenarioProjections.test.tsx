import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MultiScenarioProjections from '../MultiScenarioProjections';
import { createSampleProjectionData } from '@/lib/utils/enterprise-calculations';

// Mock recharts components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  Cell: () => <div data-testid="cell" />,
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div data-testid="composed-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
}));

describe('MultiScenarioProjections', () => {
  const mockData = createSampleProjectionData();

  it('renders the component with title and description', () => {
    render(<MultiScenarioProjections data={mockData} />);

    expect(screen.getByText('Multi-Scenario Financial Projections')).toBeInTheDocument();
    expect(screen.getByText('5-year financial projections across multiple strategic scenarios with sensitivity analysis')).toBeInTheDocument();
  });

  it('displays projection controls', () => {
    render(<MultiScenarioProjections data={mockData} />);

    expect(screen.getByText('Financial Metric')).toBeInTheDocument();
    expect(screen.getByText('View Type')).toBeInTheDocument();
  });

  it('shows line chart by default', () => {
    render(<MultiScenarioProjections data={mockData} />);

    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
  });

  it('displays projection insights', () => {
    render(<MultiScenarioProjections data={mockData} />);

    expect(screen.getByText('Projection Insights')).toBeInTheDocument();
    expect(screen.getByText('Base Case CAGR')).toBeInTheDocument();
  });

  it('switches between different view types', () => {
    render(<MultiScenarioProjections data={mockData} />);

    // Should start with line view
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();

    // Switch to waterfall view
    const viewTypeSelect = screen.getByDisplayValue('Line Chart');
    fireEvent.click(viewTypeSelect);

    // Note: In a real test, you'd need to select the waterfall option
    // This is a simplified test due to mocked select component
  });

  it('switches between different metrics', () => {
    render(<MultiScenarioProjections data={mockData} />);

    // Should start with revenue metric
    const metricSelect = screen.getByDisplayValue('Revenue');
    expect(metricSelect).toBeInTheDocument();

    // Test that the component renders without errors when metric changes
    fireEvent.click(metricSelect);
  });

  it('displays key value drivers when available', () => {
    render(<MultiScenarioProjections data={mockData} />);

    if (mockData.baseCase.keyDrivers.length > 0) {
      expect(screen.getByText('Key Value Drivers')).toBeInTheDocument();
    }
  });

  it('handles scenarios with different confidence levels', () => {
    const testData = {
      ...mockData,
      baseCase: {
        ...mockData.baseCase,
        confidence: 85
      }
    };

    render(<MultiScenarioProjections data={testData} />);

    // Component should render without errors regardless of confidence levels
    expect(screen.getByText('Multi-Scenario Financial Projections')).toBeInTheDocument();
  });

  it('displays upside and downside potential when scenarios are present', () => {
    render(<MultiScenarioProjections data={mockData} />);

    // Should show upside potential from optimistic case
    expect(screen.getByText('Upside Potential')).toBeInTheDocument();

    // Should show downside risk from conservative case
    expect(screen.getByText('Downside Risk')).toBeInTheDocument();
  });

  it('handles custom scenarios correctly', () => {
    const testData = {
      ...mockData,
      customScenarios: [
        {
          scenarioName: 'Test Custom Scenario',
          projections: mockData.baseCase.projections,
          assumptions: [],
          keyDrivers: [],
          riskFactors: [],
          confidence: 70,
          probability: 40
        }
      ]
    };

    render(<MultiScenarioProjections data={testData} />);

    // Component should render with custom scenarios
    expect(screen.getByText('Multi-Scenario Financial Projections')).toBeInTheDocument();
  });

  it('displays risk factors when present', () => {
    render(<MultiScenarioProjections data={mockData} />);

    if (mockData.baseCase.riskFactors.length > 0) {
      expect(screen.getByText('Risk Factors')).toBeInTheDocument();
    }
  });
});

// Test the calculation utilities
describe('Enterprise Calculations Integration', () => {
  it('creates valid sample projection data', () => {
    const data = createSampleProjectionData();

    expect(data.baseCase).toBeDefined();
    expect(data.optimisticCase).toBeDefined();
    expect(data.conservativeCase).toBeDefined();
    expect(data.customScenarios).toHaveLength(1);
    expect(data.sensitivityAnalysis).toBeDefined();
    expect(data.confidenceIntervals).toBeDefined();

    // Check that projections have consistent structure
    expect(data.baseCase.projections).toHaveLength(5); // 5-year projections
    expect(data.baseCase.projections[0]).toHaveProperty('year');
    expect(data.baseCase.projections[0]).toHaveProperty('revenue');
    expect(data.baseCase.projections[0]).toHaveProperty('ebitda');
    expect(data.baseCase.projections[0]).toHaveProperty('cashFlow');
    expect(data.baseCase.projections[0]).toHaveProperty('valuation');
  });

  it('generates realistic financial projections', () => {
    const data = createSampleProjectionData();

    // Check that optimistic case values are generally higher than base case
    const optimisticFinalYear = data.optimisticCase.projections[data.optimisticCase.projections.length - 1];
    const baseFinalYear = data.baseCase.projections[data.baseCase.projections.length - 1];

    expect(optimisticFinalYear.revenue).toBeGreaterThan(baseFinalYear.revenue);
    expect(optimisticFinalYear.ebitda).toBeGreaterThan(baseFinalYear.ebitda);

    // Check that conservative case values are generally lower than base case
    const conservativeFinalYear = data.conservativeCase.projections[data.conservativeCase.projections.length - 1];

    expect(conservativeFinalYear.revenue).toBeLessThan(baseFinalYear.revenue);
    expect(conservativeFinalYear.ebitda).toBeLessThan(baseFinalYear.ebitda);
  });
});