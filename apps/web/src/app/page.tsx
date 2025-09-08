'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth-store'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/dashboard' as any)
    }
  }, [isAuthenticated, user, router])

  const features = [
    {
      title: "AI-Powered Analysis",
      description: "Get comprehensive business health scores using advanced AI algorithms",
      icon: "🤖"
    },
    {
      title: "Business Valuation",
      description: "Accurate valuations using multiple methodologies and market data",
      icon: "💰"
    },
    {
      title: "Growth Opportunities",
      description: "Identify specific improvement areas with actionable recommendations",
      icon: "📈"
    },
    {
      title: "Instant Results",
      description: "Get detailed reports in minutes, not weeks",
      icon: "⚡"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary pt-20">
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Welcome to GoodBuy HQ
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            AI-Powered Business Valuations & Improvement Recommendations. 
            Get instant insights into your business value and growth opportunities.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="px-8 py-3">
                Get Started Free
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="px-8 py-3">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-4xl mb-2">{feature.icon}</div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How it Works */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto">
                1
              </div>
              <h3 className="text-xl font-semibold">Share Your Business Data</h3>
              <p className="text-muted-foreground">
                Provide key financial and operational metrics through our secure, guided form
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto">
                2
              </div>
              <h3 className="text-xl font-semibold">AI Analysis</h3>
              <p className="text-muted-foreground">
                Our AI analyzes your business across financial, operational, market, and risk factors
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto">
                3
              </div>
              <h3 className="text-xl font-semibold">Get Results</h3>
              <p className="text-muted-foreground">
                Receive comprehensive reports with valuation, health scores, and improvement opportunities
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Value Your Business?</CardTitle>
              <CardDescription className="text-lg">
                Join thousands of business owners who trust GoodBuy HQ for accurate valuations and growth insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center gap-4">
                <Link href="/auth/register">
                  <Button size="lg" className="px-8">
                    Start Free Evaluation
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">
                No credit card required • Get results in minutes
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}