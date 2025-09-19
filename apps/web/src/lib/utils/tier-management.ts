/**
 * Tier Management Utilities
 * Handles user tier permissions, feature mapping, and upgrade value calculations
 */

import type { User } from '@clerk/nextjs/server';

export type UserTier = 'basic' | 'professional' | 'enterprise';

export interface TierFeature {
  id: string;
  name: string;
  description: string;
  category: 'analytics' | 'reporting' | 'integrations' | 'support' | 'data' | 'ai';
  basicTier: boolean;
  professionalTier: boolean;
  enterpriseTier: boolean;
  businessValue: string;
  technicalValue: string;
}

export interface TierUpgradeValue {
  tier: UserTier;
  monthlyValue: number;
  annualValue: number;
  features: TierFeature[];
  roiMultiplier: number;
  paybackPeriod: string;
}

export interface TierPermissions {
  canAccessProfessionalDashboard: boolean;
  canAccessEnterpriseDashboard: boolean;
  canUseAdvancedAnalytics: boolean;
  canExportReports: boolean;
  canAccessAPIIntegrations: boolean;
  canUsePredictiveModeling: boolean;
  canAccessRealTimeData: boolean;
  canUseCustomDashboards: boolean;
  maxDataRetention: number; // in months
  maxExportsPerMonth: number;
  supportLevel: 'basic' | 'priority' | 'dedicated';
}

// Feature definitions for each tier
const TIER_FEATURES: TierFeature[] = [
  {
    id: 'multi-year-trends',
    name: 'Multi-Year Financial Trends',
    description: 'Comprehensive financial trend analysis across multiple years',
    category: 'analytics',
    basicTier: false,
    professionalTier: true,
    enterpriseTier: true,
    businessValue: 'Identify long-term growth patterns and financial cycles',
    technicalValue: 'Advanced time-series analysis with predictive components'
  },
  {
    id: 'customer-risk-analysis',
    name: 'Customer Concentration Risk',
    description: 'Advanced customer dependency and concentration risk assessment',
    category: 'analytics',
    basicTier: false,
    professionalTier: true,
    enterpriseTier: true,
    businessValue: 'Reduce business risk through customer diversification insights',
    technicalValue: 'Herfindahl-Hirschman Index calculations with risk modeling'
  },
  {
    id: 'competitive-positioning',
    name: 'Competitive Positioning Analysis',
    description: 'Market position analysis against competitors',
    category: 'analytics',
    basicTier: false,
    professionalTier: true,
    enterpriseTier: true,
    businessValue: 'Strategic positioning for competitive advantage',
    technicalValue: 'Multi-dimensional competitor analysis and benchmarking'
  },
  {
    id: 'investment-roi',
    name: 'Investment ROI Calculator',
    description: 'Advanced ROI calculations for business investments',
    category: 'analytics',
    basicTier: false,
    professionalTier: true,
    enterpriseTier: true,
    businessValue: 'Optimize investment decisions with data-driven insights',
    technicalValue: 'NPV, IRR, and payback period calculations with sensitivity analysis'
  },
  {
    id: 'operational-capacity',
    name: 'Operational Capacity Optimization',
    description: 'Resource utilization and capacity planning analytics',
    category: 'analytics',
    basicTier: false,
    professionalTier: true,
    enterpriseTier: true,
    businessValue: 'Maximize operational efficiency and resource allocation',
    technicalValue: 'Capacity modeling with bottleneck analysis and optimization algorithms'
  },
  {
    id: 'scenario-modeling',
    name: 'Multi-Scenario Projections',
    description: 'Advanced scenario planning and Monte Carlo simulations',
    category: 'analytics',
    basicTier: false,
    professionalTier: false,
    enterpriseTier: true,
    businessValue: 'Risk-aware strategic planning with probabilistic outcomes',
    technicalValue: 'Monte Carlo simulations with sensitivity analysis and optimization'
  },
  {
    id: 'capital-structure',
    name: 'Capital Structure Optimization',
    description: 'Advanced capital allocation and financing optimization',
    category: 'analytics',
    basicTier: false,
    professionalTier: false,
    enterpriseTier: true,
    businessValue: 'Optimize capital structure for maximum value creation',
    technicalValue: 'WACC optimization with debt-equity ratio modeling'
  },
  {
    id: 'exit-strategy',
    name: 'Exit Strategy Dashboard',
    description: 'Comprehensive exit planning and valuation modeling',
    category: 'analytics',
    basicTier: false,
    professionalTier: false,
    enterpriseTier: true,
    businessValue: 'Maximize exit value through strategic planning',
    technicalValue: 'DCF modeling with multiple valuation methodologies'
  },
  {
    id: 'real-time-data',
    name: 'Real-Time Data Integration',
    description: 'Live data feeds and real-time analytics',
    category: 'data',
    basicTier: false,
    professionalTier: true,
    enterpriseTier: true,
    businessValue: 'Make decisions based on current market conditions',
    technicalValue: 'WebSocket connections with event-driven data processing'
  },
  {
    id: 'api-integrations',
    name: 'Advanced API Integrations',
    description: 'Custom integrations with business systems',
    category: 'integrations',
    basicTier: false,
    professionalTier: true,
    enterpriseTier: true,
    businessValue: 'Streamline data workflows and eliminate manual processes',
    technicalValue: 'RESTful APIs with webhook support and data transformation'
  },
  {
    id: 'predictive-ai',
    name: 'AI-Powered Predictive Analytics',
    description: 'Machine learning models for business forecasting',
    category: 'ai',
    basicTier: false,
    professionalTier: false,
    enterpriseTier: true,
    businessValue: 'Anticipate market trends and optimize business strategy',
    technicalValue: 'TensorFlow models with automated feature engineering'
  },
  {
    id: 'custom-reports',
    name: 'Custom Report Builder',
    description: 'Build custom reports and dashboards',
    category: 'reporting',
    basicTier: false,
    professionalTier: true,
    enterpriseTier: true,
    businessValue: 'Tailor analytics to specific business needs',
    technicalValue: 'Drag-and-drop report builder with SQL query generation'
  },
  {
    id: 'priority-support',
    name: 'Priority Support',
    description: 'Priority customer support with dedicated account management',
    category: 'support',
    basicTier: false,
    professionalTier: true,
    enterpriseTier: true,
    businessValue: 'Minimize downtime and maximize platform value',
    technicalValue: '24/7 support with guaranteed response times'
  }
];

/**
 * Get user tier from user object or subscription data
 */
export function getUserTier(user: any): UserTier {
  if (!user) return 'basic';

  // Check for subscription tier in user metadata or subscription object
  const tier = user.subscriptionTier || user.publicMetadata?.subscriptionTier || user.privateMetadata?.subscriptionTier;

  if (tier === 'enterprise') return 'enterprise';
  if (tier === 'professional') return 'professional';

  return 'basic';
}

/**
 * Check if user has access to specific tier
 */
export function hasTierAccess(userTier: UserTier, requiredTier: UserTier): boolean {
  const tierHierarchy: Record<UserTier, number> = {
    basic: 1,
    professional: 2,
    enterprise: 3
  };

  return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
}

/**
 * Get permissions for user tier
 */
export function getTierPermissions(tier: UserTier): TierPermissions {
  const basePermissions: TierPermissions = {
    canAccessProfessionalDashboard: false,
    canAccessEnterpriseDashboard: false,
    canUseAdvancedAnalytics: false,
    canExportReports: false,
    canAccessAPIIntegrations: false,
    canUsePredictiveModeling: false,
    canAccessRealTimeData: false,
    canUseCustomDashboards: false,
    maxDataRetention: 3,
    maxExportsPerMonth: 5,
    supportLevel: 'basic'
  };

  switch (tier) {
    case 'professional':
      return {
        ...basePermissions,
        canAccessProfessionalDashboard: true,
        canUseAdvancedAnalytics: true,
        canExportReports: true,
        canAccessAPIIntegrations: true,
        canAccessRealTimeData: true,
        canUseCustomDashboards: true,
        maxDataRetention: 24,
        maxExportsPerMonth: 50,
        supportLevel: 'priority'
      };

    case 'enterprise':
      return {
        ...basePermissions,
        canAccessProfessionalDashboard: true,
        canAccessEnterpriseDashboard: true,
        canUseAdvancedAnalytics: true,
        canExportReports: true,
        canAccessAPIIntegrations: true,
        canUsePredictiveModeling: true,
        canAccessRealTimeData: true,
        canUseCustomDashboards: true,
        maxDataRetention: 60,
        maxExportsPerMonth: 500,
        supportLevel: 'dedicated'
      };

    default:
      return basePermissions;
  }
}

/**
 * Get features available for specific tier
 */
export function getTierFeatures(tier: UserTier): TierFeature[] {
  return TIER_FEATURES.filter(feature => {
    switch (tier) {
      case 'basic':
        return feature.basicTier;
      case 'professional':
        return feature.professionalTier;
      case 'enterprise':
        return feature.enterpriseTier;
      default:
        return false;
    }
  });
}

/**
 * Get features user gains by upgrading to target tier
 */
export function getUpgradeFeatures(currentTier: UserTier, targetTier: UserTier): TierFeature[] {
  const currentFeatures = getTierFeatures(currentTier);
  const targetFeatures = getTierFeatures(targetTier);

  return targetFeatures.filter(targetFeature =>
    !currentFeatures.some(currentFeature => currentFeature.id === targetFeature.id)
  );
}

/**
 * Calculate upgrade value proposition
 */
export function calculateUpgradeValue(
  currentTier: UserTier,
  targetTier: UserTier,
  currentRevenue?: number
): TierUpgradeValue {
  const upgradeFeatures = getUpgradeFeatures(currentTier, targetTier);

  // Base pricing (these would come from your pricing config)
  const tierPricing = {
    basic: { monthly: 0, annual: 0 },
    professional: { monthly: 297, annual: 2970 },
    enterprise: { monthly: 997, annual: 9970 }
  };

  const pricing = tierPricing[targetTier];

  // Calculate ROI multiplier based on features and typical business impact
  let roiMultiplier = 1.0;
  let paybackPeriod = '12+ months';

  if (targetTier === 'professional') {
    roiMultiplier = 3.2; // 3.2x ROI typically seen
    paybackPeriod = '6-9 months';
  } else if (targetTier === 'enterprise') {
    roiMultiplier = 5.8; // 5.8x ROI for enterprise features
    paybackPeriod = '3-6 months';
  }

  // Calculate monthly and annual value based on revenue impact
  const baseValue = currentRevenue ? currentRevenue * 0.02 : 10000; // 2% revenue impact default
  const monthlyValue = baseValue * roiMultiplier;
  const annualValue = monthlyValue * 12;

  return {
    tier: targetTier,
    monthlyValue,
    annualValue,
    features: upgradeFeatures,
    roiMultiplier,
    paybackPeriod
  };
}

/**
 * Check if feature is available for user
 */
export function canAccessFeature(userTier: UserTier, featureId: string): boolean {
  const feature = TIER_FEATURES.find(f => f.id === featureId);
  if (!feature) return false;

  switch (userTier) {
    case 'basic':
      return feature.basicTier;
    case 'professional':
      return feature.professionalTier;
    case 'enterprise':
      return feature.enterpriseTier;
    default:
      return false;
  }
}

/**
 * Get feature gating message for unavailable features
 */
export function getFeatureGatingMessage(
  featureId: string,
  userTier: UserTier
): { title: string; description: string; upgradeTarget: UserTier } | null {
  const feature = TIER_FEATURES.find(f => f.id === featureId);
  if (!feature) return null;

  if (canAccessFeature(userTier, featureId)) return null;

  let upgradeTarget: UserTier = 'professional';
  if (feature.enterpriseTier && !feature.professionalTier) {
    upgradeTarget = 'enterprise';
  }

  return {
    title: `${feature.name} - ${upgradeTarget === 'professional' ? 'Professional' : 'Enterprise'} Feature`,
    description: `${feature.description}. Upgrade to ${upgradeTarget} tier to access this feature and unlock ${feature.businessValue.toLowerCase()}.`,
    upgradeTarget
  };
}

/**
 * Get tier comparison data
 */
export function getTierComparison() {
  const tiers: UserTier[] = ['basic', 'professional', 'enterprise'];

  return tiers.map(tier => ({
    tier,
    features: getTierFeatures(tier),
    permissions: getTierPermissions(tier),
    pricing: tier === 'basic' ? { monthly: 0, annual: 0 } :
             tier === 'professional' ? { monthly: 297, annual: 2970 } :
             { monthly: 997, annual: 9970 }
  }));
}

/**
 * Format currency values
 */
export function formatCurrency(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options
  }).format(value);
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number, precision: number = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(precision)}%`;
}

/**
 * Calculate tier upgrade urgency score
 */
export function calculateUpgradeUrgency(
  currentTier: UserTier,
  targetTier: UserTier,
  businessMetrics?: {
    revenue?: number;
    growthRate?: number;
    customerCount?: number;
    dataComplexity?: number;
  }
): {
  score: number;
  reasons: string[];
  timeline: string;
} {
  let score = 0;
  const reasons: string[] = [];

  if (!businessMetrics) {
    return { score: 50, reasons: ['Upgrade assessment requires business metrics'], timeline: 'Contact sales' };
  }

  // Revenue-based urgency
  if (businessMetrics.revenue && businessMetrics.revenue > 1000000) {
    score += 25;
    reasons.push('Revenue scale indicates need for advanced analytics');
  }

  // Growth rate urgency
  if (businessMetrics.growthRate && businessMetrics.growthRate > 20) {
    score += 20;
    reasons.push('High growth rate requires predictive planning tools');
  }

  // Customer complexity
  if (businessMetrics.customerCount && businessMetrics.customerCount > 100) {
    score += 15;
    reasons.push('Customer base size benefits from concentration risk analysis');
  }

  // Data complexity
  if (businessMetrics.dataComplexity && businessMetrics.dataComplexity > 7) {
    score += 20;
    reasons.push('Complex data requirements need advanced integration capabilities');
  }

  // Tier-specific adjustments
  if (currentTier === 'basic' && targetTier === 'professional') {
    score += 10;
    reasons.push('Professional tier provides immediate ROI for growing businesses');
  } else if (targetTier === 'enterprise') {
    score += 20;
    reasons.push('Enterprise features critical for scaling and exit preparation');
  }

  let timeline = 'Consider in 6+ months';
  if (score >= 80) timeline = 'Upgrade immediately';
  else if (score >= 60) timeline = 'Upgrade within 30 days';
  else if (score >= 40) timeline = 'Upgrade within 90 days';

  return { score: Math.min(score, 100), reasons, timeline };
}