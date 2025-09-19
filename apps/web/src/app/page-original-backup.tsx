'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/stores/auth-store'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useHomepageAnalytics, useSectionTracking } from '@/hooks/useHomepageAnalytics'
import { HeroSkeleton } from '@/components/loading/hero-skeleton'
import { FeaturesSkeleton } from '@/components/loading/features-skeleton'
import { Shield, Award, Building, CheckCircle, BarChart3, Clock, Upload, Brain, Target, ChevronRight, Star, Users, TrendingUp } from 'lucide-react'

export default function Home() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const { trackPageView, trackButtonClick, trackTrialSignup, trackSectionView, variant, hasConsent } = useHomepageAnalytics()
  const [isLoading, setIsLoading] = useState(true)
  
  // Section refs for tracking
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const testimonialsRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  // Setup section tracking
  useSectionTracking('hero', heroRef, trackSectionView, hasConsent)
  useSectionTracking('features', featuresRef, trackSectionView, hasConsent)
  useSectionTracking('how-it-works', stepsRef, trackSectionView, hasConsent)
  useSectionTracking('testimonials', testimonialsRef, trackSectionView, hasConsent)
  useSectionTracking('final-cta', ctaRef, trackSectionView, hasConsent)

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/dashboard' as any)
    }
  }, [isAuthenticated, user, router])

  // Track page view on mount and handle loading
  useEffect(() => {
    if (hasConsent) {
      trackPageView()
    }
    // Simulate loading for better UX
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [trackPageView, hasConsent])

  // Handle CTA button clicks with analytics
  const handlePrimaryCtaClick = () => {
    trackButtonClick('cta_primary_hero')
    trackTrialSignup()
  }

  const handleSecondaryCtaClick = () => {
    trackButtonClick('cta_secondary_demo')
  }

  const handleTrustSignalClick = () => {
    trackButtonClick('trust_signal')
  }

  // Show loading state initially
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <HeroSkeleton />
          <FeaturesSkeleton />
        </main>
      </div>
    )
  }

  const features = [
    {
      title: "Bank-Grade Accuracy",
      description: "AI trained on 50,000+ actual business sales. Get valuations banks and buyers trust.",
      icon: Target
    },
    {
      title: "Save $5,000+ in Fees", 
      description: "Professional valuations without the consultant price tag. Same quality, fraction of the cost.",
      icon: BarChart3
    },
    {
      title: "Actionable Insights",
      description: "Discover exactly what increases your business value. Get your roadmap to higher profits.",
      icon: Brain
    },
    {
      title: "Results in 10 Minutes",
      description: "Upload your financials, answer 5 questions, get your complete valuation report.",
      icon: Clock
    }
  ];

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        {/* Hero Section */}
        <div ref={heroRef} className="text-center mb-24 lg:mb-32 space-y-20">
          {/* Enhanced Hero with Modern Gradients - Using only colors.md variables */}
          <div className="relative mb-16">
            {/* Dynamic background animation using CSS variables */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[32rem] h-[32rem] bg-gradient-to-br from-primary/25 via-primary/20 to-primary/15 rounded-full opacity-60 blur-3xl animate-pulse"></div>
              <div className="absolute w-[28rem] h-[28rem] bg-gradient-to-tl from-primary/20 via-primary/15 to-accent/30 rounded-full opacity-50 blur-2xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
              <div className="absolute w-[24rem] h-[24rem] bg-gradient-to-r from-secondary/30 via-muted/25 to-primary/10 rounded-full opacity-40 blur-xl animate-pulse" style={{ animationDelay: '3s' }}></div>
            </div>
            
            {/* Subtle dot pattern overlay using CSS variables */}
            <div className="absolute inset-0 opacity-[0.03]">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)`,
                backgroundSize: '48px 48px'
              }}></div>
            </div>
            
            <div className="relative z-10 space-y-10 pt-12">
              {/* Enhanced Typography with Better Hierarchy - Modern sizing */}
              <div className="space-y-8">
                <div className="inline-flex items-center px-5 py-3 bg-primary/10 dark:bg-primary/20 rounded-full text-primary text-sm font-semibold mb-6 shadow-sm">
                  247 businesses valued this week
                </div>
                <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-foreground leading-[1.3] tracking-tight max-w-7xl mx-auto pb-12 mb-8">
                  Know What Your Business
                  <span className="block bg-gradient-to-r from-primary via-primary to-primary/90 bg-clip-text text-transparent mt-2 pb-4">
                    Is Really Worth
                  </span>
                </h1>
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-muted-foreground max-w-5xl mx-auto leading-relaxed font-light">
                  <span className="font-semibold text-foreground">Professional-grade valuations with AI-powered precision.</span>
                  <span className="block mt-3 text-lg sm:text-xl md:text-2xl lg:text-3xl">Trusted by 10,247+ business owners worldwide.</span>
                </p>
                
                {/* Urgency and Time Indicator - Using only design system colors */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 text-sm">
                  <div className="flex items-center gap-2 px-4 py-3 bg-primary/10 text-primary rounded-full border border-primary/20 shadow-sm">
                    <span className="font-semibold">Start with our free Basic evaluation</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3 bg-accent text-accent-foreground rounded-full border border-border shadow-sm">
                    <span className="font-semibold">Average completion: 8 minutes 32 seconds</span>
                  </div>
                </div>
              </div>
              
              {/* Enhanced CTAs with Better Visual Weight - Larger, more prominent */}
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center items-center mt-16 sm:mt-20 lg:mt-24 w-full max-w-3xl mx-auto">
                <Link href="/auth/register" onClick={handlePrimaryCtaClick}>
                  <Button size="lg" className="w-full sm:w-auto px-10 sm:px-16 py-5 sm:py-6 text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary to-primary/95 hover:from-primary/95 hover:to-primary/85 text-primary-foreground rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl">
                    Start My Free Valuation Now
                    <ChevronRight className="ml-3 h-6 w-6" />
                  </Button>
                </Link>
                <Link href="#demo-report" onClick={handleSecondaryCtaClick}>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 sm:px-12 py-5 sm:py-6 text-lg sm:text-xl lg:text-2xl font-semibold text-foreground hover:bg-secondary border-2 border-border hover:border-primary/40 rounded-2xl transition-all duration-300 hover:shadow-md">
                    View Sample Report
                  </Button>
                </Link>
              </div>
              
              {/* CTA Support Text - More prominent */}
              <div className="mt-8 text-center">
                <p className="text-base text-muted-foreground font-medium">
                  Get results in 8 minutes • Professional accuracy • Completely free
                </p>
              </div>
              
              {/* Enhanced Live Social Proof */}
              <div className="mt-20">
                {/* What You'll Discover - User Benefits - Enhanced with better spacing and typography */}
                <div className="max-w-3xl mx-auto mb-12">
                  <div className="bg-gradient-to-br from-primary/8 via-primary/5 to-secondary/10 rounded-2xl p-8 border border-primary/20 shadow-sm">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-foreground flex items-center justify-center gap-3">
                        <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                        What You&apos;ll Discover
                        <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                      </h3>
                    </div>
                    <div className="space-y-4 text-base">
                      <div className="flex items-start gap-4 bg-card rounded-xl px-6 py-4 border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-8 h-8 bg-primary/15 rounded-full flex items-center justify-center mt-1">
                          <div className="w-3 h-3 bg-primary rounded-full"></div>
                        </div>
                        <div>
                          <span className="font-semibold text-foreground text-lg">Your business&apos;s fair market value</span>
                          <p className="text-muted-foreground mt-1">Based on real market data and comparable sales</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 bg-card rounded-xl px-6 py-4 border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-8 h-8 bg-primary/15 rounded-full flex items-center justify-center mt-1">
                          <div className="w-3 h-3 bg-primary rounded-full"></div>
                        </div>
                        <div>
                          <span className="font-semibold text-foreground text-lg">Growth opportunities & blind spots</span>
                          <p className="text-muted-foreground mt-1">Identify areas for improvement and expansion</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 bg-card rounded-xl px-6 py-4 border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-8 h-8 bg-primary/15 rounded-full flex items-center justify-center mt-1">
                          <div className="w-3 h-3 bg-primary rounded-full"></div>
                        </div>
                        <div>
                          <span className="font-semibold text-foreground text-lg">Actionable improvement strategies</span>
                          <p className="text-muted-foreground mt-1">Specific steps to increase your business value</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Trust Statistics - Larger, more prominent */}
                <div className="flex flex-wrap justify-center gap-8 text-base text-muted-foreground">
                  <div className="flex items-center gap-3 bg-secondary/60 px-5 py-3 rounded-xl border border-border/50 shadow-sm">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                    <span className="font-semibold">247 businesses valued this week</span>
                  </div>
                  <div className="flex items-center gap-3 bg-secondary/60 px-5 py-3 rounded-xl border border-border/50 shadow-sm">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '500ms' }}></div>
                    <span className="font-semibold">avg. $2.4M valuation</span>
                  </div>
                  <div className="flex items-center gap-3 bg-secondary/60 px-5 py-3 rounded-xl border border-border/50 shadow-sm">
                    <div className="w-3 h-3 bg-primary/70 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <span className="font-semibold">8 min 32s average</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Hero Trust Bar - Enhanced modern design */}
          <div className="max-w-5xl mx-auto mb-20">
            <div className="bg-gradient-to-r from-secondary/60 via-card to-secondary/60 border border-border rounded-3xl p-6 shadow-lg backdrop-blur-sm">
              <div className="flex flex-wrap items-center justify-center gap-8 text-base">
                <div className="flex items-center gap-3 group">
                  <div className="w-8 h-8 bg-primary/15 rounded-full flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-semibold text-foreground">Bank-Level Security</span>
                </div>
                <div className="text-border opacity-30">•</div>
                <div className="flex items-center gap-3 group">
                  <div className="w-8 h-8 bg-primary/15 rounded-full flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                    <Award className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-semibold text-foreground">4.9/5 (1,247 reviews)</span>
                </div>
                <div className="text-border opacity-30">•</div>
                <div className="flex items-center gap-3 group">
                  <div className="w-8 h-8 bg-primary/15 rounded-full flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                    <Building className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-semibold text-foreground">Fortune 500 Approved</span>
                </div>
                <div className="text-border opacity-30">•</div>
                <div className="flex items-center gap-3 group">
                  <div className="w-8 h-8 bg-primary/15 rounded-full flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-semibold text-foreground">AICPA Certified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Trust Indicators with Visual Badges - Larger, more impressive */}
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
              {/* Security Badge */}
              <div className="group hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                <div className="bg-gradient-to-br from-card via-card to-secondary/30 border border-border rounded-3xl p-8 text-center shadow-md hover:shadow-xl transition-all duration-300">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary/85 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow">
                    <Shield className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div className="text-base font-bold text-foreground mb-2">Bank-Level Security</div>
                  <div className="text-sm text-muted-foreground mb-3">256-bit encryption</div>
                  <div className="inline-flex items-center text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">
                    SSL Protected
                  </div>
                </div>
              </div>

              {/* Rating Badge */}
              <div className="group hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                <div className="bg-gradient-to-br from-card via-card to-secondary/30 border border-border rounded-3xl p-8 text-center shadow-md hover:shadow-xl transition-all duration-300">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow">
                    <Award className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div className="text-base font-bold text-foreground mb-2">4.9/5 Rating</div>
                  <div className="text-sm text-muted-foreground mb-3">1,200+ reviews</div>
                  <div className="flex justify-center mt-2">
                    {[1,2,3,4,5].map((star) => (
                      <div key={star} className="text-primary text-sm">★</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Enterprise Badge */}
              <div className="group hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                <div className="bg-gradient-to-br from-card via-card to-secondary/30 border border-border rounded-3xl p-8 text-center shadow-md hover:shadow-xl transition-all duration-300">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/85 to-primary/70 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow">
                    <Building className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div className="text-base font-bold text-foreground mb-2">Fortune 500</div>
                  <div className="text-sm text-muted-foreground mb-3">Enterprise grade</div>
                  <div className="inline-flex items-center text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">
                    Trusted
                  </div>
                </div>
              </div>

              {/* Certification Badge */}
              <div className="group hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                <div className="bg-gradient-to-br from-card via-card to-secondary/30 border border-border rounded-3xl p-8 text-center shadow-md hover:shadow-xl transition-all duration-300">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary/90 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow">
                    <CheckCircle className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div className="text-base font-bold text-foreground mb-2">AICPA Certified</div>
                  <div className="text-sm text-muted-foreground mb-3">Industry standard</div>
                  <div className="inline-flex items-center text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">
                    Verified
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Divider */}
        <div className="relative mb-24 lg:mb-32">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50"></div>
          </div>
          <div className="relative flex justify-center">
            <div className="bg-background px-6 text-muted-foreground">
              <div className="w-2 h-2 bg-primary/30 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Product Demo Section - Enhanced with modern styling */}
        <div id="demo-report" ref={featuresRef} className="mb-24 lg:mb-32 scroll-mt-20 relative">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden -z-10">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-gradient-to-br from-primary/5 via-transparent to-secondary/10 rounded-full blur-3xl opacity-30"></div>
          </div>
          
          <div className="text-center mb-24">
            <h2 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-8 tracking-tight">See it in action</h2>
            <p className="text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Our AI analyzes your business using 5 proven valuation methods simultaneously
            </p>
          </div>
          
          {/* Enhanced Interactive Dashboard Preview - Floating design */}
          <div className="max-w-7xl mx-auto mb-28 px-4">
            <div className="relative">
              {/* Floating background elements */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full blur-2xl opacity-60"></div>
              <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-gradient-to-br from-secondary/30 to-accent/20 rounded-full blur-2xl opacity-40"></div>
              
              <div className="bg-gradient-to-br from-card via-card to-secondary/20 rounded-3xl p-6 md:p-10 border border-border shadow-2xl overflow-hidden backdrop-blur-sm">
                <div className="bg-background/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-10 border border-border/30">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 md:mb-10 gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                      <BarChart3 className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground">Business Valuation Report</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-full text-sm font-bold shadow-lg">
                      Complete
                    </div>
                    <div className="text-sm text-muted-foreground font-medium hidden sm:block">Generated in 8 minutes</div>
                  </div>
                </div>

                {/* Enhanced Valuation Cards with Visual Progress - Larger, more impressive */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-10">
                  {/* Asset-Based Value */}
                  <div className="group relative overflow-hidden bg-gradient-to-br from-card to-secondary/50 rounded-3xl p-6 md:p-8 border border-border hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    <div className="absolute top-0 left-0 w-full h-2 bg-border/30 rounded-t-3xl">
                      <div className="h-full w-3/4 bg-gradient-to-r from-muted-foreground/70 to-muted-foreground rounded-t-3xl"></div>
                    </div>
                    <div className="text-center pt-4">
                      <div className="text-4xl md:text-5xl font-bold text-foreground mb-3">$1.2M</div>
                      <div className="text-base font-semibold text-muted-foreground mb-4">Asset-Based Value</div>
                      <Badge variant="secondary" className="text-sm px-3 py-1">Conservative approach</Badge>
                    </div>
                  </div>

                  {/* Market Value - Featured */}
                  <div className="group relative overflow-hidden bg-gradient-to-br from-primary/8 to-primary/15 rounded-3xl p-6 md:p-8 border-2 border-primary/40 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                    <div className="absolute top-0 left-0 w-full h-2 bg-primary/30 rounded-t-3xl">
                      <div className="h-full w-full bg-gradient-to-r from-primary to-primary/85 rounded-t-3xl"></div>
                    </div>
                    <Badge className="absolute top-3 right-3 bg-gradient-to-r from-primary to-primary/85 shadow-lg text-sm px-3 py-1">
                      Recommended
                    </Badge>
                    <div className="text-center pt-4">
                      <div className="text-4xl md:text-5xl font-bold text-primary mb-3">$2.4M</div>
                      <div className="text-base font-semibold text-primary/80 mb-4">Market Value</div>
                      <Badge variant="secondary" className="bg-primary/15 text-primary hover:bg-primary/25 text-sm px-3 py-1">Best estimate</Badge>
                    </div>
                  </div>

                  {/* Income-Based Value */}
                  <div className="group relative overflow-hidden bg-gradient-to-br from-card to-secondary/50 rounded-3xl p-6 md:p-8 border border-border hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    <div className="absolute top-0 left-0 w-full h-2 bg-primary/30 rounded-t-3xl">
                      <div className="h-full w-5/6 bg-gradient-to-r from-primary/75 to-primary/55 rounded-t-3xl"></div>
                    </div>
                    <div className="text-center pt-4">
                      <div className="text-4xl md:text-5xl font-bold text-primary mb-3">$3.1M</div>
                      <div className="text-base font-semibold text-primary/80 mb-4">Income-Based Value</div>
                      <Badge variant="secondary" className="bg-primary/15 text-primary hover:bg-primary/25 text-sm px-3 py-1">Growth potential</Badge>
                    </div>
                  </div>
                </div>

                {/* Key Insights Preview */}
                <Separator className="my-6" />
                <div className="bg-muted/30 rounded-2xl p-4 md:p-6 border border-border/50">
                  <h4 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Key Insights & Recommendations
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-start gap-3 p-3 bg-card/90 rounded-xl border border-border/30 hover:border-border/50 transition-colors">
                      <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center mt-0.5">
                        <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">Strong Revenue Growth</div>
                        <div className="text-xs text-muted-foreground mt-0.5">+23% YoY increase</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-card/90 rounded-xl border border-border/30 hover:border-border/50 transition-colors">
                      <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center mt-0.5">
                        <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">Market Position</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Above industry avg</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid - Enhanced with modern cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mt-20 lg:mt-24">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="group text-center bg-gradient-to-br from-card to-secondary/20 rounded-3xl p-8 border border-border hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow">
                    <IconComponent className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
        </div>

        {/* Section Divider */}
        <div className="relative mb-24 lg:mb-32">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50"></div>
          </div>
          <div className="relative flex justify-center">
            <div className="bg-background px-6 text-muted-foreground">
              <div className="w-2 h-2 bg-primary/30 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* How it Works - Enhanced with modern styling */}
        <div ref={stepsRef} className="mb-24 lg:mb-32 relative">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden -z-10">
            <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-2xl"></div>
            <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-gradient-to-br from-secondary/20 to-transparent rounded-full blur-2xl"></div>
          </div>
          
          <div className="text-center mb-24">
            <h2 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-8 tracking-tight">How it works</h2>
            <p className="text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Get professional valuations in three simple steps
            </p>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-16 lg:gap-20">
              {[
                {
                  step: "01",
                  title: "Upload Your Financials",
                  description: "Securely upload your P&L and balance sheet. Takes 2 minutes.",
                  icon: Upload
                },
                {
                  step: "02",
                  title: "AI Analysis", 
                  description: "Our AI compares your business to 50,000+ real sales using proven valuation methods.",
                  icon: Brain
                },
                {
                  step: "03",
                  title: "Get Results",
                  description: "Receive your comprehensive valuation report with actionable growth recommendations.",
                  icon: Target
                }
              ].map((step, index) => {
                const IconComponent = step.icon;
                return (
                  <div key={step.step} className="text-center group">
                    <div className="mb-8 relative">
                      {/* Connection line for non-mobile */}
                      {index < 2 && (
                        <div className="hidden md:block absolute top-1/2 left-full w-16 lg:w-24 h-0.5 bg-gradient-to-r from-primary/40 to-primary/20 transform -translate-y-1/2"></div>
                      )}
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
                        <IconComponent className="h-10 w-10" />
                      </div>
                      <div className="text-lg font-bold text-primary bg-primary/10 rounded-full px-4 py-2 inline-block">{step.step}</div>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Enhanced Testimonials Section - Modern design */}
        <div ref={testimonialsRef} className="mb-24 lg:mb-32 relative">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden -z-10">
            <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-primary/3 via-transparent to-secondary/8 rounded-full blur-3xl"></div>
          </div>
          
          <div className="text-center mb-20">
            <h2 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-8 tracking-tight">Trusted by Business Owners Nationwide</h2>
            <p className="text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Real results from real business owners who used our platform
            </p>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
              {[
                {
                  quote: "GoodBuy HQ's valuation was spot-on when I sold my company. Their AI caught details my expensive consultant missed.",
                  author: "Sarah Chen",
                  title: "Tech Startup Founder",
                  company: "Verified Customer",
                  result: "Sold for $2.1M",
                  image: "SC"
                },
                {
                  quote: "The growth recommendations increased our value by 45% in just 8 months. Best investment I've made in my business.",
                  author: "Michael Rodriguez", 
                  title: "Manufacturing CEO",
                  company: "Verified Customer",
                  result: "45% value increase",
                  image: "MR"
                },
                {
                  quote: "Finally, a valuation service that understands small businesses. Quick, accurate, and incredibly affordable.",
                  author: "Lisa Thompson",
                  title: "Retail Business Owner",
                  company: "Verified Customer",
                  result: "3 locations valued",
                  image: "LT"
                }
              ].map((testimonial, index) => (
                <div key={index} className="group bg-gradient-to-br from-card via-card to-secondary/30 rounded-3xl p-10 border border-border shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                  <div className="mb-8">
                    <div className="text-primary text-4xl mb-4 font-serif opacity-60">&quot;</div>
                    <p className="text-foreground leading-relaxed font-medium text-lg">
                      {testimonial.quote}
                    </p>
                  </div>
                  <div className="flex items-start space-x-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/85 rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg group-hover:shadow-xl transition-shadow">
                      {testimonial.image}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-foreground text-lg">{testimonial.author}</div>
                      <div className="text-muted-foreground mb-2">{testimonial.title}</div>
                      <div className="text-sm text-primary font-semibold mb-3">{testimonial.company}</div>
                      <div className="text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full inline-block">
                        {testimonial.result}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Final CTA Section - Modern design */}
        <div ref={ctaRef} className="text-center relative">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden -z-10">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[30rem] bg-gradient-to-br from-primary/5 via-transparent to-secondary/10 rounded-full blur-3xl opacity-60"></div>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-10">

            <div>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 tracking-tight">
                Ready to Discover Your Business Worth?
              </h2>
              <p className="text-2xl text-muted-foreground mb-8 leading-relaxed mt-8">
                Join 10,247+ business owners who discovered their true business value with GoodBuy HQ
              </p>
              <div className="flex items-center justify-center gap-3 text-base text-muted-foreground mb-12">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                <span className="font-semibold">Free Basic evaluation - Upgrade anytime for advanced features</span>
              </div>
            </div>
            
            <div className="space-y-8">
              <Link href="/auth/register" onClick={handlePrimaryCtaClick}>
                <Button size="lg" className="px-16 py-6 text-2xl font-bold bg-gradient-to-r from-primary to-primary/95 hover:from-primary/95 hover:to-primary/85 text-primary-foreground rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] transition-all duration-300">
                  Get My Free Valuation Now
                  <ChevronRight className="ml-3 h-7 w-7" />
                </Button>
              </Link>
              
              {/* Enhanced Risk Reversal - Larger, more prominent */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                <div className="flex flex-col items-center gap-3 bg-card border border-border p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                  <CheckCircle className="h-8 w-8 text-primary" />
                  <span className="text-center font-semibold text-base">100% Free<br/>No Hidden Fees</span>
                </div>
                <div className="flex flex-col items-center gap-3 bg-card border border-border p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                  <CheckCircle className="h-8 w-8 text-primary" />
                  <span className="text-center font-semibold text-base">No Credit Card<br/>Required</span>
                </div>
                <div className="flex flex-col items-center gap-3 bg-card border border-border p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                  <CheckCircle className="h-8 w-8 text-primary" />
                  <span className="text-center font-semibold text-base">Complete Report<br/>in 8 Minutes</span>
                </div>
                <div className="flex flex-col items-center gap-3 bg-card border border-border p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                  <CheckCircle className="h-8 w-8 text-primary" />
                  <span className="text-center font-semibold text-base">30-Day Money-Back<br/>Guarantee*</span>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                *For premium features only. Free valuation is always free.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}