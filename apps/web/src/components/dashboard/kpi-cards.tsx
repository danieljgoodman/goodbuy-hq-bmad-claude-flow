'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
          className={`w-3 h-3 ${index < filled ? 'text-chart-1 fill-current' : 'text-muted'}`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// Generate the 4 exact KPI cards from mockup
const generateMockupKPICards = (metrics: DashboardMetrics) => {
  return [
    {
      id: 'health-score',
      title: 'Health Score',
      icon: Heart,
      iconColor: 'text-primary',
      value: '82',
      suffix: '/100',
      valueColor: 'text-primary',
      trend: '+5.2%',
      trendColor: 'text-chart-1',
      hasTooltip: true
    },
    {
      id: 'business-value',
      title: 'Business Value',
      icon: DollarSign,
      iconColor: 'text-muted-foreground',
      value: '$2.9M',
      suffix: '',
      valueColor: 'text-foreground',
      trend: '+18.3%',
      trendColor: 'text-chart-1',
      hasTooltip: false
    },
    {
      id: 'growth-rate',
      title: 'Growth Rate',
      icon: TrendingUpIcon,
      iconColor: 'text-muted-foreground',
      value: '+15.3%',
      suffix: '30d',
      valueColor: 'text-primary',
      trend: 'Strong Growth',
      trendColor: 'text-muted-foreground',
      hasTooltip: false
    },
    {
      id: 'risk-level',
      title: 'Risk Level',
      icon: Shield,
      iconColor: 'text-muted-foreground',
      value: 'Low',
      suffix: '',
      valueColor: 'text-primary',
      trend: 'Minimal Risk',
      trendColor: 'text-muted-foreground',
      hasStars: true,
      starRating: { filled: 4, total: 5 },
      hasTooltip: false
    }
  ]
}

export default function KPICards({ metrics, isLoading = false }: KPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted rounded"></div>
              <div className="h-5 w-5 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 bg-muted rounded mb-2"></div>
              <div className="h-4 w-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!metrics) {
    return null
  }

  const kpiCards = generateMockupKPICards(metrics)

  return (
    <div className="grid grid-cols-2 gap-4 lg:gap-6">
      {kpiCards.map((card) => {
        const IconComponent = card.icon
        
        return (
          <Card key={card.id} className="bg-card border border-border shadow-sm rounded-lg hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              {/* Header with icon and title */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <IconComponent className={`h-5 w-5 ${card.iconColor}`} />
                  <span className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </span>
                  {card.hasTooltip && (
                    <Info className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Main value */}
              <div className="mb-3">
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-bold ${card.valueColor}`}>
                    {card.value}
                  </span>
                  {card.suffix && (
                    <span className="text-sm text-muted-foreground">
                      {card.suffix}
                    </span>
                  )}
                </div>
              </div>

              {/* Trend or status */}
              <div className="flex items-center justify-between">
                {card.id === 'health-score' && (
                  <div className="flex items-center gap-1">
                    <ArrowUp className="h-3 w-3 text-chart-1" />
                    <span className={`text-sm font-medium ${card.trendColor}`}>
                      {card.trend}
                    </span>
                  </div>
                )}

                {card.id === 'business-value' && (
                  <div className="flex items-center gap-1">
                    <ArrowUp className="h-3 w-3 text-chart-1" />
                    <span className={`text-sm font-medium ${card.trendColor}`}>
                      {card.trend}
                    </span>
                  </div>
                )}

                {card.id === 'growth-rate' && (
                  <div className="flex flex-col">
                    <span className={`text-xs ${card.trendColor}`}>
                      {card.trend}
                    </span>
                  </div>
                )}

                {card.id === 'risk-level' && (
                  <div className="flex flex-col items-start gap-1">
                    <span className={`text-xs ${card.trendColor}`}>
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