'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BarChart3, 
  Crown, 
  AlertTriangle, 
  TrendingUp,
  Users,
  Target,
  Award
} from 'lucide-react'
import { BenchmarkingDashboard } from '@/components/premium/benchmarking/BenchmarkingDashboard'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'

export default function BenchmarkingPage() {
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
          featureType: 'benchmarks',
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

  // Check access on component mount
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
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-600">Please sign in to access industry benchmarking.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (hasAccess === false) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Industry Benchmarking</h1>
          <p className="text-lg text-muted-foreground">
            Compare your performance against industry standards and peer businesses
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <Crown className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Premium Feature</h3>
            <p className="text-gray-600 mb-6">
              Industry benchmarking and competitive analysis are available with a premium subscription.
            </p>
            
            <div className="max-w-2xl mx-auto space-y-6">
              <Alert>
                <Crown className="h-4 w-4" />
                <AlertDescription>
                  <strong>Benchmarking Features include:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Industry benchmark comparisons with anonymized aggregate data</li>
                    <li>Peer group analysis and competitive positioning</li>
                    <li>SWOT analysis based on performance relative to industry standards</li>
                    <li>Market trend integration with economic context</li>
                    <li>AI-generated insights and recommendations for improvement</li>
                    <li>Competitive advantage identification and gap analysis</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-medium mb-1">Industry Benchmarks</h4>
                    <p className="text-sm text-muted-foreground">
                      Compare against industry standards
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-medium mb-1">Peer Comparisons</h4>
                    <p className="text-sm text-muted-foreground">
                      Anonymous comparisons with similar businesses
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-medium mb-1">Competitive Analysis</h4>
                    <p className="text-sm text-muted-foreground">
                      Strategic positioning and advantage identification
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Link href="/subscription">
                <Button size="lg" className="w-full">
                  <Crown className="h-5 w-5 mr-2" />
                  Upgrade to Premium
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center space-x-2">
          <BarChart3 className="h-8 w-8" />
          <span>Industry Benchmarking</span>
          <Crown className="h-6 w-6 text-yellow-600" />
        </h1>
        <p className="text-lg text-muted-foreground">
          Understand your competitive position through comprehensive industry analysis
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span>Industry Standards</span>
            </CardTitle>
            <CardDescription>
              Compare against aggregated industry data
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <span>Peer Analysis</span>
            </CardTitle>
            <CardDescription>
              Anonymous comparison with similar businesses
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span>Market Trends</span>
            </CardTitle>
            <CardDescription>
              Industry growth and economic context
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-orange-600" />
              <span>AI Insights</span>
            </CardTitle>
            <CardDescription>
              Competitive analysis and recommendations
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Main Benchmarking Dashboard */}
      <BenchmarkingDashboard industryCode="tech" />
    </div>
  )
}