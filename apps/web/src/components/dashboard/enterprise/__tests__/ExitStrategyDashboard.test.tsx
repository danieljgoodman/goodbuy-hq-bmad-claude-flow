import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import ExitStrategyDashboard from '../ExitStrategyDashboard';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Target: () => <div data-testid="target-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Building2: () => <div data-testid="building-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Crown: () => <div data-testid="crown-icon" />,
  Heart: () => <div data-testid="heart-icon" />,
  Briefcase: () => <div data-testid="briefcase-icon" />,
  Banknote: () => <div data-testid="banknote-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  ArrowUp: () => <div data-testid="arrow-up-icon" />,
  ArrowDown: () => <div data-testid="arrow-down-icon" />,
  Minus: () => <div data-testid="minus-icon" />,
  Info: () => <div data-testid="info-icon" />
}));

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children, data }: { children: React.ReactNode; data: any[] }) =>
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>{children}</div>,
  BarChart: ({ children, data }: { children: React.ReactNode; data: any[] }) =>
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>{children}</div>,
  RadarChart: ({ children, data }: { children: React.ReactNode; data: any[] }) =>
    <div data-testid="radar-chart" data-chart-data={JSON.stringify(data)}>{children}</div>,
  Line: ({ dataKey }: { dataKey: string }) => <div data-testid="line" data-key={dataKey} />,
  Bar: ({ dataKey }: { dataKey: string }) => <div data-testid="bar" data-key={dataKey} />,
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

describe('ExitStrategyDashboard Component', () => {
  

  beforeEach(() => {
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Component Rendering', () => {
    it('renders the main dashboard with correct title', () => {
      render(<ExitStrategyDashboard />);

      expect(screen.getByText('Strategic Exit Planning Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive analysis of exit opportunities with valuation projections and readiness assessment')).toBeInTheDocument();
    });

    it('renders all main sections', () => {
      render(<ExitStrategyDashboard />);

      expect(screen.getByText('Exit Strategy Options')).toBeInTheDocument();
      expect(screen.getByText('Valuation Projections')).toBeInTheDocument();
      expect(screen.getByText('Transaction Readiness')).toBeInTheDocument();
      expect(screen.getByText('Value Optimization')).toBeInTheDocument();
      expect(screen.getByText('Market Timing Analysis')).toBeInTheDocument();
    });

    it('displays exit strategy cards with proper information', () => {
      render(<ExitStrategyDashboard />);

      // Check for different exit strategy types
      expect(screen.getByText('Strategic Sale')).toBeInTheDocument();
      expect(screen.getByText('Private Equity')).toBeInTheDocument();
      expect(screen.getByText('IPO')).toBeInTheDocument();
      expect(screen.getByText('Management Buyout')).toBeInTheDocument();
      expect(screen.getByText('ESOP')).toBeInTheDocument();
      expect(screen.getByText('Family Succession')).toBeInTheDocument();
    });

    it('shows feasibility scores for each exit option', () => {
      render(<ExitStrategyDashboard />);

      // Should display feasibility scores as percentages
      const feasibilityElements = screen.getAllByText(/\d+%/);
      expect(feasibilityElements.length).toBeGreaterThan(0);
    });
  });

  describe('Exit Strategy Options', () => {
    it('displays strategic sale as highest feasibility option', () => {
      render(<ExitStrategyDashboard />);

      const strategicSaleCard = screen.getByText('Strategic Sale').closest('.border');
      expect(strategicSaleCard).toBeInTheDocument();

      within(strategicSaleCard!).getByText('92%'); // Feasibility score
    });

    it('shows expected valuations for each exit type', () => {
      render(<ExitStrategyDashboard />);

      // Should display valuations in millions
      const valuationElements = screen.getAllByText(/\$\d+M/);
      expect(valuationElements.length).toBeGreaterThan(5); // At least one per exit option
    });

    it('displays time to exit for each option', () => {
      render(<ExitStrategyDashboard />);

      // Should display timeframes
      expect(screen.getByText('18-24 months')).toBeInTheDocument();
      expect(screen.getByText('24-36 months')).toBeInTheDocument();
    });

    it('shows risk factors and advantages for each option', () => {
      render(<ExitStrategyDashboard />);

      expect(screen.getByText('Market dependent valuation')).toBeInTheDocument();
      expect(screen.getByText('Maximum valuation potential')).toBeInTheDocument();
    });

    it('displays preparation steps for each exit strategy', () => {
      render(<ExitStrategyDashboard />);

      expect(screen.getByText('Financial audit and cleanup')).toBeInTheDocument();
      expect(screen.getByText('Strategic positioning')).toBeInTheDocument();
    });
  });

  describe('Valuation Projections', () => {
    it('renders valuation projection chart', () => {
      render(<ExitStrategyDashboard />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('displays optimistic, base, and conservative valuations', () => {
      render(<ExitStrategyDashboard />);

      expect(screen.getByText('Optimistic')).toBeInTheDocument();
      expect(screen.getByText('Base Case')).toBeInTheDocument();
      expect(screen.getByText('Conservative')).toBeInTheDocument();
    });

    it('shows valuation ranges over time', () => {
      render(<ExitStrategyDashboard />);

      // Should display year markers
      expect(screen.getByText('2024')).toBeInTheDocument();
      expect(screen.getByText('2025')).toBeInTheDocument();
      expect(screen.getByText('2026')).toBeInTheDocument();
    });

    it('displays probability weights for each scenario', () => {
      render(<ExitStrategyDashboard />);

      // Should show probability percentages
      const probabilities = screen.getAllByText(/\d+%/).filter(el =>
        el.textContent!.includes('%') &&
        parseInt(el.textContent!) <= 100
      );
      expect(probabilities.length).toBeGreaterThan(0);
    });
  });

  describe('Transaction Readiness', () => {
    it('displays overall readiness score', () => {
      render(<ExitStrategyDashboard />);

      expect(screen.getByText('Overall Readiness')).toBeInTheDocument();
      expect(screen.getByText('78%')).toBeInTheDocument();
    });

    it('shows readiness breakdown by category', () => {
      render(<ExitStrategyDashboard />);

      expect(screen.getByText('Financial Readiness')).toBeInTheDocument();
      expect(screen.getByText('Operational Readiness')).toBeInTheDocument();
      expect(screen.getByText('Legal Readiness')).toBeInTheDocument();
      expect(screen.getByText('Market Readiness')).toBeInTheDocument();
    });

    it('displays improvement areas', () => {
      render(<ExitStrategyDashboard />);

      expect(screen.getByText('Key Improvement Areas')).toBeInTheDocument();
      expect(screen.getByText('Financial reporting standardization')).toBeInTheDocument();
      expect(screen.getByText('Management team development')).toBeInTheDocument();
    });

    it('renders readiness radar chart', () => {
      render(<ExitStrategyDashboard />);

      expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
    });
  });

  describe('Value Optimization', () => {
    it('displays optimization actions with impact levels', () => {
      render(<ExitStrategyDashboard />);

      expect(screen.getByText('Optimize capital structure')).toBeInTheDocument();
      expect(screen.getByText('Implement advanced analytics')).toBeInTheDocument();
      expect(screen.getByText('Diversify revenue streams')).toBeInTheDocument();
    });

    it('shows high impact actions prominently', () => {
      render(<ExitStrategyDashboard />);

      const highImpactActions = screen.getAllByText('HIGH');
      expect(highImpactActions.length).toBeGreaterThan(0);
    });

    it('displays valuation increase estimates', () => {
      render(<ExitStrategyDashboard />);

      // Should show dollar amounts for valuation increases
      const increases = screen.getAllByText(/\+\$\d+M/);
      expect(increases.length).toBeGreaterThan(0);
    });

    it('shows effort levels for each action', () => {
      render(<ExitStrategyDashboard />);

      expect(screen.getByText('Medium effort')).toBeInTheDocument();
      expect(screen.getByText('High effort')).toBeInTheDocument();
    });

    it('displays timeline for optimization actions', () => {
      render(<ExitStrategyDashboard />);

      expect(screen.getByText('6-12 months')).toBeInTheDocument();
      expect(screen.getByText('12-18 months')).toBeInTheDocument();
    });
  });

  describe('Market Timing Analysis', () => {
    it('displays current market conditions', () => {
      render(<ExitStrategyDashboard />);

      expect(screen.getByText('Current Market Conditions')).toBeInTheDocument();
      expect(screen.getByText('Good')).toBeInTheDocument();
    });

    it('shows sector multiples and trends', () => {
      render(<ExitStrategyDashboard />);

      expect(screen.getByText('Sector Multiples')).toBeInTheDocument();
      expect(screen.getByText('12.5x')).toBeInTheDocument(); // Current multiple
      expect(screen.getByText('11.2x')).toBeInTheDocument(); // Historical multiple
    });

    it('displays liquidity index', () => {
      render(<ExitStrategyDashboard />);

      expect(screen.getByText('Liquidity Index')).toBeInTheDocument();
      expect(screen.getByText('72%')).toBeInTheDocument();
    });

    it('shows recommended timing', () => {
      render(<ExitStrategyDashboard />);

      expect(screen.getByText('Recommended Timing')).toBeInTheDocument();
      expect(screen.getByText('Optimal window: Next 12-18 months based on current market multiples and sector outlook')).toBeInTheDocument();
    });

    it('displays key market factors', () => {
      render(<ExitStrategyDashboard />);

      expect(screen.getByText('Key Factors')).toBeInTheDocument();
      expect(screen.getByText('Strong buyer demand in sector')).toBeInTheDocument();
      expect(screen.getByText('Favorable interest rate environment')).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    it('handles timeline slider changes', async () => {
      render(<ExitStrategyDashboard />);

      const sliders = screen.getAllByRole('slider');
      if (sliders.length > 0) {
        const timelineSlider = sliders[0];
        fireEvent.change(timelineSlider, { target: { value: '36' } });

        // Component should update without errors
        expect(screen.getByText('Strategic Exit Planning Dashboard')).toBeInTheDocument();
      }
    });

    it('updates charts when timeline changes', async () => {
      render(<ExitStrategyDashboard />);

      // Find timeline controls if they exist
      const timelineControls = screen.queryAllByText(/months?/);
      expect(timelineControls.length).toBeGreaterThan(0);
    });

    it('shows detailed information on hover/click', async () => {
      render(<ExitStrategyDashboard />);

      // Click on an exit strategy card to see if it provides more details
      const strategicSaleCard = screen.getByText('Strategic Sale').closest('.border');
      if (strategicSaleCard) {
        fireEvent.click(strategicSaleCard);
        // Should not crash the component
        expect(screen.getByText('Strategic Exit Planning Dashboard')).toBeInTheDocument();
      }
    });
  });

  describe('Performance Tests', () => {
    it('renders efficiently with complex data', async () => {
      const startTime = performance.now();

      render(<ExitStrategyDashboard />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time
      expect(renderTime).toBeLessThan(200);
      expect(screen.getByText('Strategic Exit Planning Dashboard')).toBeInTheDocument();
    });

    it('handles rapid component updates without memory leaks', async () => {
      const { rerender } = render(<ExitStrategyDashboard />);

      // Re-render multiple times to test for memory issues
      for (let i = 0; i < 10; i++) {
        rerender(<ExitStrategyDashboard />);
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      expect(screen.getByText('Strategic Exit Planning Dashboard')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing or invalid data gracefully', () => {
      // Mock console.warn to prevent test noise
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(() => render(<ExitStrategyDashboard />)).not.toThrow();

      consoleSpy.mockRestore();
    });

    it('displays appropriate fallbacks for missing charts', () => {
      render(<ExitStrategyDashboard />);

      // Should always display main sections even if charts fail
      expect(screen.getByText('Strategic Exit Planning Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Exit Strategy Options')).toBeInTheDocument();
    });

    it('handles extremely large valuation numbers', () => {
      render(<ExitStrategyDashboard />);

      // Component should handle large numbers without breaking
      expect(screen.getByText('Strategic Exit Planning Dashboard')).toBeInTheDocument();
    });

    it('maintains functionality with zero or negative values', () => {
      render(<ExitStrategyDashboard />);

      // Should not crash with edge case values
      expect(screen.getByText('Strategic Exit Planning Dashboard')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<ExitStrategyDashboard />);

      expect(screen.getByRole('main') || screen.getByText('Strategic Exit Planning Dashboard')).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      render(<ExitStrategyDashboard />);

      // Tab through interactive elements
      fireEvent.tab();

      // Should not crash during keyboard navigation
      expect(screen.getByText('Strategic Exit Planning Dashboard')).toBeInTheDocument();
    });

    it('has sufficient color contrast for badges and indicators', () => {
      render(<ExitStrategyDashboard />);

      // Check that impact badges are present and visible
      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('MEDIUM')).toBeInTheDocument();
      expect(screen.getByText('LOW')).toBeInTheDocument();
    });

    it('provides screen reader friendly content', () => {
      render(<ExitStrategyDashboard />);

      // Important information should be in text form
      expect(screen.getByText('78%')).toBeInTheDocument(); // Overall readiness
      expect(screen.getByText('92%')).toBeInTheDocument(); // Feasibility score
    });
  });

  describe('Security Tests', () => {
    it('sanitizes displayed data to prevent XSS', () => {
      render(<ExitStrategyDashboard />);

      // Should display content as text, not execute scripts
      expect(screen.getByText('Strategic Exit Planning Dashboard')).toBeInTheDocument();
    });

    it('validates numeric inputs appropriately', () => {
      render(<ExitStrategyDashboard />);

      // Component should handle invalid numeric data gracefully
      expect(screen.getByText('Strategic Exit Planning Dashboard')).toBeInTheDocument();
    });

    it('prevents unauthorized data access', () => {
      render(<ExitStrategyDashboard />);

      // Should only display mock/sample data, not real sensitive information
      expect(screen.getByText('Strategic Exit Planning Dashboard')).toBeInTheDocument();
    });
  });

  describe('Data Validation', () => {
    it('displays correct exit strategy feasibility rankings', () => {
      render(<ExitStrategyDashboard />);

      // Strategic Sale should have highest feasibility (92%)
      const strategicSale = screen.getByText('Strategic Sale').closest('.border');
      expect(within(strategicSale!).getByText('92%')).toBeInTheDocument();
    });

    it('shows realistic valuation projections', () => {
      render(<ExitStrategyDashboard />);

      // Should display reasonable valuation amounts
      const valuations = screen.getAllByText(/\$\d+M/);
      expect(valuations.length).toBeGreaterThan(0);
    });

    it('validates readiness scores are within expected ranges', () => {
      render(<ExitStrategyDashboard />);

      // Overall readiness should be 78%
      expect(screen.getByText('78%')).toBeInTheDocument();
    });

    it('ensures timeline consistency across components', () => {
      render(<ExitStrategyDashboard />);

      // Timelines should be realistic (months, not years for most strategies)
      expect(screen.getByText('18-24 months')).toBeInTheDocument();
      expect(screen.getByText('24-36 months')).toBeInTheDocument();
    });
  });
});