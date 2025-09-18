"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ProfessionalField from './professional-field'
import { ProfessionalTierData } from '@/types/evaluation'

interface CompetitiveMarketSectionProps {
  data: ProfessionalTierData['marketIntelligence']
  onChange: (data: Partial<ProfessionalTierData['marketIntelligence']>) => void
  errors?: Record<string, string>
}

export function CompetitiveMarketSection({ data, onChange, errors = {} }: CompetitiveMarketSectionProps) {
  const handleFieldChange = (field: keyof ProfessionalTierData['marketIntelligence'], value: any) => {
    onChange({ [field]: value })
  }

  const marketFields = [
    {
      name: 'marketShare',
      label: 'Market Share (%)',
      type: 'number' as const,
      placeholder: '8.5',
      step: 0.1,
      max: 100,
      required: true,
      methodology: {
        purpose: 'Market share indicates competitive position and market dominance within your sector.',
        calculation: 'Your revenue / Total addressable market revenue × 100.',
        benchmarks: 'Market leaders: >20%, Strong players: 5-20%, Niche players: <5%.',
        impact: 'Higher market share typically commands premium valuations due to competitive moats.'
      }
    },
    {
      name: 'marketGrowthRate',
      label: 'Market Growth Rate (% annually)',
      type: 'number' as const,
      placeholder: '12.5',
      step: 0.1,
      methodology: {
        purpose: 'Market growth rate determines the total addressable market expansion potential.',
        calculation: 'Year-over-year growth rate of total market size.',
        benchmarks: 'High growth: >10%, Moderate: 3-10%, Mature: <3%.',
        impact: 'Businesses in growing markets receive higher valuation multiples.'
      }
    },
    {
      name: 'threatLevel',
      label: 'Competitive Threat Level',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'low', label: 'Low - Strong competitive moats' },
        { value: 'medium', label: 'Medium - Some competitive pressure' },
        { value: 'high', label: 'High - Intense competition' }
      ],
      methodology: {
        purpose: 'Threat level assesses competitive intensity and potential market disruption risks.',
        calculation: 'Qualitative assessment based on competitor actions, barriers to entry, and market dynamics.',
        benchmarks: 'Low threat preferred for stable valuations and predictable growth.',
        impact: 'Lower threat levels reduce risk premiums and increase valuation multiples.'
      }
    },
    {
      name: 'opportunityScore',
      label: 'Market Opportunity Score (1-100)',
      type: 'number' as const,
      placeholder: '75',
      min: 1,
      max: 100,
      methodology: {
        purpose: 'Opportunity score quantifies untapped market potential and growth opportunities.',
        calculation: 'Weighted score considering market size, growth rate, competitive gaps, and barriers.',
        benchmarks: 'Exceptional: 80+, Good: 60-79, Average: 40-59, Poor: <40.',
        impact: 'Higher opportunity scores indicate greater growth potential and future value creation.'
      }
    }
  ]

  const competitorAnalysisFields = [
    {
      name: 'competitorCount',
      label: 'Number of Direct Competitors',
      type: 'number' as const,
      placeholder: '8',
      methodology: {
        purpose: 'Number of direct competitors indicates market fragmentation and competitive intensity.',
        calculation: 'Count of businesses offering similar products/services to same target market.',
        benchmarks: 'Fewer competitors often indicate niche markets or high barriers to entry.',
        impact: 'Markets with fewer direct competitors may command premium valuations.'
      }
    },
    {
      name: 'marketTrendsCount',
      label: 'Number of Favorable Market Trends',
      type: 'number' as const,
      placeholder: '5',
      methodology: {
        purpose: 'Favorable market trends indicate tailwinds that support business growth.',
        calculation: 'Count of positive trends like digitization, regulation changes, consumer behavior shifts.',
        benchmarks: 'More favorable trends indicate better positioning for future growth.',
        impact: 'Businesses aligned with market trends receive higher growth valuations.'
      }
    }
  ]

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
      <CardHeader className="border-b border-purple-200 bg-purple-600 text-white rounded-t-lg">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-purple-600 font-bold text-sm">3</span>
          </div>
          Competitive & Market Intelligence
        </CardTitle>
        <CardDescription className="text-purple-100">
          Strategic market positioning analysis with competitive landscape assessment
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Core Market Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {marketFields.map((field) => (
            <ProfessionalField
              key={field.name}
              name={field.name}
              label={field.label}
              type={field.type}
              value={data[field.name as keyof typeof data]}
              onChange={(value) => handleFieldChange(field.name as keyof ProfessionalTierData['marketIntelligence'], value)}
              methodology={field.methodology}
              placeholder={field.placeholder}
              required={field.required}
              error={errors[field.name]}
              step={field.step}
              min={field.min}
              max={field.max}
              options={field.options}
            />
          ))}
        </div>

        {/* Competitive Analysis */}
        <div className="border-t border-purple-200 pt-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-4">Competitive Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {competitorAnalysisFields.map((field) => (
              <ProfessionalField
                key={field.name}
                name={field.name}
                label={field.label}
                type={field.type}
                value={data[field.name as keyof typeof data] || 0}
                onChange={(value) => handleFieldChange(field.name as keyof ProfessionalTierData['marketIntelligence'], value)}
                methodology={field.methodology}
                placeholder={field.placeholder}
                error={errors[field.name]}
              />
            ))}
          </div>
        </div>

        {/* Market Intelligence Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-purple-100 rounded-lg border border-purple-300">
            <h4 className="font-medium text-purple-900 mb-1">Market Position</h4>
            <p className="text-2xl font-bold text-purple-700">
              {data.marketShare
                ? data.marketShare > 20 ? 'Leader' :
                  data.marketShare > 5 ? 'Strong' : 'Niche'
                : '-'
              }
            </p>
            <p className="text-xs text-purple-600 mt-1">
              Based on market share
            </p>
          </div>
          
          <div className="p-4 bg-purple-100 rounded-lg border border-purple-300">
            <h4 className="font-medium text-purple-900 mb-1">Growth Potential</h4>
            <p className="text-2xl font-bold text-purple-700">
              {data.marketGrowthRate && data.opportunityScore
                ? data.marketGrowthRate > 10 && data.opportunityScore > 70 ? 'High' :
                  data.marketGrowthRate > 5 && data.opportunityScore > 50 ? 'Medium' : 'Low'
                : '-'
              }
            </p>
            <p className="text-xs text-purple-600 mt-1">
              Market growth × Opportunity
            </p>
          </div>
          
          <div className="p-4 bg-purple-100 rounded-lg border border-purple-300">
            <h4 className="font-medium text-purple-900 mb-1">Risk Level</h4>
            <p className="text-2xl font-bold text-purple-700 capitalize">
              {data.threatLevel || '-'}
            </p>
            <p className="text-xs text-purple-600 mt-1">
              Competitive threat assessment
            </p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-purple-100 rounded-lg border border-purple-300">
          <h4 className="font-medium text-purple-900 mb-2">Strategic Market Analysis</h4>
          <p className="text-sm text-purple-800">
            Market intelligence data enables strategic positioning assessment and competitive advantage evaluation. 
            Businesses with strong market positions, growing addressable markets, and defensible competitive moats 
            typically receive premium valuations from buyers and investors.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default CompetitiveMarketSection