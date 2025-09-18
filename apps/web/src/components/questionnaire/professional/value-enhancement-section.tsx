"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ProfessionalField from './professional-field'
import { ProfessionalTierData } from '@/types/evaluation'

interface ValueEnhancementSectionProps {
  data: ProfessionalTierData['financialPlanning'] & ProfessionalTierData['compliance']
  onChange: (data: Partial<ProfessionalTierData['financialPlanning'] & ProfessionalTierData['compliance']>) => void
  errors?: Record<string, string>
}

export function ValueEnhancementSection({ data, onChange, errors = {} }: ValueEnhancementSectionProps) {
  const handleFieldChange = (field: string, value: any) => {
    onChange({ [field]: value })
  }

  const planningFields = [
    {
      name: 'budgetVariance',
      label: 'Budget Variance (%)',
      type: 'number' as const,
      placeholder: '5.2',
      step: 0.1,
      methodology: {
        purpose: 'Budget variance measures financial planning accuracy and operational control.',
        calculation: '(Actual results - Budgeted results) / Budgeted results × 100.',
        benchmarks: 'Excellent: <5%, Good: 5-10%, Needs improvement: >10%.',
        impact: 'Lower variance indicates strong financial controls and predictable performance.'
      }
    },
    {
      name: 'revenue12MonthGrowth',
      label: '12-Month Revenue Growth Forecast (%)',
      type: 'number' as const,
      placeholder: '18.5',
      step: 0.1,
      methodology: {
        purpose: 'Revenue growth forecast demonstrates business expansion potential and market opportunity.',
        calculation: 'Projected revenue growth over next 12 months based on current trends.',
        benchmarks: 'High growth: >20%, Moderate: 10-20%, Stable: 0-10%.',
        impact: 'Higher sustainable growth rates increase valuation multiples significantly.'
      }
    },
    {
      name: 'cashFlowGrowth',
      label: 'Cash Flow Growth Forecast (%)',
      type: 'number' as const,
      placeholder: '15.3',
      step: 0.1,
      methodology: {
        purpose: 'Cash flow growth indicates the sustainability of business expansion and profitability.',
        calculation: 'Projected operating cash flow growth over next 12 months.',
        benchmarks: 'Should align with or exceed revenue growth for healthy businesses.',
        impact: 'Strong cash flow growth demonstrates operational leverage and scalability.'
      }
    },
    {
      name: 'scenarioOptimisticRevenue',
      label: 'Optimistic Revenue Scenario ($)',
      type: 'number' as const,
      placeholder: '650000',
      methodology: {
        purpose: 'Optimistic scenario planning helps assess upside potential and growth opportunities.',
        calculation: 'Best-case revenue projection considering favorable market conditions.',
        benchmarks: 'Should be achievable with 25-30% probability.',
        impact: 'Higher upside potential increases option value for buyers and investors.'
      }
    },
    {
      name: 'scenarioPessimisticRevenue',
      label: 'Pessimistic Revenue Scenario ($)',
      type: 'number' as const,
      placeholder: '420000',
      methodology: {
        purpose: 'Pessimistic scenario planning assesses downside risk and business resilience.',
        calculation: 'Worst-case revenue projection under adverse conditions.',
        benchmarks: 'Should represent 10-15% probability scenario.',
        impact: 'Smaller downside risk reduces valuation discount for uncertainty.'
      }
    }
  ]

  const complianceFields = [
    {
      name: 'overallRiskScore',
      label: 'Overall Risk Score (1-100)',
      type: 'number' as const,
      placeholder: '25',
      min: 1,
      max: 100,
      methodology: {
        purpose: 'Overall risk score aggregates all business risks into a single metric for valuation adjustments.',
        calculation: 'Weighted average of financial, operational, market, and regulatory risks.',
        benchmarks: 'Low risk: <30, Moderate: 30-60, High risk: >60.',
        impact: 'Lower risk scores command premium valuations due to reduced uncertainty.'
      }
    },
    {
      name: 'regulatoryCompliance',
      label: 'Regulatory Compliance Score (%)',
      type: 'number' as const,
      placeholder: '95',
      max: 100,
      methodology: {
        purpose: 'Regulatory compliance score measures adherence to industry regulations and standards.',
        calculation: 'Percentage of applicable regulations where business is fully compliant.',
        benchmarks: 'Target: >90%, Minimum acceptable: >80%.',
        impact: 'Higher compliance reduces regulatory risk and potential future liabilities.'
      }
    },
    {
      name: 'insuranceCoverageRatio',
      label: 'Insurance Coverage Ratio',
      type: 'number' as const,
      placeholder: '1.8',
      step: 0.1,
      methodology: {
        purpose: 'Insurance coverage ratio measures risk protection relative to business value.',
        calculation: 'Total insurance coverage / Estimated business value.',
        benchmarks: 'Adequate: 1.0-2.0x, Comprehensive: >2.0x.',
        impact: 'Better insurance coverage reduces buyer risk and supports higher valuations.'
      }
    },
    {
      name: 'auditFrequency',
      label: 'Financial Audit Frequency (per year)',
      type: 'number' as const,
      placeholder: '1',
      methodology: {
        purpose: 'Regular financial audits demonstrate transparency and financial credibility.',
        calculation: 'Number of external financial audits conducted annually.',
        benchmarks: 'Annual audits preferred for larger businesses.',
        impact: 'Regular audits increase buyer confidence and reduce due diligence concerns.'
      }
    }
  ]

  return (
    <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
      <CardHeader className="border-b border-emerald-200 bg-emerald-600 text-white rounded-t-lg">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-emerald-600 font-bold text-sm">5</span>
          </div>
          Value Enhancement & Risk Management
        </CardTitle>
        <CardDescription className="text-emerald-100">
          Strategic planning metrics and comprehensive risk assessment for value optimization
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Financial Planning Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-emerald-900 mb-4 flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-700 font-bold text-xs">F</span>
            </div>
            Financial Planning & Forecasting
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {planningFields.map((field) => (
              <ProfessionalField
                key={field.name}
                name={field.name}
                label={field.label}
                type={field.type}
                value={data[field.name as keyof typeof data]}
                onChange={(value) => handleFieldChange(field.name, value)}
                methodology={field.methodology}
                placeholder={field.placeholder}
                error={errors[field.name]}
                step={field.step}
                min={field.min}
                max={field.max}
              />
            ))}
          </div>
        </div>

        {/* Risk Management Section */}
        <div className="border-t border-emerald-200 pt-6">
          <h3 className="text-lg font-semibold text-emerald-900 mb-4 flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-700 font-bold text-xs">R</span>
            </div>
            Risk Management & Compliance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {complianceFields.map((field) => (
              <ProfessionalField
                key={field.name}
                name={field.name}
                label={field.label}
                type={field.type}
                value={data[field.name as keyof typeof data]}
                onChange={(value) => handleFieldChange(field.name, value)}
                methodology={field.methodology}
                placeholder={field.placeholder}
                error={errors[field.name]}
                step={field.step}
                min={field.min}
                max={field.max}
              />
            ))}
          </div>
        </div>

        {/* Value Enhancement Dashboard */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-emerald-100 rounded-lg border border-emerald-300">
            <h4 className="font-medium text-emerald-900 mb-1">Growth Outlook</h4>
            <p className="text-xl font-bold text-emerald-700">
              {data.revenue12MonthGrowth
                ? data.revenue12MonthGrowth > 20 ? 'High' :
                  data.revenue12MonthGrowth > 10 ? 'Moderate' : 'Stable'
                : '-'
              }
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              {data.revenue12MonthGrowth ? `${data.revenue12MonthGrowth}% forecast` : 'Revenue growth'}
            </p>
          </div>
          
          <div className="p-4 bg-emerald-100 rounded-lg border border-emerald-300">
            <h4 className="font-medium text-emerald-900 mb-1">Planning Accuracy</h4>
            <p className="text-xl font-bold text-emerald-700">
              {data.budgetVariance !== undefined
                ? data.budgetVariance < 5 ? 'Excellent' :
                  data.budgetVariance < 10 ? 'Good' : 'Needs Work'
                : '-'
              }
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              {data.budgetVariance ? `${data.budgetVariance}% variance` : 'Budget variance'}
            </p>
          </div>
          
          <div className="p-4 bg-emerald-100 rounded-lg border border-emerald-300">
            <h4 className="font-medium text-emerald-900 mb-1">Risk Profile</h4>
            <p className="text-xl font-bold text-emerald-700">
              {data.overallRiskScore
                ? data.overallRiskScore < 30 ? 'Low' :
                  data.overallRiskScore < 60 ? 'Moderate' : 'High'
                : '-'
              }
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              {data.overallRiskScore ? `Score: ${data.overallRiskScore}` : 'Overall risk'}
            </p>
          </div>
          
          <div className="p-4 bg-emerald-100 rounded-lg border border-emerald-300">
            <h4 className="font-medium text-emerald-900 mb-1">Compliance</h4>
            <p className="text-xl font-bold text-emerald-700">
              {data.regulatoryCompliance
                ? data.regulatoryCompliance > 90 ? 'Excellent' :
                  data.regulatoryCompliance > 80 ? 'Good' : 'Needs Work'
                : '-'
              }
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              {data.regulatoryCompliance ? `${data.regulatoryCompliance}% compliant` : 'Regulatory status'}
            </p>
          </div>
        </div>

        {/* Scenario Analysis */}
        {(data.scenarioOptimisticRevenue || data.scenarioPessimisticRevenue) && (
          <div className="mt-6 p-4 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg border border-emerald-300">
            <h4 className="font-medium text-emerald-900 mb-3">Scenario Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-emerald-700">Optimistic</p>
                <p className="text-lg font-semibold text-emerald-800">
                  {data.scenarioOptimisticRevenue 
                    ? `$${(data.scenarioOptimisticRevenue / 1000).toFixed(0)}K` 
                    : '-'
                  }
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-emerald-700">Current</p>
                <p className="text-lg font-semibold text-emerald-800">
                  Current Revenue
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-emerald-700">Pessimistic</p>
                <p className="text-lg font-semibold text-emerald-800">
                  {data.scenarioPessimisticRevenue 
                    ? `$${(data.scenarioPessimisticRevenue / 1000).toFixed(0)}K` 
                    : '-'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-emerald-100 rounded-lg border border-emerald-300">
          <h4 className="font-medium text-emerald-900 mb-2">Value Enhancement Impact</h4>
          <p className="text-sm text-emerald-800">
            Strategic planning, scenario analysis, and comprehensive risk management demonstrate sophisticated business 
            operations and forward-thinking leadership. These factors significantly enhance business value by reducing 
            uncertainty, demonstrating growth potential, and providing buyers with confidence in future performance.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default ValueEnhancementSection