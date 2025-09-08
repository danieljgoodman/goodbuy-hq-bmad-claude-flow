'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText, Upload, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import DocumentUpload from '@/components/documents/document-upload'
import { useEvaluationStore } from '@/stores/evaluation-store'
import { useAuthStore } from '@/stores/auth-store'
import { getCurrentUserId } from '@/lib/user-utils'
import type { DocumentProcessingResult } from '@/types'
import type { Document } from '@/types/document'

export default function DocumentUploadStep() {
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentProcessingResult[]>([])
  const [failedDocuments, setFailedDocuments] = useState<{name: string, error: string}[]>([])
  const [hasSkipped, setHasSkipped] = useState(false)
  const { user } = useAuthStore()
  const { addProcessedDocument, approveDocumentData, currentEvaluation } = useEvaluationStore()
  
  // Get effective user ID
  const effectiveUserId = user?.id || getCurrentUserId()
  const evaluationId = currentEvaluation?.id || 'temp-evaluation'

  const handleDocumentProcessed = (result: DocumentProcessingResult) => {
    console.log('🔍 DOCUMENT-UPLOAD-STEP: Document processed:', result.originalFileName)
    console.log('📊 DOCUMENT-UPLOAD-STEP: Extracted data structure:', {
      hasExtractedData: !!result.extractedData,
      revenue: result.extractedData?.revenue?.value,
      expenses: result.extractedData?.expenses?.value,
      assets: result.extractedData?.balanceSheet?.assets,
      confidence: result.extractedData?.confidence
    })
    
    // Check if processing was successful or failed
    const processingFailed = result.extractedData?.dataQualityFlags?.some(flag => 
      flag.includes('Processing error') || flag.includes('failed')
    ) || result.qualityAssessment?.overallScore === 0
    
    if (processingFailed) {
      const errorMessages = result.extractedData?.dataQualityFlags?.filter(flag => 
        flag.includes('Processing error') || flag.includes('failed')
      ) || ['Unknown processing error']
      
      console.log('❌ DOCUMENT-UPLOAD-STEP: Processing failed for', result.originalFileName, errorMessages[0])
      setFailedDocuments(prev => [...prev, { 
        name: result.originalFileName, 
        error: errorMessages[0] 
      }])
    } else {
      console.log('✅ DOCUMENT-UPLOAD-STEP: Processing successful for', result.originalFileName)
      console.log('🔄 DOCUMENT-UPLOAD-STEP: Adding to store via addProcessedDocument')
      addProcessedDocument(result)
      setUploadedDocuments(prev => [...prev, result])
      
      // Auto-approve document data to integrate with evaluation
      if (result.extractedData) {
        console.log('📝 DOCUMENT-UPLOAD-STEP: Calling approveDocumentData with:', {
          revenue: result.extractedData.revenue?.value,
          expenses: result.extractedData.expenses?.value,
          assets: result.extractedData.balanceSheet?.assets
        })
        approveDocumentData(result.extractedData)
        console.log('✅ DOCUMENT-UPLOAD-STEP: approveDocumentData completed')
      } else {
        console.log('⚠️ DOCUMENT-UPLOAD-STEP: No extracted data to approve')
      }
    }
  }

  const handleDocumentError = (error: string) => {
    console.error('Document processing error:', error)
    // Add to failed documents list for user visibility
    setFailedDocuments(prev => [...prev, {
      name: 'Unknown document',
      error: error
    }])
  }

  const handleSecureUploadComplete = (document: Document) => {
    console.log('Secure upload completed:', document)
  }

  const handleSkip = () => {
    setHasSkipped(true)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="h-12 w-12 mx-auto text-primary mb-4" />
        <h2 className="text-2xl font-bold mb-2">Upload Financial Documents (Optional)</h2>
        <p className="text-muted-foreground">
          Upload your financial statements, tax returns, or business documents for AI-powered 
          analysis that improves valuation accuracy.
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Enhanced Analysis:</strong> Uploading documents allows our AI to verify your 
          financial data, identify potential red flags, and provide more accurate valuations. 
          All documents are encrypted and securely processed.
        </AlertDescription>
      </Alert>

      {!hasSkipped && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Document Upload
            </CardTitle>
            <CardDescription>
              Supported formats: PDF, Excel (.xlsx, .xls), CSV, and images (JPEG, PNG)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentUpload
              userId={effectiveUserId}
              evaluationId={evaluationId}
              onProcessingComplete={handleDocumentProcessed}
              onSecureUploadComplete={handleSecureUploadComplete}
              onError={handleDocumentError}
            />
          </CardContent>
        </Card>
      )}

      {uploadedDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Documents Processed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedDocuments.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="font-medium">{doc.originalFileName}</p>
                    <p className="text-sm text-green-700">
                      Quality Score: {doc.qualityAssessment.overallScore}% | 
                      Confidence: {doc.processingMetadata.confidence}%
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              ))}
            </div>
            
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Data Enhanced:</strong> Your financial data has been automatically updated 
                with extracted information. Review the next steps to see the integrated analysis.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {failedDocuments.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Documents with Processing Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {failedDocuments.map((doc, index) => (
                <div key={index} className="flex items-start justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex-1">
                    <p className="font-medium text-orange-800">{doc.name}</p>
                    <p className="text-sm text-orange-600 mt-1">{doc.error}</p>
                    <p className="text-xs text-orange-500 mt-2">
                      Try: Convert to PDF, ensure file isn't corrupted, or manually enter the data
                    </p>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 ml-3" />
                </div>
              ))}
            </div>
            
            <Alert className="mt-4 border-orange-200 bg-orange-50">
              <Info className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-700">
                <strong>Don't worry!</strong> You can continue with manual data entry or try re-uploading 
                these documents in a different format (PDF usually works best).
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {hasSkipped && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You&apos;ve chosen to skip document upload. You can always upload documents later to 
            enhance your evaluation accuracy.
          </AlertDescription>
        </Alert>
      )}

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          {uploadedDocuments.length > 0 
            ? `${uploadedDocuments.length} document(s) processed successfully`
            : failedDocuments.length > 0
            ? `${failedDocuments.length} document(s) had processing issues - you can continue with manual entry`
            : 'You can upload documents now or skip this step'
          }
        </p>
        
        {uploadedDocuments.length === 0 && !hasSkipped && (
          <Button variant="outline" onClick={handleSkip}>
            Skip Document Upload
          </Button>
        )}
      </div>
    </div>
  )
}