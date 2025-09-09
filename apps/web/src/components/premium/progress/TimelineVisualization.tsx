'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Award,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Camera,
  Link as LinkIcon
} from 'lucide-react'

interface TimelineItem {
  id: string
  title: string
  category: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED'
  completedAt: Date | null
  timeInvested: number
  moneyInvested: number
  evidence: any[]
  valueImpact: any | null
  milestones: any[]
  aiValidationScore: number | null
}

interface TimelineVisualizationProps {
  userId: string
}

export function TimelineVisualization({ userId }: TimelineVisualizationProps) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    loadTimeline()
  }, [userId])

  const loadTimeline = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/progress/timeline?userId=${userId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load timeline')
      }

      setTimeline(data.timeline)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load timeline'
      setError(errorMessage)
      console.error('Error loading timeline:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200'
      case 'VERIFIED': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'VERIFIED':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'IN_PROGRESS':
        return <Clock className="h-5 w-5 text-yellow-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'photo': return <Camera className="h-3 w-3" />
      case 'document': return <FileText className="h-3 w-3" />
      case 'url': return <LinkIcon className="h-3 w-3" />
      default: return <FileText className="h-3 w-3" />
    }
  }

  const categories = ['all', ...Array.from(new Set(timeline.map(item => item.category)))]
  const filteredTimeline = selectedCategory === 'all' 
    ? timeline 
    : timeline.filter(item => item.category === selectedCategory)

  const completedItems = timeline.filter(item => 
    item.status === 'COMPLETED' || item.status === 'VERIFIED'
  )

  const totalTimeInvested = completedItems.reduce((sum, item) => sum + item.timeInvested, 0)
  const totalMoneyInvested = completedItems.reduce((sum, item) => sum + item.moneyInvested, 0)
  const totalValueImpact = completedItems
    .filter(item => item.valueImpact)
    .reduce((sum, item) => sum + (item.valueImpact?.valuationIncrease || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading timeline...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{completedItems.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{totalTimeInvested}h</p>
                <p className="text-sm text-muted-foreground">Time Invested</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">${totalMoneyInvested}</p>
                <p className="text-sm text-muted-foreground">Money Invested</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">${Math.round(totalValueImpact).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Value Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category === 'all' ? 'All Categories' : category}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Progress Timeline</span>
          </CardTitle>
          <CardDescription>
            Track your improvement implementation journey over time
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {filteredTimeline.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No progress yet</h3>
              <p className="text-gray-600">
                {selectedCategory === 'all' 
                  ? 'Complete some improvement steps to see your progress timeline.'
                  : `No progress found for ${selectedCategory} category.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredTimeline.map((item, index) => (
                <div key={item.id} className="relative">
                  {/* Timeline connector line */}
                  {index < filteredTimeline.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200" />
                  )}
                  
                  <div className="flex items-start space-x-4">
                    {/* Timeline dot */}
                    <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-white border-2 border-gray-200">
                      {getStatusIcon(item.status)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={getStatusColor(item.status)}>
                                {item.status.toLowerCase().replace('_', ' ')}
                              </Badge>
                              <Badge variant="outline">
                                {item.category}
                              </Badge>
                              {item.aiValidationScore && (
                                <Badge variant="outline" className="text-blue-600">
                                  {Math.round(item.aiValidationScore * 100)}% validated
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {item.completedAt && (
                            <div className="text-right text-sm text-muted-foreground">
                              <div>{new Date(item.completedAt).toLocaleDateString()}</div>
                              <div>{new Date(item.completedAt).toLocaleTimeString()}</div>
                            </div>
                          )}
                        </div>

                        {/* Investment & Impact */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{item.timeInvested}h invested</span>
                          </div>
                          
                          {item.moneyInvested > 0 && (
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <DollarSign className="h-4 w-4" />
                              <span>${item.moneyInvested} spent</span>
                            </div>
                          )}
                          
                          {item.valueImpact && (
                            <div className="flex items-center space-x-2 text-sm text-green-600">
                              <TrendingUp className="h-4 w-4" />
                              <span>+${Math.round(item.valueImpact.valuationIncrease).toLocaleString()} value</span>
                            </div>
                          )}
                        </div>

                        {/* Evidence */}
                        {item.evidence.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium mb-2">Evidence ({item.evidence.length})</h4>
                            <div className="flex flex-wrap gap-2">
                              {item.evidence.slice(0, 3).map((evidence: any, evidenceIndex: number) => (
                                <div key={evidenceIndex} className="flex items-center space-x-1 text-xs bg-gray-100 px-2 py-1 rounded">
                                  {getEvidenceIcon(evidence.type)}
                                  <span>{evidence.type}</span>
                                </div>
                              ))}
                              {item.evidence.length > 3 && (
                                <div className="text-xs text-muted-foreground px-2 py-1">
                                  +{item.evidence.length - 3} more
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Milestones */}
                        {item.milestones.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <Award className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm text-muted-foreground">
                              {item.milestones.length} milestone{item.milestones.length > 1 ? 's' : ''} achieved
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default TimelineVisualization