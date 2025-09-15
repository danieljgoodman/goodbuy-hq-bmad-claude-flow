'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, DollarSign, Activity, FileText, Shield, Target, BarChart3 } from 'lucide-react'
import type { KPICard, DashboardMetrics } from '@/types/dashboard'

interface KPICardsProps {
  metrics: DashboardMetrics | null
  isLoading?: boolean
}

const getIcon = (iconName: string) => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    'dollar-sign': DollarSign,
    'activity': Activity,
    'file-text': FileText,
    'shield': Shield,
    'target': Target,
    'bar-chart': BarChart3,
  }
  
  const IconComponent = iconMap[iconName] || Activity
  return <IconComponent className="h-5 w-5" />
}

const getColorClasses = (color: KPICard['color']) => {
  const colorMap = {
    green: {
      icon: 'text-green-600',
      bg: 'bg-green-50',
      change: 'text-green-600'
    },
    blue: {
      icon: 'text-blue-600',
      bg: 'bg-blue-50',
      change: 'text-blue-600'
    },
    purple: {
      icon: 'text-purple-600',
      bg: 'bg-purple-50',
      change: 'text-purple-600'
    },
    orange: {
      icon: 'text-orange-600',
      bg: 'bg-orange-50',
      change: 'text-orange-600'
    },
    red: {
      icon: 'text-red-600',
      bg: 'bg-red-50',
      change: 'text-red-600'
    }
  }
  
  return colorMap[color] || colorMap.blue
}

const formatValue = (value: number | string, format: KPICard['format']): string => {
  if (typeof value === 'string') return value
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    
    case 'percentage':
      return `${value.toFixed(1)}%`
    
    case 'score':
      return `${value}/100`
    
    case 'number':
    default:
      return new Intl.NumberFormat('en-US').format(value)
  }
}

const generateKPICards = (metrics: DashboardMetrics): KPICard[] => {
  // Updated to 4 core metrics including Health Score at the top
  return [
    {
      title: 'Business Value',
      value: metrics.businessValuation,
      format: 'currency',
      icon: 'dollar-sign',
      color: 'green',
      change: {
        value: metrics.growthRate > 0 ? Math.abs(metrics.growthRate) : 0,
        type: metrics.growthRate > 0 ? 'increase' : 'decrease',
        period: 'estimated growth'
      }
    },
    {
      title: 'Health Score',
      value: metrics.healthScore,
      format: 'score',
      icon: 'activity',
      color: metrics.healthScore >= 80 ? 'green' : metrics.healthScore >= 60 ? 'orange' : 'red',
      change: {
        value: metrics.healthScore >= 70 ? 5.2 : 2.1,
        type: 'increase',
        period: 'trending up'
      }
    },
    {
      title: 'Progress',
      value: `${metrics.totalEvaluations}/5`,
      format: 'number',
      icon: 'target',
      color: metrics.totalEvaluations >= 3 ? 'green' : 'blue',
      change: {
        value: metrics.totalEvaluations,
        type: 'increase',
        period: 'evaluations done'
      }
    },
    {
      title: 'Risk Level',
      value: metrics.riskLevel.charAt(0).toUpperCase() + metrics.riskLevel.slice(1),
      format: 'number',
      icon: 'shield',
      color: metrics.riskLevel === 'low' ? 'green' : metrics.riskLevel === 'medium' ? 'orange' : 'red',
      change: {
        value: 3.0,
        type: 'decrease',
        period: 'risk reduced'
      }
    }
  ]
}

export default function KPICards({ metrics, isLoading = false }: KPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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
    return null // Let the parent handle empty state
  }

  const kpiCards = generateKPICards(metrics)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {kpiCards.map((card, index) => {
        const colors = getColorClasses(card.color)
        
        return (
          <Card key={index} className="transition-all hover:shadow-md overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground truncate pr-2">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg flex-shrink-0 ${colors.bg}`}>
                <div className={colors.icon}>
                  {getIcon(card.icon)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-hidden">
              <div className="text-2xl font-bold mb-1">
                {formatValue(card.value, card.format)}
              </div>
              
              {card.change && (
                <div className="flex items-center space-x-1 text-xs overflow-hidden">
                  {card.change.type === 'increase' ? (
                    <TrendingUp className="h-3 w-3 text-green-600 flex-shrink-0" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600 flex-shrink-0" />
                  )}
                  <Badge 
                    variant="secondary" 
                    className={`text-xs flex-shrink-0 ${
                      card.change.type === 'increase' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                    }`}
                  >
                    {card.change.type === 'increase' ? '+' : '-'}{card.change.value.toFixed(1)}%
                  </Badge>
                  <span className="text-muted-foreground truncate">{card.change.period}</span>
                </div>
              )}
              
              {!card.change && (
                <div className="text-xs text-muted-foreground">
                  Updated {new Date(metrics.lastUpdated).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}