'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import DocumentUpload from '@/components/documents/document-upload'
import { UnifiedResultsDashboard } from '@/components/evaluation/unified-results-dashboard'
import { Lightbulb, Rocket, FileText, BarChart3 } from 'lucide-react'
import type { BusinessEvaluation, DocumentProcessingResult } from '@/types'
import { useEvaluationStore } from '@/stores/evaluation-store'

export default function Epic2DemoPage() {
  const [currentStep, setCurrentStep] = useState<'intro' | 'documents' | 'analysis' | 'results'>('intro')
  const [sampleEvaluation, setSampleEvaluation] = useState<BusinessEvaluation | null>(null)
  const [documentResults, setDocumentResults] = useState<DocumentProcessingResult[]>([])
  
  const { 
    performEnhancedAnalysis, 
    addProcessedDocument,
    approveDocumentData,
    isLoading 
  } = useEvaluationStore()

  // Sample business data for demo
  const sampleBusinessData = {
    businessType: 'Technology Services',
    industryFocus: 'Software Development',
    yearsInBusiness: 5,
    businessModel: 'Service-based',
    revenueModel: 'Project-based',
    annualRevenue: 500000,
    monthlyRecurring: 30000,
    expenses: 350000,
    cashFlow: 25000,
    grossMargin: 70,
    customerCount: 45,
    employeeCount: 8,
    marketPosition: 'Growing Player',
    competitiveAdvantages: ['Technical expertise', 'Client relationships', 'Agile methodology'],
    primaryChannels: ['Referrals', 'Direct sales', 'Online marketing'],
    assets: 150000,
    liabilities: 50000,
  }

  const runDemoAnalysis = async () => {
    setCurrentStep('analysis')
    
    try {
      // Simulate the evaluation store being populated with sample data
      useEvaluationStore.setState({
        currentEvaluation: {
          businessData: sampleBusinessData,
          userId: 'demo-user'
        }
      })

      // Perform enhanced analysis
      const result = await performEnhancedAnalysis()
      setSampleEvaluation(result)
      setCurrentStep('results')
    } catch (error) {
      console.error('Demo analysis failed:', error)
      // Create a fallback demo evaluation
      const demoEvaluation: BusinessEvaluation = {
        id: 'demo-evaluation-id',
        userId: 'demo-user',
        businessData: sampleBusinessData,
        valuations: {
          assetBased: {
            value: 100000,
            confidence: 80,
            methodology: 'Net asset value approach',
            factors: ['Total assets', 'Total liabilities', 'Asset quality']
          },
          incomeBased: {
            value: 750000,
            confidence: 85,
            methodology: 'Earnings multiple approach',
            multiple: 5,
            factors: ['Net profit', 'Earnings consistency', 'Growth prospects']
          },
          marketBased: {
            value: 600000,
            confidence: 70,
            methodology: 'Revenue multiple approach',
            comparables: [{
              companyName: 'TechService Co',
              industry: 'Software Development',
              revenue: 600000,
              valuation: 720000,
              multiple: 1.2,
              source: 'Market data',
              relevanceScore: 85
            }],
            factors: ['Revenue multiple', 'Industry comparables', 'Market conditions']
          },
          weighted: {
            value: 625000,
            confidence: 85,
            methodology: 'Weighted average of all methodologies',
            weightings: {
              assetBased: 0.2,
              incomeBased: 0.5,
              marketBased: 0.3
            }
          },
          methodology: 'Comprehensive multi-approach valuation combining asset, income, and market methods',
          industryAdjustments: [{
            factor: 'Technology premium',
            adjustment: 0.1,
            reasoning: 'Tech services command premium valuations',
            confidence: 75
          }],
          valuationRange: {
            low: 500000,
            high: 750000,
            mostLikely: 625000
          }
        },
        healthScore: 78,
        confidenceScore: 85,
        scoringFactors: {
          financial: {
            score: 82,
            confidence: 85,
            factors: [
              { metric: 'Profit Margin', value: 30, benchmark: 15, impact: 35 },
              { metric: 'Cash Flow', value: 25000, benchmark: 50000, impact: 25 },
              { metric: 'Net Worth', value: 100000, benchmark: 250000, impact: 20 }
            ],
            recommendations: ['Improve cash flow management', 'Build financial reserves'],
            trend: 'improving'
          },
          operational: {
            score: 75,
            confidence: 80,
            factors: [
              { metric: 'Revenue per Employee', value: 62500, benchmark: 150000, impact: 30 },
              { metric: 'Customer Count', value: 45, benchmark: 100, impact: 25 }
            ],
            recommendations: ['Scale operations', 'Improve productivity'],
            trend: 'stable'
          },
          market: {
            score: 72,
            confidence: 75,
            factors: [
              { metric: 'Market Position', value: 70, benchmark: 75, impact: 35 },
              { metric: 'Years in Business', value: 5, benchmark: 10, impact: 20 }
            ],
            recommendations: ['Strengthen market position', 'Build brand awareness'],
            trend: 'improving'
          },
          risk: {
            score: 85,
            confidence: 85,
            factors: [
              { metric: 'Debt to Asset Ratio', value: 33, benchmark: 30, impact: 40 },
              { metric: 'Customer Concentration', value: 15, benchmark: 20, impact: 25 }
            ],
            recommendations: ['Maintain low debt levels', 'Continue diversification'],
            trend: 'stable'
          },
          growth: {
            score: 78,
            confidence: 70,
            factors: [
              { metric: 'Revenue Growth Potential', value: 25, benchmark: 20, impact: 45 },
              { metric: 'Market Expansion', value: 70, benchmark: 65, impact: 30 }
            ],
            recommendations: ['Invest in growth initiatives', 'Expand service offerings'],
            trend: 'improving'
          }
        },
        industryBenchmarks: {
          percentile: 75,
          industryAverage: 65,
          topPerformers: 85,
          benchmarkCategories: [
            {
              category: 'Financial Performance',
              userValue: 82,
              industryAverage: 65,
              topQuartile: 80,
              percentile: 75,
              interpretation: 'Above industry average'
            },
            {
              category: 'Operational Efficiency',
              userValue: 75,
              industryAverage: 60,
              topQuartile: 75,
              percentile: 70,
              interpretation: 'Competitive performance'
            }
          ]
        },
        opportunities: [
          {
            id: 'revenue-optimization',
            category: 'financial',
            title: 'Revenue Per Employee Optimization',
            description: 'Implement productivity tools and streamline processes to increase revenue per employee from $62.5K to industry benchmark of $150K.',
            impactEstimate: {
              dollarAmount: 175000,
              percentageIncrease: 35,
              confidence: 85,
              roiEstimate: 4.2,
              timeline: '6 months'
            },
            difficulty: 'medium',
            timeframe: '6-9 months',
            priority: 1,
            requiredResources: ['Productivity software', 'Process optimization', 'Staff training'],
            specificAnalysis: 'Current revenue per employee is significantly below industry standards, indicating substantial room for productivity improvements.',
            selectionRationale: 'High-impact opportunity with proven methodologies and measurable outcomes.',
            riskFactors: ['Implementation complexity', 'Staff adaptation period'],
            prerequisites: ['Management commitment', 'Technology investment', 'Change management plan']
          },
          {
            id: 'market-expansion',
            category: 'strategic',
            title: 'Service Portfolio Expansion',
            description: 'Expand service offerings to include recurring maintenance and support contracts, creating predictable revenue streams.',
            impactEstimate: {
              dollarAmount: 120000,
              percentageIncrease: 24,
              confidence: 75,
              roiEstimate: 3.5,
              timeline: '12 months'
            },
            difficulty: 'medium',
            timeframe: '9-12 months',
            priority: 2,
            requiredResources: ['Service development', 'Sales training', 'Client relationship management'],
            specificAnalysis: 'Current project-based model creates revenue volatility. Recurring services would provide stability and premium pricing.',
            selectionRationale: 'Addresses revenue predictability while leveraging existing client relationships.',
            riskFactors: ['Market acceptance', 'Resource allocation', 'Service delivery challenges'],
            prerequisites: ['Market research', 'Service framework development', 'Pricing strategy']
          }
        ],
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setSampleEvaluation(demoEvaluation)
      setCurrentStep('results')
    }
  }

  const handleDocumentProcessed = (result: DocumentProcessingResult) => {
    addProcessedDocument(result)
    setDocumentResults(prev => [...prev, result])
  }

  const handleDocumentError = (error: string) => {
    console.error('Document processing error:', error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-2 border-primary bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-3">
              <Rocket className="h-8 w-8 text-primary" />
              Epic 2: AI Analysis Engine & Document Intelligence
            </CardTitle>
            <CardDescription className="text-lg">
              Experience the complete AI-powered business valuation system with multi-methodology 
              analysis, document intelligence, and advanced health scoring.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Navigation Steps */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'intro', label: 'Introduction', icon: Lightbulb },
            { id: 'documents', label: 'Document Intelligence', icon: FileText },
            { id: 'analysis', label: 'AI Analysis', icon: BarChart3 },
            { id: 'results', label: 'Results Dashboard', icon: BarChart3 }
          ].map((step) => {
            const Icon = step.icon
            return (
              <Button
                key={step.id}
                variant={currentStep === step.id ? 'default' : 'outline'}
                onClick={() => setCurrentStep(step.id as any)}
                className="flex items-center gap-2"
                disabled={step.id === 'results' && !sampleEvaluation}
              >
                <Icon className="h-4 w-4" />
                {step.label}
              </Button>
            )
          })}
        </div>

        {/* Content */}
        {currentStep === 'intro' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Epic 2 Features Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Multi-Methodology Valuation</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs">Asset</Badge>
                        Net asset value with quality adjustments
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs">Income</Badge>
                        Earnings multiples with industry factors
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs">Market</Badge>
                        Comparable sales and market data
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs">Weighted</Badge>
                        Professional weighted final valuation
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Document Intelligence</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs">Upload</Badge>
                        PDF, Excel, CSV, and image support
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs">Extract</Badge>
                        AI-powered financial data extraction
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs">Validate</Badge>
                        Quality assessment and verification
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs">Integrate</Badge>
                        Seamless evaluation enhancement
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-lg mb-3">Enhanced Health Analysis</h3>
                  <div className="grid md:grid-cols-5 gap-4 text-sm">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="font-semibold text-green-600">Financial</div>
                      <div className="text-xs text-green-700">Profitability & Cash Flow</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="font-semibold text-blue-600">Operational</div>
                      <div className="text-xs text-blue-700">Efficiency & Productivity</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="font-semibold text-purple-600">Market</div>
                      <div className="text-xs text-purple-700">Position & Competition</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="font-semibold text-orange-600">Risk</div>
                      <div className="text-xs text-orange-700">Stability & Mitigation</div>
                    </div>
                    <div className="text-center p-3 bg-indigo-50 rounded-lg">
                      <div className="font-semibold text-indigo-600">Growth</div>
                      <div className="text-xs text-indigo-700">Potential & Scalability</div>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Rocket className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Demo Ready:</strong> This demo uses a sample technology services business 
                    with $500K annual revenue. Experience the full Epic 2 feature set including 
                    document processing, multi-methodology valuations, and comprehensive health analysis.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button onClick={() => setCurrentStep('documents')} size="lg">
                    Start Document Intelligence Demo
                  </Button>
                  <Button onClick={runDemoAnalysis} variant="outline" size="lg" disabled={isLoading}>
                    {isLoading ? 'Analyzing...' : 'Run Complete AI Analysis'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 'documents' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Intelligence System</CardTitle>
                <CardDescription>
                  Upload financial documents to see AI-powered extraction and analysis in action
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentUpload
                  userId="demo-user"
                  evaluationId="epic2-demo"
                  onProcessingComplete={handleDocumentProcessed}
                  onSecureUploadComplete={(doc) => console.log('Secure upload:', doc)}
                  onError={handleDocumentError}
                />
                
                <div className="mt-6 flex gap-3">
                  <Button onClick={runDemoAnalysis} disabled={isLoading}>
                    {isLoading ? 'Running Analysis...' : 'Proceed to AI Analysis'}
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentStep('intro')}>
                    Back to Overview
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 'analysis' && (
          <div className="space-y-6">
            <Card>
              <CardContent className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold mb-2">Running Enhanced AI Analysis</h3>
                <p className="text-muted-foreground">
                  Performing multi-methodology valuation, advanced health scoring, and 
                  opportunity intelligence analysis...
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 'results' && sampleEvaluation && (
          <UnifiedResultsDashboard
            evaluation={sampleEvaluation}
            documentResults={documentResults}
            businessName="Demo Tech Services Co"
            onExport={() => console.log('Export requested')}
            onShare={() => console.log('Share requested')}
          />
        )}
      </div>
    </div>
  )
}