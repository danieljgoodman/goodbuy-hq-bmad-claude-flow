'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Crown, Target, AlertCircle, CheckCircle2, Clock, Star } from 'lucide-react'
import ProgressTracker from '@/components/premium/progress/ProgressTracker'
import { TimelineVisualization } from '@/components/premium/progress/TimelineVisualization'
import { GuideViewer } from '@/components/premium/guides/GuideViewer'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'

export default function ProgressTracking() {
  const { user } = useAuth()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [guides, setGuides] = useState<any[]>([])
  const [guidesLoading, setGuidesLoading] = useState(true)
  const [evaluations, setEvaluations] = useState<any[]>([])
  const [evaluationsLoading, setEvaluationsLoading] = useState(true)
  const [basicImplementations, setBasicImplementations] = useState<any[]>([])
  const [isClient, setIsClient] = useState(false)
  const [selectedImplementation, setSelectedImplementation] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showProgressTracker, setShowProgressTracker] = useState(false)
  const [selectedStep, setSelectedStep] = useState<any>(null)
  const [showFullGuide, setShowFullGuide] = useState(false)
  const [selectedGuide, setSelectedGuide] = useState<any>(null)

  const checkAccess = async () => {
    if (!user?.id) return
    
    try {
      const response = await fetch('/api/premium/check-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          featureType: 'progress_tracking',
          requiredTier: 'PREMIUM'
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        setHasAccess(result.hasAccess)
        
        // If user has access, also load their guides and evaluations
        if (result.hasAccess) {
          await Promise.all([loadGuides(), loadEvaluations()])
        }
      } else {
        setHasAccess(false)
      }
    } catch (error) {
      console.error('Error checking access:', error)
      setHasAccess(false)
    }
  }

  const loadGuides = async () => {
    if (!user?.id) return
    
    try {
      setGuidesLoading(true)
      const response = await fetch(`/api/guides?userId=${user.id}`)
      
      if (response.ok) {
        const guidesData = await response.json()
        setGuides(guidesData.guides || [])
      } else {
        console.error('Failed to load guides')
        setGuides([])
      }
    } catch (error) {
      console.error('Error loading guides:', error)
      setGuides([])
    } finally {
      setGuidesLoading(false)
    }
  }

  const loadEvaluations = async () => {
    if (!user?.id) return
    
    try {
      setEvaluationsLoading(true)
      const response = await fetch(`/api/evaluations?userId=${user.id}`)
      
      if (response.ok) {
        const evalData = await response.json()
        setEvaluations(evalData.evaluations || [])
      } else {
        console.error('Failed to load evaluations')
        setEvaluations([])
      }
    } catch (error) {
      console.error('Error loading evaluations:', error)
      setEvaluations([])
    } finally {
      setEvaluationsLoading(false)
    }
  }

  const loadBasicImplementations = () => {
    console.log('🔍 loadBasicImplementations called')
    // Load basic implementations from localStorage
    const stored = localStorage.getItem('implementations')
    console.log('🔍 localStorage contains:', stored)
    if (stored) {
      try {
        const implementations = JSON.parse(stored)
        console.log('🔍 Parsed implementations:', implementations)
        setBasicImplementations(implementations)
        console.log('🔍 Set basicImplementations state to:', implementations)
      } catch (error) {
        console.error('Error parsing stored implementations:', error)
        setBasicImplementations([])
      }
    } else {
      console.log('🔍 No implementations found in localStorage')
      setBasicImplementations([])
    }
  }

  const openImplementationDetails = (implementation: any) => {
    console.log('🔍 Opening implementation details for:', implementation.title)
    setSelectedImplementation(implementation)
    setShowDetailsModal(true)
  }

  const editImplementation = (implementation: any) => {
    console.log('✏️ Editing implementation:', implementation.title)
    // Use the existing ProgressTracker component for step completion
    if (implementation.detailedSteps && implementation.detailedSteps.length > 0) {
      setSelectedStep({
        id: implementation.id + '-step-1',
        title: implementation.detailedSteps[0] || 'Continue Implementation',
        description: `Next step for ${implementation.title}`,
        implementation
      })
      setShowProgressTracker(true)
    } else {
      // For basic implementations, show a simple progress update
      alert(`Update Progress: ${implementation.title}\n\nThis will open the premium progress tracker with:\n• Step completion tracking\n• Photo evidence upload\n• Time & money investment logging\n• ROI calculations`)
    }
  }

  const transformImplementationToGuide = (implementation: any) => {
    const steps = implementation.detailedSteps?.map((step: string, idx: number) => ({
      id: `${implementation.id}-step-${idx + 1}`,
      stepNumber: idx + 1,
      title: step,
      description: `Complete ${step.toLowerCase()} for ${implementation.title}`,
      estimatedTime: 60, // 1 hour per step as default
      difficulty: implementation.difficulty || 'Medium',
      resources: [`${step} template`, `${step} checklist`],
      tips: [`Focus on ${step.toLowerCase()} best practices`, `Document your progress regularly`],
      commonPitfalls: [`Rushing through ${step.toLowerCase()}`, `Not getting stakeholder buy-in`],
      successMetrics: [`${step} completed successfully`, `Quality standards met`],
      completed: false,
      completedAt: null
    })) || []

    return {
      id: implementation.id,
      title: `${implementation.title} - Full Implementation Guide`,
      description: implementation.description,
      industry: 'General',
      steps,
      estimatedDuration: Math.ceil(steps.length * 1), // 1 hour per step
      difficultyLevel: implementation.difficulty?.toUpperCase() || 'INTERMEDIATE',
      resourceRequirements: {
        budget: 10000,
        team: implementation.difficulty === 'high' ? '4-6' : '2-4',
        timeline: implementation.timeline
      },
      templates: [
        { 
          name: `${implementation.title} Implementation Template`, 
          type: 'Document'
        }
      ],
      businessContext: {},
      version: 1,
      generatedAt: new Date().toISOString()
    }
  }

  const viewFullGuide = (implementation: any) => {
    console.log('📖 Viewing full guide for:', implementation.title)
    const transformedGuide = transformImplementationToGuide(implementation)
    setSelectedGuide(transformedGuide)
    setShowFullGuide(true)
  }

  useEffect(() => {
    setIsClient(true)
    if (user?.id) {
      checkAccess()
    }
  }, [user?.id])

  useEffect(() => {
    console.log('🔍 useEffect triggered, isClient:', isClient)
    if (isClient) {
      loadBasicImplementations()
    }
  }, [isClient])

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-600">Please sign in to access progress tracking.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (hasAccess === false) {
    return (
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Progress Tracking
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Monitor your business improvement initiatives and track their impact on your valuation over time
          </p>
        </div>

        {/* Basic Implementations */}
        {isClient && basicImplementations.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Active Implementations</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {basicImplementations.map((implementation, index) => (
                <Card key={index} className={implementation.isPremiumGuide ? "border-2 border-primary" : ""}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {implementation.title}
                      {implementation.isPremiumGuide && (
                        <Crown className="h-4 w-4 text-amber-500" />
                      )}
                    </CardTitle>
                    <CardDescription>
                      Started {new Date(implementation.startedAt).toLocaleDateString()} • {implementation.difficulty} difficulty
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {implementation.description}
                    </p>
                    
                    {implementation.isPremiumGuide && implementation.detailedSteps && (
                      <div className="mb-3">
                        <h4 className="font-semibold text-sm mb-2">Implementation Steps:</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {implementation.detailedSteps.slice(0, 3).map((step, idx) => (
                            <li key={idx}>• {step}</li>
                          ))}
                          {implementation.detailedSteps.length > 3 && (
                            <li>• ... and {implementation.detailedSteps.length - 3} more steps</li>
                          )}
                        </ul>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={implementation.isPremiumGuide ? "bg-amber-50 text-amber-700" : ""}>
                        {implementation.type} plan
                        {implementation.isPremiumGuide && " ✨"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Timeline: {implementation.timeline}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : isClient ? (
          <Card className="mb-8">
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Implementations</h3>
              <p className="text-gray-600 mb-4">
                Start implementing business improvements from your evaluation results
              </p>
              <Link href="/dashboard">
                <Button>View Your Evaluations</Button>
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {/* Upgrade Notice for Premium Features */}
        <Card className="mb-8 border-amber-200 bg-amber-50">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center">
              <Crown className="h-5 w-5 text-amber-600 mr-3" />
              <div>
                <h3 className="font-semibold text-amber-900">Upgrade for Advanced Tracking</h3>
                <p className="text-amber-700">Get AI-powered guides and detailed ROI analysis</p>
              </div>
            </div>
            <Link href="/subscription">
              <Button className="bg-amber-600 hover:bg-amber-700">
                Upgrade Now
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Feature Benefits */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>ROI Measurement</CardTitle>
              <CardDescription>
                Track the financial impact of each improvement initiative
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                See exactly how each change affects your business valuation with detailed ROI analysis and impact measurements.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline Management</CardTitle>
              <CardDescription>
                Set milestones and track completion timelines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Organize your improvement initiatives with clear timelines, milestones, and automated progress tracking.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-muted rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Start tracking your progress today</h2>
          <p className="text-muted-foreground mb-6">
            Turn insights into action and measure real business impact
          </p>
          <div className="space-x-4">
            <Link href="/subscription">
              <Button size="lg">
                Upgrade to Professional
              </Button>
            </Link>
            <Link href="/support">
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Premium content - user has access, show guides or prompt to generate them
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center space-x-2">
          <Target className="h-8 w-8" />
          <span>Progress Tracking</span>
          <Crown className="h-6 w-6 text-yellow-600" />
        </h1>
        <p className="text-lg text-muted-foreground">
          Monitor your business improvement initiatives and track their impact over time
        </p>
      </div>

      {guidesLoading ? (
        <Card className="mb-8">
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your implementation guides...</p>
          </CardContent>
        </Card>
      ) : (console.log('🔍 Render check - guides.length:', guides.length, 'isClient:', isClient, 'basicImplementations.length:', basicImplementations.length), guides.length > 0 || (isClient && basicImplementations.length > 0)) ? (
        <div className="space-y-6">
          {/* Server-based guides */}
          {guides.length > 0 && (
            <>
              <h2 className="text-2xl font-bold">Your Implementation Guides</h2>
              {guides.map((guide) => (
                <Card key={guide.id} className="mb-4">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{guide.title}</span>
                      <Badge variant="outline">
                        {guide.steps?.filter((s: any) => s.completed).length || 0} / {guide.steps?.length || 0} completed
                      </Badge>
                    </CardTitle>
                    <CardDescription>{guide.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {guide.steps?.slice(0, 3).map((step: any) => (
                        <div key={step.id} className={`flex items-center space-x-3 p-3 rounded-lg border ${
                          step.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            step.completed ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                          }`}>
                            {step.stepNumber}
                          </div>
                          <span className={step.completed ? 'line-through text-gray-500' : 'text-gray-900'}>
                            {step.title}
                          </span>
                          {step.completed && <span className="text-green-600 text-sm">✓</span>}
                        </div>
                      ))}
                      {(guide.steps?.length || 0) > 3 && (
                        <p className="text-sm text-muted-foreground text-center">
                          +{(guide.steps?.length || 0) - 3} more steps
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Button size="sm">Continue Progress</Button>
                      <Button variant="outline" size="sm">View Details</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          {/* LocalStorage-based implementations */}
          {isClient && basicImplementations.length > 0 && (
            <>
              <h2 className="text-2xl font-semibold mb-4">Your Active Implementations</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {basicImplementations.map((implementation, index) => (
                  <Card key={index} className={implementation.isPremiumGuide ? "border-2 border-primary" : ""}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {implementation.title}
                        {implementation.isPremiumGuide && (
                          <Crown className="h-4 w-4 text-amber-500" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        Started {new Date(implementation.startedAt).toLocaleDateString()} • {implementation.difficulty} difficulty
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        {implementation.description}
                      </p>
                      
                      {implementation.isPremiumGuide && implementation.detailedSteps && (
                        <div className="mb-3">
                          <h4 className="font-semibold text-sm mb-2">Implementation Steps:</h4>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {implementation.detailedSteps.slice(0, 3).map((step, idx) => (
                              <li key={idx}>• {step}</li>
                            ))}
                            {implementation.detailedSteps.length > 3 && (
                              <li>• ... and {implementation.detailedSteps.length - 3} more steps</li>
                            )}
                          </ul>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="outline" className={implementation.isPremiumGuide ? "bg-amber-50 text-amber-700" : ""}>
                          {implementation.type} plan
                          {implementation.isPremiumGuide && " ✨"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Timeline: {implementation.timeline}
                        </span>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => openImplementationDetails(implementation)}
                        >
                          View Progress
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => editImplementation(implementation)}
                        >
                          Update Progress
                        </Button>
                        {implementation.isPremiumGuide && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => viewFullGuide(implementation)}
                          >
                            Full Guide
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <Card className="mb-8">
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Implementation Guides Yet</h3>
            <p className="text-gray-600 mb-6">
              Generate implementation guides from your evaluation opportunities to start tracking progress.
            </p>
            
            {evaluationsLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-4"></div>
            ) : evaluations.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You have {evaluations.filter(e => e.status === 'completed').length} completed evaluation{evaluations.filter(e => e.status === 'completed').length !== 1 ? 's' : ''} with improvement opportunities.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/evaluations">
                    <Button>
                      View Evaluations & Generate Guides
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline">
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You need to complete a business evaluation first to identify improvement opportunities.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/onboarding">
                    <Button>
                      Start Business Evaluation
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline">
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Implementation Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedImplementation?.isPremiumGuide && (
                <Crown className="h-5 w-5 text-amber-500" />
              )}
              {selectedImplementation?.title}
            </DialogTitle>
            <DialogDescription>
              Started {selectedImplementation?.startedAt ? new Date(selectedImplementation.startedAt).toLocaleDateString() : 'Unknown'} • 
              {selectedImplementation?.difficulty} difficulty • 
              {selectedImplementation?.type} plan
            </DialogDescription>
          </DialogHeader>
          
          {selectedImplementation && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{selectedImplementation.description}</p>
              </div>

              {/* Timeline */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Timeline
                  </h3>
                  <p className="text-muted-foreground">{selectedImplementation.timeline}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Progress
                  </h3>
                  <Progress value={20} className="mb-2" />
                  <p className="text-sm text-muted-foreground">20% Complete (Demo)</p>
                </div>
              </div>

              {/* Implementation Steps */}
              {selectedImplementation.detailedSteps && (
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Implementation Steps
                  </h3>
                  <div className="space-y-3">
                    {selectedImplementation.detailedSteps.map((step: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${idx === 0 ? 'line-through text-muted-foreground' : ''}`}>
                            {step}
                          </p>
                          {idx === 0 && (
                            <p className="text-xs text-green-600 mt-1">✓ Completed</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => editImplementation(selectedImplementation)}>
                  Update Progress
                </Button>
                <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                  Close
                </Button>
                {selectedImplementation.isPremiumGuide && (
                  <Button variant="outline">
                    Export Report
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Progress Tracker Modal */}
      <Dialog open={showProgressTracker} onOpenChange={setShowProgressTracker}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Step Progress Tracker</DialogTitle>
            <DialogDescription>
              Track your implementation progress with evidence and ROI monitoring
            </DialogDescription>
          </DialogHeader>
          
          {selectedStep && user?.id && (
            <ProgressTracker
              userId={user.id}
              stepId={selectedStep.id}
              guideId={selectedStep.implementation?.id || 'basic'}
              stepTitle={selectedStep.title}
              stepDescription={selectedStep.description}
              improvementCategory={selectedStep.implementation?.type || 'general'}
              onProgressComplete={(progressEntry) => {
                console.log('✅ Step completed:', progressEntry)
                setShowProgressTracker(false)
                // Reload implementations to show updated progress
                if (isClient) {
                  loadBasicImplementations()
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Full Guide Modal */}
      <Dialog open={showFullGuide} onOpenChange={setShowFullGuide}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Full Implementation Guide
            </DialogTitle>
            <DialogDescription>
              Comprehensive step-by-step implementation guide with interactive tracking
            </DialogDescription>
          </DialogHeader>
          
          {selectedGuide && user?.id && (
            <GuideViewer
              guide={selectedGuide}
              userId={user.id}
              onStepToggle={(stepId, completed) => {
                console.log('Step toggled:', stepId, completed)
                // Update the step completion in the guide
                setSelectedGuide((prev: any) => ({
                  ...prev,
                  steps: prev.steps.map((step: any) => 
                    step.id === stepId 
                      ? { ...step, completed, completedAt: completed ? new Date().toISOString() : null }
                      : step
                  )
                }))
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Timeline Visualization for Premium Users */}
      {hasAccess && user?.id && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Implementation Timeline
              </CardTitle>
              <CardDescription>
                Visual timeline of your business improvement journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TimelineVisualization userId={user.id} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}