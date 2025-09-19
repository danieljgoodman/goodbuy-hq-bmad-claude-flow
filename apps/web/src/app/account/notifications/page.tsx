'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Bell, Mail, MessageSquare, TrendingUp, AlertCircle, CheckCircle, Clock, Trash2 } from 'lucide-react'

export default function NotificationsPage() {
  const [emailNotifications, setEmailNotifications] = useState({
    valuationComplete: true,
    weeklyReports: true,
    marketUpdates: false,
    communityActivity: true,
    systemUpdates: true,
    promotions: false
  })

  const [pushNotifications, setPushNotifications] = useState({
    valuationComplete: true,
    weeklyReports: false,
    marketUpdates: true,
    communityActivity: false,
    systemUpdates: true
  })

  const notifications = [
    {
      id: 1,
      type: 'success',
      icon: CheckCircle,
      title: 'Valuation Complete',
      message: 'Your business valuation report for &quot;ABC Manufacturing&quot; is ready for review.',
      time: '2 hours ago',
      read: false
    },
    {
      id: 2,
      type: 'info',
      icon: TrendingUp,
      title: 'Market Intelligence Update',
      message: 'New industry trends available for the manufacturing sector.',
      time: '1 day ago',
      read: true
    },
    {
      id: 3,
      type: 'warning',
      icon: AlertCircle,
      title: 'Document Upload Required',
      message: 'Please upload your Q3 financial statements to continue your evaluation.',
      time: '2 days ago',
      read: false
    },
    {
      id: 4,
      type: 'info',
      icon: MessageSquare,
      title: 'Community Response',
      message: 'Sarah M. replied to your question in the Community Forum.',
      time: '3 days ago',
      read: true
    }
  ]

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Notification Settings</h1>
        <p className="text-muted-foreground">
          Manage how you receive notifications and updates from GoodBuy HQ
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Settings */}
        <div className="md:col-span-2 space-y-6">
          {/* Email Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Choose which email notifications you&apos;d like to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-valuation">Valuation Complete</Label>
                  <p className="text-sm text-muted-foreground">When your business valuation is ready</p>
                </div>
                <Switch
                  id="email-valuation"
                  checked={emailNotifications.valuationComplete}
                  onCheckedChange={(checked) => 
                    setEmailNotifications({...emailNotifications, valuationComplete: checked})
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-reports">Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">Summary of your business metrics</p>
                </div>
                <Switch
                  id="email-reports"
                  checked={emailNotifications.weeklyReports}
                  onCheckedChange={(checked) => 
                    setEmailNotifications({...emailNotifications, weeklyReports: checked})
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-market">Market Intelligence Updates</Label>
                  <p className="text-sm text-muted-foreground">Industry trends and insights</p>
                  <Badge variant="secondary" className="mt-1 text-xs">PRO</Badge>
                </div>
                <Switch
                  id="email-market"
                  checked={emailNotifications.marketUpdates}
                  onCheckedChange={(checked) => 
                    setEmailNotifications({...emailNotifications, marketUpdates: checked})
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-community">Community Activity</Label>
                  <p className="text-sm text-muted-foreground">Replies and mentions in forums</p>
                </div>
                <Switch
                  id="email-community"
                  checked={emailNotifications.communityActivity}
                  onCheckedChange={(checked) => 
                    setEmailNotifications({...emailNotifications, communityActivity: checked})
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-system">System Updates</Label>
                  <p className="text-sm text-muted-foreground">Important system notifications</p>
                </div>
                <Switch
                  id="email-system"
                  checked={emailNotifications.systemUpdates}
                  onCheckedChange={(checked) => 
                    setEmailNotifications({...emailNotifications, systemUpdates: checked})
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-promotions">Promotions & Tips</Label>
                  <p className="text-sm text-muted-foreground">Special offers and helpful tips</p>
                </div>
                <Switch
                  id="email-promotions"
                  checked={emailNotifications.promotions}
                  onCheckedChange={(checked) => 
                    setEmailNotifications({...emailNotifications, promotions: checked})
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Push Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Push Notifications
              </CardTitle>
              <CardDescription>
                Real-time notifications in your browser and mobile app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-valuation">Valuation Complete</Label>
                  <p className="text-sm text-muted-foreground">Instant notification when ready</p>
                </div>
                <Switch
                  id="push-valuation"
                  checked={pushNotifications.valuationComplete}
                  onCheckedChange={(checked) => 
                    setPushNotifications({...pushNotifications, valuationComplete: checked})
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-market">Market Alerts</Label>
                  <p className="text-sm text-muted-foreground">Important market changes</p>
                  <Badge variant="secondary" className="mt-1 text-xs">PRO</Badge>
                </div>
                <Switch
                  id="push-market"
                  checked={pushNotifications.marketUpdates}
                  onCheckedChange={(checked) => 
                    setPushNotifications({...pushNotifications, marketUpdates: checked})
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-system">Critical System Updates</Label>
                  <p className="text-sm text-muted-foreground">Urgent system notifications</p>
                </div>
                <Switch
                  id="push-system"
                  checked={pushNotifications.systemUpdates}
                  onCheckedChange={(checked) => 
                    setPushNotifications({...pushNotifications, systemUpdates: checked})
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button>Save Preferences</Button>
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Notifications
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifications.map((notification) => {
                const IconComponent = notification.icon
                return (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${
                      !notification.read ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <IconComponent
                        className={`h-4 w-4 mt-1 ${
                          notification.type === 'success'
                            ? 'text-green-600'
                            : notification.type === 'warning'
                            ? 'text-amber-600'
                            : 'text-primary'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {notification.time}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              <div className="text-center pt-4">
                <Button variant="ghost" size="sm">
                  View All Notifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}