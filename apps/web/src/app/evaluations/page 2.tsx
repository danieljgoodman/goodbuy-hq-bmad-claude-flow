'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useEvaluationStore } from '@/stores/evaluation-store'
import { EvaluationService } from '@/lib/services/evaluation-service'
import ProtectedRoute from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  FileText, 
  Eye, 
  Trash2, 
  Plus, 
  Calendar,
  TrendingUp,
  ArrowLeft,
  Search,
  Filter
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { BusinessEvaluation } from '@/types'

interface EvaluationCardProps {
  evaluation: BusinessEvaluation
  onView: (id: string) => void
  onDelete: (id: string) => Promise<void>
  isDeleting?: boolean
}

function EvaluationCard({ evaluation, onView, onDelete, isDeleting }: EvaluationCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleDelete = async () => {
    if (showDeleteConfirm) {
      await onDelete(evaluation.id)
      setShowDeleteConfirm(false)
    } else {
      setShowDeleteConfirm(true)
    }
  }

  return (
    <Card className="border-border hover:border-muted-foreground/20 transition-all">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg font-semibold">
                Business Evaluation
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {formatDate(evaluation.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className={getStatusColor(evaluation.status)}
          >
            {evaluation.status.charAt(0).toUpperCase() + evaluation.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Health Score */}
          {evaluation.healthScore && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Health Score</span>
              <Badge 
                variant="secondary"
                className={`${getScoreColor(evaluation.healthScore)} font-semibold`}
              >
                {evaluation.healthScore}/100
              </Badge>
            </div>
          )}

          {/* Business Valuation */}
          {evaluation.valuations?.weighted && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Valuation</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-semibold">
                  ${typeof evaluation.valuations.weighted === 'object' && evaluation.valuations.weighted.value
                    ? evaluation.valuations.weighted.value.toLocaleString()
                    : typeof evaluation.valuations.weighted === 'number'
                    ? evaluation.valuations.weighted.toLocaleString()
                    : '0'
                  }
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onView(evaluation.id)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
            
            <Button 
              variant={showDeleteConfirm ? "destructive" : "outline"}
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3"
            >
              {isDeleting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>

          {showDeleteConfirm && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm">
              <p className="text-destructive font-medium mb-2">Delete this evaluation?</p>
              <p className="text-muted-foreground mb-3">This action cannot be undone.</p>
              <div className="flex gap-2">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  Delete
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function EvaluationsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="border-border">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5" />
                <div>
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function EvaluationsPage() {
  const { user } = useAuthStore()
  const { evaluations, loadEvaluations, isLoading } = useEvaluationStore()
  const router = useRouter()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all')
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user) {
      loadEvaluations(true).catch(error => {
        console.error('Failed to load evaluations:', error)
      })
    }
  }, [user, loadEvaluations])

  const handleViewEvaluation = (id: string) => {
    router.push(`/evaluation/${id}`)
  }

  const handleDeleteEvaluation = async (evaluationId: string) => {
    setDeletingIds(prev => new Set(prev).add(evaluationId))
    try {
      await EvaluationService.deleteEvaluation(evaluationId)
      await loadEvaluations(true)
    } catch (error) {
      console.error('Failed to delete evaluation:', error)
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(evaluationId)
        return newSet
      })
    }
  }

  // Filter evaluations based on search and status
  const filteredEvaluations = evaluations.filter(evaluation => {
    const matchesSearch = searchQuery === '' || 
      evaluation.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      new Date(evaluation.createdAt).toLocaleDateString().includes(searchQuery)
    
    const matchesStatus = statusFilter === 'all' || evaluation.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Sort by creation date (newest first)
  const sortedEvaluations = filteredEvaluations.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  All Evaluations
                </h1>
                <p className="text-muted-foreground">
                  View and manage your business evaluations
                </p>
              </div>
              
              <Button 
                onClick={() => router.push('/onboarding')}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Evaluation
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search evaluations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          {!isLoading && (
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                Showing {sortedEvaluations.length} of {evaluations.length} evaluation{evaluations.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Content */}
          {isLoading ? (
            <EvaluationsSkeleton />
          ) : sortedEvaluations.length === 0 ? (
            <Card className="border-border">
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery || statusFilter !== 'all' ? 'No evaluations found' : 'No evaluations yet'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Create your first business evaluation to get started'
                  }
                </p>
                {(!searchQuery && statusFilter === 'all') && (
                  <Button onClick={() => router.push('/onboarding')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Evaluation
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedEvaluations.map((evaluation) => (
                <EvaluationCard
                  key={evaluation.id}
                  evaluation={evaluation}
                  onView={handleViewEvaluation}
                  onDelete={handleDeleteEvaluation}
                  isDeleting={deletingIds.has(evaluation.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}