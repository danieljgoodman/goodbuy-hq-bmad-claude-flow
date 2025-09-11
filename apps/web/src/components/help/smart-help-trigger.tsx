'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useHelp } from '@/contexts/help-context'

interface SmartHelpTriggerProps {
  children: React.ReactNode
  monitorInteractions?: boolean
  debounceMs?: number
}

interface UserBehaviorPattern {
  repeatedActions: Map<string, number>
  errorEncounters: string[]
  timeSpentOnPage: number
  scrollPatterns: { position: number; timestamp: number }[]
  formInteractions: { field: string; duration: number; completed: boolean }[]
}

export default function SmartHelpTrigger({ 
  children, 
  monitorInteractions = true,
  debounceMs = 1000
}: SmartHelpTriggerProps) {
  const { trackUserAction, requestHelp } = useHelp()
  const behaviorRef = useRef<UserBehaviorPattern>({
    repeatedActions: new Map(),
    errorEncounters: [],
    timeSpentOnPage: 0,
    scrollPatterns: [],
    formInteractions: []
  })
  const timeoutRef = useRef<NodeJS.Timeout>()
  const pageStartTime = useRef<number>(Date.now())

  const analyzeUserBehavior = useCallback(() => {
    const behavior = behaviorRef.current
    const suggestions: string[] = []

    // Check for repeated actions (user might be confused)
    behavior.repeatedActions.forEach((count, action) => {
      if (count >= 3) {
        if (action.includes('click:industry')) {
          suggestions.push('industry-selection-help')
        } else if (action.includes('focus:ebitda') || action.includes('focus:revenue')) {
          suggestions.push('financial-metrics-help')
        }
      }
    })

    // Check for error encounters
    if (behavior.errorEncounters.length > 0) {
      suggestions.push('troubleshooting-help')
    }

    // Check for extended time on complex pages
    const timeSpent = (Date.now() - pageStartTime.current) / 1000
    if (timeSpent > 300 && window.location.pathname.includes('/evaluations/questionnaire')) {
      suggestions.push('evaluation-tour')
    }

    // Check for scroll patterns indicating confusion
    if (behavior.scrollPatterns.length > 10) {
      const recentScrolls = behavior.scrollPatterns.slice(-10)
      const scrollVariance = calculateScrollVariance(recentScrolls)
      if (scrollVariance > 0.5) {
        suggestions.push('dashboard-navigation')
      }
    }

    // Check for incomplete form interactions
    const incompleteFields = behavior.formInteractions.filter(
      interaction => !interaction.completed && interaction.duration > 30000
    )
    if (incompleteFields.length > 0) {
      suggestions.push('form-completion-help')
    }

    // Trigger suggestions
    suggestions.forEach(suggestionId => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        requestHelp(suggestionId)
      }, debounceMs)
    })
  }, [requestHelp, debounceMs])

  const calculateScrollVariance = (scrolls: { position: number; timestamp: number }[]) => {
    if (scrolls.length < 2) return 0
    
    const positions = scrolls.map(s => s.position)
    const mean = positions.reduce((a, b) => a + b, 0) / positions.length
    const variance = positions.reduce((acc, pos) => acc + Math.pow(pos - mean, 2), 0) / positions.length
    
    return Math.sqrt(variance) / (document.documentElement.scrollHeight || 1000)
  }

  const trackAction = useCallback((type: string, element?: string, data?: any) => {
    const behavior = behaviorRef.current
    const actionKey = element ? `${type}:${element}` : type

    // Update repeated actions counter
    behavior.repeatedActions.set(actionKey, (behavior.repeatedActions.get(actionKey) || 0) + 1)

    // Track user action in help context
    trackUserAction({
      type,
      element,
      context: window.location.pathname,
      timestamp: new Date()
    })

    // Special handling for different action types
    switch (type) {
      case 'error':
        behavior.errorEncounters.push(element || 'unknown')
        break
      case 'form_focus':
        const existingInteraction = behavior.formInteractions.find(i => i.field === element)
        if (!existingInteraction && element) {
          behavior.formInteractions.push({
            field: element,
            duration: 0,
            completed: false
          })
        }
        break
      case 'form_blur':
        const interaction = behavior.formInteractions.find(i => i.field === element)
        if (interaction) {
          interaction.completed = !!data?.value
          interaction.duration = data?.duration || 0
        }
        break
    }

    // Analyze behavior after each action (debounced)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(analyzeUserBehavior, debounceMs)
  }, [trackUserAction, analyzeUserBehavior, debounceMs])

  useEffect(() => {
    if (!monitorInteractions) return

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const elementId = target.id || target.dataset.element || target.className
      trackAction('click', elementId)
    }

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        const fieldName = target.name || target.id || target.dataset.field
        trackAction('form_focus', fieldName)
      }
    }

    const handleBlur = (e: FocusEvent) => {
      const target = e.target as HTMLInputElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        const fieldName = target.name || target.id || target.dataset.field
        trackAction('form_blur', fieldName, { 
          value: target.value,
          duration: Date.now() - pageStartTime.current
        })
      }
    }

    const handleScroll = () => {
      const position = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)
      behaviorRef.current.scrollPatterns.push({
        position,
        timestamp: Date.now()
      })

      // Keep only recent scroll patterns
      if (behaviorRef.current.scrollPatterns.length > 50) {
        behaviorRef.current.scrollPatterns = behaviorRef.current.scrollPatterns.slice(-30)
      }
    }

    const handleError = (e: ErrorEvent) => {
      trackAction('error', e.message || 'javascript_error')
    }

    const handleUnhandledRejection = (e: PromiseRejectionEvent) => {
      trackAction('error', 'promise_rejection')
    }

    // Add event listeners
    document.addEventListener('click', handleClick)
    document.addEventListener('focusin', handleFocus)
    document.addEventListener('focusout', handleBlur)
    document.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Track page visit duration
    const interval = setInterval(() => {
      behaviorRef.current.timeSpentOnPage = (Date.now() - pageStartTime.current) / 1000
    }, 5000)

    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('focusin', handleFocus)
      document.removeEventListener('focusout', handleBlur)
      document.removeEventListener('scroll', handleScroll)
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      clearInterval(interval)
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [monitorInteractions, trackAction])

  // Reset behavior tracking when pathname changes
  useEffect(() => {
    behaviorRef.current = {
      repeatedActions: new Map(),
      errorEncounters: [],
      timeSpentOnPage: 0,
      scrollPatterns: [],
      formInteractions: []
    }
    pageStartTime.current = Date.now()
  }, [typeof window !== 'undefined' ? window.location.pathname : ''])

  return <>{children}</>
}

// Hook for manual behavior tracking
export function useSmartHelpBehavior() {
  const { requestHelp, trackUserAction } = useHelp()

  const trackUserStruggle = useCallback((strugglerType: 'repeated_action' | 'form_difficulty' | 'navigation_confusion') => {
    let helpSuggestion: string

    switch (strugglerType) {
      case 'repeated_action':
        helpSuggestion = 'contextual-guidance'
        break
      case 'form_difficulty':
        helpSuggestion = 'form-completion-help'
        break
      case 'navigation_confusion':
        helpSuggestion = 'dashboard-navigation'
        break
    }

    requestHelp(helpSuggestion)
  }, [requestHelp])

  const trackSuccessfulAction = useCallback((actionType: string, element?: string) => {
    trackUserAction({
      type: `success:${actionType}`,
      element,
      context: window.location.pathname,
      timestamp: new Date()
    })
  }, [trackUserAction])

  const trackUserFrustration = useCallback((reason: string) => {
    trackUserAction({
      type: 'frustration',
      element: reason,
      context: window.location.pathname,
      timestamp: new Date()
    })
    
    // Trigger helpful contextual assistance
    requestHelp('general-assistance')
  }, [trackUserAction, requestHelp])

  return {
    trackUserStruggle,
    trackSuccessfulAction,
    trackUserFrustration
  }
}