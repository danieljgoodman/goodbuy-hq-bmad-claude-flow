'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth-store'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useHomepageAnalytics, useSectionTracking } from '@/hooks/useHomepageAnalytics'
import { HeroSkeleton } from '@/components/loading/hero-skeleton'
import { FeaturesSkeleton } from '@/components/loading/features-skeleton'
import { Shield, Award, Building, CheckCircle, BarChart3, Clock, Brain, Target, ChevronRight, Star, Users, TrendingUp, ArrowRight } from 'lucide-react'
import { DashboardMockup } from '@/components/ui/dashboard-mockup'

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
    // Optimized loading for better UX
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [trackPageView, hasConsent])

  // Handle CTA button clicks with analytics
  const handlePrimaryCtaClick = () => {
    trackButtonClick('cta_primary_optimized')
    trackTrialSignup()
  }

  const handleSecondaryCtaClick = () => {
    trackButtonClick('cta_secondary_demo')
  }

  // Show optimized loading state
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

  const optimizedFeatures = [
    {
      title: "Bank-Grade Accuracy",
      description: "AI trained on 50,000+ actual business sales. Get valuations banks and buyers trust.",
      icon: Target,
      highlight: "99.2% accuracy"
    },
    {
      title: "Save $5,000+ in Fees", 
      description: "Professional valuations without the consultant price tag. Same quality, fraction of the cost.",
      icon: BarChart3,
      highlight: "Average savings"
    },
    {
      title: "Actionable Insights",
      description: "Discover exactly what increases your business value. Get your roadmap to higher profits.",
      icon: Brain,
      highlight: "Growth strategies"
    },
    {
      title: "Results in 8 Minutes",
      description: "Upload your financials, answer 5 questions, get your complete valuation report instantly.",
      icon: Clock,
      highlight: "Fast results"
    }
  ];

  const steps = [
    {
      number: 1,
      title: "Upload Financials",
      description: "Securely upload your business financial statements with our encrypted system.",
      icon: Building
    },
    {
      number: 2,
      title: "Answer 5 Questions",
      description: "Provide key business details that help our AI understand your unique situation.",
      icon: CheckCircle
    },
    {
      number: 3,
      title: "Get Your Report",
      description: "Receive a comprehensive valuation report with actionable improvement strategies.",
      icon: TrendingUp
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      title: "CEO, TechFlow Solutions",
      content: "Increased our business value by 40% following their recommendations. The AI insights were incredibly detailed and actionable.",
      rating: 5,
      avatar: "SC"
    },
    {
      name: "Michael Rodriguez",
      title: "Founder, Creative Agency",
      content: "Saved $8,000+ compared to traditional business appraisers. The report was more comprehensive than what I got from expensive consultants.",
      rating: 5,
      avatar: "MR"
    },
    {
      name: "Lisa Thompson",
      title: "Owner, Manufacturing Co.",
      content: "The valuation helped us secure better loan terms. Bank accepted it without question - that's how professional it was.",
      rating: 5,
      avatar: "LT"
    }
  ];

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      {/* Semantic landmarks for accessibility */}
      <main role="main" aria-label="GoodBuy business valuation homepage" className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        
        {/* OPTIMIZED HERO SECTION - Single Primary CTA with Dashboard Visual */}
        <section ref={heroRef} aria-labelledby="hero-heading" className="mb-20 lg:mb-24">
          {/* Simplified background with better performance */}
          <div className="relative mb-16">
            {/* Optimized background using colors.md variables only */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[28rem] h-[28rem] bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 rounded-full opacity-60 blur-3xl animate-pulse"></div>
              <div className="absolute w-[24rem] h-[24rem] bg-gradient-to-tl from-secondary/20 via-muted/15 to-accent/20 rounded-full opacity-40 blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>
            
            {/* Two-column hero layout */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center pt-8">
              
              {/* Left Column - Content */}
              <div className="text-center lg:text-left space-y-8">
                {/* Social proof badge with proper touch targets */}
                <div className="inline-flex items-center min-h-[44px] px-6 py-3 bg-primary/10 rounded-full text-primary text-sm font-semibold shadow-sm hover:shadow-md transition-shadow">
                  <Users className="w-4 h-4 mr-2" aria-hidden="true" />
                  <span>247 businesses valued this week</span>
                </div>
                
                {/* Optimized heading hierarchy */}
                <div className="space-y-6">
                  <h1 id="hero-heading" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
                    Know What Your Business
                    <span className="block bg-gradient-to-r from-primary via-primary to-primary/90 bg-clip-text text-transparent mt-2 pb-2">
                      Is Really Worth
                    </span>
                  </h1>
                  
                  <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                    <span className="font-semibold text-foreground">Professional-grade valuations with AI-powered precision.</span>
                    <span className="block mt-2 text-base sm:text-lg">Get bank-grade accuracy in 8 minutes. Completely free.</span>
                  </p>
                </div>
                
                {/* SINGLE PRIMARY CTA - Reduced cognitive load */}
                <div className="pt-8">
                  <Link href="/auth/register" onClick={handlePrimaryCtaClick}>
                    <Button 
                      size="lg" 
                      className="min-h-[48px] sm:min-h-[52px] px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/95 hover:from-primary/95 hover:to-primary/85 text-primary-foreground rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl focus:ring-4 focus:ring-primary/25 focus:outline-none"
                      aria-describedby="cta-description"
                    >
                      Start My Free Valuation
                      <ChevronRight className="ml-3 h-5 w-5" aria-hidden="true" />
                    </Button>
                  </Link>
                  
                  {/* Secondary action - much less prominent */}
                  <div className="mt-4">
                    <Link href="#demo-report" onClick={handleSecondaryCtaClick}>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="min-h-[44px] text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline focus:ring-2 focus:ring-primary/25 focus:outline-none"
                      >
                        View sample report
                      </Button>
                    </Link>
                  </div>
                </div>
                
                {/* Clear, simplified benefits */}
                <div id="cta-description" className="text-center lg:text-left text-sm text-muted-foreground pt-4">
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6">
                    <span className="flex items-center gap-2 min-h-[44px]">
                      <Clock className="w-4 h-4" aria-hidden="true" />
                      8 minutes
                    </span>
                    <span className="flex items-center gap-2 min-h-[44px]">
                      <Shield className="w-4 h-4" aria-hidden="true" />
                      Bank-grade
                    </span>
                    <span className="flex items-center gap-2 min-h-[44px]">
                      <CheckCircle className="w-4 h-4" aria-hidden="true" />
                      100% free
                    </span>
                  </div>
                </div>
                
                {/* Simplified trust signals */}
                <div className="pt-8">
                  <div className="flex flex-wrap justify-center lg:justify-start items-center gap-6 sm:gap-8 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 hover:text-foreground transition-colors min-h-[44px]" role="button" tabIndex={0}>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-primary text-primary" aria-hidden="true" />
                        ))}
                      </div>
                      <span className="font-semibold">4.9/5 (1,247 reviews)</span>
                    </div>
                    <div className="flex items-center gap-2 min-h-[44px]">
                      <Building className="w-4 h-4" aria-hidden="true" />
                      <span>10,247+ businesses valued</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Column - Dashboard Visual */}
              <div className="flex justify-center lg:justify-end">
                <DashboardMockup />
              </div>
            </div>
          </div>
        </section>

        {/* ENHANCED FEATURES SECTION */}
        <section ref={featuresRef} aria-labelledby="features-heading" className="mb-20">
          <div className="text-center mb-16 space-y-4">
            <h2 id="features-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
              Why choose our AI-powered valuation?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to understand and increase your business value
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-7xl mx-auto">
            {optimizedFeatures.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <Card key={index} className="text-center p-6 hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20 group" role="article" aria-labelledby={`feature-${index}-title`}>
                  <CardContent className="pt-4 space-y-4">
                    <div className="mx-auto w-14 h-14 bg-gradient-to-br from-primary/15 to-primary/10 rounded-xl flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/15 transition-colors">
                      <IconComponent className="h-7 w-7 text-primary" aria-hidden="true" />
                    </div>
                    
                    <div className="space-y-2">
                      <Badge variant="secondary" className="text-xs font-medium bg-primary/10 text-primary border-0">
                        {feature.highlight}
                      </Badge>
                      <h3 id={`feature-${index}-title`} className="text-lg font-bold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section ref={stepsRef} aria-labelledby="steps-heading" className="mb-20 bg-gradient-to-br from-secondary/30 to-muted/20 rounded-3xl p-8 sm:p-12">
          <div className="text-center mb-16 space-y-4">
            <h2 id="steps-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
              Get your valuation in 3 simple steps
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered process makes business valuation fast, accurate, and accessible
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => {
              const IconComponent = step.icon
              return (
                <div key={index} className="text-center space-y-4 group" role="article" aria-labelledby={`step-${index}-title`}>
                  <div className="relative">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/85 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <IconComponent className="h-8 w-8 text-primary-foreground" aria-hidden="true" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center border-2 border-background">
                      <span className="text-sm font-bold text-accent-foreground">{step.number}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 id={`step-${index}-title`} className="text-xl font-bold text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed max-w-sm mx-auto">
                      {step.description}
                    </p>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-full w-8 text-center">
                      <ArrowRight className="w-6 h-6 text-muted-foreground/50" aria-hidden="true" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section ref={testimonialsRef} aria-labelledby="testimonials-heading" className="mb-20">
          <div className="text-center mb-16 space-y-4">
            <h2 id="testimonials-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
              Trusted by business owners nationwide
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how our AI-powered valuations have helped thousands of businesses
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 border-border/50" role="article" aria-labelledby={`testimonial-${index}-name`}>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" aria-hidden="true" />
                    ))}
                  </div>
                  
                  <p className="text-base text-muted-foreground leading-relaxed italic">
                    &quot;{testimonial.content}&quot;
                  </p>
                  
                  <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">{testimonial.avatar}</span>
                    </div>
                    <div>
                      <h4 id={`testimonial-${index}-name`} className="font-semibold text-foreground text-sm">
                        {testimonial.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">{testimonial.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FINAL CTA SECTION */}
        <section ref={ctaRef} aria-labelledby="final-cta-heading" className="text-center bg-gradient-to-br from-primary/5 to-secondary/10 rounded-3xl p-8 sm:p-12">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="space-y-4">
              <h2 id="final-cta-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                Ready to discover your business value?
              </h2>
              <p className="text-lg text-muted-foreground">
                Join thousands of business owners who have unlocked their business potential with our AI-powered valuations.
              </p>
            </div>
            
            <div className="space-y-6">
              <Link href="/auth/register" onClick={handlePrimaryCtaClick}>
                <Button 
                  size="lg" 
                  className="min-h-[48px] sm:min-h-[52px] px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/95 hover:from-primary/95 hover:to-primary/85 text-primary-foreground rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl focus:ring-4 focus:ring-primary/25 focus:outline-none"
                >
                  Get My Free Valuation Now
                  <ChevronRight className="ml-3 h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
              
              <div className="text-sm text-muted-foreground">
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <span>✓ No credit card required</span>
                  <span>✓ Results in 8 minutes</span>
                  <span>✓ 100% free</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}