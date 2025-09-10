'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { UserPreferences } from '@/types'
import { Bell, Mail, AlertTriangle, TrendingUp, CreditCard, Save } from 'lucide-react'

interface NotificationPreferencesPanelProps {
  preferences: UserPreferences | null
  onUpdate: (preferences: UserPreferences) => void
}

export function NotificationPreferencesPanel({ preferences, onUpdate }: NotificationPreferencesPanelProps) {
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    email_updates: preferences?.notifications.email_updates ?? true,
    platform_alerts: preferences?.notifications.platform_alerts ?? true,
    market_intelligence: preferences?.notifications.market_intelligence ?? true,
    improvement_reminders: preferences?.notifications.improvement_reminders ?? true,
    billing_updates: preferences?.notifications.billing_updates ?? true
  })

  const handleToggle = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!preferences) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/account/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: preferences.userId,
          type: 'notifications',
          notifications: settings
        })
      })

      if (response.ok) {
        const updatedPreferences = await response.json()
        onUpdate(updatedPreferences)
      }
    } catch (error) {
      console.error('Failed to update notification preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  const notificationOptions = [
    {
      key: 'email_updates' as const,
      icon: <Mail className="h-4 w-4 text-blue-600" />,
      title: 'Email Updates',
      description: 'Receive weekly email updates with platform news, feature announcements, and tips'
    },
    {
      key: 'platform_alerts' as const,
      icon: <Bell className="h-4 w-4 text-purple-600" />,
      title: 'Platform Alerts',
      description: 'Get notified about important platform events, maintenance, and system updates'
    },
    {
      key: 'market_intelligence' as const,
      icon: <TrendingUp className="h-4 w-4 text-green-600" />,
      title: 'Market Intelligence',
      description: 'Receive alerts about market trends, competitive insights, and industry opportunities'
    },
    {
      key: 'improvement_reminders' as const,
      icon: <AlertTriangle className="h-4 w-4 text-orange-600" />,
      title: 'Improvement Reminders',
      description: 'Get reminders to review and act on business improvement recommendations'
    },
    {
      key: 'billing_updates' as const,
      icon: <CreditCard className="h-4 w-4 text-red-600" />,
      title: 'Billing & Account',
      description: 'Important notifications about billing, subscription changes, and account security'
    }
  ]

  const hasChanges = preferences && (
    settings.email_updates !== preferences.notifications.email_updates ||
    settings.platform_alerts !== preferences.notifications.platform_alerts ||
    settings.market_intelligence !== preferences.notifications.market_intelligence ||
    settings.improvement_reminders !== preferences.notifications.improvement_reminders ||
    settings.billing_updates !== preferences.notifications.billing_updates
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              Notification Preferences
            </CardTitle>
            {hasChanges && (
              <Button onClick={handleSave} disabled={saving} size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {notificationOptions.map((option) => (
            <div key={option.key} className="flex items-start justify-between space-x-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-gray-100 rounded-lg mt-0.5">
                  {option.icon}
                </div>
                <div className="flex-1">
                  <Label htmlFor={option.key} className="font-medium text-gray-900 cursor-pointer">
                    {option.title}
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
              <Switch
                id={option.key}
                checked={settings[option.key]}
                onCheckedChange={(checked) => handleToggle(option.key, checked)}
              />
            </div>
          ))}

          {/* Email Frequency Section */}
          <div className="border-t pt-6">
            <h4 className="font-medium text-gray-900 mb-4">Email Frequency</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Digest Emails</Label>
                  <p className="text-sm text-gray-600">Combine multiple notifications into daily or weekly emails</p>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Quiet Hours</Label>
                  <p className="text-sm text-gray-600">Set times when you don't want to receive notifications</p>
                </div>
                <Button variant="outline" size="sm">
                  Set Hours
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Notifications */}
          <div className="border-t pt-6">
            <h4 className="font-medium text-gray-900 mb-4">Mobile Notifications</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-blue-600" />
                <div>
                  <h5 className="font-medium text-blue-900">Mobile App Available Soon</h5>
                  <p className="text-sm text-blue-700">
                    Get push notifications on your mobile device when our app launches
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-3">
                Notify Me When Available
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">New Market Intelligence Available</p>
                <p className="text-xs text-gray-600">Industry trends updated for Technology sector</p>
              </div>
              <span className="text-xs text-gray-500">2h ago</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Improvement Reminder</p>
                <p className="text-xs text-gray-600">Review your cost optimization opportunities</p>
              </div>
              <span className="text-xs text-gray-500">1d ago</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Weekly Digest</p>
                <p className="text-xs text-gray-600">Your business performance summary is ready</p>
              </div>
              <span className="text-xs text-gray-500">3d ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}