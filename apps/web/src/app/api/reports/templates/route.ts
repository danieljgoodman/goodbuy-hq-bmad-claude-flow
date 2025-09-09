import { ReportService } from '@/lib/services/ReportService'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const templates = ReportService.getReportTemplates()

    return NextResponse.json({
      success: true,
      templates
    })
  } catch (error) {
    console.error('Error getting report templates:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get report templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}