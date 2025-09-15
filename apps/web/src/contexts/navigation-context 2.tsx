'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { usePathname } from 'next/navigation'

interface NavigationState {
  currentPath: string
  userTier: 'free' | 'premium'
  isAuthenticated: boolean
  notificationCount: number
  breadcrumbs: BreadcrumbItem[]
}

interface BreadcrumbItem {
  label: string
  href: string
}

interface NavigationContextType {
  state: NavigationState
  updateNotificationCount: (count: number) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthStore()
  const pathname = usePathname()
  
  const [state, setState] = useState<NavigationState>({
    currentPath: pathname,
    userTier: 'free',
    isAuthenticated: false,
    notificationCount: 3, // Mock notification count
    breadcrumbs: []
  })

  // Update navigation state when user or pathname changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      currentPath: pathname,
      userTier: (user?.subscriptionTier as 'free' | 'premium') || 'free',
      isAuthenticated: !!user,
    }))
  }, [user, pathname])

  const updateNotificationCount = (count: number) => {
    setState(prev => ({ ...prev, notificationCount: count }))
  }

  return (
    <NavigationContext.Provider value={{ state, updateNotificationCount }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}