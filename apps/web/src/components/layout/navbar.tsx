'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, ChevronDown, Crown, User, Settings, LogOut, CreditCard, Menu, X, Plus, FileText, BarChart3, HelpCircle, BookOpen, PlayCircle, Users, TrendingUp, Target, Activity } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

export default function Navbar() {
  const { user, signOut } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  // Different navigation for authenticated vs non-authenticated users
  const publicNavItems = [
    { href: '/#how-it-works', label: 'Features' },
    { href: '/pricing', label: 'Pricing' },
  ]

  const authenticatedNavItems = [
    { href: '/dashboard', label: 'Dashboard' },
  ]

  const navItems = user ? authenticatedNavItems : publicNavItems

  // Add admin link for admin users (mock check - in production would check user role)
  const isAdmin = user?.email === 'admin@goodbuyhq.com' || user?.email?.includes('admin')

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">GB</span>
              </div>
              <span className="text-xl font-bold">GoodBuy HQ</span>
            </Link>

            <div className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
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
              ))}

              {/* Features Dropdown - Only for authenticated users */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-primary">
                      Features
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[720px] bg-background border-border">
                    <div className="grid grid-cols-2 gap-6 p-4">
                      {/* Left Column - Evaluation & Analysis */}
                      <div className="space-y-4">
                        {/* Evaluation Section */}
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">EVALUATION</div>
                          <div className="space-y-2">
                            <Link href="/onboarding" className="flex items-start space-x-3 p-2 rounded-md hover:bg-accent group">
                              <div className="w-8 h-8 bg-[hsl(var(--chart-1)/0.1)] rounded-md flex items-center justify-center flex-shrink-0">
                                <Plus className="h-4 w-4 text-[hsl(var(--chart-1))]" />
                              </div>
                              <div>
                                <div className="font-medium text-sm group-hover:text-primary">New Evaluation</div>
                                <div className="text-xs text-muted-foreground">Start a fresh business valuation assessment</div>
                              </div>
                            </Link>
                            <Link href="/reports" className="flex items-start space-x-3 p-2 rounded-md hover:bg-accent group">
                              <div className="w-8 h-8 bg-[hsl(var(--primary)/0.1)] rounded-md flex items-center justify-center flex-shrink-0">
                                <FileText className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium text-sm group-hover:text-primary">Reports</div>
                                <div className="text-xs text-muted-foreground">View and download previous valuations</div>
                              </div>
                            </Link>
                          </div>
                        </div>

                        {/* Analysis Section */}
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">ANALYSIS</div>
                          <div className="space-y-2">
                            <Link href="/progress" className="flex items-start space-x-3 p-2 rounded-md hover:bg-accent group">
                              <div className="w-8 h-8 bg-[hsl(var(--chart-2)/0.1)] rounded-md flex items-center justify-center flex-shrink-0">
                                <Activity className="h-4 w-4 text-[hsl(var(--chart-2))]" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm group-hover:text-primary flex items-center">
                                  Progress Tracking
                                  <Badge className="ml-2 text-xs bg-primary text-primary-foreground">PREMIUM</Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">Monitor business growth over time</div>
                              </div>
                            </Link>
                            <Link href="/analytics" className="flex items-start space-x-3 p-2 rounded-md hover:bg-accent group">
                              <div className="w-8 h-8 bg-[hsl(var(--chart-5)/0.1)] rounded-md flex items-center justify-center flex-shrink-0">
                                <BarChart3 className="h-4 w-4 text-[hsl(var(--chart-5))]" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm group-hover:text-primary flex items-center">
                                  Analytics Dashboard
                                  <Badge className="ml-2 text-xs bg-primary text-primary-foreground">PREMIUM</Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">Track performance metrics and trends</div>
                              </div>
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Market Insights */}
                      <div className="space-y-4">
                        {/* Market Intelligence Section */}
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">MARKET INSIGHTS</div>
                          <div className="space-y-2">
                            <Link href="/market-intelligence" className="flex items-start space-x-3 p-2 rounded-md hover:bg-accent group">
                              <div className="w-8 h-8 bg-[hsl(var(--primary)/0.1)] rounded-md flex items-center justify-center flex-shrink-0">
                                <TrendingUp className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm group-hover:text-primary flex items-center">
                                  Market Intelligence
                                  <Badge className="ml-2 text-xs bg-primary text-primary-foreground">PREMIUM</Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">Industry trends and competitive analysis</div>
                              </div>
                            </Link>
                            <Link href="/benchmarking" className="flex items-start space-x-3 p-2 rounded-md hover:bg-accent group">
                              <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                                <Target className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm group-hover:text-primary flex items-center">
                                  Industry Benchmarking
                                  <Badge variant="secondary" className="ml-2 text-xs">ENTERPRISE</Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">Compare against sector standards</div>
                              </div>
                            </Link>
                          </div>
                        </div>

                        {/* Additional Tools Section */}
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">ADDITIONAL TOOLS</div>
                          <div className="space-y-2">
                            <Link href="/reports" className="flex items-start space-x-3 p-2 rounded-md hover:bg-accent group">
                              <div className="w-8 h-8 bg-[hsl(var(--chart-3)/0.1)] rounded-md flex items-center justify-center flex-shrink-0">
                                <FileText className="h-4 w-4 text-[hsl(var(--chart-3))]" />
                              </div>
                              <div>
                                <div className="font-medium text-sm group-hover:text-primary">Custom Reports</div>
                                <div className="text-xs text-muted-foreground">Professional PDF reports with AI analysis</div>
                              </div>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Resources Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-primary">
                    Resources
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 bg-background border-border">
                  <DropdownMenuItem asChild>
                    <Link href="/help" className="flex items-start space-x-3 p-3">
                      <HelpCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium">Help Center</div>
                        <div className="text-xs text-muted-foreground">Get answers to common questions</div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/help/knowledge-base" className="flex items-start space-x-3 p-3">
                      <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium">Knowledge Base</div>
                        <div className="text-xs text-muted-foreground">Browse articles and guides</div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/help/tutorials" className="flex items-start space-x-3 p-3">
                      <PlayCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium">Video Tutorials</div>
                        <div className="text-xs text-muted-foreground">Watch step-by-step walkthroughs</div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/help/community" className="flex items-start space-x-3 p-3">
                      <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium">Community</div>
                        <div className="text-xs text-muted-foreground">Connect with other business owners</div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Support - Direct link */}
              <Link
                href="/support"
                className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
              >
                Support
              </Link>
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
                      <span className="text-sm text-muted-foreground hidden sm:block">
                        {user.businessName || user.email}
                      </span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/account/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Profile Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/subscription" className="flex items-center">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Subscription & Billing
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account/notifications" className="flex items-center">
                        <Bell className="mr-2 h-4 w-4" />
                        Notifications
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center">
                            <Settings className="mr-2 h-4 w-4" />
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
              {/* Main Navigation */}
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block text-base font-medium text-foreground hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              {/* Authenticated User Menu Items */}
              {user && (
                <>
                  {/* Features Section */}
                  <div className="space-y-3">
                    <div className="font-semibold text-primary text-sm">Features</div>
                    
                    {/* Evaluation Subsection */}
                    <div className="pl-4 space-y-3">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Evaluation</div>
                      <div className="pl-2 space-y-2">
                        <Link
                          href="/onboarding"
                          className="block text-sm text-muted-foreground hover:text-foreground"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          New Evaluation
                        </Link>
                        <Link
                          href="/reports"
                          className="block text-sm text-muted-foreground hover:text-foreground"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Reports
                        </Link>
                      </div>
                    </div>

                    {/* Analysis Subsection */}
                    <div className="pl-4 space-y-3">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Analysis</div>
                      <div className="pl-2 space-y-2">
                        <Link
                          href="/progress"
                          className="block text-sm text-muted-foreground hover:text-foreground flex items-center"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Progress Tracking
                          <Badge variant="secondary" className="ml-2 text-xs bg-amber-100 text-amber-800">PREMIUM</Badge>
                        </Link>
                        <Link
                          href="/analytics"
                          className="block text-sm text-muted-foreground hover:text-foreground flex items-center"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Analytics Dashboard
                          <Badge variant="secondary" className="ml-2 text-xs bg-amber-100 text-amber-800">PREMIUM</Badge>
                        </Link>
                      </div>
                    </div>

                    {/* Market Insights Subsection */}
                    <div className="pl-4 space-y-3">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Market Insights</div>
                      <div className="pl-2 space-y-2">
                        <Link
                          href="/market-intelligence"
                          className="block text-sm text-muted-foreground hover:text-foreground flex items-center"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Market Intelligence
                          <Badge variant="secondary" className="ml-2 text-xs bg-amber-100 text-amber-800">PREMIUM</Badge>
                        </Link>
                        <Link
                          href="/benchmarking"
                          className="block text-sm text-muted-foreground hover:text-foreground flex items-center"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Industry Benchmarking
                          <Badge variant="secondary" className="ml-2 text-xs">ENTERPRISE</Badge>
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Resources Section */}
              <div className="space-y-3">
                <div className="font-semibold text-primary text-sm">Resources</div>
                <div className="pl-4 space-y-2">
                  <Link
                    href="/help"
                    className="block text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Help Center
                  </Link>
                  <Link
                    href="/help/knowledge-base"
                    className="block text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Knowledge Base
                  </Link>
                  <Link
                    href="/help/tutorials"
                    className="block text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Video Tutorials
                  </Link>
                  <Link
                    href="/help/community"
                    className="block text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Community
                  </Link>
                </div>
              </div>

              {/* Support */}
              <Link
                href="/support"
                className="block text-base font-medium text-foreground hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Support
              </Link>

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
                    href="/subscription"
                    className="block text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Subscription & Billing
                  </Link>
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
      </div>
    </nav>
  )
}