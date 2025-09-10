'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth-store'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useHomepageAnalytics, useSectionTracking } from '@/hooks/useHomepageAnalytics'
import { Shield, Award, Building, CheckCircle, BarChart3, Clock, Upload, Brain, Target, ChevronRight } from 'lucide-react'

export default function Home() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const { trackPageView, trackButtonClick, trackTrialSignup, variant, hasConsent } = useHomepageAnalytics()
  
  // Section refs for tracking
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const testimonialsRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  // Setup section tracking
  useSectionTracking('hero', heroRef)
  useSectionTracking('features', featuresRef)
  useSectionTracking('how-it-works', stepsRef)
  useSectionTracking('testimonials', testimonialsRef)
  useSectionTracking('final-cta', ctaRef)

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/dashboard' as any)
    }
  }, [isAuthenticated, user, router])

  // Track page view on mount
  useEffect(() => {
    if (hasConsent) {
      trackPageView()
    }
  }, [trackPageView, hasConsent])

  // Handle CTA button clicks with analytics
  const handlePrimaryCtaClick = () => {
    trackButtonClick('cta_primary')
    trackTrialSignup()
  }

  const handleSecondaryCtaClick = () => {
    trackButtonClick('cta_secondary')
  }

  const handleTrustSignalClick = () => {
    trackButtonClick('trust_signal')
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
  ]

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div ref={heroRef} className="text-center mb-24 space-y-12">
          {/* Hero Gradient Orb */}
          <div className="relative mb-16">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-96 h-96 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 rounded-full opacity-20 blur-3xl"></div>
            </div>
            <div className="relative z-10 space-y-8">
              <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight max-w-4xl mx-auto">
                Professional Business Valuations in Minutes
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                AI-powered valuations trusted by 10,000+ business owners. 
                Get accurate results without the $5,000 consultant fee.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
                <Link href="/auth/register" onClick={handlePrimaryCtaClick}>
                  <Button size="lg" className="px-8 py-3 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors">
                    Start Free Valuation
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth/login" onClick={handleSecondaryCtaClick}>
                  <Button variant="ghost" size="lg" className="px-8 py-3 text-base font-medium text-muted-foreground hover:text-foreground">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Trust Indicators */}
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-3">
                <div className="w-12 h-12 mx-auto bg-secondary rounded-full flex items-center justify-center">
                  <Shield className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div className="text-sm font-medium text-foreground">Bank-level security</div>
                <div className="text-xs text-muted-foreground">256-bit encryption</div>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 mx-auto bg-secondary rounded-full flex items-center justify-center">
                  <Award className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div className="text-sm font-medium text-foreground">4.9/5 rating</div>
                <div className="text-xs text-muted-foreground">1,200+ reviews</div>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 mx-auto bg-secondary rounded-full flex items-center justify-center">
                  <Building className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div className="text-sm font-medium text-foreground">Fortune 500 trusted</div>
                <div className="text-xs text-muted-foreground">Enterprise grade</div>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 mx-auto bg-secondary rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div className="text-sm font-medium text-foreground">AICPA certified</div>
                <div className="text-xs text-muted-foreground">Industry standard</div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Demo Section */}
        <div ref={featuresRef} className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">See it in action</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our AI analyzes your business using 5 proven valuation methods simultaneously
            </p>
          </div>
          
          {/* Mock Dashboard Preview */}
          <div className="max-w-5xl mx-auto mb-20">
            <div className="bg-muted rounded-2xl p-8 border border-border">
              <div className="bg-card rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-card-foreground">Business Valuation Report</h3>
                  <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">Complete</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <div className="text-2xl font-bold text-foreground">$1.2M</div>
                    <div className="text-sm text-muted-foreground">Asset-Based Value</div>
                  </div>
                  <div className="text-center p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
                    <div className="text-2xl font-bold text-primary">$2.4M</div>
                    <div className="text-sm text-muted-foreground">Market Value (Recommended)</div>
                  </div>
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <div className="text-2xl font-bold text-foreground">$3.1M</div>
                    <div className="text-sm text-muted-foreground">Income-Based Value</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 mx-auto bg-secondary rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* How it Works */}
        <div ref={stepsRef} className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">How it works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get professional valuations in three simple steps
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-12">
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
                  <div key={step.step} className="text-center">
                    <div className="mb-6">
                      <div className="w-16 h-16 mx-auto bg-primary text-primary-foreground rounded-full flex items-center justify-center mb-4">
                        <IconComponent className="h-8 w-8" />
                      </div>
                      <div className="text-sm font-mono text-muted-foreground">{step.step}</div>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div ref={testimonialsRef} className="mb-24">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  quote: "GoodBuy HQ's valuation was spot-on when I sold my company. Their AI caught details my expensive consultant missed.",
                  author: "Sarah Chen",
                  title: "Tech Startup Founder",
                  company: "Sold for $2.1M"
                },
                {
                  quote: "The growth recommendations increased our value by 45% in just 8 months. Best investment I've made in my business.",
                  author: "Michael Rodriguez", 
                  title: "Manufacturing CEO",
                  company: "15 years experience"
                },
                {
                  quote: "Finally, a valuation service that understands small businesses. Quick, accurate, and incredibly affordable.",
                  author: "Lisa Thompson",
                  title: "Retail Business Owner",
                  company: "3 locations"
                }
              ].map((testimonial, index) => (
                <div key={index} className="bg-card rounded-xl p-8 border border-border">
                  <div className="mb-6">
                    <div className="text-muted-foreground text-2xl mb-3">"</div>
                    <p className="text-card-foreground leading-relaxed">
                      {testimonial.quote}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-secondary rounded-full"></div>
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.title}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.company}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div ref={ctaRef} className="text-center">
          <div className="max-w-2xl mx-auto space-y-8">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Ready to value your business?
              </h2>
              <p className="text-xl text-muted-foreground">
                Join 10,000+ business owners who trust GoodBuy HQ for accurate valuations
              </p>
            </div>
            
            <div className="space-y-6">
              <Link href="/auth/register" onClick={handlePrimaryCtaClick}>
                <Button size="lg" className="px-8 py-3 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg">
                  Start Free Valuation
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              
              <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>10-minute process</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Instant results</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}