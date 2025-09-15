'use client'

import { useEffect, useState, useRef } from 'react'
import { z } from 'zod'
import { useEvaluationStore } from '@/stores/evaluation-store'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Star,
  MapPin,
  Building,
  DollarSign,
  Users,
  Target
} from 'lucide-react'

// Enhanced 23-element schema based on Story 9.5
const enhancedBusinessSchema = z.object({
  // Section 1: Business Overview (8 elements)
  businessName: z.string().min(1, 'Business name is required'),
  website: z.string().url().optional().or(z.literal('')),
  industry: z.string().min(1, 'Please select an industry'),
  yearFounded: z.number().min(1800, 'Please enter a valid year').max(new Date().getFullYear()),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State/Province is required'),
  country: z.string().min(1, 'Country is required'),
  ownerWeeklyHours: z.number().min(0).max(168, 'Hours per week cannot exceed 168'),
  businessDependency: z.enum(['yes', 'no', 'partially']),
  evaluationPurpose: z.enum(['retirement', 'sale', 'curiosity', 'investment', 'other']),

  // Section 2: Financial Health (7 elements)
  revenueLastYear: z.number().min(0, 'Revenue must be 0 or greater'),
  revenueTwoYearsAgo: z.number().min(0, 'Revenue must be 0 or greater'),
  revenueThreeYearsAgo: z.number().min(0, 'Revenue must be 0 or greater'),
  ebitdaLastYear: z.number().optional(),
  ebitdaTwoYearsAgo: z.number().optional(),
  ebitdaThreeYearsAgo: z.number().optional(),
  currentlyProfitable: z.enum(['yes', 'no']),
  realEstateOwnership: z.enum(['own', 'lease']),
  realEstateValue: z.number().min(0).optional(),
  ffeValue: z.number().min(0).optional(),
  inventoryValue: z.number().min(0).optional(),

  // Section 3: Operations & Market (8 elements)
  fullTimeEmployees: z.number().min(0, 'Cannot be negative'),
  partTimeEmployees: z.number().min(0, 'Cannot be negative'),
  managementTeam: z.enum(['yes', 'no']),
  customerConcentration: z.enum(['yes', 'no']),
  competitiveAdvantage: z.string().max(1000, 'Please keep under 1000 characters'),
  keyCompetitor1: z.string().max(100).optional(),
  keyCompetitor2: z.string().max(100).optional(),
  keyCompetitor3: z.string().max(100).optional(),
  growthOpportunities: z.array(z.string()).min(1, 'Select at least one growth opportunity'),
  onlinePresenceRating: z.number().min(1).max(5).optional(),
  dataConsent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to data processing to continue',
  }),
})

type EnhancedBusiness = z.infer<typeof enhancedBusinessSchema>

// Data options
const industries = [
  'Technology/Software',
  'Healthcare/Medical',
  'Finance/Insurance',
  'Manufacturing',
  'Retail/E-commerce',
  'Real Estate',
  'Food & Beverage',
  'Education',
  'Transportation/Logistics',
  'Construction',
  'Professional Services',
  'Consulting',
  'Other'
]

const growthOpportunityOptions = [
  'Geographic expansion',
  'New products/services',
  'Online sales',
  'Strategic partnerships',
  'Market penetration',
  'Acquisition opportunities',
  'Other'
]

// Industries that should show inventory fields
const inventoryIndustries = ['Manufacturing', 'Retail/E-commerce', 'Food & Beverage']

// Industries that should show FF&E fields
const ffeIndustries = ['Manufacturing', 'Real Estate', 'Food & Beverage', 'Retail/E-commerce']

export default function EnhancedBusinessBasicsStep() {
  const { user } = useAuthStore()
  const { currentEvaluation, updateBusinessData, loadEvaluations } = useEvaluationStore()
  const hasLoadedData = useRef(false)
  
  const [formData, setFormData] = useState<EnhancedBusiness>({
    // Section 1: Business Overview
    businessName: user?.businessName || '',
    website: '',
    industry: user?.industry || '',
    yearFounded: new Date().getFullYear() - 5,
    city: '',
    state: '',
    country: 'United States',
    ownerWeeklyHours: 40,
    businessDependency: 'yes',
    evaluationPurpose: 'curiosity',

    // Section 2: Financial Health
    revenueLastYear: 0,
    revenueTwoYearsAgo: 0,
    revenueThreeYearsAgo: 0,
    ebitdaLastYear: undefined,
    ebitdaTwoYearsAgo: undefined,
    ebitdaThreeYearsAgo: undefined,
    currentlyProfitable: 'yes',
    realEstateOwnership: 'lease',
    realEstateValue: undefined,
    ffeValue: undefined,
    inventoryValue: undefined,

    // Section 3: Operations & Market
    fullTimeEmployees: 1,
    partTimeEmployees: 0,
    managementTeam: 'no',
    customerConcentration: 'no',
    competitiveAdvantage: '',
    keyCompetitor1: '',
    keyCompetitor2: '',
    keyCompetitor3: '',
    growthOpportunities: [],
    onlinePresenceRating: undefined,
    dataConsent: false,
  })
  
  const [errors, setErrors] = useState<Partial<Record<keyof EnhancedBusiness, string>>>({})
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showEbitdaSection, setShowEbitdaSection] = useState(false)

  // Load evaluations on mount
  useEffect(() => {
    loadEvaluations()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load existing data once when it becomes available
  useEffect(() => {
    if (currentEvaluation?.businessData && !hasLoadedData.current) {
      const data = currentEvaluation.businessData as any
      
      // Map existing simple data to enhanced format
      setFormData(prev => ({
        ...prev,
        businessName: data.businessName || user?.businessName || '',
        industry: data.industryFocus || data.industry || user?.industry || '',
        yearFounded: new Date().getFullYear() - (data.yearsInBusiness || 5),
        revenueLastYear: data.annualRevenue || 0,
        currentlyProfitable: data.cashFlow > 0 ? 'yes' : 'no',
        fullTimeEmployees: data.employeeCount || 1,
        competitiveAdvantage: Array.isArray(data.competitiveAdvantages) 
          ? data.competitiveAdvantages.join(', ')
          : data.competitiveAdvantages || '',
      }))
      
      hasLoadedData.current = true
    }
  }, [currentEvaluation?.businessData, user])

  const handleInputChange = (field: keyof EnhancedBusiness, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
    
    // Auto-save to store - map enhanced data back to simple format
    const mappedData = mapToSimpleFormat(formData, field, value)
    updateBusinessData(mappedData)
  }

  const mapToSimpleFormat = (data: EnhancedBusiness, changedField?: keyof EnhancedBusiness, changedValue?: any) => {
    const current = changedField ? { ...data, [changedField]: changedValue } : data
    
    return {
      businessType: 'LLC', // Default business type
      industryFocus: current.industry,
      yearsInBusiness: new Date().getFullYear() - current.yearFounded,
      businessModel: 'B2B (Business to Business)', // Default
      revenueModel: 'Mixed Revenue Streams', // Default
      annualRevenue: current.revenueLastYear,
      monthlyRecurring: Math.round(current.revenueLastYear / 12),
      expenses: current.revenueLastYear * 0.7, // Estimate
      cashFlow: current.revenueLastYear * (current.currentlyProfitable === 'yes' ? 0.15 : -0.05),
      grossMargin: current.currentlyProfitable === 'yes' ? 30 : 10,
      customerCount: Math.max(50, Math.round(current.revenueLastYear / 10000)),
      employeeCount: current.fullTimeEmployees + Math.round(current.partTimeEmployees / 2),
      marketPosition: current.revenueLastYear > 1000000 ? 'Market Leader' : 
                      current.revenueLastYear > 500000 ? 'Growing' : 'Emerging',
      competitiveAdvantages: current.competitiveAdvantage.split(',').map(s => s.trim()).filter(Boolean),
      primaryChannels: ['Direct Sales', 'Online'],
      assets: (current.realEstateValue || 0) + (current.ffeValue || 0) + (current.inventoryValue || 0),
      liabilities: 0,
    }
  }

  const handleGrowthOpportunityChange = (option: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      growthOpportunities: checked
        ? [...prev.growthOpportunities, option]
        : prev.growthOpportunities.filter(o => o !== option)
    }))
  }

  const validateStep = () => {
    const result = enhancedBusinessSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof EnhancedBusiness, string>> = {}
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          const fieldName = err.path[0] as keyof EnhancedBusiness
          fieldErrors[fieldName] = err.message
        }
      })
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }

  // Show industry-specific fields
  const shouldShowInventory = inventoryIndustries.includes(formData.industry)
  const shouldShowFFE = ffeIndustries.includes(formData.industry)

  const TooltipHelp = ({ text }: { text: string }) => (
    <div className="group relative inline-block ml-2">
      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
      <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 w-64 bg-popover text-popover-foreground text-sm rounded-lg p-3 border shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <div className="font-medium mb-1">Why we ask this:</div>
        {text}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-popover"></div>
      </div>
    </div>
  )

  const StarRating = ({ value, onChange }: { value?: number; onChange: (rating: number) => void }) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`transition-colors ${
            value && star <= value ? 'text-yellow-400' : 'text-muted-foreground'
          }`}
        >
          <Star className="h-5 w-5 fill-current" />
        </button>
      ))}
      {value && (
        <span className="ml-2 text-sm text-muted-foreground">({value}/5)</span>
      )}
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-semibold mb-2">Enhanced Business Questionnaire</h3>
        <p className="text-muted-foreground">
          Provide comprehensive business information for the most accurate valuation. Complete sections in order for the best experience.
        </p>
      </div>

      {/* Section 1: Business Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Section 1: Business Overview
            <Badge variant="secondary" className="ml-2">8 questions</Badge>
          </CardTitle>
          <CardDescription>
            Basic information about your business structure and background
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium mb-2">
                Business Name <span className="text-destructive">*</span>
              </label>
              <input
                id="businessName"
                type="text"
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Your business name"
              />
              {errors.businessName && (
                <p className="text-destructive text-sm mt-1">{errors.businessName}</p>
              )}
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium mb-2">
                Business Website (Optional)
              </label>
              <input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="https://yourwebsite.com"
              />
              {errors.website && (
                <p className="text-destructive text-sm mt-1">{errors.website}</p>
              )}
            </div>

            <div>
              <label htmlFor="industry" className="block text-sm font-medium mb-2">
                Industry/Sector <span className="text-destructive">*</span>
              </label>
              <select
                id="industry"
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select industry</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
              {errors.industry && (
                <p className="text-destructive text-sm mt-1">{errors.industry}</p>
              )}
            </div>

            <div>
              <label htmlFor="yearFounded" className="block text-sm font-medium mb-2">
                Year Founded <span className="text-destructive">*</span>
              </label>
              <input
                id="yearFounded"
                type="number"
                min="1800"
                max={new Date().getFullYear()}
                value={formData.yearFounded}
                onChange={(e) => handleInputChange('yearFounded', parseInt(e.target.value) || new Date().getFullYear())}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.yearFounded && (
                <p className="text-destructive text-sm mt-1">{errors.yearFounded}</p>
              )}
            </div>
          </div>

          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-medium mb-3 flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Business Location
            </h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label htmlFor="city" className="block text-sm font-medium mb-2">
                  City <span className="text-destructive">*</span>
                </label>
                <input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Your city"
                />
                {errors.city && (
                  <p className="text-destructive text-sm mt-1">{errors.city}</p>
                )}
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium mb-2">
                  State/Province <span className="text-destructive">*</span>
                </label>
                <input
                  id="state"
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="State or Province"
                />
                {errors.state && (
                  <p className="text-destructive text-sm mt-1">{errors.state}</p>
                )}
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium mb-2">
                  Country <span className="text-destructive">*</span>
                </label>
                <select
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="ownerWeeklyHours" className="block text-sm font-medium mb-2">
                Owner's Weekly Involvement (hours) <span className="text-destructive">*</span>
                <TooltipHelp text="Understanding your time commitment helps assess business dependency and potential buyer requirements." />
              </label>
              <input
                id="ownerWeeklyHours"
                type="number"
                min="0"
                max="168"
                value={formData.ownerWeeklyHours}
                onChange={(e) => handleInputChange('ownerWeeklyHours', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.ownerWeeklyHours && (
                <p className="text-destructive text-sm mt-1">{errors.ownerWeeklyHours}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Business Dependency on Owner <span className="text-destructive">*</span>
                <TooltipHelp text="Businesses with lower owner dependency typically command higher valuations as they present lower operational risk to buyers." />
              </label>
              <div className="space-y-2">
                {['yes', 'no', 'partially'].map((option) => (
                  <label key={option} className="flex items-center">
                    <input
                      type="radio"
                      name="businessDependency"
                      value={option}
                      checked={formData.businessDependency === option}
                      onChange={(e) => handleInputChange('businessDependency', e.target.value as any)}
                      className="mr-2"
                    />
                    <span className="capitalize">{option === 'partially' ? 'Partially' : option === 'yes' ? 'Highly dependent' : 'Operates independently'}</span>
                  </label>
                ))}
              </div>
              {errors.businessDependency && (
                <p className="text-destructive text-sm mt-1">{errors.businessDependency}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Reason for Seeking Evaluation <span className="text-destructive">*</span>
            </label>
            <div className="grid gap-2 md:grid-cols-3">
              {[
                { value: 'retirement', label: 'Planning for retirement' },
                { value: 'sale', label: 'Considering a sale' },
                { value: 'curiosity', label: 'Curiosity/benchmark' },
                { value: 'investment', label: 'Seeking investment' },
                { value: 'other', label: 'Other' },
              ].map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="evaluationPurpose"
                    value={option.value}
                    checked={formData.evaluationPurpose === option.value}
                    onChange={(e) => handleInputChange('evaluationPurpose', e.target.value as any)}
                    className="mr-2"
                  />
                  {option.label}
                </label>
              ))}
            </div>
            {errors.evaluationPurpose && (
              <p className="text-destructive text-sm mt-1">{errors.evaluationPurpose}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Financial Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Section 2: Financial Health
            <Badge variant="secondary" className="ml-2">7 questions</Badge>
          </CardTitle>
          <CardDescription>
            Revenue, profitability, and asset information for accurate valuation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-3">Annual Revenue (Last 3 Years) *</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label htmlFor="revenueLastYear" className="block text-sm font-medium mb-2">
                  Last Year ({new Date().getFullYear() - 1})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                  <input
                    id="revenueLastYear"
                    type="number"
                    min="0"
                    value={formData.revenueLastYear}
                    onChange={(e) => handleInputChange('revenueLastYear', parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="0"
                  />
                </div>
                {errors.revenueLastYear && (
                  <p className="text-destructive text-sm mt-1">{errors.revenueLastYear}</p>
                )}
              </div>

              <div>
                <label htmlFor="revenueTwoYearsAgo" className="block text-sm font-medium mb-2">
                  Two Years Ago ({new Date().getFullYear() - 2})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                  <input
                    id="revenueTwoYearsAgo"
                    type="number"
                    min="0"
                    value={formData.revenueTwoYearsAgo}
                    onChange={(e) => handleInputChange('revenueTwoYearsAgo', parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="0"
                  />
                </div>
                {errors.revenueTwoYearsAgo && (
                  <p className="text-destructive text-sm mt-1">{errors.revenueTwoYearsAgo}</p>
                )}
              </div>

              <div>
                <label htmlFor="revenueThreeYearsAgo" className="block text-sm font-medium mb-2">
                  Three Years Ago ({new Date().getFullYear() - 3})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                  <input
                    id="revenueThreeYearsAgo"
                    type="number"
                    min="0"
                    value={formData.revenueThreeYearsAgo}
                    onChange={(e) => handleInputChange('revenueThreeYearsAgo', parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="0"
                  />
                </div>
                {errors.revenueThreeYearsAgo && (
                  <p className="text-destructive text-sm mt-1">{errors.revenueThreeYearsAgo}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEbitdaSection(!showEbitdaSection)}
              className="mb-4"
            >
              {showEbitdaSection ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
              EBITDA Information (Optional)
              <TooltipHelp text="EBITDA (Earnings Before Interest, Taxes, Depreciation, and Amortization) provides a clearer picture of operational profitability for more accurate valuations." />
            </Button>
            
            {showEbitdaSection && (
              <div className="grid gap-4 md:grid-cols-3 p-4 border rounded-lg bg-muted/20">
                <div>
                  <label htmlFor="ebitdaLastYear" className="block text-sm font-medium mb-2">
                    EBITDA Last Year (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                      id="ebitdaLastYear"
                      type="number"
                      value={formData.ebitdaLastYear || ''}
                      onChange={(e) => handleInputChange('ebitdaLastYear', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full pl-8 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Leave blank if unknown"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="ebitdaTwoYearsAgo" className="block text-sm font-medium mb-2">
                    EBITDA Two Years Ago (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                      id="ebitdaTwoYearsAgo"
                      type="number"
                      value={formData.ebitdaTwoYearsAgo || ''}
                      onChange={(e) => handleInputChange('ebitdaTwoYearsAgo', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full pl-8 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Leave blank if unknown"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="ebitdaThreeYearsAgo" className="block text-sm font-medium mb-2">
                    EBITDA Three Years Ago (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                      id="ebitdaThreeYearsAgo"
                      type="number"
                      value={formData.ebitdaThreeYearsAgo || ''}
                      onChange={(e) => handleInputChange('ebitdaThreeYearsAgo', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full pl-8 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Leave blank if unknown"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">
                Currently Profitable? <span className="text-destructive">*</span>
              </label>
              <div className="space-y-2">
                {['yes', 'no'].map((option) => (
                  <label key={option} className="flex items-center">
                    <input
                      type="radio"
                      name="currentlyProfitable"
                      value={option}
                      checked={formData.currentlyProfitable === option}
                      onChange={(e) => handleInputChange('currentlyProfitable', e.target.value as any)}
                      className="mr-2"
                    />
                    <span className="capitalize">{option}</span>
                  </label>
                ))}
              </div>
              {errors.currentlyProfitable && (
                <p className="text-destructive text-sm mt-1">{errors.currentlyProfitable}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Real Estate Ownership <span className="text-destructive">*</span>
                <TooltipHelp text="Owning your business location adds asset value and reduces operational risk, positively impacting valuation." />
              </label>
              <div className="space-y-2">
                {['own', 'lease'].map((option) => (
                  <label key={option} className="flex items-center">
                    <input
                      type="radio"
                      name="realEstateOwnership"
                      value={option}
                      checked={formData.realEstateOwnership === option}
                      onChange={(e) => handleInputChange('realEstateOwnership', e.target.value as any)}
                      className="mr-2"
                    />
                    <span className="capitalize">{option}</span>
                  </label>
                ))}
              </div>
              {errors.realEstateOwnership && (
                <p className="text-destructive text-sm mt-1">{errors.realEstateOwnership}</p>
              )}
            </div>
          </div>

          {formData.realEstateOwnership === 'own' && (
            <div>
              <label htmlFor="realEstateValue" className="block text-sm font-medium mb-2">
                Estimated Market Value of Real Estate
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                <input
                  id="realEstateValue"
                  type="number"
                  min="0"
                  value={formData.realEstateValue || ''}
                  onChange={(e) => handleInputChange('realEstateValue', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full pl-8 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Estimated current market value"
                />
              </div>
              {errors.realEstateValue && (
                <p className="text-destructive text-sm mt-1">{errors.realEstateValue}</p>
              )}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {shouldShowFFE && (
              <div>
                <label htmlFor="ffeValue" className="block text-sm font-medium mb-2">
                  Estimated Value of Furniture, Fixtures & Equipment
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                  <input
                    id="ffeValue"
                    type="number"
                    min="0"
                    value={formData.ffeValue || ''}
                    onChange={(e) => handleInputChange('ffeValue', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full pl-8 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Current resale value"
                  />
                </div>
                {errors.ffeValue && (
                  <p className="text-destructive text-sm mt-1">{errors.ffeValue}</p>
                )}
              </div>
            )}

            {shouldShowInventory && (
              <div>
                <label htmlFor="inventoryValue" className="block text-sm font-medium mb-2">
                  Current Value of Inventory
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                  <input
                    id="inventoryValue"
                    type="number"
                    min="0"
                    value={formData.inventoryValue || ''}
                    onChange={(e) => handleInputChange('inventoryValue', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full pl-8 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Current inventory value"
                  />
                </div>
                {errors.inventoryValue && (
                  <p className="text-destructive text-sm mt-1">{errors.inventoryValue}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Operations & Market */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Section 3: Operations & Market
            <Badge variant="secondary" className="ml-2">8 questions</Badge>
          </CardTitle>
          <CardDescription>
            Team structure, competitive position, and growth opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="fullTimeEmployees" className="block text-sm font-medium mb-2">
                Number of Full-time Employees <span className="text-destructive">*</span>
              </label>
              <input
                id="fullTimeEmployees"
                type="number"
                min="0"
                value={formData.fullTimeEmployees}
                onChange={(e) => handleInputChange('fullTimeEmployees', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.fullTimeEmployees && (
                <p className="text-destructive text-sm mt-1">{errors.fullTimeEmployees}</p>
              )}
            </div>

            <div>
              <label htmlFor="partTimeEmployees" className="block text-sm font-medium mb-2">
                Number of Part-time Employees <span className="text-destructive">*</span>
              </label>
              <input
                id="partTimeEmployees"
                type="number"
                min="0"
                value={formData.partTimeEmployees}
                onChange={(e) => handleInputChange('partTimeEmployees', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.partTimeEmployees && (
                <p className="text-destructive text-sm mt-1">{errors.partTimeEmployees}</p>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">
                Management Team in Place? <span className="text-destructive">*</span>
                <TooltipHelp text="A strong management team reduces operational risk and increases business value by ensuring continuity beyond the owner." />
              </label>
              <div className="space-y-2">
                {['yes', 'no'].map((option) => (
                  <label key={option} className="flex items-center">
                    <input
                      type="radio"
                      name="managementTeam"
                      value={option}
                      checked={formData.managementTeam === option}
                      onChange={(e) => handleInputChange('managementTeam', e.target.value as any)}
                      className="mr-2"
                    />
                    <span className="capitalize">{option}</span>
                  </label>
                ))}
              </div>
              {errors.managementTeam && (
                <p className="text-destructive text-sm mt-1">{errors.managementTeam}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Customer Concentration Risk <span className="text-destructive">*</span>
                <TooltipHelp text="Having a single client represent more than 20% of revenue creates concentration risk, which can negatively impact valuation." />
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Does any single client represent more than 20% of your revenue?
              </p>
              <div className="space-y-2">
                {['yes', 'no'].map((option) => (
                  <label key={option} className="flex items-center">
                    <input
                      type="radio"
                      name="customerConcentration"
                      value={option}
                      checked={formData.customerConcentration === option}
                      onChange={(e) => handleInputChange('customerConcentration', e.target.value as any)}
                      className="mr-2"
                    />
                    <span className="capitalize">{option}</span>
                  </label>
                ))}
              </div>
              {errors.customerConcentration && (
                <p className="text-destructive text-sm mt-1">{errors.customerConcentration}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="competitiveAdvantage" className="block text-sm font-medium mb-2">
              Competitive Advantage <span className="text-destructive">*</span>
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              What sets your business apart from competitors? (Max 1000 characters)
            </p>
            <textarea
              id="competitiveAdvantage"
              rows={4}
              maxLength={1000}
              value={formData.competitiveAdvantage}
              onChange={(e) => handleInputChange('competitiveAdvantage', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Describe your unique value proposition, proprietary technology, exclusive partnerships, or other competitive moats..."
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{errors.competitiveAdvantage && <span className="text-destructive">{errors.competitiveAdvantage}</span>}</span>
              <span>{formData.competitiveAdvantage.length}/1000</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Growth Opportunities <span className="text-destructive">*</span>
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Select all that apply to your business (minimum 1 required)
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {growthOpportunityOptions.map((option) => (
                <label key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.growthOpportunities.includes(option)}
                    onChange={(e) => handleGrowthOpportunityChange(option, e.target.checked)}
                    className="mr-3"
                  />
                  {option}
                </label>
              ))}
            </div>
            {errors.growthOpportunities && (
              <p className="text-destructive text-sm mt-1">{errors.growthOpportunities}</p>
            )}
          </div>

          {/* Additional Details Section */}
          <div className="border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="mb-4"
            >
              {showAdvanced ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
              Additional Details (Optional)
            </Button>
            
            {showAdvanced && (
              <div className="space-y-6 p-4 border rounded-lg bg-muted/20">
                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <label htmlFor="keyCompetitor1" className="block text-sm font-medium mb-2">
                      Key Competitor #1
                    </label>
                    <input
                      id="keyCompetitor1"
                      type="text"
                      maxLength={100}
                      value={formData.keyCompetitor1}
                      onChange={(e) => handleInputChange('keyCompetitor1', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Company name"
                    />
                  </div>

                  <div>
                    <label htmlFor="keyCompetitor2" className="block text-sm font-medium mb-2">
                      Key Competitor #2
                    </label>
                    <input
                      id="keyCompetitor2"
                      type="text"
                      maxLength={100}
                      value={formData.keyCompetitor2}
                      onChange={(e) => handleInputChange('keyCompetitor2', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Company name"
                    />
                  </div>

                  <div>
                    <label htmlFor="keyCompetitor3" className="block text-sm font-medium mb-2">
                      Key Competitor #3
                    </label>
                    <input
                      id="keyCompetitor3"
                      type="text"
                      maxLength={100}
                      value={formData.keyCompetitor3}
                      onChange={(e) => handleInputChange('keyCompetitor3', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Company name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Online Presence Rating (Optional)
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Rate your overall online presence and digital marketing effectiveness
                  </p>
                  <StarRating 
                    value={formData.onlinePresenceRating}
                    onChange={(rating) => handleInputChange('onlinePresenceRating', rating)}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Consent */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="dataConsent"
              checked={formData.dataConsent}
              onChange={(e) => handleInputChange('dataConsent', e.target.checked)}
              className="mt-1"
            />
            <div>
              <label htmlFor="dataConsent" className="text-sm font-medium cursor-pointer">
                Data Processing Consent <span className="text-destructive">*</span>
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                I consent to GoodBuy HQ processing my business data for the purpose of business valuation analysis. 
                <a href="/privacy" target="_blank" className="text-primary hover:underline ml-1">
                  View Privacy Policy
                </a>
              </p>
              {errors.dataConsent && (
                <p className="text-destructive text-sm mt-1">{errors.dataConsent}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Progress Indicator */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Auto-saving your progress...</span>
        </div>
      </div>
    </div>
  )
}