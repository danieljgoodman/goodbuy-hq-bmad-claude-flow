'use client'

import { DashboardWidget } from '@/contexts/dashboard-customization-context'

interface ProgressIndicatorsWidgetProps {
  widget: DashboardWidget
}

export default function ProgressIndicatorsWidget({ widget }: ProgressIndicatorsWidgetProps) {
  return (
    <div className="text-center py-8">
      <p className="text-sm text-muted-foreground">Progress Indicators Widget</p>
      <p className="text-xs text-muted-foreground mt-2">Coming soon...</p>
    </div>
  )
}