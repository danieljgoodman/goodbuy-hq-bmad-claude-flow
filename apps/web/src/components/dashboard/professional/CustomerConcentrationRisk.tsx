'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertTriangle,
  Shield,
  Users,
  Download,
  TrendingUp,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react'
import type { CustomerConcentrationAnalysis, ExportConfig, CustomerRiskData } from '@/types/professional-dashboard'

interface CustomerConcentrationRiskProps {
  data: CustomerConcentrationAnalysis
  loading?: boolean
  error?: Error | null
  onExport?: (format: ExportConfig['format']) => Promise<string>
  className?: string
}

type ViewMode = 'overview' | 'heatmap' | 'timeline' | 'details'
type RiskFilter = 'all' | 'low' | 'medium' | 'high' | 'critical'

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
  high: '#e67e22',
  critical: PROFESSIONAL_COLORS.error
}

const RISK_BACKGROUND_COLORS = {
  low: 'rgba(45, 89, 48, 0.1)',
  medium: 'rgba(184, 134, 11, 0.1)',
  high: 'rgba(230, 126, 34, 0.1)',
  critical: 'rgba(139, 38, 53, 0.1)'
}

export function CustomerConcentrationRisk({
  data,
  loading = false,
  error,
  onExport,
  className = ''
}: CustomerConcentrationRiskProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('overview')
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all')
  const [sortBy, setSortBy] = useState<keyof CustomerRiskData>('revenueContribution')

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let filtered = data.customers

    if (riskFilter !== 'all') {
      filtered = filtered.filter(customer => customer.riskCategory === riskFilter)
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'revenueContribution' || sortBy === 'percentageOfTotal' || sortBy === 'riskScore') {
        return b[sortBy] - a[sortBy]
      }
      if (sortBy === 'customerName') {
        return a[sortBy].localeCompare(b[sortBy])
      }
      if (sortBy === 'lastOrderDate') {
        return new Date(b[sortBy]).getTime() - new Date(a[sortBy]).getTime()
      }
      return 0
    })
  }, [data.customers, riskFilter, sortBy])

  // Prepare pie chart data
  const pieChartData = useMemo(() => {
    const riskGroups = filteredCustomers.reduce((acc, customer) => {
      const category = customer.riskCategory
      if (!acc[category]) {
        acc[category] = { count: 0, revenue: 0 }
      }
      acc[category].count += 1
      acc[category].revenue += customer.revenueContribution
      return acc
    }, {} as Record<string, { count: number; revenue: number }>)

    return Object.entries(riskGroups).map(([category, data]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: data.revenue,
      count: data.count,
      color: RISK_COLORS[category as keyof typeof RISK_COLORS]
    }))
  }, [filteredCustomers])

  // Prepare top customers data
  const topCustomersData = useMemo(() => {
    return filteredCustomers.slice(0, 10).map(customer => ({
      name: customer.customerName.length > 15
        ? customer.customerName.substring(0, 12) + '...'
        : customer.customerName,
      fullName: customer.customerName,
      revenue: customer.revenueContribution,
      percentage: customer.percentageOfTotal,
      risk: customer.riskCategory,
      riskScore: customer.riskScore
    }))
  }, [filteredCustomers])

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
    return `${value.toFixed(1)}%`
  }, [])

  // Get risk level color and icon
  const getRiskDisplay = useCallback((risk: CustomerRiskData['riskCategory']) => {
    const configs = {
      low: { icon: Shield, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
      medium: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
      high: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
      critical: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
    }
    return configs[risk]
  }, [])

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.fullName || label}</p>
          <p className="text-sm text-gray-600">
            Revenue: {formatCurrency(data.revenue || payload[0].value)}
          </p>
          <p className="text-sm text-gray-600">
            Percentage: {formatPercentage(data.percentage || 0)}
          </p>
          {data.risk && (
            <Badge variant="outline" className={`mt-1 ${getRiskDisplay(data.risk).color}`}>
              {data.risk} risk
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

  // Render overview cards
  const renderOverviewCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="professional-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Concentration Risk</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.riskMetrics.overallRiskScore.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500">out of 100</p>
            </div>
            <div className={`p-3 rounded-full ${
              data.riskMetrics.overallRiskScore > 70 ? 'bg-red-100' :
              data.riskMetrics.overallRiskScore > 50 ? 'bg-yellow-100' : 'bg-green-100'
            }`}>
              <AlertTriangle className={`h-6 w-6 ${
                data.riskMetrics.overallRiskScore > 70 ? 'text-red-600' :
                data.riskMetrics.overallRiskScore > 50 ? 'text-yellow-600' : 'text-green-600'
              }`} />
            </div>
          </div>
          <Progress
            value={data.riskMetrics.overallRiskScore}
            className="mt-2"
          />
        </CardContent>
      </Card>

      <Card className="professional-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Top 5 Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(data.topCustomersRisk.top5Percentage)}
              </p>
              <p className="text-xs text-gray-500">of total revenue</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            Top 10: {formatPercentage(data.topCustomersRisk.top10Percentage)}
          </div>
        </CardContent>
      </Card>

      <Card className="professional-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Diversification</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.riskMetrics.diversificationScore.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500">diversity score</p>
            </div>
            <div className={`p-3 rounded-full ${
              data.riskMetrics.diversificationScore > 70 ? 'bg-green-100' :
              data.riskMetrics.diversificationScore > 50 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <TrendingUp className={`h-6 w-6 ${
                data.riskMetrics.diversificationScore > 70 ? 'text-green-600' :
                data.riskMetrics.diversificationScore > 50 ? 'text-yellow-600' : 'text-red-600'
              }`} />
            </div>
          </div>
          <Progress
            value={data.riskMetrics.diversificationScore}
            className="mt-2"
          />
        </CardContent>
      </Card>
    </div>
  )

  // Render main chart based on view mode
  const renderMainChart = () => {
    switch (viewMode) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="text-lg">Revenue Distribution by Risk</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="text-lg">Top 10 Customers by Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topCustomersData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={formatCurrency} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={80}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="revenue"
                      fill={PROFESSIONAL_COLORS.primary}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )

      case 'heatmap':
        return (
          <Card className="professional-card">
            <CardHeader>
              <CardTitle className="text-lg">Customer Risk Heat Map</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={filteredCustomers}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="percentageOfTotal"
                    name="Revenue %"
                    tickFormatter={formatPercentage}
                  />
                  <YAxis
                    dataKey="riskScore"
                    name="Risk Score"
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value, name) => [
                      name === 'percentageOfTotal' ? formatPercentage(Number(value)) : value,
                      name === 'percentageOfTotal' ? 'Revenue %' : 'Risk Score'
                    ]}
                  />
                  <Scatter
                    name="Customers"
                    data={filteredCustomers}
                    fill={PROFESSIONAL_COLORS.primary}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )

      default:
        return renderOverviewCards()
    }
  }

  if (loading) {
    return (
      <Card className={`professional-card ${className}`}>
        <CardHeader>
          <CardTitle>Customer Concentration Risk Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="professional-loading">
            <div className="professional-loading-spinner" />
            <p>Loading customer risk data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`professional-card ${className}`}>
        <CardHeader>
          <CardTitle>Customer Concentration Risk Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="professional-error">
            <div className="professional-error-icon">⚠️</div>
            <div className="professional-error-message">Failed to load customer risk data</div>
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
          <CardTitle className="professional-card-title">Customer Concentration Risk Dashboard</CardTitle>
          <p className="professional-card-subtitle">
            Heat maps and risk indicators for customer revenue concentration analysis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="heatmap">Heat Map</SelectItem>
              <SelectItem value="details">Details</SelectItem>
            </SelectContent>
          </Select>

          <Select value={riskFilter} onValueChange={(value: RiskFilter) => setRiskFilter(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
              <SelectItem value="critical">Critical Risk</SelectItem>
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
        {/* Overview Cards */}
        {renderOverviewCards()}

        {/* Main Chart */}
        {renderMainChart()}

        {/* Customer Details Table */}
        {viewMode === 'details' && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Customer Details</h3>
              <Select value={sortBy} onValueChange={(value: keyof CustomerRiskData) => setSortBy(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenueContribution">Revenue Contribution</SelectItem>
                  <SelectItem value="percentageOfTotal">Revenue Percentage</SelectItem>
                  <SelectItem value="riskScore">Risk Score</SelectItem>
                  <SelectItem value="customerName">Customer Name</SelectItem>
                  <SelectItem value="lastOrderDate">Last Order Date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3">Customer</th>
                    <th className="text-right py-2 px-3">Revenue</th>
                    <th className="text-right py-2 px-3">% of Total</th>
                    <th className="text-center py-2 px-3">Risk Level</th>
                    <th className="text-right py-2 px-3">Risk Score</th>
                    <th className="text-center py-2 px-3">Payment History</th>
                    <th className="text-right py-2 px-3">Last Order</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.slice(0, 20).map((customer, index) => {
                    const riskConfig = getRiskDisplay(customer.riskCategory)
                    return (
                      <tr key={customer.customerId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3 font-medium">{customer.customerName}</td>
                        <td className="py-2 px-3 text-right">{formatCurrency(customer.revenueContribution)}</td>
                        <td className="py-2 px-3 text-right">{formatPercentage(customer.percentageOfTotal)}</td>
                        <td className="py-2 px-3 text-center">
                          <Badge
                            variant="outline"
                            className={`${riskConfig.color} ${riskConfig.bg} ${riskConfig.border}`}
                          >
                            {customer.riskCategory}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-right">{customer.riskScore.toFixed(0)}</td>
                        <td className="py-2 px-3 text-center">
                          <Badge
                            variant={
                              customer.paymentHistory === 'excellent' ? 'default' :
                              customer.paymentHistory === 'good' ? 'secondary' :
                              customer.paymentHistory === 'fair' ? 'outline' : 'destructive'
                            }
                          >
                            {customer.paymentHistory}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-right text-gray-600">
                          {new Date(customer.lastOrderDate).toLocaleDateString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations.length > 0 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Risk Management Recommendations
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              {data.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

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
                <SelectItem value="excel">Excel Data</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  )
}