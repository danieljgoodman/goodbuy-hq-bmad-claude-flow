'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import type { HealthScoreBreakdown } from '@/types/dashboard'
import type { GaugeChartProps } from '@/types/charts'

interface HealthScoreGaugeProps extends Omit<GaugeChartProps, 'value'> {
  healthScore: number
  breakdown?: HealthScoreBreakdown
  title?: string
  subtitle?: string
  showBreakdown?: boolean
}

const getScoreColor = (score: number) => {
  if (score >= 80) return '#10B981' // green
  if (score >= 60) return '#F59E0B' // amber
  if (score >= 40) return '#EF4444' // red
  return '#6B7280' // gray
}

const getScoreLabel = (score: number) => {
  if (score >= 90) return 'Excellent'
  if (score >= 80) return 'Good'
  if (score >= 70) return 'Fair'
  if (score >= 60) return 'Below Average'
  if (score >= 40) return 'Poor'
  return 'Critical'
}

const formatPercentage = (value: number) => `${value.toFixed(1)}%`

export default function HealthScoreGauge({
  healthScore,
  breakdown,
  title = "Business Health Score",
  subtitle = "Overall business performance indicator",
  showBreakdown = true,
  size = 200,
  thickness = 20,
  showValue = true,
  label,
  className = ""
}: HealthScoreGaugeProps) {
  // Gauge chart data
  const gaugeData = [
    { name: 'Score', value: healthScore, color: getScoreColor(healthScore) },
    { name: 'Remaining', value: 100 - healthScore, color: '#F3F4F6' }
  ]

  // Breakdown data for pie chart
  const breakdownData = breakdown ? [
    { name: 'Financial', value: breakdown.financial.score, weight: breakdown.financial.weight, color: '#3B82F6' },
    { name: 'Operational', value: breakdown.operational.score, weight: breakdown.operational.weight, color: '#10B981' },
    { name: 'Market', value: breakdown.market.score, weight: breakdown.market.weight, color: '#F59E0B' },
    { name: 'Risk', value: breakdown.risk.score, weight: breakdown.risk.weight, color: '#EF4444' },
    { name: 'Growth', value: breakdown.growth.score, weight: breakdown.growth.weight, color: '#8B5CF6' }
  ] : []

  const CustomLabel = ({ cx, cy }: any) => {
    return (
      <g>
        <text 
          x={cx} 
          y={cy - 10} 
          textAnchor="middle" 
          dominantBaseline="middle"
          className="fill-foreground font-bold text-3xl"
        >
          {healthScore}
        </text>
        <text 
          x={cx} 
          y={cy + 15} 
          textAnchor="middle" 
          dominantBaseline="middle"
          className="fill-muted-foreground text-sm"
        >
          {getScoreLabel(healthScore)}
        </text>
      </g>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </div>
          <Badge 
            variant={healthScore >= 80 ? "default" : healthScore >= 60 ? "secondary" : "destructive"}
            className="text-sm px-3 py-1"
          >
            {healthScore}/100
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Main Gauge */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <ResponsiveContainer width={size} height={size}>
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="50%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={size / 2 - thickness}
                    outerRadius={size / 2}
                    paddingAngle={0}
                    dataKey="value"
                    labelLine={false}
                    label={showValue ? <CustomLabel /> : false}
                  >
                    {gaugeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Score Breakdown */}
          {showBreakdown && breakdown && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Score Breakdown</h4>
              <div className="grid gap-3">
                {breakdownData.map((item) => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">
                          {formatPercentage(item.weight * 100)} weight
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {item.value}/100
                        </Badge>
                      </div>
                    </div>
                    <Progress 
                      value={item.value} 
                      className="h-2"
                      style={{
                        '--progress-background': item.color,
                      } as React.CSSProperties}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {breakdownData.filter(d => d.value >= 70).length}
              </div>
              <div className="text-xs text-muted-foreground">Strong Areas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">
                {breakdownData.filter(d => d.value >= 50 && d.value < 70).length}
              </div>
              <div className="text-xs text-muted-foreground">Improving</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {breakdownData.filter(d => d.value < 50).length}
              </div>
              <div className="text-xs text-muted-foreground">Needs Attention</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}