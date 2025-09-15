import { ReportService } from '@/lib/services/ReportService'
import { UserProfileRepository } from '@/lib/repositories/UserProfileRepository'
import { BusinessEvaluationRepository } from '@/lib/repositories/BusinessEvaluationRepository'
import { AnalyticsService } from '@/lib/services/AnalyticsService'
import { getServerAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const generateSummarySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  userEmail: z.string().email().optional(),
  sections: z.array(z.any()).optional(),
  analyticsData: z.any().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userEmail, sections, analyticsData } = generateSummarySchema.parse(body)

    // Authenticate user if email is provided
    let authenticatedUser = null
    if (userEmail) {
      authenticatedUser = await getServerAuth(userEmail)
      if (!authenticatedUser || authenticatedUser.userId !== userId) {
        return NextResponse.json(
          { error: 'Authentication failed or user ID mismatch' },
          { status: 401 }
        )
      }
    }

    // Get real user profile data
    const userProfileRepo = new UserProfileRepository()
    const userProfile = await userProfileRepo.findByUserId(userId)

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Get real business evaluation data
    const businessEvaluations = await BusinessEvaluationRepository.findByUserId(userId)

    if (!businessEvaluations || businessEvaluations.length === 0) {
      return NextResponse.json(
        { error: 'No business evaluations found for this user' },
        { status: 404 }
      )
    }

    // Get real analytics data directly from service (no external API calls)
    const realAnalyticsData = await AnalyticsService.getAnalyticsDashboardData(userId).catch(error => {
      console.warn('Analytics data fetch failed:', error)
      return null
    })

    // Transform database evaluations to expected format
    const transformedEvaluations = businessEvaluations.map(evaluation => ({
      id: evaluation.id,
      healthScore: evaluation.healthScore || 0,
      businessData: {
        businessName: (evaluation.businessData as any)?.businessName || userProfile.firstName + ' ' + userProfile.lastName + ' Business',
        businessType: (evaluation.businessData as any)?.businessType || 'Business',
        industry: (evaluation.businessData as any)?.industry || (evaluation.businessData as any)?.industryFocus || 'General Business',
        annualRevenue: (evaluation.businessData as any)?.annualRevenue || 0,
        employeeCount: (evaluation.businessData as any)?.employeeCount || 1,
        customerCount: (evaluation.businessData as any)?.customerCount || 0,
        grossMargin: (evaluation.businessData as any)?.grossMargin || 0,
        ...evaluation.businessData
      },
      valuations: evaluation.valuations,
      createdAt: evaluation.createdAt.toISOString(),
      improvementOpportunities: (evaluation as any).improvementOpportunities || []
    }))

    // Create user object with real data
    const realUser = {
      id: userId,
      businessName: transformedEvaluations[0]?.businessData?.businessName || `${userProfile.firstName} ${userProfile.lastName} Business`,
      evaluations: transformedEvaluations,
      profile: userProfile
    }

    // Generate executive summary using real data
    const executiveSummary = await ReportService.generateExecutiveSummary(
      realUser,
      sections || [],
      analyticsData || realAnalyticsData
    )

    return NextResponse.json({
      success: true,
      executiveSummary,
      metadata: {
        userProfileFound: !!userProfile,
        evaluationsCount: businessEvaluations.length,
        analyticsDataAvailable: !!realAnalyticsData,
        latestEvaluationDate: businessEvaluations[0]?.createdAt?.toISOString()
      }
    })
  } catch (error) {
    console.error('Error generating executive summary:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors,
          success: false
        },
        { status: 400 }
      )
    }

    // Handle specific database or repository errors
    if (error instanceof Error) {
      // Repository/database errors
      if (error.message.includes('User profile not found')) {
        return NextResponse.json(
          {
            error: 'User profile not found',
            details: 'Please complete your profile setup first',
            success: false
          },
          { status: 404 }
        )
      }

      // Business evaluation errors
      if (error.message.includes('No evaluation data available') ||
          error.message.includes('No business evaluations found')) {
        return NextResponse.json(
          {
            error: 'No business evaluations available',
            details: 'Please complete a business evaluation first',
            success: false
          },
          { status: 404 }
        )
      }

      // Claude API errors
      if (error.message.includes('Claude API') || error.message.includes('API key')) {
        return NextResponse.json(
          {
            error: 'AI analysis service unavailable',
            details: 'The AI analysis service is currently unavailable. Please try again later.',
            success: false
          },
          { status: 503 }
        )
      }

      // Authentication errors
      if (error.message.includes('Authentication failed') || error.message.includes('user ID mismatch')) {
        return NextResponse.json(
          {
            error: 'Authentication failed',
            details: error.message,
            success: false
          },
          { status: 401 }
        )
      }

      // Database connection errors
      if (error.message.includes('connection') || error.message.includes('database')) {
        return NextResponse.json(
          {
            error: 'Database connection error',
            details: 'Unable to access database. Please try again later.',
            success: false
          },
          { status: 503 }
        )
      }

      // Generic error with message
      return NextResponse.json(
        {
          error: 'Failed to generate executive summary',
          details: error.message,
          success: false
        },
        { status: 500 }
      )
    }

    // Unknown error type
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: 'Please try again later',
        success: false
      },
      { status: 500 }
    )
  }
}