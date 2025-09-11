'use client'

import { useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { X, Clock, CheckCircle } from 'lucide-react'
import { useOnboarding } from '@/contexts/onboarding-context'

export default function OnboardingModal() {
  const {
    state,
    currentStepInfo,
    nextStep,
    skipStep,
    completeStep,
    completeOnboarding
  } = useOnboarding()

  // Debug logging
  console.log('OnboardingModal render:', { 
    isActive: state.isActive, 
    isCompleted: state.isCompleted, 
    currentStepInfo: currentStepInfo?.title,
    currentStep: state.currentStep 
  })

  // Don't render if onboarding is not active or already completed
  if (!state.isActive || state.isCompleted || !currentStepInfo) {
    console.log('OnboardingModal: Not rendering because:', {
      isActive: state.isActive,
      isCompleted: state.isCompleted,
      hasCurrentStepInfo: !!currentStepInfo
    })
    return null
  }

  const progress = ((state.currentStep) / 4) * 100

  const handleClose = () => {
    // Save current progress but don't complete onboarding
    // User can resume later
    completeOnboarding()
  }

  const StepComponent = currentStepInfo.component

  return (
    <Dialog open={state.isActive} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-6xl w-full max-h-[85vh] overflow-hidden p-0 flex flex-col"
        // Prevent closing by clicking outside or pressing escape during critical steps
        onPointerDownOutside={(e) => {
          if (!currentStepInfo.skipAllowed) {
            e.preventDefault()
          }
        }}
        onEscapeKeyDown={(e) => {
          if (!currentStepInfo.skipAllowed) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">{currentStepInfo.title}</h2>
                <p className="text-sm text-muted-foreground">{currentStepInfo.description}</p>
              </div>
              {currentStepInfo.estimatedTime && (
                <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{currentStepInfo.estimatedTime}</span>
                </div>
              )}
            </div>
            
            {currentStepInfo.skipAllowed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 mt-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{state.currentStep + 1} of 4</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Step Navigation */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {Array.from({ length: 4 }, (_, index) => {
              const isCompleted = state.completedSteps.includes(`step-${index}`) || index < state.currentStep
              const isActive = index === state.currentStep
              const isSkipped = state.skippedSteps.includes(`step-${index}`)
              
              return (
                <div 
                  key={index}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    isCompleted 
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary/20'
                      : isSkipped
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
              )
            })}
          </div>
        </DialogHeader>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-2 min-h-0">
          <StepComponent
            onNext={nextStep}
            onSkip={currentStepInfo.skipAllowed ? skipStep : undefined}
            onComplete={completeStep}
            isActive={true}
          />
        </div>

        {/* Footer Controls */}
        {currentStepInfo.skipAllowed && (
          <div className="flex justify-between items-center p-6 pt-0 border-t bg-muted/30">
            <Button 
              variant="ghost" 
              onClick={skipStep}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip this step
            </Button>
            
            <div className="text-xs text-muted-foreground">
              You can return to complete this onboarding anytime from your profile
            </div>

            <Button variant="ghost" onClick={handleClose}>
              Save & Exit
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}