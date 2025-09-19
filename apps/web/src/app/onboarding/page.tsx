'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { z } from 'zod'

// Step 1: Business Information
const step1Schema = z.object({
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

export default function OnboardingPage() {
  const { isLoaded, user } = useUser()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    // Step 1
    businessName: '',
    industry: '',
    role: 'owner' as 'owner' | 'manager' | 'advisor',

    // Step 2
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

    // Step 3
    revenueRange: '',
    businessModel: '',

    // Step 4
    websiteUrl: '',
    linkedinUrl: '',
    referralSource: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Options
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

  // Check if user already completed onboarding
  useEffect(() => {
    if (isLoaded && user?.unsafeMetadata?.onboardingCompleted) {
      router.push('/dashboard')
    }
  }, [isLoaded, user, router])

  // Auto-save to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('onboarding-progress')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setFormData(data.formData || formData)
        setCurrentStep(data.currentStep || 1)
      } catch (error) {
        console.error('Error loading saved onboarding:', error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('onboarding-progress', JSON.stringify({
      formData,
      currentStep
    }))
  }, [formData, currentStep])

  const validateStep = (step: number): boolean => {
    setErrors({})

    try {
      switch (step) {
        case 1:
          step1Schema.parse({
            businessName: formData.businessName,
            industry: formData.industry,
            role: formData.role,
          })
          break
        case 2:
          step2Schema.parse({
            businessAddress: formData.businessAddress,
            businessPhone: formData.businessPhone,
            yearsInOperation: formData.yearsInOperation,
            employeeCountRange: formData.employeeCountRange,
          })
          break
        case 3:
          step3Schema.parse({
            revenueRange: formData.revenueRange,
            businessModel: formData.businessModel,
          })
          break
        case 4:
          // Optional fields, always valid
          return true
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

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return
    }

    // If completing step 4, submit everything
    if (currentStep === 4) {
      await handleFinalSubmit()
      return
    }

    setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkipToEnd = async () => {
    // For step 4, allow skipping optional fields
    if (currentStep === 4) {
      await handleFinalSubmit()
    }
  }

  const handleFinalSubmit = async () => {
    if (!isLoaded || !user) return

    setIsSubmitting(true)
    setErrors({})

    try {
      // Update user metadata with business information
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          ...formData,
          onboardingCompleted: true,
          onboardingCompletedAt: new Date().toISOString(),
        },
      })

      // Clear saved progress
      localStorage.removeItem('onboarding-progress')

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Onboarding error:', err)
      setErrors({ general: 'Failed to save your information. Please try again.' })
      setIsSubmitting(false)
    }
  }

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  if (!user) {
    router.push('/sign-in')
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Welcome to GoodBuy HQ!</h1>
          <p className="text-muted-foreground mt-2">
            Let&apos;s get to know your business better
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="space-y-2">
              <CardTitle>
                {currentStep === 1 && 'Business Information'}
                {currentStep === 2 && 'Business Details'}
                {currentStep === 3 && 'Financial Overview'}
                {currentStep === 4 && 'Optional Information'}
              </CardTitle>
              <CardDescription>
                Step {currentStep} of 4
              </CardDescription>
              <Progress value={(currentStep / 4) * 100} className="h-2" />
            </div>
          </CardHeader>

          <CardContent>
            {errors.general && (
              <div className="p-3 mb-4 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-md">
                {errors.general}
              </div>
            )}

            {/* Step 1: Business Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Business Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md"
                      placeholder="Your Company Name"
                    />
                    {errors.businessName && (
                      <p className="text-destructive text-sm mt-1">{errors.businessName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Industry <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md"
                    >
                      <option value="">Select an industry</option>
                      {industries.map(industry => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                    {errors.industry && (
                      <p className="text-destructive text-sm mt-1">{errors.industry}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Your Role <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="w-full px-3 py-2 border border-input rounded-md"
                    >
                      <option value="owner">Business Owner</option>
                      <option value="manager">Manager</option>
                      <option value="advisor">Advisor/Consultant</option>
                    </select>
                    {errors.role && (
                      <p className="text-destructive text-sm mt-1">{errors.role}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Business Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Business Address</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">
                        Street Address <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.businessAddress.street}
                        onChange={(e) => setFormData({
                          ...formData,
                          businessAddress: { ...formData.businessAddress, street: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-input rounded-md"
                        placeholder="123 Main St"
                      />
                      {errors['businessAddress.street'] && (
                        <p className="text-destructive text-sm mt-1">{errors['businessAddress.street']}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        City <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.businessAddress.city}
                        onChange={(e) => setFormData({
                          ...formData,
                          businessAddress: { ...formData.businessAddress, city: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-input rounded-md"
                        placeholder="New York"
                      />
                      {errors['businessAddress.city'] && (
                        <p className="text-destructive text-sm mt-1">{errors['businessAddress.city']}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        State <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.businessAddress.state}
                        onChange={(e) => setFormData({
                          ...formData,
                          businessAddress: { ...formData.businessAddress, state: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-input rounded-md"
                        placeholder="NY"
                      />
                      {errors['businessAddress.state'] && (
                        <p className="text-destructive text-sm mt-1">{errors['businessAddress.state']}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        ZIP Code <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.businessAddress.zipCode}
                        onChange={(e) => setFormData({
                          ...formData,
                          businessAddress: { ...formData.businessAddress, zipCode: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-input rounded-md"
                        placeholder="10001"
                      />
                      {errors['businessAddress.zipCode'] && (
                        <p className="text-destructive text-sm mt-1">{errors['businessAddress.zipCode']}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Country <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.businessAddress.country}
                        onChange={(e) => setFormData({
                          ...formData,
                          businessAddress: { ...formData.businessAddress, country: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-input rounded-md"
                        placeholder="United States"
                      />
                      {errors['businessAddress.country'] && (
                        <p className="text-destructive text-sm mt-1">{errors['businessAddress.country']}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Business Phone <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.businessPhone}
                      onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md"
                      placeholder="(555) 123-4567"
                    />
                    {errors.businessPhone && (
                      <p className="text-destructive text-sm mt-1">{errors.businessPhone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Years in Operation <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.yearsInOperation}
                      onChange={(e) => setFormData({ ...formData, yearsInOperation: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-input rounded-md"
                      placeholder="5"
                      min="0"
                    />
                    {errors.yearsInOperation && (
                      <p className="text-destructive text-sm mt-1">{errors.yearsInOperation}</p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Number of Employees <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={formData.employeeCountRange}
                      onChange={(e) => setFormData({ ...formData, employeeCountRange: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md"
                    >
                      <option value="">Select employee count</option>
                      {employeeRanges.map(range => (
                        <option key={range} value={range}>{range}</option>
                      ))}
                    </select>
                    {errors.employeeCountRange && (
                      <p className="text-destructive text-sm mt-1">{errors.employeeCountRange}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Financial Overview */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Annual Revenue Range <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={formData.revenueRange}
                      onChange={(e) => setFormData({ ...formData, revenueRange: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md"
                    >
                      <option value="">Select revenue range</option>
                      {revenueRanges.map(range => (
                        <option key={range} value={range}>{range}</option>
                      ))}
                    </select>
                    {errors.revenueRange && (
                      <p className="text-destructive text-sm mt-1">{errors.revenueRange}</p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Business Model <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={formData.businessModel}
                      onChange={(e) => setFormData({ ...formData, businessModel: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md"
                    >
                      <option value="">Select business model</option>
                      {businessModels.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                    {errors.businessModel && (
                      <p className="text-destructive text-sm mt-1">{errors.businessModel}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Optional Information */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  These fields are optional and can help us provide better insights
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={formData.websiteUrl}
                      onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md"
                      placeholder="https://www.yourcompany.com"
                    />
                    {errors.websiteUrl && (
                      <p className="text-destructive text-sm mt-1">{errors.websiteUrl}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      LinkedIn Profile URL
                    </label>
                    <input
                      type="url"
                      value={formData.linkedinUrl}
                      onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md"
                      placeholder="https://linkedin.com/company/yourcompany"
                    />
                    {errors.linkedinUrl && (
                      <p className="text-destructive text-sm mt-1">{errors.linkedinUrl}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      How did you hear about us?
                    </label>
                    <select
                      value={formData.referralSource}
                      onChange={(e) => setFormData({ ...formData, referralSource: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md"
                    >
                      <option value="">Select an option</option>
                      {referralSources.map(source => (
                        <option key={source} value={source}>{source}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>

              <div className="flex gap-2">
                {currentStep === 4 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSkipToEnd}
                    disabled={isSubmitting}
                  >
                    Skip & Finish
                  </Button>
                )}

                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    'Processing...'
                  ) : currentStep === 4 ? (
                    'Complete Setup'
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}