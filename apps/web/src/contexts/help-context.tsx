'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'

interface HelpItem {
  id: string
  title: string
  content: string
  type: 'tooltip' | 'popover' | 'article' | 'video' | 'tour'
  trigger: HelpTrigger
  targeting: HelpTargeting
  priority: 'low' | 'medium' | 'high'
  version: string
}

interface HelpTrigger {
  context: string[]
  userActions?: string[]
  userState?: HelpUserState
  timing?: 'immediate' | 'delayed' | 'on-demand'
}

interface HelpTargeting {
  elementSelector?: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  alignment?: 'start' | 'center' | 'end'
  offset?: { x: number; y: number }
}

interface HelpUserState {
  subscriptionTier?: 'free' | 'premium'
  onboardingCompleted?: boolean
  experienceLevel?: 'new' | 'returning' | 'expert'
  lastHelpInteraction?: Date
}

interface HelpInteraction {
  type: 'viewed' | 'dismissed' | 'helpful' | 'not_helpful'
  helpful?: boolean
  context: string
  userTier: string
}

interface UserAction {
  type: string
  element?: string
  context: string
  timestamp: Date
}

interface HelpContextType {
  activeHelp: HelpItem[]
  requestHelp: (helpId: string) => void
  dismissHelp: (helpId: string) => void
  trackUserAction: (action: UserAction) => void
  isHelpVisible: (helpId: string) => boolean
  getContextualHelp: (context: string) => HelpItem[]
  trackHelpInteraction: (helpId: string, interaction: HelpInteraction) => void
}

const HelpContext = createContext<HelpContextType | undefined>(undefined)

// Contextual help items configuration
const contextualHelpItems: HelpItem[] = [
  {
    id: 'ebitda-explanation',
    title: 'Understanding EBITDA',
    content: 'EBITDA (Earnings Before Interest, Taxes, Depreciation, and Amortization) helps us calculate your business\'s core profitability by excluding one-time expenses and focusing on operational performance.',
    type: 'tooltip',
    trigger: {
      context: ['/evaluations/questionnaire', '/onboarding'],
      userActions: ['focus:ebitda-field', 'hover:ebitda-label']
    },
    targeting: {
      elementSelector: '[data-field="ebitda"]',
      position: 'right',
      alignment: 'start'
    },
    priority: 'high',
    version: '1.0'
  },
  {
    id: 'revenue-multiple-explanation',
    title: 'Revenue Multiples in Valuation',
    content: 'Revenue multiples compare your business to similar companies that have sold. Industry-specific multiples help determine market value based on your annual revenue.',
    type: 'tooltip',
    trigger: {
      context: ['/evaluations/questionnaire'],
      userActions: ['focus:revenue-field', 'hover:revenue-multiple']
    },
    targeting: {
      elementSelector: '[data-field="revenue"]',
      position: 'bottom',
      alignment: 'center'
    },
    priority: 'high',
    version: '1.0'
  },
  {
    id: 'industry-selection-help',
    title: 'Choosing Your Industry',
    content: 'Select the industry that best matches your primary business activity. This affects valuation multiples and benchmarks used in your analysis.',
    type: 'popover',
    trigger: {
      context: ['/evaluations/questionnaire', '/onboarding'],
      userActions: ['click:industry-dropdown', 'focus:industry-field']
    },
    targeting: {
      elementSelector: '[data-field="industry"]',
      position: 'right',
      alignment: 'start'
    },
    priority: 'medium',
    version: '1.0'
  },
  {
    id: 'evaluation-tour',
    title: 'Business Evaluation Walkthrough',
    content: 'Let us guide you through creating your first business evaluation. We\'ll explain each step and help you provide accurate information.',
    type: 'tour',
    trigger: {
      context: ['/evaluations/new', '/onboarding'],
      userState: {
        onboardingCompleted: false,
        experienceLevel: 'new'
      }
    },
    targeting: {
      position: 'center'
    },
    priority: 'medium',
    version: '1.0'
  },
  {
    id: 'premium-features-help',
    title: 'Unlock Advanced Features',
    content: 'Premium subscribers get access to implementation guides, progress tracking, detailed improvement recommendations, and priority support.',
    type: 'popover',
    trigger: {
      context: ['/dashboard', '/improvements'],
      userState: {
        subscriptionTier: 'free'
      },
      userActions: ['click:premium-feature', 'hover:upgrade-prompt']
    },
    targeting: {
      position: 'bottom',
      alignment: 'center'
    },
    priority: 'medium',
    version: '1.0'
  },
  {
    id: 'financial-health-score',
    title: 'Financial Health Score Explained',
    content: 'Your financial health score (0-100) evaluates cash flow, profitability, debt levels, and growth trends. Higher scores indicate stronger financial position.',
    type: 'tooltip',
    trigger: {
      context: ['/dashboard', '/evaluations/results'],
      userActions: ['hover:health-score', 'click:health-score-info']
    },
    targeting: {
      elementSelector: '[data-element="health-score"]',
      position: 'top',
      alignment: 'center'
    },
    priority: 'high',
    version: '1.0'
  },
  {
    id: 'improvement-opportunities',
    title: 'Understanding Improvement Opportunities',
    content: 'These recommendations are based on analysis of your business data and industry benchmarks. Focus on high-impact areas first for maximum value increase.',
    type: 'popover',
    trigger: {
      context: ['/evaluations/results', '/improvements'],
      userActions: ['click:opportunities-section']
    },
    targeting: {
      elementSelector: '[data-section="opportunities"]',
      position: 'left',
      alignment: 'start'
    },
    priority: 'medium',
    version: '1.0'
  },
  {
    id: 'dashboard-navigation',
    title: 'Dashboard Navigation Guide',
    content: 'Your dashboard shows key metrics, recent evaluations, and improvement tracking. Use the sidebar to access different sections of the platform.',
    type: 'article',
    trigger: {
      context: ['/dashboard'],
      userState: {
        experienceLevel: 'new'
      },
      timing: 'delayed'
    },
    targeting: {
      position: 'center'
    },
    priority: 'low',
    version: '1.0'
  }
]

const HELP_STORAGE_KEY = 'help-preferences'
const HELP_INTERACTION_DEBOUNCE = 300

export function HelpProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthStore()
  const pathname = usePathname()
  
  const [activeHelp, setActiveHelp] = useState<HelpItem[]>([])
  const [dismissedHelp, setDismissedHelp] = useState<string[]>([])
  const [userActions, setUserActions] = useState<UserAction[]>([])

  // Load dismissed help items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(HELP_STORAGE_KEY)
    if (saved && user) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.userId === user.id) {
          setDismissedHelp(parsed.dismissedHelp || [])
        }
      } catch (error) {
        console.error('Error loading help preferences:', error)
      }
    }
  }, [user])

  // Save dismissed help items to localStorage
  useEffect(() => {
    if (user && dismissedHelp.length > 0) {
      localStorage.setItem(HELP_STORAGE_KEY, JSON.stringify({
        userId: user.id,
        dismissedHelp,
        lastUpdated: new Date()
      }))
    }
  }, [dismissedHelp, user])

  const getUserState = useCallback((): HelpUserState => {
    if (!user) return {}
    
    return {
      subscriptionTier: user.tier === 'FREE' ? 'free' : 'premium',
      onboardingCompleted: true, // This would come from onboarding context
      experienceLevel: 'returning' // This would be determined by user activity
    }
  }, [user])

  const filterHelpByContext = useCallback((context: string, userState: HelpUserState): HelpItem[] => {
    return contextualHelpItems.filter(item => {
      // Check if context matches
      const contextMatch = item.trigger.context.some(ctx => 
        context.includes(ctx) || ctx === '*'
      )
      if (!contextMatch) return false

      // Check if help item was dismissed
      if (dismissedHelp.includes(item.id)) return false

      // Check user state conditions
      if (item.trigger.userState) {
        const state = item.trigger.userState
        if (state.subscriptionTier && userState.subscriptionTier !== state.subscriptionTier) {
          return false
        }
        if (state.onboardingCompleted !== undefined && userState.onboardingCompleted !== state.onboardingCompleted) {
          return false
        }
        if (state.experienceLevel && userState.experienceLevel !== state.experienceLevel) {
          return false
        }
      }

      return true
    })
  }, [dismissedHelp])

  const getContextualHelp = useCallback((context: string): HelpItem[] => {
    const userState = getUserState()
    return filterHelpByContext(context, userState)
  }, [filterHelpByContext, getUserState])

  const requestHelp = useCallback((helpId: string) => {
    const helpItem = contextualHelpItems.find(item => item.id === helpId)
    if (helpItem && !activeHelp.some(item => item.id === helpId)) {
      setActiveHelp(prev => [...prev, helpItem])
      
      // Track help request
      trackHelpInteraction(helpId, {
        type: 'viewed',
        context: pathname,
        userTier: user?.tier || 'FREE'
      })
    }
  }, [activeHelp, pathname, user])

  const dismissHelp = useCallback((helpId: string) => {
    setActiveHelp(prev => prev.filter(item => item.id !== helpId))
    setDismissedHelp(prev => [...prev, helpId])
    
    // Track dismissal
    trackHelpInteraction(helpId, {
      type: 'dismissed',
      context: pathname,
      userTier: user?.tier || 'FREE'
    })
  }, [pathname, user])

  const trackUserAction = useCallback((action: UserAction) => {
    setUserActions(prev => [...prev.slice(-20), action]) // Keep last 20 actions

    // Check if this action should trigger contextual help
    const relevantHelp = contextualHelpItems.filter(item => 
      item.trigger.userActions?.some(triggerAction => {
        const [actionType, elementId] = triggerAction.split(':')
        return action.type === actionType && 
               (!elementId || action.element === elementId)
      })
    )

    relevantHelp.forEach(helpItem => {
      if (!activeHelp.some(item => item.id === helpItem.id) && 
          !dismissedHelp.includes(helpItem.id)) {
        
        // Add slight delay for better UX
        setTimeout(() => {
          requestHelp(helpItem.id)
        }, HELP_INTERACTION_DEBOUNCE)
      }
    })
  }, [activeHelp, dismissedHelp, requestHelp])

  const isHelpVisible = useCallback((helpId: string): boolean => {
    return activeHelp.some(item => item.id === helpId)
  }, [activeHelp])

  const trackHelpInteraction = useCallback((helpId: string, interaction: HelpInteraction) => {
    // Analytics tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'help_interaction', {
        event_category: 'help_system',
        event_label: helpId,
        interaction_type: interaction.type,
        helpful: interaction.helpful,
        context: interaction.context,
        user_tier: interaction.userTier
      })
    }
  }, [])

  // Auto-load contextual help when pathname changes
  useEffect(() => {
    const userState = getUserState()
    const contextualHelp = filterHelpByContext(pathname, userState)
    
    // Only show immediate help items
    const immediateHelp = contextualHelp.filter(item => 
      item.trigger.timing === 'immediate' || !item.trigger.timing
    )
    
    setActiveHelp(prev => {
      const existingIds = prev.map(item => item.id)
      const newItems = immediateHelp.filter(item => !existingIds.includes(item.id))
      return [...prev, ...newItems]
    })

    // Show delayed help items
    const delayedHelp = contextualHelp.filter(item => 
      item.trigger.timing === 'delayed'
    )
    
    if (delayedHelp.length > 0) {
      setTimeout(() => {
        setActiveHelp(prev => {
          const existingIds = prev.map(item => item.id)
          const newItems = delayedHelp.filter(item => !existingIds.includes(item.id))
          return [...prev, ...newItems]
        })
      }, 3000) // 3 second delay for non-intrusive help
    }
  }, [pathname, getUserState, filterHelpByContext])

  const value: HelpContextType = {
    activeHelp,
    requestHelp,
    dismissHelp,
    trackUserAction,
    isHelpVisible,
    getContextualHelp,
    trackHelpInteraction
  }

  return (
    <HelpContext.Provider value={value}>
      {children}
    </HelpContext.Provider>
  )
}

export function useHelp() {
  const context = useContext(HelpContext)
  if (context === undefined) {
    throw new Error('useHelp must be used within a HelpProvider')
  }
  return context
}

export { contextualHelpItems, type HelpItem, type HelpUserState, type HelpInteraction }