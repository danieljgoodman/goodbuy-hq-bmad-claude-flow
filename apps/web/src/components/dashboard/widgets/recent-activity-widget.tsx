'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  BarChart3, 
  FileText, 
  Settings, 
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  ExternalLink
} from 'lucide-react'
import { DashboardWidget } from '@/contexts/dashboard-customization-context'

interface ActivityItem {
  id: string
  type: 'evaluation' | 'account' | 'improvement' | 'system'
  title: string
  description?: string
  timestamp: string
  href?: string
  status?: 'completed' | 'in_progress' | 'pending' | 'failed'
  metadata?: {
    amount?: number
    score?: number
    duration?: string
  }
}

// Sample data - in real app this would come from API
const sampleActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'evaluation',
    title: 'Business Evaluation Completed',
    description: 'Tech Solutions Ltd valuation finished',
    timestamp: '2024-01-15T10:30:00Z',
    href: '/evaluations/123',
    status: 'completed',
    metadata: {
      amount: 1250000,
      score: 84
    }
  },
  {
    id: '2',
    type: 'improvement',
    title: 'Improvement Goal Updated',
    description: 'Updated cash flow optimization target',
    timestamp: '2024-01-14T16:45:00Z',
    href: '/improvements/cash-flow',
    status: 'in_progress'
  },
  {
    id: '3',
    type: 'account',
    title: 'Profile Information Updated',
    description: 'Business details and contact info',
    timestamp: '2024-01-14T09:15:00Z',
    href: '/account/profile',
    status: 'completed'
  },
  {
    id: '4',
    type: 'evaluation',
    title: 'New Evaluation Started',
    description: 'Q1 2024 business valuation in progress',
    timestamp: '2024-01-13T14:20:00Z',
    href: '/evaluations/124',
    status: 'in_progress',
    metadata: {
      duration: '15 minutes remaining'
    }
  },
  {
    id: '5',
    type: 'system',
    title: 'Premium Features Activated',
    description: 'Implementation guides now available',
    timestamp: '2024-01-12T11:00:00Z',
    href: '/improvements/guides',
    status: 'completed'
  },
  {
    id: '6',
    type: 'improvement',
    title: 'Progress Milestone Reached',
    description: 'Marketing efficiency improved by 25%',
    timestamp: '2024-01-11T13:30:00Z',
    href: '/improvements/marketing',
    status: 'completed',
    metadata: {
      score: 25
    }
  }
]

interface RecentActivityWidgetProps {
  widget: DashboardWidget
}

export default function RecentActivityWidget({ widget }: RecentActivityWidgetProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const fetchActivities = async () => {
      setLoading(true)
      // In real app: const data = await fetchRecentActivity(widget.config)
      setTimeout(() => {
        setActivities(sampleActivities)
        setLoading(false)
      }, 800)
    }

    fetchActivities()
  }, [widget.config])

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-8 h-8 bg-muted rounded-lg animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-6">
        <Clock className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
        <h4 className="font-medium mb-2">No Recent Activity</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Your activity will appear here as you use the platform.
        </p>
        <Button asChild size="sm">
          <Link href="/evaluations/new" className="gap-2">
            <Plus className="w-4 h-4" />
            Get Started
          </Link>
        </Button>
      </div>
    )
  }

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'evaluation':
        return BarChart3
      case 'improvement':
        return CheckCircle
      case 'account':
        return User
      case 'system':
        return Settings
      default:
        return FileText
    }
  }

  const getStatusColor = (status?: ActivityItem['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600'
      case 'in_progress':
        return 'text-blue-600'
      case 'pending':
        return 'text-yellow-600'
      case 'failed':
        return 'text-red-600'
      default:
        return 'text-muted-foreground'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return `${diffInMinutes}m ago`
    }
    if (diffInHours < 24) {
      return `${diffInHours}h ago`
    }
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    }
    return `$${amount.toLocaleString()}`
  }

  const isSmall = widget.size === 'small'
  const isLarge = widget.size === 'large'
  const maxItems = isSmall ? 3 : isLarge ? 6 : 4

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Recent Activity</h4>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/activity" className="gap-1 text-xs">
            View All
            <ExternalLink className="w-3 h-3" />
          </Link>
        </Button>
      </div>

      <ScrollArea className={isLarge ? 'h-[300px]' : 'h-[200px]'}>
        <div className="space-y-3">
          {activities.slice(0, maxItems).map((activity) => {
            const IconComponent = getActivityIcon(activity.type)
            
            const activityContent = (
              <div className="flex items-start gap-3 group cursor-pointer">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  activity.status === 'completed' ? 'bg-green-100 text-green-600' :
                  activity.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                  activity.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                  activity.status === 'failed' ? 'bg-red-100 text-red-600' :
                  'bg-muted text-muted-foreground'
                }`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                        {activity.title}
                      </p>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground flex-shrink-0">
                      {formatTimeAgo(activity.timestamp)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      {activity.status && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusColor(activity.status)}`}
                        >
                          {activity.status.replace('_', ' ')}
                        </Badge>
                      )}
                      
                      {activity.metadata?.amount && (
                        <span className="text-xs font-medium text-green-600">
                          {formatCurrency(activity.metadata.amount)}
                        </span>
                      )}
                      
                      {activity.metadata?.score && (
                        <span className="text-xs font-medium">
                          Score: {activity.metadata.score}
                        </span>
                      )}
                      
                      {activity.metadata?.duration && (
                        <span className="text-xs text-muted-foreground">
                          {activity.metadata.duration}
                        </span>
                      )}
                    </div>
                    
                    {activity.href && (
                      <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>
              </div>
            )

            return activity.href ? (
              <Link key={activity.id} href={activity.href}>
                {activityContent}
              </Link>
            ) : (
              <div key={activity.id}>
                {activityContent}
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Quick Action */}
      <div className="pt-2 border-t">
        <Button variant="outline" size="sm" className="w-full gap-2">
          <Plus className="w-3 h-3" />
          {isSmall ? 'New' : 'New Activity'}
        </Button>
      </div>
    </div>
  )
}