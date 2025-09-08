import { OpenAIService } from './openai-service'
import type { 
  DocumentUpload, 
  DocumentProcessingResult, 
  ExtractedFinancialData,
  DocumentIntelligence 
} from '@/types'
import type { Document, UploadProgress } from '@/types/document'

// Browser-compatible crypto utilities
const generateUUID = () => {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export class DocumentService {
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB (increased for financial docs)
  private static readonly ALLOWED_TYPES = ['pdf', 'excel', 'image', 'csv']
  private static readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/tiff'
  ];

  // Story 2.2: Secure Document Upload with Encryption and Virus Scanning
  static async uploadSecureDocument(
    file: File,
    userId: string,
    evaluationId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<Document> {
    // Validate file
    const validation = this.validateDocumentSecurity(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const documentId = generateUUID();
    const encryptionKey = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    
    // Step 1: Simulated upload process
    onProgress?.({
      loaded: 0,
      total: file.size,
      percentage: 0,
      stage: 'uploading'
    });

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 500));

    onProgress?.({
      loaded: file.size * 0.2,
      total: file.size,
      percentage: 20,
      stage: 'encrypting'
    });

    // Simulate encryption delay
    await new Promise(resolve => setTimeout(resolve, 300));

    onProgress?.({
      loaded: file.size * 0.6,
      total: file.size,
      percentage: 60,
      stage: 'scanning'
    });

    // Simulate virus scanning
    await this.performVirusScan(await file.arrayBuffer());

    onProgress?.({
      loaded: file.size * 0.8,
      total: file.size,
      percentage: 80,
      stage: 'processing'
    });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create document record (in-memory for demo)
    const document: Document = {
      id: documentId,
      userId,
      evaluationId,
      filename: `${documentId}_${Date.now()}_${file.name}`,
      originalName: file.name,
      fileType: this.getSecureFileType(file.type),
      fileSize: file.size,
      uploadedAt: new Date(),
      processingStatus: 'completed',
      encryptionKey,
      storageLocation: `demo/${documentId}`,
      documentType: this.inferDocumentType(file.name),
      redFlags: []
    };

    onProgress?.({
      loaded: file.size,
      total: file.size,
      percentage: 100,
      stage: 'complete'
    });

    console.log('✅ Secure document upload completed:', document.originalName);
    return document;
  }

  // Story 2.2: Enhanced Document Upload Validation with Security
  static validateDocumentSecurity(file: File): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds ${this.MAX_FILE_SIZE / (1024 * 1024)}MB limit`
      }
    }

    // Check file type with MIME type validation
    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: 'File type not supported. Please upload PDF, Excel, CSV, or image files.'
      }
    }

    // Additional security checks
    const fileName = file.name.toLowerCase();
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.com', '.pif'];
    
    if (suspiciousExtensions.some(ext => fileName.endsWith(ext))) {
      return {
        isValid: false,
        error: 'Potentially dangerous file type detected.'
      }
    }

    return { isValid: true }
  }

  // Legacy validation method (keeping for backwards compatibility)
  static validateDocument(file: File): { isValid: boolean; error?: string } {
    return this.validateDocumentSecurity(file);
  }

  // Epic 2: File Type Detection
  private static getFileType(file: File): 'pdf' | 'excel' | 'image' | 'csv' | 'unknown' {
    const extension = file.name.split('.').pop()?.toLowerCase()
    const mimeType = file.type

    // PDF files
    if (extension === 'pdf' || mimeType === 'application/pdf') {
      return 'pdf'
    }

    // Excel files
    if (
      extension === 'xlsx' || 
      extension === 'xls' || 
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel'
    ) {
      return 'excel'
    }

    // CSV files
    if (extension === 'csv' || mimeType === 'text/csv') {
      return 'csv' // Treat CSV separately from excel
    }

    // Image files
    if (
      extension === 'png' || 
      extension === 'jpg' || 
      extension === 'jpeg' || 
      extension === 'gif' ||
      mimeType.startsWith('image/')
    ) {
      return 'image'
    }

    return 'unknown'
  }

  // Epic 2: Document Processing Pipeline with Robust Error Handling
  static async processDocument(documentUpload: DocumentUpload): Promise<DocumentProcessingResult> {
    const startTime = Date.now()
    
    try {
      console.log('🚀 Starting document processing for:', documentUpload.file.name)
      
      // Validate document
      const validation = this.validateDocument(documentUpload.file)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      // Determine file type for processing
      const fileType = this.getFileType(documentUpload.file)
      console.log('📝 Processing', fileType, 'document with enhanced extraction pipeline')
      
      let documentContent = ''
      let extractionMethod = 'unknown'
      
      // Extract text content with robust error handling for each file type
      try {
        documentContent = await this.extractTextFromFile(documentUpload.file)
        extractionMethod = `${fileType} text extraction`
        
        console.log('🔍 Text extraction successful:')
        console.log('  - Content length:', documentContent.length)
        console.log('  - First 200 chars:', documentContent.substring(0, 200))
        console.log('  - Contains financial keywords:', this.hasFinancialKeywords(documentContent))
      } catch (textError) {
        console.error('⚠️ Primary text extraction failed:', textError)
        
        // For images and PDFs, try OpenAI Vision as fallback
        if (fileType === 'image' || fileType === 'pdf') {
          try {
            console.log('🔄 Trying OpenAI Vision as fallback...')
            const { OpenAIService } = await import('./openai-service')
            const arrayBuffer = await documentUpload.file.arrayBuffer()
            const visionData = await OpenAIService.extractFinancialDataWithVision(arrayBuffer, fileType)
            
            // Convert vision results to text format
            documentContent = `VISION-EXTRACTED DATA FROM ${fileType.toUpperCase()}:\n`
            documentContent += `Revenue: $${visionData.revenue.value}\n`
            documentContent += `Expenses: $${visionData.expenses.value}\n` 
            documentContent += `Cash Flow: $${visionData.cashFlow.value}\n`
            documentContent += `Assets: $${visionData.balanceSheet.assets}\n`
            documentContent += `Liabilities: $${visionData.balanceSheet.liabilities}\n`
            
            extractionMethod = `${fileType} Vision API fallback`
            console.log('✅ Vision API fallback successful')
          } catch (visionError) {
            console.error('❌ Vision API fallback also failed:', visionError)
            throw new Error(`Unable to extract data from ${fileType} file "${documentUpload.file.name}". Both text extraction and vision processing failed. ${textError instanceof Error ? textError.message : ''}`)
          }
        } else {
          // For Excel/CSV files, no vision fallback available
          throw textError
        }
      }
      
      // Validate minimum content requirements
      if (documentContent.length < 10) {
        throw new Error(`Document "${documentUpload.file.name}" contains insufficient readable content for analysis. Please ensure the document contains clear financial data.`)
      }
      
      let extractedData
      let aiModel = 'none'
      
      // AI extraction with robust error handling
      try {
        const { OpenAIService } = await import('./openai-service')
        extractedData = await OpenAIService.extractFinancialData(
          documentContent, 
          fileType === 'unknown' ? 'pdf' : fileType === 'csv' ? 'excel' : fileType
        )
        aiModel = 'gpt-4o-mini'
        
        console.log('🔍 AI extraction successful:')
        console.log('   - Revenue extracted:', extractedData.revenue.value)
        console.log('   - Expenses extracted:', extractedData.expenses.value) 
        console.log('   - Assets extracted:', extractedData.balanceSheet.assets)
        console.log('   - Overall confidence:', extractedData.confidence)
      } catch (aiError) {
        console.error('⚠️ OpenAI extraction failed:', aiError)
        
        // Create basic structured data from text analysis (NO FAKE DATA)
        extractedData = this.createBasicExtractedDataFromText(documentContent, documentUpload.file.name)
        aiModel = 'text-pattern-analysis'
        
        console.log('🔄 Using text pattern analysis as fallback')
        console.log('   - Revenue found:', extractedData.revenue.value)
        console.log('   - Expenses found:', extractedData.expenses.value)
      }
      
      // Validate that we have meaningful extracted data
      const hasRealData = extractedData.revenue.value > 0 || 
                         extractedData.expenses.value > 0 || 
                         extractedData.balanceSheet.assets > 0 ||
                         Math.abs(extractedData.cashFlow.value) > 0
      
      if (!hasRealData) {
        console.warn('⚠️ No meaningful financial data found in document')
        extractedData.dataQualityFlags.push('No financial data detected - please verify document contains financial statements')
        extractedData.missingData.push('All financial metrics')
      }

      // Perform quality assessment
      const qualityAssessment = this.assessDataQuality(extractedData)
      const processingTime = Date.now() - startTime

      const result: DocumentProcessingResult = {
        id: generateUUID(),
        originalFileName: documentUpload.file.name,
        extractedData,
        qualityAssessment,
        processingMetadata: {
          processingTime,
          aiModel,
          confidence: extractedData.confidence,
          extractionMethod
        }
      }
      
      console.log('✅ Document processing completed successfully')
      return result
      
    } catch (error) {
      console.error('❌ Document processing failed:', error)
      const processingTime = Date.now() - startTime
      
      // Return a processing result that indicates failure but doesn't use fake data
      const failedResult: DocumentProcessingResult = {
        id: generateUUID(),
        originalFileName: documentUpload.file.name,
        extractedData: {
          source: "manual",
          extractionDate: new Date(),
          revenue: { value: 0, confidence: 0, source: "Failed Processing", breakdown: [], timeFrame: 'annual' },
          expenses: { value: 0, confidence: 0, source: "Failed Processing", breakdown: [] },
          cashFlow: { value: 0, confidence: 0, source: "Failed Processing", breakdown: [] },
          balanceSheet: { assets: 0, liabilities: 0, confidence: 0, source: "Failed Processing" },
          confidence: 0,
          inconsistencies: [],
          missingData: ['Processing failed - unable to extract financial data'],
          dataQualityFlags: [
            'Processing error occurred', 
            `Failed to process ${this.getFileType(documentUpload.file)} file`,
            error instanceof Error ? error.message : 'Unknown processing error'
          ]
        },
        qualityAssessment: {
          overallScore: 0,
          completeness: 0,
          accuracy: 0,
          consistency: 0,
          flags: ['Processing failed', error instanceof Error ? error.message : 'Unknown error']
        },
        processingMetadata: {
          processingTime,
          aiModel: 'none',
          confidence: 0,
          extractionMethod: 'failed'
        }
      }
      
      // Still return a result so the user can see what went wrong
      return failedResult
    }
  }

  // Epic 2: Text Extraction from Different File Types
  private static async extractTextFromFile(file: File): Promise<string> {
    const fileType = this.getFileType(file)

    switch (fileType) {
      case 'pdf':
        return this.extractTextFromPDF(file)
      case 'excel':
        return this.extractTextFromExcel(file)
      case 'csv':
        return this.extractTextFromCSV(file)
      case 'image':
        return this.extractTextFromImage(file)
      default:
        // Fallback: try to read as text
        return this.extractTextFromGeneric(file)
    }
  }

  // Epic 2: PDF Text Extraction using pdf-parse (Node.js compatible)
  private static async extractTextFromPDF(file: File): Promise<string> {
    console.log('🔍 Extracting text from PDF using pdf-parse:', file.name)
    
    try {
      // Dynamic import for pdf-parse (better Next.js compatibility)
      let pdfParse
      try {
        // Try dynamic import first (recommended for Next.js)
        const pdfParseModule = await import('pdf-parse')
        pdfParse = pdfParseModule.default || pdfParseModule
        console.log('📦 Successfully loaded pdf-parse via dynamic import')
      } catch (importError) {
        console.log('📦 Dynamic import failed, trying require:', (importError as Error).message)
        try {
          pdfParse = require('pdf-parse')
          console.log('📦 Successfully loaded pdf-parse via require')
        } catch (requireError) {
          console.error('❌ Both import methods failed:')
          console.error('  - Import error:', (importError as Error).message)
          console.error('  - Require error:', (requireError as Error).message)
          throw new Error('pdf-parse library is not available. Please ensure it is properly installed.')
        }
      }
      
      // Convert File to Buffer for pdf-parse
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      console.log('📄 Processing PDF buffer:', buffer.length, 'bytes')
      
      // Use pdf-parse to extract text content with options for better text extraction
      const options = {
        // Use built-in PDF parser (no external dependencies)
        version: 'v1.10.100',
        normalizeWhitespace: true,
        disableCombineTextItems: false
      }
      
      const pdfData = await pdfParse(buffer, options)
      
      console.log('✅ pdf-parse extraction results:')
      console.log('  - Pages found:', pdfData.numpages)
      console.log('  - Total text length:', pdfData.text.length)
      console.log('  - Info:', pdfData.info?.Title || 'No title')
      console.log('  - Text preview (first 400 chars):')
      console.log('   ', JSON.stringify(pdfData.text.substring(0, 400)))
      
      // Validate extracted text
      if (!pdfData.text || pdfData.text.trim().length < 10) {
        throw new Error('PDF contains no readable text content - may be image-based, encrypted, or corrupted')
      }
      
      // Clean and normalize the text
      let cleanedText = pdfData.text
        .trim()
        .replace(/\s+/g, ' ')  // Normalize whitespace
        .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')  // Remove control characters
      
      console.log('✅ PDF text extraction completed successfully')
      console.log('   - Final text length:', cleanedText.length)
      console.log('   - Contains financial keywords:', this.hasFinancialKeywords(cleanedText))
      
      return cleanedText
      
    } catch (error) {
      console.error('❌ PDF extraction failed:', error)
      
      if (error instanceof Error) {
        // More specific error messages
        if (error.message.includes('Invalid PDF') || error.message.includes('PDF header')) {
          throw new Error(`Invalid PDF file "${file.name}". The file may be corrupted or not a valid PDF.`)
        }
        if (error.message.includes('Password') || error.message.includes('encrypted')) {
          throw new Error(`PDF "${file.name}" is password protected or encrypted. Please provide an unprotected version.`)
        }
        if (error.message.includes('pdf-parse')) {
          throw new Error(`PDF processing library unavailable. Unable to process "${file.name}".`)
        }
      }
      
      throw new Error(`Failed to extract text from PDF "${file.name}". ${error instanceof Error ? error.message : 'The PDF may be image-based, encrypted, or corrupted. Please ensure the PDF contains selectable text.'}`)
    }
  }

  // Epic 2: Excel Text Extraction
  private static async extractTextFromExcel(file: File): Promise<string> {
    try {
      // Dynamic import of xlsx library for Excel processing
      let XLSX
      try {
        const xlsxModule = await import('xlsx')
        XLSX = xlsxModule.default || xlsxModule
        console.log('📦 Successfully loaded xlsx library')
      } catch (importError) {
        console.error('❌ xlsx library not available:', importError)
        // Fallback: Ask user to convert to CSV
        throw new Error(`Excel processing requires xlsx library. Please install it or convert "${file.name}" to CSV format and retry.`)
      }
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      console.log('📊 Processing Excel file:', file.name, 'Size:', arrayBuffer.byteLength, 'bytes')
      
      // Parse the Excel workbook
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
      console.log('📊 Excel sheets found:', workbook.SheetNames.length, 'sheets:', workbook.SheetNames)
      
      let extractedText = ''
      
      // Process all sheets, prioritizing ones that might contain financial data
      const prioritySheets = workbook.SheetNames.filter(name => 
        /financial|income|revenue|expense|balance|statement|summary|p&l|profit/i.test(name)
      )
      const otherSheets = workbook.SheetNames.filter(name => 
        !/financial|income|revenue|expense|balance|statement|summary|p&l|profit/i.test(name)
      )
      
      const sheetsToProcess = [...prioritySheets, ...otherSheets]
      
      for (const sheetName of sheetsToProcess) {
        console.log(`📋 Processing sheet: "${sheetName}"`)
        const worksheet = workbook.Sheets[sheetName]
        
        // Convert to CSV format (preserves structure)
        const csvData = XLSX.utils.sheet_to_csv(worksheet, { strip: false })
        
        if (csvData && csvData.trim().length > 10) {
          extractedText += `\n\n=== SHEET: ${sheetName} ===\n${csvData}\n`
          console.log(`✅ Extracted ${csvData.length} characters from "${sheetName}"`)
        } else {
          console.log(`⚠️ Sheet "${sheetName}" appears to be empty or contains minimal data`)
        }
      }
      
      if (extractedText.trim().length < 20) {
        throw new Error(`Excel file "${file.name}" contains no readable data. Please ensure the file contains financial data in recognizable formats.`)
      }
      
      console.log('✅ Excel text extraction completed successfully')
      console.log('   - Total text length:', extractedText.length)
      console.log('   - Contains financial keywords:', this.hasFinancialKeywords(extractedText))
      
      return extractedText.trim()
      
    } catch (error) {
      console.error('❌ Excel extraction failed:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('xlsx library')) {
          throw error // Re-throw library-specific errors
        }
        if (error.message.includes('invalid') || error.message.includes('corrupt')) {
          throw new Error(`Excel file "${file.name}" appears to be corrupted or invalid. Please try re-saving the file and uploading again.`)
        }
      }
      
      throw new Error(`Failed to extract data from Excel file "${file.name}". ${error instanceof Error ? error.message : 'The file may be corrupted, password-protected, or in an unsupported Excel format.'}`) 
    }
  }

  // Epic 2: CSV Text Extraction  
  private static async extractTextFromCSV(file: File): Promise<string> {
    try {
      const text = await file.text()
      console.log('✅ CSV file processed:', text.length, 'characters')
      
      if (text.trim().length < 10) {
        throw new Error('CSV file appears to be empty or contains no readable content')
      }
      
      return text
    } catch (error) {
      console.error('❌ CSV extraction failed:', error)
      throw new Error(`Failed to extract text from CSV "${file.name}". ${error instanceof Error ? error.message : 'Please ensure the file is a valid CSV.'}`)
    }
  }

  // Epic 2: Image Text Extraction (OCR)
  private static async extractTextFromImage(file: File): Promise<string> {
    try {
      console.log('🖼️ Starting OCR processing for image:', file.name)
      
      // Check if OpenAI API is available
      const { config } = await import('@/lib/config')
      if (!config.openai.apiKey || config.openai.apiKey === 'placeholder-openai-api-key') {
        throw new Error('OpenAI API key required for image processing. Please configure OPENAI_API_KEY environment variable.')
      }
      
      // Use OpenAI Vision API for OCR
      const { OpenAIService } = await import('./openai-service')
      const arrayBuffer = await file.arrayBuffer()
      
      console.log('🤖 Using OpenAI Vision API for OCR...')
      const extractedData = await OpenAIService.extractFinancialDataWithVision(arrayBuffer, 'image')
      
      // Convert the structured data back to text format for consistency
      let textContent = `EXTRACTED FINANCIAL DATA FROM IMAGE "${file.name}":\n\n`
      
      if (extractedData.revenue.value > 0) {
        textContent += `Revenue: $${extractedData.revenue.value.toLocaleString()}\n`
      }
      if (extractedData.expenses.value > 0) {
        textContent += `Expenses: $${extractedData.expenses.value.toLocaleString()}\n`
      }
      if (extractedData.cashFlow.value !== 0) {
        textContent += `Cash Flow: $${extractedData.cashFlow.value.toLocaleString()}\n`
      }
      if (extractedData.balanceSheet.assets > 0) {
        textContent += `Assets: $${extractedData.balanceSheet.assets.toLocaleString()}\n`
      }
      if (extractedData.balanceSheet.liabilities > 0) {
        textContent += `Liabilities: $${extractedData.balanceSheet.liabilities.toLocaleString()}\n`
      }
      
      // Add any additional text content if available
      if (extractedData.inconsistencies.length > 0) {
        textContent += `\nInconsistencies: ${extractedData.inconsistencies.join(', ')}\n`
      }
      
      if (extractedData.missingData.length > 0) {
        textContent += `\nMissing Data: ${extractedData.missingData.join(', ')}\n`
      }
      
      textContent += `\nExtraction Confidence: ${extractedData.confidence}%\n`
      textContent += `Data Quality Flags: ${extractedData.dataQualityFlags.join(', ')}\n`
      
      if (textContent.length < 50) {
        throw new Error(`No readable financial data found in image "${file.name}". Please ensure the image contains clear financial statements or data tables.`)
      }
      
      console.log('✅ Image OCR extraction completed successfully')
      console.log('   - Extracted text length:', textContent.length)
      console.log('   - Revenue found:', extractedData.revenue.value)
      console.log('   - Overall confidence:', extractedData.confidence)
      
      return textContent
      
    } catch (error) {
      console.error('❌ Image OCR extraction failed:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw error // Re-throw API key errors
        }
        if (error.message.includes('quota') || error.message.includes('rate limit')) {
          throw error // Re-throw API limit errors  
        }
      }
      
      throw new Error(`Failed to extract text from image "${file.name}". ${error instanceof Error ? error.message : 'Please ensure the image is clear and contains readable financial data, or convert to PDF/Excel format for better accuracy.'}`) 
    }
  }

  // Epic 2: Generic Text Extraction Fallback
  private static async extractTextFromGeneric(file: File): Promise<string> {
    try {
      const text = await file.text()
      
      if (text.trim().length < 10) {
        throw new Error(`File "${file.name}" contains no readable text content`)
      }
      
      return text
    } catch (error) {
      console.error('Generic text extraction error:', error)
      throw new Error(`Unable to extract text from file "${file.name}". Please ensure the file contains readable text content.`)
    }
  }

  // Epic 2: Data Quality Assessment
  private static assessDataQuality(extractedData: ExtractedFinancialData): {
    overallScore: number
    completeness: number
    accuracy: number
    consistency: number
    flags: string[]
  } {
    let completeness = 0
    let accuracy = 0
    let consistency = 0
    const flags: string[] = []

    // Assess completeness (what data was extracted)
    if (extractedData.revenue.value > 0) completeness += 25
    if (extractedData.expenses.value > 0) completeness += 25
    if (extractedData.cashFlow.value !== 0) completeness += 25
    if (extractedData.balanceSheet.assets > 0 || extractedData.balanceSheet.liabilities > 0) completeness += 25

    // Assess accuracy based on confidence scores
    const avgConfidence = (
      extractedData.revenue.confidence +
      extractedData.expenses.confidence +
      extractedData.cashFlow.confidence +
      extractedData.balanceSheet.confidence
    ) / 4
    accuracy = avgConfidence

    // Assess consistency (basic checks)
    consistency = 80 // Base consistency score

    // Check for inconsistencies
    if (extractedData.revenue.value > 0 && extractedData.expenses.value > extractedData.revenue.value * 1.5) {
      consistency -= 20
      flags.push('Expenses significantly higher than revenue')
    }

    if (extractedData.balanceSheet.liabilities > extractedData.balanceSheet.assets * 2) {
      consistency -= 15
      flags.push('High debt-to-asset ratio detected')
    }

    // Add flags from extracted data
    flags.push(...extractedData.dataQualityFlags)

    if (extractedData.inconsistencies.length > 0) {
      consistency -= extractedData.inconsistencies.length * 10
      flags.push(...extractedData.inconsistencies)
    }

    if (extractedData.missingData.length > 0) {
      completeness -= extractedData.missingData.length * 5
      flags.push(...extractedData.missingData.map(item => `Missing: ${item}`))
    }

    // Calculate overall score
    const overallScore = (completeness + accuracy + consistency) / 3

    return {
      overallScore: Math.max(0, Math.min(100, overallScore)),
      completeness: Math.max(0, Math.min(100, completeness)),
      accuracy: Math.max(0, Math.min(100, accuracy)),
      consistency: Math.max(0, Math.min(100, consistency)),
      flags
    }
  }

  // Epic 2: Utility Methods
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  private static hasFinancialKeywords(text: string): boolean {
    const keywords = [
      'revenue', 'income', 'expenses', 'assets', 'liabilities', 'cash flow',
      'profit', 'loss', 'balance sheet', 'statement', 'financial',
      'accounts payable', 'accounts receivable', 'cost of goods', 'operating',
      'net income', 'gross', 'ebitda', 'depreciation', 'equity', 'sales',
      'total revenue', 'total expenses', 'total assets', 'total liabilities',
      'net profit', 'operating income', 'tax', 'interest', 'dividend'
    ]
    
    const lowerText = text.toLowerCase()
    return keywords.some(keyword => lowerText.includes(keyword))
  }
  
  // NEW: Create basic extracted data from text patterns (NO FAKE DATA)
  private static createBasicExtractedDataFromText(text: string, fileName: string): ExtractedFinancialData {
    console.log('🔍 Performing text pattern analysis on:', fileName)
    
    // Look for dollar amounts and financial keywords in the text
    const dollarAmounts = text.match(/\$[\d,]+(?:\.\d{2})?/g) || []
    const numberAmounts = text.match(/(?:^|\s)(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)(?:\s|$)/g) || []
    
    const allAmounts = [...dollarAmounts.map(a => a.replace('$', '')), ...numberAmounts]
      .map(a => parseFloat(a.replace(/,/g, '')))
      .filter(n => n > 100) // Filter out small numbers that are likely not financial figures
      .sort((a, b) => b - a) // Sort descending
    
    console.log('💰 Found potential financial amounts:', allAmounts.slice(0, 10))
    
    // Try to identify revenue
    let revenue = 0
    const revenuePattern = /(?:revenue|sales|income|total\s+revenue).*?\$?([\d,]+(?:\.\d{2})?)/i
    const revenueMatch = text.match(revenuePattern)
    if (revenueMatch) {
      revenue = parseFloat(revenueMatch[1].replace(/,/g, ''))
    } else if (allAmounts.length > 0) {
      // Use largest amount as potential revenue
      revenue = allAmounts[0]
    }
    
    // Try to identify expenses
    let expenses = 0
    const expensePattern = /(?:expenses|costs|operating\s+expenses|total\s+expenses).*?\$?([\d,]+(?:\.\d{2})?)/i
    const expenseMatch = text.match(expensePattern)
    if (expenseMatch) {
      expenses = parseFloat(expenseMatch[1].replace(/,/g, ''))
    } else if (allAmounts.length > 1) {
      // Use second largest as potential expenses
      expenses = allAmounts[1]
    }
    
    // Try to identify assets
    let assets = 0
    const assetPattern = /(?:assets|total\s+assets).*?\$?([\d,]+(?:\.\d{2})?)/i
    const assetMatch = text.match(assetPattern)
    if (assetMatch) {
      assets = parseFloat(assetMatch[1].replace(/,/g, ''))
    }
    
    // Try to identify liabilities
    let liabilities = 0
    const liabilityPattern = /(?:liabilities|total\s+liabilities|debt).*?\$?([\d,]+(?:\.\d{2})?)/i
    const liabilityMatch = text.match(liabilityPattern)
    if (liabilityMatch) {
      liabilities = parseFloat(liabilityMatch[1].replace(/,/g, ''))
    }
    
    const cashFlow = revenue - expenses
    
    // Determine confidence based on how much data we found
    let confidence = 0
    if (revenue > 0) confidence += 25
    if (expenses > 0) confidence += 25
    if (assets > 0) confidence += 25
    if (liabilities > 0) confidence += 25
    
    const result: ExtractedFinancialData = {
      source: "pdf",
      extractionDate: new Date(),
      revenue: {
        value: revenue,
        confidence: revenue > 0 ? 60 : 0,
        source: "Pattern Recognition",
        breakdown: [],
        timeFrame: 'annual'
      },
      expenses: {
        value: expenses,
        confidence: expenses > 0 ? 60 : 0,
        source: "Pattern Recognition",
        breakdown: []
      },
      cashFlow: {
        value: cashFlow,
        confidence: (revenue > 0 && expenses > 0) ? 50 : 0,
        source: "Pattern Recognition",
        breakdown: []
      },
      balanceSheet: {
        assets: assets,
        liabilities: liabilities,
        confidence: (assets > 0 || liabilities > 0) ? 50 : 0,
        source: "Pattern Recognition"
      },
      confidence,
      inconsistencies: [],
      missingData: [],
      dataQualityFlags: [
        'Text pattern analysis used',
        'AI extraction unavailable', 
        `Analyzed ${fileName}`,
        confidence > 50 ? 'Basic financial data detected' : 'Limited financial data detected'
      ]
    }
    
    console.log('📊 Text analysis results:')
    console.log('  - Revenue:', result.revenue.value)
    console.log('  - Expenses:', result.expenses.value)
    console.log('  - Assets:', result.balanceSheet.assets)
    console.log('  - Overall confidence:', result.confidence)
    
    return result
  }

  // Epic 2: Document Intelligence Creation
  static createDocumentIntelligence(
    processingResult: DocumentProcessingResult, 
    uploadDate: Date = new Date()
  ): DocumentIntelligence {
    const fileType = this.determineFileTypeFromName(processingResult.originalFileName)
    
    return {
      id: processingResult.id,
      fileName: processingResult.originalFileName,
      fileType,
      fileSize: 0, // Would be set from original file
      uploadDate,
      processingStatus: 'completed',
      extractedData: processingResult.extractedData,
      qualityScore: processingResult.qualityAssessment.overallScore,
      processingTime: processingResult.processingMetadata.processingTime,
      insights: this.generateInsights(processingResult),
      redFlags: this.generateRedFlags(processingResult)
    }
  }

  private static determineFileTypeFromName(fileName: string): 'pdf' | 'excel' | 'image' {
    const extension = fileName.split('.').pop()?.toLowerCase()
    if (extension === 'pdf') return 'pdf'
    if (['xlsx', 'xls', 'csv'].includes(extension || '')) return 'excel'
    return 'image'
  }

  private static generateInsights(processingResult: DocumentProcessingResult): string[] {
    const insights: string[] = []
    const data = processingResult.extractedData

    if (data.revenue.value > 0) {
      insights.push(`Revenue data successfully extracted: $${data.revenue.value.toLocaleString()}`)
    }

    if (data.expenses.breakdown.length > 0) {
      insights.push(`Expense breakdown identified with ${data.expenses.breakdown.length} categories`)
    }

    if (processingResult.qualityAssessment.overallScore > 80) {
      insights.push('High-quality data extraction with strong confidence levels')
    }

    if (data.balanceSheet.assets > 0 && data.balanceSheet.liabilities > 0) {
      const netWorth = data.balanceSheet.assets - data.balanceSheet.liabilities
      insights.push(`Net worth calculated: $${netWorth.toLocaleString()}`)
    }

    return insights
  }

  private static generateRedFlags(processingResult: DocumentProcessingResult): string[] {
    const redFlags: string[] = []
    const data = processingResult.extractedData

    // Quality-based red flags
    if (processingResult.qualityAssessment.overallScore < 50) {
      redFlags.push('Low extraction quality - manual review recommended')
    }

    // Financial red flags
    if (data.revenue.value > 0 && data.expenses.value > data.revenue.value * 1.2) {
      redFlags.push('Expenses exceed revenue by significant margin')
    }

    if (data.balanceSheet.liabilities > data.balanceSheet.assets) {
      redFlags.push('Liabilities exceed assets - negative net worth')
    }

    if (data.inconsistencies.length > 0) {
      redFlags.push(`${data.inconsistencies.length} data inconsistencies detected`)
    }

    // Confidence-based red flags
    const avgConfidence = (
      data.revenue.confidence + 
      data.expenses.confidence + 
      data.cashFlow.confidence + 
      data.balanceSheet.confidence
    ) / 4

    if (avgConfidence < 60) {
      redFlags.push('Low confidence in extracted data - verification needed')
    }

    return redFlags
  }

  // Story 2.2: Security Helper Methods
  private static async encryptFile(file: File, encryptionKey: string): Promise<ArrayBuffer> {
    const buffer = await file.arrayBuffer();
    // For now, simulate encryption by just returning the buffer
    // In production, use Web Crypto API for actual encryption
    return buffer;
  }

  private static async performVirusScan(buffer: ArrayBuffer): Promise<void> {
    // Simulate virus scanning delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In production, integrate with actual virus scanning service like ClamAV
    const view = new Uint8Array(buffer, 0, Math.min(1000, buffer.byteLength));
    const content = Array.from(view).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Simple heuristic checks (would be replaced with proper AV service)
    const suspiciousPatterns = ['4d5a90', '504b0304'];
    
    if (suspiciousPatterns.some(pattern => content.includes(pattern))) {
      console.log('File contains executable signatures - additional scrutiny required');
    }
  }

  private static getSecureFileType(mimeType: string): 'pdf' | 'excel' | 'csv' | 'image' {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'excel';
    if (mimeType === 'text/csv') return 'csv';
    if (mimeType.startsWith('image/')) return 'image';
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  private static inferDocumentType(filename: string): 'financial_statement' | 'tax_return' | 'bank_statement' | 'other' {
    const lower = filename.toLowerCase();
    if (lower.includes('tax') || lower.includes('1040') || lower.includes('return')) {
      return 'tax_return';
    }
    if (lower.includes('bank') || lower.includes('statement')) {
      return 'bank_statement';
    }
    if (lower.includes('financial') || lower.includes('income') || lower.includes('balance')) {
      return 'financial_statement';
    }
    return 'other';
  }

  private static async triggerProcessing(documentId: string): Promise<void> {
    try {
      await fetch('/api/documents/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId })
      });
    } catch (error) {
      console.error('Failed to trigger processing:', error);
    }
  }

  // Story 2.2: Document Management Methods (Simplified for demo)
  static async getSecureDocument(id: string, userId: string): Promise<Document | null> {
    // Demo implementation - in production would use database
    console.log('Getting secure document:', id, 'for user:', userId);
    return null;
  }

  static async getUserDocuments(userId: string, evaluationId?: string): Promise<Document[]> {
    // Demo implementation - in production would use database
    console.log('Getting documents for user:', userId, 'evaluation:', evaluationId);
    return [];
  }

  static async deleteSecureDocument(id: string, userId: string): Promise<boolean> {
    // Demo implementation - in production would use database
    console.log('Deleting document:', id, 'for user:', userId);
    return true;
  }
}