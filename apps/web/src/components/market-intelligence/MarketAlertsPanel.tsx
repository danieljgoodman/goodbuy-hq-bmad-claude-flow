'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MarketAlert } from '@/types'
import { Bell, AlertTriangle, TrendingUp, Users, Target, X } from 'lucide-react'

interface MarketAlertsPanelProps {
  userId: string
  industry: string
  sector: string
}

export function MarketAlertsPanel({ userId, industry, sector }: MarketAlertsPanelProps) {
  const [alerts, setAlerts] = useState<MarketAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlerts()
  }, [userId, industry, sector])

  const loadAlerts = async () => {
    setLoading(true)
    try {
      // Mock data for now - would fetch from API
      const mockAlerts: MarketAlert[] = [
        {
          id: '1',
          userId,
          title: 'Competitor Price Change',
          description: 'Major competitor reduced pricing by 15% in your market segment',
          severity: 'high',
          category: 'competitive',
          triggerData: { priceChange: -15, competitor: 'Major Player A' },
          actionable: true,
          dismissed: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        {
          id: '2',
          userId,
          title: 'Market Growth Acceleration',
          description: 'Industry showing 23% growth, above predicted 18%',
          severity: 'medium',
          category: 'trend',
          triggerData: { actualGrowth: 23, predictedGrowth: 18 },
          actionable: true,
          dismissed: false,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
        },
        {
          id: '3',
          userId,
          title: 'New Market Opportunity',
          description: 'Emerging segment showing 45% growth potential',
          severity: 'medium',
          category: 'opportunity',
          triggerData: { segment: 'Digital Services', growth: 45 },
          actionable: true,
          dismissed: false,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
        }
      ]
      
      setAlerts(mockAlerts)
    } catch (error) {
      console.error('Failed to load alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const dismissAlert = async (alertId: string) => {
    try {
      setAlerts(prev => prev.filter(alert => alert.id !== alertId))
      // Would call API to dismiss alert
    } catch (error) {
      console.error('Failed to dismiss alert:', error)
    }
  }

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'competitive': return <Users className="h-4 w-4" />
      case 'trend': return <TrendingUp className="h-4 w-4" />
      case 'opportunity': return <Target className="h-4 w-4" />
      case 'risk': return <AlertTriangle className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            Market Alerts
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {alerts.length} Active
          </Badge>
        </div>
        <p className="text-sm text-gray-600">Real-time market intelligence</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No active alerts</p>
            <p className="text-xs text-gray-500">You'll be notified of important market changes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className={`border rounded-lg p-3 ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(alert.category)}
                    <h5 className="font-medium text-sm">{alert.title}</h5>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className="text-xs capitalize"
                    >
                      {alert.severity}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissAlert(alert.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-xs mb-3 line-clamp-2">
                  {alert.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs opacity-75">
                    {getTimeAgo(alert.createdAt)}
                  </span>
                  {alert.actionable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                    >
                      Act on this
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Alert Preferences */}
        <div className="border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
          >
            Configure Alert Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}