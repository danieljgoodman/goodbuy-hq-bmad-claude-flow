'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, BarChart3, Download } from 'lucide-react'

interface QuickActionsProps {
  onViewAllEvaluations?: () => void
  onViewAnalytics?: () => void
  onExportData?: () => void
  className?: string
}

interface QuickActionItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick?: () => void
  href?: string
}

export default function QuickActions({
  onViewAllEvaluations,
  onViewAnalytics,
  onExportData,
  className = ""
}: QuickActionsProps) {
  
  const quickActionItems: QuickActionItem[] = [
    {
      id: 'view-all-evaluations',
      label: 'View All Evaluations',
      icon: Eye,
      onClick: onViewAllEvaluations
    },
    {
      id: 'view-analytics',
      label: 'View Analytics',
      icon: BarChart3,
      onClick: onViewAnalytics
    },
    {
      id: 'export-data',
      label: 'Export Data',
      icon: Download,
      onClick: onExportData
    }
  ]

  const handleActionClick = (action: QuickActionItem) => {
    if (action.onClick) {
      action.onClick()
    } else if (action.href) {
      window.location.href = action.href
    }
  }

  return (
    <Card className={`border-border bg-card ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {quickActionItems.map((action) => {
          const IconComponent = action.icon
          
          return (
            <Button
              key={action.id}
              variant="outline"
              className="w-full justify-start h-10 bg-secondary/30 hover:bg-secondary/50 border-border transition-colors"
              onClick={() => handleActionClick(action)}
            >
              <IconComponent className="h-4 w-4 mr-3 text-muted-foreground" />
              <span className="font-medium text-foreground">{action.label}</span>
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
}