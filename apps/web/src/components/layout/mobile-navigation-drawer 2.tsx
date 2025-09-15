'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ChevronRight, 
  ChevronDown, 
  Crown, 
  X, 
  User,
  LogOut,
  Settings,
  CreditCard,
  Shield
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

interface NavigationItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  submenu?: NavigationItem[]
  requiredTier?: 'free' | 'premium'
  requiresAuth?: boolean
  description?: string
}

interface MobileNavigationDrawerProps {
  isOpen: boolean
  onClose: () => void
  navigationItems: NavigationItem[]
  userTier: 'free' | 'premium'
}

export default function MobileNavigationDrawer({ 
  isOpen, 
  onClose, 
  navigationItems, 
  userTier 
}: MobileNavigationDrawerProps) {
  const { user, signOut } = useAuthStore()
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const isAdmin = user?.email === 'admin@goodbuyhq.com' || user?.email?.includes('admin')

  // Close drawer on route change
  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  // Handle escape key to close drawer
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden' // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const toggleExpanded = (itemHref: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemHref)) {
      newExpanded.delete(itemHref)
    } else {
      newExpanded.add(itemHref)
    }
    setExpandedItems(newExpanded)
  }

  const canAccessPremium = (item: NavigationItem) => {
    return !item.requiredTier || userTier === 'premium'
  }

  const handleLogout = async () => {
    await signOut()
    onClose()
  }

  const NavigationItemComponent = ({ item, isSubmenuItem = false }: { 
    item: NavigationItem
    isSubmenuItem?: boolean 
  }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    const hasAccess = canAccessPremium(item)
    const hasSubmenu = item.submenu && item.submenu.length > 0
    const isExpanded = expandedItems.has(item.href)
    const IconComponent = item.icon

    if (hasSubmenu) {
      return (
        <div className="space-y-2">
          <button
            onClick={() => toggleExpanded(item.href)}
            className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
              isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
            } ${isSubmenuItem ? 'pl-12' : ''}`}
            style={{ minHeight: '44px' }} // Touch target requirement
          >
            <div className="flex items-center space-x-3">
              <IconComponent className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
              {item.badge && (
                <Badge 
                  variant={item.badge === 'PREMIUM' ? 'secondary' : 'default'} 
                  className="text-xs"
                >
                  {item.badge}
                </Badge>
              )}
              {!hasAccess && (
                <Crown className="h-4 w-4 text-amber-500" />
              )}
            </div>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          
          {isExpanded && (
            <div className="pl-4 space-y-1 border-l-2 border-muted ml-6">
              {item.submenu!.map((subItem) => (
                <NavigationItemComponent 
                  key={subItem.href} 
                  item={subItem} 
                  isSubmenuItem={true} 
                />
              ))}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        href={hasAccess ? item.href : '/pricing'}
        className={`flex items-center space-x-3 p-4 rounded-lg transition-colors ${
          isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
        } ${isSubmenuItem ? 'pl-12' : ''}`}
        style={{ minHeight: '44px' }} // Touch target requirement
        onClick={onClose}
      >
        <IconComponent className="h-5 w-5" />
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{item.label}</span>
            {item.badge && (
              <Badge 
                variant={item.badge === 'PREMIUM' ? 'secondary' : 'default'} 
                className="text-xs"
              >
                {item.badge}
              </Badge>
            )}
            {!hasAccess && (
              <Crown className="h-4 w-4 text-amber-500" />
            )}
          </div>
          {item.description && (
            <div className="text-xs text-muted-foreground mt-1">
              {item.description}
            </div>
          )}
        </div>
      </Link>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Navigation Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-background border-r shadow-lg z-50 transform transition-transform duration-300 md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ maxWidth: '85vw' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-medium text-sm">
                  {user?.businessName || 'Business Owner'}
                </div>
                <div className="text-xs text-muted-foreground flex items-center">
                  {userTier === 'premium' ? (
                    <><Crown className="h-3 w-3 mr-1 text-amber-500" />Premium</>
                  ) : (
                    'Free Plan'
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <NavigationItemComponent key={item.href} item={item} />
              ))}
            </div>

            {userTier === 'free' && (
              <>
                <Separator className="my-6" />
                <Link
                  href="/pricing"
                  className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors"
                  onClick={onClose}
                  style={{ minHeight: '44px' }}
                >
                  <Crown className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Upgrade to Premium</div>
                    <div className="text-xs opacity-80">
                      Unlock advanced features and insights
                    </div>
                  </div>
                </Link>
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t p-4 space-y-2">
            <Link
              href="/account/profile"
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors"
              onClick={onClose}
              style={{ minHeight: '44px' }}
            >
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Profile Settings</span>
            </Link>
            
            <Link
              href="/account/subscription"
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors"
              onClick={onClose}
              style={{ minHeight: '44px' }}
            >
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Subscription & Billing</span>
            </Link>
            
            <Link
              href="/account/settings"
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors"
              onClick={onClose}
              style={{ minHeight: '44px' }}
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Account Settings</span>
            </Link>
            
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors"
                onClick={onClose}
                style={{ minHeight: '44px' }}
              >
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Admin Panel</span>
              </Link>
            )}
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
              style={{ minHeight: '44px' }}
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}