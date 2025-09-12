'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ProtectedRoute from '@/components/auth/protected-route'
import ValuationResults from '@/components/evaluation/valuation-results'
import HealthScore from '@/components/evaluation/health-score'
import OpportunitiesList from '@/components/evaluation/opportunities-list'
import { UnifiedResultsDashboard } from '@/components/evaluation/unified-results-dashboard'
import { useEvaluationStore } from '@/stores/evaluation-store'
import { useAuthStore } from '@/stores/auth-store'
import { PremiumAccessService } from '@/lib/services/PremiumAccessService'
import type { BusinessEvaluation } from '@/types'

export default function EvaluationResultsPage() {
  const params = useParams()
  const evaluationId = params.id as string
  
  // Force component refresh timestamp: 2025-09-08-7:33pm
  console.log('🔄 EvaluationResultsPage loaded with NEW save logic - v2.1')
  const { evaluations, loadEvaluations, saveEvaluation } = useEvaluationStore()
  const { user } = useAuthStore()
  const userId = user?.id
  const [evaluation, setEvaluation] = useState<BusinessEvaluation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false)
  const [premiumCheckLoading, setPremiumCheckLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  
  // Detect evaluation type (Epic 1 vs Epic 2)
  const isEpic2Evaluation = (evaluation: BusinessEvaluation) => {
    // Epic 2 evaluation detection based on enhanced features
    return !!(
      evaluation.businessData?.extractedFinancials ||  // Has document extracted data
      evaluation.businessData?.documentQualityScore ||  // Has document quality score
      evaluation.businessData?.lastDocumentUpdate ||    // Has document update timestamp
      evaluation.valuations?.industryAdjustments?.length > 0 || // Has industry adjustments
      evaluation.scoringFactors?.growth  // Has enhanced growth scoring (Epic 2 specific)
    )
  }

  // Save evaluation and navigate to dashboard
  const handleSaveAndReturn = async () => {
    if (!evaluation || !userId) return
    
    console.log('🚀 SAVE BUTTON CLICKED - New save logic v2 activated!')
    console.log('📊 Evaluation to save:', { id: evaluation.id, status: evaluation.status, userId })
    
    setIsSaving(true)
    try {
      await saveEvaluation({
        ...evaluation,
        userId,
        createdAt: evaluation.createdAt || new Date(),
        updatedAt: new Date()
      })
      
      console.log('✅ Save successful, navigating to dashboard...')
      // Navigate to dashboard after successful save
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('❌ Save failed:', error)
      // Still navigate on error - evaluation data is already processed
      window.location.href = '/dashboard'
    } finally {
      setIsSaving(false)
    }
  }

  // Fix hydration issues by ensuring we're on the client
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const findEvaluation = async () => {
      setIsLoading(true)
      
      // First try to find in store
      let foundEvaluation = evaluations.find(evaluation => evaluation.id === evaluationId)
      
      if (!foundEvaluation) {
        // Load evaluations if not already loaded
        if (evaluations.length === 0) {
          await loadEvaluations()
          foundEvaluation = evaluations.find(evaluation => evaluation.id === evaluationId)
        }
        
        // If still not found, try to fetch directly from API
        if (!foundEvaluation) {
          try {
            const { EvaluationService } = await import('@/lib/services/evaluation-service')
            const result = await EvaluationService.getEvaluation(evaluationId)
            foundEvaluation = result as unknown as BusinessEvaluation | undefined
          } catch (error) {
            console.error('Failed to fetch evaluation:', error)
          }
        }
      }

      setEvaluation(foundEvaluation || null)
      setIsLoading(false)
    }

    findEvaluation()
  }, [evaluationId, evaluations, loadEvaluations])

  // Check premium access for implementation guides (client-side only to avoid hydration issues)
  useEffect(() => {
    const checkPremiumAccess = async () => {
      if (!userId || !isClient) {
        setHasPremiumAccess(false)
        setPremiumCheckLoading(false)
        return
      }

      try {
        setPremiumCheckLoading(true)
        const accessCheck = await PremiumAccessService.checkAIFeatureAccess(userId)
        console.log('🔍 Premium access check result:', accessCheck)
        setHasPremiumAccess(accessCheck.hasAccess)
      } catch (error) {
        console.error('Failed to check premium access:', error)
        // Fallback to false on error (current behavior)
        setHasPremiumAccess(false)
      } finally {
        setPremiumCheckLoading(false)
      }
    }

    checkPremiumAccess()
  }, [userId, isClient])

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-background to-secondary pt-20 pb-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your evaluation results...</p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!evaluation) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-background to-secondary pt-20 pb-8">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-4">Evaluation Not Found</h1>
              <p className="text-muted-foreground mb-8">
                The evaluation you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
              </p>
              <a 
                href="/dashboard"
                className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Return to Dashboard
              </a>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Business Evaluation Results
            </h1>
            <p className="text-lg text-muted-foreground">
              Comprehensive AI-powered analysis of your business
            </p>
          </div>

          {/* Main Content - Conditional based on evaluation type */}
          {isEpic2Evaluation(evaluation) ? (
            // Epic 2: Enhanced Results Dashboard
            <UnifiedResultsDashboard 
              evaluation={evaluation}
              documentResults={evaluation.uploadedDocuments || []}
              businessName={'Your Business'}
              onExport={() => console.log('Export report')}
              onShare={() => console.log('Share results')}
            />
          ) : (
            // Epic 1: Classic Results Layout
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Left Column - Health Score */}
              <div className="lg:col-span-1">
                <HealthScore 
                  score={evaluation.healthScore}
                  confidenceScore={evaluation.confidenceScore}
                  scoringFactors={evaluation.scoringFactors}
                />
              </div>

              {/* Right Column - Results and Opportunities */}
              <div className="lg:col-span-2 space-y-8">
                <ValuationResults evaluation={evaluation} />
                <OpportunitiesList 
                  opportunities={evaluation.opportunities}
                  showImplementationGuides={isClient && hasPremiumAccess}
                  evaluationId={evaluation.id}
                  businessContext={{
                    businessName: evaluation.businessData.businessName || 'Your Business',
                    industry: evaluation.businessData.industry || 'General',
                    size: evaluation.businessData.size || 'Medium',
                    currentRevenue: evaluation.businessData.currentRevenue,
                  }}
                />
                
                {/* Debug info */}
                {process.env.NODE_ENV === 'development' && isClient && (
                  <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs text-gray-600">
                    <strong>Debug Info:</strong><br/>
                    - isClient: {String(isClient)}<br/>
                    - hasPremiumAccess: {String(hasPremiumAccess)}<br/>
                    - premiumCheckLoading: {String(premiumCheckLoading)}<br/>
                    - opportunities count: {evaluation.opportunities?.length || 0}<br/>
                    - userId: {userId}<br/>
                    - evaluationId: {evaluation.id}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons at Bottom */}
          <div className="mt-12 text-center">
            <div className="inline-flex space-x-4">
              <button
                onClick={handleSaveAndReturn}
                disabled={isSaving}
                className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                    Saving...
                  </>
                ) : (
                  'Return to Dashboard'
                )}
              </button>
              <a 
                href="/onboarding"
                className="px-6 py-3 border border-input bg-background hover:bg-accent rounded-lg"
              >
                New Evaluation
              </a>
            </div>
          </div>

        </div>
      </div>
    </ProtectedRoute>
  )
}