'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth-store'

interface DashboardWidget {
  id: string
  type: WidgetType
  title: string
  size: 'small' | 'medium' | 'large'
  position: { x: number; y: number; w: number; h: number }
  config: WidgetConfig
  requiredTier?: 'free' | 'premium'
  isVisible: boolean
}

interface DashboardLayout {
  userId: string
  layoutName: string
  widgets: DashboardWidget[]
  quickActions: QuickAction[]
  preferences: DashboardPreferences
  lastModified: Date
}

interface WidgetConfig {
  dataSource?: string
  timeRange?: 'week' | 'month' | 'quarter' | 'year'
  filters?: Record<string, any>
  displayOptions?: {
    showTitle?: boolean
    showBorder?: boolean
    theme?: 'light' | 'dark' | 'auto'
  }
}

interface DashboardPreferences {
  gridSize: number
  snapToGrid: boolean
  showWidgetBorders: boolean
  compactMode: boolean
  autoRefresh: boolean
  refreshInterval: number
}

interface QuickAction {
  id: string
  label: string
  icon: string
  href?: string
  onClick?: () => void
  keyboardShortcut?: string
  category: 'primary' | 'secondary' | 'contextual'
  requiredTier?: 'free' | 'premium'
  condition?: (user: any) => boolean
}

interface SmartSuggestion {
  type: string
  title: string
  description: string
  action: {
    href?: string
    onClick?: () => void
    label: string
  }
  priority: 'low' | 'medium' | 'high'
  dismissible: boolean
}

type WidgetType = 
  | 'evaluation_summary'
  | 'recent_activity'
  | 'business_metrics'
  | 'improvement_tracking'
  | 'progress_indicators'
  | 'quick_stats'
  | 'notification_center'
  | 'next_actions'

interface DashboardCustomizationContextType {
  layout: DashboardLayout
  isCustomizing: boolean
  smartSuggestions: SmartSuggestion[]
  setIsCustomizing: (customizing: boolean) => void
  updateWidgetPosition: (widgetId: string, newPosition: { x: number; y: number; w: number; h: number }) => void
  updateWidgetSize: (widgetId: string, newSize: 'small' | 'medium' | 'large') => void
  toggleWidgetVisibility: (widgetId: string) => void
  addWidget: (widgetType: WidgetType) => void
  removeWidget: (widgetId: string) => void
  updateQuickActions: (actions: QuickAction[]) => void
  resetToDefault: () => void
  saveLayout: () => Promise<void>
  loadPreset: (presetName: string) => void
  dismissSuggestion: (suggestionId: string) => void
}

const DashboardCustomizationContext = createContext<DashboardCustomizationContextType | undefined>(undefined)

// Default layouts for different user types
const getDefaultLayout = (userTier: string, isNewUser: boolean): DashboardLayout => {
  const baseWidgets: DashboardWidget[] = [
    {
      id: 'evaluation-summary',
      type: 'evaluation_summary',
      title: 'Business Valuations',
      size: 'large',
      position: { x: 0, y: 0, w: 2, h: 2 },
      config: { timeRange: 'month', displayOptions: { showTitle: true } },
      isVisible: true
    },
    {
      id: 'recent-activity',
      type: 'recent_activity',
      title: 'Recent Activity',
      size: 'medium',
      position: { x: 2, y: 0, w: 1, h: 2 },
      config: { displayOptions: { showTitle: true } },
      isVisible: true
    },
    {
      id: 'quick-stats',
      type: 'quick_stats',
      title: 'Quick Stats',
      size: 'small',
      position: { x: 0, y: 2, w: 1, h: 1 },
      config: { displayOptions: { showTitle: true } },
      isVisible: true
    }
  ]

  if (userTier !== 'FREE') {
    baseWidgets.push({
      id: 'improvement-tracking',
      type: 'improvement_tracking',
      title: 'Improvement Progress',
      size: 'medium',
      position: { x: 1, y: 2, w: 2, h: 1 },
      config: { timeRange: 'quarter', displayOptions: { showTitle: true } },
      requiredTier: 'premium',
      isVisible: true
    })
  }

  if (isNewUser) {
    baseWidgets.push({
      id: 'next-actions',
      type: 'next_actions',
      title: 'Recommended Actions',
      size: 'medium',
      position: { x: 0, y: 3, w: 2, h: 1 },
      config: { displayOptions: { showTitle: true } },
      isVisible: true
    })
  }

  return {
    userId: '',
    layoutName: 'default',
    widgets: baseWidgets,
    quickActions: getDefaultQuickActions(userTier),
    preferences: {
      gridSize: 12,
      snapToGrid: true,
      showWidgetBorders: true,
      compactMode: false,
      autoRefresh: true,
      refreshInterval: 300000 // 5 minutes
    },
    lastModified: new Date()
  }
}

const getDefaultQuickActions = (userTier: string): QuickAction[] => {
  const baseActions: QuickAction[] = [
    {
      id: 'new_evaluation',
      label: 'New Evaluation',
      icon: 'Plus',
      href: '/evaluations/new',
      keyboardShortcut: 'Cmd+N',
      category: 'primary'
    },
    {
      id: 'view_history',
      label: 'View History',
      icon: 'Clock',
      href: '/evaluations/history',
      keyboardShortcut: 'Cmd+H',
      category: 'primary'
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'Home',
      href: '/dashboard',
      keyboardShortcut: 'Cmd+D',
      category: 'secondary'
    }
  ]

  if (userTier !== 'FREE') {
    baseActions.push({
      id: 'implementation_guides',
      label: 'Implementation Guides',
      icon: 'BookOpen',
      href: '/improvements/guides',
      category: 'secondary',
      requiredTier: 'premium'
    })
  }

  return baseActions
}

const STORAGE_KEY = 'dashboard-customization'

export function DashboardCustomizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthStore()
  
  const [layout, setLayout] = useState<DashboardLayout>(
    getDefaultLayout(user?.tier || 'FREE', true)
  )
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([])

  // Load layout from localStorage on mount
  useEffect(() => {
    const savedLayout = localStorage.getItem(STORAGE_KEY)
    if (savedLayout && user) {
      try {
        const parsed = JSON.parse(savedLayout)
        if (parsed.userId === user.id) {
          setLayout({
            ...parsed,
            lastModified: new Date(parsed.lastModified)
          })
        }
      } catch (error) {
        console.error('Error loading dashboard layout:', error)
      }
    }
  }, [user])

  // Save layout to localStorage whenever it changes
  const saveLayout = useCallback(async () => {
    if (user) {
      const layoutToSave = {
        ...layout,
        userId: user.id,
        lastModified: new Date()
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layoutToSave))
      setLayout(layoutToSave)
      
      // In a real app, this would also save to the backend
      console.log('Dashboard layout saved')
    }
  }, [layout, user])

  // Generate smart suggestions based on user activity
  const generateSmartSuggestions = useCallback(() => {
    if (!user) return []

    const suggestions: SmartSuggestion[] = []

    // Suggestion for new users
    const daysSinceSignup = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceSignup <= 7) {
      suggestions.push({
        type: 'new_user_guidance',
        title: 'Complete Your First Evaluation',
        description: 'Get started by creating your first business valuation to see the full power of our platform.',
        action: {
          href: '/evaluations/new',
          label: 'Start Evaluation'
        },
        priority: 'high',
        dismissible: true
      })
    }

    // Premium upgrade suggestion for free users
    if (user.tier === 'FREE' && daysSinceSignup > 14) {
      suggestions.push({
        type: 'premium_upgrade',
        title: 'Unlock Advanced Features',
        description: 'Upgrade to Premium for implementation guides, progress tracking, and expert insights.',
        action: {
          href: '/pricing',
          label: 'View Plans'
        },
        priority: 'medium',
        dismissible: true
      })
    }

    // Regular evaluation reminder
    // In a real app, this would check actual evaluation history
    suggestions.push({
      type: 'evaluation_reminder',
      title: 'Time for a Progress Check',
      description: 'It\'s been a while since your last evaluation. Track your business progress with a fresh analysis.',
      action: {
        href: '/evaluations/new',
        label: 'New Evaluation'
      },
      priority: 'low',
      dismissible: true
    })

    return suggestions
  }, [user])

  // Update smart suggestions when user changes
  useEffect(() => {
    setSmartSuggestions(generateSmartSuggestions())
  }, [generateSmartSuggestions])

  const updateWidgetPosition = useCallback((widgetId: string, newPosition: { x: number; y: number; w: number; h: number }) => {
    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets.map(widget =>
        widget.id === widgetId ? { ...widget, position: newPosition } : widget
      )
    }))
  }, [])

  const updateWidgetSize = useCallback((widgetId: string, newSize: 'small' | 'medium' | 'large') => {
    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets.map(widget =>
        widget.id === widgetId ? { ...widget, size: newSize } : widget
      )
    }))
  }, [])

  const toggleWidgetVisibility = useCallback((widgetId: string) => {
    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets.map(widget =>
        widget.id === widgetId ? { ...widget, isVisible: !widget.isVisible } : widget
      )
    }))
  }, [])

  const addWidget = useCallback((widgetType: WidgetType) => {
    const newWidget: DashboardWidget = {
      id: `${widgetType}-${Date.now()}`,
      type: widgetType,
      title: widgetType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      size: 'medium',
      position: { x: 0, y: 0, w: 1, h: 1 }, // Grid layout system will auto-place
      config: { displayOptions: { showTitle: true } },
      isVisible: true
    }

    setLayout(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget]
    }))
  }, [])

  const removeWidget = useCallback((widgetId: string) => {
    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets.filter(widget => widget.id !== widgetId)
    }))
  }, [])

  const updateQuickActions = useCallback((actions: QuickAction[]) => {
    setLayout(prev => ({
      ...prev,
      quickActions: actions
    }))
  }, [])

  const resetToDefault = useCallback(() => {
    const defaultLayout = getDefaultLayout(user?.tier || 'FREE', false)
    setLayout(defaultLayout)
  }, [user])

  const loadPreset = useCallback((presetName: string) => {
    let presetLayout: DashboardLayout

    switch (presetName) {
      case 'new-user':
        presetLayout = getDefaultLayout(user?.tier || 'FREE', true)
        break
      case 'power-user':
        presetLayout = {
          ...getDefaultLayout(user?.tier || 'FREE', false),
          widgets: getDefaultLayout(user?.tier || 'FREE', false).widgets.map(w => ({ 
            ...w, 
            size: 'small' as const
          }))
        }
        break
      default:
        presetLayout = getDefaultLayout(user?.tier || 'FREE', false)
    }

    setLayout(presetLayout)
  }, [user])

  const dismissSuggestion = useCallback((suggestionId: string) => {
    setSmartSuggestions(prev => 
      prev.filter(suggestion => suggestion.type !== suggestionId)
    )
  }, [])

  const value: DashboardCustomizationContextType = {
    layout,
    isCustomizing,
    smartSuggestions,
    setIsCustomizing,
    updateWidgetPosition,
    updateWidgetSize,
    toggleWidgetVisibility,
    addWidget,
    removeWidget,
    updateQuickActions,
    resetToDefault,
    saveLayout,
    loadPreset,
    dismissSuggestion
  }

  return (
    <DashboardCustomizationContext.Provider value={value}>
      {children}
    </DashboardCustomizationContext.Provider>
  )
}

export function useDashboardCustomization() {
  const context = useContext(DashboardCustomizationContext)
  if (context === undefined) {
    throw new Error('useDashboardCustomization must be used within a DashboardCustomizationProvider')
  }
  return context
}

export type { DashboardWidget, DashboardLayout, QuickAction, SmartSuggestion, WidgetType }