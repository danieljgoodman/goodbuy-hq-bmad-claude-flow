'use client'

import { DashboardWidget } from '@/contexts/dashboard-customization-context'

interface NextActionsWidgetProps {
  widget: DashboardWidget
}

export default function NextActionsWidget({ widget }: NextActionsWidgetProps) {
  return (
    <div className="text-center py-8">
      <p className="text-sm text-muted-foreground">Next Actions Widget</p>
      <p className="text-xs text-muted-foreground mt-2">Coming soon...</p>
    </div>
  )
}