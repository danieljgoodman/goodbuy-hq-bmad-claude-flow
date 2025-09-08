import { NextRequest, NextResponse } from 'next/server'
import { DocumentService } from '@/lib/services/document-service'
import type { DocumentUpload } from '@/types'

// Simple in-memory store for processing results
// In production, this should be stored in a database
const processingResults = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { documentId, fileName, fileContent, fileType, userId, evaluationId } = body

    if (!documentId || !fileName || !fileContent) {
      return NextResponse.json(
        { error: 'Missing required fields: documentId, fileName, fileContent' },
        { status: 400 }
      )
    }

    // Convert base64 content back to File object for processing
    const fileBuffer = Buffer.from(fileContent, 'base64')
    const blob = new Blob([fileBuffer], { type: fileType || 'application/octet-stream' })
    const file = new File([blob], fileName, { type: fileType })

    // Create DocumentUpload object
    const documentUpload: DocumentUpload = {
      file,
      category: 'financial_statement', // Default category
      documentId,
      userId: userId || 'demo-user',
      evaluationId: evaluationId || 'demo-evaluation'
    }

    // Process the document using the existing service
    const processingResult = await DocumentService.processDocument(documentUpload)
    
    // Validate that we got meaningful processing results
    if (!processingResult || !processingResult.extractedData) {
      throw new Error('Document processing completed but no extracted data was returned')
    }
    
    console.log('🔍 Processing result validation:')
    console.log('  - Has extractedData:', !!processingResult.extractedData)
    console.log('  - Revenue value:', processingResult.extractedData.revenue?.value)
    console.log('  - Expenses value:', processingResult.extractedData.expenses?.value)
    console.log('  - Assets value:', processingResult.extractedData.balanceSheet?.assets)
    console.log('  - Overall confidence:', processingResult.extractedData.confidence)

    // Store the processing result for later retrieval
    processingResults.set(documentId, processingResult)
    console.log('💾 Stored processing result for document:', documentId)

    const response = {
      success: true,
      documentId,
      processingResult,
      status: 'completed'
    }

    console.log('🎉 API RETURNING SUCCESS RESPONSE with validation:')
    console.log('  - Document ID:', response.documentId)
    console.log('  - Has processing result:', !!response.processingResult)
    console.log('  - Processing result keys:', Object.keys(response.processingResult))
    console.log('  - Full response structure:', JSON.stringify(response, null, 2))
    
    return NextResponse.json(response)

  } catch (error) {
    console.error('Document processing error:', error)
    
    return NextResponse.json(
      { 
        error: 'Document processing failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'failed'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json(
        { error: 'Missing documentId parameter' },
        { status: 400 }
      )
    }

    console.log('🔍 GET request for document:', documentId)
    console.log('📦 Available processing results:', Array.from(processingResults.keys()))

    // Check if we have processing results for this document
    const storedResult = processingResults.get(documentId)
    
    if (storedResult) {
      console.log('✅ Found stored processing result for:', documentId)
      return NextResponse.json({
        documentId,
        status: 'completed',
        processingResult: storedResult,
        processingProgress: 100,
        message: 'Document processing completed successfully'
      })
    } else {
      console.log('❌ No processing result found for:', documentId)
      console.log('🔍 Available keys in memory:', Array.from(processingResults.keys()))
      
      // Return a more helpful error that indicates the issue
      return NextResponse.json({
        documentId,
        status: 'not_found',
        processingProgress: 0,
        error: 'Processing results lost from server memory. This is a known issue with the in-memory storage. Please try re-uploading the document.',
        availableResults: Array.from(processingResults.keys()).length
      }, { status: 404 })
    }

  } catch (error) {
    console.error('Status check error:', error)
    
    return NextResponse.json(
      { error: 'Failed to check processing status' },
      { status: 500 }
    )
  }
}