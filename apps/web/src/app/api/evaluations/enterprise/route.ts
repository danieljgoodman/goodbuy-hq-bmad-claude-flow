/**
 * Enterprise Tier Evaluation API
 * Story 11.5: Extended API endpoints for Enterprise tier data access
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  encryptEnterpriseData,
  decryptEnterpriseData
} from '@/lib/security/enterprise-encryption';
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
import {
  getEnterpriseEvaluationOptimized,
  warmUpCache,
  invalidateCache,
} from '@/lib/performance/enterprise-query-optimizer';
import {
  compressScenarioData,
  decompressScenarioData,
  optimizeProjectionsStorage,
  restoreProjectionsFromOptimized,
} from '@/lib/storage/enterprise-data-compression';
import { enterpriseTierSchema } from '@/lib/validations/enterprise-tier';

/**
 * GET /api/evaluations/enterprise
 * Retrieve Enterprise tier evaluation with scenarios
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const evaluationId = searchParams.get('id');
    const includeScenarios = searchParams.get('includeScenarios') !== 'false';

    if (!evaluationId) {
      return NextResponse.json(
        { error: 'Evaluation ID required' },
        { status: 400 }
      );
    }

    // Check user tier and access permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionTier: true },
    });

    if (user?.subscriptionTier !== 'ENTERPRISE') {
      // Check if user has access to RESTRICTED data
      const hasAccess = hasDataAccess({
        userId: session.user.id,
        userTier: user?.subscriptionTier || 'BASIC',
        classification: DataClassification.RESTRICTED,
        accessLevel: AccessLevel.READ,
        resourceId: evaluationId,
      });

      if (!hasAccess) {
        await monitorSecurityEvent('unauthorized_access', session.user.id, {
          evaluationId,
          userTier: user?.subscriptionTier,
        });

        return NextResponse.json(
          { error: 'Enterprise tier required' },
          { status: 403 }
        );
      }
    }

    // Warm up cache for user
    await warmUpCache(session.user.id);

    // Fetch evaluation with optimized query
    const evaluation = await getEnterpriseEvaluationOptimized(
      evaluationId,
      includeScenarios
    );

    if (!evaluation) {
      return NextResponse.json(
        { error: 'Evaluation not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (evaluation.userId !== session.user.id) {
      await monitorSecurityEvent('unauthorized_access', session.user.id, {
        evaluationId,
        actualUserId: evaluation.userId,
      });

      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Decrypt sensitive Enterprise data
    if (evaluation.enterpriseTierData) {
      evaluation.enterpriseTierData = decryptEnterpriseData(
        evaluation.enterpriseTierData
      );
    }

    // Decompress scenario data if included
    if (includeScenarios && evaluation.EnterpriseScenarioModel) {
      const scenario = evaluation.EnterpriseScenarioModel;

      if (scenario.baseScenario) {
        scenario.baseScenario = await decompressScenarioData(
          scenario.baseScenario,
          'gzip'
        );
      }
      if (scenario.optimisticScenario) {
        scenario.optimisticScenario = await decompressScenarioData(
          scenario.optimisticScenario,
          'gzip'
        );
      }
      if (scenario.conservativeScenario) {
        scenario.conservativeScenario = await decompressScenarioData(
          scenario.conservativeScenario,
          'gzip'
        );
      }
    }

    // Log access for audit trail
    await createAuditLogEntry({
      businessEvaluationId: evaluationId,
      action: AuditAction.READ,
      userId: session.user.id,
      userTier: 'ENTERPRISE',
      metadata: {
        includeScenarios,
        fieldAccessed: 'enterprise_evaluation',
      },
    });

    return NextResponse.json({
      success: true,
      data: evaluation,
    });

  } catch (error) {
    console.error('Enterprise evaluation GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve Enterprise evaluation' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/evaluations/enterprise
 * Create or update Enterprise tier evaluation with scenarios
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify Enterprise tier
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionTier: true },
    });

    if (user?.subscriptionTier !== 'ENTERPRISE') {
      return NextResponse.json(
        { error: 'Enterprise tier required' },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Validate Enterprise tier data
    const validationResult = enterpriseTierSchema.safeParse(body.enterpriseData);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const { evaluationId, enterpriseData, scenarios } = body;

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get or create base evaluation
      let evaluation;

      if (evaluationId) {
        // Update existing
        evaluation = await tx.businessEvaluation.findUnique({
          where: { id: evaluationId },
        });

        if (!evaluation || evaluation.userId !== session.user.id) {
          throw new Error('Evaluation not found or access denied');
        }
      } else {
        // Create new
        evaluation = await tx.businessEvaluation.create({
          data: {
            userId: session.user.id,
            subscriptionTier: 'ENTERPRISE',
            businessName: body.businessName || 'Enterprise Evaluation',
            industry: body.industry || 'Other',
            // Basic and Professional data would be here
            professionalTierData: body.professionalData || {},
          },
        });
      }

      // Encrypt sensitive Enterprise data
      const encryptedData = encryptEnterpriseData(validationResult.data);

      // Update with Enterprise data
      evaluation = await tx.businessEvaluation.update({
        where: { id: evaluation.id },
        data: {
          enterpriseTierData: encryptedData,
          subscriptionTier: 'ENTERPRISE',
          updatedAt: new Date(),
        },
      });

      // Handle scenario data
      if (scenarios) {
        // Optimize and compress scenario data
        const optimizedBase = await compressScenarioData(scenarios.base);
        const optimizedOptimistic = await compressScenarioData(scenarios.optimistic);
        const optimizedConservative = await compressScenarioData(scenarios.conservative);

        // Upsert scenario model
        await tx.enterpriseScenarioModel.upsert({
          where: { businessEvaluationId: evaluation.id },
          create: {
            businessEvaluationId: evaluation.id,
            baseScenario: optimizedBase.compressed,
            optimisticScenario: optimizedOptimistic.compressed,
            conservativeScenario: optimizedConservative.compressed,
            customScenarios: scenarios.custom || {},
            projectionHorizon: scenarios.horizon || 5,
            calculationVersion: '1.0.0',
          },
          update: {
            baseScenario: optimizedBase.compressed,
            optimisticScenario: optimizedOptimistic.compressed,
            conservativeScenario: optimizedConservative.compressed,
            customScenarios: scenarios.custom || {},
            projectionHorizon: scenarios.horizon || 5,
            lastUpdated: new Date(),
          },
        });
      }

      // Create audit log entry
      await tx.auditLogEntry.create({
        data: {
          businessEvaluationId: evaluation.id,
          action: evaluationId ? AuditAction.UPDATE : AuditAction.CREATE,
          userId: session.user.id,
          userTier: 'ENTERPRISE',
          timestamp: new Date(),
          metadata: {
            fieldsUpdated: Object.keys(enterpriseData),
            scenariosUpdated: !!scenarios,
          },
        },
      });

      return evaluation;
    });

    // Invalidate cache for this evaluation
    await invalidateCache(result.id);

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        message: evaluationId ? 'Enterprise evaluation updated' : 'Enterprise evaluation created',
      },
    });

  } catch (error) {
    console.error('Enterprise evaluation POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save Enterprise evaluation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/evaluations/enterprise
 * Delete Enterprise tier evaluation and all related data
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
    const evaluationId = searchParams.get('id');

    if (!evaluationId) {
      return NextResponse.json(
        { error: 'Evaluation ID required' },
        { status: 400 }
      );
    }

    // Verify ownership and Enterprise tier
    const evaluation = await prisma.businessEvaluation.findUnique({
      where: { id: evaluationId },
      select: { userId: true, subscriptionTier: true },
    });

    if (!evaluation) {
      return NextResponse.json(
        { error: 'Evaluation not found' },
        { status: 404 }
      );
    }

    if (evaluation.userId !== session.user.id) {
      await monitorSecurityEvent('unauthorized_access', session.user.id, {
        action: 'delete',
        evaluationId,
      });

      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete evaluation (cascades to scenarios and audit logs)
    await prisma.businessEvaluation.delete({
      where: { id: evaluationId },
    });

    // Log deletion
    await createAuditLogEntry({
      businessEvaluationId: evaluationId,
      action: AuditAction.DELETE,
      userId: session.user.id,
      userTier: evaluation.subscriptionTier,
      metadata: {
        deletedAt: new Date().toISOString(),
      },
    });

    // Invalidate cache
    await invalidateCache(evaluationId);

    return NextResponse.json({
      success: true,
      message: 'Enterprise evaluation deleted',
    });

  } catch (error) {
    console.error('Enterprise evaluation DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete Enterprise evaluation' },
      { status: 500 }
    );
  }
}