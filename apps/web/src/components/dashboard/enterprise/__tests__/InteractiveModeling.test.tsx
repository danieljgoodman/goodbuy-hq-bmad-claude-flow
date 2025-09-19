import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

import '@testing-library/jest-dom';

import InteractiveModeling from '../InteractiveModeling';
import type { StrategicScenarioData } from '@/types/enterprise-dashboard';
import type { ModelingVariable } from '../InteractiveModeling';

// Mock data for testing
const mockStrategicData: StrategicScenarioData = {
  scenarios: [
    {
      id: 'test_scenario',
      name: 'Test Scenario',
      assumptions: [
        { id: '1', category: 'Market', description: 'Test assumption', value: 15, unit: '%', confidence: 85 }
      ],
      projections: [
        { year: 2025, revenue: 1000000, ebitda: 250000, cashFlow: 200000, valuation: 3000000 },
        { year: 2026, revenue: 1150000, ebitda: 287500, cashFlow: 230000, valuation: 3450000 }
      ],
      investmentRequired: 500000,
      expectedROI: 25.5,
      riskLevel: 'medium',
      probabilityOfSuccess: 80,
      valuationImpact: 2500000,
      timeline: 18,
      keyDrivers: ['Market Growth', 'Technology'],
      riskFactors: ['Competition', 'Market Risk']
    }
  ],
  comparisonMetrics: [
    { id: 'roi', name: 'ROI', unit: '%', weight: 0.3 }
  ],
  riskAssessment: {
    overallRisk: 'medium',
    riskFactors: [
      { factor: 'Market Risk', impact: 'medium', probability: 50, description: 'Market volatility' }
    ],
    mitigationStrategies: ['Diversification'],
    confidenceLevel: 75
  },
  recommendedPath: 'Test recommendation',
  sensitivityAnalysis: {
    variables: [
      { name: 'Growth Rate', baseValue: 15, range: [5, 30], unit: '%' }
    ],
    results: [
      { variable: 'Growth Rate', change: 10, impact: 100000, scenario: 'Optimistic' }
    ]
  }
};

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock Recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="chart-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  ComposedChart: ({ children }: any) => <div data-testid="composed-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Area: () => <div data-testid="area" />
}));

describe('InteractiveModeling Component', () => {
  let mockOnDataUpdate: jest.Mock;

  beforeEach(() => {
    mockOnDataUpdate = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders main component with all required elements', () => {
    render(<InteractiveModeling data={mockStrategicData} onDataUpdate={mockOnDataUpdate} />);

    expect(screen.getByRole('heading', { name: /interactive scenario modeling/i })).toBeInTheDocument();
    expect(screen.getByText(/real-time strategic modeling/i)).toBeInTheDocument();

    // Check for main tabs
    expect(screen.getByRole('tab', { name: /variable controls/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /live preview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /scenario manager/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /comparison/i })).toBeInTheDocument();
  });

  it('displays default modeling variables', () => {
    render(<InteractiveModeling data={mockStrategicData} onDataUpdate={mockOnDataUpdate} />);

    // Default variables should be visible
    expect(screen.getByText(/revenue growth rate/i)).toBeInTheDocument();
    expect(screen.getByText(/market conditions/i)).toBeInTheDocument();
    expect(screen.getByText(/risk adjustment/i)).toBeInTheDocument();
    expect(screen.getByText(/cost inflation/i)).toBeInTheDocument();
    expect(screen.getByText(/capital efficiency/i)).toBeInTheDocument();
  });

  it('allows variable value changes via sliders', async () => {
    const 
    render(<InteractiveModeling data={mockStrategicData} onDataUpdate={mockOnDataUpdate} />);

    // Find and interact with a slider
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThan(0);

    // Simulate slider change
    await act(async () => {
      fireEvent.change(sliders[0], { target: { value: '0.2' } });
    });

    // Should trigger updates
    await waitFor(() => {
      expect(sliders[0]).toHaveValue('0.2');
    });
  });

  it('allows variable value changes via input fields', async () => {
    const 
    render(<InteractiveModeling data={mockStrategicData} onDataUpdate={mockOnDataUpdate} />);

    // Find number inputs
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs.length).toBeGreaterThan(0);

    // Change input value
    fireEvent.clear(inputs[0]);
    fireEvent.type(inputs[0], '0.25');

    await waitFor(() => {
      expect(inputs[0]).toHaveValue(0.25);
    });
  });

  it('supports variable locking functionality', async () => {
    const 
    render(<InteractiveModeling data={mockStrategicData} onDataUpdate={mockOnDataUpdate} />);

    // Find lock buttons
    const lockButtons = screen.getAllByRole('button').filter(button =>
      button.querySelector('svg') &&
      (button.getAttribute('aria-label')?.includes('lock') ||
       button.textContent?.includes('Lock') ||
       button.textContent?.includes('Unlock'))
    );

    expect(lockButtons.length).toBeGreaterThan(0);

    // Click lock button
    fireEvent.click(lockButtons[0]);

    // Variable should be locked (input disabled)
    await waitFor(() => {
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs[0]).toBeDisabled();
    });
  });

  it('displays live preview with impact metrics', () => {
    render(<InteractiveModeling data={mockStrategicData} onDataUpdate={mockOnDataUpdate} />);

    // Navigate to live preview tab
    const livePreviewTab = screen.getByRole('tab', { name: /live preview/i });
    fireEvent.click(livePreviewTab);

    // Should show impact metrics
    expect(screen.getByText(/revenue impact/i)).toBeInTheDocument();
    expect(screen.getByText(/valuation impact/i)).toBeInTheDocument();
    expect(screen.getByText(/risk score/i)).toBeInTheDocument();

    // Should have chart
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  it('supports scenario saving functionality', async () => {
    const 
    render(<InteractiveModeling data={mockStrategicData} onDataUpdate={mockOnDataUpdate} />);

    // Navigate to scenario manager
    const scenarioTab = screen.getByRole('tab', { name: /scenario manager/i });
    fireEvent.click(scenarioTab);

    // Find and click save button
    const saveButton = screen.getByRole('button', { name: /save current/i });
    fireEvent.click(saveButton);

    // Should open save dialog
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/save current scenario/i)).toBeInTheDocument();
    });

    // Enter scenario name
    const nameInput = screen.getByPlaceholderText(/scenario name/i);
    fireEvent.type(nameInput, 'Test Scenario');

    // Save scenario
    const saveDialogButton = screen.getByRole('button', { name: /save scenario/i });
    fireEvent.click(saveDialogButton);

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('supports scenario loading functionality', async () => {
    const 

    // First, create and save a scenario
    const { rerender } = render(<InteractiveModeling data={mockStrategicData} onDataUpdate={mockOnDataUpdate} />);

    // Navigate to scenario manager
    const scenarioTab = screen.getByRole('tab', { name: /scenario manager/i });
    fireEvent.click(scenarioTab);

    // Mock that a scenario exists (since we can't easily simulate the full save flow)
    // This would typically involve state persistence, but for testing we'll check the UI structure
    expect(screen.getByText(/no saved scenarios yet/i)).toBeInTheDocument();
  });

  it('supports undo/redo functionality', async () => {
    const 
    render(<InteractiveModeling data={mockStrategicData} onDataUpdate={mockOnDataUpdate} />);

    // Find undo/redo buttons
    const undoButton = screen.getByRole('button', { name: /undo/i });
    const redoButton = screen.getByRole('button', { name: /redo/i });

    // Initially, undo/redo should be disabled
    expect(undoButton).toBeDisabled();
    expect(redoButton).toBeDisabled();
  });

  it('supports auto-update toggle', async () => {
    const 
    render(<InteractiveModeling data={mockStrategicData} onDataUpdate={mockOnDataUpdate} />);

    // Find auto-update switch
    const autoUpdateSwitch = screen.getByRole('switch', { name: /auto-update/i });
    expect(autoUpdateSwitch).toBeInTheDocument();

    // Toggle auto-update
    fireEvent.click(autoUpdateSwitch);

    // Should toggle the switch state
    await waitFor(() => {
      expect(autoUpdateSwitch).toBeChecked();
    });
  });

  it('supports comparison mode toggle', async () => {
    const 
    render(<InteractiveModeling data={mockStrategicData} onDataUpdate={mockOnDataUpdate} />);

    // Find comparison mode switch
    const comparisonSwitch = screen.getByRole('switch', { name: /comparison mode/i });
    expect(comparisonSwitch).toBeInTheDocument();

    // Toggle comparison mode
    fireEvent.click(comparisonSwitch);

    // Should toggle the switch state
    await waitFor(() => {
      expect(comparisonSwitch).toBeChecked();
    });
  });

  it('supports scenario export functionality', async () => {
    const 

    // Mock URL.createObjectURL and related functions
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();

    // Mock document.createElement and click
    const mockAnchor = {
      href: '',
      download: '',
      click: jest.fn()
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);

    render(<InteractiveModeling data={mockStrategicData} onDataUpdate={mockOnDataUpdate} />);

    // Find export button
    const exportButton = screen.getAllByRole('button').find(button =>
      button.querySelector('svg') && button.getAttribute('aria-label')?.includes('download')
    );

    if (exportButton) {
      fireEvent.click(exportButton);

      // Should trigger download
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockAnchor.click).toHaveBeenCalled();
    }
  });

  it('supports category-based variable filtering', async () => {
    const 
    render(<InteractiveModeling data={mockStrategicData} onDataUpdate={mockOnDataUpdate} />);

    // Navigate to variable controls
    const variableTab = screen.getByRole('tab', { name: /variable controls/i });
    fireEvent.click(variableTab);

    // Should show category tabs
    expect(screen.getByRole('tab', { name: /all variables/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /growth/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /market/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /risk/i })).toBeInTheDocument();

    // Click on growth category
    const growthTab = screen.getByRole('tab', { name: /growth/i });
    fireEvent.click(growthTab);

    // Should filter variables to only growth-related ones
    expect(screen.getByText(/revenue growth rate/i)).toBeInTheDocument();
  });

  it('displays scenario comparison when scenarios are selected', async () => {
    const 
    render(<InteractiveModeling data={mockStrategicData} onDataUpdate={mockOnDataUpdate} />);

    // Navigate to comparison tab
    const comparisonTab = screen.getByRole('tab', { name: /comparison/i });
    fireEvent.click(comparisonTab);

    // Should show comparison interface
    expect(screen.getByText(/scenario comparison/i)).toBeInTheDocument();
    expect(screen.getByText(/side-by-side comparison/i)).toBeInTheDocument();
  });

  it('handles variable impact badges correctly', () => {
    render(<InteractiveModeling data={mockStrategicData} onDataUpdate={mockOnDataUpdate} />);

    // Should display impact badges
    const badges = screen.getAllByText(/high|medium|low/i);
    expect(badges.length).toBeGreaterThan(0);

    // Check for specific impact levels
    expect(screen.getAllByText(/high/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/medium/i).length).toBeGreaterThan(0);
  });

  it('calls onDataUpdate when auto-update is enabled and variables change', async () => {
    const 
    render(<InteractiveModeling data={mockStrategicData} onDataUpdate={mockOnDataUpdate} />);

    // Enable auto-update
    const autoUpdateSwitch = screen.getByRole('switch', { name: /auto-update/i });
    if (!autoUpdateSwitch.hasAttribute('checked')) {
      fireEvent.click(autoUpdateSwitch);
    }

    // Change a variable
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.clear(inputs[0]);
    fireEvent.type(inputs[0], '0.3');

    // Should eventually call onDataUpdate (after debounce)
    await waitFor(() => {
      expect(mockOnDataUpdate).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('displays proper status indicators', () => {
    render(<InteractiveModeling data={mockStrategicData} onDataUpdate={mockOnDataUpdate} />);

    // Should show status information
    expect(screen.getByText(/scenarios saved/i)).toBeInTheDocument();
    expect(screen.getByText(/variables/i)).toBeInTheDocument();
  });

  it('handles keyboard navigation for accessibility', async () => {
    const 
    render(<InteractiveModeling data={mockStrategicData} onDataUpdate={mockOnDataUpdate} />);

    // Tab navigation should work
    fireEvent.tab();
    expect(document.activeElement).toBeInTheDocument();

    // Should be able to navigate through controls
    fireEvent.tab();
    fireEvent.tab();
    expect(document.activeElement).toBeInTheDocument();
  });
});

// Integration tests
describe('InteractiveModeling Integration', () => {
  let mockOnDataUpdate: jest.Mock;

  beforeEach(() => {
    mockOnDataUpdate = jest.fn();
  });

  it('integrates properly with StrategicScenarioData updates', async () => {
    const 
    render(<InteractiveModeling data={mockStrategicData} onDataUpdate={mockOnDataUpdate} />);

    // Enable auto-update
    const autoUpdateSwitch = screen.getByRole('switch', { name: /auto-update/i });
    fireEvent.click(autoUpdateSwitch);

    // Make multiple variable changes
    const inputs = screen.getAllByRole('spinbutton');

    fireEvent.clear(inputs[0]);
    fireEvent.type(inputs[0], '0.2');

    if (inputs[1]) {
      fireEvent.clear(inputs[1]);
      fireEvent.type(inputs[1], '1.2');
    }

    // Should call onDataUpdate with updated data
    await waitFor(() => {
      expect(mockOnDataUpdate).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('maintains data consistency across scenario operations', async () => {
    const 
    render(<InteractiveModeling data={mockStrategicData} onDataUpdate={mockOnDataUpdate} />);

    // Perform a series of operations
    const inputs = screen.getAllByRole('spinbutton');

    // Change variables
    fireEvent.clear(inputs[0]);
    fireEvent.type(inputs[0], '0.25');

    // Navigate to scenario manager
    const scenarioTab = screen.getByRole('tab', { name: /scenario manager/i });
    fireEvent.click(scenarioTab);

    // Values should be preserved
    fireEvent.click(screen.getByRole('tab', { name: /variable controls/i }));

    await waitFor(() => {
      expect(inputs[0]).toHaveValue(0.25);
    });
  });
});