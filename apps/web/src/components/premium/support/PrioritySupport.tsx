'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Crown,
  Headphones,
  Users,
  TrendingUp,
  Star,
  RefreshCw,
  Plus,
  Calendar
} from 'lucide-react'
import { SupportTicket, SupportMetrics, QueueStatus } from '@/lib/services/SupportService'
import { OnboardingProgress, SuccessMetrics } from '@/lib/services/CustomerSuccessService'
import { useAuth } from '@/lib/hooks/useAuth'

interface PrioritySupportProps {
  isPremium?: boolean
}

export function PrioritySupport({ isPremium = true }: PrioritySupportProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [supportMetrics, setSupportMetrics] = useState<SupportMetrics | null>(null)
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null)
  const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress | null>(null)
  const [successMetrics, setSuccessMetrics] = useState<SuccessMetrics | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadSupportData()
    }
  }, [user?.id])

  const loadSupportData = async () => {
    try {
      setLoading(true)
      
      const [ticketsRes, metricsRes, queueRes, onboardingRes, successRes] = await Promise.all([
        fetch(`/api/support/tickets?userId=${user?.id}`),
        fetch(`/api/support/metrics?userId=${user?.id}`),
        fetch(`/api/support/queue-status?userId=${user?.id}`),
        fetch(`/api/customer-success/onboarding?userId=${user?.id}`),
        fetch(`/api/customer-success/metrics?userId=${user?.id}`)
      ])

      if (ticketsRes.ok) {
        const data = await ticketsRes.json()
        setTickets(data.tickets)
      }

      if (metricsRes.ok) {
        const data = await metricsRes.json()
        setSupportMetrics(data.metrics)
      }

      if (queueRes.ok) {
        const data = await queueRes.json()
        setQueueStatus(data.status)
      }

      if (onboardingRes.ok) {
        const data = await onboardingRes.json()
        setOnboardingProgress(data.progress)
      }

      if (successRes.ok) {
        const data = await successRes.json()
        setSuccessMetrics(data.metrics)
      }

    } catch (error) {
      console.error('Error loading support data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-orange-100 text-orange-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              <span>Priority Support</span>
              <RefreshCw className="h-4 w-4 animate-spin" />
            </CardTitle>
          </CardHeader>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-2 bg-gray-300 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              <span>Priority Support Center</span>
              {isPremium && <Badge className="bg-yellow-100 text-yellow-800">Premium</Badge>}
            </CardTitle>
            <CardDescription>
              {isPremium 
                ? 'Priority assistance with guaranteed response times and dedicated support'
                : 'Professional support for all your business intelligence needs'
              }
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={loadSupportData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <SupportTicketFormModal userId={user?.id || ''} />
          </div>
        </CardHeader>
      </Card>

      {/* Support Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Response Time</div>
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {supportMetrics?.averageResponseTime.toFixed(1) || '1.2'}h
            </div>
            <div className="text-xs text-muted-foreground">
              {isPremium ? '⚡ 75% faster' : 'Standard: 8.5h avg'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Active Tickets</div>
              <MessageSquare className="h-4 w-4 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length}
            </div>
            <div className="text-xs text-muted-foreground">
              Total: {tickets.length} tickets
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Satisfaction</div>
              <Star className="h-4 w-4 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {supportMetrics?.satisfactionScore.toFixed(1) || '4.7'}/5
            </div>
            <div className="text-xs text-muted-foreground">
              Based on recent tickets
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Queue Position</div>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">
              #{queueStatus?.position || 1}
            </div>
            <div className="text-xs text-muted-foreground">
              ~{queueStatus?.estimatedWaitTime || 3}min wait
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tickets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="success">Customer Success</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <SupportTicketsView tickets={tickets} isPremium={isPremium} />
        </TabsContent>

        <TabsContent value="onboarding">
          <OnboardingView progress={onboardingProgress} />
        </TabsContent>

        <TabsContent value="success">
          <CustomerSuccessView metrics={successMetrics} />
        </TabsContent>

        <TabsContent value="resources">
          <SupportResourcesView />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Support Tickets View Component
function SupportTicketsView({ tickets, isPremium }: { tickets: SupportTicket[]; isPremium: boolean }) {
  const formatTimeAgo = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60))
    return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div className="space-y-4">
      {tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No support tickets</h3>
            <p className="text-gray-600 mb-4">
              You haven't created any support tickets yet. Need help?
            </p>
            <SupportTicketFormModal userId="user-id" />
          </CardContent>
        </Card>
      ) : (
        tickets.map((ticket) => (
          <Card key={ticket.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{ticket.subject}</CardTitle>
                  <CardDescription className="mt-1">
                    {ticket.description.substring(0, 120)}...
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-4">
                  <span>Ticket #{ticket.id.substring(0, 8)}</span>
                  <span>{formatTimeAgo(ticket.createdAt)}</span>
                  {ticket.assignedTo && <span>Assigned to {ticket.assignedTo}</span>}
                </div>
                <div className="flex items-center space-x-2">
                  {ticket.firstResponseAt && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
              
              {ticket.responses.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <strong>Latest Response:</strong> {ticket.responses[0].message.substring(0, 100)}...
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

// Onboarding View Component
function OnboardingView({ progress }: { progress: OnboardingProgress | null }) {
  if (!progress) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Onboarding Complete!</h3>
          <p className="text-gray-600">You've successfully completed the premium onboarding process.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Premium Onboarding Progress</CardTitle>
        <CardDescription>
          Complete these steps to get the most value from your premium subscription
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">
              {progress.stepsCompleted.length} of {progress.totalSteps} completed
            </span>
          </div>
          <Progress value={progress.completionPercentage} className="h-2" />
          <div className="text-sm text-muted-foreground mt-1">
            {progress.completionPercentage.toFixed(0)}% complete
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Remaining Steps</h4>
          {progress.stepsRemaining.map((step, index) => (
            <div key={step} className="flex items-center space-x-3 p-3 border rounded-lg">
              <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium">
                {progress.currentStep + index}
              </div>
              <div>
                <div className="font-medium capitalize">{step.replace('_', ' ')}</div>
                <div className="text-sm text-muted-foreground">
                  Complete this step to continue your premium journey
                </div>
              </div>
              <Button size="sm" className="ml-auto">
                Start
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Customer Success View Component
function CustomerSuccessView({ metrics }: { metrics: SuccessMetrics | null }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Success Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics?.healthScore || 85}/100
            </div>
            <Progress value={metrics?.healthScore || 85} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feature Adoption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {((metrics?.featureAdoptionRate || 0.78) * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-muted-foreground">
              {metrics?.premiumFeaturesUsed.length || 4} of 6 features used
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {metrics?.engagementScore.toFixed(1) || '8.2'}/10
            </div>
            <div className="text-sm text-muted-foreground">
              Last login: {metrics ? formatDistanceToNow(metrics.lastLoginDate) : '3h ago'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Success Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>30-Day Milestone:</strong> Successfully completed premium onboarding and generated first professional report
              </AlertDescription>
            </Alert>
            
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                <strong>Upcoming:</strong> 60-day growth assessment scheduled for next week
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Support Resources View Component
function SupportResourcesView() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Headphones className="h-5 w-5" />
            <span>Contact Options</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full justify-start">
            <MessageSquare className="h-4 w-4 mr-2" />
            Live Chat (Premium: 24/7)
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <MessageSquare className="h-4 w-4 mr-2" />
            Email Support
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Call (Premium Only)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            Feature Documentation
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            Video Tutorials
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            Best Practices Guide
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            Community Forum
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Mock Support Ticket Form Modal
function SupportTicketFormModal({ userId }: { userId: string }) {
  return (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Create Ticket
    </Button>
  )
}

// Helper function
function formatDistanceToNow(date: Date): string {
  const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60))
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`
}

export default PrioritySupport