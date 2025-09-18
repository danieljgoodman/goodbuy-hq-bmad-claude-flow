'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Clock,
  Shield,
  Download,
  Plus,
  Trash2,
  Play,
  BarChart3,
  PieChart
} from 'lucide-react'
import type { InvestmentAnalysis, InvestmentScenario, ROICalculation, ExportConfig } from '@/types/professional-dashboard'
import { InvestmentAnalytics } from '@/lib/analytics/professional-calculations'

interface InvestmentROICalculatorProps {
  data: InvestmentAnalysis
  loading?: boolean
  error?: Error | null
  onExport?: (format: ExportConfig['format']) => Promise<string>
  onScenarioUpdate?: (scenarios: InvestmentScenario[]) => void
  className?: string
}

type CalculatorMode = 'analyze' | 'create' | 'compare' | 'optimize'
type ChartView = 'cashflow' | 'comparison' | 'risk-return' | 'portfolio'

const PROFESSIONAL_COLORS = {
  primary: '#8b4513',
  secondary: '#d2b48c',
  accent: '#cd853f',
  success: '#2d5930',
  warning: '#b8860b',
  error: '#8b2635',
  info: '#4a6fa5'
}

const RISK_COLORS = {
  low: PROFESSIONAL_COLORS.success,
  medium: PROFESSIONAL_COLORS.warning,
  high: PROFESSIONAL_COLORS.error
}

const CATEGORY_COLORS = {
  expansion: PROFESSIONAL_COLORS.primary,
  technology: PROFESSIONAL_COLORS.info,
  marketing: PROFESSIONAL_COLORS.accent,
  operations: PROFESSIONAL_COLORS.success,
  acquisition: '#9b59b6'
}

export function InvestmentROICalculator({
  data,
  loading = false,
  error,
  onExport,
  onScenarioUpdate,
  className = ''
}: InvestmentROICalculatorProps) {
  const [calculatorMode, setCalculatorMode] = useState<CalculatorMode>('analyze')
  const [chartView, setChartView] = useState<ChartView>('cashflow')
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([])
  const [newScenario, setNewScenario] = useState<Partial<InvestmentScenario>>({
    name: '',
    investmentAmount: 100000,
    expectedReturn: 15,
    timeHorizon: 5,
    riskLevel: 'medium',
    category: 'expansion'
  })

  // Calculate scenarios in real-time
  const calculatedScenarios = useMemo(() => {
    return data.calculations.map(calc => {
      const cashFlowData = calc.cashFlowProjection.map((cf, index) => ({
        year: index,
        cashFlow: cf.cashFlow,
        cumulative: cf.cumulativeCashFlow,
        scenario: calc.scenario.name
      }))

      return {
        ...calc,
        cashFlowData,
        riskAdjustedROI: calc.riskAdjustedReturn,
        efficiency: calc.projectedROI / calc.scenario.investmentAmount * 100000 // ROI per $100k invested
      }
    })
  }, [data.calculations])

  // Filter calculations based on selection
  const filteredCalculations = useMemo(() => {
    if (selectedScenarios.length === 0) {
      return calculatedScenarios
    }
    return calculatedScenarios.filter(calc =>
      selectedScenarios.includes(calc.scenario.id)
    )
  }, [calculatedScenarios, selectedScenarios])

  // Prepare chart data
  const chartData = useMemo(() => {
    switch (chartView) {
      case 'cashflow':
        // Combine all cash flow data
        const maxYears = Math.max(...filteredCalculations.map(calc => calc.cashFlowProjection.length))
        const years = Array.from({ length: maxYears }, (_, i) => i)

        return years.map(year => {
          const dataPoint: any = { year }
          filteredCalculations.forEach(calc => {
            if (calc.cashFlowProjection[year]) {
              dataPoint[calc.scenario.name] = calc.cashFlowProjection[year].cumulativeCashFlow
            }
          })
          return dataPoint
        })

      case 'comparison':
        return filteredCalculations.map(calc => ({
          name: calc.scenario.name.length > 15 ? calc.scenario.name.substring(0, 12) + '...' : calc.scenario.name,
          fullName: calc.scenario.name,
          ROI: calc.projectedROI,
          NPV: calc.netPresentValue,
          IRR: calc.internalRateOfReturn,
          Payback: calc.paybackPeriod,
          Risk: calc.scenario.riskLevel,
          Category: calc.scenario.category,
          Investment: calc.scenario.investmentAmount
        }))

      case 'risk-return':
        return filteredCalculations.map(calc => ({
          risk: calc.scenario.riskLevel === 'low' ? 25 : calc.scenario.riskLevel === 'medium' ? 50 : 75,
          return: calc.projectedROI,
          name: calc.scenario.name,
          investment: calc.scenario.investmentAmount,
          category: calc.scenario.category
        }))

      case 'portfolio':
        return data.portfolioOptimization.recommendedMix.map(mix => {
          const scenario = data.scenarios.find(s => s.id === mix.scenarioId)
          return {
            name: scenario?.name || 'Unknown',
            allocation: mix.allocation,
            category: scenario?.category || 'unknown'
          }
        })

      default:
        return []
    }
  }, [chartView, filteredCalculations, data])

  // Format currency
  const formatCurrency = useCallback((value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`
    }
    return `$${value.toLocaleString()}`
  }, [])

  // Format percentage
  const formatPercentage = useCallback((value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }, [])

  // Handle scenario creation
  const handleCreateScenario = useCallback(() => {
    if (!newScenario.name || !newScenario.investmentAmount || !newScenario.expectedReturn) {
      return
    }

    const scenario: InvestmentScenario = {
      id: `scenario_${Date.now()}`,
      name: newScenario.name,
      investmentAmount: newScenario.investmentAmount,
      expectedReturn: newScenario.expectedReturn,
      timeHorizon: newScenario.timeHorizon || 5,
      riskLevel: newScenario.riskLevel || 'medium',
      category: newScenario.category || 'expansion'
    }

    const updatedScenarios = [...data.scenarios, scenario]
    if (onScenarioUpdate) {
      onScenarioUpdate(updatedScenarios)
    }

    // Reset form
    setNewScenario({
      name: '',
      investmentAmount: 100000,
      expectedReturn: 15,
      timeHorizon: 5,
      riskLevel: 'medium',
      category: 'expansion'
    })
  }, [newScenario, data.scenarios, onScenarioUpdate])

  // Handle scenario deletion
  const handleDeleteScenario = useCallback((scenarioId: string) => {
    const updatedScenarios = data.scenarios.filter(s => s.id !== scenarioId)
    if (onScenarioUpdate) {
      onScenarioUpdate(updatedScenarios)
    }
  }, [data.scenarios, onScenarioUpdate])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.fullName || data.name || label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {
                entry.name.includes('$') || entry.dataKey === 'NPV' || entry.dataKey === 'Investment'
                  ? formatCurrency(entry.value)
                  : entry.name.includes('%') || entry.dataKey === 'ROI' || entry.dataKey === 'IRR'
                  ? formatPercentage(entry.value)
                  : entry.value
              }
            </p>
          ))}
          {data.Risk && (
            <Badge variant="outline" className={`mt-1 ${
              data.Risk === 'low' ? 'text-green-600' :
              data.Risk === 'medium' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {data.Risk} risk
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
        console.error('Failed to export calculator:', error)
      }
    }
  }, [onExport])

  // Render summary cards
  const renderSummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="professional-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Best ROI</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(data.comparison.bestROI.projectedROI)}
              </p>
              <p className="text-xs text-gray-500">{data.comparison.bestROI.scenario.name}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="professional-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Safest Investment</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.comparison.safestInvestment.scenario.investmentAmount)}
              </p>
              <p className="text-xs text-gray-500">{data.comparison.safestInvestment.scenario.name}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="professional-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Fastest Payback</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.comparison.fastestPayback.paybackPeriod.toFixed(1)}y
              </p>
              <p className="text-xs text-gray-500">{data.comparison.fastestPayback.scenario.name}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="professional-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Portfolio ROI</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(data.portfolioOptimization.expectedPortfolioROI)}
              </p>
              <p className="text-xs text-gray-500">Optimized mix</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100">
              <PieChart className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Render chart based on view
  const renderChart = () => {
    switch (chartView) {
      case 'cashflow':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {filteredCalculations.map((calc, index) => (
                <Line
                  key={calc.scenario.id}
                  type="monotone"
                  dataKey={calc.scenario.name}
                  stroke={Object.values(CATEGORY_COLORS)[index % Object.values(CATEGORY_COLORS).length]}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case 'comparison':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 10 }}
              />
              <YAxis tickFormatter={formatPercentage} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="ROI" fill={PROFESSIONAL_COLORS.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'risk-return':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="risk" name="Risk Level" />
              <YAxis dataKey="return" name="Expected Return" tickFormatter={formatPercentage} />
              <Tooltip content={<CustomTooltip />} />
              <Scatter name="Investments" data={chartData} fill={PROFESSIONAL_COLORS.primary} />
            </ScatterChart>
          </ResponsiveContainer>
        )

      case 'portfolio':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={formatPercentage} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="allocation" fill={PROFESSIONAL_COLORS.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  // Render scenario creation form
  const renderScenarioForm = () => (
    <Card className="professional-card">
      <CardHeader>
        <CardTitle className="text-lg">Create New Investment Scenario</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="scenario-name">Scenario Name</Label>
            <Input
              id="scenario-name"
              placeholder="e.g., New Product Launch"
              value={newScenario.name || ''}
              onChange={(e) => setNewScenario(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="investment-amount">Investment Amount</Label>
            <Input
              id="investment-amount"
              type="number"
              placeholder="100000"
              value={newScenario.investmentAmount || ''}
              onChange={(e) => setNewScenario(prev => ({ ...prev, investmentAmount: Number(e.target.value) }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="expected-return">Expected Return (%)</Label>
            <div className="mt-2">
              <Slider
                value={[newScenario.expectedReturn || 15]}
                onValueChange={(value) => setNewScenario(prev => ({ ...prev, expectedReturn: value[0] }))}
                max={50}
                min={0}
                step={0.5}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600 mt-1">
                {formatPercentage(newScenario.expectedReturn || 15)}
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="time-horizon">Time Horizon (years)</Label>
            <div className="mt-2">
              <Slider
                value={[newScenario.timeHorizon || 5]}
                onValueChange={(value) => setNewScenario(prev => ({ ...prev, timeHorizon: value[0] }))}
                max={20}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600 mt-1">
                {newScenario.timeHorizon || 5} years
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="risk-level">Risk Level</Label>
            <Select
              value={newScenario.riskLevel || 'medium'}
              onValueChange={(value: 'low' | 'medium' | 'high') =>
                setNewScenario(prev => ({ ...prev, riskLevel: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="category">Investment Category</Label>
          <Select
            value={newScenario.category || 'expansion'}
            onValueChange={(value: InvestmentScenario['category']) =>
              setNewScenario(prev => ({ ...prev, category: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expansion">Business Expansion</SelectItem>
              <SelectItem value="technology">Technology Upgrade</SelectItem>
              <SelectItem value="marketing">Marketing Campaign</SelectItem>
              <SelectItem value="operations">Operations Improvement</SelectItem>
              <SelectItem value="acquisition">Acquisition</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleCreateScenario}
          className="w-full professional-button-primary"
          disabled={!newScenario.name || !newScenario.investmentAmount}
        >
          <Calculator className="h-4 w-4 mr-2" />
          Calculate Scenario
        </Button>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <Card className={`professional-card ${className}`}>
        <CardHeader>
          <CardTitle>Investment ROI Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="professional-loading">
            <div className="professional-loading-spinner" />
            <p>Loading investment analysis...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`professional-card ${className}`}>
        <CardHeader>
          <CardTitle>Investment ROI Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="professional-error">
            <div className="professional-error-icon">⚠️</div>
            <div className="professional-error-message">Failed to load investment data</div>
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
          <CardTitle className="professional-card-title">Investment ROI Calculator</CardTitle>
          <p className="professional-card-subtitle">
            Interactive scenario modeling with NPV, IRR, and payback analysis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={chartView} onValueChange={(value: ChartView) => setChartView(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cashflow">Cash Flow</SelectItem>
              <SelectItem value="comparison">Comparison</SelectItem>
              <SelectItem value="risk-return">Risk vs Return</SelectItem>
              <SelectItem value="portfolio">Portfolio Mix</SelectItem>
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
        {/* Summary Cards */}
        {renderSummaryCards()}

        {/* Main Content Tabs */}
        <Tabs value={calculatorMode} onValueChange={(value: CalculatorMode) => setCalculatorMode(value)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analyze">Analyze</TabsTrigger>
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="compare">Compare</TabsTrigger>
            <TabsTrigger value="optimize">Optimize</TabsTrigger>
          </TabsList>

          <TabsContent value="analyze" className="space-y-6">
            {/* Chart */}
            <div className="professional-chart-container large">
              {renderChart()}
            </div>

            {/* Scenario Selection */}
            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="text-lg">Investment Scenarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {calculatedScenarios.map((calc, index) => {
                    const isSelected = selectedScenarios.includes(calc.scenario.id)
                    return (
                      <div
                        key={calc.scenario.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedScenarios(prev => prev.filter(id => id !== calc.scenario.id))
                          } else {
                            setSelectedScenarios(prev => [...prev, calc.scenario.id])
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{calc.scenario.name}</h4>
                          <Badge
                            variant="outline"
                            style={{
                              color: CATEGORY_COLORS[calc.scenario.category],
                              borderColor: CATEGORY_COLORS[calc.scenario.category]
                            }}
                          >
                            {calc.scenario.category}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-600">Investment</p>
                            <p className="font-semibold">{formatCurrency(calc.scenario.investmentAmount)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">ROI</p>
                            <p className="font-semibold">{formatPercentage(calc.projectedROI)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">NPV</p>
                            <p className="font-semibold">{formatCurrency(calc.netPresentValue)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Payback</p>
                            <p className="font-semibold">{calc.paybackPeriod.toFixed(1)}y</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className={
                              calc.scenario.riskLevel === 'low' ? 'text-green-600' :
                              calc.scenario.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                            }
                          >
                            {calc.scenario.riskLevel} risk
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteScenario(calc.scenario.id)
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            {renderScenarioForm()}
          </TabsContent>

          <TabsContent value="compare" className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3">Scenario</th>
                    <th className="text-right py-2 px-3">Investment</th>
                    <th className="text-right py-2 px-3">ROI</th>
                    <th className="text-right py-2 px-3">NPV</th>
                    <th className="text-right py-2 px-3">IRR</th>
                    <th className="text-right py-2 px-3">Payback</th>
                    <th className="text-center py-2 px-3">Risk</th>
                    <th className="text-center py-2 px-3">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedScenarios.map((calc, index) => (
                    <tr key={calc.scenario.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{calc.scenario.name}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(calc.scenario.investmentAmount)}</td>
                      <td className="py-2 px-3 text-right">{formatPercentage(calc.projectedROI)}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(calc.netPresentValue)}</td>
                      <td className="py-2 px-3 text-right">{formatPercentage(calc.internalRateOfReturn)}</td>
                      <td className="py-2 px-3 text-right">{calc.paybackPeriod.toFixed(1)}y</td>
                      <td className="py-2 px-3 text-center">
                        <Badge
                          variant="outline"
                          className={
                            calc.scenario.riskLevel === 'low' ? 'text-green-600' :
                            calc.scenario.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                          }
                        >
                          {calc.scenario.riskLevel}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Badge
                          variant="outline"
                          style={{
                            color: CATEGORY_COLORS[calc.scenario.category],
                            borderColor: CATEGORY_COLORS[calc.scenario.category]
                          }}
                        >
                          {calc.scenario.category}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="optimize" className="space-y-6">
            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="text-lg">Portfolio Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-4">Recommended Asset Allocation</h4>
                    <div className="space-y-3">
                      {data.portfolioOptimization.recommendedMix.map((mix, index) => {
                        const scenario = data.scenarios.find(s => s.id === mix.scenarioId)
                        return (
                          <div key={mix.scenarioId} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{scenario?.name}</p>
                              <p className="text-sm text-gray-600">{scenario?.category}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatPercentage(mix.allocation)}</p>
                              <Badge
                                variant="outline"
                                className={
                                  scenario?.riskLevel === 'low' ? 'text-green-600' :
                                  scenario?.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                                }
                              >
                                {scenario?.riskLevel}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-4">Portfolio Metrics</h4>
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-600">Expected Portfolio ROI</p>
                        <p className="text-2xl font-bold text-green-800">
                          {formatPercentage(data.portfolioOptimization.expectedPortfolioROI)}
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-600">Risk Score</p>
                        <p className="text-2xl font-bold text-blue-800">
                          {data.portfolioOptimization.riskScore.toFixed(0)}/100
                        </p>
                      </div>
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-600">Diversification</p>
                        <p className="text-lg font-semibold text-yellow-800">
                          {data.portfolioOptimization.recommendedMix.length} investments
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Export Controls */}
        {onExport && (
          <div className="professional-export-controls">
            <Select onValueChange={(format: ExportConfig['format']) => handleExport(format)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Export" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG Image</SelectItem>
                <SelectItem value="pdf">PDF Report</SelectItem>
                <SelectItem value="excel">Excel Model</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  )
}