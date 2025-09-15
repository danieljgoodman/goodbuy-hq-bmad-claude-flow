'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AccountProfileCard } from './profile/AccountProfileCard'
import { BusinessInfoCard } from './profile/BusinessInfoCard'
import { SubscriptionStatusCard } from './profile/SubscriptionStatusCard'
import { NotificationPreferencesPanel } from './notifications/NotificationPreferencesPanel'
import { DataPrivacyPanel } from './privacy/DataPrivacyPanel'
import { PasswordChangeForm } from './security/PasswordChangeForm'
import { TwoFactorAuthSetup } from './security/TwoFactorAuthSetup'
import { LoginHistoryTable } from './security/LoginHistoryTable'
import { User, Settings, Bell, Shield, Database, CreditCard } from 'lucide-react'
import { AccountData } from '@/lib/services/AccountService'

interface AccountSettingsLayoutProps {
  userId: string
  initialData?: AccountData
}

export function AccountSettingsLayout({ userId, initialData }: AccountSettingsLayoutProps) {
  const [accountData, setAccountData] = useState<AccountData | null>(initialData || null)
  const [loading, setLoading] = useState(!initialData)
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    if (!initialData) {
      loadAccountData()
    }
  }, [userId, initialData])

  const loadAccountData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/account/data?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setAccountData(data)
      }
    } catch (error) {
      console.error('Failed to load account data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDataUpdate = (section: keyof AccountData, data: any) => {
    if (!accountData) return
    
    setAccountData(prev => prev ? {
      ...prev,
      [section]: data
    } : null)
  }

  const getSubscriptionBadgeColor = (tier: string): string => {
    switch (tier.toLowerCase()) {
      case 'premium': return 'bg-blue-100 text-blue-800'
      case 'enterprise': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Settings className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading account settings...</p>
        </div>
      </div>
    )
  }

  if (!accountData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Failed to load account data. Please try again.</p>
        <Button onClick={loadAccountData} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600">Manage your profile, preferences, and security settings</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className={getSubscriptionBadgeColor(accountData.user.subscriptionTier)}>
            {accountData.user.subscriptionTier.charAt(0).toUpperCase() + accountData.user.subscriptionTier.slice(1)}
          </Badge>
          <span className="text-sm text-gray-600">
            Member since {new Date(accountData.user.createdAt).getFullYear()}
          </span>
        </div>
      </div>

      {/* Account Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Completion</CardTitle>
            <User className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {accountData.profile ? 
                Math.round(
                  Object.values({
                    firstName: accountData.profile.firstName,
                    lastName: accountData.profile.lastName,
                    phone: accountData.profile.phone,
                    avatar: accountData.profile.avatar,
                    businessSize: accountData.profile.businessSize
                  }).filter(Boolean).length / 5 * 100
                ) : 0
              }%
            </div>
            <p className="text-xs text-gray-600">Complete your profile</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {accountData.securitySettings?.twoFactorEnabled ? '95' : '75'}
            </div>
            <p className="text-xs text-gray-600">
              {accountData.securitySettings?.twoFactorEnabled ? 'Excellent security' : 'Enable 2FA for better security'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Login</CardTitle>
            <Settings className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {accountData.user.lastLoginAt ? 
                new Date(accountData.user.lastLoginAt).toLocaleDateString() : 'Never'
              }
            </div>
            <p className="text-xs text-gray-600">Account activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AccountProfileCard
              profile={accountData.profile}
              user={accountData.user}
              onUpdate={(data) => handleDataUpdate('profile', data)}
            />
            <BusinessInfoCard
              user={accountData.user}
              profile={accountData.profile}
              onUpdate={(data) => handleDataUpdate('profile', data)}
            />
          </div>
          <SubscriptionStatusCard
            user={accountData.user}
            className="max-w-2xl"
          />
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Subscription Management</h3>
            <p className="text-gray-600 mb-4">
              Manage your subscription, billing history, and payment methods
            </p>
            <Button>Coming Soon</Button>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationPreferencesPanel
            preferences={accountData.preferences}
            onUpdate={(data) => handleDataUpdate('preferences', data)}
          />
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <DataPrivacyPanel
            userId={userId}
            preferences={accountData.preferences}
            onUpdate={(data) => handleDataUpdate('preferences', data)}
          />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="space-y-6">
              <PasswordChangeForm userId={userId} />
              <TwoFactorAuthSetup
                userId={userId}
                securitySettings={accountData.securitySettings}
                onUpdate={(data) => handleDataUpdate('securitySettings', data)}
              />
            </div>
            <div>
              <LoginHistoryTable userId={userId} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}