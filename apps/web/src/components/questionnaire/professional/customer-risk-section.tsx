"use client"

import React, { memo, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ProfessionalField from './professional-field'
import { ProfessionalTierData } from '@/types/evaluation'
import { useMemoizedCalculations, usePerformanceOptimization } from '@/lib/performance/questionnaire-optimizer'

interface CustomerRiskSectionProps {
  data: ProfessionalTierData['customerAnalytics']
  onChange: (data: Partial<ProfessionalTierData['customerAnalytics']>) => void
  errors?: Record<string, string>
}

export const CustomerRiskSection = memo<CustomerRiskSectionProps>(({ data, onChange, errors = {} }) => {
  const { calculateCustomerMetrics } = useMemoizedCalculations()
  const { optimizedCallback } = usePerformanceOptimization()

  // Memoized field change handler
  const handleFieldChange = useCallback(
    optimizedCallback((field: keyof ProfessionalTierData['customerAnalytics'], value: any) => {
      onChange({ [field]: value })
    }),
    [onChange, optimizedCallback]
  )

  // Memoized customer calculations
  const calculatedMetrics = useMemo(() => {
    return calculateCustomerMetrics(data)
  }, [data, calculateCustomerMetrics])

  // Memoized field definitions
  const customerFields = useMemo(() => [
    {
      name: 'customerAcquisitionCost',
      label: 'Customer Acquisition Cost (CAC)',
      type: 'number' as const,
      placeholder: '150',
      required: true,
      methodology: {
        purpose: 'CAC measures the cost efficiency of acquiring new customers, critical for growth sustainability.',
        calculation: 'Total marketing and sales expenses divided by number of new customers acquired.',
        benchmarks: 'CAC should be recovered within 12 months. SaaS: $100-500, E-commerce: $50-200.',
        impact: 'Lower CAC relative to LTV indicates scalable, profitable growth potential.'
      }
    },
    {
      name: 'customerLifetimeValue',
      label: 'Customer Lifetime Value (LTV)',
      type: 'number' as const,
      placeholder: '2400',
      required: true,
      methodology: {
        purpose: 'LTV quantifies the total value a customer brings over their entire relationship.',
        calculation: 'Average revenue per customer × Gross margin × Customer lifespan.',
        benchmarks: 'LTV:CAC ratio should be 3:1 or higher for healthy unit economics.',
        impact: 'Higher LTV indicates valuable customer relationships and pricing power.'
      }
    },
    {
      name: 'churnRate',
      label: 'Monthly Churn Rate (%)',
      type: 'number' as const,
      placeholder: '3.5',
      step: 0.1,
      max: 100,
      methodology: {
        purpose: 'Churn rate measures customer retention and business sustainability.',
        calculation: 'Number of customers lost in a month / Total customers at start of month × 100.',
        benchmarks: 'SaaS: <5% monthly, E-commerce: <10%, Services: <2%.',
        impact: 'Lower churn rates indicate stronger customer satisfaction and recurring revenue.'
      }
    },
    {
      name: 'netPromoterScore',
      label: 'Net Promoter Score (NPS)',
      type: 'number' as const,
      placeholder: '45',
      min: -100,
      max: 100,
      methodology: {
        purpose: 'NPS measures customer satisfaction and likelihood to recommend your business.',
        calculation: '% Promoters (9-10 rating) minus % Detractors (0-6 rating).',
        benchmarks: 'Excellent: >70, Good: 30-70, Poor: <30. World-class: >80.',
        impact: 'Higher NPS correlates with organic growth, lower churn, and premium pricing.'
      }
    },
    {
      name: 'monthlyActiveUsers',
      label: 'Monthly Active Users (MAUs)',
      type: 'number' as const,
      placeholder: '5200',
      methodology: {
        purpose: 'MAUs indicate user engagement and platform stickiness for digital businesses.',
        calculation: 'Unique users who actively engage with your product/service monthly.',
        benchmarks: 'Growth rate should exceed 10% monthly for high-growth companies.',
        impact: 'Growing MAUs demonstrate product-market fit and scalability potential.'
      }
    },
    {
      name: 'conversionRate',
      label: 'Conversion Rate (%)',
      type: 'number' as const,
      placeholder: '2.8',
      step: 0.1,
      max: 100,
      methodology: {
        purpose: 'Conversion rate measures the effectiveness of your sales and marketing funnel.',
        calculation: 'Number of conversions / Total visitors or leads × 100.',
        benchmarks: 'E-commerce: 2-3%, SaaS: 1-3%, Lead gen: 5-15%.',
        impact: 'Higher conversion rates indicate better product-market fit and sales efficiency.'
      }
    },
    {
      name: 'averageOrderValue',
      label: 'Average Order Value (AOV)',
      type: 'number' as const,
      placeholder: '180',
      methodology: {
        purpose: 'AOV measures the average spending per transaction, indicating customer value.',
        calculation: 'Total revenue divided by total number of orders.',
        benchmarks: 'Varies widely by industry. Focus on consistent growth over time.',
        impact: 'Increasing AOV demonstrates pricing power and customer willingness to spend.'
      }
    },
    {
      name: 'repeatCustomerRate',
      label: 'Repeat Customer Rate (%)',
      type: 'number' as const,
      placeholder: '35',
      step: 0.1,
      max: 100,
      methodology: {
        purpose: 'Repeat customer rate indicates customer satisfaction and loyalty.',
        calculation: 'Number of customers with multiple purchases / Total customers × 100.',
        benchmarks: 'E-commerce: 20-30%, Services: 40-60%, SaaS: 80%+.',
        impact: 'Higher repeat rates indicate strong value proposition and customer retention.'
      }
    }
  ], [])

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <CardHeader className="border-b border-green-200 bg-green-600 text-white rounded-t-lg">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-green-600 font-bold text-sm">2</span>
          </div>
          Customer Analytics & Risk Assessment
        </CardTitle>
        <CardDescription className="text-green-100">
          Advanced customer metrics to evaluate acquisition efficiency, retention, and lifetime value
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {customerFields.map((field) => (
            <ProfessionalField
              key={field.name}
              name={field.name}
              label={field.label}
              type={field.type}
              value={data[field.name as keyof typeof data]}
              onChange={(value) => handleFieldChange(field.name as keyof ProfessionalTierData['customerAnalytics'], value)}
              methodology={field.methodology}
              placeholder={field.placeholder}
              required={field.required}
              error={errors[field.name]}
              step={field.step}
              min={field.min}
              max={field.max}
            />
          ))}
        </div>
        
        {/* Key Ratios Analysis */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-100 rounded-lg border border-green-300">
            <h4 className="font-medium text-green-900 mb-1">LTV:CAC Ratio</h4>
            <p className="text-2xl font-bold text-green-700">
              {calculatedMetrics.ltvCacRatio > 0
                ? `${calculatedMetrics.ltvCacRatio.toFixed(1)}:1`
                : '-'
              }
            </p>
            <p className="text-xs text-green-600 mt-1">
              Target: 3:1 or higher
            </p>
          </div>
          
          <div className="p-4 bg-green-100 rounded-lg border border-green-300">
            <h4 className="font-medium text-green-900 mb-1">Payback Period</h4>
            <p className="text-2xl font-bold text-green-700">
              {calculatedMetrics.paybackPeriod > 0
                ? `${Math.round(calculatedMetrics.paybackPeriod)} months`
                : '-'
              }
            </p>
            <p className="text-xs text-green-600 mt-1">
              Target: &lt;12 months
            </p>
          </div>
          
          <div className="p-4 bg-green-100 rounded-lg border border-green-300">
            <h4 className="font-medium text-green-900 mb-1">Customer Health</h4>
            <p className="text-2xl font-bold text-green-700">
              {data.netPromoterScore && data.churnRate
                ? data.netPromoterScore > 50 && data.churnRate < 5 ? 'Excellent' :
                  data.netPromoterScore > 30 && data.churnRate < 10 ? 'Good' : 'Needs Attention'
                : '-'
              }
            </p>
            <p className="text-xs text-green-600 mt-1">
              Based on NPS & Churn
            </p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-green-100 rounded-lg border border-green-300">
          <h4 className="font-medium text-green-900 mb-2">Customer Risk Analysis</h4>
          <p className="text-sm text-green-800">
            These metrics reveal customer acquisition efficiency, retention strength, and lifetime value optimization. 
            Strong customer analytics indicate predictable revenue growth and reduced business risk, 
            significantly impacting valuation multiples.
          </p>
        </div>
      </CardContent>
    </Card>
  )
})

CustomerRiskSection.displayName = 'CustomerRiskSection'

export default CustomerRiskSection