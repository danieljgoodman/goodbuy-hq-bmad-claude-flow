'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Target,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  Download,
  Filter,
  BarChart3,
  Radar as RadarIcon
} from 'lucide-react'
import type { CompetitivePositioning, ExportConfig, CompetitiveMetric } from '@/types/professional-dashboard'

interface CompetitivePositioningChartProps {
  data: CompetitivePositioning
  loading?: boolean
  error?: Error | null
  onExport?: (format: ExportConfig['format']) => Promise<string>
  className?: string
}

type ChartType = 'radar' | 'bar' | 'comparison'
type CategoryFilter = 'all' | 'market' | 'product' | 'financial' | 'operational' | 'innovation'
type ComparisonMode = 'industry' | 'top-performer' | 'both'

const PROFESSIONAL_COLORS = {
  primary: '#8b4513',
  secondary: '#d2b48c',
  accent: '#cd853f',
  success: '#2d5930',
  warning: '#b8860b',
  error: '#8b2635',
  info: '#4a6fa5'
}

const CATEGORY_COLORS = {
  market: PROFESSIONAL_COLORS.primary,
  product: PROFESSIONAL_COLORS.accent,
  financial: PROFESSIONAL_COLORS.info,
  operational: PROFESSIONAL_COLORS.success,
  innovation: '#9b59b6'
}

const MARKET_POSITION_COLORS = {
  leader: PROFESSIONAL_COLORS.success,
  challenger: PROFESSIONAL_COLORS.info,
  follower: PROFESSIONAL_COLORS.warning,
  niche: PROFESSIONAL_COLORS.accent
}

export function CompetitivePositioningChart({
  data,
  loading = false,
  error,
  onExport,
  className = ''
}: CompetitivePositioningChartProps) {
  const [chartType, setChartType] = useState<ChartType>('radar')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('both')
  const [showWeights, setShowWeights] = useState(false)

  // Filter metrics by category
  const filteredMetrics = useMemo(() => {
    if (categoryFilter === 'all') {
      return data.metrics
    }
    return data.metrics.filter(metric => metric.category === categoryFilter)
  }, [data.metrics, categoryFilter])

  // Prepare radar chart data
  const radarData = useMemo(() => {
    return filteredMetrics.map(metric => ({
      metric: metric.metric.length > 20 ? metric.metric.substring(0, 17) + '...' : metric.metric,
      fullMetric: metric.metric,
      company: metric.companyScore,
      industry: comparisonMode === 'top-performer' ? null : metric.industryAverage,
      topPerformer: comparisonMode === 'industry' ? null : metric.topPerformerScore,
      weight: metric.weight,
      category: metric.category,
      maxValue: Math.max(metric.companyScore, metric.industryAverage, metric.topPerformerScore)
    }))
  }, [filteredMetrics, comparisonMode])

  // Prepare bar chart data
  const barData = useMemo(() => {
    return filteredMetrics.map(metric => ({
      metric: metric.metric.length > 15 ? metric.metric.substring(0, 12) + '...' : metric.metric,
      fullMetric: metric.metric,
      Company: metric.companyScore,
      'Industry Avg': comparisonMode === 'top-performer' ? null : metric.industryAverage,
      'Top Performer': comparisonMode === 'industry' ? null : metric.topPerformerScore,
      weight: metric.weight,
      category: metric.category
    })).filter(item => item.Company !== null)
  }, [filteredMetrics, comparisonMode])

  // Calculate category scores
  const categoryScores = useMemo(() => {
    const categories = ['market', 'product', 'financial', 'operational', 'innovation'] as const

    return categories.map(category => {
      const categoryMetrics = data.metrics.filter(m => m.category === category)
      if (categoryMetrics.length === 0) return null

      const totalWeight = categoryMetrics.reduce((sum, m) => sum + m.weight, 0)
      const weightedScore = categoryMetrics.reduce((sum, m) => {
        return sum + (m.companyScore * m.weight)
      }, 0)

      const avgIndustry = categoryMetrics.reduce((sum, m) => sum + m.industryAverage, 0) / categoryMetrics.length
      const avgTopPerformer = categoryMetrics.reduce((sum, m) => sum + m.topPerformerScore, 0) / categoryMetrics.length

      return {
        category: category.charAt(0).toUpperCase() + category.slice(1),
        score: totalWeight > 0 ? weightedScore / totalWeight : 0,
        industryAvg: avgIndustry,
        topPerformerAvg: avgTopPerformer,
        metricCount: categoryMetrics.length,
        color: CATEGORY_COLORS[category]
      }
    }).filter(Boolean)
  }, [data.metrics])

  // Format score
  const formatScore = useCallback((value: number) => {
    return value.toFixed(1)
  }, [])

  // Get performance indicator
  const getPerformanceIndicator = useCallback((company: number, industry: number, topPerformer: number) => {
    if (company >= topPerformer * 0.9) {
      return { icon: Award, color: 'text-green-600', label: 'Excellent' }
    } else if (company >= industry) {
      return { icon: TrendingUp, color: 'text-blue-600', label: 'Above Average' }
    } else if (company >= industry * 0.8) {
      return { icon: Target, color: 'text-yellow-600', label: 'Average' }
    } else {
      return { icon: TrendingDown, color: 'text-red-600', label: 'Below Average' }
    }
  }, [])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.fullMetric || label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatScore(entry.value)}
              {entry.name === 'company' && data.weight && showWeights && (
                <span className="ml-2 text-xs text-gray-500">
                  (Weight: {data.weight.toFixed(1)})
                </span>
              )}
            </p>
          ))}
          {data.category && (
            <Badge variant="outline" className="mt-2">
              {data.category}
            </Badge>
          )}
        </div>
      )
    }
    return null
  }

  // Export handler
  const handleExport = useCallback(async (format: ExportConfig['format']) => {
    if (onExport) {
      try {
        await onExport(format)
      } catch (error) {
        console.error('Failed to export chart:', error)
      }
    }
  }, [onExport])

  // Render market position summary
  const renderMarketPositionSummary = () => {
    const positionColor = MARKET_POSITION_COLORS[data.overallPosition.marketPosition]

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="professional-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatScore(data.overallPosition.score)}
                </p>
                <p className="text-xs text-gray-500">out of 100</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <Progress value={data.overallPosition.score} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="professional-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Market Position</p>
                <Badge
                  variant="outline"
                  className="text-base font-bold mt-1"
                  style={{ color: positionColor, borderColor: positionColor }}
                >
                  {data.overallPosition.marketPosition}
                </Badge>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${positionColor}20` }}>
                <Award className="h-6 w-6" style={{ color: positionColor }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="professional-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Market Ranking</p>
                <p className="text-2xl font-bold text-gray-900">
                  #{data.overallPosition.ranking}
                </p>
                <p className="text-xs text-gray-500">
                  of {data.overallPosition.totalCompetitors}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="professional-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Metrics Analyzed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredMetrics.length}
                </p>
                <p className="text-xs text-gray-500">competitive factors</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render main chart
  const renderMainChart = () => {
    switch (chartType) {
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <RadarChart data={radarData} margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
              <PolarGrid stroke="#e0e0e0" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fontSize: 12, fill: '#666' }}
                className="text-sm"
              />
              <PolarRadiusAxis
                angle={0}
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: '#999' }}
                tickCount={6}
              />
              <Radar
                name="Company"
                dataKey="company"
                stroke={PROFESSIONAL_COLORS.primary}
                fill={PROFESSIONAL_COLORS.primary}
                fillOpacity={0.3}
                strokeWidth={3}
              />
              {comparisonMode !== 'top-performer' && (
                <Radar
                  name="Industry Average"
                  dataKey="industry"
                  stroke={PROFESSIONAL_COLORS.secondary}
                  fill={PROFESSIONAL_COLORS.secondary}
                  fillOpacity={0.1}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              )}
              {comparisonMode !== 'industry' && (
                <Radar
                  name="Top Performer"
                  dataKey="topPerformer"
                  stroke={PROFESSIONAL_COLORS.accent}
                  fill={PROFESSIONAL_COLORS.accent}
                  fillOpacity={0.1}
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        )

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="metric"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 10 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="Company" fill={PROFESSIONAL_COLORS.primary} radius={[4, 4, 0, 0]} />
              {comparisonMode !== 'top-performer' && (
                <Bar dataKey="Industry Avg" fill={PROFESSIONAL_COLORS.secondary} radius={[4, 4, 0, 0]} />
              )}
              {comparisonMode !== 'industry' && (
                <Bar dataKey="Top Performer" fill={PROFESSIONAL_COLORS.accent} radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        )

      case 'comparison':
        return (
          <div className="space-y-6">
            {/* Category Scores */}
            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="text-lg">Performance by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryScores}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="score" fill={PROFESSIONAL_COLORS.primary} name="Company Score" />
                    <Bar dataKey="industryAvg" fill={PROFESSIONAL_COLORS.secondary} name="Industry Average" />
                    <Bar dataKey="topPerformerAvg" fill={PROFESSIONAL_COLORS.accent} name="Top Performer" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Detailed Metrics */}
            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="text-lg">Detailed Metrics Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredMetrics.map((metric, index) => {
                    const indicator = getPerformanceIndicator(
                      metric.companyScore,
                      metric.industryAverage,
                      metric.topPerformerScore
                    )
                    const Icon = indicator.icon

                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Icon className={`h-5 w-5 ${indicator.color}`} />
                            <div>
                              <h4 className="font-medium text-gray-900">{metric.metric}</h4>
                              <Badge variant="outline" style={{ color: CATEGORY_COLORS[metric.category] }}>
                                {metric.category}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              {formatScore(metric.companyScore)}
                            </p>
                            <p className={`text-sm ${indicator.color}`}>
                              {indicator.label}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Company Score</p>
                            <p className="font-semibold">{formatScore(metric.companyScore)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Industry Average</p>
                            <p className="font-semibold">{formatScore(metric.industryAverage)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Top Performer</p>
                            <p className="font-semibold">{formatScore(metric.topPerformerScore)}</p>
                          </div>
                        </div>

                        {showWeights && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500">
                              Weight: {formatScore(metric.weight)} |
                              Category: {metric.category}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <Card className={`professional-card ${className}`}>
        <CardHeader>
          <CardTitle>Competitive Positioning Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="professional-loading">
            <div className="professional-loading-spinner" />
            <p>Loading competitive positioning data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`professional-card ${className}`}>
        <CardHeader>
          <CardTitle>Competitive Positioning Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="professional-error">
            <div className="professional-error-icon">⚠️</div>
            <div className="professional-error-message">Failed to load competitive data</div>
            <div className="professional-error-details">{error.message}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`professional-card ${className}`}>
      <CardHeader className="professional-card-header">
        <div>
          <CardTitle className="professional-card-title">Competitive Positioning Analysis</CardTitle>
          <p className="professional-card-subtitle">
            Market position analysis with industry benchmarks and competitive intelligence
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="radar">
                <div className="flex items-center space-x-2">
                  <RadarIcon className="h-4 w-4" />
                  <span>Radar</span>
                </div>
              </SelectItem>
              <SelectItem value="bar">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Bar Chart</span>
                </div>
              </SelectItem>
              <SelectItem value="comparison">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>Comparison</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={(value: CategoryFilter) => setCategoryFilter(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="market">Market</SelectItem>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
              <SelectItem value="operational">Operational</SelectItem>
              <SelectItem value="innovation">Innovation</SelectItem>
            </SelectContent>
          </Select>

          <Select value={comparisonMode} onValueChange={(value: ComparisonMode) => setComparisonMode(value)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both">Both Benchmarks</SelectItem>
              <SelectItem value="industry">Industry Only</SelectItem>
              <SelectItem value="top-performer">Top Performer Only</SelectItem>
            </SelectContent>
          </Select>

          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('png')}
              className="professional-button-outline"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Market Position Summary */}
        {renderMarketPositionSummary()}

        {/* Main Chart */}
        <div className="professional-chart-container large">
          {renderMainChart()}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showWeights}
              onChange={(e) => setShowWeights(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span>Show Metric Weights</span>
          </label>

          {onExport && (
            <div className="professional-export-controls">
              <Select onValueChange={(format: ExportConfig['format']) => handleExport(format)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Export" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG Image</SelectItem>
                  <SelectItem value="pdf">PDF Report</SelectItem>
                  <SelectItem value="excel">Excel Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* SWOT Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Strengths
              </h4>
              <ul className="text-sm text-green-700 space-y-1">
                {data.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                <Target className="h-4 w-4 mr-2" />
                Opportunities
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {data.opportunities.map((opportunity, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>{opportunity}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                <TrendingDown className="h-4 w-4 mr-2" />
                Weaknesses
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {data.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Threats
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                {data.threats.map((threat, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span>{threat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}