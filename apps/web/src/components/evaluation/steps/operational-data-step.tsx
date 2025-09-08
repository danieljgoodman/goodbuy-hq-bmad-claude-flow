'use client'

import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useEvaluationStore } from '@/stores/evaluation-store'

const operationalDataSchema = z.object({
  customerCount: z.number().min(0, 'Customer count must be 0 or greater'),
  employeeCount: z.number().min(0, 'Employee count must be 0 or greater'),
  marketPosition: z.string().min(1, 'Please select your market position'),
  competitiveAdvantages: z.array(z.string()).min(1, 'Please select at least one competitive advantage'),
  primaryChannels: z.array(z.string()).min(1, 'Please select at least one sales channel'),
  assets: z.number().min(0, 'Total assets must be 0 or greater'),
  liabilities: z.number().min(0, 'Total liabilities must be 0 or greater'),
})

type OperationalData = z.infer<typeof operationalDataSchema>

const marketPositions = [
  'Market Leader',
  'Strong Competitor', 
  'Growing Player',
  'Niche Specialist',
  'New Entrant',
  'Struggling to Compete'
]

const competitiveAdvantages = [
  'Proprietary Technology',
  'Strong Brand Recognition',
  'Cost Leadership',
  'Superior Customer Service',
  'Exclusive Partnerships',
  'Network Effects',
  'Regulatory Advantages',
  'Skilled Team/Expertise',
  'Location/Distribution',
  'First-Mover Advantage'
]

const salesChannels = [
  'Direct Sales Team',
  'Online/E-commerce',
  'Retail Partners',
  'Distributors',
  'Referrals/Word of Mouth',
  'Digital Marketing',
  'Trade Shows/Events',
  'Social Media',
  'Content Marketing',
  'Other'
]

export default function OperationalDataStep() {
  const { currentEvaluation, updateBusinessData } = useEvaluationStore()
  
  const [formData, setFormData] = useState<OperationalData>({
    customerCount: 0,
    employeeCount: 0,
    marketPosition: '',
    competitiveAdvantages: [],
    primaryChannels: [],
    assets: 0,
    liabilities: 0,
  })
  
  const [errors, setErrors] = useState<Partial<Record<keyof OperationalData, string>>>({})

  // Load existing data if available
  useEffect(() => {
    if (currentEvaluation?.businessData) {
      const data = currentEvaluation.businessData as any
      setFormData(prevData => {
        const newData = {
          customerCount: data.customerCount || 0,
          employeeCount: data.employeeCount || 0,
          marketPosition: data.marketPosition || '',
          competitiveAdvantages: data.competitiveAdvantages || [],
          primaryChannels: data.primaryChannels || [],
          assets: data.assets || 0,
          liabilities: data.liabilities || 0,
        }
        
        // Only update if data has changed to prevent infinite loops
        if (JSON.stringify(prevData) === JSON.stringify(newData)) {
          return prevData
        }
        
        return newData
      })
    }
  }, [currentEvaluation?.businessData])

  const handleInputChange = (field: keyof OperationalData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
    
    // Auto-save to store
    updateBusinessData({ [field]: value })
  }

  const formatInputValue = (value: number): string => {
    // Show empty string for 0 to improve UX - user can type without seeing leading 0
    if (value === 0) return ''
    // Format with commas for readability
    return value.toLocaleString('en-US')
  }

  const formatCurrencyInputValue = (value: number): string => {
    // Special formatting for currency fields (assets, liabilities)
    if (value === 0) return ''
    return value.toLocaleString('en-US')
  }

  const handleCurrencyInputChange = (field: keyof OperationalData, inputValue: string) => {
    if (field === 'customerCount' || field === 'employeeCount') {
      // For counts, only allow integers (no decimals)
      const cleanValue = inputValue.replace(/[^0-9]/g, '')
      const numericValue = cleanValue === '' ? 0 : parseInt(cleanValue) || 0
      handleInputChange(field, numericValue)
    } else {
      // For currency fields, allow decimals
      const cleanValue = inputValue.replace(/[^0-9.]/g, '')
      const numericValue = cleanValue === '' ? 0 : parseFloat(cleanValue) || 0
      handleInputChange(field, numericValue)
    }
  }

  const handleArrayToggle = (field: 'competitiveAdvantages' | 'primaryChannels', value: string) => {
    const currentArray = formData[field]
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]
    
    handleInputChange(field, newArray)
  }

  const validateStep = () => {
    const result = operationalDataSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof OperationalData, string>> = {}
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          const fieldName = err.path[0] as keyof OperationalData
          fieldErrors[fieldName] = err.message
        }
      })
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }

  // Validate on form data changes
  useEffect(() => {
    validateStep()
  }, [formData])

  // Calculate derived metrics
  const netWorth = formData.assets - formData.liabilities
  const debtToAssetRatio = formData.assets > 0 ? (formData.liabilities / formData.assets) * 100 : 0

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Operational Data</h3>
        <p className="text-muted-foreground mb-6">
          Help us understand your business operations, competitive position, and assets.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="customerCount" className="block text-sm font-medium mb-2">
            Total Customers <span className="text-destructive">*</span>
          </label>
          <input
            id="customerCount"
            type="text"
            value={formatInputValue(formData.customerCount)}
            onChange={(e) => handleCurrencyInputChange('customerCount', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="0"
          />
          {errors.customerCount && (
            <p className="text-destructive text-sm mt-1">{errors.customerCount}</p>
          )}
        </div>

        <div>
          <label htmlFor="employeeCount" className="block text-sm font-medium mb-2">
            Total Employees <span className="text-destructive">*</span>
          </label>
          <input
            id="employeeCount"
            type="text"
            value={formatInputValue(formData.employeeCount)}
            onChange={(e) => handleCurrencyInputChange('employeeCount', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="0"
          />
          {errors.employeeCount && (
            <p className="text-destructive text-sm mt-1">{errors.employeeCount}</p>
          )}
        </div>

        <div>
          <label htmlFor="assets" className="block text-sm font-medium mb-2">
            Total Assets <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
            <input
              id="assets"
              type="text"
              value={formatCurrencyInputValue(formData.assets)}
              onChange={(e) => handleCurrencyInputChange('assets', e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="0"
            />
          </div>
          {errors.assets && (
            <p className="text-destructive text-sm mt-1">{errors.assets}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Cash, equipment, inventory, property, etc.
          </p>
        </div>

        <div>
          <label htmlFor="liabilities" className="block text-sm font-medium mb-2">
            Total Liabilities <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
            <input
              id="liabilities"
              type="text"
              value={formatCurrencyInputValue(formData.liabilities)}
              onChange={(e) => handleCurrencyInputChange('liabilities', e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="0"
            />
          </div>
          {errors.liabilities && (
            <p className="text-destructive text-sm mt-1">{errors.liabilities}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Loans, credit, accounts payable, etc.
          </p>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="marketPosition" className="block text-sm font-medium mb-2">
            Market Position <span className="text-destructive">*</span>
          </label>
          <select
            id="marketPosition"
            value={formData.marketPosition}
            onChange={(e) => handleInputChange('marketPosition', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select your market position</option>
            {marketPositions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
          {errors.marketPosition && (
            <p className="text-destructive text-sm mt-1">{errors.marketPosition}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-3">
          Competitive Advantages <span className="text-destructive">*</span>
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          {competitiveAdvantages.map((advantage) => (
            <label key={advantage} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.competitiveAdvantages.includes(advantage)}
                onChange={() => handleArrayToggle('competitiveAdvantages', advantage)}
                className="rounded border-input"
              />
              <span className="text-sm">{advantage}</span>
            </label>
          ))}
        </div>
        {errors.competitiveAdvantages && (
          <p className="text-destructive text-sm mt-2">{errors.competitiveAdvantages}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-3">
          Primary Sales Channels <span className="text-destructive">*</span>
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          {salesChannels.map((channel) => (
            <label key={channel} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.primaryChannels.includes(channel)}
                onChange={() => handleArrayToggle('primaryChannels', channel)}
                className="rounded border-input"
              />
              <span className="text-sm">{channel}</span>
            </label>
          ))}
        </div>
        {errors.primaryChannels && (
          <p className="text-destructive text-sm mt-2">{errors.primaryChannels}</p>
        )}
      </div>

      {/* Calculated Metrics */}
      {(formData.assets > 0 || formData.liabilities > 0) && (
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-3">Financial Position</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Net Worth</p>
              <p className={`text-lg font-semibold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${netWorth.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Debt-to-Asset Ratio</p>
              <p className={`text-lg font-semibold ${debtToAssetRatio < 50 ? 'text-green-600' : debtToAssetRatio < 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                {debtToAssetRatio.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}