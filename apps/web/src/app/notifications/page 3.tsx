'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bell, 
  Settings, 
  TrendingUp, 
  BarChart3,
  Crown,
  AlertTriangle
} from 'lucide-react'
import { NotificationCenter } from '@/components/premium/notifications/NotificationCenter'
import { NotificationPreferencesComponent } from '@/components/premium/notifications/NotificationPreferences'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'

export default function NotificationsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('center')

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-600">Please sign in to access your notifications.</p>
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
          <Bell className="h-8 w-8" />
          <span>Smart Notifications</span>
          <Crown className="h-6 w-6 text-yellow-600" />
        </h1>
        <p className="text-lg text-muted-foreground">
          Stay informed with AI-powered insights, reminders, and opportunities
        </p>
      </div>

      {/* Premium Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>AI Opportunities</span>
            </CardTitle>
            <CardDescription>
              Intelligent detection of business improvement opportunities
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <span>Smart Reminders</span>
            </CardTitle>
            <CardDescription>
              Personalized reminders for incomplete implementation steps
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <span>Analytics Tracking</span>
            </CardTitle>
            <CardDescription>
              Track notification effectiveness and engagement
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="center">Notification Center</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="center" className="mt-6">
          <NotificationCenter />
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <NotificationPreferencesComponent />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <NotificationAnalytics userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Notification Analytics Component
function NotificationAnalytics({ userId }: { userId: string }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Notification Performance</span>
          </CardTitle>
          <CardDescription>
            Track how effective your notifications are at driving action
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">24</div>
              <div className="text-sm text-gray-600">Total Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">96%</div>
              <div className="text-sm text-gray-600">Delivery Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">72%</div>
              <div className="text-sm text-gray-600">Open Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">34%</div>
              <div className="text-sm text-gray-600">Action Rate</div>
            </div>
          </div>

          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              Your notification engagement is <strong>above average</strong>! 
              The AI-powered opportunity detection is showing great results.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Notification Types</CardTitle>
            <CardDescription>Most engaging notification categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">AI Opportunities</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '85%'}}></div>
                  </div>
                  <span className="text-sm font-medium">85%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Milestones</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{width: '72%'}}></div>
                  </div>
                  <span className="text-sm font-medium">72%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Reminders</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-600 h-2 rounded-full" style={{width: '58%'}}></div>
                  </div>
                  <span className="text-sm font-medium">58%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Notification activity over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Sep 9</span>
                <span>3 sent, 2 opened, 1 action</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Sep 8</span>
                <span>2 sent, 2 opened, 0 actions</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Sep 7</span>
                <span>4 sent, 3 opened, 2 actions</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Sep 6</span>
                <span>1 sent, 1 opened, 1 action</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Feedback</CardTitle>
          <CardDescription>Help us improve by rating notification relevance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Rate your recent notifications to help AI improve opportunity detection
            </p>
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  variant="outline"
                  size="sm"
                  className="w-12 h-12 rounded-full"
                >
                  {rating}
                </Button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              1 = Not relevant, 5 = Very relevant
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}