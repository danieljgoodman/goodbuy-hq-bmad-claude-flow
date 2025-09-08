'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Upload, File, X, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DocumentUploadFile {
  file: File
  id: string
  category: 'financial_statement' | 'tax_return' | 'bank_statement' | 'other'
  description?: string
  uploadProgress?: number
  uploadStatus?: 'pending' | 'uploading' | 'completed' | 'error'
  errorMessage?: string
}

interface DocumentUploadProps {
  onUploadComplete?: (files: DocumentUploadFile[]) => void
  acceptedTypes?: string[]
  maxSize?: number
  className?: string
  // Legacy props for compatibility
  userId?: string
  evaluationId?: string
  onProcessingComplete?: (result: any) => void
  onSecureUploadComplete?: (doc: any) => void
  onError?: (error: string) => void
}

const DEFAULT_ACCEPTED_TYPES = [
  '.pdf', '.xlsx', '.xls', '.png', '.jpg', '.jpeg'
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

const FILE_TYPE_LABELS: Record<string, string> = {
  'financial_statement': 'Financial Statement',
  'tax_return': 'Tax Return',
  'bank_statement': 'Bank Statement',
  'other': 'Other Document'
}

export default function DocumentUpload({
  onUploadComplete,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxSize = MAX_FILE_SIZE,
  className,
  // Legacy props - just ignore them for now since they're for old functionality
  userId,
  evaluationId,
  onProcessingComplete,
  onSecureUploadComplete,
  onError
}: DocumentUploadProps) {
  const [files, setFiles] = useState<DocumentUploadFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Effect to notify parent when completed files change
  useEffect(() => {
    const completedFiles = files.filter(f => f.uploadStatus === 'completed')
    if (completedFiles.length > 0) {
      onUploadComplete?.(completedFiles)
    }
  }, [files]) // Remove onUploadComplete from dependencies to prevent infinite loop

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File "${file.name}" is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!acceptedTypes.some(type => type.toLowerCase() === fileExtension)) {
      return `File "${file.name}" is not a supported format. Supported formats: ${acceptedTypes.join(', ')}`
    }

    return null
  }, [acceptedTypes, maxSize])

  const categorizeFile = useCallback((fileName: string): DocumentUploadFile['category'] => {
    const name = fileName.toLowerCase()
    if (name.includes('tax') || name.includes('1040') || name.includes('return')) {
      return 'tax_return'
    }
    if (name.includes('bank') || name.includes('statement') || name.includes('checking') || name.includes('savings')) {
      return 'bank_statement'
    }
    if (name.includes('financial') || name.includes('balance') || name.includes('income') || name.includes('profit')) {
      return 'financial_statement'
    }
    return 'other'
  }, [])

  const handleFiles = useCallback((fileList: FileList | File[]) => {
    const newFiles: DocumentUploadFile[] = []
    const newErrors: string[] = []

    Array.from(fileList).forEach((file) => {
      const validationError = validateFile(file)
      if (validationError) {
        newErrors.push(validationError)
        return
      }

      // Check if file already exists
      const existingFile = files.find(f => f.file.name === file.name && f.file.size === file.size)
      if (existingFile) {
        newErrors.push(`File "${file.name}" is already selected.`)
        return
      }

      const documentFile: DocumentUploadFile = {
        file,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        category: categorizeFile(file.name),
        uploadStatus: 'pending'
      }
      newFiles.push(documentFile)
    })

    if (newErrors.length > 0) {
      setErrors(prev => [...prev, ...newErrors])
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles])
    }
  }, [files, validateFile, categorizeFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }, [handleFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFiles])

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  const updateFileCategory = useCallback((fileId: string, category: DocumentUploadFile['category']) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, category } : f))
  }, [])

  const updateFileDescription = useCallback((fileId: string, description: string) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, description } : f))
  }, [])

  const dismissError = useCallback((index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index))
  }, [])

  const simulateUpload = useCallback(async (file: DocumentUploadFile) => {
    console.log('🚀 STARTING UPLOAD for file:', file.file.name)
    
    // Update status to uploading
    setFiles(prev => prev.map(f => 
      f.id === file.id ? { ...f, uploadStatus: 'uploading', uploadProgress: 0 } : f
    ))

    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 200))
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, uploadProgress: progress } : f
        ))
      }

      // Convert file to base64 for API transmission
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1]) // Remove data:mime/type;base64, prefix
        }
        reader.onerror = reject
        reader.readAsDataURL(file.file)
      })

      // Call the processing API
      const response = await fetch('/api/documents/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: file.id,
          fileName: file.file.name,
          fileContent,
          fileType: file.file.type,
          userId: userId || 'demo-user',
          evaluationId: evaluationId || 'demo-evaluation'
        })
      })

      const result = await response.json()
      console.log('🔍 RAW API RESPONSE:', { status: response.status, ok: response.ok, result })
      
      if (!response.ok) {
        // Handle API error response (status 500, etc.)
        const errorMessage = result.details || result.error || `Processing failed: ${response.statusText}`
        throw new Error(errorMessage)
      }
      
      if (result.success) {
        console.log('✅ PROCESSING SUCCESSFUL - validating result data')
        console.log('🔍 Validating processing result:')
        console.log('  - Has processingResult:', !!result.processingResult)
        console.log('  - ProcessingResult keys:', result.processingResult ? Object.keys(result.processingResult) : 'none')
        console.log('  - Has extractedData:', !!(result.processingResult?.extractedData))
        
        if (result.processingResult?.extractedData) {
          const data = result.processingResult.extractedData
          console.log('  - Revenue:', data.revenue?.value || 0)
          console.log('  - Expenses:', data.expenses?.value || 0)
          console.log('  - Assets:', data.balanceSheet?.assets || 0)
          console.log('  - Confidence:', data.confidence || 0)
        }
        
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, uploadStatus: 'completed', uploadProgress: 100 } : f
        ))
        
        // Notify parent of successful processing with full result structure
        if (onProcessingComplete && result.processingResult) {
          console.log('🚀 CALLING onProcessingComplete callback with validated data')
          onProcessingComplete(result.processingResult)
        } else {
          console.error('❌ onProcessingComplete callback or result data missing!')
          console.error('  - Callback defined:', !!onProcessingComplete)
          console.error('  - Processing result:', !!result.processingResult)
        }
      } else {
        console.log('❌ PROCESSING FAILED - result.success is false')
        console.log('Full API response:', result)
        throw new Error(result.details || result.error || 'Processing failed')
      }

    } catch (error) {
      console.error('Document upload/processing error:', error)
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { 
          ...f, 
          uploadStatus: 'error', 
          uploadProgress: 0,
          errorMessage: error instanceof Error ? error.message : 'Upload failed. Please try again.' 
        } : f
      ))
      
      // Notify parent of error
      onError?.(error instanceof Error ? error.message : 'Upload failed')
    }
  }, [userId, evaluationId, onProcessingComplete, onError])

  const handleUploadAll = useCallback(async () => {
    const pendingFiles = files.filter(f => f.uploadStatus === 'pending')
    
    // Upload files in parallel
    await Promise.all(pendingFiles.map(simulateUpload))
    
    // Wait a bit for state updates to complete, then notify parent
    setTimeout(() => {
      setFiles(currentFiles => {
        const completedFiles = currentFiles.filter(f => f.uploadStatus === 'completed')
        onUploadComplete?.(completedFiles)
        return currentFiles
      })
    }, 100)
  }, [files, simulateUpload, onUploadComplete])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />
      case 'xlsx':
      case 'xls':
        return <File className="h-5 w-5 text-green-500" />
      default:
        return <File className="h-5 w-5 text-gray-500" />
    }
  }

  const pendingCount = files.filter(f => f.uploadStatus === 'pending').length
  const uploadingCount = files.filter(f => f.uploadStatus === 'uploading').length
  const completedCount = files.filter(f => f.uploadStatus === 'completed').length
  const errorCount = files.filter(f => f.uploadStatus === 'error').length

  return (
    <div className={cn("space-y-6", className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          "transition-all duration-200 cursor-pointer",
          isDragOver ? "border-primary bg-primary/5" : "border-dashed border-2"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="p-8 text-center">
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Upload Your Documents</h3>
          <p className="text-muted-foreground mb-4">
            Drag and drop files here, or click to select files
          </p>
          <p className="text-sm text-muted-foreground">
            Supports: {acceptedTypes.join(', ')} • Max {Math.round(maxSize / 1024 / 1024)}MB per file
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <Alert key={index} variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex justify-between items-center">
                <span>{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissError(index)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Uploaded Files ({files.length})</span>
              {pendingCount > 0 && (
                <Button onClick={handleUploadAll} className="ml-auto">
                  Upload All ({pendingCount})
                </Button>
              )}
            </CardTitle>
            {(completedCount > 0 || uploadingCount > 0 || errorCount > 0) && (
              <CardDescription>
                {completedCount > 0 && <span className="text-green-600">{completedCount} completed</span>}
                {uploadingCount > 0 && <span className="text-blue-600 ml-2">{uploadingCount} uploading</span>}
                {errorCount > 0 && <span className="text-red-600 ml-2">{errorCount} failed</span>}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {files.map((documentFile) => (
              <div key={documentFile.id} className="border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getFileIcon(documentFile.file.name)}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-sm font-medium truncate">
                        {documentFile.file.name}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(documentFile.file.size)}
                      </span>
                      {documentFile.uploadStatus === 'completed' && (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                      {documentFile.uploadStatus === 'error' && (
                        <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="secondary">
                        {FILE_TYPE_LABELS[documentFile.category]}
                      </Badge>
                    </div>
                    
                    {documentFile.uploadStatus === 'uploading' && (
                      <div className="mb-2">
                        <Progress value={documentFile.uploadProgress || 0} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Uploading... {documentFile.uploadProgress || 0}%
                        </p>
                      </div>
                    )}
                    
                    {documentFile.uploadStatus === 'error' && documentFile.errorMessage && (
                      <Alert variant="destructive" className="mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {documentFile.errorMessage}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(documentFile.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}