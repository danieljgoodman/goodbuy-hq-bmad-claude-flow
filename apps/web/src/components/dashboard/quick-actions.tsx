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

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefreshData()
    } finally {
      setIsRefreshing(false)
    }
  }

  const primaryActions: QuickAction[] = [
    {
      id: 'new-evaluation',
      title: 'New Evaluation',
      description: 'Start a fresh business evaluation',
      icon: <Plus className="h-4 w-4" />,
      onClick: onNewEvaluation,
      variant: 'default',
      disabled: isLoading,
      shortcut: 'Ctrl+N'
    },
    {
      id: 'refresh-data',
      title: 'Refresh Data',
      description: 'Update all dashboard metrics',
      icon: <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />,
      onClick: handleRefresh,
      variant: 'outline',
      disabled: isLoading || isRefreshing,
      shortcut: 'Ctrl+R'
    }
  ]

  const secondaryActions: QuickAction[] = [
    {
      id: 'update-data',
      title: 'Update Latest',
      description: recentEvaluationId ? 'Edit your most recent evaluation' : 'No recent evaluations',
      icon: <FileEdit className="h-4 w-4" />,
      onClick: onUpdateData,
      variant: 'outline',
      disabled: !recentEvaluationId || isLoading,
      badge: recentEvaluationId ? 'Available' : undefined
    },
    {
      id: 'share-dashboard',
      title: 'Share Dashboard',
      description: 'Generate shareable dashboard link',
      icon: <Share2 className="h-4 w-4" />,
      onClick: onShareDashboard,
      variant: 'outline',
      disabled: isLoading
    },
    {
      id: 'export-data',
      title: 'Export Data',
      description: 'Download reports and analytics',
      icon: <Download className="h-4 w-4" />,
      onClick: onExportData,
      variant: 'outline',
      disabled: isLoading
    }
  ]

  const quickInsights = [
    {
      icon: <TrendingUp className="h-4 w-4 text-green-600" />,
      title: 'Performance Trending Up',
      description: 'Your latest metrics show positive growth',
      action: 'View Details',
      onClick: () => {} // Placeholder
    },
    {
      icon: <BarChart3 className="h-4 w-4 text-blue-600" />,
      title: 'Compare Evaluations',
      description: 'Analyze changes over time',
      action: 'Start Comparison',
      onClick: () => {} // Placeholder
    }
  ]

  return (
    <Card className={`flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Zap className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Dashboard Actions</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {primaryActions.length + secondaryActions.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pb-2 pt-3 flex-1 flex flex-col">
        {/* Primary Actions - Responsive Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {primaryActions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant}
              onClick={action.onClick}
              disabled={action.disabled}
              className="h-10 p-2 justify-start text-xs"
            >
              <div className="flex items-center space-x-2 w-full min-w-0">
                <div className="flex-shrink-0">
                  {action.icon}
                </div>
                <div className="text-left min-w-0 flex-1 truncate">
                  <div className="font-medium truncate">{action.title}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>

        {/* Secondary Actions - Fixed Height */}
        <div className="grid grid-cols-3 gap-1">
          {secondaryActions.slice(0, 3).map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
              className="h-12 px-1 py-2 flex-col text-xs min-w-0 justify-center"
            >
              <div className="flex-shrink-0 mb-1">
                {action.icon}
              </div>
              <span className="text-xs leading-tight text-center whitespace-nowrap overflow-hidden text-ellipsis w-full max-w-[60px]">
                {action.title}
              </span>
            </Button>
          ))}
        </div>

        {/* Quick Stats - Fill remaining space */}
        <div className="pt-3 border-t border-border/50 flex-1 flex flex-col justify-end">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-2 rounded-lg bg-muted/30">
              <div className="text-sm font-semibold text-primary">Last Action</div>
              <div className="text-xs text-muted-foreground mt-1">
                {recentEvaluationId ? 'Evaluation Updated' : 'No Recent Activity'}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-muted/30">
              <div className="text-sm font-semibold text-primary">Next Step</div>
              <div className="text-xs text-muted-foreground mt-1">
                {recentEvaluationId ? 'Review Results' : 'Start First Evaluation'}
              </div>
            </div>
          </div>
          
          {/* Tips Section */}
          <div className="mt-3 p-2 rounded-lg bg-blue-50/50 border border-blue-200/50">
            <div className="flex items-start space-x-2">
              <div className="w-1 h-1 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
              <div>
                <div className="text-xs font-medium text-blue-900">Pro Tip</div>
                <div className="text-xs text-blue-700 leading-relaxed">
                  {recentEvaluationId 
                    ? "Export your data regularly to track progress over time"
                    : "Start with a basic evaluation to establish your business baseline"
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}