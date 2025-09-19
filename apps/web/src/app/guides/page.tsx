'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen, 
  Clock, 
  TrendingUp, 
  Users,
  Plus,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Circle
} from 'lucide-react'
import { GuideGenerator } from '@/components/premium/guides/GuideGenerator'
import { TemplateManager } from '@/components/premium/guides/TemplateManager'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'

interface Guide {
  id: string
  title: string
  description: string
  industry: string
  status: 'draft' | 'active' | 'completed'
  progress: number
  estimatedDuration: number
  totalSteps: number
  completedSteps: number
  createdAt: string
  lastUpdatedAt: string
  category: string
  difficultyLevel: string
}

export default function GuidesPage() {
  const { user } = useAuth()
  const [guides, setGuides] = useState<Guide[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('my-guides')

  useEffect(() => {
    if (user?.id) {
      loadGuides()
    }
  }, [user?.id, loadGuides])

  const loadGuides = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const response = await fetch(`/api/guides?userId=${user.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load guides')
      }

      setGuides(data.guides)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load guides'
      setError(errorMessage)
      console.error('Error loading guides:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleGuideGenerated = (guide: any) => {
    setGuides(prev => [guide, ...prev])
    setActiveTab('my-guides')
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-600">Please sign in to access your implementation guides.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Implementation Guides</h1>
        <p className="text-lg text-muted-foreground">
          AI-powered step-by-step guides to implement your business improvements
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-guides">My Guides</TabsTrigger>
          <TabsTrigger value="generate">Generate New</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="my-guides" className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading guides...</span>
            </div>
          ) : guides.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guides.map((guide) => (
                <Card key={guide.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{guide.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {guide.description}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(guide.status)}>
                        {guide.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>{guide.industry}</span>
                      </span>
                      <Badge className={getDifficultyColor(guide.difficultyLevel)}>
                        {guide.difficultyLevel}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm text-muted-foreground">
                            {guide.completedSteps} of {guide.totalSteps} steps
                          </span>
                        </div>
                        <Progress value={guide.progress} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{guide.estimatedDuration}h total</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{guide.totalSteps} steps</span>
                        </span>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        <div>Created: {formatDate(guide.createdAt)}</div>
                        <div>Updated: {formatDate(guide.lastUpdatedAt)}</div>
                      </div>

                      <Link href={`/guides/${guide.id}`}>
                        <Button className="w-full">
                          {guide.status === 'completed' ? 'Review Guide' : 'Continue Guide'}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No guides yet</h3>
                <p className="text-gray-600 mb-6">
                  Generate your first AI-powered implementation guide to get started.
                </p>
                <Button onClick={() => setActiveTab('generate')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate First Guide
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="generate" className="space-y-6">
          <GuideGenerator
            userId={user.id}
            evaluationId="sample-eval-id" // This would come from context or props
            opportunities={[
              {
                id: '1',
                title: 'Improve Customer Retention',
                description: 'Implement strategies to reduce customer churn and increase lifetime value',
                category: 'Customer Success',
                potentialImpact: 50000,
                difficulty: 'medium',
                timelineEstimate: '3-6 months',
                confidence: 0.85
              },
              {
                id: '2',
                title: 'Optimize Pricing Strategy',
                description: 'Analyze and adjust pricing to maximize revenue and market positioning',
                category: 'Revenue',
                potentialImpact: 75000,
                difficulty: 'high',
                timelineEstimate: '2-4 months',
                confidence: 0.78
              }
            ]}
            businessContext={{
              businessName: 'Sample Business',
              industry: 'Technology',
              size: 'Small',
              currentRevenue: 500000,
              goals: ['Increase revenue', 'Improve efficiency']
            }}
            onGuideGenerated={handleGuideGenerated}
          />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <TemplateManager userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}