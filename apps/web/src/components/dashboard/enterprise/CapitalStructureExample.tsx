'use client'

// Example usage of the Capital Structure Optimizer component
// This demonstrates how to integrate with the enterprise dashboard

import React from 'react'
import CapitalStructureOptimizer, { type CapitalStructureData } from './CapitalStructureOptimizer'

// Sample data for demonstration - would come from API/database in real implementation
const sampleCapitalStructureData: CapitalStructureData = {
  currentStructure: {
    debt: 60, // 60% debt
    equity: 40, // 40% equity
    debtToEquity: 1.5,
    weightedAverageCostOfCapital: 0.085, // 8.5%
    debtServiceCoverage: 1.8,
    creditRating: 'BBB'
  },
  optimizedStructure: {
    debt: 40, // 40% debt
    equity: 60, // 60% equity
    debtToEquity: 0.67,
    weightedAverageCostOfCapital: 0.072, // 7.2%
    debtServiceCoverage: 2.4,
    creditRating: 'A'
  },
  scenarios: [
    {
      name: 'Conservative',
      debtRatio: 0.2,
      wacc: 0.075,
      creditRating: 'AA',
      riskLevel: 'low'
    },
    {
      name: 'Moderate',
      debtRatio: 0.4,
      wacc: 0.068,
      creditRating: 'A',
      riskLevel: 'medium'
    },
    {
      name: 'Aggressive',
      debtRatio: 0.6,
      wacc: 0.078,
      creditRating: 'BBB',
      riskLevel: 'high'
    }
  ],
  costOfCapital: {
    costOfDebt: 0.045, // 4.5%
    costOfEquity: 0.12, // 12%
    wacc: 0.085, // 8.5%
    taxRate: 0.25, // 25%
    riskFreeRate: 0.025, // 2.5%
    marketRiskPremium: 0.065, // 6.5%
    beta: 1.3
  },
  leverageAnalysis: {
    debtToEquityRatio: 1.5,
    debtToAssetRatio: 0.6,
    interestCoverageRatio: 3.2,
    debtServiceCoverageRatio: 1.8,
    timesInterestEarned: 3.2,
    cashCoverageRatio: 2.1
  }
}

/**
 * Example component showing Capital Structure Optimizer integration
 */
const CapitalStructureExample: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-tier-enterprise mb-2">
          Capital Structure Optimization Tools
        </h2>
        <p className="text-gray-600">
          Advanced financial analysis for optimal capital structure and WACC minimization.
          This component provides comprehensive debt-to-equity optimization with real-time
          scenario modeling and strategic recommendations.
        </p>
      </div>

      <CapitalStructureOptimizer data={sampleCapitalStructureData} />

      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Integration Guide</h3>
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium">Data Requirements:</h4>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
              <li>Current and optimized capital structure metrics</li>
              <li>Cost of capital analysis (WACC, cost of debt/equity)</li>
              <li>Leverage metrics and debt service coverage ratios</li>
              <li>Multiple scenario data for comparative analysis</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium">Key Features:</h4>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
              <li>Interactive optimization controls with target ratio adjustment</li>
              <li>Visual comparison of current vs optimized capital structure</li>
              <li>Real-time WACC calculation and cost analysis</li>
              <li>Comprehensive leverage metrics dashboard</li>
              <li>Strategic recommendations with actionable insights</li>
              <li>Credit rating impact analysis</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium">Usage in Enterprise Dashboard:</h4>
            <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
{`import { CapitalStructureOptimizer } from '@/components/dashboard/enterprise'

// In your dashboard component
<CapitalStructureOptimizer data={capitalStructureData} />`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CapitalStructureExample

/**
 * Utility function to fetch capital structure data
 * Replace with actual API integration
 */
export async function fetchCapitalStructureData(companyId: string): Promise<CapitalStructureData> {
  // This would be replaced with actual API call
  // Example: const response = await fetch(`/api/capital-structure/${companyId}`)
  return Promise.resolve(sampleCapitalStructureData)
}

/**
 * Utility function to calculate optimal structure based on company financials
 */
export function calculateOptimalCapitalStructure(
  financialData: {
    totalDebt: number
    totalEquity: number
    ebit: number
    interestExpense: number
    operatingCashFlow: number
    taxRate: number
  }
): CapitalStructureData {
  // This would use the financial calculation utilities
  // from @/lib/financial/capital-structure-calculations

  // For now, return sample data
  return sampleCapitalStructureData
}