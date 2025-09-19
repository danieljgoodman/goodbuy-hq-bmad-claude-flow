"use client";

import React from 'react';
import ScenarioMatrix from './ScenarioMatrix';
import type { StrategicScenarioData } from '@/types/enterprise-dashboard';

// Example data for demonstrating the ScenarioMatrix component
const mockScenarioData: StrategicScenarioData = {
  scenarios: [
    {
      id: 'base-case',
      name: 'Base Case Growth',
      assumptions: [
        {
          id: 'rev-growth',
          category: 'Revenue',
          description: 'Annual revenue growth rate',
          value: 15,
          unit: '%',
          confidence: 85
        },
        {
          id: 'margin-improve',
          category: 'Profitability',
          description: 'EBITDA margin improvement',
          value: 2,
          unit: '%',
          confidence: 75
        }
      ],
      projections: [
        { year: 2024, revenue: 10000000, ebitda: 2000000, cashFlow: 1800000, valuation: 25000000 },
        { year: 2025, revenue: 11500000, ebitda: 2400000, cashFlow: 2200000, valuation: 30000000 },
        { year: 2026, revenue: 13225000, ebitda: 2900000, cashFlow: 2700000, valuation: 36000000 },
        { year: 2027, revenue: 15208750, ebitda: 3500000, cashFlow: 3300000, valuation: 43000000 },
        { year: 2028, revenue: 17490063, ebitda: 4200000, cashFlow: 4000000, valuation: 52000000 }
      ],
      investmentRequired: 2500000,
      expectedROI: 24.5,
      riskLevel: 'medium',
      probabilityOfSuccess: 75,
      valuationImpact: 27000000,
      timeline: 36,
      keyDrivers: ['Market Expansion', 'Operational Efficiency', 'Digital Transformation'],
      riskFactors: ['Market Competition', 'Economic Downturn']
    },
    {
      id: 'optimistic-case',
      name: 'Aggressive Expansion',
      assumptions: [
        {
          id: 'rev-growth',
          category: 'Revenue',
          description: 'Annual revenue growth rate',
          value: 25,
          unit: '%',
          confidence: 65
        },
        {
          id: 'market-share',
          category: 'Market',
          description: 'Market share capture',
          value: 15,
          unit: '%',
          confidence: 60
        }
      ],
      projections: [
        { year: 2024, revenue: 10000000, ebitda: 2000000, cashFlow: 1800000, valuation: 25000000 },
        { year: 2025, revenue: 12500000, ebitda: 2750000, cashFlow: 2500000, valuation: 35000000 },
        { year: 2026, revenue: 15625000, ebitda: 3600000, cashFlow: 3300000, valuation: 48000000 },
        { year: 2027, revenue: 19531250, ebitda: 4700000, cashFlow: 4300000, valuation: 65000000 },
        { year: 2028, revenue: 24414063, ebitda: 6100000, cashFlow: 5600000, valuation: 87000000 }
      ],
      investmentRequired: 5000000,
      expectedROI: 42.8,
      riskLevel: 'high',
      probabilityOfSuccess: 55,
      valuationImpact: 62000000,
      timeline: 42,
      keyDrivers: ['Acquisition Strategy', 'International Expansion', 'Technology Innovation'],
      riskFactors: ['Integration Risk', 'Capital Requirements', 'Market Saturation']
    },
    {
      id: 'conservative-case',
      name: 'Steady Optimization',
      assumptions: [
        {
          id: 'rev-growth',
          category: 'Revenue',
          description: 'Annual revenue growth rate',
          value: 8,
          unit: '%',
          confidence: 90
        },
        {
          id: 'cost-reduction',
          category: 'Operations',
          description: 'Cost reduction initiatives',
          value: 5,
          unit: '%',
          confidence: 85
        }
      ],
      projections: [
        { year: 2024, revenue: 10000000, ebitda: 2000000, cashFlow: 1800000, valuation: 25000000 },
        { year: 2025, revenue: 10800000, ebitda: 2200000, cashFlow: 2000000, valuation: 27000000 },
        { year: 2026, revenue: 11664000, ebitda: 2450000, cashFlow: 2200000, valuation: 29500000 },
        { year: 2027, revenue: 12597120, ebitda: 2750000, cashFlow: 2450000, valuation: 32500000 },
        { year: 2028, revenue: 13604890, ebitda: 3100000, cashFlow: 2750000, valuation: 36000000 }
      ],
      investmentRequired: 1000000,
      expectedROI: 18.2,
      riskLevel: 'low',
      probabilityOfSuccess: 85,
      valuationImpact: 11000000,
      timeline: 24,
      keyDrivers: ['Process Improvement', 'Customer Retention', 'Margin Enhancement'],
      riskFactors: ['Limited Growth Potential', 'Competitive Pressure']
    },
    {
      id: 'digital-transformation',
      name: 'Digital Innovation',
      assumptions: [
        {
          id: 'tech-investment',
          category: 'Technology',
          description: 'Technology investment ROI',
          value: 35,
          unit: '%',
          confidence: 70
        },
        {
          id: 'automation',
          category: 'Operations',
          description: 'Process automation savings',
          value: 20,
          unit: '%',
          confidence: 75
        }
      ],
      projections: [
        { year: 2024, revenue: 10000000, ebitda: 2000000, cashFlow: 1800000, valuation: 25000000 },
        { year: 2025, revenue: 11200000, ebitda: 2400000, cashFlow: 2100000, valuation: 32000000 },
        { year: 2026, revenue: 13440000, ebitda: 3200000, cashFlow: 2800000, valuation: 42000000 },
        { year: 2027, revenue: 16128000, ebitda: 4300000, cashFlow: 3800000, valuation: 56000000 },
        { year: 2028, revenue: 19353600, ebitda: 5600000, cashFlow: 5000000, valuation: 75000000 }
      ],
      investmentRequired: 3500000,
      expectedROI: 31.4,
      riskLevel: 'medium',
      probabilityOfSuccess: 70,
      valuationImpact: 50000000,
      timeline: 30,
      keyDrivers: ['AI Implementation', 'Cloud Migration', 'Data Analytics'],
      riskFactors: ['Technology Risk', 'Implementation Delays', 'Skills Gap']
    },
    {
      id: 'acquisition-strategy',
      name: 'Strategic Acquisitions',
      assumptions: [
        {
          id: 'synergies',
          category: 'M&A',
          description: 'Acquisition synergies realization',
          value: 30,
          unit: '%',
          confidence: 60
        },
        {
          id: 'integration',
          category: 'Operations',
          description: 'Integration efficiency',
          value: 85,
          unit: '%',
          confidence: 65
        }
      ],
      projections: [
        { year: 2024, revenue: 10000000, ebitda: 2000000, cashFlow: 1800000, valuation: 25000000 },
        { year: 2025, revenue: 15000000, ebitda: 3000000, cashFlow: 2500000, valuation: 40000000 },
        { year: 2026, revenue: 19500000, ebitda: 4200000, cashFlow: 3600000, valuation: 55000000 },
        { year: 2027, revenue: 25350000, ebitda: 5800000, cashFlow: 5000000, valuation: 75000000 },
        { year: 2028, revenue: 32955000, ebitda: 7900000, cashFlow: 6800000, valuation: 100000000 }
      ],
      investmentRequired: 8000000,
      expectedROI: 38.7,
      riskLevel: 'high',
      probabilityOfSuccess: 50,
      valuationImpact: 75000000,
      timeline: 48,
      keyDrivers: ['Market Consolidation', 'Synergy Capture', 'Scale Benefits'],
      riskFactors: ['Integration Complexity', 'Cultural Mismatch', 'Overpayment Risk']
    }
  ],
  comparisonMetrics: [
    { id: 'roi', name: 'Return on Investment', unit: '%', weight: 0.3 },
    { id: 'risk', name: 'Risk Level', unit: 'score', weight: 0.25 },
    { id: 'timeline', name: 'Timeline to Value', unit: 'months', weight: 0.2 },
    { id: 'probability', name: 'Success Probability', unit: '%', weight: 0.25 }
  ],
  riskAssessment: {
    overallRisk: 'medium',
    riskFactors: [
      {
        factor: 'Market Competition',
        impact: 'high',
        probability: 75,
        description: 'Increased competition may pressure margins and market share'
      },
      {
        factor: 'Economic Uncertainty',
        impact: 'medium',
        probability: 60,
        description: 'Economic downturn could reduce customer demand'
      },
      {
        factor: 'Technology Disruption',
        impact: 'high',
        probability: 40,
        description: 'New technologies could disrupt existing business model'
      }
    ],
    mitigationStrategies: [
      'Diversify revenue streams across multiple market segments',
      'Build strong competitive moats through IP and partnerships',
      'Maintain flexible cost structure for economic downturns',
      'Invest in R&D to stay ahead of technology trends'
    ],
    confidenceLevel: 78
  },
  recommendedPath: 'Base Case Growth with selective Digital Innovation elements provides optimal risk-adjusted returns. Focus on operational efficiency while investing in key technology initiatives.',
  sensitivityAnalysis: {
    variables: [
      { name: 'Revenue Growth Rate', baseValue: 15, range: [5, 30], unit: '%' },
      { name: 'EBITDA Margin', baseValue: 20, range: [15, 35], unit: '%' },
      { name: 'Investment Amount', baseValue: 2500000, range: [1000000, 5000000], unit: '$' },
      { name: 'Market Share', baseValue: 10, range: [5, 20], unit: '%' }
    ],
    results: [
      { variable: 'Revenue Growth Rate', change: -5, impact: -15.2, scenario: 'Base Case Growth' },
      { variable: 'Revenue Growth Rate', change: 5, impact: 18.7, scenario: 'Base Case Growth' },
      { variable: 'EBITDA Margin', change: -3, impact: -12.8, scenario: 'Base Case Growth' },
      { variable: 'EBITDA Margin', change: 3, impact: 14.5, scenario: 'Base Case Growth' },
      { variable: 'Investment Amount', change: 1000000, impact: -8.3, scenario: 'Base Case Growth' },
      { variable: 'Market Share', change: 5, impact: 22.4, scenario: 'Base Case Growth' }
    ]
  },
  monteCarloSimulation: {
    iterations: 10000,
    expectedValue: 35000000,
    standardDeviation: 8500000,
    valueAtRisk: 18500000,
    confidenceIntervals: [
      { level: 90, lower: 21000000, upper: 49000000 },
      { level: 95, lower: 18500000, upper: 52000000 },
      { level: 99, lower: 15000000, upper: 58000000 }
    ],
    distribution: [
      { value: 15000000, probability: 0.01 },
      { value: 20000000, probability: 0.05 },
      { value: 25000000, probability: 0.15 },
      { value: 30000000, probability: 0.25 },
      { value: 35000000, probability: 0.30 },
      { value: 40000000, probability: 0.15 },
      { value: 45000000, probability: 0.07 },
      { value: 50000000, probability: 0.02 }
    ]
  }
};

const ScenarioMatrixExample: React.FC = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Strategic Scenario Analysis Dashboard
          </h1>
          <p className="text-gray-600">
            Investment banker-grade scenario modeling and strategic planning tools for Enterprise clients
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <ScenarioMatrix data={mockScenarioData} />
        </div>
      </div>
    </div>
  );
};

export default ScenarioMatrixExample;