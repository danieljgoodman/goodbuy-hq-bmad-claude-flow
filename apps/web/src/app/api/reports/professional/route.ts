import { ReportService } from '@/lib/services/ReportService'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const generateReportSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  reportType: z.enum(['executive', 'investor', 'comprehensive', 'custom']),
  title: z.string().optional(),
  sections: z.array(z.string()).optional(),
  includeExecutiveSummary: z.boolean().default(true),
  customizations: z.record(z.any()).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      reportType,
      title,
      sections,
      includeExecutiveSummary,
      customizations
    } = generateReportSchema.parse(body)

    const report = await ReportService.generateProfessionalReport(
      userId,
      reportType,
      {
        title,
        sections,
        includeExecutiveSummary,
        customizations
      }
    )

    return NextResponse.json({
      success: true,
      report
    })
  } catch (error) {
    console.error('Error generating professional report:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate professional report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}