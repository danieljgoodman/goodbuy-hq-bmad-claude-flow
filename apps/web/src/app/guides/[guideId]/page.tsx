'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { GuideViewer } from '@/components/premium/guides/GuideViewer'
import { useAuth } from '@/lib/hooks/useAuth'
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface ImplementationGuide {
  id: string
  title: string
  description: string
  industry: string
  steps: GuideStep[]
  estimatedDuration: number
  difficultyLevel: string
  resourceRequirements: any
  templates: any[]
  businessContext: any
  version: number
  generatedAt: string
}

interface GuideStep {
  id: string
  stepNumber: number
  title: string
  description: string
  estimatedTime: number
  difficulty: string
  resources: any[]
  tips: any[]
  commonPitfalls: any[]
  successMetrics: any[]
  completed: boolean
  completedAt?: string
}

export default function GuideDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [guide, setGuide] = useState<ImplementationGuide | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id && params.guideId) {
      loadGuide()
    }
  }, [user?.id, params.guideId])

  const loadGuide = async () => {
    if (!user?.id || !params.guideId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/guides/${params.guideId}?userId=${user.id}`)
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Guide not found')
        }
        if (response.status === 403) {
          throw new Error('You do not have access to this guide')
        }
        throw new Error(data.error || 'Failed to load guide')
      }

      setGuide(data.guide)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load guide'
      setError(errorMessage)
      console.error('Error loading guide:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStepToggle = (stepId: string, completed: boolean) => {
    if (!guide) return

    setGuide(prev => {
      if (!prev) return prev
      
      return {
        ...prev,
        steps: prev.steps.map(step => 
          step.id === stepId 
            ? { 
                ...step, 
                completed,
                completedAt: completed ? new Date().toISOString() : undefined
              }
            : step
        )
      }
    })
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-600">Please sign in to access this guide.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-3 text-lg">Loading guide...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/guides">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Guides
            </Button>
          </Link>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="mt-6 text-center">
          <Button onClick={loadGuide}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!guide) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/guides">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Guides
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Guide not found</h3>
            <p className="text-gray-600">
              The guide you're looking for doesn't exist or has been deleted.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navigation */}
      <div className="mb-6">
        <Link href="/guides" as any>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Guides
          </Button>
        </Link>
      </div>

      {/* Guide Content */}
      <GuideViewer
        guide={guide}
        userId={user.id}
        onStepToggle={handleStepToggle}
      />

      {/* Actions */}
      <div className="mt-8 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date(guide.generatedAt).toLocaleDateString()}
        </div>
        
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => {
              window.print()
            }}
          >
            Print Guide
          </Button>
          
          <Button
            onClick={() => {
              const guideData = {
                title: guide.title,
                description: guide.description,
                steps: guide.steps,
                resources: guide.templates
              }
              const blob = new Blob([JSON.stringify(guideData, null, 2)], {
                type: 'application/json'
              })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${guide.title.replace(/\s+/g, '_')}_guide.json`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
            }}
          >
            Export Guide
          </Button>
        </div>
      </div>
    </div>
  )
}