'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Crown, Zap, Sparkles, ArrowRight, CheckCircle } from 'lucide-react'

export default function TierRedirectPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && user) {
      const tier = (user.publicMetadata as any)?.subscriptionTier || 'free'
      console.log('User tier detected:', tier)

      // Auto-redirect after a short delay
      setTimeout(() => {
        if (tier === 'enterprise' || tier === 'ENTERPRISE') {
          router.push('/dashboard/enterprise')
        } else if (tier === 'premium' || tier === 'professional' || tier === 'PROFESSIONAL') {
          router.push('/dashboard/professional')
        } else {
          router.push('/dashboard')
        }
      }, 2000)
    }
  }, [isLoaded, user, router])

  const tier = (user?.publicMetadata as any)?.subscriptionTier || 'free'

  const getTierInfo = () => {
    if (tier === 'enterprise' || tier === 'ENTERPRISE') {
      return {
        title: 'Enterprise Dashboard',
        icon: Crown,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        features: [
          'Advanced AI-Powered Analytics',
          'Multi-Entity Management',
          'Custom Integrations',
          'Priority Support',
          'White-Label Reports'
        ],
        path: '/dashboard/enterprise'
      }
    } else if (tier === 'premium' || tier === 'professional' || tier === 'PROFESSIONAL') {
      return {
        title: 'Professional Dashboard',
        icon: Zap,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        features: [
          'Enhanced Business Intelligence',
          'Competitive Analysis',
          'ROI Calculators',
          'Multi-Year Trends',
          'Export to PowerPoint'
        ],
        path: '/dashboard/professional'
      }
    } else {
      return {
        title: 'Basic Dashboard',
        icon: Sparkles,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        features: [
          'Business Health Score',
          'Basic Valuation',
          'Key Metrics',
          'Simple Reports',
          'Email Support'
        ],
        path: '/dashboard'
      }
    }
  }

  const tierInfo = getTierInfo()
  const Icon = tierInfo.icon

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-lg">Loading your dashboard...</div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Card className="max-w-md w-full mx-4">
        <CardHeader className="text-center">
          <div className={`mx-auto w-16 h-16 rounded-full ${tierInfo.bgColor} flex items-center justify-center mb-4`}>
            <Icon className={`w-8 h-8 ${tierInfo.color}`} />
          </div>
          <CardTitle className="text-2xl">
            Welcome to Your {tierInfo.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            Redirecting you to your personalized dashboard with exclusive features...
          </p>

          <div className="space-y-2">
            <p className="font-semibold text-sm text-gray-700">Your tier includes:</p>
            <ul className="space-y-1">
              {tierInfo.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <Button
            onClick={() => router.push(tierInfo.path)}
            className="w-full"
          >
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <div className="text-center">
            <div className="inline-flex items-center gap-1 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Redirecting automatically...
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}