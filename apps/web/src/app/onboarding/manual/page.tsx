'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/auth/protected-route'
import EvaluationForm from '@/components/evaluation/evaluation-form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, FileText, AlertCircle } from 'lucide-react'

function ManualPageContent() {
  const searchParams = useSearchParams()
  const [extractedData, setExtractedData] = useState<any[]>([])
  const [hasDocumentData, setHasDocumentData] = useState(false)

  useEffect(() => {
    const source = searchParams.get('source')
    const resultsParam = searchParams.get('results')
    const dataKey = searchParams.get('dataKey')
    
    console.log('📋 Manual page - source:', source)
    console.log('📋 Manual page - results param:', resultsParam ? 'present' : 'none')
    console.log('📋 Manual page - dataKey:', dataKey)
    
    if (source === 'document') {
      let parsedResults = null
      
      try {
        // Try sessionStorage first (new approach)
        if (dataKey) {
          const storedData = sessionStorage.getItem(dataKey)
          if (storedData) {
            parsedResults = JSON.parse(storedData)
            console.log('💾 Retrieved results from sessionStorage')
            // Clean up sessionStorage
            sessionStorage.removeItem(dataKey)
          }
        }
        
        // Fallback to URL params (legacy approach)
        if (!parsedResults && resultsParam) {
          parsedResults = JSON.parse(decodeURIComponent(resultsParam))
          console.log('🔗 Retrieved results from URL params (fallback)')
        }
        
        if (parsedResults) {
          console.log('📊 Parsed document results structure:')
          parsedResults.forEach((result: any, index: number) => {
            console.log(`  Document ${index + 1}:`, {
              id: result.id,
              originalFileName: result.originalFileName,
              hasExtractedData: !!result.extractedData,
              extractedDataKeys: result.extractedData ? Object.keys(result.extractedData) : [],
              revenue: result.extractedData?.revenue?.value,
              expenses: result.extractedData?.expenses?.value,
              cashFlow: result.extractedData?.cashFlow?.value,
              assets: result.extractedData?.balanceSheet?.assets
            })
          })
          
          setExtractedData(parsedResults)
          setHasDocumentData(true)
          
          // Check if we have any meaningful financial data with improved validation
          const hasData = parsedResults.some((doc: any) => {
            const data = doc.extractedData
            if (!data) return false
            
            return (
              (data.revenue?.value && data.revenue.value > 0) ||
              (data.expenses?.value && data.expenses.value > 0) ||
              (data.cashFlow?.value && Math.abs(data.cashFlow.value) > 0) ||
              (data.balanceSheet?.assets && data.balanceSheet.assets > 0) ||
              (data.balanceSheet?.liabilities && data.balanceSheet.liabilities > 0)
            )
          })
          
          console.log('💰 Has meaningful financial data:', hasData)
          
          if (!hasData) {
            console.warn('⚠️ No meaningful financial data found in extracted results')
            // Log what we actually have
            parsedResults.forEach((doc: any, i: number) => {
              console.log(`Document ${i + 1} data:`, JSON.stringify(doc.extractedData || {}, null, 2))
            })
          }
        }
      } catch (error) {
        console.error('Failed to parse document results:', error)
        console.error('Error details:', error)
      }
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary pt-20 pb-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {hasDocumentData ? 'Document Processing Complete' : 'Manual Business Evaluation'}
          </h1>
          <p className="text-lg text-muted-foreground">
            {hasDocumentData
              ? 'Review and complete your business information based on document analysis'
              : 'Enter your business information step-by-step through our guided forms'
            }
          </p>
        </div>

        {/* Document Processing Summary */}
        {hasDocumentData && extractedData.length > 0 && (
          <div className="max-w-4xl mx-auto mb-8">
            <Alert className="mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Successfully processed {extractedData.length} document{extractedData.length !== 1 ? 's' : ''} using AI extraction.
                The form below has been pre-filled with extracted data where available.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {extractedData.map((doc, index) => (
                <div key={index} className="bg-white rounded-lg border p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <h3 className="font-medium text-sm">{doc.originalFileName || `Document ${index + 1}`}</h3>
                  </div>

                  <div className="space-y-1 text-xs text-gray-600">
                    <div>Confidence: {doc.extractedData?.confidence || 0}%</div>
                    <div>Revenue: ${doc.extractedData?.revenue?.value || 0}</div>
                    <div>Expenses: ${doc.extractedData?.expenses?.value || 0}</div>
                    <div>Assets: ${doc.extractedData?.balanceSheet?.assets || 0}</div>
                  </div>

                  {doc.extractedData?.confidence < 50 && (
                    <div className="mt-2 flex items-center space-x-1">
                      <AlertCircle className="h-3 w-3 text-amber-500" />
                      <span className="text-xs text-amber-600">Low confidence - manual review recommended</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <EvaluationForm initialData={extractedData} />

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded text-xs">
            <strong>Debug - Extracted Data Length:</strong> {extractedData.length}<br/>
            <strong>Has Document Data:</strong> {hasDocumentData.toString()}<br/>
            <strong>Sample Data:</strong> {JSON.stringify(extractedData[0]?.extractedData, null, 2)}
          </div>
        )}
      </div>
    </div>
  )
}

export default function OnboardingManualPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-background to-secondary pt-20 pb-8">
        <div className="container mx-auto px-4 text-center">
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
      </div>}>
        <ManualPageContent />
      </Suspense>
    </ProtectedRoute>
  )
}