'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Wand2, 
  Clock, 
  TrendingUp, 
  Users, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'

interface ImprovementOpportunity {
  id: string
  title: string
  description: string
  category: string
  potentialImpact: number
  difficulty: 'low' | 'medium' | 'high'
  timelineEstimate: string
  confidence: number
}

interface GuideGeneratorProps {
  userId: string
  evaluationId: string
  opportunities: ImprovementOpportunity[]
  businessContext: {
    businessName: string
    industry: string
    size: string
    currentRevenue?: number
    goals?: string[]
  }
  onGuideGenerated?: (guide: any) => void
}

export function GuideGenerator({
  userId,
  evaluationId,
  opportunities,
  businessContext,
  onGuideGenerated
}: GuideGeneratorProps) {
  const [selectedOpportunity, setSelectedOpportunity] = useState<ImprovementOpportunity | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedGuide, setGeneratedGuide] = useState<any>(null)

  const handleGenerateGuide = async () => {
    if (!selectedOpportunity) return

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/guides/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          evaluationId,
          improvementCategory: selectedOpportunity.category,
          businessContext,
          improvementOpportunity: selectedOpportunity,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate guide')
      }

      setGeneratedGuide(data.guide)
      onGuideGenerated?.(data.guide)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate guide'
      setError(errorMessage)
      console.error('Error generating guide:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getImpactColor = (impact: number) => {
    if (impact >= 50000) return 'text-green-600'
    if (impact >= 25000) return 'text-yellow-600'
    return 'text-blue-600'
  }

  if (generatedGuide) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <CardTitle>Implementation Guide Generated!</CardTitle>
          </div>
          <CardDescription>
            Your AI-powered implementation guide is ready
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">{generatedGuide.title}</h3>
            <p className="text-sm text-green-700 mb-3">{generatedGuide.description}</p>
            
            <div className="flex items-center space-x-4 text-sm text-green-600">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{generatedGuide.estimatedDuration} hours</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{generatedGuide.steps.length} steps</span>
              </div>
              <Badge variant="secondary" className={getDifficultyColor(generatedGuide.difficultyLevel.toLowerCase())}>
                {generatedGuide.difficultyLevel}
              </Badge>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button onClick={() => window.location.href = `/guides/${generatedGuide.id}`}>
              View Full Guide
            </Button>
            <Button variant="outline" onClick={() => {
              setGeneratedGuide(null)
              setSelectedOpportunity(null)
            }}>
              Generate Another
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wand2 className="h-5 w-5" />
            <span>AI Implementation Guide Generator</span>
          </CardTitle>
          <CardDescription>
            Generate detailed, step-by-step implementation guides for your business improvement opportunities
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-3">Select an Improvement Opportunity:</h3>
              <div className="grid grid-cols-1 gap-4">
                {opportunities.map((opportunity) => (
                  <Card
                    key={opportunity.id}
                    className={`cursor-pointer transition-colors ${
                      selectedOpportunity?.id === opportunity.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedOpportunity(opportunity)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium mb-2">{opportunity.title}</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            {opportunity.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4" />
                              <span className={getImpactColor(opportunity.potentialImpact)}>
                                ${opportunity.potentialImpact.toLocaleString()} impact
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{opportunity.timelineEstimate}</span>
                            </div>
                            
                            <Badge className={getDifficultyColor(opportunity.difficulty)}>
                              {opportunity.difficulty} difficulty
                            </Badge>
                            
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="h-4 w-4" />
                              <span>{Math.round(opportunity.confidence * 100)}% confidence</span>
                            </div>
                          </div>
                        </div>
                        
                        {selectedOpportunity?.id === opportunity.id && (
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 ml-3" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {selectedOpportunity && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Selected Opportunity</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Generate a comprehensive implementation guide for: <strong>{selectedOpportunity.title}</strong>
                </p>
                <p className="text-xs text-blue-600">
                  The guide will include step-by-step instructions, templates, best practices, 
                  and industry-specific recommendations tailored to your {businessContext.industry.toLowerCase()} business.
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleGenerateGuide}
                disabled={!selectedOpportunity || isGenerating}
                className="flex items-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating Guide...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    <span>Generate Implementation Guide</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default GuideGenerator