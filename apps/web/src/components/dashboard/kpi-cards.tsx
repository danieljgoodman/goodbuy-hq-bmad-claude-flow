'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  TrendingUp,
  ArrowUp,
  Heart,
  DollarSign,
  TrendingUpIcon,
  Shield,
  Info
} from 'lucide-react'
import type { DashboardMetrics } from '@/types/dashboard'

interface KPICardsProps {
  metrics: DashboardMetrics | null
  isLoading?: boolean
}

// Star rating component for Risk Level card
const StarRating = ({ filled, total }: { filled: number, total: number }) => {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: total }).map((_, index) => (
        <svg
          key={index}
          className={`w-3 h-3 ${index < filled ? 'text-warning fill-current' : 'text-muted-foreground/30'}`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// Generate real KPI cards from metrics data
const generateRealKPICards = (metrics: DashboardMetrics) => {
  // Format business valuation
  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`
    } else {
      return `$${value.toLocaleString()}`
    }
  }

  // Calculate trend indicators
  const healthTrend = metrics.healthScore >= 80 ? '+Good' :
                     metrics.healthScore >= 60 ? 'Fair' : 'Needs Work'

  const healthTrendColor = metrics.healthScore >= 80 ? 'text-success' :
                          metrics.healthScore >= 60 ? 'text-warning' : 'text-error'

  const valuationTrend = metrics.growthRate > 0 ? `+${metrics.growthRate}%` :
                        metrics.growthRate === 0 ? 'Stable' : `${metrics.growthRate}%`

  const valuationTrendColor = metrics.growthRate > 0 ? 'text-success' :
                             metrics.growthRate === 0 ? 'text-muted-foreground' : 'text-error'

  const growthStatus = metrics.growthRate > 10 ? 'Strong Growth' :
                      metrics.growthRate > 0 ? 'Growing' :
                      metrics.growthRate === 0 ? 'Stable' : 'Declining'

  // Risk level calculations
  const riskDisplay = metrics.riskLevel.charAt(0).toUpperCase() + metrics.riskLevel.slice(1)
  const riskStars = metrics.riskLevel === 'low' ? 4 :
                   metrics.riskLevel === 'medium' ? 2 : 1

  return [
    {
      id: 'health-score',
      title: 'Health Score',
      icon: Heart,
      iconColor: 'text-success',
      value: metrics.healthScore.toString(),
      suffix: '/100',
      valueColor: 'text-foreground',
      trend: healthTrend,
      trendColor: healthTrendColor,
      hasTooltip: true
    },
    {
      id: 'business-value',
      title: 'Business Value',
      icon: DollarSign,
      iconColor: 'text-primary',
      value: formatValue(metrics.businessValuation),
      suffix: '',
      valueColor: 'text-foreground',
      trend: valuationTrend,
      trendColor: valuationTrendColor,
      hasTooltip: false
    },
    {
      id: 'growth-rate',
      title: 'Growth Rate',
      icon: TrendingUpIcon,
      iconColor: 'text-info',
      value: metrics.growthRate > 0 ? `+${metrics.growthRate}%` : `${metrics.growthRate}%`,
      suffix: '30d',
      valueColor: 'text-foreground',
      trend: growthStatus,
      trendColor: metrics.growthRate > 0 ? 'text-success' : 'text-muted-foreground',
      hasTooltip: false
    },
    {
      id: 'risk-level',
      title: 'Risk Level',
      icon: Shield,
      iconColor: 'text-warning',
      value: riskDisplay,
      suffix: '',
      valueColor: 'text-foreground',
      trend: `${riskDisplay} Risk`,
      trendColor: 'text-warning',
      hasStars: true,
      starRating: { filled: riskStars, total: 5 },
      hasTooltip: false
    }
  ]
}

export default function KPICards({ metrics, isLoading = false }: KPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-9 w-9 bg-muted rounded-lg"></div>
                <div className="h-4 w-24 bg-muted rounded"></div>
              </div>
              <div className="h-10 w-32 bg-muted rounded mb-3"></div>
              <div className="h-5 w-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!metrics) {
    return null
  }

  const kpiCards = generateRealKPICards(metrics)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {kpiCards.map((card) => {
        const IconComponent = card.icon

        return (
          <Card
            key={card.id}
            className="group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-border"
          >
            <CardContent className="p-6">
              {/* Header with icon and title */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${card.iconColor} bg-current/10 group-hover:bg-current/15 transition-colors`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    {card.title}
                  </span>
                  {card.hasTooltip && (
                    <Info className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Main value */}
              <div className="mb-3">
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold ${card.valueColor} tracking-tight`}>
                    {card.value}
                  </span>
                  {card.suffix && (
                    <span className="text-base text-muted-foreground font-medium">
                      {card.suffix}
                    </span>
                  )}
                </div>
              </div>

              {/* Trend or status */}
              <div className="flex items-center gap-2">
                {(card.id === 'health-score' || card.id === 'business-value') && (
                  <div className="flex items-center gap-1.5">
                    <ArrowUp className="h-4 w-4 text-success" />
                    <span className={`text-sm font-semibold ${card.trendColor}`}>
                      {card.trend}
                    </span>
                  </div>
                )}

                {card.id === 'growth-rate' && (
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-info" />
                    <span className={`text-sm font-semibold ${card.trendColor}`}>
                      {card.trend}
                    </span>
                  </div>
                )}

                {card.id === 'risk-level' && (
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${card.trendColor}`}>
                      {card.trend}
                    </span>
                    {card.hasStars && card.starRating && (
                      <StarRating
                        filled={card.starRating.filled}
                        total={card.starRating.total}
                      />
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
