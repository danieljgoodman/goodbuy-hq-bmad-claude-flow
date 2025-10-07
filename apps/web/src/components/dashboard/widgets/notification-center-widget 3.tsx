'use client'

import { DashboardWidget } from '@/contexts/dashboard-customization-context'

interface NotificationCenterWidgetProps {
  widget: DashboardWidget
}

export default function NotificationCenterWidget({ widget }: NotificationCenterWidgetProps) {
  return (
    <div className="text-center py-8">
      <p className="text-sm text-muted-foreground">Notification Center Widget</p>
      <p className="text-xs text-muted-foreground mt-2">Coming soon...</p>
    </div>
  )
}