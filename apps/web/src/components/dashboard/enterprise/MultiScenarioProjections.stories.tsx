import type { Meta, StoryObj } from '@storybook/react';
import MultiScenarioProjections from './MultiScenarioProjections';
import { createSampleProjectionData } from '@/lib/utils/enterprise-calculations';

const meta: Meta<typeof MultiScenarioProjections> = {
  title: 'Enterprise/Dashboard/MultiScenarioProjections',
  component: MultiScenarioProjections,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Multi-Scenario Financial Projections

A comprehensive financial projection component for Enterprise tier users featuring:

- **Base, Optimistic, and Conservative scenarios** with custom scenario support
- **5-year financial projections** with multiple view types
- **Metric selection** for revenue, EBITDA, cash flow, and valuation
- **Three visualization types**: line chart, waterfall chart, and sensitivity analysis
- **Confidence intervals** to show projection uncertainty
- **Projection insights** with key drivers and risk factors

## Features

### Scenario Types
- **Base Case**: Moderate growth assumptions with medium confidence
- **Optimistic Case**: Aggressive growth with higher potential returns
- **Conservative Case**: Modest growth with lower risk
- **Custom Scenarios**: User-defined scenarios (e.g., acquisition strategy)

### Chart Types
- **Line Chart**: Multi-scenario comparison with confidence intervals
- **Waterfall Chart**: Impact analysis showing scenario differences
- **Sensitivity Analysis**: Variable impact on financial outcomes

### Financial Metrics
- **Revenue**: Total company revenue projections
- **EBITDA**: Earnings before interest, taxes, depreciation, and amortization
- **Cash Flow**: Operating cash flow projections
- **Valuation**: Enterprise valuation using industry multiples

## Integration

This component integrates with:
- Enterprise questionnaire data from story 11.6
- Financial calculation utilities
- Enterprise database schema
- Strategic planning modules

## Usage

The component accepts \`MultiScenarioProjectionData\` which includes base case, optimistic case, conservative case, custom scenarios, sensitivity analysis, and confidence intervals.
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with sample data
export const Default: Story = {
  args: {
    data: createSampleProjectionData(),
  },
};

// Technology company scenario
export const TechnologyCompany: Story = {
  args: {
    data: (() => {
      const data = createSampleProjectionData();
      // Customize for tech company with higher growth rates
      data.baseCase.projections = data.baseCase.projections.map((p, i) => ({
        ...p,
        revenue: p.revenue * (1 + (i * 0.15)), // Higher growth
        valuation: p.valuation * 1.5, // Higher valuation multiples
      }));
      data.optimisticCase.projections = data.optimisticCase.projections.map((p, i) => ({
        ...p,
        revenue: p.revenue * (1 + (i * 0.25)), // Aggressive tech growth
        valuation: p.valuation * 2.0,
      }));
      return data;
    })(),
  },
};

// Conservative growth scenario
export const ConservativeGrowth: Story = {
  args: {
    data: (() => {
      const data = createSampleProjectionData();
      // Lower growth rates across all scenarios
      data.baseCase.projections = data.baseCase.projections.map((p, i) => ({
        ...p,
        revenue: p.revenue * (1 + (i * 0.05)), // Lower growth
        ebitda: p.ebitda * (1 + (i * 0.03)),
      }));
      data.optimisticCase.projections = data.optimisticCase.projections.map((p, i) => ({
        ...p,
        revenue: p.revenue * (1 + (i * 0.08)), // Modest optimism
        ebitda: p.ebitda * (1 + (i * 0.06)),
      }));
      return data;
    })(),
  },
};

// High-risk, high-reward scenario
export const HighRiskHighReward: Story = {
  args: {
    data: (() => {
      const data = createSampleProjectionData();

      // Add more dramatic scenarios
      data.optimisticCase.keyDrivers = [
        { name: 'Market Disruption', impact: 'critical', description: 'Revolutionary product launch', currentValue: 100, projectedValue: 1000 },
        { name: 'Global Expansion', impact: 'critical', description: 'Rapid international growth', currentValue: 100, projectedValue: 800 },
        { name: 'Technology Breakthrough', impact: 'high', description: 'Proprietary tech advantage', currentValue: 100, projectedValue: 600 },
      ];

      data.conservativeCase.riskFactors = [
        { category: 'Market', description: 'Severe economic recession', probability: 60, impact: 'critical' },
        { category: 'Competition', description: 'Tech giant market entry', probability: 70, impact: 'critical' },
        { category: 'Regulatory', description: 'Restrictive new regulations', probability: 40, impact: 'high' },
      ];

      // Increase sensitivity
      data.sensitivityAnalysis.scenarios = [
        { name: 'Economic Boom', impacts: { revenue: 50, ebitda: 60, valuation: 80 } },
        { name: 'Market Crash', impacts: { revenue: -40, ebitda: -60, valuation: -50 } },
        { name: 'Tech Revolution', impacts: { revenue: 80, ebitda: 70, valuation: 120 } },
        { name: 'Regulatory Crackdown', impacts: { revenue: -30, ebitda: -40, valuation: -60 } },
      ];

      return data;
    })(),
  },
};

// Acquisition-focused scenario
export const AcquisitionStrategy: Story = {
  args: {
    data: (() => {
      const data = createSampleProjectionData();

      // Emphasize the acquisition custom scenario
      data.customScenarios = [
        {
          scenarioName: 'Aggressive Acquisition',
          projections: data.baseCase.projections.map((p, i) => ({
            ...p,
            revenue: p.revenue * (1 + (i * 0.3)), // High growth through acquisitions
            ebitda: p.ebitda * (1 + (i * 0.25)), // Synergy benefits
            cashFlow: p.cashFlow * (1 + (i * 0.35)), // Cash flow improvements
            valuation: p.valuation * 1.8, // Premium valuation
          })),
          assumptions: [
            { category: 'M&A', description: '3-4 strategic acquisitions', value: '$50M total', confidence: 'medium' },
            { category: 'Integration', description: 'Successful integration', value: '12-18 months', confidence: 'low' },
            { category: 'Synergies', description: 'Revenue and cost synergies', value: '25-35%', confidence: 'medium' },
          ],
          keyDrivers: [
            { name: 'Target Acquisition', impact: 'critical', description: 'Strategic market acquisitions', currentValue: 100, projectedValue: 400 },
            { name: 'Integration Excellence', impact: 'high', description: 'Smooth M&A integration', currentValue: 100, projectedValue: 250 },
            { name: 'Synergy Realization', impact: 'high', description: 'Cross-selling and cost savings', currentValue: 100, projectedValue: 300 },
          ],
          riskFactors: [
            { category: 'Execution', description: 'Integration failures', probability: 45, impact: 'critical' },
            { category: 'Cultural', description: 'Cultural misalignment', probability: 35, impact: 'high' },
            { category: 'Financial', description: 'Overpaying for targets', probability: 50, impact: 'high' },
          ],
          confidence: 45,
          probability: 25,
        },
        {
          scenarioName: 'Roll-up Strategy',
          projections: data.baseCase.projections.map((p, i) => ({
            ...p,
            revenue: p.revenue * (1 + (i * 0.4)), // Rapid consolidation
            ebitda: p.ebitda * (1 + (i * 0.35)), // Scale efficiencies
            cashFlow: p.cashFlow * (1 + (i * 0.45)), // Operational leverage
            valuation: p.valuation * 2.2, // Market leadership premium
          })),
          assumptions: [
            { category: 'Strategy', description: 'Market consolidation play', value: '10-15 targets', confidence: 'low' },
            { category: 'Financing', description: 'Debt and equity financing', value: '$200M+', confidence: 'medium' },
            { category: 'Execution', description: 'Rapid integration capability', value: '6-month cycles', confidence: 'low' },
          ],
          keyDrivers: [
            { name: 'Market Consolidation', impact: 'critical', description: 'Industry roll-up', currentValue: 100, projectedValue: 800 },
            { name: 'Operational Scale', impact: 'critical', description: 'Massive economies of scale', currentValue: 100, projectedValue: 500 },
            { name: 'Market Dominance', impact: 'high', description: 'Regional market leader', currentValue: 100, projectedValue: 600 },
          ],
          riskFactors: [
            { category: 'Execution', description: 'Complex integration at scale', probability: 70, impact: 'critical' },
            { category: 'Financing', description: 'Debt capacity constraints', probability: 55, impact: 'critical' },
            { category: 'Market', description: 'Antitrust concerns', probability: 30, impact: 'critical' },
          ],
          confidence: 30,
          probability: 15,
        }
      ];

      return data;
    })(),
  },
};

// Empty data edge case
export const EmptyData: Story = {
  args: {
    data: {
      baseCase: {
        scenarioName: 'Base Case',
        projections: [],
        assumptions: [],
        keyDrivers: [],
        riskFactors: [],
        confidence: 0,
        probability: 0,
      },
      optimisticCase: {
        scenarioName: 'Optimistic Case',
        projections: [],
        assumptions: [],
        keyDrivers: [],
        riskFactors: [],
        confidence: 0,
        probability: 0,
      },
      conservativeCase: {
        scenarioName: 'Conservative Case',
        projections: [],
        assumptions: [],
        keyDrivers: [],
        riskFactors: [],
        confidence: 0,
        probability: 0,
      },
      customScenarios: [],
      sensitivityAnalysis: {
        variables: [],
        scenarios: [],
      },
      confidenceIntervals: [],
    },
  },
};