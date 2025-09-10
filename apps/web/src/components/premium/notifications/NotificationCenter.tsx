'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  Users, 
  FileText,
  Settings,
  MoreHorizontal,
  RefreshCw,
  MarkAsRead,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import { InAppNotification } from '@/lib/services/NotificationService'
import { useAuth } from '@/lib/hooks/useAuth'

interface NotificationCenterProps {
  isOpen?: boolean
  onClose?: () => void
}

export function NotificationCenter({ isOpen = true, onClose }: NotificationCenterProps) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<InAppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState<'all' | 'unread' | 'opportunities' | 'reminders'>('all')

  useEffect(() => {
    if (user?.id) {
      loadNotifications()
    }
  }, [user?.id, filter])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/notifications/in-app?${new URLSearchParams({
        unreadOnly: filter === 'unread' ? 'true' : 'false',
        type: filter === 'opportunities' ? 'opportunity' : filter === 'reminders' ? 'reminder' : ''
      })}`)

      const data = await response.json()
      
      if (response.ok) {
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notificationIds.includes(notif.id) 
              ? { ...notif, isRead: true, readAt: new Date() }
              : notif
          )
        )
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length))
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id)
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'reminder': return <Clock className="h-4 w-4 text-orange-600" />
      case 'milestone': return <Users className="h-4 w-4 text-purple-600" />
      case 'report': return <FileText className="h-4 w-4 text-blue-600" />
      case 'system': return <Settings className="h-4 w-4 text-gray-600" />
      default: return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (!isOpen) return null

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notification Center</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Stay updated with AI insights, reminders, and opportunities
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadNotifications}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
              >
                <MarkAsRead className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">
                Unread {unreadCount > 0 && <span className="ml-1">({unreadCount})</span>}
              </TabsTrigger>
              <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
              <TabsTrigger value="reminders">Reminders</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-6">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-start space-x-3 p-4 border rounded-lg">
                        <div className="h-4 w-4 bg-gray-300 rounded"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-300 rounded w-full"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No notifications
                  </h3>
                  <p className="text-gray-600">
                    {filter === 'unread' 
                      ? "You're all caught up! No unread notifications."
                      : "You'll see your notifications here when they arrive."
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start space-x-3 p-4 border rounded-lg transition-colors ${
                        !notification.isRead 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                              <span>{formatTimeAgo(notification.createdAt)}</span>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getPriorityColor(notification.priority)}`}
                              >
                                {notification.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {notification.type.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          
                          {!notification.isRead && (
                            <div className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                          )}
                        </div>

                        {notification.actionUrl && (
                          <div className="mt-3 flex items-center space-x-2">
                            <Link href={notification.actionUrl}>
                              <Button 
                                size="sm" 
                                onClick={() => markAsRead([notification.id])}
                              >
                                {notification.actionLabel || 'View Details'}
                              </Button>
                            </Link>
                            
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead([notification.id])}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Mark read
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default NotificationCenter