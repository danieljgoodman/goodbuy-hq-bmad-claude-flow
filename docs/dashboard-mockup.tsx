'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Shield, 
  DollarSign,
  BarChart3,
  Eye,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  ChevronRight,
  Star
} from 'lucide-react'

/**
 * IMPROVED DASHBOARD MOCKUP
 * 
 * Key improvements implemented:
 * ✅ Enhanced visual hierarchy with health score emphasis
 * ✅ Better KPI card design with micro-trends
 * ✅ Improved mobile responsiveness (2x2 grid on mobile)
 * ✅ Progressive disclosure with smart defaults
 * ✅ Clear call-to-action placement
 * ✅ Better color coding and visual feedback
 * ✅ Accessibility improvements (proper contrast, touch targets)
 */

interface DashboardMockupProps {
  metrics?: {
    businessValuation: number
    healthScore: number
    growthRate: number
    riskLevel: 'low' | 'medium' | 'high'
    totalEvaluations: number
    lastUpdated: Date
  }
  evaluations?: any[]
}

export default function DashboardMockup({ metrics, evaluations = [] }: DashboardMockupProps) {
  const [showAdvancedCharts, setShowAdvancedCharts] = useState(true) // Smart default: show if user has data
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d')
  
  // Mock data for demonstration
  const mockMetrics = metrics || {
    businessValuation: 2850000,
    healthScore: 82,
    growthRate: 15.3,
    riskLevel: 'low' as const,
    totalEvaluations: 5,
    lastUpdated: new Date()
  }

  const healthScoreColor = 
    mockMetrics.healthScore >= 80 ? 'text-green-600' :
    mockMetrics.healthScore >= 60 ? 'text-yellow-600' : 
    'text-red-600'

  const healthScoreBg = 
    mockMetrics.healthScore >= 80 ? 'bg-green-50 dark:bg-green-950' :
    mockMetrics.healthScore >= 60 ? 'bg-yellow-50 dark:bg-yellow-950' : 
    'bg-red-50 dark:bg-red-950'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl space-y-8">
        
        {/* IMPROVED HEADER - Better Visual Hierarchy */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                Business Dashboard
              </h1>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                Live
              </Badge>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
              Real-time insights into your business performance and growth trajectory
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Activity className="h-4 w-4" />
              <span>Last updated: {mockMetrics.lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
          
          {/* IMPROVED ACTIONS - Better Visual Emphasis */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button size="lg" className="h-12 px-8 bg-blue-600 hover:bg-blue-700 shadow-lg">
              <Plus className="h-5 w-5 mr-2" />
              New Evaluation
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-6">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* IMPROVED KPI CARDS - Enhanced Visual Design */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          
          {/* HEALTH SCORE - Primary Emphasis */}
          <Card className={`relative overflow-hidden border-2 ${healthScoreBg} border-opacity-20`}>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 dark:to-white/5" />
            <CardHeader className="relative pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Health Score
                <Info className="h-3 w-3 text-slate-400 cursor-help" title="Overall business health indicator" />
              </CardTitle>
            </CardHeader>
            <CardContent className="relative pt-0 space-y-3">
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold ${healthScoreColor}`}>
                  {mockMetrics.healthScore}
                </span>
                <span className="text-sm text-slate-500">/100</span>
              </div>
              
              {/* Mini progress bar */}
              <Progress value={mockMetrics.healthScore} className="h-2" />
              
              {/* Micro trend visualization */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-600 font-medium">+5.2%</span>
                </div>
                <div className="w-12 h-6 flex items-end gap-px">
                  {[65, 70, 75, 78, 82].map((val, i) => (
                    <div 
                      key={i} 
                      className="bg-green-200 dark:bg-green-800 flex-1"
                      style={{ height: `${(val/100) * 24}px` }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BUSINESS VALUATION */}
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Business Value
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">
                  ${(mockMetrics.businessValuation / 1000000).toFixed(1)}M
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm">
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span className="text-green-600 font-medium">+{mockMetrics.growthRate}%</span>
                </div>
                <div className="w-12 h-6 flex items-end gap-px">
                  {[2.1, 2.3, 2.5, 2.7, 2.85].map((val, i) => (
                    <div 
                      key={i} 
                      className="bg-blue-200 dark:bg-blue-800 flex-1"
                      style={{ height: `${(val/3) * 24}px` }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GROWTH RATE */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Growth Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-green-600">
                  +{mockMetrics.growthRate}%
                </span>
                <span className="text-sm text-slate-500">30d</span>
              </div>
              
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Strong Growth
                </Badge>
                <div className="w-12 h-6 flex items-end gap-px">
                  {[8.2, 10.1, 12.5, 14.8, 15.3].map((val, i) => (
                    <div 
                      key={i} 
                      className="bg-green-200 dark:bg-green-800 flex-1"
                      style={{ height: `${(val/20) * 24}px` }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RISK ASSESSMENT */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Risk Level
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold capitalize text-green-600">
                  {mockMetrics.riskLevel}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Minimal Risk
                </Badge>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <Star 
                      key={val} 
                      className={`h-3 w-3 ${val <= 4 ? 'text-green-400 fill-current' : 'text-slate-300'}`} 
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PROGRESSIVE DISCLOSURE - Smart Defaults */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* MAIN CHARTS SECTION - Auto-expanded if user has data */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => setShowAdvancedCharts(!showAdvancedCharts)}>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Performance Analytics
                    </CardTitle>
                    <CardDescription>
                      Detailed business metrics and trends over time
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    {showAdvancedCharts ? 'Collapse' : 'Expand'}
                  </Button>
                </div>
              </CardHeader>
              
              {showAdvancedCharts && (
                <CardContent className="space-y-6">
                  {/* TIME FRAME SELECTOR */}
                  <Tabs value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="7d">7 Days</TabsTrigger>
                      <TabsTrigger value="30d">30 Days</TabsTrigger>
                      <TabsTrigger value="90d">90 Days</TabsTrigger>
                      <TabsTrigger value="1y">1 Year</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value={selectedTimeframe} className="space-y-4">
                      {/* PLACEHOLDER FOR ACTUAL CHARTS */}
                      <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-lg flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <BarChart3 className="h-12 w-12 text-blue-400 mx-auto" />
                          <p className="text-slate-600 dark:text-slate-300 font-medium">Interactive Charts</p>
                          <p className="text-sm text-slate-500">Valuation trends, health metrics, and performance indicators</p>
                        </div>
                      </div>
                      
                      {/* QUICK INSIGHTS */}
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">127%</div>
                          <div className="text-sm text-slate-500">vs Industry Avg</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">$890K</div>
                          <div className="text-sm text-slate-500">Revenue Growth</div>
                        </div>
                        <div className="text-center lg:block hidden">
                          <div className="text-2xl font-bold text-purple-600">94%</div>
                          <div className="text-sm text-slate-500">Customer Sat.</div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              )}
            </Card>

            {/* EVALUATION HISTORY - Improved Layout */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Recent Evaluations
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockMetrics.totalEvaluations > 0 ? (
                    // Mock evaluation items with better visual design
                    [1, 2, 3].map((item) => (
                      <div key={item} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <BarChart3 className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">Q{item} Business Review</div>
                            <div className="text-sm text-slate-500">Completed 2 days ago</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Score: {85 - item * 2}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      No evaluations yet. Create your first one to get started!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SIDEBAR - Activity & Quick Actions */}
          <div className="space-y-6">
            
            {/* QUICK ACTIONS */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start h-12" variant="outline">
                  <Plus className="h-4 w-4 mr-3" />
                  Create Evaluation
                </Button>
                <Button className="w-full justify-start h-12" variant="outline">
                  <TrendingUp className="h-4 w-4 mr-3" />
                  View Analytics
                </Button>
                <Button className="w-full justify-start h-12" variant="outline">
                  <Activity className="h-4 w-4 mr-3" />
                  Export Data
                </Button>
              </CardContent>
            </Card>

            {/* ACTIVITY FEED */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: 'evaluation', message: 'New evaluation completed', time: '2 hours ago', icon: BarChart3 },
                    { type: 'growth', message: 'Health score improved by 5%', time: '1 day ago', icon: TrendingUp },
                    { type: 'milestone', message: 'Reached $3M valuation', time: '3 days ago', icon: DollarSign }
                  ].map((activity, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                        <activity.icon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-slate-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* INSIGHTS PANEL */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
                  💡 AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <p>Your health score is 12% above industry average</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                    <p>Revenue growth is accelerating (+15% this quarter)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                    <p>Consider expanding market reach in Q4</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}