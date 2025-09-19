/**
 * API Route Protection Examples
 * Story 11.10: Example implementations showing how to use the tier protection system
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTierProtectionMiddleware } from '../tier-protection';
import {
  evaluationProtection,
  aiAnalysisProtection,
  scenarioModelingProtection,
  adminProtection,
  getProtectionForRoute
} from '../api-protection-wrappers';

/**
 * Example: Basic API route protection
 * This shows how to protect a simple API endpoint
 */
export async function exampleBasicProtection(request: NextRequest) {
  // Create protection for reports API
  const protection = createTierProtectionMiddleware({
    requiredTier: 'basic',
    feature: 'reports',
    action: 'create',
    enableRateLimit: true,
    enableAuditLog: true
  });

  // Apply protection
  const protectionResult = await protection(request);

  // If protection failed, return the error response
  if (protectionResult.status !== 200) {
    return protectionResult;
  }

  // Protection passed, continue with your API logic
  return NextResponse.json({
    message: 'Report created successfully',
    data: { reportId: '12345' }
  });
}

/**
 * Example: Advanced AI Analysis protection with custom logic
 */
export async function exampleAIAnalysisProtection(request: NextRequest) {
  // Use the pre-configured AI analysis protection
  const protectionResult = await aiAnalysisProtection(request);

  if (protectionResult.status !== 200) {
    return protectionResult;
  }

  // Get user tier from enriched headers
  const userTier = request.headers.get('x-user-tier');
  const permissionContext = JSON.parse(
    request.headers.get('x-permission-context') || '{}'
  );

  // Additional business logic based on tier
  let analysisCapabilities = ['basic_insights'];

  if (userTier === 'professional') {
    analysisCapabilities.push('trend_analysis', 'predictive_modeling');
  } else if (userTier === 'enterprise') {
    analysisCapabilities.push(
      'trend_analysis',
      'predictive_modeling',
      'custom_models',
      'ml_training'
    );
  }

  return NextResponse.json({
    message: 'AI analysis started',
    capabilities: analysisCapabilities,
    analysisId: 'ai_' + Date.now()
  });
}

/**
 * Example: Enterprise scenario modeling with strict access control
 */
export async function exampleScenarioModelingProtection(request: NextRequest) {
  const protectionResult = await scenarioModelingProtection(request);

  if (protectionResult.status !== 200) {
    return protectionResult;
  }

  // Only enterprise users reach this point
  const userId = request.headers.get('x-user-id');

  return NextResponse.json({
    message: 'Scenario modeling access granted',
    features: [
      'strategic_scenarios',
      'stress_testing',
      'optimization_algorithms',
      'monte_carlo_simulation'
    ],
    userId
  });
}

/**
 * Example: Dynamic route protection based on URL path
 */
export async function exampleDynamicProtection(request: NextRequest) {
  const { pathname } = new URL(request.url);

  // Get appropriate protection for the route
  const protection = getProtectionForRoute(pathname);

  if (!protection) {
    return NextResponse.json(
      { error: 'No protection configured for this route' },
      { status: 500 }
    );
  }

  const protectionResult = await protection(request);

  if (protectionResult.status !== 200) {
    return protectionResult;
  }

  return NextResponse.json({
    message: 'Dynamic protection successful',
    route: pathname,
    timestamp: new Date().toISOString()
  });
}

/**
 * Example: Admin endpoint with comprehensive logging
 */
export async function exampleAdminProtection(request: NextRequest) {
  const protectionResult = await adminProtection(request);

  if (protectionResult.status !== 200) {
    return protectionResult;
  }

  // Admin access granted - all requests are logged
  const adminAction = request.headers.get('x-admin-action') || 'unknown';

  return NextResponse.json({
    message: 'Admin access granted',
    action: adminAction,
    capabilities: [
      'user_management',
      'system_settings',
      'security_policies',
      'audit_logs',
      'backup_restore'
    ]
  });
}

/**
 * Example: Custom permission logic with business rules
 */
export async function exampleCustomPermissionLogic(request: NextRequest) {
  const protection = createTierProtectionMiddleware({
    requiredTier: 'professional',
    feature: 'evaluations',
    action: 'create',
    enableRateLimit: true,
    enableAuditLog: true,
    customPermissionCheck: async (context) => {
      // Custom business logic
      const url = new URL(context.request.url);
      const evaluationType = url.searchParams.get('type');

      // Basic evaluations allowed for all professional+ users
      if (evaluationType === 'basic') {
        return { allowed: true };
      }

      // Advanced evaluations require enterprise
      if (evaluationType === 'advanced' && context.userTier !== 'enterprise') {
        return {
          allowed: false,
          reason: 'Advanced evaluations require Enterprise tier',
          upgradeRequired: 'enterprise',
          limitation: 'Advanced evaluation features with custom metrics and industry benchmarking'
        };
      }

      // Check if user has remaining evaluation quota
      const currentUsage = context.subscription.usage?.evaluationsUsed || 0;
      const maxEvaluations = context.subscription.features.maxEvaluations;

      if (maxEvaluations !== -1 && currentUsage >= maxEvaluations) {
        return {
          allowed: false,
          reason: 'Monthly evaluation limit exceeded',
          limitation: `You have used ${currentUsage}/${maxEvaluations} evaluations this month`
        };
      }

      return { allowed: true };
    }
  });

  const protectionResult = await protection(request);

  if (protectionResult.status !== 200) {
    return protectionResult;
  }

  const evaluationType = new URL(request.url).searchParams.get('type') || 'basic';

  return NextResponse.json({
    message: 'Evaluation creation authorized',
    type: evaluationType,
    evaluationId: 'eval_' + Date.now()
  });
}

/**
 * Example: Batch operation with usage tracking
 */
export async function exampleBatchOperationProtection(request: NextRequest) {
  const protection = createTierProtectionMiddleware({
    requiredTier: 'professional',
    feature: 'reports',
    action: 'create',
    enableRateLimit: true,
    enableAuditLog: true,
    customPermissionCheck: async (context) => {
      try {
        const body = await context.request.clone().json();
        const batchSize = body.reports?.length || 1;

        // Check if batch size is within tier limits
        if (context.userTier === 'professional' && batchSize > 5) {
          return {
            allowed: false,
            reason: 'Batch size exceeds Professional tier limit',
            upgradeRequired: 'enterprise',
            limitation: 'Professional tier supports up to 5 reports per batch operation'
          };
        }

        if (context.userTier === 'basic' && batchSize > 1) {
          return {
            allowed: false,
            reason: 'Batch operations require Professional or Enterprise tier',
            upgradeRequired: 'professional',
            limitation: 'Basic tier supports single report creation only'
          };
        }

        // Check remaining quota
        const currentUsage = context.subscription.usage?.reportsUsed || 0;
        const maxReports = context.subscription.features.maxReports;

        if (maxReports !== -1 && (currentUsage + batchSize) > maxReports) {
          return {
            allowed: false,
            reason: 'Batch operation would exceed monthly report limit',
            limitation: `Creating ${batchSize} reports would exceed your limit of ${maxReports}`
          };
        }

        return {
          allowed: true,
          context: { batchSize }
        };
      } catch (error) {
        return {
          allowed: false,
          reason: 'Invalid request format for batch operation'
        };
      }
    }
  });

  const protectionResult = await protection(request);

  if (protectionResult.status !== 200) {
    return protectionResult;
  }

  const body = await request.json();
  const batchSize = body.reports?.length || 1;

  return NextResponse.json({
    message: 'Batch operation authorized',
    batchSize,
    reportIds: Array.from({ length: batchSize }, (_, i) => `report_${Date.now()}_${i}`)
  });
}

/**
 * Example: Export endpoint with format-based restrictions
 */
export async function exampleExportProtection(request: NextRequest) {
  const url = new URL(request.url);
  const format = url.searchParams.get('format') || 'csv';

  const protection = createTierProtectionMiddleware({
    requiredTier: 'basic',
    feature: 'reports',
    action: 'export',
    enableRateLimit: true,
    enableAuditLog: true,
    customPermissionCheck: async (context) => {
      // Format-based restrictions
      const advancedFormats = ['excel', 'powerbi', 'api'];
      const enterpriseFormats = ['white-label', 'automated'];

      if (advancedFormats.includes(format) && context.userTier === 'basic') {
        return {
          allowed: false,
          reason: `${format.toUpperCase()} export requires Professional or Enterprise tier`,
          upgradeRequired: 'professional'
        };
      }

      if (enterpriseFormats.includes(format) && context.userTier !== 'enterprise') {
        return {
          allowed: false,
          reason: `${format} export requires Enterprise tier`,
          upgradeRequired: 'enterprise'
        };
      }

      return { allowed: true };
    }
  });

  const protectionResult = await protection(request);

  if (protectionResult.status !== 200) {
    return protectionResult;
  }

  return NextResponse.json({
    message: 'Export authorized',
    format,
    downloadUrl: `/api/download/export_${Date.now()}.${format}`,
    expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour
  });
}

/**
 * Example: Integration endpoint with webhook support
 */
export async function exampleIntegrationProtection(request: NextRequest) {
  const protection = createTierProtectionMiddleware({
    requiredTier: 'professional',
    feature: 'integrations',
    action: 'create',
    enableRateLimit: true,
    enableAuditLog: true,
    customPermissionCheck: async (context) => {
      const url = new URL(context.request.url);
      const integrationType = url.pathname.split('/').pop();

      // Enterprise-only integrations
      const enterpriseTypes = ['sso', 'ldap', 'saml', 'custom-connector'];

      if (enterpriseTypes.includes(integrationType || '') && context.userTier !== 'enterprise') {
        return {
          allowed: false,
          reason: `${integrationType} integration requires Enterprise tier`,
          upgradeRequired: 'enterprise'
        };
      }

      return { allowed: true };
    }
  });

  const protectionResult = await protection(request);

  if (protectionResult.status !== 200) {
    return protectionResult;
  }

  const userTier = request.headers.get('x-user-tier');
  const availableIntegrations = userTier === 'enterprise'
    ? ['api', 'webhooks', 'sso', 'ldap', 'saml', 'custom-connector']
    : ['api', 'webhooks', 'basic-integrations'];

  return NextResponse.json({
    message: 'Integration access granted',
    availableIntegrations,
    integrationId: 'int_' + Date.now()
  });
}

export default {
  exampleBasicProtection,
  exampleAIAnalysisProtection,
  exampleScenarioModelingProtection,
  exampleDynamicProtection,
  exampleAdminProtection,
  exampleCustomPermissionLogic,
  exampleBatchOperationProtection,
  exampleExportProtection,
  exampleIntegrationProtection
};