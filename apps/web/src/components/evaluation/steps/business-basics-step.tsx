'use client'

import { useEffect, useState, useRef } from 'react'
import { z } from 'zod'
import { useEvaluationStore } from '@/stores/evaluation-store'
import { useAuthStore } from '@/stores/auth-store'

const businessBasicsSchema = z.object({
  businessType: z.string().min(1, 'Please select a business type'),
  industryFocus: z.string().min(1, 'Please specify your industry focus'),
  yearsInBusiness: z.number().min(0, 'Years in business must be 0 or greater'),
  businessModel: z.string().min(1, 'Please select a business model'),
  revenueModel: z.string().min(1, 'Please select a revenue model'),
})

type BusinessBasics = z.infer<typeof businessBasicsSchema>

const businessTypes = [
  'Sole Proprietorship',
  'Partnership', 
  'LLC',
  'Corporation (C-Corp)',
  'S-Corporation',
  'Other'
]

const businessModels = [
  'B2B (Business to Business)',
  'B2C (Business to Consumer)', 
  'B2B2C (Business to Business to Consumer)',
  'Marketplace',
  'Subscription/SaaS',
  'E-commerce',
  'Service Provider',
  'Manufacturing',
  'Other'
]

const revenueModels = [
  'One-time Sales',
  'Recurring Subscription',
  'Freemium',
  'Commission/Fees',
  'Advertising',
  'Licensing',
  'Mixed Revenue Streams',
  'Other'
]

export default function BusinessBasicsStep() {
  const { user } = useAuthStore()
  const { currentEvaluation, updateBusinessData, loadEvaluations } = useEvaluationStore()
  const hasLoadedData = useRef(false)
  
  const [formData, setFormData] = useState<BusinessBasics>({
    businessType: '',
    industryFocus: user?.industry || '',
    yearsInBusiness: 0,
    businessModel: '',
    revenueModel: '',
  })
  
  const [errors, setErrors] = useState<Partial<Record<keyof BusinessBasics, string>>>({})

  // Load evaluations on mount
  useEffect(() => {
    loadEvaluations()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load existing data once when it becomes available
  useEffect(() => {
    if (currentEvaluation?.businessData && !hasLoadedData.current) {
      const data = currentEvaluation.businessData as any
      setFormData({
        businessType: data.businessType || '',
        industryFocus: data.industryFocus || user?.industry || '',
        yearsInBusiness: data.yearsInBusiness || 0,
        businessModel: data.businessModel || '',
        revenueModel: data.revenueModel || '',
      })
      hasLoadedData.current = true
    }
  }, [currentEvaluation?.businessData, user?.industry])

  const handleInputChange = (field: keyof BusinessBasics, value: string | number) => {
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
    return value === 0 ? '' : value.toString()
  }

  const validateStep = () => {
    const result = businessBasicsSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof BusinessBasics, string>> = {}
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          const fieldName = err.path[0] as keyof BusinessBasics
          fieldErrors[fieldName] = err.message
        }
      })
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }

  // Validate on form data changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateStep()
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [formData])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Business Basics</h3>
        <p className="text-muted-foreground mb-6">
          Let&apos;s start with some basic information about your business structure and model.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="businessType" className="block text-sm font-medium mb-2">
            Business Type <span className="text-destructive">*</span>
          </label>
          <select
            id="businessType"
            value={formData.businessType}
            onChange={(e) => handleInputChange('businessType', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select business type</option>
            {businessTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.businessType && (
            <p className="text-destructive text-sm mt-1">{errors.businessType}</p>
          )}
        </div>

        <div>
          <label htmlFor="industryFocus" className="block text-sm font-medium mb-2">
            Industry Focus <span className="text-destructive">*</span>
          </label>
          <input
            id="industryFocus"
            type="text"
            value={formData.industryFocus}
            onChange={(e) => handleInputChange('industryFocus', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g., Healthcare, Technology, Retail"
          />
          {errors.industryFocus && (
            <p className="text-destructive text-sm mt-1">{errors.industryFocus}</p>
          )}
        </div>

        <div>
          <label htmlFor="yearsInBusiness" className="block text-sm font-medium mb-2">
            Years in Business <span className="text-destructive">*</span>
          </label>
          <input
            id="yearsInBusiness"
            type="number"
            min="0"
            step="0.5"
            value={formatInputValue(formData.yearsInBusiness)}
            onChange={(e) => handleInputChange('yearsInBusiness', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="0"
          />
          {errors.yearsInBusiness && (
            <p className="text-destructive text-sm mt-1">{errors.yearsInBusiness}</p>
          )}
        </div>

        <div>
          <label htmlFor="businessModel" className="block text-sm font-medium mb-2">
            Business Model <span className="text-destructive">*</span>
          </label>
          <select
            id="businessModel"
            value={formData.businessModel}
            onChange={(e) => handleInputChange('businessModel', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select business model</option>
            {businessModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          {errors.businessModel && (
            <p className="text-destructive text-sm mt-1">{errors.businessModel}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="revenueModel" className="block text-sm font-medium mb-2">
            Revenue Model <span className="text-destructive">*</span>
          </label>
          <select
            id="revenueModel"
            value={formData.revenueModel}
            onChange={(e) => handleInputChange('revenueModel', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select revenue model</option>
            {revenueModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          {errors.revenueModel && (
            <p className="text-destructive text-sm mt-1">{errors.revenueModel}</p>
          )}
        </div>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <div className="flex items-start space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
          <div className="text-sm">
            <p className="font-medium mb-1">Why we need this information:</p>
            <p className="text-muted-foreground">
              Understanding your business structure and model helps our AI provide more accurate 
              valuations and recommendations specific to your industry and business type.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}