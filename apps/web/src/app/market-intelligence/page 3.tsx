'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Crown, TrendingUp, BarChart3, Target, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'

export default function MarketIntelligence() {
  const { user } = useAuth()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)

  const checkAccess = async () => {
    if (!user?.id) return
    
    try {
      const response = await fetch('/api/premium/check-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          featureType: 'analytics',
          requiredTier: 'ENTERPRISE'
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        setHasAccess(result.hasAccess)
      } else {
        setHasAccess(false)
      }
    } catch (error) {
      console.error('Error checking access:', error)
      setHasAccess(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      checkAccess()
    }
  }, [user?.id])

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-600">Please sign in to access market intelligence.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (hasAccess === false) {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <Crown className="h-8 w-8 text-amber-500 mr-2" />
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">PRO Feature</Badge>
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Market Intelligence
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Get deep insights into market trends, industry performance, and competitive positioning to make informed strategic decisions
        </p>
      </div>

      {/* Upgrade Notice */}
      <Card className="mb-8 border-amber-200 bg-amber-50">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-amber-600 mr-3" />
            <div>
              <h3 className="font-semibold text-amber-900">Premium Feature Required</h3>
              <p className="text-amber-700">Upgrade to Professional to access Market Intelligence</p>
            </div>
          </div>
          <Link href="/subscription">
            <Button className="bg-amber-600 hover:bg-amber-700">
              Upgrade Now
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Feature Preview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary" />
              Market Trends
            </CardTitle>
            <CardDescription>
              Track industry-wide performance and emerging trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground mb-2">Coming Soon</div>
            <p className="text-sm text-muted-foreground">
              Real-time market data and trend analysis for your industry sector
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-primary" />
              Competitive Analysis
            </CardTitle>
            <CardDescription>
              Compare your performance against industry peers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground mb-2">Coming Soon</div>
            <p className="text-sm text-muted-foreground">
              Detailed competitive positioning and market share insights
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-primary" />
              Strategic Insights
            </CardTitle>
            <CardDescription>
              AI-powered recommendations for market opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground mb-2">Coming Soon</div>
            <p className="text-sm text-muted-foreground">
              Actionable insights to capitalize on market opportunities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-muted rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Ready to unlock market insights?</h2>
        <p className="text-muted-foreground mb-6">
          Join thousands of business owners making data-driven decisions
        </p>
        <div className="space-x-4">
          <Link href="/subscription">
            <Button size="lg">
              Upgrade to Professional
            </Button>
          </Link>
          <Link href="/support">
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
  }

  // Premium content - show actual market intelligence dashboard
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center space-x-2">
          <BarChart3 className="h-8 w-8" />
          <span>Market Intelligence</span>
          <Crown className="h-6 w-6 text-yellow-600" />
        </h1>
        <p className="text-lg text-muted-foreground">
          Deep insights into market trends, industry performance, and competitive positioning
        </p>
      </div>

      {/* Market Intelligence Dashboard */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Market Trends
            </CardTitle>
            <CardDescription>
              Track industry-wide performance and emerging trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 mb-2">+12.8%</div>
            <p className="text-sm text-muted-foreground">
              Industry growth rate for technology sector
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
              Competitive Analysis
            </CardTitle>
            <CardDescription>
              Compare your performance against industry peers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 mb-2">Top 25%</div>
            <p className="text-sm text-muted-foreground">
              Your ranking in industry performance metrics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-purple-600" />
              Strategic Insights
            </CardTitle>
            <CardDescription>
              AI-powered recommendations for market opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 mb-2">5 Opportunities</div>
            <p className="text-sm text-muted-foreground">
              Market opportunities identified for your business
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Market Analysis */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Industry Performance Analysis</CardTitle>
          <CardDescription>Your position in the technology market</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-green-800">Strong Market Position</h4>
                <p className="text-sm text-green-600">Your business health score ranks in the top quartile</p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-blue-800">Growth Opportunity</h4>
                <p className="text-sm text-blue-600">Market expansion potential identified in your sector</p>
              </div>
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-purple-800">Competitive Advantage</h4>
                <p className="text-sm text-purple-600">Your financial controls outperform industry standards</p>
              </div>
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}