'use client'

import { Eye, FileText, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { BusinessEvaluation } from '@/types'

interface RecentEvaluationsProps {
  evaluations?: BusinessEvaluation[]
  onViewEvaluation?: (id: string) => void
  onViewAllEvaluations?: () => void
  className?: string
}

export default function RecentEvaluations({
  evaluations = [],
  onViewEvaluation,
  onViewAllEvaluations,
  className = ""
}: RecentEvaluationsProps) {
  // Get the 4 most recent evaluations
  const recentEvaluations = evaluations
    .filter(evaluation => evaluation.status === 'completed')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4)

  // Helper function to get days ago
  const getDaysAgo = (date: Date) => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`
  }

  // Helper function to get evaluation title (mockup uses Q1, Q2, Q3 format)
  const getEvaluationTitle = (evaluation: BusinessEvaluation, index: number) => {
    // Try to extract quarter info from date or use sequential numbering
    const quarter = `Q${(index % 4) + 1}`
    return `${quarter} Business Review`
  }

  // Helper function to get score color (using brand colors)
  const getScoreColor = (score: number) => {
    return 'bg-primary/10 text-primary border-primary/20'
  }

  if (recentEvaluations.length === 0) {
    return (
      <Card className={`border-border ${className}`}>
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-xl font-semibold text-foreground">
                Recent Evaluations
              </CardTitle>
            </div>
            {onViewAllEvaluations && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onViewAllEvaluations}
                className="text-primary hover:text-primary/80 hover:bg-primary/10"
              >
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No completed evaluations yet</p>
            <p className="text-muted-foreground/60 text-xs">Your recent business reviews will appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-border ${className}`}>
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-xl font-semibold text-foreground">
              Recent Evaluations
            </CardTitle>
          </div>
          {onViewAllEvaluations && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onViewAllEvaluations}
              className="text-primary hover:text-primary/80 hover:bg-primary/10"
            >
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {recentEvaluations.map((evaluation, index) => (
            <div 
              key={evaluation.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-muted-foreground/20 hover:bg-muted/30 transition-all cursor-pointer group"
              onClick={() => onViewEvaluation?.(evaluation.id)}
            >
              <div className="flex items-center gap-4">
                {/* Document Icon */}
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                
                {/* Evaluation Info */}
                <div className="flex-1">
                  <h3 className="font-medium text-foreground mb-1">
                    {getEvaluationTitle(evaluation, index)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Completed {getDaysAgo(new Date(evaluation.createdAt))}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Score Badge */}
                <Badge 
                  variant="secondary" 
                  className={`${getScoreColor(evaluation.healthScore)} font-semibold px-3 py-1`}
                >
                  {evaluation.healthScore}
                </Badge>
                
                {/* View Icon */}
                <Eye className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}