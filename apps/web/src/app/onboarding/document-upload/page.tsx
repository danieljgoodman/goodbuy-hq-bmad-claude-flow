'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/protected-route'
import DocumentUpload from '@/components/documents/document-upload'
import type { DocumentUploadFile } from '@/components/documents/document-upload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, FileText } from 'lucide-react'

export default function OnboardingDocumentUploadPage() {
  const router = useRouter()
  const [uploadedFiles, setUploadedFiles] = useState<DocumentUploadFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingResults, setProcessingResults] = useState<any[]>([])
  const [processingError, setProcessingError] = useState<string>('')

  const handleUploadComplete = (files: DocumentUploadFile[]) => {
    setUploadedFiles(files)
  }

  const handleProcessingComplete = (result: any) => {
    console.log('📄 Document processing completed in page component:', result)
    setProcessingResults(prev => {
      const updated = [...prev, result]
      console.log('📊 Updated processingResults array:', updated)
      return updated
    })
  }

  const handleProcessingError = (error: string) => {
    console.error('Document processing error:', error)
    setProcessingError(error)
  }

  const handleContinueToReview = async () => {
    setIsProcessing(true)
    
    try {
      console.log('🚀 Starting review process with completed files:', completedFiles.length)
      console.log('📊 Current processingResults:', processingResults.length)
      
      // Always try to fetch the latest results directly from the API
      // This ensures we get the real OpenAI processing data
      const fetchPromises = completedFiles.map(async (file) => {
        console.log(`🔍 Fetching results for document: ${file.id} (${file.file.name})`)
        const response = await fetch(`/api/documents/process?documentId=${file.id}`)
        console.log(`📡 API response status for ${file.id}:`, response.status)
        
        if (response.ok) {
          const result = await response.json()
          console.log(`✅ Successfully fetched result for ${file.id}:`, JSON.stringify(result, null, 2))
          return result.processingResult || result
        } else {
          console.error(`❌ Failed to fetch result for ${file.id}:`, response.statusText)
          return { documentId: file.id, fileName: file.file.name, error: `API Error: ${response.statusText}` }
        }
      })
      
      const fetchedResults = await Promise.all(fetchPromises)
      console.log('📦 All fetched results (full structure):', JSON.stringify(fetchedResults, null, 2))
      
      // Validate that we have actual processing results, not just error objects
      const validResults = fetchedResults.filter(result => !result.error && result.extractedData)
      console.log('✅ Valid processing results with extractedData:', validResults.length)
      
      if (validResults.length === 0) {
        console.warn('⚠️ No results with extractedData found, checking raw results...')
        const hasAnyResults = fetchedResults.filter(result => !result.error)
        if (hasAnyResults.length > 0) {
          console.log('📋 Using raw results instead:')
          hasAnyResults.forEach((result, i) => {
            console.log(`Result ${i}:`, Object.keys(result))
          })
        }
        throw new Error('No valid processing results found. Documents may not have been processed yet.')
      }
      
      // Store in sessionStorage instead of URL params to avoid size limits
      const dataKey = `document-results-${Date.now()}`
      sessionStorage.setItem(dataKey, JSON.stringify(validResults))
      console.log('💾 Stored processing results in sessionStorage with key:', dataKey)
      
      // Pass only the key in URL params
      const params = new URLSearchParams({
        source: 'document',
        dataKey: dataKey
      })
      
      console.log('🎯 Navigating to manual page with data key:', dataKey)
      router.push(`/onboarding/manual?${params.toString()}`)
      
    } catch (error) {
      console.error('Failed to fetch processing results:', error)
      setProcessingError(`Failed to retrieve processing results: ${error instanceof Error ? error.message : 'Please try again.'}`)
      setIsProcessing(false)
    }
  }

  const completedFiles = uploadedFiles.filter(f => f.uploadStatus === 'completed')

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary pt-20 pb-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Document Upload Evaluation</h1>
            <p className="text-lg text-muted-foreground">
              Upload your financial documents for AI-powered data extraction
            </p>
          </div>
          
          <div className="w-full max-w-4xl mx-auto space-y-6">
            <DocumentUpload 
              onUploadComplete={handleUploadComplete}
              onProcessingComplete={handleProcessingComplete}
              onError={handleProcessingError}
            />
            
            {processingError && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="text-red-800">
                    <strong>Processing Error:</strong> {processingError}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {completedFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Document Processing Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{completedFiles.length}</div>
                        <div className="text-sm text-green-600">Documents Uploaded</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{processingResults.length}</div>
                        <div className="text-sm text-blue-600">Processed</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {processingResults.length > 0 ? '✓' : '⏳'}
                        </div>
                        <div className="text-sm text-purple-600">AI Extraction</div>
                      </div>
                    </div>
                    
                    <div className="text-center space-y-4">
                      <p className="text-muted-foreground">
                        Your documents have been successfully uploaded and are ready for AI processing. 
                        Click continue to proceed with data extraction and review.
                      </p>
                      
                      <Button 
                        onClick={handleContinueToReview}
                        disabled={isProcessing || completedFiles.length === 0}
                        size="lg"
                        className="min-w-[200px]"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Processing Documents...
                          </>
                        ) : (
                          <>
                            Continue to Review
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}