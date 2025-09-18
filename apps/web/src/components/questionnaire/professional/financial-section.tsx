"use client"

import React, { memo, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ProfessionalField from './professional-field'
import { ProfessionalTierData } from '@/types/evaluation'
import { useMemoizedCalculations, usePerformanceOptimization } from '@/lib/performance/questionnaire-optimizer'

interface FinancialSectionProps {
  data: ProfessionalTierData['financialMetrics']
  onChange: (data: Partial<ProfessionalTierData['financialMetrics']>) => void
  errors?: Record<string, string>
}

export const FinancialSection = memo<FinancialSectionProps>(({ data, onChange, errors = {} }) => {
  const { calculateFinancialRatios } = useMemoizedCalculations()
  const { optimizedCallback } = usePerformanceOptimization()

  // Memoized field change handler to prevent unnecessary re-renders
  const handleFieldChange = useCallback(
    optimizedCallback((field: keyof ProfessionalTierData['financialMetrics'], value: any) => {
      onChange({ [field]: value })
    }),
    [onChange, optimizedCallback]
  )

  // Memoized financial calculations
  const calculatedMetrics = useMemo(() => {
    return calculateFinancialRatios(data)
  }, [data, calculateFinancialRatios])

  // Memoized field definitions to prevent recreation on every render
  const financialFields = useMemo(() => [
    {
      name: 'annualRevenue',
      label: 'Annual Revenue',
      type: 'number' as const,
      placeholder: '500000',
      required: true,
      methodology: {
        purpose: 'Total revenue is the foundation for all valuation methodologies. It indicates business scale and market presence.',
        calculation: 'Sum of all revenue streams over 12 months, including recurring and one-time revenues.',
        benchmarks: 'Varies by industry. SaaS: $1M+ for growth stage, Manufacturing: $5M+ for mid-market.',
        impact: 'Primary driver of revenue multiple valuations. Higher revenue generally correlates with higher valuations.'
      }
    },
    {
      name: 'monthlyRecurring',
      label: 'Monthly Recurring Revenue (MRR)',
      type: 'number' as const,
      placeholder: '25000',
      methodology: {
        purpose: 'MRR indicates revenue predictability and sustainability, crucial for SaaS and subscription businesses.',
        calculation: 'Sum of all recurring monthly subscriptions and contracts.',
        benchmarks: 'SaaS: 80%+ of total revenue, Subscription services: 60%+',
        impact: 'Businesses with high MRR receive premium valuations due to predictable cash flows.'
      }
    },
    {
      name: 'expenses',
      label: 'Annual Operating Expenses',
      type: 'number' as const,
      placeholder: '350000',
      required: true,
      methodology: {
        purpose: 'Operating expenses determine profitability and operational efficiency metrics.',
        calculation: 'Total operational costs excluding capital expenditures and one-time items.',
        benchmarks: 'Should be <80% of revenue for healthy businesses.',
        impact: 'Lower expense ratios indicate better operational efficiency and higher margins.'
      }
    },
    {
      name: 'netProfit',
      label: 'Net Profit',
      type: 'number' as const,
      placeholder: '125000',
      methodology: {
        purpose: 'Net profit demonstrates actual business profitability after all expenses.',
        calculation: 'Revenue minus all expenses, taxes, and interest payments.',
        benchmarks: 'Target: 10-20% of revenue depending on industry maturity.',
        impact: 'Directly affects earnings-based valuations and investor attractiveness.'
      }
    },
    {
      name: 'ebitda',
      label: 'EBITDA',
      type: 'number' as const,
      placeholder: '175000',
      methodology: {
        purpose: 'EBITDA shows operational performance before financing and accounting decisions.',
        calculation: 'Earnings Before Interest, Taxes, Depreciation, and Amortization.',
        benchmarks: 'Target: 15-25% EBITDA margin for most industries.',
        impact: 'Key metric for EBITDA multiple valuations, especially for established businesses.'
      }
    },
    {
      name: 'cashFlow',
      label: 'Operating Cash Flow',
      type: 'number' as const,
      placeholder: '150000',
      methodology: {
        purpose: 'Operating cash flow shows actual cash generated from business operations.',
        calculation: 'Net income plus depreciation minus changes in working capital.',
        benchmarks: 'Should be positive and close to net income for healthy businesses.',
        impact: 'Critical for DCF valuations and indicates business quality to buyers.'
      }
    },
    {
      name: 'grossMargin',
      label: 'Gross Margin (%)',
      type: 'number' as const,
      placeholder: '70',
      max: 100,
      methodology: {
        purpose: 'Gross margin indicates pricing power and cost structure efficiency.',
        calculation: '(Revenue - Cost of Goods Sold) / Revenue × 100',
        benchmarks: 'Software: 80%+, Manufacturing: 20-40%, Services: 40-60%',
        impact: 'Higher gross margins indicate better scalability and premium valuations.'
      }
    },
    {
      name: 'burnRate',
      label: 'Monthly Burn Rate',
      type: 'number' as const,
      placeholder: '15000',
      methodology: {
        purpose: 'Burn rate indicates cash consumption speed, critical for growth companies.',
        calculation: 'Monthly net cash outflow from operations.',
        benchmarks: 'Should provide 12+ months runway with current cash.',
        impact: 'Lower burn rates relative to growth indicate efficient capital use.'
      }
    },
    {
      name: 'runwayMonths',
      label: 'Cash Runway (Months)',
      type: 'number' as const,
      placeholder: '18',
      methodology: {
        purpose: 'Cash runway shows business sustainability without additional funding.',
        calculation: 'Current cash reserves divided by monthly burn rate.',
        benchmarks: 'Minimum 12 months, ideally 18+ months for growth companies.',
        impact: 'Longer runway reduces risk and increases buyer confidence.'
      }
    },
    {
      name: 'debtToEquityRatio',
      label: 'Debt-to-Equity Ratio',
      type: 'number' as const,
      placeholder: '0.3',
      step: 0.01,
      methodology: {
        purpose: 'Debt-to-equity ratio measures financial leverage and risk profile.',
        calculation: 'Total debt divided by total equity.',
        benchmarks: '<0.5 for most industries, <1.0 generally acceptable.',
        impact: 'Lower ratios indicate lower financial risk and may command premium valuations.'
      }
    },
    {
      name: 'currentRatio',
      label: 'Current Ratio',
      type: 'number' as const,
      placeholder: '2.1',
      step: 0.1,
      methodology: {
        purpose: 'Current ratio measures short-term liquidity and ability to pay obligations.',
        calculation: 'Current assets divided by current liabilities.',
        benchmarks: '1.5-3.0 is healthy, varies by industry.',
        impact: 'Better liquidity ratios indicate lower operational risk.'
      }
    },
    {
      name: 'quickRatio',
      label: 'Quick Ratio (Acid Test)',
      type: 'number' as const,
      placeholder: '1.8',
      step: 0.1,
      methodology: {
        purpose: 'Quick ratio measures immediate liquidity without inventory.',
        calculation: '(Current assets - Inventory) / Current liabilities.',
        benchmarks: '1.0+ indicates good short-term liquidity.',
        impact: 'Higher quick ratios demonstrate strong financial health.'
      }
    },
    {
      name: 'inventoryTurnover',
      label: 'Inventory Turnover',
      type: 'number' as const,
      placeholder: '8.5',
      step: 0.1,
      methodology: {
        purpose: 'Inventory turnover measures efficiency in managing inventory investments.',
        calculation: 'Cost of goods sold divided by average inventory.',
        benchmarks: 'Varies by industry: Grocery 10-15x, Automotive 6-8x.',
        impact: 'Higher turnover indicates better inventory management and cash flow.'
      }
    },
    {
      name: 'receivablesTurnover',
      label: 'Receivables Turnover',
      type: 'number' as const,
      placeholder: '12',
      step: 0.1,
      methodology: {
        purpose: 'Receivables turnover measures efficiency in collecting customer payments.',
        calculation: 'Annual revenue divided by average accounts receivable.',
        benchmarks: '6-12x annually is typical for most industries.',
        impact: 'Higher turnover indicates better credit management and cash flow.'
      }
    },
    {
      name: 'workingCapital',
      label: 'Working Capital',
      type: 'number' as const,
      placeholder: '75000',
      methodology: {
        purpose: 'Working capital measures short-term financial health and operational efficiency.',
        calculation: 'Current assets minus current liabilities.',
        benchmarks: 'Should be positive, ideally 10-20% of annual revenue.',
        impact: 'Adequate working capital indicates operational stability and growth capacity.'
      }
    }
  ], [])

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="border-b border-blue-200 bg-blue-600 text-white rounded-t-lg">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold text-sm">1</span>
          </div>
          Enhanced Financial Metrics
        </CardTitle>
        <CardDescription className="text-blue-100">
          Comprehensive financial analysis with 15 key performance indicators for professional valuation
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {financialFields.map((field) => (
            <ProfessionalField
              key={field.name}
              name={field.name}
              label={field.label}
              type={field.type}
              value={data[field.name as keyof typeof data]}
              onChange={(value) => handleFieldChange(field.name as keyof ProfessionalTierData['financialMetrics'], value)}
              methodology={field.methodology}
              placeholder={field.placeholder}
              required={field.required}
              error={errors[field.name]}
              step={field.step}
              max={field.max}
            />
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-100 rounded-lg border border-blue-300">
          <h4 className="font-medium text-blue-900 mb-2">Professional Insight</h4>
          <p className="text-sm text-blue-800">
            These enhanced financial metrics enable sophisticated valuation methodologies including DCF analysis,
            EBITDA multiples, and risk-adjusted valuations. Complete data ensures accurate assessment of your business's
            financial health and market position.
          </p>

          {/* Real-time calculated metrics display */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white rounded p-2">
              <span className="text-blue-600 font-medium">Profit Margin:</span>
              <span className="ml-1">{calculatedMetrics.profitMargin.toFixed(1)}%</span>
            </div>
            <div className="bg-white rounded p-2">
              <span className="text-blue-600 font-medium">Operating Margin:</span>
              <span className="ml-1">{calculatedMetrics.operatingMargin.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

FinancialSection.displayName = 'FinancialSection'

export default FinancialSection