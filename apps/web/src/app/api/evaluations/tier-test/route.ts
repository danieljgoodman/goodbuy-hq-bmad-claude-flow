import { NextRequest, NextResponse } from 'next/server'
import { TierValidationMiddleware } from '@/middleware/tier-validation'

/**
 * Test endpoint to demonstrate tier validation middleware
 * Usage: GET /api/evaluations/tier-test?userId=test-user&tier=PREMIUM
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const testTier = searchParams.get('tier') || 'FREE'
    const userId = searchParams.get('userId') || 'test-user'

    // Validate user tier
    const tierResult = await TierValidationMiddleware.validateTier(request, {
      requiredTier: 'PREMIUM',
      featureType: 'analytics',
      fallbackToBasic: true
    })

    console.log('🧪 Tier Test - Requested:', testTier, 'Detected:', tierResult.userTier)

    // Sample evaluation data to demonstrate filtering
    const sampleEvaluation = {
      id: 'test-evaluation-123',
      businessData: {
        name: 'Test Business',
        industry: 'Technology',
        revenue: 1000000,
        employees: 50
      },
      valuations: {
        revenue_multiple: { value: 5000000, confidence: 0.8 },
        asset_based: { value: 3000000, confidence: 0.6 },
        dcf_analysis: { value: 7000000, confidence: 0.9 }, // Premium only
        market_comparison: { value: 6000000, confidence: 0.85 }, // Premium only
        risk_adjusted: { value: 4500000, confidence: 0.75 } // Premium only
      },
      opportunities: [
        { title: 'Digital Marketing Optimization', impact: 'high', priority: 1 },
        { title: 'Supply Chain Efficiency', impact: 'medium', priority: 2 },
        { title: 'Customer Experience Enhancement', impact: 'high', priority: 3 },
        { title: 'Process Automation', impact: 'medium', priority: 4 }, // Will be filtered for basic
        { title: 'Market Expansion', impact: 'high', priority: 5 } // Will be filtered for basic
      ],
      insights: {
        summary: 'Strong technology business with growth potential',
        market_analysis: 'Positioned well in growing market segment', // Premium only
        competitive_positioning: 'Strong competitive advantages', // Premium only
        growth_projections: 'Expected 25% annual growth', // Premium only
        risk_factors: 'Market volatility and competition'
      },
      healthScore: 85,
      confidenceScore: 82,
      createdAt: new Date().toISOString()
    }

    // Demonstrate tier-based filtering
    const response = TierValidationMiddleware.createTierAwareResponse(
      sampleEvaluation,
      tierResult,
      { includeUpgradeInfo: true }
    )

    return response

  } catch (error) {
    console.error('Tier test error:', error)
    return NextResponse.json(
      { error: 'Failed to test tier validation' },
      { status: 500 }
    )
  }
}

/**
 * Test endpoint for feature-specific access checks
 * Usage: POST /api/evaluations/tier-test
 * Body: { "userId": "test-user", "feature": "ai_guides" }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, feature } = await request.json()

    if (!userId || !feature) {
      return NextResponse.json(
        { error: 'userId and feature are required' },
        { status: 400 }
      )
    }

    // Check specific feature access
    const featureAccess = await TierValidationMiddleware.checkFeatureAccess(userId, feature)

    // Demonstrate different responses based on access
    if (featureAccess.hasAccess) {
      return NextResponse.json({
        success: true,
        message: `Access granted to ${feature}`,
        feature,
        access: featureAccess
      })
    } else {
      return TierValidationMiddleware.createAccessDeniedResponse(
        featureAccess,
        `${feature} requires a subscription upgrade`
      )
    }

  } catch (error) {
    console.error('Feature access test error:', error)
    return NextResponse.json(
      { error: 'Failed to test feature access' },
      { status: 500 }
    )
  }
}