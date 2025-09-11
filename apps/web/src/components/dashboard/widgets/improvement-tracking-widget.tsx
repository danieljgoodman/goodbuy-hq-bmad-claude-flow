'use client'

import { DashboardWidget } from '@/contexts/dashboard-customization-context'

interface ImprovementTrackingWidgetProps {
  widget: DashboardWidget
}

export default function ImprovementTrackingWidget({ widget }: ImprovementTrackingWidgetProps) {
  return (
    <div className="text-center py-8">
      <p className="text-sm text-muted-foreground">Improvement Tracking Widget</p>
      <p className="text-xs text-muted-foreground mt-2">Premium feature - Coming soon...</p>
    </div>
  )
}