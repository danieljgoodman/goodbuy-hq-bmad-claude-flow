'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { 
  Bell, 
  ChevronDown, 
  Crown, 
  User, 
  Settings, 
  LogOut, 
  CreditCard, 
  Menu, 
  X, 
  Home,
  BarChart3,
  TrendingUp,
  Globe,
  UserIcon,
  FileText,
  Clock,
  Target,
  Plus,
  Shield
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import MobileNavigationDrawer from './mobile-navigation-drawer'
import BottomNavigation from './bottom-navigation'
import { useNavigationGestures } from '@/hooks/use-touch-gestures'

// Navigation structure based on Story 9.6a requirements
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

export default function EnhancedNavbar() {
  const { user, signOut } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  // Enhanced navigation structure with tier-based access
  const mainNavigation: NavigationItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      requiresAuth: true,
      description: 'Your business overview and key metrics'
    },
    {
      label: 'Evaluations',
      href: '/evaluations',
      icon: BarChart3,
      requiresAuth: true,
      submenu: [
        { 
          label: 'New Evaluation', 
          href: '/onboarding', 
          icon: Plus,
          description: 'Start a fresh business valuation assessment'
        },
        { 
          label: 'History', 
          href: '/evaluations/history', 
          icon: Clock,
          description: 'View and download previous valuations'
        },
        { 
          label: 'Comparisons', 
          href: '/evaluations/compare', 
          icon: Target,
          description: 'Compare evaluations over time'
        }
      ],
      description: 'Business valuation and assessment tools'
    },
    {
      label: 'Improvements',
      href: '/improvements',
      icon: TrendingUp,
      requiredTier: 'premium',
      submenu: [
        { 
          label: 'Opportunities', 
          href: '/improvements/opportunities', 
          icon: Target,
          description: 'Discover growth opportunities for your business'
        },
        { 
          label: 'Implementation Guides', 
          href: '/improvements/guides', 
          icon: FileText,
          description: 'Step-by-step guides to improve your business'
        },
        { 
          label: 'Progress Tracking', 
          href: '/progress', 
          icon: Clock,
          description: 'Monitor your business improvements over time'
        }
      ],
      badge: 'PREMIUM',
      description: 'Business improvement recommendations and tracking'
    },
    {
      label: 'Market Intelligence',
      href: '/market-intelligence',
      icon: Globe,
      requiredTier: 'premium',
      badge: 'NEW',
      description: 'Industry insights and competitive analysis'
    },
    {
      label: 'Account',
      href: '/account',
      icon: UserIcon,
      requiresAuth: true,
      submenu: [
        { 
          label: 'Profile', 
          href: '/account/profile', 
          icon: User,
          description: 'Manage your personal and business information'
        },
        { 
          label: 'Subscription', 
          href: '/account/subscription', 
          icon: CreditCard,
          description: 'Manage your billing and subscription'
        },
        { 
          label: 'Settings', 
          href: '/account/settings', 
          icon: Settings,
          description: 'Configure your account preferences'
        }
      ],
      description: 'Account management and preferences'
    }
  ]

  // Public navigation for non-authenticated users
  const publicNavigation = [
    { href: '/#how-it-works', label: 'Features' },
    { href: '/pricing', label: 'Pricing' },
  ]

  // Check user subscription tier
  const userTier = user?.subscriptionTier || 'free'
  const isAdmin = user?.email === 'admin@goodbuyhq.com' || user?.email?.includes('admin')

  // Filter navigation items based on user tier and auth status
  const getFilteredNavigation = () => {
    if (!user) return []
    
    return mainNavigation.filter(item => {
      // Check authentication requirement
      if (item.requiresAuth && !user) return false
      
      // Check tier requirement
      if (item.requiredTier && userTier === 'free') {
        return true // Show but with upgrade prompt
      }
      
      return true
    })
  }

  const filteredNavigation = getFilteredNavigation()

  // Check if user can access premium feature
  const canAccessPremium = (item: NavigationItem) => {
    return !item.requiredTier || userTier === 'premium'
  }

  // Touch gesture support for mobile navigation
  useNavigationGestures(
    navRef,
    () => setMobileMenuOpen(true),  // Open drawer on swipe right
    () => setMobileMenuOpen(false)  // Close drawer on swipe left
  )

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const breadcrumbs = [{ label: 'Home', href: '/' }]
    
    let currentPath = ''
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      // Find matching navigation item
      const navItem = mainNavigation.find(item => item.href === currentPath)
      if (navItem) {
        breadcrumbs.push({ label: navItem.label, href: currentPath })
      } else {
        // Check submenus
        for (const item of mainNavigation) {
          if (item.submenu) {
            const subItem = item.submenu.find(sub => sub.href === currentPath)
            if (subItem) {
              if (breadcrumbs[breadcrumbs.length - 1].href !== item.href) {
                breadcrumbs.push({ label: item.label, href: item.href })
              }
              breadcrumbs.push({ label: subItem.label, href: currentPath })
              break
            }
          }
        }
      }
    })
    
    return breadcrumbs
  }

  const NavigationItem = ({ item, mobile = false }: { item: NavigationItem; mobile?: boolean }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    const hasAccess = canAccessPremium(item)
    const IconComponent = item.icon

    if (item.submenu) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={`${mobile ? 'w-full justify-start' : ''} text-sm font-medium transition-colors hover:text-primary ${
                isActive ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
              }`}
            >
              <IconComponent className="h-4 w-4 mr-2" />
              {item.label}
              {item.badge && (
                <Badge variant={item.badge === 'PREMIUM' ? 'secondary' : 'default'} className="ml-2 text-xs">
                  {item.badge}
                </Badge>
              )}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-80 bg-background border-border">
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
              {item.label}
            </DropdownMenuLabel>
            {item.submenu.map((subItem) => (
              <DropdownMenuItem key={subItem.href} asChild>
                <Link href={subItem.href} className="flex items-start space-x-3 p-3">
                  <subItem.icon className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium flex items-center">
                      {subItem.label}
                      {!hasAccess && (
                        <Badge className="ml-2 text-xs bg-amber-100 text-amber-800">UPGRADE</Badge>
                      )}
                    </div>
                    {subItem.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {subItem.description}
                      </div>
                    )}
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }

    return (
      <Link
        href={hasAccess ? item.href : '/pricing'}
        className={`${mobile ? 'w-full justify-start' : ''} inline-flex items-center text-sm font-medium transition-colors hover:text-primary ${
          isActive ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
        }`}
      >
        <IconComponent className="h-4 w-4 mr-2" />
        {item.label}
        {item.badge && (
          <Badge 
            variant={item.badge === 'PREMIUM' ? 'secondary' : item.badge === 'NEW' ? 'default' : 'outline'} 
            className="ml-2 text-xs"
          >
            {item.badge}
          </Badge>
        )}
        {!hasAccess && (
          <Crown className="ml-1 h-3 w-3 text-amber-500" />
        )}
      </Link>
    )
  }

  return (
    <>
      <nav 
        ref={navRef}
        className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">GB</span>
              </div>
              <span className="text-xl font-bold">GoodBuy HQ</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {user ? (
                // Authenticated navigation
                filteredNavigation.map((item) => (
                  <NavigationItem key={item.href} item={item} />
                ))
              ) : (
                // Public navigation
                publicNavigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      pathname === item.href
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Right side navigation */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notification Bell */}
                <Link href="/notifications">
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-4 w-4" />
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
                    >
                      3
                    </Badge>
                  </Button>
                </Link>
                
                {/* User Menu Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="hidden sm:block text-left">
                        <div className="text-sm font-medium">
                          {user.businessName || 'Business Owner'}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center">
                          {userTier === 'premium' ? (
                            <><Crown className="h-3 w-3 mr-1 text-amber-500" />Premium</>
                          ) : (
                            'Free Plan'
                          )}
                        </div>
                      </div>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <div className="px-3 py-2 border-b">
                      <div className="font-medium">{user.businessName || user.email}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/account/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Profile Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account/subscription" className="flex items-center">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Subscription & Billing
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Account Settings
                      </Link>
                    </DropdownMenuItem>
                    
                    {userTier === 'free' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/pricing" className="flex items-center text-amber-600">
                            <Crown className="mr-2 h-4 w-4" />
                            Upgrade to Premium
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center">
                            <Shield className="mr-2 h-4 w-4" />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="px-4 py-6 space-y-6">
              {user ? (
                // Authenticated mobile navigation
                <div className="space-y-4">
                  {filteredNavigation.map((item) => (
                    <div key={item.href}>
                      <NavigationItem item={item} mobile />
                    </div>
                  ))}
                </div>
              ) : (
                // Public mobile navigation
                <div className="space-y-4">
                  {publicNavigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block text-base font-medium text-foreground hover:text-primary"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}

              {/* User Account Actions */}
              {user && (
                <div className="pt-6 border-t space-y-3">
                  <Link
                    href="/account/profile"
                    className="block text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile Settings
                  </Link>
                  <Link
                    href="/account/subscription"
                    className="block text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Subscription & Billing
                  </Link>
                  {userTier === 'free' && (
                    <Link
                      href="/pricing"
                      className="block text-sm text-amber-600 hover:text-amber-700"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Upgrade to Premium
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="block text-sm text-muted-foreground hover:text-foreground"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="block w-full text-left text-sm text-red-600 hover:text-red-700"
                  >
                    Logout
                  </button>
                </div>
              )}

              {/* Auth buttons for non-authenticated users */}
              {!user && (
                <div className="pt-6 border-t space-y-3">
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      Login
                    </Button>
                  </Link>
                  <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Breadcrumb Navigation for authenticated users */}
        {user && pathname !== '/' && pathname !== '/dashboard' && (
          <div className="py-2 border-t bg-muted/20">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {generateBreadcrumbs().map((crumb, index, array) => (
                <div key={crumb.href} className="flex items-center">
                  {index < array.length - 1 ? (
                    <Link href={crumb.href} className="hover:text-primary transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-foreground font-medium">{crumb.label}</span>
                  )}
                  {index < array.length - 1 && (
                    <ChevronDown className="h-3 w-3 rotate-[-90deg] mx-2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      <MobileNavigationDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navigationItems={filteredNavigation}
        userTier={userTier}
      />

      {/* Bottom Navigation for Mobile */}
      <BottomNavigation
        currentPath={pathname}
        notificationCount={3} // Mock notification count
      />
    </>
  )
}