import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { BusinessEvaluation, DocumentProcessingResult, ExtractedFinancialData } from '@/types'
import { getCurrentUserId } from '@/lib/user-utils'

interface EvaluationState {
  currentEvaluation: Partial<BusinessEvaluation> | null
  evaluations: BusinessEvaluation[]
  isLoading: boolean
  currentStep: number
  totalSteps: number
  hasLoadedEvaluations: boolean
  
  // Epic 2: Document Intelligence State
  uploadedDocuments: DocumentProcessingResult[]
  isProcessingDocuments: boolean
  documentExtractionData: ExtractedFinancialData | null
  
  // Actions
  setCurrentEvaluation: (evaluation: Partial<BusinessEvaluation>) => void
  updateBusinessData: (data: Partial<BusinessEvaluation['businessData']>) => void
  saveProgress: () => Promise<void>
  submitEvaluation: () => Promise<BusinessEvaluation>
  loadEvaluations: (force?: boolean) => Promise<void>
  setCurrentStep: (step: number) => void
  reset: () => void
  
  // Epic 2: Document Actions
  addProcessedDocument: (document: DocumentProcessingResult) => void
  approveDocumentData: (data: ExtractedFinancialData) => void
  setProcessingDocuments: (isProcessing: boolean) => void
  
  // Epic 2: Enhanced Analysis Actions
  performEnhancedAnalysis: () => Promise<BusinessEvaluation>
  updateDocumentExtractedData: (data: ExtractedFinancialData) => void
}

export const useEvaluationStore = create<EvaluationState>()(
  devtools(
    (set, get) => ({
      currentEvaluation: null,
      evaluations: [],
      isLoading: false,
      currentStep: 1,
      totalSteps: 4,
      hasLoadedEvaluations: false,
      
      // Epic 2: Document Intelligence State
      uploadedDocuments: [],
      isProcessingDocuments: false,
      documentExtractionData: null,

      setCurrentEvaluation: (evaluation) => {
        set({ currentEvaluation: evaluation })
      },

      updateBusinessData: (data) => {
        const { currentEvaluation } = get()
        set({
          currentEvaluation: {
            ...currentEvaluation,
            businessData: {
              ...currentEvaluation?.businessData,
              ...data,
            } as any,
            updatedAt: new Date(),
          }
        })
      },

      saveProgress: async () => {
        const { currentEvaluation } = get()
        if (!currentEvaluation) return

        set({ isLoading: true })
        try {
          // Auto-save to local storage for now
          localStorage.setItem('business-evaluation-draft', JSON.stringify(currentEvaluation))
          
          // TODO: Save to database when API is ready
          console.log('Progress saved:', currentEvaluation)
        } catch (error) {
          console.error('Failed to save progress:', error)
        } finally {
          set({ isLoading: false })
        }
      },

      submitEvaluation: async () => {
        const { currentEvaluation } = get()
        if (!currentEvaluation?.businessData) throw new Error('No evaluation data to submit')

        set({ isLoading: true })
        try {
          // Import services dynamically to avoid SSR issues
          const { ClaudeService } = await import('@/lib/services/claude-service')
          const { EvaluationService } = await import('@/lib/services/evaluation-service')
          
          // Create evaluation in database first
          const userId = getCurrentUserId()
          console.log('🔍 SUBMIT EVALUATION DEBUG:')
          console.log('  - currentEvaluation.userId:', currentEvaluation.userId)
          console.log('  - currentEvaluation.businessData keys:', currentEvaluation.businessData ? Object.keys(currentEvaluation.businessData) : 'null')
          console.log('  - getCurrentUserId():', userId)
          console.log('  - Final userId to use (ALWAYS getCurrentUserId()):', userId)
          console.log('  - User ID consistency check:', currentEvaluation.userId === userId ? '✅ Match' : '⚠️ Different')
          
          // ALWAYS use current user ID - ignore any old stored userId
          const processingEvaluation = await EvaluationService.createEvaluation(
            {
              // Basic required properties
              businessType: currentEvaluation.businessData.businessType || 'LLC',
              industryFocus: currentEvaluation.businessData.industryFocus || 'General',
              yearsInBusiness: currentEvaluation.businessData.yearsInBusiness || 1,
              businessModel: currentEvaluation.businessData.businessModel || 'Direct Sales',
              revenueModel: currentEvaluation.businessData.revenueModel || 'Product Sales',
              annualRevenue: currentEvaluation.businessData.annualRevenue || 0,
              monthlyRecurring: currentEvaluation.businessData.monthlyRecurring || 0,
              expenses: currentEvaluation.businessData.expenses || 0,
              cashFlow: currentEvaluation.businessData.cashFlow || 0,
              assets: currentEvaluation.businessData.assets || 0,
              liabilities: currentEvaluation.businessData.liabilities || 0,
              customerCount: currentEvaluation.businessData.customerCount || 0,
              marketPosition: currentEvaluation.businessData.marketPosition || 'Unknown',
              grossMargin: currentEvaluation.businessData.grossMargin || 0,
              employeeCount: currentEvaluation.businessData.employeeCount || 1,
              competitiveAdvantages: currentEvaluation.businessData.competitiveAdvantages || [],
              primaryChannels: currentEvaluation.businessData.primaryChannels || []
            },
            userId
          )

          set(state => ({
            evaluations: [...state.evaluations, processingEvaluation as unknown as BusinessEvaluation],
            currentEvaluation: null,
            currentStep: 1,
          }))

          // Run AI analysis
          try {
            const analysis = await ClaudeService.analyzeBusinessHealth(currentEvaluation.businessData)
            
            // Calculate basic valuations
            const revenue = currentEvaluation.businessData.annualRevenue
            const netProfit = revenue - currentEvaluation.businessData.expenses
            const netWorth = currentEvaluation.businessData.assets - currentEvaluation.businessData.liabilities
            
            // Simple valuation estimates (backwards compatibility)
            const assetBasedValue = Math.max(netWorth, 0)
            const incomeBasedValue = Math.max(netProfit * 5, 0) // 5x earnings multiple
            const marketBasedValue = Math.max(revenue * 1.5, 0) // 1.5x revenue multiple
            const weightedValue = (assetBasedValue + incomeBasedValue * 2 + marketBasedValue) / 4

            const completedEvaluation: BusinessEvaluation = {
              ...processingEvaluation,
              valuations: {
                assetBased: {
                  value: assetBasedValue,
                  confidence: 75,
                  methodology: 'Net asset value',
                  factors: ['Assets', 'Liabilities']
                },
                incomeBased: {
                  value: incomeBasedValue,
                  confidence: 80,
                  methodology: 'Earnings multiple',
                  multiple: 5,
                  factors: ['Net profit', 'Industry standards']
                },
                marketBased: {
                  value: marketBasedValue,
                  confidence: 70,
                  methodology: 'Revenue multiple',
                  comparables: [],
                  factors: ['Revenue', 'Market conditions']
                },
                weighted: {
                  value: weightedValue,
                  confidence: 85,
                  methodology: 'Weighted average',
                  weightings: {
                    assetBased: 0.25,
                    incomeBased: 0.5,
                    marketBased: 0.25
                  }
                },
                methodology: 'Multi-methodology valuation using asset, income, and market approaches',
                industryAdjustments: [],
                valuationRange: {
                  low: weightedValue * 0.8,
                  high: weightedValue * 1.2,
                  mostLikely: weightedValue
                }
              },
              healthScore: analysis.healthScore,
              confidenceScore: analysis.confidenceScore,
              scoringFactors: {
                financial: {
                  score: analysis.scoringFactors.financial,
                  confidence: 85,
                  factors: [
                    { metric: 'Profit Margin', value: 20, benchmark: 15, impact: 30 }
                  ],
                  recommendations: ['Improve profit margins'],
                  trend: 'stable'
                },
                operational: {
                  score: analysis.scoringFactors.operational,
                  confidence: 80,
                  factors: [
                    { metric: 'Efficiency', value: 75, benchmark: 70, impact: 25 }
                  ],
                  recommendations: ['Optimize operations'],
                  trend: 'improving'
                },
                market: {
                  score: analysis.scoringFactors.market,
                  confidence: 75,
                  factors: [
                    { metric: 'Position', value: 70, benchmark: 65, impact: 35 }
                  ],
                  recommendations: ['Strengthen market position'],
                  trend: 'stable'
                },
                risk: {
                  score: analysis.scoringFactors.risk,
                  confidence: 85,
                  factors: [
                    { metric: 'Risk Level', value: 30, benchmark: 40, impact: 40 }
                  ],
                  recommendations: ['Maintain low risk profile'],
                  trend: 'stable'
                },
                growth: {
                  score: 70,
                  confidence: 70,
                  factors: [
                    { metric: 'Growth Potential', value: 25, benchmark: 20, impact: 45 }
                  ],
                  recommendations: ['Focus on growth initiatives'],
                  trend: 'improving'
                }
              },
              opportunities: analysis.topOpportunities.map(opp => ({
                ...opp,
                impactEstimate: {
                  ...opp.impactEstimate,
                  roiEstimate: 3.5,
                  timeline: opp.timeframe
                },
                specificAnalysis: `Analysis for ${opp.title}: Based on current business metrics and industry benchmarks.`,
                selectionRationale: `Selected due to high impact potential and feasibility for your business type.`,
                riskFactors: ['Implementation challenges', 'Market conditions'],
                prerequisites: ['Management commitment', 'Resource allocation']
              })),
              status: 'completed',
              updatedAt: new Date(),
            }

            // Update the evaluation in the database and store
            const savedEvaluation = await EvaluationService.updateEvaluation(processingEvaluation.id, {
              valuations: completedEvaluation.valuations as any,
              healthScore: completedEvaluation.healthScore,
              confidenceScore: completedEvaluation.confidenceScore,
              opportunities: completedEvaluation.opportunities,
              status: 'completed'
            })

            console.log('💾 SUCCESSFULLY saved evaluation to database:', savedEvaluation.id)

            set(state => {
              console.log('🔄 BEFORE UPDATE - Current evaluations in store:', state.evaluations.length)
              console.log('🔄 Processing evaluation ID:', processingEvaluation.id)
              console.log('🔄 Completed evaluation status:', completedEvaluation.status)
              
              const updatedEvaluations = state.evaluations.map(evaluation => 
                evaluation.id === processingEvaluation.id ? completedEvaluation : evaluation
              )
              
              console.log('🔄 AFTER UPDATE - Updated evaluations:', updatedEvaluations.length)
              console.log('🔄 Updated evaluations details:', updatedEvaluations.map(e => ({ id: e.id, status: e.status })))
              
              return {
                evaluations: updatedEvaluations,
                isLoading: false
              }
            })

            // Clear draft from localStorage
            localStorage.removeItem('business-evaluation-draft')
            
            return completedEvaluation
          } catch (analysisError) {
            console.error('AI analysis failed:', analysisError)
            
            // Update database to mark as failed
            const failedEvaluation = await EvaluationService.updateEvaluation(processingEvaluation.id, {
              status: 'failed'
            })

            set(state => ({
              evaluations: state.evaluations.map(evaluation => 
                evaluation.id === processingEvaluation.id ? failedEvaluation as unknown as BusinessEvaluation : evaluation
              ),
              isLoading: false
            }))

            return failedEvaluation as unknown as BusinessEvaluation
          }
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      loadEvaluations: async (force = false) => {
        console.log('📥 LOAD EVALUATIONS CALLED - Force:', force)
        const { hasLoadedEvaluations, isLoading, evaluations: currentEvaluations, currentEvaluation } = get()
        console.log('📥 Current state - hasLoaded:', hasLoadedEvaluations, 'isLoading:', isLoading, 'currentCount:', currentEvaluations.length)
        
        // Prevent multiple simultaneous calls unless forced
        if (!force && (hasLoadedEvaluations || isLoading)) {
          console.log('📥 SKIPPING load - already loaded or loading')
          return
        }
        
        set({ isLoading: true })
        try {
          // Load evaluations from database
          const { EvaluationService } = await import('@/lib/services/evaluation-service')
          console.log('📥 Fetching evaluations from database...')
          
          let evaluations: any[] = []
          try {
            // Use consistent user ID to get evaluations
            const userId = getCurrentUserId()
            console.log('📥 Fetching evaluations for userId:', userId)
            console.log('📥 User ID from getCurrentUserId():', getCurrentUserId())
            console.log('📥 User IDs match:', userId === getCurrentUserId())
            
            evaluations = await EvaluationService.getUserEvaluations(userId)
            console.log('📥✅ SUCCESS: Loaded', evaluations.length, 'evaluations from database')
            console.log('📥 Evaluation details:', evaluations.map(e => ({ id: e.id, status: e.status, createdAt: e.createdAt })))
          } catch (apiError) {
            console.error('📥❌ Database fetch failed:', apiError)
            // Don't fallback to localStorage - database should be source of truth
            // Log the error but keep evaluations as empty array
            evaluations = []
            console.log('📥 Database unavailable, showing empty state to user')
          }
          
          // Also check for saved draft
          const draft = localStorage.getItem('business-evaluation-draft')
          let draftEvaluation = null
          if (draft) {
            draftEvaluation = JSON.parse(draft)
            console.log('📥✅ Loaded draft evaluation from localStorage')
          } else {
            console.log('📥 No draft found in localStorage')
          }
          
          console.log('📥 Setting state with', evaluations.length, 'evaluations')
          set({ 
            evaluations, 
            currentEvaluation: draftEvaluation, 
            hasLoadedEvaluations: true 
          })
          
          console.log('📥✅ LOAD COMPLETE - State updated')
        } catch (error) {
          console.error('📥❌ Failed to load evaluations:', error)
          set({ hasLoadedEvaluations: true })
        } finally {
          set({ isLoading: false })
        }
      },

      setCurrentStep: (step) => {
        set({ currentStep: step })
      },

      reset: () => {
        set({
          currentEvaluation: null,
          evaluations: [], // Also reset evaluations array
          currentStep: 1,
          isLoading: false,
          hasLoadedEvaluations: false,
          // Epic 2: Reset document state
          uploadedDocuments: [],
          isProcessingDocuments: false,
          documentExtractionData: null,
        })
        localStorage.removeItem('business-evaluation-draft')
        localStorage.removeItem('business-evaluations') // Also clear saved evaluations
      },

      // Epic 2: Document Intelligence Actions
      addProcessedDocument: (document: DocumentProcessingResult) => {
        set(state => ({
          uploadedDocuments: [...state.uploadedDocuments, document]
        }))
      },

      approveDocumentData: (data: ExtractedFinancialData) => {
        console.log('💾 STORE: approveDocumentData called with:', {
          revenue: data.revenue.value,
          expenses: data.expenses.value,
          cashFlow: data.cashFlow.value,
          assets: data.balanceSheet.assets,
          liabilities: data.balanceSheet.liabilities
        })
        
        const { currentEvaluation } = get()
        console.log('💾 STORE: Current evaluation before update:', {
          exists: !!currentEvaluation,
          hasBusinessData: !!currentEvaluation?.businessData,
          currentRevenue: currentEvaluation?.businessData?.annualRevenue,
          currentExpenses: currentEvaluation?.businessData?.expenses
        })
        
        const updatedBusinessData = {
          ...currentEvaluation?.businessData,
          // Merge document-extracted data with existing data
          annualRevenue: data.revenue.value || currentEvaluation?.businessData?.annualRevenue || 0,
          expenses: data.expenses.value || currentEvaluation?.businessData?.expenses || 0,
          cashFlow: data.cashFlow.value || currentEvaluation?.businessData?.cashFlow || 0,
          assets: data.balanceSheet.assets || currentEvaluation?.businessData?.assets || 0,
          liabilities: data.balanceSheet.liabilities || currentEvaluation?.businessData?.liabilities || 0,
          // Epic 2: Document intelligence fields
          extractedFinancials: data,
          documentQualityScore: 75, // Would be calculated based on data quality
          lastDocumentUpdate: new Date(),
        } as any
        
        console.log('💾 STORE: Updated business data:', {
          annualRevenue: updatedBusinessData.annualRevenue,
          expenses: updatedBusinessData.expenses,
          cashFlow: updatedBusinessData.cashFlow,
          assets: updatedBusinessData.assets
        })
        
        set({
          documentExtractionData: data,
          currentEvaluation: {
            ...currentEvaluation,
            businessData: updatedBusinessData,
            updatedAt: new Date(),
          }
        })
        
        console.log('✅ STORE: State updated successfully')
      },

      setProcessingDocuments: (isProcessing: boolean) => {
        set({ isProcessingDocuments: isProcessing })
      },

      updateDocumentExtractedData: (data: ExtractedFinancialData) => {
        set({ documentExtractionData: data })
      },

      // Epic 2: Enhanced Analysis Action
      performEnhancedAnalysis: async () => {
        const { currentEvaluation, uploadedDocuments } = get()
        if (!currentEvaluation?.businessData) throw new Error('No evaluation data to analyze')

        set({ isLoading: true })
        try {
          // Import Epic 2 services dynamically
          const { ClaudeService } = await import('@/lib/services/claude-service')
          
          // Start with processing status
          const processingEvaluation: BusinessEvaluation = {
            id: crypto.randomUUID(),
            userId: getCurrentUserId(),
            businessData: currentEvaluation.businessData,
            uploadedDocuments, // Include the uploaded documents
            // Epic 2: Enhanced multi-methodology valuations
            valuations: {
              assetBased: {
                value: 0,
                confidence: 0,
                methodology: 'Processing...',
                factors: []
              },
              incomeBased: {
                value: 0,
                confidence: 0,
                methodology: 'Processing...',
                multiple: 0,
                factors: []
              },
              marketBased: {
                value: 0,
                confidence: 0,
                methodology: 'Processing...',
                comparables: [],
                factors: []
              },
              weighted: {
                value: 0,
                confidence: 0,
                methodology: 'Processing...',
                weightings: {
                  assetBased: 0,
                  incomeBased: 0,
                  marketBased: 0
                }
              },
              methodology: 'Processing multi-methodology valuation...',
              industryAdjustments: [],
              valuationRange: {
                low: 0,
                high: 0,
                mostLikely: 0
              }
            },
            healthScore: 0,
            confidenceScore: 0,
            // Epic 2: Enhanced health scoring
            scoringFactors: {
              financial: {
                score: 0,
                confidence: 0,
                factors: [],
                recommendations: [],
                trend: 'stable'
              },
              operational: {
                score: 0,
                confidence: 0,
                factors: [],
                recommendations: [],
                trend: 'stable'
              },
              market: {
                score: 0,
                confidence: 0,
                factors: [],
                recommendations: [],
                trend: 'stable'
              },
              risk: {
                score: 0,
                confidence: 0,
                factors: [],
                recommendations: [],
                trend: 'stable'
              },
              growth: {
                score: 0,
                confidence: 0,
                factors: [],
                recommendations: [],
                trend: 'stable'
              }
            },
            opportunities: [],
            status: 'processing',
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          set(state => ({
            evaluations: [...state.evaluations, processingEvaluation],
            currentEvaluation: null,
            currentStep: 1,
          }))

          // Run enhanced AI analysis
          try {
            // Perform multi-methodology valuation
            const valuation = await ClaudeService.performMultiMethodologyValuation(currentEvaluation.businessData)
            
            // Perform enhanced health analysis
            const healthAnalysis = await ClaudeService.analyzeEnhancedBusinessHealth(currentEvaluation.businessData)
            
            const completedEvaluation: BusinessEvaluation = {
              ...processingEvaluation,
              valuations: {
                ...valuation,
                methodology: 'AI-powered multi-methodology valuation using asset, income, and market approaches'
              },
              healthScore: healthAnalysis.healthScore,
              confidenceScore: healthAnalysis.confidenceScore,
              scoringFactors: healthAnalysis.scoringFactors,
              industryBenchmarks: healthAnalysis.industryBenchmarks,
              opportunities: healthAnalysis.topOpportunities,
              uploadedDocuments, // Ensure uploaded documents are included in final evaluation
              status: 'completed',
              updatedAt: new Date(),
            }

            // Update the evaluation in the store
            set(state => ({
              evaluations: state.evaluations.map(evaluation => 
                evaluation.id === processingEvaluation.id ? completedEvaluation : evaluation
              ),
              isLoading: false
            }))

            // Clear draft from localStorage
            localStorage.removeItem('business-evaluation-draft')
            
            return completedEvaluation
          } catch (analysisError) {
            console.error('Enhanced AI analysis failed:', analysisError)
            
            // Mark as failed
            const failedEvaluation: BusinessEvaluation = {
              ...processingEvaluation,
              status: 'failed',
              updatedAt: new Date(),
            }

            set(state => ({
              evaluations: state.evaluations.map(evaluation => 
                evaluation.id === processingEvaluation.id ? failedEvaluation : evaluation
              ),
              isLoading: false
            }))

            return failedEvaluation
          }
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },
    }),
    { name: 'evaluation-store' }
  )
)