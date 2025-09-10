'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { UserProfile } from '@/types'
import { Building2, Save, X, Users } from 'lucide-react'

interface BusinessInfoCardProps {
  user: {
    id: string
    businessName: string
    industry: string
    role: string
    subscriptionTier: string
    createdAt: Date
  }
  profile: UserProfile | null
  onUpdate: (profile: UserProfile) => void
  className?: string
}

const BUSINESS_SIZES = [
  { value: 'solo', label: 'Solo (Just me)' },
  { value: 'micro', label: 'Micro (2-5 employees)' },
  { value: 'small', label: 'Small (6-25 employees)' },
  { value: 'medium', label: 'Medium (26-100 employees)' },
  { value: 'large', label: 'Large (101-500 employees)' },
  { value: 'enterprise', label: 'Enterprise (500+ employees)' }
]

export function BusinessInfoCard({ user, profile, onUpdate, className = '' }: BusinessInfoCardProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    businessSize: profile?.businessSize || ''
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...formData
        })
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        onUpdate(updatedProfile)
        setEditing(false)
      }
    } catch (error) {
      console.error('Failed to update business info:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      businessSize: profile?.businessSize || ''
    })
    setEditing(false)
  }

  const getBusinessSizeLabel = (value: string) => {
    return BUSINESS_SIZES.find(size => size.value === value)?.label || value
  }

  const getRoleBadgeColor = (role: string): string => {
    switch (role.toLowerCase()) {
      case 'owner': return 'bg-green-100 text-green-800'
      case 'manager': return 'bg-blue-100 text-blue-800'
      case 'advisor': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSubscriptionFeatures = (tier: string): string[] => {
    switch (tier.toLowerCase()) {
      case 'premium':
        return ['Advanced Analytics', 'Market Intelligence', 'Priority Support', 'Custom Reports']
      case 'enterprise':
        return ['All Premium Features', 'White-label Options', 'API Access', 'Dedicated Success Manager']
      default:
        return ['Basic Dashboard', 'Standard Reports', 'Community Support']
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-green-600" />
            Business Information
          </CardTitle>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Edit Business Info
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Business Overview */}
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">{user.businessName}</h3>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="text-blue-600">
                {user.industry}
              </Badge>
              <Badge className={getRoleBadgeColor(user.role)}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
            </div>
          </div>

          {/* Business Size */}
          <div className="space-y-2">
            <Label htmlFor="businessSize" className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600" />
              Company Size
            </Label>
            {editing ? (
              <Select
                value={formData.businessSize}
                onValueChange={(value) => setFormData(prev => ({ ...prev, businessSize: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_SIZES.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-gray-900 font-medium">
                {formData.businessSize ? getBusinessSizeLabel(formData.businessSize) : (
                  <span className="text-gray-500 italic">Not specified</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Account Status */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Account Status</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Subscription Plan</span>
              <Badge 
                variant="outline" 
                className={user.subscriptionTier === 'premium' ? 'text-blue-600' : 
                          user.subscriptionTier === 'enterprise' ? 'text-purple-600' : 
                          'text-gray-600'}
              >
                {user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1)}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Member Since</span>
              <span className="text-sm font-medium">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Plan Features */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Current Plan Features</h4>
          <div className="space-y-2">
            {getSubscriptionFeatures(user.subscriptionTier).map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-gray-600">{feature}</span>
              </div>
            ))}
          </div>
          
          {user.subscriptionTier === 'free' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">
                Upgrade to unlock more features
              </p>
              <p className="text-sm text-blue-600 mb-3">
                Get advanced analytics, market intelligence, and priority support with a Premium plan.
              </p>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Upgrade Now
              </Button>
            </div>
          )}
        </div>

        {/* Business Context Help */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <h5 className="text-sm font-medium text-gray-900 mb-2">
            Why we collect this information
          </h5>
          <p className="text-xs text-gray-600">
            Business size and industry information helps us provide more accurate 
            benchmarks, relevant market intelligence, and tailored improvement recommendations.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}