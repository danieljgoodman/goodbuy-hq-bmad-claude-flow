'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import { DateRange } from 'react-day-picker'

interface UserBehaviorData {
  events: {
    event_name: string
    count: number
    unique_users: number
    conversion_rate?: number
  }[]
  funnels: {
    funnel_name: string
    steps: {
      step_name: string
      users_count: number
      conversion_rate: number
    }[]
    overall_conversion: number
  }[]
  features: {
    feature: string
    usage_count: number
    unique_users: number
    adoption_rate: number
  }[]
  cohorts: {
    cohort_date: string
    cohort_size: number
    retention_rates: Record<string, number>
  }[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function UserBehaviorDashboard() {
  const [data, setData] = useState<UserBehaviorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  })
  const [selectedFunnel, setSelectedFunnel] = useState<string>('registration')

  useEffect(() => {
    fetchUserBehaviorData()
  }, [dateRange])

  const fetchUserBehaviorData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (dateRange?.from) params.append('start_date', dateRange.from.toISOString())
      if (dateRange?.to) params.append('end_date', dateRange.to.toISOString())

      const [eventsRes, funnelsRes, featuresRes] = await Promise.all([
        fetch(`/api/analytics/events?${params}`),
        fetch(`/api/analytics/funnels?${params}`),
        fetch(`/api/analytics/features?${params}`)
      ])

      // Mock data for demo purposes since APIs might not be fully connected
      const mockData: UserBehaviorData = {
        events: [
          { event_name: 'page_view', count: 15420, unique_users: 3240 },
          { event_name: 'button_click', count: 8950, unique_users: 2100 },
          { event_name: 'form_submit', count: 2340, unique_users: 890 },
          { event_name: 'evaluation_start', count: 1230, unique_users: 650 },
          { event_name: 'subscription_created', count: 450, unique_users: 450 },
        ],
        funnels: [
          {
            funnel_name: 'registration',
            overall_conversion: 12.5,
            steps: [
              { step_name: 'Landing Page', users_count: 5000, conversion_rate: 100 },
              { step_name: 'Sign Up Click', users_count: 2500, conversion_rate: 50 },
              { step_name: 'Form View', users_count: 2000, conversion_rate: 80 },
              { step_name: 'Form Submit', users_count: 1500, conversion_rate: 75 },
              { step_name: 'Registration Complete', users_count: 625, conversion_rate: 41.7 }
            ]
          }
        ],
        features: [
          { feature: 'Business Evaluation', usage_count: 3240, unique_users: 890, adoption_rate: 45.2 },
          { feature: 'Analytics Dashboard', usage_count: 2950, unique_users: 1200, adoption_rate: 68.4 },
          { feature: 'Market Intelligence', usage_count: 1850, unique_users: 560, adoption_rate: 28.9 },
          { feature: 'Help System', usage_count: 1420, unique_users: 420, adoption_rate: 21.6 },
        ],
        cohorts: [
          { cohort_date: '2024-01', cohort_size: 100, retention_rates: { month_1: 85, month_3: 65, month_6: 45 } },
          { cohort_date: '2024-02', cohort_size: 150, retention_rates: { month_1: 88, month_3: 68, month_6: 48 } },
          { cohort_date: '2024-03', cohort_size: 200, retention_rates: { month_1: 90, month_3: 72, month_6: 52 } },
        ]
      }

      setData(mockData)
    } catch (error) {
      console.error('Failed to fetch user behavior data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading user behavior analytics...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Failed to load analytics data</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Behavior Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights into user interactions and engagement patterns</p>
        </div>
        <div className="flex gap-4 items-center">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
          />
          <Button onClick={fetchUserBehaviorData}>Refresh</Button>
        </div>
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="funnels">Funnels</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Events</CardTitle>
                <CardDescription>Most frequently triggered user events</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.events}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="event_name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Event Distribution</CardTitle>
                <CardDescription>Breakdown of event types by volume</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.events}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ event_name, percent }) => `${event_name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.events.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Event Metrics</CardTitle>
              <CardDescription>Detailed breakdown of user engagement by event type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.events.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{event.event_name.replace('_', ' ').toUpperCase()}</h3>
                      <p className="text-sm text-muted-foreground">
                        {event.count.toLocaleString()} total events
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{event.unique_users.toLocaleString()} users</Badge>
                      {event.conversion_rate && (
                        <p className="text-sm mt-1">{event.conversion_rate}% conversion</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnels" className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={selectedFunnel} onValueChange={setSelectedFunnel}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select funnel" />
              </SelectTrigger>
              <SelectContent>
                {data.funnels.map((funnel) => (
                  <SelectItem key={funnel.funnel_name} value={funnel.funnel_name}>
                    {funnel.funnel_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {data.funnels.map((funnel) => (
            <Card key={funnel.funnel_name}>
              <CardHeader>
                <CardTitle>
                  {funnel.funnel_name} Funnel
                  <Badge className="ml-2">{funnel.overall_conversion}% conversion</Badge>
                </CardTitle>
                <CardDescription>User progression through conversion steps</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={funnel.steps}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="step_name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="users_count" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
                
                <div className="mt-4 space-y-2">
                  {funnel.steps.map((step, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span>{step.step_name}</span>
                      <div className="flex items-center gap-2">
                        <Badge>{step.users_count.toLocaleString()} users</Badge>
                        <Badge variant="outline">{step.conversion_rate.toFixed(1)}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Feature Usage</CardTitle>
                <CardDescription>Usage metrics by feature</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.features}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="feature" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="usage_count" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Adoption Rates</CardTitle>
                <CardDescription>Feature adoption by unique users</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.features}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="feature" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="adoption_rate" fill="#FFBB28" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Feature Metrics</CardTitle>
              <CardDescription>Detailed feature usage statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.features.map((feature, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{feature.feature}</h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.usage_count.toLocaleString()} total uses
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge>{feature.unique_users.toLocaleString()} users</Badge>
                      <p className="text-sm mt-1">{feature.adoption_rate.toFixed(1)}% adoption</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cohorts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Retention</CardTitle>
              <CardDescription>User retention rates by registration cohort</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 p-2 text-left">Cohort</th>
                      <th className="border border-gray-200 p-2 text-center">Size</th>
                      <th className="border border-gray-200 p-2 text-center">1 Month</th>
                      <th className="border border-gray-200 p-2 text-center">3 Months</th>
                      <th className="border border-gray-200 p-2 text-center">6 Months</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.cohorts.map((cohort, index) => (
                      <tr key={index}>
                        <td className="border border-gray-200 p-2 font-medium">{cohort.cohort_date}</td>
                        <td className="border border-gray-200 p-2 text-center">{cohort.cohort_size}</td>
                        <td className="border border-gray-200 p-2 text-center">
                          <Badge variant="secondary">{cohort.retention_rates.month_1}%</Badge>
                        </td>
                        <td className="border border-gray-200 p-2 text-center">
                          <Badge variant="secondary">{cohort.retention_rates.month_3}%</Badge>
                        </td>
                        <td className="border border-gray-200 p-2 text-center">
                          <Badge variant="secondary">{cohort.retention_rates.month_6}%</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}