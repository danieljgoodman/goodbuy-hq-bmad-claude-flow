"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ProfessionalField from './professional-field'
import { ProfessionalTierData } from '@/types/evaluation'

interface OperationalStrategicSectionProps {
  data: ProfessionalTierData['operationalEfficiency']
  onChange: (data: Partial<ProfessionalTierData['operationalEfficiency']>) => void
  errors?: Record<string, string>
}

export function OperationalStrategicSection({ data, onChange, errors = {} }: OperationalStrategicSectionProps) {
  const handleFieldChange = (field: keyof ProfessionalTierData['operationalEfficiency'], value: any) => {
    onChange({ [field]: value })
  }

  const operationalFields = [
    {
      name: 'employeeProductivity',
      label: 'Revenue per Employee ($)',
      type: 'number' as const,
      placeholder: '125000',
      required: true,
      methodology: {
        purpose: 'Revenue per employee measures workforce efficiency and productivity levels.',
        calculation: 'Annual revenue divided by total number of employees.',
        benchmarks: 'Tech: $200K+, Manufacturing: $100K+, Services: $75K+.',
        impact: 'Higher productivity indicates operational efficiency and scalability potential.'
      }
    },
    {
      name: 'operatingExpenseRatio',
      label: 'Operating Expense Ratio (%)',
      type: 'number' as const,
      placeholder: '65',
      step: 0.1,
      max: 100,
      methodology: {
        purpose: 'Operating expense ratio measures cost efficiency and operational leverage.',
        calculation: 'Operating expenses divided by total revenue × 100.',
        benchmarks: 'Efficient operations: <70%, Good: 70-80%, Needs improvement: >80%.',
        impact: 'Lower ratios indicate better cost control and higher profitability potential.'
      }
    },
    {
      name: 'capacityUtilization',
      label: 'Capacity Utilization (%)',
      type: 'number' as const,
      placeholder: '82',
      step: 0.1,
      max: 100,
      methodology: {
        purpose: 'Capacity utilization measures how efficiently available resources are being used.',
        calculation: 'Actual output divided by maximum possible output × 100.',
        benchmarks: 'Optimal: 80-90%, Over-utilized: >90%, Under-utilized: <70%.',
        impact: 'Optimal utilization indicates efficient resource management and growth readiness.'
      }
    },
    {
      name: 'inventoryDaysOnHand',
      label: 'Inventory Days on Hand',
      type: 'number' as const,
      placeholder: '45',
      methodology: {
        purpose: 'Inventory days measures how efficiently inventory investments are managed.',
        calculation: 'Average inventory value / (COGS / 365 days).',
        benchmarks: 'Varies by industry: Retail 30-60 days, Manufacturing 60-90 days.',
        impact: 'Lower days indicate better cash flow management and inventory efficiency.'
      }
    },
    {
      name: 'paymentTermsDays',
      label: 'Average Payment Terms (Days)',
      type: 'number' as const,
      placeholder: '30',
      methodology: {
        purpose: 'Payment terms indicate customer relationship strength and cash flow management.',
        calculation: 'Weighted average of customer payment terms.',
        benchmarks: 'Net 30 is standard, shorter terms indicate strong negotiating position.',
        impact: 'Shorter payment terms improve cash flow and reduce collection risk.'
      }
    },
    {
      name: 'vendorPaymentDays',
      label: 'Vendor Payment Days',
      type: 'number' as const,
      placeholder: '45',
      methodology: {
        purpose: 'Vendor payment days indicate supplier relationship strength and cash management.',
        calculation: 'Average days taken to pay vendor invoices.',
        benchmarks: '30-60 days typical, longer terms indicate good supplier relationships.',
        impact: 'Optimal payment timing improves cash flow while maintaining supplier relationships.'
      }
    },
    {
      name: 'cashConversionCycle',
      label: 'Cash Conversion Cycle (Days)',
      type: 'number' as const,
      placeholder: '35',
      methodology: {
        purpose: 'Cash conversion cycle measures how quickly the business converts investments into cash.',
        calculation: 'Days Sales Outstanding + Days Inventory Outstanding - Days Payable Outstanding.',
        benchmarks: 'Shorter cycles are better. Target: less than 30 days for most businesses.',
        impact: 'Shorter cycles indicate superior working capital management and cash efficiency.'
      }
    }
  ]

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
      <CardHeader className="border-b border-orange-200 bg-orange-600 text-white rounded-t-lg">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-orange-600 font-bold text-sm">4</span>
          </div>
          Operational Efficiency & Strategic Metrics
        </CardTitle>
        <CardDescription className="text-orange-100">
          Comprehensive operational analysis measuring efficiency, productivity, and strategic positioning
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {operationalFields.map((field) => (
            <ProfessionalField
              key={field.name}
              name={field.name}
              label={field.label}
              type={field.type}
              value={data[field.name as keyof typeof data]}
              onChange={(value) => handleFieldChange(field.name as keyof ProfessionalTierData['operationalEfficiency'], value)}
              methodology={field.methodology}
              placeholder={field.placeholder}
              required={field.required}
              error={errors[field.name]}
              step={field.step}
              max={field.max}
            />
          ))}
        </div>
        
        {/* Operational Excellence Dashboard */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-orange-100 rounded-lg border border-orange-300">
            <h4 className="font-medium text-orange-900 mb-1">Productivity</h4>
            <p className="text-xl font-bold text-orange-700">
              {data.employeeProductivity
                ? data.employeeProductivity > 150000 ? 'High' :
                  data.employeeProductivity > 100000 ? 'Good' : 'Average'
                : '-'
              }
            </p>
            <p className="text-xs text-orange-600 mt-1">
              Revenue per employee
            </p>
          </div>
          
          <div className="p-4 bg-orange-100 rounded-lg border border-orange-300">
            <h4 className="font-medium text-orange-900 mb-1">Cost Efficiency</h4>
            <p className="text-xl font-bold text-orange-700">
              {data.operatingExpenseRatio
                ? data.operatingExpenseRatio < 70 ? 'Excellent' :
                  data.operatingExpenseRatio < 80 ? 'Good' : 'Needs Work'
                : '-'
              }
            </p>
            <p className="text-xs text-orange-600 mt-1">
              Operating expense ratio
            </p>
          </div>
          
          <div className="p-4 bg-orange-100 rounded-lg border border-orange-300">
            <h4 className="font-medium text-orange-900 mb-1">Capacity</h4>
            <p className="text-xl font-bold text-orange-700">
              {data.capacityUtilization
                ? data.capacityUtilization >= 80 && data.capacityUtilization <= 90 ? 'Optimal' :
                  data.capacityUtilization > 90 ? 'Over-utilized' : 'Under-utilized'
                : '-'
              }
            </p>
            <p className="text-xs text-orange-600 mt-1">
              {data.capacityUtilization ? `${data.capacityUtilization}%` : 'Utilization rate'}
            </p>
          </div>
          
          <div className="p-4 bg-orange-100 rounded-lg border border-orange-300">
            <h4 className="font-medium text-orange-900 mb-1">Cash Cycle</h4>
            <p className="text-xl font-bold text-orange-700">
              {data.cashConversionCycle
                ? data.cashConversionCycle < 30 ? 'Excellent' :
                  data.cashConversionCycle < 60 ? 'Good' : 'Needs Work'
                : '-'
              }
            </p>
            <p className="text-xs text-orange-600 mt-1">
              {data.cashConversionCycle ? `${data.cashConversionCycle} days` : 'Conversion cycle'}
            </p>
          </div>
        </div>
        
        {/* Working Capital Analysis */}
        <div className="mt-6 p-4 bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg border border-orange-300">
          <h4 className="font-medium text-orange-900 mb-3">Working Capital Efficiency</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-orange-700">Collection Period</p>
              <p className="text-lg font-semibold text-orange-800">
                {data.paymentTermsDays ? `${data.paymentTermsDays} days` : '-'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-orange-700">Inventory Period</p>
              <p className="text-lg font-semibold text-orange-800">
                {data.inventoryDaysOnHand ? `${data.inventoryDaysOnHand} days` : '-'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-orange-700">Payment Period</p>
              <p className="text-lg font-semibold text-orange-800">
                {data.vendorPaymentDays ? `${data.vendorPaymentDays} days` : '-'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-orange-100 rounded-lg border border-orange-300">
          <h4 className="font-medium text-orange-900 mb-2">Operational Excellence Impact</h4>
          <p className="text-sm text-orange-800">
            These operational metrics reveal the efficiency and scalability of your business operations. 
            Companies with superior operational efficiency, optimal capacity utilization, and strong working capital management 
            command premium valuations due to their ability to generate consistent returns and scale effectively.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default OperationalStrategicSection