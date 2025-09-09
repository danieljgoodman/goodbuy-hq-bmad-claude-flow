import { ReportService } from '@/lib/services/ReportService'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const previewReportSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  reportType: z.string().min(1, 'Report type is required'),
  sections: z.array(z.string()).min(1, 'At least one section is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, reportType, sections } = previewReportSchema.parse(body)

    const preview = await ReportService.generateReportPreview(
      userId,
      reportType,
      sections
    )

    return NextResponse.json({
      success: true,
      preview
    })
  } catch (error) {
    console.error('Error generating report preview:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate report preview',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}