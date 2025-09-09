'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
// Note: Avatar component removed for build compatibility
import { 
  FileText, 
  Upload, 
  Settings, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react'
import type { ActivityItem } from '@/types/dashboard'

interface ActivityFeedProps {
  activities: ActivityItem[]
  isLoading?: boolean
  onRefresh?: () => void
  maxItems?: number
  showTimestamps?: boolean
  className?: string
}

const getActivityIcon = (type: ActivityItem['type'], status?: ActivityItem['status']) => {
  const iconMap = {
    'evaluation_created': FileText,
    'data_updated': TrendingUp,
    'document_processed': Upload,
    'settings_changed': Settings
  }
  
  const IconComponent = iconMap[type] || FileText
  
  // Consistent icon sizing and styling
  return <IconComponent className="h-4 w-4" />
}

const getActivityColor = (type: ActivityItem['type'], status?: ActivityItem['status']) => {
  if (status === 'error') return 'text-red-600 bg-red-50 border border-red-200'
  if (status === 'warning') return 'text-yellow-600 bg-yellow-50 border border-yellow-200'
  
  const colorMap = {
    'evaluation_created': 'text-blue-600 bg-blue-50 border border-blue-200',
    'data_updated': 'text-green-600 bg-green-50 border border-green-200', 
    'document_processed': 'text-purple-600 bg-purple-50 border border-purple-200',
    'settings_changed': 'text-gray-600 bg-gray-50 border border-gray-200'
  }
  
  return colorMap[type] || 'text-gray-600 bg-gray-50 border border-gray-200'
}

const getStatusIcon = (status?: ActivityItem['status']) => {
  switch (status) {
    case 'success':
      return <CheckCircle className="h-3 w-3 text-green-600" />
    case 'warning':
      return <AlertTriangle className="h-3 w-3 text-yellow-600" />
    case 'error':
      return <AlertTriangle className="h-3 w-3 text-red-600" />
    default:
      return null
  }
}

const formatRelativeTime = (date: Date) => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

const formatDescription = (activity: ActivityItem) => {
  // Extract metadata values for template replacement
  const { metadata, description } = activity
  
  // Simple template replacement
  let formattedDescription = description
  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      formattedDescription = formattedDescription.replace(`{${key}}`, String(value))
    })
  }
  
  return formattedDescription
}

export default function ActivityFeed({
  activities,
  isLoading = false,
  onRefresh,
  maxItems = 10,
  showTimestamps = true,
  className = ""
}: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems)

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Latest updates and changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>
              Latest updates and changes ({activities.length} total)
            </CardDescription>
          </div>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {displayedActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
            <p className="text-sm mt-1">Actions will appear here as you use the platform</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedActivities.map((activity, index) => (
              <div key={activity.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type, activity.status)}`}>
                  {getActivityIcon(activity.type, activity.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground leading-snug">
                        {formatDescription(activity)}
                      </p>
                      
                      {showTimestamps && (
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(activity.timestamp)}
                          </p>
                          {activity.status && getStatusIcon(activity.status)}
                        </div>
                      )}
                      
                      {activity.metadata?.tags && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {activity.metadata.tags.map((tag: string, tagIndex: number) => (
                            <Badge key={tagIndex} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {activity.metadata?.avatar && (
                      <div className="h-6 w-6 ml-2 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground flex-shrink-0">
                        {activity.metadata.initials || 'U'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {activities.length > maxItems && (
              <div className="text-center pt-4 border-t">
                <Button variant="ghost" size="sm">
                  View {activities.length - maxItems} more activities
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}