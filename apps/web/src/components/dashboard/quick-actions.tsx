'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Plus, 
  RefreshCw, 
  Share2, 
  FileEdit, 
  BarChart3, 
  Download,
  Zap,
  ArrowRight,
  Clock,
  TrendingUp
} from 'lucide-react'

interface QuickActionsProps {
  onNewEvaluation: () => void
  onRefreshData: () => void
  onShareDashboard: () => void
  onExportData: () => void
  onUpdateData: () => void
  recentEvaluationId?: string
  isLoading?: boolean
  className?: string
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
  variant: 'default' | 'outline' | 'secondary'
  badge?: string
  disabled?: boolean
  shortcut?: string
}

export default function QuickActions({
  onNewEvaluation,
  onRefreshData,
  onShareDashboard,
  onExportData,
  onUpdateData,
  recentEvaluationId,
  isLoading = false,
  className = ""
}: QuickActionsProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Determine if this is empty state (no recent evaluations)
  const isEmptyState = !recentEvaluationId

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefreshData()
    } finally {
      setIsRefreshing(false)
    }
  }

  // Show simplified version when we have data
  if (!isEmptyState) {
    const dataActions: QuickAction[] = [
      {
        id: 'new-evaluation',
        title: 'New Evaluation',
        description: 'Start a fresh business evaluation',
        icon: <Plus className="h-4 w-4" />,
        onClick: onNewEvaluation,
        variant: 'default',
        disabled: isLoading
      },
      {
        id: 'refresh-data',
        title: 'Refresh',
        description: 'Update dashboard data',
        icon: <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />,
        onClick: handleRefresh,
        variant: 'outline',
        disabled: isLoading || isRefreshing
      }
    ]

    const utilityActions = [
      { icon: <FileEdit className="h-4 w-4" />, title: 'Edit Latest', onClick: onUpdateData, disabled: isLoading },
      { icon: <Share2 className="h-4 w-4" />, title: 'Share', onClick: onShareDashboard, disabled: isLoading },
      { icon: <Download className="h-4 w-4" />, title: 'Export', onClick: onExportData, disabled: isLoading }
    ]

    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dataActions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant}
                onClick={action.onClick}
                disabled={action.disabled}
                className="justify-start"
              >
                {action.icon}
                <span className="ml-2">{action.title}</span>
              </Button>
            ))}
          </div>

          {/* Utility Actions */}
          <div className="grid grid-cols-3 gap-2">
            {utilityActions.map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
                className="flex-col h-16 text-xs"
              >
                {action.icon}
                <span className="mt-1">{action.title}</span>
              </Button>
            ))}
          </div>

          {/* Status */}
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-sm font-medium text-primary">Dashboard Active</div>
            <div className="text-xs text-muted-foreground">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // This should not render in empty state as it's handled by WelcomeEmptyState
  return null
}