import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SubscriptionTier } from '@/types/subscription';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId') || userId;

    // Get user's current tier and usage data
    const { clerkClient } = await import('@clerk/nextjs/server');
    const user = await clerkClient.users.getUser(targetUserId);

    const currentTier = (user.publicMetadata?.subscriptionTier as SubscriptionTier) || 'free';

    // Analyze user's usage patterns and generate recommendations
    const recommendations = await generateUpgradeRecommendations(targetUserId, currentTier);

    return NextResponse.json(recommendations);

  } catch (error) {
    console.error('Error generating upgrade recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

async function generateUpgradeRecommendations(
  userId: string,
  currentTier: SubscriptionTier
): Promise<{
  recommended: SubscriptionTier;
  reasons: string[];
  savings?: number;
  confidence: number;
  features: string[];
  roi: {
    monthlyValue: number;
    implementation: string;
    paybackPeriod: string;
  };
}> {
  // Fetch user analytics and usage data
  const usageData = await getUserUsageAnalytics(userId);

  // Calculate recommendations based on usage patterns
  const analysis = analyzeUsagePatterns(usageData, currentTier);

  return {
    recommended: analysis.recommendedTier,
    reasons: analysis.reasons,
    savings: analysis.potentialSavings,
    confidence: analysis.confidence,
    features: analysis.recommendedFeatures,
    roi: analysis.roi
  };
}

async function getUserUsageAnalytics(userId: string) {
  // This would typically fetch from your analytics database
  // For now, we'll simulate with sample data

  const mockAnalytics = {
    reportsGenerated: Math.floor(Math.random() * 100) + 20,
    apiCalls: Math.floor(Math.random() * 1000) + 100,
    benchmarksViewed: Math.floor(Math.random() * 50) + 10,
    timeSpentAnalyzing: Math.floor(Math.random() * 120) + 30, // hours
    featuresAttempted: [
      'advanced-analytics',
      'custom-benchmarks',
      'api-access'
    ].filter(() => Math.random() > 0.5),
    teamSize: Math.floor(Math.random() * 20) + 1,
    industry: 'ecommerce', // Would come from user profile
    monthlyGrowth: Math.random() * 0.3 + 0.05 // 5-35% growth
  };

  return mockAnalytics;
}

function analyzeUsagePatterns(usageData: any, currentTier: SubscriptionTier) {
  const analysis = {
    recommendedTier: currentTier as SubscriptionTier,
    reasons: [] as string[],
    potentialSavings: 0,
    confidence: 0,
    recommendedFeatures: [] as string[],
    roi: {
      monthlyValue: 0,
      implementation: '',
      paybackPeriod: ''
    }
  };

  // Analysis logic for Professional tier
  if (currentTier === 'free') {
    let professionalScore = 0;
    let enterpriseScore = 0;

    // High report generation indicates need for advanced analytics
    if (usageData.reportsGenerated > 50) {
      professionalScore += 30;
      analysis.reasons.push('High report generation volume suggests need for advanced analytics');
      analysis.recommendedFeatures.push('advanced-analytics');
    }

    // API usage indicates integration needs
    if (usageData.apiCalls > 500) {
      professionalScore += 25;
      analysis.reasons.push('Significant API usage indicates integration requirements');
      analysis.recommendedFeatures.push('api-access');
    }

    // Benchmark usage suggests need for custom benchmarks
    if (usageData.benchmarksViewed > 30) {
      professionalScore += 20;
      analysis.reasons.push('Heavy benchmark usage suggests value in custom benchmarks');
      analysis.recommendedFeatures.push('custom-benchmarks');
    }

    // Team size analysis
    if (usageData.teamSize > 10) {
      enterpriseScore += 40;
      analysis.reasons.push('Large team size benefits from enterprise collaboration features');
      analysis.recommendedFeatures.push('white-label', 'dedicated-manager');
    } else if (usageData.teamSize > 5) {
      professionalScore += 15;
      analysis.reasons.push('Growing team size indicates need for professional features');
    }

    // Time investment indicates serious usage
    if (usageData.timeSpentAnalyzing > 80) {
      professionalScore += 20;
      enterpriseScore += 15;
      analysis.reasons.push('High time investment shows strong engagement with the platform');
    }

    // Business growth rate
    if (usageData.monthlyGrowth > 0.2) {
      enterpriseScore += 25;
      analysis.reasons.push('Rapid business growth indicates need for scalable solutions');
    } else if (usageData.monthlyGrowth > 0.1) {
      professionalScore += 15;
      analysis.reasons.push('Steady business growth suggests professional tier value');
    }

    // Feature attempt frequency
    if (usageData.featuresAttempted.length > 2) {
      professionalScore += 25;
      analysis.reasons.push('Multiple premium feature attempts show clear upgrade interest');
    }

    // Determine recommendation
    if (enterpriseScore > professionalScore && enterpriseScore > 60) {
      analysis.recommendedTier = 'enterprise';
      analysis.confidence = Math.min(enterpriseScore / 100, 0.95);
      analysis.potentialSavings = calculateSavings('enterprise', usageData);
      analysis.roi = calculateROI('enterprise', usageData);
    } else if (professionalScore > 40) {
      analysis.recommendedTier = 'professional';
      analysis.confidence = Math.min(professionalScore / 100, 0.90);
      analysis.potentialSavings = calculateSavings('professional', usageData);
      analysis.roi = calculateROI('professional', usageData);
    } else {
      // Stay on free but suggest monitoring
      analysis.reasons.push('Current usage suggests free tier is sufficient for now');
      analysis.confidence = 0.7;
    }
  }

  // Analysis for Professional to Enterprise upgrade
  else if (currentTier === 'professional') {
    let enterpriseScore = 0;

    if (usageData.teamSize > 15) {
      enterpriseScore += 50;
      analysis.reasons.push('Large team size benefits from enterprise features');
    }

    if (usageData.apiCalls > 2000) {
      enterpriseScore += 30;
      analysis.reasons.push('High API usage suggests need for enterprise integrations');
    }

    if (usageData.monthlyGrowth > 0.25) {
      enterpriseScore += 40;
      analysis.reasons.push('Rapid growth requires enterprise-scale solutions');
    }

    if (enterpriseScore > 60) {
      analysis.recommendedTier = 'enterprise';
      analysis.confidence = Math.min(enterpriseScore / 120, 0.95);
      analysis.potentialSavings = calculateSavings('enterprise', usageData);
      analysis.roi = calculateROI('enterprise', usageData);
      analysis.recommendedFeatures.push('white-label', 'custom-integrations', 'dedicated-manager');
    } else {
      analysis.reasons.push('Professional tier continues to meet your current needs');
      analysis.confidence = 0.8;
    }
  }

  return analysis;
}

function calculateSavings(tier: SubscriptionTier, usageData: any): number {
  // Calculate potential monthly savings based on tier and usage
  const baseSavings = {
    professional: 2000, // Base monthly savings from efficiency
    enterprise: 8000   // Higher savings for enterprise features
  };

  const usage_multiplier = Math.min(usageData.timeSpentAnalyzing / 40, 3); // Cap at 3x
  const team_multiplier = Math.min(usageData.teamSize / 5, 4); // Cap at 4x

  return Math.round(baseSavings[tier] * usage_multiplier * team_multiplier);
}

function calculateROI(tier: SubscriptionTier, usageData: any) {
  const tierCosts = {
    professional: 49,
    enterprise: 199
  };

  const monthlySavings = calculateSavings(tier, usageData);
  const monthlyCost = tierCosts[tier];
  const netValue = monthlySavings - monthlyCost;

  return {
    monthlyValue: netValue,
    implementation: tier === 'professional'
      ? 'Immediate productivity gains through advanced analytics and automation'
      : 'Comprehensive solution with dedicated support and custom integrations',
    paybackPeriod: monthlySavings > monthlyCost
      ? 'Immediate (first month)'
      : `${Math.ceil(monthlyCost / (monthlySavings * 0.3))} months`
  };
}