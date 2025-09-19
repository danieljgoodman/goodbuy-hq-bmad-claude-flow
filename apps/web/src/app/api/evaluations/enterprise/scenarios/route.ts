/**
 * Enterprise Scenario Modeling API
 * Story 11.5: API endpoints for multi-scenario strategic planning
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  calculateEnterpriseScenarios,
  compareScenarioOutcomes,
  generateStrategicRecommendations,
} from '@/lib/scenarios/enterprise-scenarios';
import {
  createAuditLogEntry,
  AuditAction
} from '@/lib/audit/enterprise-audit-log';
import {
  compareScenarios,
  QueryPerformanceMonitor,
} from '@/lib/performance/enterprise-query-optimizer';
import {
  optimizeProjectionsStorage,
  restoreProjectionsFromOptimized,
  StorageMonitor,
} from '@/lib/storage/enterprise-data-compression';

// Scenario update schema
const scenarioUpdateSchema = z.object({
  evaluationId: z.string(),
  scenarioType: z.enum(['base', 'optimistic', 'conservative', 'custom']),
  projections: z.object({
    year1: z.object({
      revenue: z.number(),
      grossMargin: z.number(),
      netMargin: z.number(),
      cashFlow: z.number(),
      capex: z.number(),
    }),
    year2: z.object({
      revenue: z.number(),
      grossMargin: z.number(),
      netMargin: z.number(),
      cashFlow: z.number(),
      capex: z.number(),
    }),
    year3: z.object({
      revenue: z.number(),
      grossMargin: z.number(),
      netMargin: z.number(),
      cashFlow: z.number(),
      capex: z.number(),
    }),
    year4: z.object({
      revenue: z.number(),
      grossMargin: z.number(),
      netMargin: z.number(),
      cashFlow: z.number(),
      capex: z.number(),
    }),
    year5: z.object({
      revenue: z.number(),
      grossMargin: z.number(),
      netMargin: z.number(),
      cashFlow: z.number(),
      capex: z.number(),
    }),
  }),
  assumptions: z.object({
    growthRate: z.number(),
    marketExpansion: z.boolean(),
    investmentRequired: z.number(),
    riskLevel: z.enum(['low', 'medium', 'high']),
  }).optional(),
});

/**
 * GET /api/evaluations/enterprise/scenarios
 * Retrieve scenario modeling data for an evaluation
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const evaluationId = searchParams.get('evaluationId');
    const scenarioTypes = searchParams.get('types')?.split(',') || ['base', 'optimistic', 'conservative'];
    const compare = searchParams.get('compare') === 'true';

    if (!evaluationId) {
      return NextResponse.json(
        { error: 'Evaluation ID required' },
        { status: 400 }
      );
    }

    // Verify ownership and Enterprise tier
    const evaluation = await prisma.businessEvaluation.findUnique({
      where: { id: evaluationId },
      select: {
        userId: true,
        subscriptionTier: true,
        enterpriseTierData: true,
      },
    });

    if (!evaluation || evaluation.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Evaluation not found or access denied' },
        { status: 404 }
      );
    }

    if (evaluation.subscriptionTier !== 'ENTERPRISE') {
      return NextResponse.json(
        { error: 'Enterprise tier required for scenario modeling' },
        { status: 403 }
      );
    }

    // Fetch scenarios with optimized query
    const scenarios = await compareScenarios(
      evaluationId,
      scenarioTypes as ('base' | 'optimistic' | 'conservative')[]
    );

    if (!scenarios) {
      return NextResponse.json(
        { error: 'No scenarios found' },
        { status: 404 }
      );
    }

    const result: any = {
      scenarios: {},
      metadata: {
        projectionHorizon: scenarios.projectionHorizon,
        lastUpdated: scenarios.lastUpdated,
      },
    };

    // Decompress and restore scenario data
    for (const type of scenarioTypes) {
      const scenarioData = scenarios[`${type}Scenario`];
      if (scenarioData) {
        result.scenarios[type] = await restoreProjectionsFromOptimized(
          scenarioData,
          'delta+gzip'
        );
      }
    }

    // Compare scenarios if requested
    if (compare && Object.keys(result.scenarios).length > 1) {
      result.comparison = compareScenarioOutcomes(
        result.scenarios,
        evaluation.enterpriseTierData
      );

      // Generate strategic recommendations
      result.recommendations = generateStrategicRecommendations(
        result.comparison,
        evaluation.enterpriseTierData
      );
    }

    // Log access
    await createAuditLogEntry({
      businessEvaluationId: evaluationId,
      action: AuditAction.READ,
      userId: session.user.id,
      userTier: 'ENTERPRISE',
      fieldName: 'scenarios',
      metadata: {
        scenarioTypes,
        compare,
      },
    });

    // Record performance
    QueryPerformanceMonitor.recordQuery('getScenarios', Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: result,
      performance: {
        queryTime: Date.now() - startTime,
      },
    });

  } catch (error) {
    console.error('Scenarios GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve scenarios' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/evaluations/enterprise/scenarios
 * Create or update scenario modeling data
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Validate request
    const validationResult = scenarioUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const { evaluationId, scenarioType, projections, assumptions } = validationResult.data;

    // Verify ownership and Enterprise tier
    const evaluation = await prisma.businessEvaluation.findUnique({
      where: { id: evaluationId },
      select: {
        userId: true,
        subscriptionTier: true,
        enterpriseTierData: true,
      },
    });

    if (!evaluation || evaluation.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Evaluation not found or access denied' },
        { status: 404 }
      );
    }

    if (evaluation.subscriptionTier !== 'ENTERPRISE') {
      return NextResponse.json(
        { error: 'Enterprise tier required' },
        { status: 403 }
      );
    }

    // Convert projections to array format
    const projectionsArray = [
      { year: 1, ...projections.year1 },
      { year: 2, ...projections.year2 },
      { year: 3, ...projections.year3 },
      { year: 4, ...projections.year4 },
      { year: 5, ...projections.year5 },
    ];

    // Calculate derived metrics and valuation
    const scenarioData = await calculateEnterpriseScenarios(
      evaluation.enterpriseTierData,
      {
        baseCase: scenarioType === 'base' ? projectionsArray : [],
        optimisticCase: scenarioType === 'optimistic' ? projectionsArray : [],
        conservativeCase: scenarioType === 'conservative' ? projectionsArray : [],
      }
    );

    // Optimize storage
    const optimized = await optimizeProjectionsStorage({
      ...scenarioData,
      currentGrossMargin: projections.year1.grossMargin,
      projectedGrossMarginYear5: projections.year5.grossMargin,
      currentNetMargin: projections.year1.netMargin,
      projectedNetMarginYear5: projections.year5.netMargin,
      maintenanceCapexPercentage: 0.05, // Default
      growthCapexFiveYear: assumptions?.investmentRequired || 0,
      projectedMarketPosition: 'niche',
      competitiveThreats: '',
      strategicOptions: [],
    });

    // Update or create scenario model
    const scenarioFieldMap = {
      base: 'baseScenario',
      optimistic: 'optimisticScenario',
      conservative: 'conservativeScenario',
      custom: 'customScenarios',
    };

    const updateData = {
      [scenarioFieldMap[scenarioType]]: optimized.optimized,
      lastUpdated: new Date(),
    };

    const scenarioModel = await prisma.enterpriseScenarioModel.upsert({
      where: { businessEvaluationId: evaluationId },
      create: {
        businessEvaluationId: evaluationId,
        ...updateData,
        projectionHorizon: 5,
        calculationVersion: '1.0.0',
      },
      update: updateData,
    });

    // Log update
    await createAuditLogEntry({
      businessEvaluationId: evaluationId,
      action: AuditAction.UPDATE,
      userId: session.user.id,
      userTier: 'ENTERPRISE',
      fieldName: `scenario.${scenarioType}`,
      newValue: { projections: projectionsArray, assumptions },
    });

    // Record storage metrics
    StorageMonitor.recordStorage(optimized.originalSize, optimized.optimizedSize);

    // Record performance
    QueryPerformanceMonitor.recordQuery('updateScenario', Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: {
        scenarioId: scenarioModel.id,
        scenarioType,
        storageOptimization: {
          originalSize: optimized.originalSize,
          optimizedSize: optimized.optimizedSize,
          compressionRatio: optimized.originalSize / optimized.optimizedSize,
        },
      },
      performance: {
        updateTime: Date.now() - startTime,
      },
    });

  } catch (error) {
    console.error('Scenarios POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update scenario' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/evaluations/enterprise/scenarios
 * Delete specific scenario or all scenarios
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const evaluationId = searchParams.get('evaluationId');
    const scenarioType = searchParams.get('type');

    if (!evaluationId) {
      return NextResponse.json(
        { error: 'Evaluation ID required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const evaluation = await prisma.businessEvaluation.findUnique({
      where: { id: evaluationId },
      select: { userId: true, subscriptionTier: true },
    });

    if (!evaluation || evaluation.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Evaluation not found or access denied' },
        { status: 404 }
      );
    }

    if (scenarioType) {
      // Delete specific scenario
      const scenarioFieldMap = {
        base: 'baseScenario',
        optimistic: 'optimisticScenario',
        conservative: 'conservativeScenario',
        custom: 'customScenarios',
      };

      const field = scenarioFieldMap[scenarioType as keyof typeof scenarioFieldMap];

      if (!field) {
        return NextResponse.json(
          { error: 'Invalid scenario type' },
          { status: 400 }
        );
      }

      await prisma.enterpriseScenarioModel.update({
        where: { businessEvaluationId: evaluationId },
        data: {
          [field]: null,
          lastUpdated: new Date(),
        },
      });

      await createAuditLogEntry({
        businessEvaluationId: evaluationId,
        action: AuditAction.DELETE,
        userId: session.user.id,
        userTier: 'ENTERPRISE',
        fieldName: `scenario.${scenarioType}`,
      });

      return NextResponse.json({
        success: true,
        message: `${scenarioType} scenario deleted`,
      });

    } else {
      // Delete all scenarios
      await prisma.enterpriseScenarioModel.delete({
        where: { businessEvaluationId: evaluationId },
      });

      await createAuditLogEntry({
        businessEvaluationId: evaluationId,
        action: AuditAction.DELETE,
        userId: session.user.id,
        userTier: 'ENTERPRISE',
        fieldName: 'scenarios.all',
      });

      return NextResponse.json({
        success: true,
        message: 'All scenarios deleted',
      });
    }

  } catch (error) {
    console.error('Scenarios DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete scenarios' },
      { status: 500 }
    );
  }
}