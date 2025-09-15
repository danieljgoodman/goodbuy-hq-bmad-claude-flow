'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Plus, 
  GripVertical,
  Eye,
  EyeOff,
  X,
  ChevronDown
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDashboardCustomization, DashboardWidget, WidgetType } from '@/contexts/dashboard-customization-context'
import { useAuthStore } from '@/stores/auth-store'

// Widget Components
import EvaluationSummaryWidget from './widgets/evaluation-summary-widget'
import RecentActivityWidget from './widgets/recent-activity-widget'
import BusinessMetricsWidget from './widgets/business-metrics-widget'
import ImprovementTrackingWidget from './widgets/improvement-tracking-widget'
import ProgressIndicatorsWidget from './widgets/progress-indicators-widget'
import QuickStatsWidget from './widgets/quick-stats-widget'
import NotificationCenterWidget from './widgets/notification-center-widget'
import NextActionsWidget from './widgets/next-actions-widget'

const widgetComponents = {
  evaluation_summary: EvaluationSummaryWidget,
  recent_activity: RecentActivityWidget,
  business_metrics: BusinessMetricsWidget,
  improvement_tracking: ImprovementTrackingWidget,
  progress_indicators: ProgressIndicatorsWidget,
  quick_stats: QuickStatsWidget,
  notification_center: NotificationCenterWidget,
  next_actions: NextActionsWidget,
}

const availableWidgets = [
  { type: 'evaluation_summary' as WidgetType, title: 'Business Valuations', description: 'Overview of evaluation history' },
  { type: 'recent_activity' as WidgetType, title: 'Recent Activity', description: 'Timeline of platform activities' },
  { type: 'business_metrics' as WidgetType, title: 'Business Metrics', description: 'Key performance indicators' },
  { type: 'improvement_tracking' as WidgetType, title: 'Improvement Progress', description: 'Track improvement goals', premium: true },
  { type: 'progress_indicators' as WidgetType, title: 'Progress Indicators', description: 'Business growth tracking' },
  { type: 'quick_stats' as WidgetType, title: 'Quick Stats', description: 'Essential business numbers' },
  { type: 'notification_center' as WidgetType, title: 'Notifications', description: 'Important updates and alerts' },
  { type: 'next_actions' as WidgetType, title: 'Recommended Actions', description: 'Personalized next steps' },
]

interface DragDropGridProps {
  widgets: DashboardWidget[]
  isCustomizing: boolean
  onWidgetUpdate: (widgetId: string, updates: Partial<DashboardWidget>) => void
  onWidgetRemove: (widgetId: string) => void
}

function DragDropGrid({ widgets, isCustomizing, onWidgetUpdate, onWidgetRemove }: DragDropGridProps) {
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)

  const handleDragStart = (widgetId: string) => {
    if (isCustomizing) {
      setDraggedWidget(widgetId)
    }
  }

  const handleDragEnd = () => {
    setDraggedWidget(null)
  }

  const getGridColSpan = (size: string) => {
    switch (size) {
      case 'small': return 'col-span-1'
      case 'large': return 'col-span-2'
      default: return 'col-span-1'
    }
  }

  const getGridRowSpan = (size: string) => {
    switch (size) {
      case 'small': return 'row-span-1'
      case 'large': return 'row-span-2'
      default: return 'row-span-1'
    }
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr ${isCustomizing ? 'min-h-[200px]' : ''}`}>
      {widgets.filter(w => w.isVisible).map((widget) => {
        const WidgetComponent = widgetComponents[widget.type]
        
        return (
          <div
            key={widget.id}
            className={`relative ${getGridColSpan(widget.size)} ${getGridRowSpan(widget.size)} ${
              draggedWidget === widget.id ? 'opacity-50' : ''
            }`}
            draggable={isCustomizing}
            onDragStart={() => handleDragStart(widget.id)}
            onDragEnd={handleDragEnd}
          >
            <Card className={`h-full ${isCustomizing ? 'ring-2 ring-primary/20' : ''}`}>
              {isCustomizing && (
                <div className="absolute -top-2 -right-2 z-10 flex gap-1">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-6 w-6 p-0"
                    onClick={() => onWidgetRemove(widget.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
              
              {isCustomizing && (
                <div className="absolute top-2 right-2 cursor-move">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                </div>
              )}

              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  {widget.title}
                  {isCustomizing && (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => onWidgetUpdate(widget.id, {
                          size: widget.size === 'small' ? 'medium' : widget.size === 'medium' ? 'large' : 'small'
                        })}
                      >
                        <Badge variant="outline" className="text-xs">
                          {widget.size}
                        </Badge>
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-0">
                {WidgetComponent ? (
                  <WidgetComponent widget={widget} />
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <p className="text-sm">Widget type "{widget.type}" not found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )
}

export default function CustomizableDashboard() {
  const { user } = useAuthStore()
  const {
    layout,
    isCustomizing,
    setIsCustomizing,
    updateWidgetPosition,
    updateWidgetSize,
    toggleWidgetVisibility,
    addWidget,
    removeWidget,
    resetToDefault,
    saveLayout,
    loadPreset
  } = useDashboardCustomization()

  const [showPresets, setShowPresets] = useState(false)

  const handleStartCustomizing = () => {
    setIsCustomizing(true)
  }

  const handleSaveCustomizations = async () => {
    await saveLayout()
    setIsCustomizing(false)
  }

  const handleCancelCustomizations = () => {
    // In a real app, this would revert unsaved changes
    setIsCustomizing(false)
  }

  const handleWidgetUpdate = (widgetId: string, updates: Partial<DashboardWidget>) => {
    if (updates.size) {
      updateWidgetSize(widgetId, updates.size)
    }
    if (updates.position) {
      updateWidgetPosition(widgetId, updates.position)
    }
  }

  const handleAddWidget = (widgetType: WidgetType) => {
    addWidget(widgetType)
  }

  const isPremium = user?.tier !== 'FREE'

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {isCustomizing ? 'Customize your dashboard layout' : 'Welcome back! Here\'s your business overview.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isCustomizing ? (
            <Button onClick={handleStartCustomizing} variant="outline" className="gap-2">
              <Settings className="w-4 h-4" />
              Customize
            </Button>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Widget
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Available Widgets</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableWidgets.map((widget) => (
                    <DropdownMenuItem
                      key={widget.type}
                      onClick={() => handleAddWidget(widget.type)}
                      disabled={widget.premium && !isPremium}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{widget.title}</span>
                          {widget.premium && (
                            <Badge variant="outline" className="text-xs">Premium</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{widget.description}</p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Presets</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => loadPreset('new-user')}>
                    New User Layout
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => loadPreset('power-user')}>
                    Power User Layout
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={resetToDefault}>
                    Reset to Default
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={handleSaveCustomizations} className="gap-2">
                <Save className="w-4 h-4" />
                Save
              </Button>
              
              <Button onClick={handleCancelCustomizations} variant="outline">
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Customization Controls */}
      {isCustomizing && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Customization Options</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Snap to Grid</span>
                  <Switch checked={layout.preferences.snapToGrid} />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show Borders</span>
                  <Switch checked={layout.preferences.showWidgetBorders} />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Compact Mode</span>
                  <Switch checked={layout.preferences.compactMode} />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Widget Visibility</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {layout.widgets.map((widget) => (
                    <div key={widget.id} className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleWidgetVisibility(widget.id)}
                      >
                        {widget.isVisible ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-muted-foreground" />
                        )}
                      </Button>
                      <span className={`text-xs ${widget.isVisible ? '' : 'text-muted-foreground'}`}>
                        {widget.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Grid */}
      <DragDropGrid
        widgets={layout.widgets}
        isCustomizing={isCustomizing}
        onWidgetUpdate={handleWidgetUpdate}
        onWidgetRemove={removeWidget}
      />

      {/* Empty State */}
      {layout.widgets.filter(w => w.isVisible).length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">No widgets visible</h3>
                <p className="text-sm text-muted-foreground">
                  Add widgets to customize your dashboard experience
                </p>
              </div>
              <Button onClick={handleStartCustomizing} className="gap-2">
                <Settings className="w-4 h-4" />
                Customize Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}