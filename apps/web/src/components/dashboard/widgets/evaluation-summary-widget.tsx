'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Eye,
  Calendar,
  DollarSign
} from 'lucide-react'
import { DashboardWidget } from '@/contexts/dashboard-customization-context'

interface EvaluationData {
  totalEvaluations: number
  latestValuation: {
    amount: number
    date: string
    change: number
    changePercentage: number
  }
  recentEvaluations: {
    id: string
    businessName: string
    valuation: number
    healthScore: number
    date: string
    status: 'completed' | 'in_progress' | 'draft'
  }[]
  monthlyTrend: {
    month: string
    evaluations: number
    averageValuation: number
  }[]
}

// Sample data - in real app this would come from API
const sampleData: EvaluationData = {
  totalEvaluations: 12,
  latestValuation: {
    amount: 1250000,
    date: '2024-01-15',
    change: 180000,
    changePercentage: 16.8
  },
  recentEvaluations: [
    {
      id: '1',
      businessName: 'Tech Solutions Ltd',
      valuation: 1250000,
      healthScore: 84,
      date: '2024-01-15',
      status: 'completed'
    },
    {
      id: '2', 
      businessName: 'Tech Solutions Ltd',
      valuation: 1070000,
      date: '2023-10-20',
      healthScore: 78,
      status: 'completed'
    },
    {
      id: '3',
      businessName: 'Tech Solutions Ltd', 
      valuation: 950000,
      date: '2023-07-12',
      healthScore: 72,
      status: 'completed'
    }
  ],
  monthlyTrend: [
    { month: 'Sep', evaluations: 2, averageValuation: 980000 },
    { month: 'Oct', evaluations: 1, averageValuation: 1070000 },
    { month: 'Nov', evaluations: 0, averageValuation: 0 },
    { month: 'Dec', evaluations: 1, averageValuation: 1150000 },
    { month: 'Jan', evaluations: 1, averageValuation: 1250000 }
  ]
}

interface EvaluationSummaryWidgetProps {
  widget: DashboardWidget
}

export default function EvaluationSummaryWidget({ widget }: EvaluationSummaryWidgetProps) {
  const [data, setData] = useState<EvaluationData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      setLoading(true)
      // In real app: const data = await fetchEvaluationData(widget.config)
      setTimeout(() => {
        setData(sampleData)
        setLoading(false)
      }, 1000)
    }

    fetchData()
  }, [widget.config])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-muted rounded-lg animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded animate-pulse" />
          <div className="h-3 bg-muted rounded animate-pulse" />
          <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
        <h4 className="font-medium mb-2">No Evaluations Yet</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Create your first business evaluation to see insights here.
        </p>
        <Button asChild size="sm">
          <Link href="/evaluations/new" className="gap-2">
            <Plus className="w-4 h-4" />
            New Evaluation
          </Link>
        </Button>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    }
    return `$${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isLarge = widget.size === 'large'
  const isSmall = widget.size === 'small'

  return (
    <div className="space-y-4">
      {/* Latest Valuation */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {formatCurrency(data.latestValuation.amount)}
              </span>
              <div className={`flex items-center gap-1 ${
                data.latestValuation.change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {data.latestValuation.change > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {data.latestValuation.changePercentage > 0 ? '+' : ''}
                  {data.latestValuation.changePercentage}%
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {formatDate(data.latestValuation.date)}
            </div>
          </div>
        </div>

        {!isSmall && (
          <div className="text-xs text-muted-foreground">
            Latest business valuation • {data.totalEvaluations} total evaluations
          </div>
        )}
      </div>

      {/* Recent Evaluations List - Only show for medium/large */}
      {!isSmall && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Recent Evaluations</h4>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/evaluations/history" className="gap-1">
                <Eye className="w-3 h-3" />
                View All
              </Link>
            </Button>
          </div>
          
          <div className="space-y-2">
            {data.recentEvaluations.slice(0, isLarge ? 3 : 2).map((evaluation) => (
              <div key={evaluation.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {formatCurrency(evaluation.valuation)}
                    </span>
                    <Badge 
                      variant={
                        evaluation.status === 'completed' ? 'default' :
                        evaluation.status === 'in_progress' ? 'secondary' : 'outline'
                      }
                      className="text-xs"
                    >
                      {evaluation.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(evaluation.date)}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-xs text-center">
                    <div className="font-medium">{evaluation.healthScore}</div>
                    <div className="text-muted-foreground">Score</div>
                  </div>
                  <Progress 
                    value={evaluation.healthScore} 
                    className="w-12 h-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2 pt-2">
        <Button asChild size="sm" className="flex-1 gap-2">
          <Link href="/evaluations/new">
            <Plus className="w-3 h-3" />
            {isSmall ? 'New' : 'New Evaluation'}
          </Link>
        </Button>
        
        {!isSmall && (
          <Button variant="outline" size="sm" asChild>
            <Link href="/evaluations/history" className="gap-2">
              <BarChart3 className="w-3 h-3" />
              History
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}