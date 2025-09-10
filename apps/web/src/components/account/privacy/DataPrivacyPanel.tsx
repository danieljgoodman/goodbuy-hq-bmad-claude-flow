'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserPreferences } from '@/types'
import { Database, Download, Trash2, Shield, Eye, AlertTriangle } from 'lucide-react'

interface DataPrivacyPanelProps {
  userId: string
  preferences: UserPreferences | null
  onUpdate: (preferences: UserPreferences) => void
}

export function DataPrivacyPanel({ userId, preferences, onUpdate }: DataPrivacyPanelProps) {
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [settings, setSettings] = useState({
    data_sharing_analytics: preferences?.privacy.data_sharing_analytics ?? false,
    data_sharing_marketing: preferences?.privacy.data_sharing_marketing ?? false,
    public_profile: preferences?.privacy.public_profile ?? false
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
          type: 'privacy',
          privacy: settings
        })
      })

      if (response.ok) {
        const updatedPreferences = await response.json()
        onUpdate(updatedPreferences)
      }
    } catch (error) {
      console.error('Failed to update privacy preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDataExport = async (type: 'full' | 'profile' | 'evaluations' | 'preferences') => {
    setExporting(true)
    try {
      const response = await fetch('/api/account/data-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          requestType: type
        })
      })

      if (response.ok) {
        // Show success message or update UI
        console.log('Data export requested successfully')
      }
    } catch (error) {
      console.error('Failed to request data export:', error)
    } finally {
      setExporting(false)
    }
  }

  const privacyOptions = [
    {
      key: 'data_sharing_analytics' as const,
      title: 'Analytics & Performance',
      description: 'Allow us to use your anonymized data to improve platform performance and features'
    },
    {
      key: 'data_sharing_marketing' as const,
      title: 'Marketing & Research',
      description: 'Share anonymized business insights for industry research and benchmarking'
    },
    {
      key: 'public_profile' as const,
      title: 'Public Profile',
      description: 'Make your business profile visible to other platform users for networking'
    }
  ]

  const hasChanges = preferences && (
    settings.data_sharing_analytics !== preferences.privacy.data_sharing_analytics ||
    settings.data_sharing_marketing !== preferences.privacy.data_sharing_marketing ||
    settings.public_profile !== preferences.privacy.public_profile
  )

  return (
    <div className="space-y-6">
      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Privacy Settings
            </CardTitle>
            {hasChanges && (
              <Button onClick={handleSave} disabled={saving} size="sm">
                Save Changes
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert>
            <Eye className="h-4 w-4" />
            <AlertDescription>
              Your privacy is important to us. These settings control how your data is used to improve 
              our platform and provide better insights. You can change these settings at any time.
            </AlertDescription>
          </Alert>

          {privacyOptions.map((option) => (
            <div key={option.key} className="flex items-start justify-between space-x-4">
              <div className="flex-1">
                <Label htmlFor={option.key} className="font-medium text-gray-900 cursor-pointer">
                  {option.title}
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  {option.description}
                </p>
              </div>
              <Switch
                id={option.key}
                checked={settings[option.key]}
                onCheckedChange={(checked) => handleToggle(option.key, checked)}
              />
            </div>
          ))}

          <div className="border-t pt-6">
            <h4 className="font-medium text-gray-900 mb-3">Data Processing</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-2">How We Use Your Data</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Business evaluations and analytics for your account only</li>
                <li>• Market intelligence and benchmarking (anonymized)</li>
                <li>• Platform improvement and feature development</li>
                <li>• Security monitoring and fraud prevention</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Data Export
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Download your data in a machine-readable format. This includes all information 
            associated with your account.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-medium">Complete Data Export</Label>
              <p className="text-xs text-gray-600">
                All your account data, evaluations, and preferences
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleDataExport('full')}
                disabled={exporting}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Export All Data
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Profile Data Only</Label>
              <p className="text-xs text-gray-600">
                Your profile information and account settings
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleDataExport('profile')}
                disabled={exporting}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Profile
              </Button>
            </div>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p>
              <strong>Note:</strong> Data exports are processed in the background and may take 
              up to 24 hours. You'll receive an email with a download link when ready. 
              Export links expire after 7 days for security.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Account Deletion */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-red-700">
            <Trash2 className="h-5 w-5" />
            Delete Account
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Warning:</strong> Account deletion is permanent and cannot be undone. 
              All your data, evaluations, and settings will be permanently deleted.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Before deleting your account, consider:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Exporting your data for your records</li>
              <li>• Canceling any active subscriptions</li>
              <li>• Saving any important reports or documents</li>
            </ul>
          </div>

          <Button variant="destructive" size="sm">
            Request Account Deletion
          </Button>

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p>
              Account deletion requests are processed manually and may take up to 30 days to complete. 
              You'll receive confirmation once the process begins. Some data may be retained for legal 
              and compliance purposes as outlined in our Privacy Policy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}