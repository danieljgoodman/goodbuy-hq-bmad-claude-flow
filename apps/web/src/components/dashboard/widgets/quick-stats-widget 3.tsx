'use client'

import { DashboardWidget } from '@/contexts/dashboard-customization-context'

interface QuickStatsWidgetProps {
  widget: DashboardWidget
}

export default function QuickStatsWidget({ widget }: QuickStatsWidgetProps) {
  return (
    <div className="text-center py-8">
      <p className="text-sm text-muted-foreground">Quick Stats Widget</p>
      <p className="text-xs text-muted-foreground mt-2">Coming soon...</p>
    </div>
  )
}