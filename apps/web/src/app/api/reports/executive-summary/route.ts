import { ReportService } from '@/lib/services/ReportService'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const generateSummarySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  sections: z.array(z.any()).optional(),
  analyticsData: z.any().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, sections, analyticsData } = generateSummarySchema.parse(body)

    // Get user data for summary generation
    const response = await fetch(`${request.nextUrl.origin}/api/analytics/dashboard?userId=${userId}`)
    const dashboardData = response.ok ? await response.json() : null

    // For now, we'll use mock user data since we don't have the full user object
    const mockUser = {
      id: userId,
      businessName: 'Sample Business',
      evaluations: [
        {
          id: 'eval_1',
          healthScore: 75,
          businessData: {
            businessName: 'Sample Business',
            industry: 'Technology',
            annualRevenue: 1000000
          },
          createdAt: new Date().toISOString()
        }
      ]
    }

    const executiveSummary = await ReportService.generateExecutiveSummary(
      mockUser,
      sections || [],
      analyticsData || dashboardData
    )

    return NextResponse.json({
      success: true,
      executiveSummary
    })
  } catch (error) {
    console.error('Error generating executive summary:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate executive summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}