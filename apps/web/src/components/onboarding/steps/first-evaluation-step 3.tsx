'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, ArrowRight, PlayCircle, FileText, BarChart3, Target } from 'lucide-react'
import { OnboardingStepProps } from '@/contexts/onboarding-context'

interface EvaluationStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  estimatedTime: string
  tips: string[]
}

const evaluationSteps: EvaluationStep[] = [
  {
    id: 'business-basics',
    title: 'Business Basics',
    description: 'Tell us about your business fundamentals',
    icon: FileText,
    estimatedTime: '3-4 min',
    tips: [
      'Be as accurate as possible with revenue figures',
      'Include all revenue streams',
      'Consider seasonal variations'
    ]
  },
  {
    id: 'financial-details',
    title: 'Financial Details', 
    description: 'Share key financial metrics and performance',
    icon: BarChart3,
    estimatedTime: '4-5 min',
    tips: [
      'Use your most recent financial statements',
      'Include both revenue and expenses',
      'Don\'t worry about perfect precision'
    ]
  },
  {
    id: 'growth-factors',
    title: 'Growth & Market',
    description: 'Describe your market position and growth plans',
    icon: Target,
    estimatedTime: '3-4 min',
    tips: [
      'Consider your competitive advantages',
      'Think about market trends',
      'Include planned expansions or changes'
    ]
  }
]

export default function FirstEvaluationStep({ onNext, onSkip, onComplete, isActive }: OnboardingStepProps) {
  const router = useRouter()
  const [startedEvaluation, setStartedEvaluation] = useState(false)
  const [completedQuestionnaire, setCompletedQuestionnaire] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const canProceed = startedEvaluation && completedQuestionnaire

  const handleStartEvaluation = () => {
    setStartedEvaluation(true)
    
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'onboarding_evaluation_started', {
        event_category: 'onboarding',
        event_label: 'first_evaluation'
      })
    }
  }

  const handleStepComplete = (stepId: string) => {
    if (stepId === 'growth-factors') {
      setCompletedQuestionnaire(true)
      
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'onboarding_questionnaire_completed', {
          event_category: 'onboarding',
          event_label: 'first_evaluation'
        })
      }
    }
  }

  const handleProceedToEvaluation = () => {
    // Mark as completed and redirect to actual evaluation
    onComplete(['started_evaluation', 'completed_questionnaire'])
    router.push('/onboarding')
  }

  const handleComplete = () => {
    onComplete(['started_evaluation', 'completed_questionnaire'])
  }

  const handleSkip = () => {
    if (onSkip) onSkip()
  }

  const nextPreviewStep = () => {
    if (currentStep < evaluationSteps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleStepComplete(evaluationSteps[currentStep].id)
    }
  }

  useEffect(() => {
    if (canProceed) {
      const timer = setTimeout(() => {
        handleComplete()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [canProceed])

  if (!isActive) return null

  const currentEvalStep = evaluationSteps[currentStep]
  const progress = ((currentStep + 1) / evaluationSteps.length) * 100

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <PlayCircle className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          Create Your First Evaluation
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Let's walk through creating your first business valuation. This guided experience will show you exactly what to expect.
        </p>
      </div>

      {!startedEvaluation ? (
        /* Pre-Evaluation Overview */
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>What to Expect</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {evaluationSteps.map((step, index) => (
                  <div key={step.id} className="text-center space-y-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                      <step.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      <p className="text-xs text-primary font-medium mt-1">{step.estimatedTime}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Why This Matters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">✓ Accurate Valuation</h4>
                  <p className="text-sm text-muted-foreground">
                    Our AI analyzes 50+ factors to give you a comprehensive business valuation
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-600 mb-2">✓ Improvement Insights</h4>
                  <p className="text-sm text-muted-foreground">
                    Get specific recommendations to increase your business value
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-600 mb-2">✓ Track Progress</h4>
                  <p className="text-sm text-muted-foreground">
                    Monitor how changes impact your valuation over time
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-600 mb-2">✓ Expert Guidance</h4>
                  <p className="text-sm text-muted-foreground">
                    Access professional-grade analysis typically reserved for larger companies
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button onClick={handleStartEvaluation} size="lg" className="gap-2">
              <PlayCircle className="w-5 h-5" />
              Start Guided Evaluation
            </Button>
          </div>
        </div>
      ) : (
        /* Evaluation Preview/Walkthrough */
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <currentEvalStep.icon className="w-5 h-5" />
                  {currentEvalStep.title}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  Step {currentStep + 1} of {evaluationSteps.length}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Progress value={progress} className="w-full" />
              
              <div>
                <h4 className="font-semibold mb-2">{currentEvalStep.description}</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Estimated time: {currentEvalStep.estimatedTime}
                </p>
                
                <div className="bg-muted/50 rounded-lg p-4">
                  <h5 className="font-medium mb-3 text-sm">💡 Pro Tips:</h5>
                  <ul className="space-y-2">
                    {currentEvalStep.tips.map((tip, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Sample Form Preview */}
              <div className="border rounded-lg p-4 bg-muted/20">
                <p className="text-sm font-medium mb-3">Sample Questions for this section:</p>
                <div className="space-y-3">
                  {currentEvalStep.id === 'business-basics' && (
                    <>
                      <div className="text-sm">• What industry is your business in?</div>
                      <div className="text-sm">• What is your annual revenue?</div>
                      <div className="text-sm">• How many employees do you have?</div>
                    </>
                  )}
                  {currentEvalStep.id === 'financial-details' && (
                    <>
                      <div className="text-sm">• What are your monthly operating expenses?</div>
                      <div className="text-sm">• What is your profit margin?</div>
                      <div className="text-sm">• How much cash do you typically keep on hand?</div>
                    </>
                  )}
                  {currentEvalStep.id === 'growth-factors' && (
                    <>
                      <div className="text-sm">• What is your main competitive advantage?</div>
                      <div className="text-sm">• Are you planning any expansion in the next 12 months?</div>
                      <div className="text-sm">• How would you rate your market's growth potential?</div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                  disabled={currentStep === 0}
                >
                  Previous Section
                </Button>

                <Button onClick={nextPreviewStep}>
                  {currentStep === evaluationSteps.length - 1 ? 'Complete Preview' : 'Next Section'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={handleSkip}>
          Skip This Step
        </Button>

        {canProceed && (
          <div className="space-x-3">
            <Button variant="outline" onClick={handleComplete}>
              Continue Tutorial
            </Button>
            <Button onClick={handleProceedToEvaluation} className="gap-2">
              Start Real Evaluation
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="text-center text-sm text-muted-foreground">
        Step 3 of 4 • Estimated time: 10-15 minutes
      </div>
    </div>
  )
}