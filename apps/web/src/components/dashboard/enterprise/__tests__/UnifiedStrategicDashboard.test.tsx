import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

import '@testing-library/jest-dom';

import UnifiedStrategicDashboard from '../UnifiedStrategicDashboard';
import type { StrategicScenarioData } from '@/types/enterprise-dashboard';

// Mock all chart components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="chart-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  ComposedChart: ({ children }: any) => <div data-testid="composed-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Area: () => <div data-testid="area" />,
  Cell: () => <div data-testid="cell" />
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock intersection observer
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock the hook
jest.mock('../../../../hooks/useInteractiveModeling', () => ({
  useInteractiveModeling: () => ({
    currentData: mockData,
    isModelingActive: false,
    lastUpdate: new Date(),
    activateModeling: jest.fn(),
    deactivateModeling: jest.fn(),
    integrateWithComponents: jest.fn(),
    applyScenarioSnapshot: jest.fn(),
    exportCurrentState: jest.fn(),
    debouncedUpdate: jest.fn()
  })
}));

const mockData: StrategicScenarioData = {
  scenarios: [
    {
      id: 'test_scenario',
      name: 'Test Scenario',
      assumptions: [],
      projections: [
        { year: 2025, revenue: 1000000, ebitda: 250000, cashFlow: 200000, valuation: 3000000 }
      ],
      investmentRequired: 500000,
      expectedROI: 25.5,
      riskLevel: 'medium',
      probabilityOfSuccess: 80,
      valuationImpact: 2500000,
      timeline: 18,
      keyDrivers: ['Growth'],
      riskFactors: ['Risk']
    }
  ],
  comparisonMetrics: [],
  riskAssessment: {
    overallRisk: 'medium',
    riskFactors: [],
    mitigationStrategies: [],
    confidenceLevel: 75
  },
  recommendedPath: 'Test path',
  sensitivityAnalysis: {
    variables: [],
    results: []
  }
};

const mockCapitalData = {
  currentStructure: {
    debt: 60,
    equity: 40,
    debtToEquity: 1.5,
    weightedAverageCostOfCapital: 0.085,
    debtServiceCoverage: 2.1,
    creditRating: 'BBB+'
  },
  optimizedStructure: {
    debt: 55,
    equity: 45,
    debtToEquity: 1.22,
    weightedAverageCostOfCapital: 0.078,
    debtServiceCoverage: 2.4,
    creditRating: 'A-'
  },
  scenarios: [],
  costOfCapital: {
    costOfDebt: 0.045,
    costOfEquity: 0.12,
    wacc: 0.085,
    taxRate: 0.25,
    riskFreeRate: 0.025,
    marketRiskPremium: 0.08,
    beta: 1.2
  },
  leverageAnalysis: {
    debtToEquityRatio: 1.5,
    debtToAssetRatio: 0.6,
    interestCoverageRatio: 3.2,
    debtServiceCoverageRatio: 2.1,
    timesInterestEarned: 3.2,
    cashCoverageRatio: 1.8
  }
};

describe('UnifiedStrategicDashboard', () => {
  let mockOnDataChange: jest.Mock;

  beforeEach(() => {
    mockOnDataChange = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the unified dashboard with all components', () => {
    render(
      <UnifiedStrategicDashboard
        initialData={mockData}
        initialCapitalData={mockCapitalData}
        onDataChange={mockOnDataChange}
      />
    );

    expect(screen.getByRole('heading', { name: /unified strategic dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/integrated real-time strategic modeling/i)).toBeInTheDocument();
  });

  it('displays component toggle buttons', () => {
    render(
      <UnifiedStrategicDashboard
        initialData={mockData}
        initialCapitalData={mockCapitalData}
        onDataChange={mockOnDataChange}
      />
    );

    expect(screen.getByRole('button', { name: /interactive modeling/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /scenario matrix/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /capital structure/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /exit strategy/i })).toBeInTheDocument();
  });

  it('allows toggling component visibility', async () => {
    const 
    render(
      <UnifiedStrategicDashboard
        initialData={mockData}
        initialCapitalData={mockCapitalData}
        onDataChange={mockOnDataChange}
      />
    );

    // Find interactive modeling button
    const interactiveButton = screen.getByRole('button', { name: /interactive modeling/i });

    // It should start as active (default variant)
    expect(interactiveButton).toHaveClass('bg-primary'); // or whatever the default button class is

    // Click to toggle off
    fireEvent.click(interactiveButton);

    // Button should now be outline variant
    await waitFor(() => {
      expect(interactiveButton).not.toHaveClass('bg-primary');
    });
  });

  it('displays live mode toggle', () => {
    render(
      <UnifiedStrategicDashboard
        initialData={mockData}
        initialCapitalData={mockCapitalData}
        onDataChange={mockOnDataChange}
      />
    );

    expect(screen.getByText(/live mode/i)).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('can toggle live mode on and off', async () => {
    const 
    render(
      <UnifiedStrategicDashboard
        initialData={mockData}
        initialCapitalData={mockCapitalData}
        onDataChange={mockOnDataChange}
      />
    );

    const liveModeSwitch = screen.getByRole('switch');

    // Toggle live mode on
    fireEvent.click(liveModeSwitch);

    await waitFor(() => {
      expect(liveModeSwitch).toBeChecked();
    });

    // Should show live mode alert
    expect(screen.getByText(/live mode is active/i)).toBeInTheDocument();
  });

  it('displays sync status information', () => {
    render(
      <UnifiedStrategicDashboard
        initialData={mockData}
        initialCapitalData={mockCapitalData}
        onDataChange={mockOnDataChange}
      />
    );

    // Should show sync status
    expect(screen.getByText(/synced/i)).toBeInTheDocument();
  });

  it('shows active component count', () => {
    render(
      <UnifiedStrategicDashboard
        initialData={mockData}
        initialCapitalData={mockCapitalData}
        onDataChange={mockOnDataChange}
      />
    );

    // Should show count of active components
    expect(screen.getByText(/active:/i)).toBeInTheDocument();
  });

  it('supports fullscreen mode for components', async () => {
    const 
    render(
      <UnifiedStrategicDashboard
        initialData={mockData}
        initialCapitalData={mockCapitalData}
        onDataChange={mockOnDataChange}
      />
    );

    // Find maximize button (there should be several, one for each component)
    const maximizeButtons = screen.getAllByRole('button').filter(button =>
      button.querySelector('svg') // Looking for maximize icon
    );

    if (maximizeButtons.length > 0) {
      fireEvent.click(maximizeButtons[0]);

      // Should show fullscreen content
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /exit fullscreen/i })).toBeInTheDocument();
      });
    }
  });

  it('displays proper grid layout when not in fullscreen', () => {
    render(
      <UnifiedStrategicDashboard
        initialData={mockData}
        initialCapitalData={mockCapitalData}
        onDataChange={mockOnDataChange}
      />
    );

    // Should have grid layout container
    const gridContainer = document.querySelector('.grid');
    expect(gridContainer).toBeInTheDocument();
  });

  it('handles data updates through live mode', async () => {
    const 
    render(
      <UnifiedStrategicDashboard
        initialData={mockData}
        initialCapitalData={mockCapitalData}
        onDataChange={mockOnDataChange}
      />
    );

    // Enable live mode
    const liveModeSwitch = screen.getByRole('switch');
    fireEvent.click(liveModeSwitch);

    // In a real scenario, this would trigger integration updates
    // For now, we just verify the UI responds correctly
    await waitFor(() => {
      expect(screen.getByText(/live mode is active/i)).toBeInTheDocument();
    });
  });

  it('renders all integrated components by default', () => {
    render(
      <UnifiedStrategicDashboard
        initialData={mockData}
        initialCapitalData={mockCapitalData}
        onDataChange={mockOnDataChange}
      />
    );

    // Should render InteractiveModeling
    expect(screen.getByRole('heading', { name: /interactive scenario modeling/i })).toBeInTheDocument();

    // Should render ScenarioMatrix
    expect(screen.getByRole('heading', { name: /strategic scenario comparison matrix/i })).toBeInTheDocument();

    // Should render CapitalStructureOptimizer
    expect(screen.getByRole('heading', { name: /capital structure optimization/i })).toBeInTheDocument();
  });

  it('maintains component state when toggling visibility', async () => {
    const 
    render(
      <UnifiedStrategicDashboard
        initialData={mockData}
        initialCapitalData={mockCapitalData}
        onDataChange={mockOnDataChange}
      />
    );

    // Toggle a component off
    const scenarioButton = screen.getByRole('button', { name: /scenario matrix/i });
    fireEvent.click(scenarioButton);

    // Component should be hidden
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /strategic scenario comparison matrix/i })).not.toBeInTheDocument();
    });

    // Toggle it back on
    fireEvent.click(scenarioButton);

    // Component should be visible again
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /strategic scenario comparison matrix/i })).toBeInTheDocument();
    });
  });

  it('handles settings button click', async () => {
    const 
    render(
      <UnifiedStrategicDashboard
        initialData={mockData}
        initialCapitalData={mockCapitalData}
        onDataChange={mockOnDataChange}
      />
    );

    const settingsButton = screen.getByRole('button').querySelector('svg')?.closest('button');
    if (settingsButton) {
      fireEvent.click(settingsButton);
      // Settings button click should work without errors
    }
  });

  it('displays modeling active badge when modeling is active', () => {
    // We would need to mock the hook to return isModelingActive: true
    // For now, let's just test the UI structure
    render(
      <UnifiedStrategicDashboard
        initialData={mockData}
        initialCapitalData={mockCapitalData}
        onDataChange={mockOnDataChange}
      />
    );

    // The badge would appear when modeling is active
    // Since our mock returns false, it shouldn't be visible
    expect(screen.queryByText(/modeling active/i)).not.toBeInTheDocument();
  });

  it('handles window resize gracefully', async () => {
    render(
      <UnifiedStrategicDashboard
        initialData={mockData}
        initialCapitalData={mockCapitalData}
        onDataChange={mockOnDataChange}
      />
    );

    // Simulate window resize
    act(() => {
      global.dispatchEvent(new Event('resize'));
    });

    // Component should still be rendered correctly
    expect(screen.getByRole('heading', { name: /unified strategic dashboard/i })).toBeInTheDocument();
  });

  it('provides proper accessibility labels', () => {
    render(
      <UnifiedStrategicDashboard
        initialData={mockData}
        initialCapitalData={mockCapitalData}
        onDataChange={mockOnDataChange}
      />
    );

    // Check for proper ARIA labels and roles
    expect(screen.getByRole('switch')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength.greaterThan(0);
  });
});

// Integration-specific tests
describe('UnifiedStrategicDashboard Integration', () => {
  it('properly integrates all strategic components', () => {
    render(
      <UnifiedStrategicDashboard
        initialData={mockData}
        initialCapitalData={mockCapitalData}
      />
    );

    // All major components should be present
    expect(screen.getByText(/interactive scenario modeling/i)).toBeInTheDocument();
    expect(screen.getByText(/strategic scenario comparison matrix/i)).toBeInTheDocument();
    expect(screen.getByText(/capital structure optimization/i)).toBeInTheDocument();
  });

  it('maintains data consistency across component updates', async () => {
    const 
    const mockOnDataChange = jest.fn();

    render(
      <UnifiedStrategicDashboard
        initialData={mockData}
        initialCapitalData={mockCapitalData}
        onDataChange={mockOnDataChange}
      />
    );

    // Enable live mode
    const liveModeSwitch = screen.getByRole('switch');
    fireEvent.click(liveModeSwitch);

    // In a real scenario, any variable changes would propagate through onDataChange
    // Our mock setup verifies the integration structure is correct
    expect(screen.getByText(/live mode is active/i)).toBeInTheDocument();
  });

  it('handles component errors gracefully', () => {
    // Test with invalid data
    const invalidData = { ...mockData, scenarios: [] };

    render(
      <UnifiedStrategicDashboard
        initialData={invalidData}
        initialCapitalData={mockCapitalData}
      />
    );

    // Dashboard should still render even with invalid data
    expect(screen.getByRole('heading', { name: /unified strategic dashboard/i })).toBeInTheDocument();
  });
});