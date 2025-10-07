'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuthStore } from '@/stores/auth-store'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Step 1: Essential Information
const step1Schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  businessName: z.string().min(1, 'Business name is required'),
  industry: z.string().min(1, 'Please select an industry'),
  role: z.enum(['owner', 'manager', 'advisor']),
})

// Step 2: Business Details
const step2Schema = z.object({
  businessAddress: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'Zip code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  businessPhone: z.string().min(1, 'Business phone is required'),
  yearsInOperation: z.number().min(0, 'Years must be 0 or greater'),
  employeeCountRange: z.string().min(1, 'Please select employee count'),
})

// Step 3: Financial Overview
const step3Schema = z.object({
  revenueRange: z.string().min(1, 'Please select revenue range'),
  businessModel: z.string().min(1, 'Please select business model'),
})

// Step 4: Optional Information
const step4Schema = z.object({
  websiteUrl: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  referralSource: z.string().optional(),
})

type Step1Form = z.infer<typeof step1Schema>
type Step2Form = z.infer<typeof step2Schema>
type Step3Form = z.infer<typeof step3Schema>
type Step4Form = z.infer<typeof step4Schema>

interface FormData {
  step1: Step1Form
  step2: Step2Form  
  step3: Step3Form
  step4: Step4Form
}

const industries = [
  'Technology',
  'Healthcare', 
  'Finance',
  'Manufacturing',
  'Retail',
  'Real Estate',
  'Food & Beverage',
  'Education',
  'Transportation',
  'Construction',
  'Other'
]

const employeeRanges = [
  '1-5 employees',
  '6-10 employees', 
  '11-25 employees',
  '26-50 employees',
  '51-100 employees',
  '101-250 employees',
  '250+ employees'
]

const revenueRanges = [
  'Under $100K',
  '$100K - $500K',
  '$500K - $1M',
  '$1M - $5M', 
  '$5M - $10M',
  '$10M - $50M',
  '$50M+'
]

const businessModels = [
  'SaaS/Subscription',
  'E-commerce',
  'Marketplace',
  'Service-based',
  'Product-based',
  'Consulting',
  'Freemium',
  'Advertising',
  'Other'
]

const referralSources = [
  'Google Search',
  'Social Media',
  'Referral from friend/colleague',
  'Industry publication',
  'Conference/Event',
  'Partner referral',
  'Other'
]

export default function ProgressiveRegisterForm() {
  const router = useRouter()
  const { signUp } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    step1: {
      email: '',
      password: '',
      businessName: '',
      industry: '',
      role: 'owner',
    },
    step2: {
      businessAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States',
      },
      businessPhone: '',
      yearsInOperation: 0,
      employeeCountRange: '',
    },
    step3: {
      revenueRange: '',
      businessModel: '',
    },
    step4: {
      websiteUrl: '',
      linkedinUrl: '',
      referralSource: '',
    }
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Auto-save to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('registration-progress')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setFormData(data.formData || formData)
        setCurrentStep(data.currentStep || 1)
      } catch (error) {
        console.error('Error loading saved registration:', error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('registration-progress', JSON.stringify({
      formData,
      currentStep
    }))
  }, [formData, currentStep])

  const validateStep = (step: number): boolean => {
    setErrors({})
    
    try {
      switch (step) {
        case 1:
          step1Schema.parse(formData.step1)
          break
        case 2:
          step2Schema.parse(formData.step2)
          break
        case 3:
          step3Schema.parse(formData.step3)
          break
        case 4:
          step4Schema.parse(formData.step4)
          break
        default:
          return false
      }
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          const path = err.path.join('.')
          fieldErrors[path] = err.message
        })
        setErrors(fieldErrors)
      }
      return false
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(4, prev + 1))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(1, prev - 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return
    
    setIsSubmitting(true)
    
    try {
      // Combine all form data
      const completeData = {
        ...formData.step1,
        businessAddress: formData.step2.businessAddress,
        businessPhone: formData.step2.businessPhone,
        yearsInOperation: formData.step2.yearsInOperation,
        employeeCountRange: formData.step2.employeeCountRange,
        revenueRange: formData.step3.revenueRange,
        businessModel: formData.step3.businessModel,
        websiteUrl: formData.step4.websiteUrl || null,
        linkedinUrl: formData.step4.linkedinUrl || null,
        referralSource: formData.step4.referralSource || null,
        registrationCompleted: true,
      }
      
      await signUp(completeData.email, completeData.password, completeData)
      
      // Clear saved progress
      localStorage.removeItem('registration-progress')
      
      router.push('/dashboard')
    } catch (error) {
      console.error('Registration error:', error)
      setErrors({ general: 'Registration failed. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateField = (step: keyof FormData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [step]: {
        ...prev[step],
        [field]: value
      }
    }))
    
    // Clear field error if it exists
    const fieldKey = `${step}.${field}`
    if (errors[fieldKey]) {
      setErrors(prev => ({ ...prev, [fieldKey]: undefined }))
    }
  }

  const updateNestedField = (step: keyof FormData, parentField: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [step]: {
        ...prev[step],
        [parentField]: {
          ...(prev[step] as any)[parentField],
          [field]: value
        }
      }
    }))
  }

  const progress = (currentStep / 4) * 100

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email Address *
        </label>
        <input
          id="email"
          type="email"
          value={formData.step1.email}
          onChange={(e) => updateField('step1', 'email', e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="you@company.com"
        />
        {errors['step1.email'] && (
          <p className="text-destructive text-sm mt-1">{errors['step1.email']}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password *
        </label>
        <input
          id="password"
          type="password"
          value={formData.step1.password}
          onChange={(e) => updateField('step1', 'password', e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="At least 8 characters"
        />
        {errors['step1.password'] && (
          <p className="text-destructive text-sm mt-1">{errors['step1.password']}</p>
        )}
      </div>

      <div>
        <label htmlFor="businessName" className="block text-sm font-medium mb-1">
          Business Name *
        </label>
        <input
          id="businessName"
          type="text"
          value={formData.step1.businessName}
          onChange={(e) => updateField('step1', 'businessName', e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Your Business Name"
        />
        {errors['step1.businessName'] && (
          <p className="text-destructive text-sm mt-1">{errors['step1.businessName']}</p>
        )}
      </div>

      <div>
        <label htmlFor="industry" className="block text-sm font-medium mb-1">
          Industry *
        </label>
        <select
          id="industry"
          value={formData.step1.industry}
          onChange={(e) => updateField('step1', 'industry', e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select an industry</option>
          {industries.map((industry) => (
            <option key={industry} value={industry}>
              {industry}
            </option>
          ))}
        </select>
        {errors['step1.industry'] && (
          <p className="text-destructive text-sm mt-1">{errors['step1.industry']}</p>
        )}
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium mb-1">
          Your Role *
        </label>
        <select
          id="role"
          value={formData.step1.role}
          onChange={(e) => updateField('step1', 'role', e.target.value as Step1Form['role'])}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="owner">Business Owner</option>
          <option value="manager">Manager</option>
          <option value="advisor">Advisor</option>
        </select>
        {errors['step1.role'] && (
          <p className="text-destructive text-sm mt-1">{errors['step1.role']}</p>
        )}
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Business Details</h3>
        <p className="text-muted-foreground text-sm">
          Help us understand your business better for more accurate valuations
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="street" className="block text-sm font-medium mb-1">
            Business Address *
          </label>
          <input
            id="street"
            type="text"
            value={formData.step2.businessAddress.street}
            onChange={(e) => updateNestedField('step2', 'businessAddress', 'street', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Street address"
          />
          {errors['step2.businessAddress.street'] && (
            <p className="text-destructive text-sm mt-1">{errors['step2.businessAddress.street']}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <input
              type="text"
              value={formData.step2.businessAddress.city}
              onChange={(e) => updateNestedField('step2', 'businessAddress', 'city', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="City"
            />
            {errors['step2.businessAddress.city'] && (
              <p className="text-destructive text-sm mt-1">{errors['step2.businessAddress.city']}</p>
            )}
          </div>
          <div>
            <input
              type="text"
              value={formData.step2.businessAddress.state}
              onChange={(e) => updateNestedField('step2', 'businessAddress', 'state', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="State"
            />
            {errors['step2.businessAddress.state'] && (
              <p className="text-destructive text-sm mt-1">{errors['step2.businessAddress.state']}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <input
              type="text"
              value={formData.step2.businessAddress.zipCode}
              onChange={(e) => updateNestedField('step2', 'businessAddress', 'zipCode', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Zip code"
            />
            {errors['step2.businessAddress.zipCode'] && (
              <p className="text-destructive text-sm mt-1">{errors['step2.businessAddress.zipCode']}</p>
            )}
          </div>
          <div>
            <select
              value={formData.step2.businessAddress.country}
              onChange={(e) => updateNestedField('step2', 'businessAddress', 'country', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="United States">United States</option>
              <option value="Canada">Canada</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="businessPhone" className="block text-sm font-medium mb-1">
            Business Phone *
          </label>
          <input
            id="businessPhone"
            type="tel"
            value={formData.step2.businessPhone}
            onChange={(e) => updateField('step2', 'businessPhone', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="(555) 123-4567"
          />
          {errors['step2.businessPhone'] && (
            <p className="text-destructive text-sm mt-1">{errors['step2.businessPhone']}</p>
          )}
        </div>

        <div>
          <label htmlFor="yearsInOperation" className="block text-sm font-medium mb-1">
            Years in Operation *
          </label>
          <input
            id="yearsInOperation"
            type="number"
            min="0"
            value={formData.step2.yearsInOperation}
            onChange={(e) => updateField('step2', 'yearsInOperation', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="5"
          />
          {errors['step2.yearsInOperation'] && (
            <p className="text-destructive text-sm mt-1">{errors['step2.yearsInOperation']}</p>
          )}
        </div>

        <div>
          <label htmlFor="employeeCountRange" className="block text-sm font-medium mb-1">
            Number of Employees *
          </label>
          <select
            id="employeeCountRange"
            value={formData.step2.employeeCountRange}
            onChange={(e) => updateField('step2', 'employeeCountRange', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select employee count</option>
            {employeeRanges.map((range) => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </select>
          {errors['step2.employeeCountRange'] && (
            <p className="text-destructive text-sm mt-1">{errors['step2.employeeCountRange']}</p>
          )}
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Financial Overview</h3>
        <p className="text-muted-foreground text-sm">
          This helps our AI provide more accurate business valuations
        </p>
      </div>

      <div>
        <label htmlFor="revenueRange" className="block text-sm font-medium mb-1">
          Annual Revenue Range *
        </label>
        <select
          id="revenueRange"
          value={formData.step3.revenueRange}
          onChange={(e) => updateField('step3', 'revenueRange', e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select revenue range</option>
          {revenueRanges.map((range) => (
            <option key={range} value={range}>
              {range}
            </option>
          ))}
        </select>
        {errors['step3.revenueRange'] && (
          <p className="text-destructive text-sm mt-1">{errors['step3.revenueRange']}</p>
        )}
      </div>

      <div>
        <label htmlFor="businessModel" className="block text-sm font-medium mb-1">
          Business Model *
        </label>
        <select
          id="businessModel"
          value={formData.step3.businessModel}
          onChange={(e) => updateField('step3', 'businessModel', e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select business model</option>
          {businessModels.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
        {errors['step3.businessModel'] && (
          <p className="text-destructive text-sm mt-1">{errors['step3.businessModel']}</p>
        )}
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Almost Done!</h3>
        <p className="text-muted-foreground text-sm">
          These optional fields help us provide even better recommendations
        </p>
      </div>

      <div>
        <label htmlFor="websiteUrl" className="block text-sm font-medium mb-1">
          Website URL (optional)
        </label>
        <input
          id="websiteUrl"
          type="url"
          value={formData.step4.websiteUrl}
          onChange={(e) => updateField('step4', 'websiteUrl', e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="https://yourwebsite.com"
        />
        {errors['step4.websiteUrl'] && (
          <p className="text-destructive text-sm mt-1">{errors['step4.websiteUrl']}</p>
        )}
      </div>

      <div>
        <label htmlFor="linkedinUrl" className="block text-sm font-medium mb-1">
          LinkedIn Profile (optional)
        </label>
        <input
          id="linkedinUrl"
          type="url"
          value={formData.step4.linkedinUrl}
          onChange={(e) => updateField('step4', 'linkedinUrl', e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="https://linkedin.com/in/yourname"
        />
        {errors['step4.linkedinUrl'] && (
          <p className="text-destructive text-sm mt-1">{errors['step4.linkedinUrl']}</p>
        )}
      </div>

      <div>
        <label htmlFor="referralSource" className="block text-sm font-medium mb-1">
          How did you hear about us? (optional)
        </label>
        <select
          id="referralSource"
          value={formData.step4.referralSource}
          onChange={(e) => updateField('step4', 'referralSource', e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select source</option>
          {referralSources.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>
      </div>

      {errors.general && (
        <p className="text-destructive text-sm text-center">{errors.general}</p>
      )}
    </div>
  )

  const stepTitles = [
    'Essential Information',
    'Business Details', 
    'Financial Overview',
    'Optional Information'
  ]

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Create Account</span>
          <span className="text-sm font-normal text-muted-foreground">
            Step {currentStep} of 4
          </span>
        </CardTitle>
        <CardDescription>
          {stepTitles[currentStep - 1]}
        </CardDescription>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            {currentStep < 4 ? (
              <Button type="button" onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                type="button" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}