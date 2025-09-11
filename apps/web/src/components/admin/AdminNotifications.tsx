'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  X,
  RefreshCw,
  Settings,
  Users,
  Server,
  DollarSign,
  Shield,
  Clock
} from 'lucide-react'

type NotificationType = 'error' | 'warning' | 'info' | 'success'
type NotificationCategory = 'system' | 'user' | 'security' | 'billing' | 'performance'

interface AdminNotification {
  id: string
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  timestamp: string
  read: boolean
  acknowledged: boolean
  actionRequired: boolean
  metadata?: {
    userId?: string
    errorCode?: string
    affectedUsers?: number
    severity?: 'low' | 'medium' | 'high' | 'critical'
  }
}

const emptyNotifications: AdminNotification[] = []

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>(emptyNotifications)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | NotificationCategory>('all')

  const loadNotifications = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/notifications')
      // const data = await response.json()
      // setNotifications(data.notifications)
      
      const response = await fetch('/api/admin/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      } else {
        console.warn('Notifications API not available, showing empty data')
        setNotifications(emptyNotifications)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    )
  }

  const acknowledge = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, acknowledged: true, read: true } : n
      )
    )
  }

  const dismiss = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'system':
        return <Server className="h-4 w-4" />
      case 'user':
        return <Users className="h-4 w-4" />
      case 'security':
        return <Shield className="h-4 w-4" />
      case 'billing':
        return <DollarSign className="h-4 w-4" />
      case 'performance':
        return <Settings className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'info':
        return 'border-blue-200 bg-blue-50'
    }
  }

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>
      case 'high':
        return <Badge variant="destructive">High</Badge>
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>
      case 'low':
        return <Badge variant="outline">Low</Badge>
      default:
        return null
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    
    if (diffMins < 60) {
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.category === filter)

  const unreadCount = notifications.filter(n => !n.read).length
  const actionRequiredCount = notifications.filter(n => n.actionRequired && !n.acknowledged).length

  useEffect(() => {
    loadNotifications()
    
    // Set up periodic refresh for notifications
    const interval = setInterval(loadNotifications, 30000) // 30 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">Admin Notifications</h2>
            <p className="text-muted-foreground">
              System alerts and platform events
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {actionRequiredCount > 0 && (
            <Badge variant="destructive">
              {actionRequiredCount} action{actionRequiredCount !== 1 ? 's' : ''} required
            </Badge>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadNotifications} 
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-semibold">{notifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Unread</p>
                <p className="font-semibold">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Action Required</p>
                <p className="font-semibold">{actionRequiredCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="font-semibold">
                  {notifications.filter(n => n.metadata?.severity === 'critical').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Acknowledged</p>
                <p className="font-semibold">
                  {notifications.filter(n => n.acknowledged).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="user">User</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Notifications ({filteredNotifications.length})</span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      notifications.forEach(n => {
                        if (!n.read) markAsRead(n.id)
                      })
                    }}
                  >
                    Mark All Read
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {filteredNotifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No notifications in this category
                    </div>
                  ) : (
                    filteredNotifications.map((notification, index) => (
                      <div key={notification.id}>
                        <div
                          className={`p-4 rounded-lg border transition-colors ${
                            notification.read ? 'opacity-70' : ''
                          } ${getTypeColor(notification.type)}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className="flex items-center space-x-1">
                                {getNotificationIcon(notification.type)}
                                {getCategoryIcon(notification.category)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className={`font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                                    {notification.title}
                                  </h4>
                                  {notification.metadata?.severity && getSeverityBadge(notification.metadata.severity)}
                                  {notification.actionRequired && !notification.acknowledged && (
                                    <Badge variant="destructive" className="text-xs">Action Required</Badge>
                                  )}
                                  {notification.acknowledged && (
                                    <Badge variant="outline" className="text-xs">Acknowledged</Badge>
                                  )}
                                </div>
                                
                                <p className="text-sm text-muted-foreground mb-2">
                                  {notification.message}
                                </p>
                                
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  <span>{formatTimestamp(notification.timestamp)}</span>
                                  {notification.metadata?.affectedUsers && (
                                    <span>{notification.metadata.affectedUsers} users affected</span>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {notification.category}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1 ml-2">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  Mark Read
                                </Button>
                              )}
                              
                              {notification.actionRequired && !notification.acknowledged && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => acknowledge(notification.id)}
                                >
                                  Acknowledge
                                </Button>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => dismiss(notification.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {index < filteredNotifications.length - 1 && (
                          <Separator className="my-2" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}