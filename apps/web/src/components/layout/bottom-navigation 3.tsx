'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { 
  Home, 
  Plus, 
  Clock, 
  User, 
  Bell,
  BarChart3
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

interface QuickAction {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  priority: 'high' | 'medium' | 'low'
  badge?: string | number
  requiresAuth?: boolean
}

interface BottomNavigationProps {
  currentPath: string
  notificationCount?: number
}

export default function BottomNavigation({ 
  currentPath, 
  notificationCount = 3 
}: BottomNavigationProps) {
  const { user } = useAuthStore()
  const pathname = usePathname()

  // Don't show bottom navigation on certain pages
  const hiddenPaths = ['/auth/login', '/auth/register', '/', '/pricing']
  if (hiddenPaths.includes(pathname) || !user) {
    return null
  }

  const quickActions: QuickAction[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      priority: 'high',
      requiresAuth: true
    },
    {
      label: 'New Evaluation',
      href: '/onboarding',
      icon: Plus,
      priority: 'high',
      requiresAuth: true
    },
    {
      label: 'History',
      href: '/evaluations/history',
      icon: Clock,
      priority: 'medium',
      requiresAuth: true
    },
    {
      label: 'Reports',
      href: '/reports',
      icon: BarChart3,
      priority: 'medium',
      requiresAuth: true
    },
    {
      label: 'Notifications',
      href: '/notifications',
      icon: Bell,
      priority: 'medium',
      badge: notificationCount,
      requiresAuth: true
    }
  ]

  // Filter actions based on screen size and priority
  const displayedActions = quickActions
    .filter(action => !action.requiresAuth || user)
    .slice(0, 5) // Limit to 5 actions max for optimal mobile UX

  const QuickActionButton = ({ action }: { action: QuickAction }) => {
    const isActive = pathname === action.href || pathname.startsWith(action.href + '/')
    const IconComponent = action.icon

    return (
      <Link
        href={action.href}
        className={`flex flex-col items-center justify-center space-y-1 p-2 rounded-lg transition-all duration-200 relative ${
          isActive 
            ? 'text-primary bg-primary/10' 
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
        style={{ 
          minWidth: '44px', 
          minHeight: '44px',
          flex: 1,
          maxWidth: '80px'
        }}
      >
        <div className="relative">
          <IconComponent className={`h-5 w-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
          {action.badge && typeof action.badge === 'number' && action.badge > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-4 w-4 text-xs p-0 flex items-center justify-center"
              style={{ fontSize: '10px' }}
            >
              {action.badge > 99 ? '99+' : action.badge}
            </Badge>
          )}
          {action.badge && typeof action.badge === 'string' && (
            <Badge 
              variant="default" 
              className="absolute -top-1 -right-1 text-xs px-1"
              style={{ fontSize: '8px' }}
            >
              {action.badge}
            </Badge>
          )}
        </div>
        <span className={`text-xs font-medium truncate w-full text-center ${
          isActive ? 'text-primary' : 'text-muted-foreground'
        }`}>
          {action.label}
        </span>
        
        {/* Active indicator */}
        {isActive && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
        )}
      </Link>
    )
  }

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-background border-t z-40 md:hidden"
      style={{ 
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        paddingTop: '8px'
      }}
    >
      <div className="flex items-center justify-around px-2">
        {displayedActions.map((action) => (
          <QuickActionButton key={action.href} action={action} />
        ))}
      </div>
      
      {/* Visual separator line for better visual hierarchy */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-muted rounded-full" />
    </div>
  )
}