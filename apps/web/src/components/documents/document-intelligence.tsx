'use client'

import { useState } from 'react'
import { 
  FileText, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Eye,
  EyeOff,
  Edit3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import type { DocumentProcessingResult, ExtractedFinancialData } from '@/types'

interface DocumentIntelligenceProps {
  processingResult: DocumentProcessingResult
  onDataApproval: (approvedData: ExtractedFinancialData) => void
  onDataEdit: (editedData: ExtractedFinancialData) => void
}

export function DocumentIntelligence({ 
  processingResult, 
  onDataApproval, 
  onDataEdit 
}: DocumentIntelligenceProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editedData, setEditedData] = useState<ExtractedFinancialData>(processingResult.extractedData)

  const { extractedData, qualityAssessment, processingMetadata } = processingResult

  const handleApprove = () => {
    onDataApproval(editMode ? editedData : extractedData)
  }

  const handleEdit = () => {
    setEditMode(!editMode)
    if (editMode) {
      onDataEdit(editedData)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getQualityLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    return 'Needs Review'
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Analysis Results
              </CardTitle>
              <CardDescription>
                AI-extracted financial data from {processingResult.originalFileName}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {processingMetadata.aiModel}
              </Badge>
              <Badge className={getQualityColor(qualityAssessment.overallScore)}>
                {getQualityLabel(qualityAssessment.overallScore)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium">Processing Time</p>
              <p className="text-2xl font-bold">{(processingMetadata.processingTime / 1000).toFixed(1)}s</p>
            </div>
            <div>
              <p className="text-sm font-medium">Overall Quality</p>
              <p className={`text-2xl font-bold ${getQualityColor(qualityAssessment.overallScore)}`}>
                {qualityAssessment.overallScore}%
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Confidence</p>
              <p className="text-2xl font-bold">{processingMetadata.confidence}%</p>
            </div>
            <div>
              <p className="text-sm font-medium">Method</p>
              <p className="text-sm text-muted-foreground">{processingMetadata.extractionMethod}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quality Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Data Quality Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Completeness</span>
                <span className="text-sm">{qualityAssessment.completeness}%</span>
              </div>
              <Progress value={qualityAssessment.completeness} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Accuracy</span>
                <span className="text-sm">{qualityAssessment.accuracy}%</span>
              </div>
              <Progress value={qualityAssessment.accuracy} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Consistency</span>
                <span className="text-sm">{qualityAssessment.consistency}%</span>
              </div>
              <Progress value={qualityAssessment.consistency} />
            </div>
          </div>

          {qualityAssessment.flags.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Quality Flags:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {qualityAssessment.flags.map((flag, index) => (
                    <li key={index} className="text-sm">{flag}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Extracted Financial Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Extracted Financial Data</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showDetails ? 'Hide Details' : 'Show Details'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
              >
                <Edit3 className="h-4 w-4" />
                {editMode ? 'Save Edits' : 'Edit Data'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Revenue Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <h4 className="font-semibold">Revenue</h4>
                <Badge variant="outline" className="text-xs">
                  {extractedData.revenue.confidence}% confidence
                </Badge>
              </div>
              {editMode ? (
                <input
                  type="number"
                  value={editedData.revenue.value}
                  onChange={(e) => setEditedData(prev => ({
                    ...prev,
                    revenue: { ...prev.revenue, value: Number(e.target.value) }
                  }))}
                  className="w-full px-3 py-2 border rounded-md"
                />
              ) : (
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(extractedData.revenue.value)}
                </p>
              )}
              {showDetails && (
                <p className="text-sm text-muted-foreground">
                  Source: {extractedData.revenue.source}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <h4 className="font-semibold">Expenses</h4>
                <Badge variant="outline" className="text-xs">
                  {extractedData.expenses.confidence}% confidence
                </Badge>
              </div>
              {editMode ? (
                <input
                  type="number"
                  value={editedData.expenses.value}
                  onChange={(e) => setEditedData(prev => ({
                    ...prev,
                    expenses: { ...prev.expenses, value: Number(e.target.value) }
                  }))}
                  className="w-full px-3 py-2 border rounded-md"
                />
              ) : (
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(extractedData.expenses.value)}
                </p>
              )}
              {showDetails && extractedData.expenses.breakdown.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Breakdown:</p>
                  {extractedData.expenses.breakdown.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.category}</span>
                      <span>{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cash Flow and Balance Sheet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <h4 className="font-semibold">Cash Flow</h4>
                <Badge variant="outline" className="text-xs">
                  {extractedData.cashFlow.confidence}% confidence
                </Badge>
              </div>
              {editMode ? (
                <input
                  type="number"
                  value={editedData.cashFlow.value}
                  onChange={(e) => setEditedData(prev => ({
                    ...prev,
                    cashFlow: { ...prev.cashFlow, value: Number(e.target.value) }
                  }))}
                  className="w-full px-3 py-2 border rounded-md"
                />
              ) : (
                <p className={`text-2xl font-bold ${extractedData.cashFlow.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(extractedData.cashFlow.value)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-gray-600" />
                <h4 className="font-semibold">Net Worth</h4>
                <Badge variant="outline" className="text-xs">
                  {extractedData.balanceSheet.confidence}% confidence
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm">Assets: {formatCurrency(extractedData.balanceSheet.assets)}</p>
                <p className="text-sm">Liabilities: {formatCurrency(extractedData.balanceSheet.liabilities)}</p>
                <p className={`text-xl font-bold ${(extractedData.balanceSheet.assets - extractedData.balanceSheet.liabilities) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Net: {formatCurrency(extractedData.balanceSheet.assets - extractedData.balanceSheet.liabilities)}
                </p>
              </div>
            </div>
          </div>

          {/* Data Issues */}
          {(extractedData.inconsistencies.length > 0 || extractedData.missingData.length > 0) && (
            <div className="space-y-4">
              {extractedData.inconsistencies.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Inconsistencies Found:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {extractedData.inconsistencies.map((issue, index) => (
                        <li key={index} className="text-sm">{issue}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {extractedData.missingData.length > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Missing Data:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {extractedData.missingData.map((item, index) => (
                        <li key={index} className="text-sm">{item}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleApprove} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {editMode ? 'Apply Edited Data' : 'Approve & Use Data'}
            </Button>
            <Button variant="outline" onClick={() => setEditMode(false)}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}