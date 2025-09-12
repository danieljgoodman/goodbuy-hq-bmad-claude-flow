'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Heart, 
  Target, 
  FileText, 
  Download, 
  Share2,
  TrendingUp,
  DollarSign,
  Lightbulb,
  Info
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { EnhancedValuationResults } from './enhanced-valuation-results'
import { EnhancedHealthScore } from './enhanced-health-score'
import { OpportunityIntelligence } from './opportunity-intelligence'
import { DocumentIntelligence } from '../documents/document-intelligence'
import DocumentUpload from '../documents/document-upload'
import type { BusinessEvaluation, DocumentProcessingResult } from '@/types'
import type { MultiMethodologyValuation, EnhancedHealthAnalysis } from '@/lib/services/claude-service'

interface UnifiedResultsDashboardProps {
  evaluation: BusinessEvaluation
  documentResults?: DocumentProcessingResult[]
  businessName?: string
  onExport?: () => void
  onShare?: () => void
}

export function UnifiedResultsDashboard({
  evaluation,
  documentResults = [],
  businessName,
  onExport,
  onShare
}: UnifiedResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'valuation' | 'health' | 'opportunities' | 'documents'>('overview')
  const [isLoading, setIsLoading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentProcessingResult[]>(documentResults)

  const handleDocumentProcessed = (result: DocumentProcessingResult) => {
    console.log('Document processed in results:', result)
    setUploadedDocuments(prev => [...prev, result])
  }

  const handleDocumentError = (error: string) => {
    console.error('Document processing error:', error)
  }

  const handleSecureUploadComplete = (document: any) => {
    console.log('Secure upload completed:', document)
  }

  // Convert evaluation to proper Epic 2 format
  const valuationData: MultiMethodologyValuation = evaluation.valuations
  const healthData: EnhancedHealthAnalysis = {
    healthScore: evaluation.healthScore,
    confidenceScore: evaluation.confidenceScore,
    methodology: 'Multi-dimensional analysis with industry benchmarking',
    scoringFactors: evaluation.scoringFactors,
    industryBenchmarks: evaluation.industryBenchmarks || {
      percentile: evaluation.healthScore,
      industryAverage: 65,
      topPerformers: 85,
      benchmarkCategories: []
    },
    topOpportunities: evaluation.opportunities.map(opp => ({
      ...opp,
      impactEstimate: {
        ...opp.impactEstimate,
        roiEstimate: opp.impactEstimate.roiEstimate || 3.0,
        timeline: opp.impactEstimate.timeline || opp.timeframe
      },
      specificAnalysis: opp.specificAnalysis || `This opportunity was identified based on analysis of your ${opp.category} metrics and industry best practices.`,
      selectionRationale: opp.selectionRationale || `Selected due to high impact potential and alignment with current business capabilities.`,
      riskFactors: opp.riskFactors || ['Implementation complexity', 'Market conditions'],
      prerequisites: opp.prerequisites || ['Management commitment', 'Resource allocation']
    }))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'processing':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'valuation', label: 'Valuation', icon: DollarSign },
    { id: 'health', label: 'Health Score', icon: Heart },
    { id: 'opportunities', label: 'Opportunities', icon: Target },
    { id: 'documents', label: 'Documents', icon: FileText, count: documentResults.length }
  ]

  const totalPotentialValue = evaluation.opportunities.reduce((sum, opp) => 
    sum + opp.impactEstimate.dollarAmount, 0
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Complete Business Analysis
              </CardTitle>
              {businessName && (
                <CardDescription>
                  Comprehensive AI-powered evaluation for {businessName}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getStatusColor(evaluation.status)}>
                {evaluation.status}
              </Badge>
              <Badge variant="outline">
                {evaluation.confidenceScore}% confidence
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(valuationData.weighted.value)}
              </p>
              <p className="text-sm text-green-700">Business Value</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Heart className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">
                {evaluation.healthScore}
              </p>
              <p className="text-sm text-blue-700">Health Score</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">
                {evaluation.opportunities.length}
              </p>
              <p className="text-sm text-purple-700">Opportunities</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(totalPotentialValue)}
              </p>
              <p className="text-sm text-orange-700">Potential Impact</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <Button onClick={onExport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
            <Button variant="outline" onClick={onShare} className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.id as any)}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {tab.count}
                </Badge>
              )}
            </Button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Valuation Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Asset-Based:</span>
                      <span className="font-semibold">{formatCurrency(valuationData.assetBased.value)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Income-Based:</span>
                      <span className="font-semibold">{formatCurrency(valuationData.incomeBased.value)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Market-Based:</span>
                      <span className="font-semibold">{formatCurrency(valuationData.marketBased.value)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Weighted Value:</span>
                      <span className="font-bold text-primary">{formatCurrency(valuationData.weighted.value)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Health Analysis</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Financial:</span>
                      <div className="flex items-center gap-2">
                        <Progress value={evaluation.scoringFactors?.financial?.score || evaluation.scoringFactors?.financial || 0} className="w-20" />
                        <span className="font-semibold">{evaluation.scoringFactors?.financial?.score || evaluation.scoringFactors?.financial || 0}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Operational:</span>
                      <div className="flex items-center gap-2">
                        <Progress value={evaluation.scoringFactors?.operational?.score || evaluation.scoringFactors?.operational || 0} className="w-20" />
                        <span className="font-semibold">{evaluation.scoringFactors?.operational?.score || evaluation.scoringFactors?.operational || 0}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Market:</span>
                      <div className="flex items-center gap-2">
                        <Progress value={evaluation.scoringFactors?.market?.score || evaluation.scoringFactors?.market || 0} className="w-20" />
                        <span className="font-semibold">{evaluation.scoringFactors?.market?.score || evaluation.scoringFactors?.market || 0}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Risk:</span>
                      <div className="flex items-center gap-2">
                        <Progress value={evaluation.scoringFactors?.risk?.score || evaluation.scoringFactors?.risk || 0} className="w-20" />
                        <span className="font-semibold">{evaluation.scoringFactors?.risk?.score || evaluation.scoringFactors?.risk || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Key Insights</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Valuation Range:</strong> Your business is valued between{' '}
                      {formatCurrency(valuationData.valuationRange.low)} and{' '}
                      {formatCurrency(valuationData.valuationRange.high)}, with a most likely value of{' '}
                      {formatCurrency(valuationData.valuationRange.mostLikely)}.
                    </AlertDescription>
                  </Alert>
                  
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Improvement Potential:</strong> Implementing the top opportunities could 
                      increase your business value by up to {formatCurrency(totalPotentialValue)}.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Opportunities Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Top Improvement Opportunities</CardTitle>
              <CardDescription>
                Quick overview of your highest-impact opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {evaluation.opportunities.slice(0, 3).map((opportunity, index) => (
                  <div key={opportunity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{opportunity.title}</p>
                      <p className="text-sm text-muted-foreground">{opportunity.category} • {opportunity.difficulty} difficulty</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(opportunity.impactEstimate.dollarAmount)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {opportunity.impactEstimate.percentageIncrease}% increase
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setActiveTab('opportunities')}
              >
                View All Opportunities
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'valuation' && (
        <EnhancedValuationResults 
          valuation={valuationData} 
          businessName={businessName}
        />
      )}

      {activeTab === 'health' && (
        <EnhancedHealthScore 
          analysis={healthData} 
          businessName={businessName}
        />
      )}

      {activeTab === 'opportunities' && (
        <OpportunityIntelligence 
          analysis={healthData} 
          businessName={businessName}
          evaluationId={evaluation.id}
          showImplementationGuides={true} // For testing, always show guides in Epic 2
        />
      )}

      {activeTab === 'documents' && (
        <div className="space-y-6">
          {uploadedDocuments.length > 0 && (
            <div className="space-y-4">
              {uploadedDocuments.map((result, index) => (
                <DocumentIntelligence
                  key={index}
                  processingResult={result}
                  onDataApproval={(data) => {
                    console.log('Document data approved:', data)
                  }}
                  onDataEdit={(data) => {
                    console.log('Document data edited:', data)
                  }}
                />
              ))}
            </div>
          )}
          
          {!showUpload ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {uploadedDocuments.length > 0 ? 'Upload Additional Documents' : 'No Documents Processed'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {uploadedDocuments.length > 0 
                    ? 'Upload more financial documents to further enhance your evaluation' 
                    : 'Upload financial documents to enhance the accuracy of your business evaluation'
                  }
                </p>
                <Button variant="outline" onClick={() => setShowUpload(true)}>
                  Upload Documents
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Upload Financial Documents</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowUpload(false)}
                  >
                    Cancel
                  </Button>
                </div>
                <DocumentUpload
                  userId={evaluation.userId}
                  evaluationId={evaluation.id}
                  onProcessingComplete={handleDocumentProcessed}
                  onSecureUploadComplete={handleSecureUploadComplete}
                  onError={handleDocumentError}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Footer Note */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Professional Analysis Complete:</strong> This comprehensive evaluation combines 
          multiple AI methodologies to provide professional-grade business valuation and health 
          analysis. All data is processed with enterprise-level security and privacy protection.
        </AlertDescription>
      </Alert>
    </div>
  )
}