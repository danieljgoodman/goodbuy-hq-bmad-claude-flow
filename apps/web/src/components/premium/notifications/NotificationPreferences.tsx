'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Settings, 
  Bell, 
  Mail, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users
} from 'lucide-react'
import { NotificationPreferences } from '@/lib/services/NotificationService'
import { useAuth } from '@/lib/hooks/useAuth'

export function NotificationPreferencesComponent() {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadPreferences()
    }
  }, [user?.id])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications/preferences')
      const data = await response.json()
      
      if (response.ok) {
        setPreferences(data.preferences)
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    if (!preferences) return

    try {
      setSaving(true)
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      })

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        throw new Error('Failed to save preferences')
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  const updatePreferences = (updates: Partial<NotificationPreferences>) => {
    setPreferences(prev => prev ? { ...prev, ...updates } : null)
  }

  const updateEmailNotifications = (type: keyof NotificationPreferences['emailNotifications'], value: boolean) => {
    if (preferences) {
      updatePreferences({
        emailNotifications: {
          ...preferences.emailNotifications,
          [type]: value
        }
      })
    }
  }

  const updateQuietHours = (field: 'start' | 'end', value: string) => {
    if (preferences) {
      updatePreferences({
        quietHours: {
          ...preferences.quietHours,
          [field]: value
        }
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Notification Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-6 bg-gray-300 rounded w-12"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Unable to load preferences
          </h3>
          <p className="text-gray-600 mb-4">
            There was an error loading your notification preferences.
          </p>
          <Button onClick={loadPreferences}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Notification Preferences</span>
          </CardTitle>
          <CardDescription>
            Customize when and how you receive notifications about opportunities, reminders, and updates
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div>
            <h3 className="flex items-center space-x-2 text-lg font-medium mb-4">
              <Mail className="h-5 w-5" />
              <span>Email Notifications</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <div>
                    <Label className="text-sm font-medium">
                      AI Opportunity Alerts
                    </Label>
                    <p className="text-sm text-gray-600">
                      Get notified when AI detects new business opportunities
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.emailNotifications.opportunities}
                  onCheckedChange={(value) => updateEmailNotifications('opportunities', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <div>
                    <Label className="text-sm font-medium">
                      Implementation Reminders
                    </Label>
                    <p className="text-sm text-gray-600">
                      Reminders for incomplete implementation steps
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.emailNotifications.reminders}
                  onCheckedChange={(value) => updateEmailNotifications('reminders', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="h-4 w-4 text-blue-600" />
                  <div>
                    <Label className="text-sm font-medium">
                      Report Generation
                    </Label>
                    <p className="text-sm text-gray-600">
                      Notifications when professional reports are ready
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.emailNotifications.reports}
                  onCheckedChange={(value) => updateEmailNotifications('reports', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="h-4 w-4 text-purple-600" />
                  <div>
                    <Label className="text-sm font-medium">
                      Milestone Achievements
                    </Label>
                    <p className="text-sm text-gray-600">
                      Celebrate when you reach important milestones
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.emailNotifications.milestones}
                  onCheckedChange={(value) => updateEmailNotifications('milestones', value)}
                />
              </div>
            </div>
          </div>

          {/* Notification Frequency */}
          <div>
            <h3 className="text-lg font-medium mb-4">Notification Frequency</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="frequency" className="text-sm font-medium">
                  Email Frequency
                </Label>
                <Select 
                  value={preferences.frequency}
                  onValueChange={(value: any) => updatePreferences({ frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                    <SelectItem value="weekly">Weekly Summary</SelectItem>
                    <SelectItem value="monthly">Monthly Report</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600 mt-1">
                  How often you receive email notifications
                </p>
              </div>

              <div>
                <Label htmlFor="reminderCadence" className="text-sm font-medium">
                  Reminder Frequency
                </Label>
                <Select 
                  value={preferences.reminderCadence}
                  onValueChange={(value: any) => updatePreferences({ reminderCadence: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cadence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600 mt-1">
                  How often you get implementation reminders
                </p>
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <div>
            <h3 className="text-lg font-medium mb-4">Quiet Hours</h3>
            <p className="text-sm text-gray-600 mb-4">
              No email notifications will be sent during these hours
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quietStart" className="text-sm font-medium">
                  Start Time
                </Label>
                <Input
                  id="quietStart"
                  type="time"
                  value={preferences.quietHours.start}
                  onChange={(e) => updateQuietHours('start', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="quietEnd" className="text-sm font-medium">
                  End Time
                </Label>
                <Input
                  id="quietEnd"
                  type="time"
                  value={preferences.quietHours.end}
                  onChange={(e) => updateQuietHours('end', e.target.value)}
                />
              </div>
            </div>
          </div>

          {saved && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your notification preferences have been saved successfully!
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={savePreferences}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default NotificationPreferencesComponent