'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  TrendingUp, 
  Activity, 
  DollarSign,
  Calendar,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'

interface AdminAnalyticsData {
  userMetrics: {
    totalUsers: number
    newUsersToday: number
    newUsersThisWeek: number
    newUsersThisMonth: number
    activeUsersToday: number
    userGrowthRate: number
  }
  evaluationMetrics: {
    totalEvaluations: number
    evaluationsToday: number
    evaluationsThisWeek: number
    evaluationsThisMonth: number
    completionRate: number
    averageHealthScore: number
  }
  subscriptionMetrics: {
    freeUsers: number
    premiumUsers: number
    enterpriseUsers: number
    conversionRate: number
    churnRate: number
    monthlyRecurringRevenue: number
  }
  systemHealth: {
    uptime: number
    responseTime: number
    errorRate: number
    activeErrors: number
    lastBackup: string
    diskUsage: number
  }
}

const emptyAnalyticsData: AdminAnalyticsData = {
  userMetrics: {
    totalUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
    activeUsersToday: 0,
    userGrowthRate: 0
  },
  evaluationMetrics: {
    totalEvaluations: 0,
    evaluationsToday: 0,
    evaluationsThisWeek: 0,
    evaluationsThisMonth: 0,
    completionRate: 0,
    averageHealthScore: 0
  },
  subscriptionMetrics: {
    freeUsers: 0,
    premiumUsers: 0,
    enterpriseUsers: 0,
    conversionRate: 0,
    churnRate: 0,
    monthlyRecurringRevenue: 0
  },
  systemHealth: {
    uptime: 0,
    responseTime: 0,
    errorRate: 0,
    activeErrors: 0,
    lastBackup: new Date().toISOString(),
    diskUsage: 0
  }
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AdminAnalyticsData>(emptyAnalyticsData)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        console.warn('Analytics API not available, showing empty data')
        setAnalytics(emptyAnalyticsData)
      }
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to load analytics:', error)
      setAnalytics(emptyAnalyticsData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const getHealthColor = (value: number, reversed = false) => {
    if (reversed) {
      if (value < 2) return 'text-green-600'
      if (value < 5) return 'text-yellow-600'
      return 'text-red-600'
    }
    if (value >= 95) return 'text-green-600'
    if (value >= 90) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getHealthBadge = (value: number, reversed = false) => {
    if (reversed) {
      if (value < 2) return 'default'
      if (value < 5) return 'secondary'
      return 'destructive'
    }
    if (value >= 95) return 'default'
    if (value >= 90) return 'secondary'
    return 'destructive'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6" />
          <div>
            <h2 className="text-2xl font-bold">Admin Analytics</h2>
            <p className="text-muted-foreground">Platform metrics and system health</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadAnalytics} 
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Metrics</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analytics.userMetrics.totalUsers)}</div>
                <p className="text-xs text-muted-foreground">
                  +{analytics.userMetrics.newUsersThisWeek} this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Today</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analytics.userMetrics.activeUsersToday)}</div>
                <p className="text-xs text-muted-foreground">
                  {((analytics.userMetrics.activeUsersToday / analytics.userMetrics.totalUsers) * 100).toFixed(1)}% of total users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analytics.subscriptionMetrics.monthlyRecurringRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.subscriptionMetrics.conversionRate}% conversion rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <CheckCircle className={`h-4 w-4 ${getHealthColor(analytics.systemHealth.uptime)}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.systemHealth.uptime}%</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.systemHealth.responseTime}ms avg response
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Evaluation Trends</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Today</span>
                  <Badge variant="outline">{analytics.evaluationMetrics.evaluationsToday}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>This Week</span>
                  <Badge variant="outline">{analytics.evaluationMetrics.evaluationsThisWeek}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Completion Rate</span>
                  <Badge variant={analytics.evaluationMetrics.completionRate >= 75 ? 'default' : 'secondary'}>
                    {analytics.evaluationMetrics.completionRate}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Growth</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Growth Rate</span>
                  <Badge variant="default">+{analytics.userMetrics.userGrowthRate}%</Badge>
                </div>
                <div className="flex justify-between">
                  <span>New Today</span>
                  <Badge variant="outline">{analytics.userMetrics.newUsersToday}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>New This Month</span>
                  <Badge variant="outline">{analytics.userMetrics.newUsersThisMonth}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Subscription Mix</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Free ({analytics.subscriptionMetrics.freeUsers})</span>
                    <span>{((analytics.subscriptionMetrics.freeUsers / analytics.userMetrics.totalUsers) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(analytics.subscriptionMetrics.freeUsers / analytics.userMetrics.totalUsers) * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Premium ({analytics.subscriptionMetrics.premiumUsers})</span>
                    <span>{((analytics.subscriptionMetrics.premiumUsers / analytics.userMetrics.totalUsers) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(analytics.subscriptionMetrics.premiumUsers / analytics.userMetrics.totalUsers) * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Enterprise ({analytics.subscriptionMetrics.enterpriseUsers})</span>
                    <span>{((analytics.subscriptionMetrics.enterpriseUsers / analytics.userMetrics.totalUsers) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(analytics.subscriptionMetrics.enterpriseUsers / analytics.userMetrics.totalUsers) * 100} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>User Registration</CardTitle>
                <CardDescription>New user signups</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-bold">{formatNumber(analytics.userMetrics.totalUsers)}</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Today</span>
                    <Badge variant="outline">{analytics.userMetrics.newUsersToday}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>This Week</span>
                    <Badge variant="outline">{analytics.userMetrics.newUsersThisWeek}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>This Month</span>
                    <Badge variant="outline">{analytics.userMetrics.newUsersThisMonth}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
                <CardDescription>Daily active users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-bold">{formatNumber(analytics.userMetrics.activeUsersToday)}</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Engagement Rate</span>
                    <Badge variant="default">
                      {((analytics.userMetrics.activeUsersToday / analytics.userMetrics.totalUsers) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={(analytics.userMetrics.activeUsersToday / analytics.userMetrics.totalUsers) * 100} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Rate</CardTitle>
                <CardDescription>Month over month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-bold text-green-600">+{analytics.userMetrics.userGrowthRate}%</div>
                <p className="text-sm text-muted-foreground">
                  Strong growth trajectory maintained
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Evaluations</CardTitle>
                <CardDescription>All time completed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-bold">{formatNumber(analytics.evaluationMetrics.totalEvaluations)}</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Today</span>
                    <Badge variant="outline">{analytics.evaluationMetrics.evaluationsToday}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>This Month</span>
                    <Badge variant="outline">{analytics.evaluationMetrics.evaluationsThisMonth}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Completion Rate</CardTitle>
                <CardDescription>Successfully completed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-bold">{analytics.evaluationMetrics.completionRate}%</div>
                <Progress value={analytics.evaluationMetrics.completionRate} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Health Score</CardTitle>
                <CardDescription>All evaluations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-bold">{analytics.evaluationMetrics.averageHealthScore}/100</div>
                <Progress value={analytics.evaluationMetrics.averageHealthScore} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Metrics</CardTitle>
                <CardDescription>Monthly recurring revenue</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-bold">{formatCurrency(analytics.subscriptionMetrics.monthlyRecurringRevenue)}</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Conversion Rate</span>
                    <Badge variant="default">{analytics.subscriptionMetrics.conversionRate}%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Churn Rate</span>
                    <Badge variant={analytics.subscriptionMetrics.churnRate < 5 ? 'default' : 'destructive'}>
                      {analytics.subscriptionMetrics.churnRate}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Distribution</CardTitle>
                <CardDescription>User tiers breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Free</span>
                    <Badge variant="secondary">{formatNumber(analytics.subscriptionMetrics.freeUsers)}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Premium</span>
                    <Badge variant="default">{formatNumber(analytics.subscriptionMetrics.premiumUsers)}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Enterprise</span>
                    <Badge variant="outline">{formatNumber(analytics.subscriptionMetrics.enterpriseUsers)}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
                <CardDescription>Key subscription metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Paid Users</span>
                    <Badge variant="default">
                      {formatNumber(analytics.subscriptionMetrics.premiumUsers + analytics.subscriptionMetrics.enterpriseUsers)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid Rate</span>
                    <Badge variant="outline">
                      {(((analytics.subscriptionMetrics.premiumUsers + analytics.subscriptionMetrics.enterpriseUsers) / analytics.userMetrics.totalUsers) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>System Uptime</CardTitle>
                <CardDescription>Service availability</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={`text-3xl font-bold ${getHealthColor(analytics.systemHealth.uptime)}`}>
                  {analytics.systemHealth.uptime}%
                </div>
                <Progress value={analytics.systemHealth.uptime} />
                <Badge variant={getHealthBadge(analytics.systemHealth.uptime)}>
                  {analytics.systemHealth.uptime >= 99.9 ? 'Excellent' : analytics.systemHealth.uptime >= 99 ? 'Good' : 'Needs Attention'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time</CardTitle>
                <CardDescription>Average API response</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-bold">{analytics.systemHealth.responseTime}ms</div>
                <Badge variant={analytics.systemHealth.responseTime < 300 ? 'default' : analytics.systemHealth.responseTime < 500 ? 'secondary' : 'destructive'}>
                  {analytics.systemHealth.responseTime < 300 ? 'Fast' : analytics.systemHealth.responseTime < 500 ? 'Acceptable' : 'Slow'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Rate</CardTitle>
                <CardDescription>System errors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={`text-3xl font-bold ${getHealthColor(analytics.systemHealth.errorRate, true)}`}>
                  {analytics.systemHealth.errorRate}%
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Active Errors</span>
                    <Badge variant={analytics.systemHealth.activeErrors < 5 ? 'outline' : 'destructive'}>
                      {analytics.systemHealth.activeErrors}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Storage</CardTitle>
                <CardDescription>Disk usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-bold">{analytics.systemHealth.diskUsage}%</div>
                <Progress value={analytics.systemHealth.diskUsage} />
                <Badge variant={analytics.systemHealth.diskUsage < 80 ? 'default' : analytics.systemHealth.diskUsage < 90 ? 'secondary' : 'destructive'}>
                  {analytics.systemHealth.diskUsage < 80 ? 'Healthy' : analytics.systemHealth.diskUsage < 90 ? 'Monitor' : 'Critical'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Last Backup</CardTitle>
                <CardDescription>Database backup status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    {new Date(analytics.systemHealth.lastBackup).toLocaleDateString()}
                  </span>
                </div>
                <Badge variant="default">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}