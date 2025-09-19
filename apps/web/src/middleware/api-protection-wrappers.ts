/**
 * API Route Protection Wrappers
 * Story 11.10: Complete API protection for all endpoint categories
 */

import { NextRequest } from 'next/server';
import { createTierProtectionMiddleware, TierProtectionConfig } from './tier-protection';
import { TierPermissions, UserTier } from '@/lib/access-control/permission-matrix';

/**
 * Evaluation API Protection
 * Protects /api/evaluations/* routes with tier-based limits
 */
export const evaluationProtection = createTierProtectionMiddleware({
  requiredTier: 'basic',
  feature: 'evaluations',
  action: 'create',
  resource: 'evaluation_data',
  enableRateLimit: true,
  enableAuditLog: true
});

/**
 * Advanced Evaluation API Protection (Enterprise scenarios)
 * Protects /api/evaluations/enterprise/* routes
 */
export const enterpriseEvaluationProtection = createTierProtectionMiddleware({
  requiredTier: 'enterprise',
  feature: 'evaluations',
  action: 'create',
  resource: 'enterprise_evaluation',
  enableRateLimit: true,
  enableAuditLog: true
});

/**
 * Reports API Protection
 * Protects /api/reports/* routes with tier-specific report types
 */
export const reportsProtection = createTierProtectionMiddleware({
  requiredTier: 'basic',
  feature: 'reports',
  action: 'create',
  resource: 'basic_report',
  enableRateLimit: true,
  enableAuditLog: true,
  customPermissionCheck: async (context) => {
    // Check specific report type based on request path
    const url = new URL(context.request.url);
    const reportType = url.pathname.split('/').pop();

    switch (reportType) {
      case 'basic':
        return { allowed: true };

      case 'professional':
      case 'enhanced':
        if (context.userTier === 'basic') {
          return {
            allowed: false,
            reason: 'Professional reports require Professional or Enterprise tier',
            upgradeRequired: 'professional'
          };
        }
        return { allowed: true };

      case 'enterprise':
      case 'advanced':
        if (context.userTier !== 'enterprise') {
          return {
            allowed: false,
            reason: 'Enterprise reports require Enterprise tier',
            upgradeRequired: 'enterprise'
          };
        }
        return { allowed: true };

      default:
        return { allowed: true };
    }
  }
});

/**
 * Enhanced Reports API Protection (Professional+)
 * Protects /api/reports/enhanced/* routes
 */
export const enhancedReportsProtection = createTierProtectionMiddleware({
  requiredTier: 'professional',
  feature: 'reports',
  action: 'create',
  resource: 'professional_report',
  enableRateLimit: true,
  enableAuditLog: true
});

/**
 * Enterprise Reports API Protection
 * Protects /api/reports/enterprise/* routes
 */
export const enterpriseReportsProtection = createTierProtectionMiddleware({
  requiredTier: 'enterprise',
  feature: 'reports',
  action: 'create',
  resource: 'enterprise_report',
  enableRateLimit: true,
  enableAuditLog: true
});

/**
 * AI Analysis API Protection (Professional+ only)
 * Protects /api/ai-analysis/* routes
 */
export const aiAnalysisProtection = createTierProtectionMiddleware({
  requiredTier: 'professional',
  feature: 'ai_analysis',
  action: 'create',
  resource: 'professional_analysis',
  enableRateLimit: true,
  enableAuditLog: true,
  customPermissionCheck: async (context) => {
    // Basic tier has no AI analysis access
    if (context.userTier === 'basic') {
      return {
        allowed: false,
        reason: 'AI Analysis requires Professional or Enterprise tier',
        upgradeRequired: 'professional',
        limitation: 'AI-powered analysis and insights are available starting with Professional tier'
      };
    }

    // Check for advanced AI features
    const url = new URL(context.request.url);
    const analysisType = url.pathname.split('/').pop();

    if (analysisType === 'advanced' && context.userTier !== 'enterprise') {
      return {
        allowed: false,
        reason: 'Advanced AI Analysis requires Enterprise tier',
        upgradeRequired: 'enterprise',
        limitation: 'Advanced AI features including custom models and ML training require Enterprise tier'
      };
    }

    return { allowed: true };
  }
});

/**
 * Scenario Modeling API Protection (Enterprise only)
 * Protects /api/scenario-modeling/* routes
 */
export const scenarioModelingProtection = createTierProtectionMiddleware({
  requiredTier: 'enterprise',
  feature: 'scenario_modeling',
  action: 'create',
  resource: 'strategic_scenarios',
  enableRateLimit: true,
  enableAuditLog: true,
  customPermissionCheck: async (context) => {
    if (context.userTier !== 'enterprise') {
      return {
        allowed: false,
        reason: 'Scenario Modeling is exclusive to Enterprise tier',
        upgradeRequired: 'enterprise',
        limitation: 'Strategic scenario modeling, stress testing, and optimization require Enterprise tier'
      };
    }
    return { allowed: true };
  }
});

/**
 * Admin API Protection (Enterprise only)
 * Protects /api/admin/* routes
 */
export const adminProtection = createTierProtectionMiddleware({
  requiredTier: 'enterprise',
  feature: 'admin',
  action: 'admin',
  resource: 'system_administration',
  enableRateLimit: true,
  enableAuditLog: true,
  customPermissionCheck: async (context) => {
    if (context.userTier !== 'enterprise') {
      return {
        allowed: false,
        reason: 'Administrative features require Enterprise tier',
        upgradeRequired: 'enterprise',
        limitation: 'User management, system settings, and administrative controls require Enterprise tier'
      };
    }
    return { allowed: true };
  }
});

/**
 * ROI Calculator API Protection
 * Protects /api/roi-calculator/* routes with tier-based scenarios
 */
export const roiCalculatorProtection = createTierProtectionMiddleware({
  requiredTier: 'basic',
  feature: 'roi_calculator',
  action: 'create',
  resource: 'roi_calculation',
  enableRateLimit: true,
  enableAuditLog: true,
  customPermissionCheck: async (context) => {
    const url = new URL(context.request.url);
    const calculationType = url.pathname.split('/').pop();

    // Basic scenarios for all tiers
    if (calculationType === 'basic') {
      return { allowed: true };
    }

    // Investment scenarios for Professional+
    if (calculationType === 'scenarios' && context.userTier === 'basic') {
      return {
        allowed: false,
        reason: 'Investment scenarios require Professional or Enterprise tier',
        upgradeRequired: 'professional'
      };
    }

    // Advanced forecasting for Enterprise only
    if (['forecasting', 'monte-carlo', 'sensitivity'].includes(calculationType || '') && context.userTier !== 'enterprise') {
      return {
        allowed: false,
        reason: 'Advanced ROI analysis requires Enterprise tier',
        upgradeRequired: 'enterprise'
      };
    }

    return { allowed: true };
  }
});

/**
 * Financial Trends API Protection (Professional+)
 * Protects /api/financial-trends/* routes
 */
export const financialTrendsProtection = createTierProtectionMiddleware({
  requiredTier: 'professional',
  feature: 'financial_trends',
  action: 'create',
  resource: 'multi_year_analysis',
  enableRateLimit: true,
  enableAuditLog: true,
  customPermissionCheck: async (context) => {
    if (context.userTier === 'basic') {
      return {
        allowed: false,
        reason: 'Financial Trends analysis requires Professional or Enterprise tier',
        upgradeRequired: 'professional',
        limitation: 'Multi-year financial analysis and trend forecasting require Professional tier or higher'
      };
    }

    const url = new URL(context.request.url);
    const analysisType = url.pathname.split('/').pop();

    // Predictive modeling for Enterprise only
    if (['predictive', 'market-integration'].includes(analysisType || '') && context.userTier !== 'enterprise') {
      return {
        allowed: false,
        reason: 'Advanced financial modeling requires Enterprise tier',
        upgradeRequired: 'enterprise'
      };
    }

    return { allowed: true };
  }
});

/**
 * Exit Planning API Protection (Professional+)
 * Protects /api/exit-planning/* routes
 */
export const exitPlanningProtection = createTierProtectionMiddleware({
  requiredTier: 'professional',
  feature: 'exit_planning',
  action: 'create',
  resource: 'exit_strategies',
  enableRateLimit: true,
  enableAuditLog: true,
  customPermissionCheck: async (context) => {
    if (context.userTier === 'basic') {
      return {
        allowed: false,
        reason: 'Exit Planning requires Professional or Enterprise tier',
        upgradeRequired: 'professional',
        limitation: 'Exit strategy planning and valuation tools require Professional tier or higher'
      };
    }

    const url = new URL(context.request.url);
    const planningType = url.pathname.split('/').pop();

    // Advanced exit planning for Enterprise only
    if (['tax-optimization', 'succession-planning'].includes(planningType || '') && context.userTier !== 'enterprise') {
      return {
        allowed: false,
        reason: 'Advanced exit planning requires Enterprise tier',
        upgradeRequired: 'enterprise'
      };
    }

    return { allowed: true };
  }
});

/**
 * Strategic Options API Protection (Professional+)
 * Protects /api/strategic-options/* routes
 */
export const strategicOptionsProtection = createTierProtectionMiddleware({
  requiredTier: 'professional',
  feature: 'strategic_options',
  action: 'create',
  resource: 'option_valuation',
  enableRateLimit: true,
  enableAuditLog: true,
  customPermissionCheck: async (context) => {
    if (context.userTier === 'basic') {
      return {
        allowed: false,
        reason: 'Strategic Options analysis requires Professional or Enterprise tier',
        upgradeRequired: 'professional',
        limitation: 'Strategic option analysis and recommendations require Professional tier or higher'
      };
    }

    const url = new URL(context.request.url);
    const optionType = url.pathname.split('/').pop();

    // Advanced strategic analysis for Enterprise only
    if (['decision-trees', 'portfolio-analysis'].includes(optionType || '') && context.userTier !== 'enterprise') {
      return {
        allowed: false,
        reason: 'Advanced strategic analysis requires Enterprise tier',
        upgradeRequired: 'enterprise'
      };
    }

    return { allowed: true };
  }
});

/**
 * API Keys/Integration Protection (Professional+)
 * Protects /api/integrations/* and API key management routes
 */
export const integrationProtection = createTierProtectionMiddleware({
  requiredTier: 'professional',
  feature: 'integrations',
  action: 'create',
  resource: 'api_integration',
  enableRateLimit: true,
  enableAuditLog: true,
  customPermissionCheck: async (context) => {
    if (context.userTier === 'basic') {
      return {
        allowed: false,
        reason: 'API integrations require Professional or Enterprise tier',
        upgradeRequired: 'professional',
        limitation: 'API access and third-party integrations require Professional tier or higher'
      };
    }

    const url = new URL(context.request.url);
    const integrationType = url.pathname.split('/').pop();

    // Enterprise-only integrations
    if (['sso', 'custom-connectors', 'webhooks'].includes(integrationType || '') && context.userTier !== 'enterprise') {
      return {
        allowed: false,
        reason: 'Enterprise integrations require Enterprise tier',
        upgradeRequired: 'enterprise'
      };
    }

    return { allowed: true };
  }
});

/**
 * Compliance API Protection (Enterprise only)
 * Protects /api/compliance/* routes
 */
export const complianceProtection = createTierProtectionMiddleware({
  requiredTier: 'enterprise',
  feature: 'compliance',
  action: 'read',
  resource: 'compliance_reports',
  enableRateLimit: true,
  enableAuditLog: true,
  customPermissionCheck: async (context) => {
    if (context.userTier !== 'enterprise') {
      return {
        allowed: false,
        reason: 'Compliance features are exclusive to Enterprise tier',
        upgradeRequired: 'enterprise',
        limitation: 'GDPR, SOX, ISO27001 compliance tools and reporting require Enterprise tier'
      };
    }
    return { allowed: true };
  }
});

/**
 * Data Export API Protection
 * Protects /api/export/* routes with tier-based export limits
 */
export const dataExportProtection = createTierProtectionMiddleware({
  requiredTier: 'basic',
  feature: 'reports',
  action: 'export',
  resource: 'data_export',
  enableRateLimit: true,
  enableAuditLog: true,
  customPermissionCheck: async (context) => {
    const url = new URL(context.request.url);
    const exportType = url.pathname.split('/').pop();

    // Basic exports for all tiers
    if (exportType === 'csv' || exportType === 'pdf') {
      return { allowed: true };
    }

    // Advanced exports for Professional+
    if (['excel', 'api', 'bulk'].includes(exportType || '') && context.userTier === 'basic') {
      return {
        allowed: false,
        reason: 'Advanced export formats require Professional or Enterprise tier',
        upgradeRequired: 'professional'
      };
    }

    // Enterprise-only exports
    if (['automated', 'scheduled', 'white-label'].includes(exportType || '') && context.userTier !== 'enterprise') {
      return {
        allowed: false,
        reason: 'Automated export features require Enterprise tier',
        upgradeRequired: 'enterprise'
      };
    }

    return { allowed: true };
  }
});

/**
 * Route-to-Protection Mapping
 * Maps API routes to their corresponding protection middleware
 */
export const API_PROTECTION_MAP: Record<string, any> = {
  // Evaluations
  '/api/evaluations': evaluationProtection,
  '/api/evaluations/enterprise': enterpriseEvaluationProtection,

  // Reports
  '/api/reports': reportsProtection,
  '/api/reports/enhanced': enhancedReportsProtection,
  '/api/reports/enterprise': enterpriseReportsProtection,

  // AI Analysis
  '/api/ai-analysis': aiAnalysisProtection,

  // Scenario Modeling
  '/api/scenario-modeling': scenarioModelingProtection,

  // Admin
  '/api/admin': adminProtection,

  // ROI Calculator
  '/api/roi-calculator': roiCalculatorProtection,

  // Financial Trends
  '/api/financial-trends': financialTrendsProtection,

  // Exit Planning
  '/api/exit-planning': exitPlanningProtection,

  // Strategic Options
  '/api/strategic-options': strategicOptionsProtection,

  // Integrations
  '/api/integrations': integrationProtection,

  // Compliance
  '/api/compliance': complianceProtection,

  // Data Export
  '/api/export': dataExportProtection
};

/**
 * Get protection middleware for a specific route
 */
export function getProtectionForRoute(pathname: string): any | null {
  // Find the most specific matching route
  const matchingRoutes = Object.keys(API_PROTECTION_MAP)
    .filter(route => pathname.startsWith(route))
    .sort((a, b) => b.length - a.length); // Sort by specificity (longest first)

  if (matchingRoutes.length > 0) {
    return API_PROTECTION_MAP[matchingRoutes[0]];
  }

  return null;
}

/**
 * Apply protection to a Next.js API route
 */
export function protectApiRoute(pathname: string) {
  const protection = getProtectionForRoute(pathname);
  if (!protection) {
    console.warn(`No protection configured for route: ${pathname}`);
    return null;
  }
  return protection;
}

export default {
  evaluationProtection,
  enterpriseEvaluationProtection,
  reportsProtection,
  enhancedReportsProtection,
  enterpriseReportsProtection,
  aiAnalysisProtection,
  scenarioModelingProtection,
  adminProtection,
  roiCalculatorProtection,
  financialTrendsProtection,
  exitPlanningProtection,
  strategicOptionsProtection,
  integrationProtection,
  complianceProtection,
  dataExportProtection,
  getProtectionForRoute,
  protectApiRoute,
  API_PROTECTION_MAP
};