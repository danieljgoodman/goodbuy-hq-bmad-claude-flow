'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import type { HealthScoreBreakdown } from '@/types/dashboard'
import type { GaugeChartProps } from '@/types/charts'
import { getHealthScoreColor, getMetricColor, cssVars } from '@/lib/utils/colors'

interface HealthScoreGaugeProps extends Omit<GaugeChartProps, 'value'> {
  healthScore: number
  breakdown?: HealthScoreBreakdown
  title?: string
  subtitle?: string
  showBreakdown?: boolean
}

const getScoreColor = (score: number) => {
  return getHealthScoreColor(score)
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
    { name: 'Remaining', value: 100 - healthScore, color: cssVars.muted }
  ]
  
  // Force timestamp for cache busting
  const timestamp = Date.now()

  // Breakdown data for pie chart
  const breakdownData = breakdown ? [
    { name: 'Financial', value: breakdown.financial.score, weight: breakdown.financial.weight, color: getMetricColor('financial') },
    { name: 'Operational', value: breakdown.operational.score, weight: breakdown.operational.weight, color: getMetricColor('operational') },
    { name: 'Market', value: breakdown.market.score, weight: breakdown.market.weight, color: getMetricColor('market') },
    { name: 'Risk', value: breakdown.risk.score, weight: breakdown.risk.weight, color: getMetricColor('risk') },
    { name: 'Growth', value: breakdown.growth.score, weight: breakdown.growth.weight, color: getMetricColor('growth') }
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
    <Card className={`flex flex-col ${className}`}>
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
      <CardContent className="pb-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          {/* Main Gauge - Full Semicircle Visible */}
          <div className="flex items-center justify-center -mb-2">
            <div className="relative">
              <ResponsiveContainer width={size} height={size * 0.6}>
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="100%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={size / 2 - thickness}
                    outerRadius={size / 2}
                    paddingAngle={0}
                    dataKey="value"
                    labelLine={false}
                    label={showValue ? (props) => (
                      <g>
                        <text 
                          x={props.cx} 
                          y={props.cy - 30} 
                          textAnchor="middle" 
                          dominantBaseline="middle"
                          className="fill-foreground font-bold text-3xl"
                        >
                          {healthScore}
                        </text>
                        <text 
                          x={props.cx} 
                          y={props.cy - 5} 
                          textAnchor="middle" 
                          dominantBaseline="middle"
                          className="fill-muted-foreground text-sm"
                        >
                          {getScoreLabel(healthScore)}
                        </text>
                      </g>
                    ) : false}
                  >
                    {gaugeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key Metrics - Moved closer */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold" style={{ color: cssVars.success }}>
                {breakdownData.filter(d => d.value >= 70).length}
              </div>
              <div className="text-xs text-muted-foreground">Strong Areas</div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: cssVars.warning }}>
                {breakdownData.filter(d => d.value >= 50 && d.value < 70).length}
              </div>
              <div className="text-xs text-muted-foreground">Improving</div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: cssVars.danger }}>
                {breakdownData.filter(d => d.value < 50).length}
              </div>
              <div className="text-xs text-muted-foreground">Needs Attention</div>
            </div>
          </div>

          {/* Score Breakdown - Collapsed by default */}
          {showBreakdown && breakdown && (
            <details className="space-y-2">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                View Score Breakdown
              </summary>
              <div className="grid gap-2 pt-2">
                {breakdownData.map((item) => (
                  <div key={item.name} className="flex justify-between items-center text-sm">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.value}/100
                    </Badge>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </CardContent>
    </Card>
  )
}