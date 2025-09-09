'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Upload, 
  FileText,
  Camera,
  Link as LinkIcon,
  AlertCircle,
  Trophy,
  TrendingUp,
  Target
} from 'lucide-react'

interface ProgressTrackerProps {
  userId: string
  stepId: string
  guideId: string
  stepTitle: string
  stepDescription: string
  improvementCategory: string
  onProgressComplete?: (progressEntry: any) => void
}

interface EvidenceItem {
  type: 'photo' | 'document' | 'url' | 'text'
  content: string
  description?: string
  uploadedAt: Date
}

export function ProgressTracker({
  userId,
  stepId,
  guideId,
  stepTitle,
  stepDescription,
  improvementCategory,
  onProgressComplete
}: ProgressTrackerProps) {
  const [isCompleting, setIsCompleting] = useState(false)
  const [notes, setNotes] = useState('')
  const [timeInvested, setTimeInvested] = useState<number>(0)
  const [moneyInvested, setMoneyInvested] = useState<number>(0)
  const [evidence, setEvidence] = useState<EvidenceItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [newEvidenceType, setNewEvidenceType] = useState<'photo' | 'document' | 'url' | 'text'>('text')
  const [newEvidenceContent, setNewEvidenceContent] = useState('')
  const [newEvidenceDescription, setNewEvidenceDescription] = useState('')

  const addEvidence = () => {
    if (!newEvidenceContent.trim()) return

    const newEvidence: EvidenceItem = {
      type: newEvidenceType,
      content: newEvidenceContent.trim(),
      description: newEvidenceDescription.trim() || undefined,
      uploadedAt: new Date()
    }

    setEvidence(prev => [...prev, newEvidence])
    setNewEvidenceContent('')
    setNewEvidenceDescription('')
  }

  const removeEvidence = (index: number) => {
    setEvidence(prev => prev.filter((_, i) => i !== index))
  }

  const handleCompleteStep = async () => {
    if (timeInvested <= 0) {
      setError('Please enter the time you invested in this step')
      return
    }

    setIsCompleting(true)
    setError(null)

    try {
      const response = await fetch('/api/progress/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          stepId,
          guideId,
          improvementCategory,
          notes: notes.trim() || undefined,
          timeInvested,
          moneyInvested,
          evidence: evidence.map(e => ({
            ...e,
            uploadedAt: e.uploadedAt.toISOString()
          }))
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete step')
      }

      setSuccess(true)
      onProgressComplete?.(data.progressEntry)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete step'
      setError(errorMessage)
      console.error('Error completing step:', err)
    } finally {
      setIsCompleting(false)
    }
  }

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'photo': return <Camera className="h-4 w-4" />
      case 'document': return <FileText className="h-4 w-4" />
      case 'url': return <LinkIcon className="h-4 w-4" />
      case 'text': return <FileText className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-800">Step Completed!</h3>
              <p className="text-sm text-green-600">
                Your progress has been recorded and is being analyzed for value impact.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center space-x-2 text-green-700">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{timeInvested} hours invested</span>
            </div>
            {moneyInvested > 0 && (
              <div className="flex items-center space-x-2 text-green-700">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">${moneyInvested} invested</span>
              </div>
            )}
            <div className="flex items-center space-x-2 text-green-700">
              <Trophy className="h-4 w-4" />
              <span className="text-sm">{evidence.length} evidence items</span>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={() => setSuccess(false)}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              Add More Evidence
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-blue-600" />
          <span>Complete Step: {stepTitle}</span>
        </CardTitle>
        <CardDescription>
          {stepDescription}
        </CardDescription>
        <Badge className="w-fit">{improvementCategory}</Badge>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Investment Tracking */}
        <div className="space-y-4">
          <h3 className="font-medium">Investment Tracking</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Time Invested (hours) *
              </label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={timeInvested || ''}
                onChange={(e) => setTimeInvested(parseFloat(e.target.value) || 0)}
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Money Invested ($)
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={moneyInvested || ''}
                onChange={(e) => setMoneyInvested(parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Evidence Collection */}
        <div className="space-y-4">
          <h3 className="font-medium">Evidence & Documentation</h3>
          <p className="text-sm text-muted-foreground">
            Provide evidence of your implementation to increase validation confidence.
          </p>
          
          {/* Add Evidence */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
              <select
                value={newEvidenceType}
                onChange={(e) => setNewEvidenceType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="text">Text Description</option>
                <option value="url">Website/URL</option>
                <option value="photo">Photo</option>
                <option value="document">Document</option>
              </select>
              
              <div className="md:col-span-2">
                <Input
                  placeholder={
                    newEvidenceType === 'url' ? 'https://...' : 
                    newEvidenceType === 'photo' ? 'Photo URL or description' :
                    newEvidenceType === 'document' ? 'Document name or URL' :
                    'Describe what you implemented...'
                  }
                  value={newEvidenceContent}
                  onChange={(e) => setNewEvidenceContent(e.target.value)}
                />
              </div>
              
              <Button onClick={addEvidence} size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            
            <Input
              placeholder="Optional: Add description..."
              value={newEvidenceDescription}
              onChange={(e) => setNewEvidenceDescription(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Evidence List */}
          {evidence.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Evidence Items ({evidence.length})</h4>
              {evidence.map((item, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg bg-white">
                  <div className="flex-shrink-0 mt-0.5">
                    {getEvidenceIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {item.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {item.uploadedAt.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 break-words">{item.content}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEvidence(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Additional Notes
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional context, challenges faced, or observations..."
            rows={3}
          />
        </div>

        {/* Summary */}
        {(timeInvested > 0 || evidence.length > 0) && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Completion Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2 text-blue-700">
                <Clock className="h-4 w-4" />
                <span>{timeInvested} hours</span>
              </div>
              {moneyInvested > 0 && (
                <div className="flex items-center space-x-2 text-blue-700">
                  <DollarSign className="h-4 w-4" />
                  <span>${moneyInvested}</span>
                </div>
              )}
              <div className="flex items-center space-x-2 text-blue-700">
                <FileText className="h-4 w-4" />
                <span>{evidence.length} evidence items</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            onClick={handleCompleteStep}
            disabled={isCompleting || timeInvested <= 0}
            className="flex items-center space-x-2"
          >
            {isCompleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Completing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Complete Step</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default ProgressTracker