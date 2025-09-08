'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, PenTool, Upload, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

interface InputMethodChoiceProps {
  onMethodSelect?: (method: 'manual' | 'document_upload') => void
}

export default function InputMethodChoice({ onMethodSelect }: InputMethodChoiceProps) {
  const router = useRouter()
  const { user, updateProfile } = useAuthStore()
  const [selectedMethod, setSelectedMethod] = useState<'manual' | 'document_upload' | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleMethodSelect = async (method: 'manual' | 'document_upload') => {
    setSelectedMethod(method)
    setIsLoading(true)

    try {
      // Save preference to user profile if user exists
      if (user) {
        await updateProfile({ inputMethod: method } as any)
      }

      // Call optional callback
      onMethodSelect?.(method)

      // Navigate based on selection
      if (method === 'manual') {
        router.push('/onboarding/manual')
      } else {
        router.push('/onboarding/document-upload')
      }
    } catch (error) {
      console.error('Failed to save preference:', error)
      // Continue anyway - don't block user flow
      if (method === 'manual') {
        router.push('/onboarding/manual')
      } else {
        router.push('/onboarding/document-upload')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Choose Your Input Method</CardTitle>
          <CardDescription className="text-lg">
            Select how you&apos;d like to provide your business information for evaluation
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Manual Input Option */}
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
            selectedMethod === 'manual' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
          onClick={() => handleMethodSelect('manual')}
        >
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
              <PenTool className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl">Manual Input</CardTitle>
            <CardDescription>
              Enter your business information step-by-step through guided forms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Step-by-step guided process</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Complete control over data entry</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Built-in validation and guidance</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Auto-save progress</span>
              </div>
            </div>
            <div className="pt-2">
              <div className="text-xs text-muted-foreground">
                <strong>Best for:</strong> First-time users, businesses without ready documents, or those who prefer guided input
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Upload Option */}
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
            selectedMethod === 'document_upload' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
          onClick={() => handleMethodSelect('document_upload')}
        >
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
              <Upload className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-xl">Document Upload</CardTitle>
            <CardDescription>
              Upload your financial documents and let AI extract the information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>AI-powered data extraction</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Supports PDF, Excel, and images</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Faster than manual entry</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Review and edit extracted data</span>
              </div>
            </div>
            <div className="pt-2">
              <div className="text-xs text-muted-foreground">
                <strong>Best for:</strong> Businesses with digital financial statements, tax returns, or bank statements ready
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <Card>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold mb-2 flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Supported Document Types</span>
              </h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Financial statements (PDF, Excel)</li>
                <li>• Tax returns (PDF)</li>
                <li>• Bank statements (PDF, Excel)</li>
                <li>• Profit & loss reports</li>
                <li>• Balance sheets</li>
                <li>• Cash flow statements</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">File Requirements</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Maximum file size: 50MB</li>
                <li>• Clear, readable documents</li>
                <li>• Recent financial data preferred</li>
                <li>• Multiple files can be uploaded</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> You can always switch between methods in your settings. 
              Your preference will be saved for future evaluations.
            </p>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>Saving preference...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}