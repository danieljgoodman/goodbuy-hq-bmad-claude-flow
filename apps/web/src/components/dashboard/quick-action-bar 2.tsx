'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { 
  Search,
  Plus, 
  Clock, 
  Home, 
  Settings,
  BookOpen,
  BarChart3,
  User,
  HelpCircle,
  Zap,
  ChevronDown
} from 'lucide-react'
import { useDashboardCustomization, QuickAction } from '@/contexts/dashboard-customization-context'
import { useAuthStore } from '@/stores/auth-store'

interface SearchResult {
  id: string
  title: string
  description?: string
  href: string
  type: 'evaluation' | 'improvement' | 'help' | 'page' | 'action'
  icon: React.ComponentType<{ className?: string }>
  recent?: boolean
}

// Sample search data - in real app this would come from APIs
const searchData: SearchResult[] = [
  {
    id: 'new-evaluation',
    title: 'Create New Evaluation',
    description: 'Start a new business valuation',
    href: '/evaluations/new',
    type: 'action',
    icon: Plus
  },
  {
    id: 'evaluation-history',
    title: 'Evaluation History',
    description: 'View past business evaluations',
    href: '/evaluations/history',
    type: 'page',
    icon: Clock
  },
  {
    id: 'business-metrics',
    title: 'Business Metrics Guide',
    description: 'Understanding EBITDA, revenue multiples',
    href: '/help/business-metrics',
    type: 'help',
    icon: HelpCircle
  },
  {
    id: 'improvement-opportunities',
    title: 'Improvement Opportunities',
    description: 'Ways to increase business value',
    href: '/improvements',
    type: 'improvement',
    icon: BarChart3
  },
  {
    id: 'account-settings',
    title: 'Account Settings',
    description: 'Manage your account preferences',
    href: '/account/settings',
    type: 'page',
    icon: Settings
  }
]

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Plus,
  Clock,
  Home,
  Settings,
  BookOpen,
  BarChart3,
  User,
  HelpCircle,
  Zap
}

export default function QuickActionBar() {
  const { user } = useAuthStore()
  const { layout, updateQuickActions } = useDashboardCustomization()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])

  const isPremium = user?.tier !== 'FREE'

  // Filter quick actions based on user tier and conditions
  const availableActions = layout.quickActions.filter(action => {
    if (action.requiredTier && !isPremium) return false
    if (action.condition && !action.condition(user)) return false
    return true
  })

  // Search functionality
  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    const filtered = searchData.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description?.toLowerCase().includes(query.toLowerCase())
    )

    // Add recent evaluations to search results
    // In real app, this would fetch from API
    const recentEvaluations: SearchResult[] = [
      {
        id: 'recent-eval-1',
        title: 'Tech Startup Evaluation',
        description: '$850K valuation • 3 days ago',
        href: '/evaluations/123',
        type: 'evaluation',
        icon: BarChart3,
        recent: true
      }
    ]

    if (query.toLowerCase().includes('evaluation') || query.toLowerCase().includes('recent')) {
      filtered.push(...recentEvaluations)
    }

    setSearchResults(filtered)
  }, [])

  useEffect(() => {
    performSearch(searchQuery)
  }, [searchQuery, performSearch])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const cmdKey = isMac ? e.metaKey : e.ctrlKey

      // Global search shortcut (Cmd/Ctrl + K)
      if (cmdKey && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        return
      }

      // Quick action shortcuts
      availableActions.forEach(action => {
        if (action.keyboardShortcut) {
          const shortcut = action.keyboardShortcut.toLowerCase()
          const keyPressed = `${cmdKey ? 'cmd' : 'ctrl'}+${e.key.toLowerCase()}`
          
          if (shortcut.includes(keyPressed)) {
            e.preventDefault()
            if (action.href) {
              window.location.href = action.href
            } else if (action.onClick) {
              action.onClick()
            }
          }
        }
      })
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [availableActions])

  const handleSearchResultClick = (result: SearchResult) => {
    setSearchOpen(false)
    setSearchQuery('')
    // Navigation handled by Link component
  }

  const getActionIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName]
    return IconComponent || HelpCircle
  }

  const primaryActions = availableActions.filter(action => action.category === 'primary')
  const secondaryActions = availableActions.filter(action => action.category === 'secondary')

  return (
    <div className="flex items-center gap-3 mb-6">
      {/* Primary Quick Actions */}
      <div className="flex items-center gap-2">
        {primaryActions.slice(0, 3).map((action) => {
          const IconComponent = getActionIcon(action.icon)
          
          const actionButton = (
            <Button 
              key={action.id}
              variant="default"
              className="gap-2"
              onClick={action.onClick}
            >
              <IconComponent className="w-4 h-4" />
              {action.label}
              {action.keyboardShortcut && (
                <Badge variant="secondary" className="text-xs ml-1">
                  {action.keyboardShortcut.replace('Cmd', '⌘').replace('Ctrl', 'Ctrl')}
                </Badge>
              )}
            </Button>
          )

          return action.href ? (
            <Link key={action.id} href={action.href}>
              {actionButton}
            </Link>
          ) : actionButton
        })}
      </div>

      {/* Search */}
      <Popover open={searchOpen} onOpenChange={setSearchOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2 min-w-[200px] justify-start text-muted-foreground">
            <Search className="w-4 h-4" />
            Search...
            <Badge variant="secondary" className="ml-auto text-xs">
              ⌘K
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[400px]" align="start">
          <Command>
            <CommandInput 
              placeholder="Search evaluations, improvements, help..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              
              {searchResults.length > 0 && (
                <>
                  <CommandGroup heading="Search Results">
                    {searchResults.map((result) => (
                      <CommandItem 
                        key={result.id} 
                        value={result.title}
                        onSelect={() => handleSearchResultClick(result)}
                        asChild
                      >
                        <Link href={result.href} className="flex items-center gap-2 w-full">
                          <result.icon className="w-4 h-4" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {result.title}
                              {result.recent && (
                                <Badge variant="outline" className="text-xs">Recent</Badge>
                              )}
                            </div>
                            {result.description && (
                              <p className="text-xs text-muted-foreground">{result.description}</p>
                            )}
                          </div>
                        </Link>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              <CommandGroup heading="Quick Actions">
                {primaryActions.map((action) => {
                  const IconComponent = getActionIcon(action.icon)
                  return (
                    <CommandItem 
                      key={action.id} 
                      value={action.label}
                      onSelect={() => {
                        setSearchOpen(false)
                        if (action.onClick) action.onClick()
                      }}
                      asChild={!!action.href}
                    >
                      {action.href ? (
                        <Link href={action.href} className="flex items-center gap-2 w-full">
                          <IconComponent className="w-4 h-4" />
                          {action.label}
                          {action.keyboardShortcut && (
                            <CommandShortcut>{action.keyboardShortcut}</CommandShortcut>
                          )}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2 w-full">
                          <IconComponent className="w-4 h-4" />
                          {action.label}
                          {action.keyboardShortcut && (
                            <CommandShortcut>{action.keyboardShortcut}</CommandShortcut>
                          )}
                        </div>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>

              {secondaryActions.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="More Actions">
                    {secondaryActions.map((action) => {
                      const IconComponent = getActionIcon(action.icon)
                      return (
                        <CommandItem 
                          key={action.id} 
                          value={action.label}
                          onSelect={() => {
                            setSearchOpen(false)
                            if (action.onClick) action.onClick()
                          }}
                          asChild={!!action.href}
                        >
                          {action.href ? (
                            <Link href={action.href} className="flex items-center gap-2 w-full">
                              <IconComponent className="w-4 h-4" />
                              {action.label}
                              {action.requiredTier && (
                                <Badge variant="outline" className="text-xs ml-auto">
                                  {action.requiredTier}
                                </Badge>
                              )}
                            </Link>
                          ) : (
                            <div className="flex items-center gap-2 w-full">
                              <IconComponent className="w-4 h-4" />
                              {action.label}
                              {action.requiredTier && (
                                <Badge variant="outline" className="text-xs ml-auto">
                                  {action.requiredTier}
                                </Badge>
                              )}
                            </div>
                          )}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Secondary Actions Dropdown */}
      {secondaryActions.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              More
              <ChevronDown className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48" align="end">
            <div className="space-y-1">
              {secondaryActions.map((action) => {
                const IconComponent = getActionIcon(action.icon)
                
                const actionButton = (
                  <Button
                    key={action.id}
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={action.onClick}
                  >
                    <IconComponent className="w-4 h-4" />
                    {action.label}
                    {action.requiredTier && (
                      <Badge variant="outline" className="text-xs ml-auto">
                        {action.requiredTier}
                      </Badge>
                    )}
                  </Button>
                )

                return action.href ? (
                  <Link key={action.id} href={action.href}>
                    {actionButton}
                  </Link>
                ) : actionButton
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

// Hook for triggering quick actions programmatically
export function useQuickActions() {
  const { layout } = useDashboardCustomization()

  const triggerAction = useCallback((actionId: string) => {
    const action = layout.quickActions.find(a => a.id === actionId)
    if (action) {
      if (action.href) {
        window.location.href = action.href
      } else if (action.onClick) {
        action.onClick()
      }
    }
  }, [layout.quickActions])

  const getAvailableActions = useCallback(() => {
    return layout.quickActions
  }, [layout.quickActions])

  return {
    triggerAction,
    getAvailableActions
  }
}