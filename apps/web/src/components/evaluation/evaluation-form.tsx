'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEvaluationStore } from '@/stores/evaluation-store'
import { useUser } from '@clerk/nextjs'
import { getCurrentUserId, setClerkUserId } from '@/lib/user-utils'
import BusinessBasicsStep from './steps/business-basics-step'
import EnhancedBusinessBasicsStep from './steps/enhanced-business-basics-step'
import FinancialMetricsStep from './steps/financial-metrics-step'
import OperationalDataStep from './steps/operational-data-step'
import DocumentUploadStep from './steps/document-upload-step'
import ReviewSubmitStep from './steps/review-submit-step'

// Epic 1 steps (4 steps - stable)
const epic1Steps = [
  { id: 1, title: 'Business Basics', component: BusinessBasicsStep },
  { id: 2, title: 'Financial Metrics', component: FinancialMetricsStep },
  { id: 3, title: 'Operational Data', component: OperationalDataStep },
  { id: 4, title: 'Review & Submit', component: ReviewSubmitStep },
]

// Epic 2 steps (5 steps - enhanced with document upload)
const epic2Steps = [
  { id: 1, title: 'Business Basics', component: BusinessBasicsStep },
  { id: 2, title: 'Document Upload', component: DocumentUploadStep },
  { id: 3, title: 'Financial Metrics', component: FinancialMetricsStep },
  { id: 4, title: 'Operational Data', component: OperationalDataStep },
  { id: 5, title: 'Review & Submit', component: ReviewSubmitStep },
]

interface EvaluationFormProps {
  initialData?: any[]
}

export default function EvaluationForm({ initialData }: EvaluationFormProps) {
  const router = useRouter()
  const { user, isLoaded, isSignedIn } = useUser()
  
  // Feature flag checks - moved inside component to ensure fresh read
  const USE_EPIC2 = process.env.NEXT_PUBLIC_EPIC2_ENABLED === 'true'
  const USE_ENHANCED_QUESTIONNAIRE = process.env.NEXT_PUBLIC_EPIC9_5_ENABLED === 'true'
  
  // Enhanced steps for Epic 9.5 with improved questionnaire
  const enhancedEpic2Steps = [
    { id: 1, title: 'Business Questionnaire', component: EnhancedBusinessBasicsStep },
    { id: 2, title: 'Document Upload', component: DocumentUploadStep },
    { id: 3, title: 'Financial Metrics', component: FinancialMetricsStep },
    { id: 4, title: 'Operational Data', component: OperationalDataStep },
    { id: 5, title: 'Review & Submit', component: ReviewSubmitStep },
  ]
  
  // Conditional steps based on feature flags
  const steps = USE_ENHANCED_QUESTIONNAIRE ? enhancedEpic2Steps :
                USE_EPIC2 ? epic2Steps : epic1Steps
  
  const {
    currentStep,
    currentEvaluation,
    setCurrentStep,
    setCurrentEvaluation,
    saveProgress,
    submitEvaluation,
    performEnhancedAnalysis,
    loadEvaluations,
    isLoading
  } = useEvaluationStore()
  
  // Dynamic totalSteps based on feature flag
  const totalSteps = steps.length
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const effectiveUser = isSignedIn ? user : null

  // Store the Clerk user ID for consistency
  useEffect(() => {
    if (user?.id) {
      console.log('🆔 EvaluationForm: Storing Clerk user ID:', user.id)
      setClerkUserId(user.id)
    }
  }, [user])

  // Helper function to aggregate extracted financial data
  const aggregateExtractedData = (extractedDocs: any[]) => {
    console.log('🔄 Aggregating extracted data from documents:', extractedDocs?.length || 0)
    
    if (!extractedDocs || extractedDocs.length === 0) {
      console.log('⚠️ No extracted documents provided, returning zero values')
      return {
        businessType: '',
        industryFocus: '',
        yearsInBusiness: 1,
        businessModel: '',
        revenueModel: '',
        annualRevenue: 0,
        monthlyRecurring: 0,
        expenses: 0,
        cashFlow: 0,
        grossMargin: 0,
        customerCount: 0,
        employeeCount: 1,
        marketPosition: '',
        competitiveAdvantages: [],
        primaryChannels: [],
        assets: 0,
        liabilities: 0,
      }
    }

    // Aggregate values from all documents
    let totalRevenue = 0
    let totalExpenses = 0
    let totalCashFlow = 0
    let totalAssets = 0
    let totalLiabilities = 0
    let highestConfidenceRevenue = 0
    let hasValidData = false

    extractedDocs.forEach((doc, index) => {
      console.log(`📊 Document ${index + 1} (${doc.originalFileName || 'Unknown'}):`)
      console.log(`  - Full structure:`, Object.keys(doc))
      console.log(`  - Has extractedData:`, !!doc.extractedData)
      
      if (doc.extractedData) {
        const revenue = doc.extractedData.revenue?.value || 0
        const expenses = doc.extractedData.expenses?.value || 0
        const cashFlow = doc.extractedData.cashFlow?.value || 0
        const assets = doc.extractedData.balanceSheet?.assets || 0
        const liabilities = doc.extractedData.balanceSheet?.liabilities || 0
        
        console.log(`  - Revenue: ${revenue} (confidence: ${doc.extractedData.revenue?.confidence || 0})`)
        console.log(`  - Expenses: ${expenses} (confidence: ${doc.extractedData.expenses?.confidence || 0})`)
        console.log(`  - Cash Flow: ${cashFlow} (confidence: ${doc.extractedData.cashFlow?.confidence || 0})`)
        console.log(`  - Assets: ${assets} (confidence: ${doc.extractedData.balanceSheet?.confidence || 0})`)
        console.log(`  - Liabilities: ${liabilities}`)
        
        // Use the highest confidence revenue source, or sum if similar confidence
        const revenueConfidence = doc.extractedData.revenue?.confidence || 0
        // Only use revenue if it has reasonable confidence or is the only data available
        if (revenue > 0 && (revenueConfidence > 30 || totalRevenue === 0)) {
          if (revenueConfidence > highestConfidenceRevenue || totalRevenue === 0) {
            totalRevenue = revenue // Use highest confidence, don't sum
            highestConfidenceRevenue = revenueConfidence
          }
          hasValidData = true
        }
        
        // Sum other values
        totalExpenses += expenses
        totalCashFlow += cashFlow
        totalAssets += assets
        totalLiabilities += liabilities
        
        if (revenue > 0 || expenses > 0 || Math.abs(cashFlow) > 0 || assets > 0) {
          hasValidData = true
        }
        
        // Check for processing errors in document
        const hasProcessingError = doc.extractedData.dataQualityFlags?.some((flag: string) => 
          flag.includes('Processing error') || flag.includes('failed')
        )
        
        if (hasProcessingError) {
          console.log(`  - Document ${index + 1} had processing errors, skipping for aggregation`)
          return // Skip documents with processing errors
        }
      } else {
        console.log(`  - No extractedData found in document ${index + 1}`)
      }
    })

    const grossMargin = totalRevenue > 0 && totalExpenses > 0 
      ? Math.max(0, Math.min(100, Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 100)))
      : 0

    const aggregated = {
      // Business basics (would be filled manually or from additional extraction)
      businessType: 'Technology Company', // Default based on TechFlow
      industryFocus: 'Software/Technology',
      yearsInBusiness: 3,
      businessModel: 'B2B Software',
      revenueModel: 'Subscription/Service',
      
      // Financial data from extraction
      annualRevenue: Math.round(totalRevenue),
      monthlyRecurring: totalRevenue > 0 ? Math.round(totalRevenue / 12) : 0,
      expenses: Math.round(totalExpenses),
      cashFlow: Math.round(totalCashFlow),
      grossMargin,
      
      // Operational data (estimated based on financial data)
      customerCount: totalRevenue > 0 ? Math.max(50, Math.round(totalRevenue / 50000)) : 0,
      employeeCount: totalRevenue > 0 ? Math.max(5, Math.round(totalRevenue / 200000)) : 1,
      marketPosition: totalRevenue > 1000000 ? 'Market Leader' : totalRevenue > 500000 ? 'Growing' : 'Emerging',
      competitiveAdvantages: ['Technology Innovation', 'Customer Service'],
      primaryChannels: ['Direct Sales', 'Online'],
      
      // Balance sheet data
      assets: Math.round(totalAssets),
      liabilities: Math.round(totalLiabilities),
    }

    console.log('📊 Final aggregated data:', aggregated)
    console.log('🎯 Has valid extracted data:', hasValidData)
    
    // If no valid data was found, add flags to indicate manual input needed
    if (!hasValidData) {
      aggregated.competitiveAdvantages = ['Manual data entry required']
      console.log('⚠️ No valid financial data extracted - user will need manual entry')
    }
    
    return aggregated
  }

  // Track if we've already initialized with document data to prevent loops
  const [hasInitialized, setHasInitialized] = useState(false)

  useEffect(() => {
    // Don't run this effect during submission
    if (!effectiveUser || hasInitialized || isSubmitting) return

    console.log('🔍 EvaluationForm useEffect triggered')
    console.log('  - Initial data prop received:', initialData?.length || 0, 'documents')
    console.log('  - Current evaluation exists:', !!currentEvaluation)
    console.log('  - Effective user ID:', effectiveUser?.id)
    
    // If we have document data, we want to use it regardless of existing evaluation
    if (initialData && initialData.length > 0) {
      console.log('📝 Processing document data for evaluation...')
      
      // Log the structure of what we received
      initialData.forEach((doc, i) => {
        console.log(`Document ${i + 1}:`, {
          id: doc.id,
          originalFileName: doc.originalFileName,
          hasExtractedData: !!doc.extractedData,
          extractedDataStructure: doc.extractedData ? Object.keys(doc.extractedData) : 'none'
        })
      })
      
      const businessData = aggregateExtractedData(initialData)
      
      console.log('🚀 Creating evaluation with extracted business data:')
      console.log('  - Annual Revenue:', businessData.annualRevenue)
      console.log('  - Expenses:', businessData.expenses)
      console.log('  - Cash Flow:', businessData.cashFlow)
      console.log('  - Assets:', businessData.assets)
      console.log('  - Business Type:', businessData.businessType)
      
      setCurrentEvaluation({
        userId: user?.id || effectiveUser?.id || '',
        businessData,
        status: 'processing',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Only skip to Financial Metrics if we have meaningful financial data with reasonable confidence
      const hasMeaningfulData = businessData.annualRevenue > 1000 || businessData.expenses > 1000 || businessData.assets > 1000
      if (hasMeaningfulData) {
        console.log('📊 Document data with meaningful financial values - jumping to Financial Metrics step')
        setCurrentStep(2)
      } else {
        console.log('⚠️ Document data processed but no meaningful financial values - staying on Business Basics')
        console.log('   User should review and manually enter or correct the financial data')
        setCurrentStep(1)
      }
      
      setHasInitialized(true)
    } else if (!currentEvaluation) {
      // Only create default evaluation if no document data and no existing evaluation
      console.log('🚀 No document data - creating default evaluation with zero values')
      
      setCurrentEvaluation({
        userId: user?.id || effectiveUser?.id || '',
        businessData: {
          businessType: '',
          industryFocus: '',
          yearsInBusiness: 1,
          businessModel: '',
          revenueModel: '',
          annualRevenue: 0,
          monthlyRecurring: 0,
          expenses: 0,
          cashFlow: 0,
          grossMargin: 0,
          customerCount: 0,
          employeeCount: 1,
          marketPosition: '',
          competitiveAdvantages: [],
          primaryChannels: [],
          assets: 0,
          liabilities: 0,
        },
        status: 'processing',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      setHasInitialized(true)
    } else {
      // We have an existing evaluation, just mark as initialized
      console.log('🔄 Using existing evaluation')
      setHasInitialized(true)
    }
    
    // Load any saved progress (only on initial mount)
    if (!currentEvaluation && (!initialData || initialData.length === 0)) {
      console.log('📋 Loading saved evaluations...')
      // Only load evaluations if we have a Clerk user ID
      if (user?.id) {
        loadEvaluations(false, user.id)
      } else {
        console.log('⚠️ Skipping loadEvaluations - no Clerk user ID available')
      }
    }
  }, [effectiveUser, currentEvaluation, setCurrentEvaluation, loadEvaluations, initialData, setCurrentStep, hasInitialized, isSubmitting])

  const getCurrentStepComponent = () => {
    const step = steps.find(s => s.id === currentStep)
    if (!step) return null
    
    const Component = step.component
    return <Component />
  }

  const handleNext = async () => {
    // Auto-save progress
    await saveProgress()
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1 && !isSubmitting) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    console.log('🚀 SUBMIT EVALUATION CALLED')
    console.log('🚀 Current evaluation data:', currentEvaluation)
    console.log('🚀 User info:', user)
    console.log('🚀 Feature flag USE_EPIC2:', USE_EPIC2)
    console.log('🚀 Setting isSubmitting to true...')

    // Validate required data
    if (!currentEvaluation?.businessData?.annualRevenue) {
      alert('Please complete all required fields before submitting.')
      return
    }

    setIsSubmitting(true)
    console.log('🚀 isSubmitting has been set to true')
    try {
      let evaluation
      
      if (USE_EPIC2) {
        console.log('🚀 Using Epic 2 - Calling performEnhancedAnalysis()...')
        console.log('🚀 Passing Clerk user ID:', user?.id)
        evaluation = await performEnhancedAnalysis(user?.id)
        console.log('🚀✅ Epic 2 evaluation completed:', evaluation.id, 'Status:', evaluation.status)
      } else {
        console.log('🚀 Using Epic 1 - Calling submitEvaluation()...')
        console.log('🚀 Passing Clerk user ID:', user?.id)
        evaluation = await submitEvaluation(user?.id)
        console.log('🚀✅ Epic 1 evaluation completed:', evaluation.id, 'Status:', evaluation.status)
      }
      
      console.log('🚀 Redirecting to results page...')
      router.push(`/evaluation/${evaluation.id}` as any)
    } catch (error) {
      console.error('🚀❌ Failed to submit evaluation:', error)
      console.error('🚀❌ Error details:', error)
      // Don't redirect on error, show user feedback
      alert(`Submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentStepInfo = steps.find(s => s.id === currentStep)
  const progress = (currentStep / totalSteps) * 100

  if (!isLoaded) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Loading...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!isSignedIn || !effectiveUser) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Please log in to access the business evaluation form.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Business Evaluation</CardTitle>
              <CardDescription>
                Step {currentStep} of {totalSteps}: {currentStepInfo?.title}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Progress</div>
              <div className="text-lg font-semibold">{Math.round(progress)}%</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 mt-4">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Step Indicators */}
          <div className="flex justify-between mt-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center space-x-2 text-sm ${
                  step.id <= currentStep ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    step.id < currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step.id === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.id < currentStep ? '✓' : step.id}
                </div>
                <span className="hidden sm:inline">{step.title}</span>
              </div>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Current Step Content */}
      <Card>
        <CardContent className="p-6">
          {getCurrentStepComponent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || isSubmitting}
            >
              Previous
            </Button>
            
            <div className="text-sm text-muted-foreground">
              Auto-saving progress...
            </div>
            
            {currentStep === totalSteps ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isLoading}
                className="min-w-[200px] bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
              >
                <span className="flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Analyzing Business...</span>
                    </>
                  ) : (
                    'Submit & View Results'
                  )}
                </span>
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={isLoading}
              >
                Next Step
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}