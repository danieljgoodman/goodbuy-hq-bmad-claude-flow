'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuthStore } from '@/stores/auth-store'

interface OnboardingStep {
  id: string
  title: string
  description: string
  component: React.ComponentType<OnboardingStepProps>
  completionCriteria: string[]
  skipAllowed: boolean
  estimatedTime: string
}

interface OnboardingStepProps {
  onNext: () => void
  onSkip?: () => void
  onComplete: (criteria: string[]) => void
  isActive: boolean
}

interface OnboardingState {
  currentStep: number
  completedSteps: string[]
  skippedSteps: string[]
  isActive: boolean
  isCompleted: boolean
  lastActiveDate: Date
  totalTimeSpent: number
  startedAt?: Date
}

interface OnboardingContextType {
  state: OnboardingState
  currentStepInfo: OnboardingStep | null
  startOnboarding: () => void
  nextStep: () => void
  skipStep: () => void
  completeStep: (criteria: string[]) => void
  completeOnboarding: () => void
  resetOnboarding: () => void
  isStepCompleted: (stepId: string) => boolean
  canProceedToStep: (stepIndex: number) => boolean
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

// Import onboarding step components (these will be created)
import WelcomeStep from '@/components/onboarding/steps/welcome-step'
import DashboardTourStep from '@/components/onboarding/steps/dashboard-tour-step' 
import FirstEvaluationStep from '@/components/onboarding/steps/first-evaluation-step'
import NextStepsStep from '@/components/onboarding/steps/next-steps-step'

const onboardingFlow: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Business Valuation AI',
    description: 'Discover how to get accurate business valuations',
    component: WelcomeStep,
    completionCriteria: ['watched_overview', 'viewed_examples'],
    skipAllowed: false,
    estimatedTime: '2-3 minutes'
  },
  {
    id: 'dashboard_tour',
    title: 'Your Dashboard Tour',
    description: 'Learn to navigate your business insights',
    component: DashboardTourStep,
    completionCriteria: ['toured_dashboard', 'understood_navigation'],
    skipAllowed: true,
    estimatedTime: '2 minutes'
  },
  {
    id: 'first_evaluation',
    title: 'Create Your First Evaluation',
    description: 'Get your business valuation with guided assistance',
    component: FirstEvaluationStep,
    completionCriteria: ['started_evaluation', 'completed_questionnaire'],
    skipAllowed: true,
    estimatedTime: '10-15 minutes'
  },
  {
    id: 'next_steps',
    title: 'Maximize Your Business Value',
    description: 'Explore improvement opportunities and tracking',
    component: NextStepsStep,
    completionCriteria: ['viewed_improvements', 'understood_premium'],
    skipAllowed: true,
    estimatedTime: '3-4 minutes'
  }
]

const STORAGE_KEY = 'onboarding-progress'

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthStore()
  
  const [state, setState] = useState<OnboardingState>({
    currentStep: 0,
    completedSteps: [],
    skippedSteps: [],
    isActive: false,
    isCompleted: false,
    lastActiveDate: new Date(),
    totalTimeSpent: 0
  })

  // Load onboarding state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY)
    if (savedState && user) {
      try {
        const parsed = JSON.parse(savedState)
        if (parsed.userId === user.id) {
          setState(prev => ({
            ...prev,
            ...parsed.state,
            lastActiveDate: new Date(parsed.state.lastActiveDate)
          }))
        }
      } catch (error) {
        console.error('Error loading onboarding state:', error)
      }
    }
  }, [user])

  // Save onboarding state to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        userId: user.id,
        state,
        lastUpdated: new Date()
      }))
    }
  }, [state, user])

  // Auto-trigger onboarding for new users (DISABLED)
  // useEffect(() => {
  //   if (user && !state.isCompleted && !state.isActive && state.completedSteps.length === 0) {
  //     // Check if user is new (created in last 24 hours) or has never completed onboarding
  //     const userCreatedAt = new Date(user.createdAt)
  //     const daysSinceCreation = (Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
      
  //     if (daysSinceCreation < 7) { // Trigger for users created within a week
  //       setTimeout(() => {
  //         startOnboarding()
  //       }, 2000) // Small delay to allow UI to settle
  //     }
  //   }
  // }, [user])

  const startOnboarding = () => {
    console.log('startOnboarding called - current state:', state)
    setState(prev => {
      const newState = {
        ...prev,
        isActive: true,
        startedAt: new Date(),
        currentStep: 0,
        lastActiveDate: new Date()
      }
      console.log('startOnboarding - setting new state:', newState)
      return newState
    })
    
    // Analytics tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'onboarding_started', {
        event_category: 'user_engagement',
        event_label: 'onboarding_flow'
      })
    }
  }

  const nextStep = () => {
    setState(prev => {
      const nextStepIndex = prev.currentStep + 1
      if (nextStepIndex >= onboardingFlow.length) {
        return completeOnboardingState(prev)
      }
      
      return {
        ...prev,
        currentStep: nextStepIndex,
        lastActiveDate: new Date()
      }
    })
  }

  const skipStep = () => {
    const currentStepInfo = onboardingFlow[state.currentStep]
    if (!currentStepInfo?.skipAllowed) return

    setState(prev => ({
      ...prev,
      skippedSteps: [...prev.skippedSteps, currentStepInfo.id],
      lastActiveDate: new Date()
    }))
    
    nextStep()
    
    // Analytics tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'onboarding_step_skipped', {
        event_category: 'user_engagement',
        event_label: currentStepInfo.id
      })
    }
  }

  const completeStep = (criteria: string[]) => {
    const currentStepInfo = onboardingFlow[state.currentStep]
    if (!currentStepInfo) return

    setState(prev => ({
      ...prev,
      completedSteps: [...prev.completedSteps, currentStepInfo.id],
      lastActiveDate: new Date()
    }))
    
    // Analytics tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'onboarding_step_completed', {
        event_category: 'user_engagement',
        event_label: currentStepInfo.id,
        value: criteria.length
      })
    }
    
    nextStep()
  }

  const completeOnboardingState = (prevState: OnboardingState): OnboardingState => {
    // Analytics tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'onboarding_completed', {
        event_category: 'user_engagement',
        event_label: 'full_flow',
        value: prevState.completedSteps.length
      })
    }
    
    return {
      ...prevState,
      isActive: false,
      isCompleted: true,
      lastActiveDate: new Date()
    }
  }

  const completeOnboarding = () => {
    setState(prev => completeOnboardingState(prev))
  }

  const resetOnboarding = () => {
    setState({
      currentStep: 0,
      completedSteps: [],
      skippedSteps: [],
      isActive: false,
      isCompleted: false,
      lastActiveDate: new Date(),
      totalTimeSpent: 0
    })
    localStorage.removeItem(STORAGE_KEY)
  }

  const isStepCompleted = (stepId: string): boolean => {
    return state.completedSteps.includes(stepId)
  }

  const canProceedToStep = (stepIndex: number): boolean => {
    if (stepIndex === 0) return true
    
    // User can proceed if previous step is completed or skipped
    const prevStep = onboardingFlow[stepIndex - 1]
    return prevStep ? (
      isStepCompleted(prevStep.id) || 
      state.skippedSteps.includes(prevStep.id)
    ) : false
  }

  const currentStepInfo = onboardingFlow[state.currentStep] || null

  const value: OnboardingContextType = {
    state,
    currentStepInfo,
    startOnboarding,
    nextStep,
    skipStep,
    completeStep,
    completeOnboarding,
    resetOnboarding,
    isStepCompleted,
    canProceedToStep
  }

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}

export { onboardingFlow, type OnboardingStep, type OnboardingStepProps }