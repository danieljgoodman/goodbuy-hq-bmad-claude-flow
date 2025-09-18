import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { ExportData } from '@/types/dashboard'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ExportData & { userId: string }
    const { evaluations, filters, format, includeCharts, userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!evaluations || evaluations.length === 0) {
      return NextResponse.json(
        { error: 'No evaluation data to export' },
        { status: 400 }
      )
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `dashboard-export-${timestamp}.${format}`

    let exportUrl: string
    let fileContent: string | Buffer

    if (format === 'csv') {
      fileContent = generateCSV(evaluations)
      exportUrl = await uploadToStorage(filename, fileContent, 'text/csv')
    } else if (format === 'pdf') {
      fileContent = await generatePDF(evaluations, filters, includeCharts)
      exportUrl = await uploadToStorage(filename, fileContent, 'application/pdf')
    } else {
      return NextResponse.json(
        { error: 'Invalid export format. Use "csv" or "pdf"' },
        { status: 400 }
      )
    }

    // Save export record
    await saveExportRecord({
      userId,
      filename,
      format,
      downloadUrl: exportUrl,
      evaluationCount: evaluations.length
    })

    return NextResponse.json({
      success: true,
      downloadUrl: exportUrl,
      filename,
      format,
      evaluationCount: evaluations.length,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Export API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    )
  }
}

function generateCSV(evaluations: any[]): string {
  const headers = [
    'ID',
    'Created At',
    'Status',
    'Business Name',
    'Annual Revenue',
    'Net Income',
    'Health Score',
    'Weighted Valuation',
    'Income Based Valuation',
    'Asset Based Valuation',
    'Market Based Valuation'
  ]

  const rows = evaluations.map(evaluation => {
    const valuations = evaluation.valuations || {}
    const businessData = evaluation.businessData || evaluation.business_data || {}
    
    return [
      evaluation.id || '',
      evaluation.createdAt || evaluation.created_at || '',
      evaluation.status || '',
      businessData.businessName || businessData.business_name || '',
      businessData.annualRevenue || businessData.annual_revenue || 0,
      businessData.netIncome || businessData.net_income || 0,
      evaluation.healthScore || evaluation.health_score || 0,
      typeof valuations.weighted === 'object' ? valuations.weighted?.value || 0 : valuations.weighted || 0,
      typeof valuations.income === 'object' ? valuations.income?.value || 0 : valuations.income || 0,
      typeof valuations.asset === 'object' ? valuations.asset?.value || 0 : valuations.asset || 0,
      typeof valuations.market === 'object' ? valuations.market?.value || 0 : valuations.market || 0
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => 
      typeof cell === 'string' && cell.includes(',') 
        ? `"${cell.replace(/"/g, '""')}"` 
        : cell
    ).join(','))
  ].join('\n')

  return csvContent
}

async function generatePDF(evaluations: any[], filters: any, includeCharts: boolean): Promise<Buffer> {
  // For now, return a simple PDF placeholder
  // In a real implementation, you'd use a library like Puppeteer or jsPDF
  const pdfContent = `
    Business Dashboard Export Report
    Generated: ${new Date().toLocaleString()}
    
    Filters Applied:
    - Date Range: ${filters.dateRange?.start || 'N/A'} to ${filters.dateRange?.end || 'N/A'}
    - Evaluation Types: ${filters.evaluationTypes?.join(', ') || 'All'}
    - Business Categories: ${filters.businessCategories?.join(', ') || 'All'}
    
    Summary:
    - Total Evaluations: ${evaluations.length}
    - Completed: ${evaluations.filter(e => e.status === 'completed').length}
    - Processing: ${evaluations.filter(e => e.status === 'processing').length}
    - Failed: ${evaluations.filter(e => e.status === 'failed').length}
    
    ${includeCharts ? 'Charts and visualizations would be included here in a real implementation.' : ''}
    
    Evaluation Details:
    ${evaluations.map((evaluation, index) => `
    ${index + 1}. Evaluation ${evaluation.id}
       Created: ${evaluation.createdAt || evaluation.created_at}
       Status: ${evaluation.status}
       Health Score: ${evaluation.healthScore || evaluation.health_score || 'N/A'}
       Valuation: $${typeof evaluation.valuations?.weighted === 'object' 
         ? evaluation.valuations.weighted?.value || 0 
         : evaluation.valuations?.weighted || 0}
    `).join('\n')}
  `

  // Return as buffer for now - in real implementation, generate actual PDF
  return Buffer.from(pdfContent, 'utf-8')
}

async function uploadToStorage(filename: string, content: string | Buffer, mimeType: string): Promise<string> {
  // Save to public directory for now (in production, use cloud storage)
  const publicDir = join(process.cwd(), 'public', 'exports')

  // Create exports directory if it doesn't exist
  if (!existsSync(publicDir)) {
    await mkdir(publicDir, { recursive: true })
  }

  const filePath = join(publicDir, filename)
  await writeFile(filePath, content)

  // Return public URL path
  return `/exports/${filename}`
}

async function saveExportRecord(record: {
  userId: string
  filename: string
  format: string
  downloadUrl: string
  evaluationCount: number
}) {
  // Save export record using Prisma (if you have an ExportHistory model)
  // For now, just log it
  console.log('Export record:', {
    userId: record.userId,
    filename: record.filename,
    format: record.format,
    downloadUrl: record.downloadUrl,
    evaluationCount: record.evaluationCount,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
  })

  // TODO: If you want to track exports, add an ExportHistory model to schema.prisma
  // await prisma.exportHistory.create({
  //   data: {
  //     userId: record.userId,
  //     filename: record.filename,
  //     format: record.format,
  //     downloadUrl: record.downloadUrl,
  //     evaluationCount: record.evaluationCount,
  //     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  //   }
  // })
}