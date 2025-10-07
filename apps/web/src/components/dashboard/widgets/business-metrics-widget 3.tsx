'use client'

import { DashboardWidget } from '@/contexts/dashboard-customization-context'

interface BusinessMetricsWidgetProps {
  widget: DashboardWidget
}

export default function BusinessMetricsWidget({ widget }: BusinessMetricsWidgetProps) {
  return (
    <div className="text-center py-8">
      <p className="text-sm text-muted-foreground">Business Metrics Widget</p>
      <p className="text-xs text-muted-foreground mt-2">Coming soon...</p>
    </div>
  )
}