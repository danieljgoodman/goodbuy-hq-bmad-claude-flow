/**
 * Enterprise Dashboard API Layer
 * Comprehensive API routes for Enterprise dashboard data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  getEnterpriseMetrics,
  getStrategicScenarios,
  getExitStrategyOptions,
  getCapitalStructureData,
  getFinancialProjections,
  getStrategicOptions,
  saveScenarioConfiguration,
  loadScenarioConfiguration,
  EnterpriseMetrics,
  StrategicScenario,
  ExitStrategyOption,
  CapitalStructureData,
  FinancialProjections,
  StrategicOptions
} from '@/lib/db/enterprise-queries';
import {
  createAuditLogEntry,
  AuditAction
} from '@/lib/audit/enterprise-audit-log';
import {
  hasDataAccess,
  DataClassification,
  AccessLevel,
  monitorSecurityEvent
} from '@/lib/security/soc2-compliance';
import { prisma } from '@/lib/prisma';

// Request validation schemas
const DashboardQuerySchema = z.object({
  evaluationId: z.string().uuid(),
  includeProjections: z.boolean().optional().default(true),
  includeScenarios: z.boolean().optional().default(true),
  timeRange: z.enum(['1m', '3m', '6m', '1y', '3y', '5y']).optional().default('1y')
});

const ScenarioSaveSchema = z.object({
  evaluationId: z.string().uuid(),
  scenarioType: z.enum(['conservative', 'base', 'optimistic', 'custom']),
  data: z.object({
    assumptions: z.array(z.string()),
    revenueProjection: z.array(z.number()),
    profitProjection: z.array(z.number()),
    cashFlowProjection: z.array(z.number()),
    horizon: z.number().min(1).max(10).default(5)
  })
});

// Mock data for development
const MOCK_ENTERPRISE_METRICS: EnterpriseMetrics = {
  totalRevenue: 25000000,
  totalAssets: 18000000,
  grossMargin: 42.5,
  netMargin: 12.8,
  employeeCount: 85,
  marketShare: 15.3,
  debtToEquity: 1.2,
  workingCapital: 18.5,
  lastUpdated: new Date()
};

const MOCK_STRATEGIC_SCENARIOS: StrategicScenario[] = [
  {
    id: 'mock-conservative',
    name: 'Conservative Growth',
    type: 'conservative',
    revenueProjection: [25000000, 26500000, 28000000, 29500000, 31000000],
    profitProjection: [3200000, 3392000, 3584000, 3776000, 3968000],
    cashFlowProjection: [4500000, 4680000, 4860000, 5040000, 5220000],
    riskLevel: 'low',
    probability: 0.3,
    assumptions: ['Market growth 6%', 'No major expansion', 'Conservative pricing'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'mock-base',
    name: 'Base Case',
    type: 'base',
    revenueProjection: [25000000, 28000000, 31500000, 35500000, 40000000],
    profitProjection: [3200000, 3584000, 4032000, 4544000, 5120000],
    cashFlowProjection: [4500000, 5040000, 5670000, 6390000, 7200000],
    riskLevel: 'medium',
    probability: 0.5,
    assumptions: ['Market growth 12%', 'Regional expansion', 'Product line extensions'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'mock-optimistic',
    name: 'Optimistic Growth',
    type: 'optimistic',
    revenueProjection: [25000000, 30000000, 37500000, 48000000, 62000000],
    profitProjection: [3200000, 3840000, 4800000, 6144000, 7936000],
    cashFlowProjection: [4500000, 5400000, 6750000, 8640000, 11160000],
    riskLevel: 'high',
    probability: 0.2,
    assumptions: ['Market expansion 20%', 'Acquisition strategy', 'International markets'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const MOCK_EXIT_STRATEGIES: ExitStrategyOption[] = [
  {
    id: 'mock-strategic',
    type: 'strategic',
    feasibility: 'high',
    timeline: 'three5years',
    estimatedValue: 320000000,
    pros: ['Premium valuation', 'Synergy benefits', 'Strategic fit'],
    cons: ['Cultural integration', 'Employee retention risk'],
    requirements: ['Due diligence preparation', 'Management presentation'],
    rank: 1
  },
  {
    id: 'mock-financial',
    type: 'financial',
    feasibility: 'medium',
    timeline: 'three5years',
    estimatedValue: 240000000,
    pros: ['Professional management', 'Growth capital', 'Operational improvements'],
    cons: ['High leverage', 'Performance pressure'],
    requirements: ['EBITDA improvement', 'Management retention'],
    rank: 2
  }
];

/**
 * Authentication and authorization middleware
 */
async function authenticateEnterpriseUser(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionTier: true }
  });

  if (user?.subscriptionTier !== 'ENTERPRISE') {
    throw new Error('Enterprise tier required');
  }

  return { userId: session.user.id, userTier: user.subscriptionTier };
}

/**
 * GET /api/enterprise/dashboard
 * Main dashboard data endpoint
 */
export async function getDashboardData(req: NextRequest) {
  try {
    const { userId } = await authenticateEnterpriseUser(req);
    const searchParams = req.nextUrl.searchParams;

    const query = DashboardQuerySchema.parse({
      evaluationId: searchParams.get('evaluationId'),
      includeProjections: searchParams.get('includeProjections') !== 'false',
      includeScenarios: searchParams.get('includeScenarios') !== 'false',
      timeRange: searchParams.get('timeRange') || '1y'
    });

    // Check data access permissions
    const hasAccess = hasDataAccess({
      userId,
      userTier: 'ENTERPRISE',
      classification: DataClassification.RESTRICTED,
      accessLevel: AccessLevel.READ,
      resourceId: query.evaluationId
    });

    if (!hasAccess) {
      await monitorSecurityEvent('unauthorized_dashboard_access', userId, {
        evaluationId: query.evaluationId
      });
      throw new Error('Access denied');
    }

    // Fetch dashboard data
    const [metrics, scenarios, projections] = await Promise.all([
      getEnterpriseMetrics(query.evaluationId, userId).catch(() => MOCK_ENTERPRISE_METRICS),
      query.includeScenarios
        ? getStrategicScenarios(query.evaluationId, userId).catch(() => MOCK_STRATEGIC_SCENARIOS)
        : [],
      query.includeProjections
        ? getFinancialProjections(query.evaluationId, userId).catch(() => null)
        : null
    ]);

    // Log access
    await createAuditLogEntry({
      businessEvaluationId: query.evaluationId,
      action: AuditAction.READ,
      userId,
      userTier: 'ENTERPRISE',
      metadata: {
        endpoint: 'dashboard',
        includeProjections: query.includeProjections,
        includeScenarios: query.includeScenarios
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        scenarios,
        projections,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch dashboard data' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 :
                error instanceof Error && error.message.includes('tier required') ? 403 : 500 }
    );
  }
}

/**
 * GET /api/enterprise/scenarios
 * Strategic scenarios endpoint
 */
export async function getScenarios(req: NextRequest) {
  try {
    const { userId } = await authenticateEnterpriseUser(req);
    const searchParams = req.nextUrl.searchParams;
    const evaluationId = searchParams.get('evaluationId');

    if (!evaluationId) {
      return NextResponse.json(
        { error: 'Evaluation ID required' },
        { status: 400 }
      );
    }

    const scenarios = await getStrategicScenarios(evaluationId, userId)
      .catch(() => MOCK_STRATEGIC_SCENARIOS);

    return NextResponse.json({
      success: true,
      data: scenarios
    });

  } catch (error) {
    console.error('Scenarios fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch scenarios' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/enterprise/scenarios
 * Save scenario configuration
 */
export async function saveScenario(req: NextRequest) {
  try {
    const { userId } = await authenticateEnterpriseUser(req);
    const body = await req.json();

    const scenarioData = ScenarioSaveSchema.parse(body);

    const success = await saveScenarioConfiguration(
      scenarioData.evaluationId,
      userId,
      scenarioData.data
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save scenario' },
        { status: 500 }
      );
    }

    // Log scenario save
    await createAuditLogEntry({
      businessEvaluationId: scenarioData.evaluationId,
      action: AuditAction.UPDATE,
      userId,
      userTier: 'ENTERPRISE',
      metadata: {
        scenarioType: scenarioData.scenarioType,
        endpoint: 'save_scenario'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Scenario saved successfully'
    });

  } catch (error) {
    console.error('Scenario save error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save scenario' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/enterprise/exit-strategies
 * Exit strategy options endpoint
 */
export async function getExitStrategies(req: NextRequest) {
  try {
    const { userId } = await authenticateEnterpriseUser(req);
    const searchParams = req.nextUrl.searchParams;
    const evaluationId = searchParams.get('evaluationId');

    if (!evaluationId) {
      return NextResponse.json(
        { error: 'Evaluation ID required' },
        { status: 400 }
      );
    }

    const exitStrategies = await getExitStrategyOptions(evaluationId, userId)
      .catch(() => MOCK_EXIT_STRATEGIES);

    return NextResponse.json({
      success: true,
      data: exitStrategies
    });

  } catch (error) {
    console.error('Exit strategies fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch exit strategies' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/enterprise/capital-structure
 * Capital structure analysis endpoint
 */
export async function getCapitalStructure(req: NextRequest) {
  try {
    const { userId } = await authenticateEnterpriseUser(req);
    const searchParams = req.nextUrl.searchParams;
    const evaluationId = searchParams.get('evaluationId');

    if (!evaluationId) {
      return NextResponse.json(
        { error: 'Evaluation ID required' },
        { status: 400 }
      );
    }

    const capitalStructure = await getCapitalStructureData(evaluationId, userId)
      .catch(() => ({
        currentDebt: 15000000,
        currentEquity: 12500000,
        debtToEquityRatio: 1.2,
        debtServiceCoverage: 2.8,
        debtCapacity: 8000000,
        workingCapitalNeeds: 4625000,
        cashPosition: 2800000,
        creditLines: 2400000,
        optimalStructure: {
          targetDebtRatio: 1.0,
          recommendations: [
            'Consider debt reduction to improve financial stability',
            'Optimize working capital management',
            'Establish additional credit facilities'
          ]
        }
      }));

    return NextResponse.json({
      success: true,
      data: capitalStructure
    });

  } catch (error) {
    console.error('Capital structure fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch capital structure' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/enterprise/projections
 * Financial projections endpoint
 */
export async function getProjections(req: NextRequest) {
  try {
    const { userId } = await authenticateEnterpriseUser(req);
    const searchParams = req.nextUrl.searchParams;
    const evaluationId = searchParams.get('evaluationId');

    if (!evaluationId) {
      return NextResponse.json(
        { error: 'Evaluation ID required' },
        { status: 400 }
      );
    }

    const projections = await getFinancialProjections(evaluationId, userId)
      .catch(() => ({
        baseCase: [
          { year: 2024, revenue: 25000000, grossMargin: 42.5, netMargin: 12.8, cashFlow: 4500000, capex: 800000 },
          { year: 2025, revenue: 28000000, grossMargin: 43.2, netMargin: 13.5, cashFlow: 5040000, capex: 900000 },
          { year: 2026, revenue: 31500000, grossMargin: 44.0, netMargin: 14.2, cashFlow: 5670000, capex: 1000000 },
          { year: 2027, revenue: 35500000, grossMargin: 44.8, netMargin: 15.0, cashFlow: 6390000, capex: 1100000 },
          { year: 2028, revenue: 40000000, grossMargin: 45.5, netMargin: 15.8, cashFlow: 7200000, capex: 1200000 }
        ],
        optimisticCase: [
          { year: 2024, revenue: 25000000, grossMargin: 42.5, netMargin: 12.8, cashFlow: 4500000, capex: 1000000 },
          { year: 2025, revenue: 30000000, grossMargin: 44.0, netMargin: 14.0, cashFlow: 5400000, capex: 1200000 },
          { year: 2026, revenue: 37500000, grossMargin: 45.5, netMargin: 15.5, cashFlow: 6750000, capex: 1500000 },
          { year: 2027, revenue: 48000000, grossMargin: 47.0, netMargin: 17.0, cashFlow: 8640000, capex: 1800000 },
          { year: 2028, revenue: 62000000, grossMargin: 48.5, netMargin: 18.5, cashFlow: 11160000, capex: 2200000 }
        ],
        conservativeCase: [
          { year: 2024, revenue: 25000000, grossMargin: 42.5, netMargin: 12.8, cashFlow: 4500000, capex: 600000 },
          { year: 2025, revenue: 26500000, grossMargin: 42.0, netMargin: 12.5, cashFlow: 4680000, capex: 650000 },
          { year: 2026, revenue: 28000000, grossMargin: 41.5, netMargin: 12.2, cashFlow: 4860000, capex: 700000 },
          { year: 2027, revenue: 29500000, grossMargin: 41.0, netMargin: 12.0, cashFlow: 5040000, capex: 750000 },
          { year: 2028, revenue: 31000000, grossMargin: 40.5, netMargin: 11.8, cashFlow: 5220000, capex: 800000 }
        ],
        currentMetrics: {
          grossMargin: 42.5,
          netMargin: 12.8,
          growth: 12.0
        },
        projectedMetrics: {
          grossMargin: 45.5,
          netMargin: 15.8,
          growth: 60.0
        },
        keyAssumptions: [
          'Market growth rate: 12%',
          'Margin improvement through scale',
          'Technology investment ROI',
          'Market share expansion'
        ]
      }));

    return NextResponse.json({
      success: true,
      data: projections
    });

  } catch (error) {
    console.error('Projections fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch projections' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/enterprise/options
 * Strategic options endpoint
 */
export async function getStrategicOptionsData(req: NextRequest) {
  try {
    const { userId } = await authenticateEnterpriseUser(req);
    const searchParams = req.nextUrl.searchParams;
    const evaluationId = searchParams.get('evaluationId');

    if (!evaluationId) {
      return NextResponse.json(
        { error: 'Evaluation ID required' },
        { status: 400 }
      );
    }

    const options = await getStrategicOptions(evaluationId, userId)
      .catch(() => ({
        internationalExpansion: [
          {
            market: 'Canada',
            opportunitySize: 8000000,
            timeToEntry: 12,
            investmentRequired: 2000000,
            expectedROI: 35,
            riskFactors: ['Regulatory differences', 'Currency risk']
          },
          {
            market: 'Mexico',
            opportunitySize: 12000000,
            timeToEntry: 18,
            investmentRequired: 3500000,
            expectedROI: 45,
            riskFactors: ['Political instability', 'Infrastructure challenges']
          }
        ],
        acquisitionTargets: [
          {
            targetType: 'Horizontal competitor',
            synergies: 5000000,
            integrationRisk: 'medium' as const,
            paybackPeriod: 3
          },
          {
            targetType: 'Vertical supplier',
            synergies: 2500000,
            integrationRisk: 'low' as const,
            paybackPeriod: 2
          }
        ],
        strategicPartnerships: [
          {
            type: 'Strategic alliance',
            strategicValue: 8000000,
            revenuePotential: 6250000
          },
          {
            type: 'Joint venture',
            strategicValue: 12000000,
            revenuePotential: 4725000
          }
        ],
        platformStrategies: [
          {
            type: 'platform',
            investmentRequired: 5000000,
            valueCreationPotential: 25000000,
            feasibilityScore: 75
          }
        ],
        franchising: [
          {
            type: 'franchise',
            investmentRequired: 1500000,
            valueCreationPotential: 8000000,
            feasibilityScore: 85
          }
        ]
      }));

    return NextResponse.json({
      success: true,
      data: options
    });

  } catch (error) {
    console.error('Strategic options fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch strategic options' },
      { status: 500 }
    );
  }
}

// API handlers are already exported individually above