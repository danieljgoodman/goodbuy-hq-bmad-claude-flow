'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CreditCard, Calendar, TrendingUp, Star } from 'lucide-react'

interface SubscriptionStatusCardProps {
  user: {
    subscriptionTier: string
    createdAt: Date
  }
  className?: string
}

export function SubscriptionStatusCard({ user, className = '' }: SubscriptionStatusCardProps) {
  const getSubscriptionInfo = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'premium':
        return {
          name: 'Premium',
          price: '$29/month',
          color: 'bg-blue-100 text-blue-800',
          icon: <Star className="h-4 w-4" />,
          features: [
            'Advanced Analytics',
            'Market Intelligence',
            'Custom Reports',
            'Priority Support',
            'API Access'
          ],
          usage: 75
        }
      case 'enterprise':
        return {
          name: 'Enterprise',
          price: '$99/month',
          color: 'bg-purple-100 text-purple-800',
          icon: <TrendingUp className="h-4 w-4" />,
          features: [
            'All Premium Features',
            'White-label Options',
            'Dedicated Success Manager',
            'Custom Integrations',
            'SLA Guarantee'
          ],
          usage: 45
        }
      default:
        return {
          name: 'Free',
          price: '$0/month',
          color: 'bg-gray-100 text-gray-800',
          icon: <CreditCard className="h-4 w-4" />,
          features: [
            'Basic Dashboard',
            'Standard Reports',
            'Community Support',
            'Limited Analytics'
          ],
          usage: 90
        }
    }
  }

  const subscriptionInfo = getSubscriptionInfo(user.subscriptionTier)
  
  // Calculate membership duration
  const membershipDays = Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
  const membershipMonths = Math.floor(membershipDays / 30)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-green-600" />
          Subscription Status
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Plan */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              {subscriptionInfo.icon}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{subscriptionInfo.name} Plan</h3>
              <p className="text-sm text-gray-600">{subscriptionInfo.price}</p>
            </div>
          </div>
          <Badge className={subscriptionInfo.color}>
            {subscriptionInfo.name}
          </Badge>
        </div>

        {/* Usage Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Monthly Usage</span>
            <span className="text-sm font-medium">{subscriptionInfo.usage}%</span>
          </div>
          <Progress value={subscriptionInfo.usage} className="h-2" />
          <p className="text-xs text-gray-500">
            {subscriptionInfo.usage < 80 ? 'You\'re within your plan limits' : 'Consider upgrading for more capacity'}
          </p>
        </div>

        {/* Membership Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div>
              <div className="font-medium">{membershipMonths} months</div>
              <div className="text-gray-600">Member duration</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-400" />
            <div>
              <div className="font-medium">Active</div>
              <div className="text-gray-600">Account status</div>
            </div>
          </div>
        </div>

        {/* Plan Features */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Current Plan Features</h4>
          <div className="space-y-2">
            {subscriptionInfo.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-gray-600">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4 border-t">
          {user.subscriptionTier === 'free' ? (
            <div className="space-y-3">
              <Button className="w-full">
                Upgrade to Premium
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Get advanced features and priority support
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                Manage Billing
              </Button>
              <Button variant="outline" className="flex-1">
                Change Plan
              </Button>
            </div>
          )}
          
          <Button variant="ghost" className="w-full text-sm">
            View Billing History
          </Button>
        </div>

        {/* Next Billing Date (for paid plans) */}
        {user.subscriptionTier !== 'free' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800 font-medium">Next Billing Date</span>
              <span className="text-sm text-blue-600">
                {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              You'll be charged {subscriptionInfo.price} on this date
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}