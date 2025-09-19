/**
 * Enterprise Tier Report Generation API
 * Integrates with EnhancedReportGenerator for Professional and Enterprise tier reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { EnhancedReportGenerator } from '@/lib/reports/enhanced-report-generator';
import { ReportTier, ReportGenerationConfig } from '@/types/enhanced-reports';
import { prisma } from '@/lib/prisma';
import {
  createAuditLogEntry,
  AuditAction
} from '@/lib/audit/enterprise-audit-log';

// Enhanced report generation schema
const generateEnhancedReportSchema = z.object({
  evaluationId: z.string().min(1, 'Evaluation ID is required'),
  tier: z.enum(['PROFESSIONAL', 'ENTERPRISE']),
  reportType: z.enum(['comprehensive', 'investor', 'executive', 'custom']),
  config: z.object({
    includeScenarioAnalysis: z.boolean().default(false),
    includeCapitalStructure: z.boolean().default(false),
    includeExitStrategy: z.boolean().default(false),
    includeStrategicOptions: z.boolean().default(false),
    includeMultiYearProjections: z.boolean().default(true),
    chartResolution: z.enum(['standard', 'high', 'print']).default('high'),
    customSections: z.array(z.string()).optional(),
    branding: z.object({
      primaryColor: z.string().optional(),
      logo: z.string().optional(),
      companyName: z.string().optional()
    }).optional()
  }).optional(),
  deliveryFormat: z.enum(['pdf', 'html', 'both']).default('pdf'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal')
});

/**
 * POST /api/reports/enterprise
 * Generate enhanced reports using Professional or Enterprise tier features
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
    const validationResult = generateEnhancedReportSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const { evaluationId, tier, reportType, config, deliveryFormat, priority } = validationResult.data;

    // Verify evaluation ownership and tier access
    const evaluation = await prisma.businessEvaluation.findUnique({
      where: { id: evaluationId },
      select: {
        id: true,
        userId: true,
        subscriptionTier: true,
        businessData: true,
        enterpriseTierData: true,
        createdAt: true,
        healthScore: true,
        valuations: true
      }
    });

    if (!evaluation || evaluation.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Evaluation not found or access denied' },
        { status: 404 }
      );
    }

    // Check tier access
    if (tier === 'ENTERPRISE' && evaluation.subscriptionTier !== 'ENTERPRISE') {
      return NextResponse.json(
        { error: 'Enterprise tier subscription required for Enterprise reports' },
        { status: 403 }
      );
    }

    if (tier === 'PROFESSIONAL' && !['PROFESSIONAL', 'ENTERPRISE'].includes(evaluation.subscriptionTier || '')) {
      return NextResponse.json(
        { error: 'Professional or Enterprise tier subscription required' },
        { status: 403 }
      );
    }

    // Get the enhanced report generator instance
    const reportGenerator = EnhancedReportGenerator.getInstance();

    // Create report generation configuration
    const reportConfig: ReportGenerationConfig = {
      evaluationId,
      userId: session.user.id,
      tier: tier as ReportTier,
      reportType,
      deliveryFormat,
      priority,
      config: {
        includeScenarioAnalysis: config?.includeScenarioAnalysis || false,
        includeCapitalStructure: config?.includeCapitalStructure || false,
        includeExitStrategy: config?.includeExitStrategy || false,
        includeStrategicOptions: config?.includeStrategicOptions || false,
        includeMultiYearProjections: config?.includeMultiYearProjections !== false,
        chartResolution: config?.chartResolution || 'high',
        customSections: config?.customSections,
        branding: config?.branding
      }
    };

    // Generate the enhanced report
    let reportResult;

    if (tier === 'ENTERPRISE') {
      reportResult = await reportGenerator.generateEnterpriseReport(reportConfig);
    } else {
      reportResult = await reportGenerator.generateProfessionalReport(reportConfig);
    }

    // Create audit log entry
    await createAuditLogEntry({
      businessEvaluationId: evaluationId,
      action: AuditAction.CREATE,
      userId: session.user.id,
      userTier: evaluation.subscriptionTier || 'FREE',
      fieldName: 'enhanced_report',
      newValue: {
        tier,
        reportType,
        deliveryFormat,
        config: reportConfig.config
      },
      metadata: {
        reportId: reportResult.reportId,
        generationTime: reportResult.performance.generationTime,
        pageCount: reportResult.metadata.pageCount,
        chartCount: reportResult.performance.chartsGenerated
      }
    });

    // Update evaluation record with report reference
    await prisma.businessEvaluation.update({
      where: { id: evaluationId },
      data: {
        lastReportGenerated: new Date(),
        reportCount: {
          increment: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        reportId: reportResult.reportId,
        reportType,
        tier,
        deliveryFormat,
        downloadUrl: reportResult.downloadUrl,
        previewUrl: reportResult.previewUrl,
        metadata: {
          title: reportResult.metadata.title,
          pageCount: reportResult.metadata.pageCount,
          generatedAt: reportResult.metadata.generatedAt,
          fileSize: reportResult.metadata.fileSize,
          expiresAt: reportResult.metadata.expiresAt
        },
        performance: {
          generationTime: reportResult.performance.generationTime,
          chartsGenerated: reportResult.performance.chartsGenerated,
          sectionsIncluded: reportResult.performance.sectionsIncluded,
          memoryUsage: reportResult.performance.memoryUsage
        }
      },
      performance: {
        totalTime: Date.now() - startTime,
        apiOverhead: Date.now() - startTime - reportResult.performance.generationTime
      }
    });

  } catch (error) {
    console.error('Enhanced report generation error:', error);

    // Log error for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }

    return NextResponse.json(
      {
        error: 'Failed to generate enhanced report',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reports/enterprise
 * Get enhanced report status, history, or download existing reports
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
    const reportId = searchParams.get('reportId');
    const evaluationId = searchParams.get('evaluationId');
    const action = searchParams.get('action') || 'status';

    // Get specific report status
    if (reportId && action === 'status') {
      const reportGenerator = EnhancedReportGenerator.getInstance();
      const status = await reportGenerator.getReportStatus(reportId);

      if (!status) {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: status
      });
    }

    // Get report history for evaluation
    if (evaluationId && action === 'history') {
      // Verify evaluation ownership
      const evaluation = await prisma.businessEvaluation.findUnique({
        where: { id: evaluationId },
        select: { userId: true }
      });

      if (!evaluation || evaluation.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Evaluation not found or access denied' },
          { status: 404 }
        );
      }

      const reportGenerator = EnhancedReportGenerator.getInstance();
      const history = await reportGenerator.getReportHistory(session.user.id, evaluationId);

      return NextResponse.json({
        success: true,
        data: {
          evaluationId,
          reports: history
        }
      });
    }

    // Get user's report statistics
    if (action === 'stats') {
      const reportGenerator = EnhancedReportGenerator.getInstance();
      const stats = await reportGenerator.getUserReportStats(session.user.id);

      return NextResponse.json({
        success: true,
        data: stats
      });
    }

    return NextResponse.json(
      { error: 'Invalid request parameters' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Enhanced report GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve report information' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports/enterprise
 * Delete enhanced reports (cleanup expired or user-requested deletions)
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
    const reportId = searchParams.get('reportId');
    const evaluationId = searchParams.get('evaluationId');
    const deleteAll = searchParams.get('deleteAll') === 'true';

    const reportGenerator = EnhancedReportGenerator.getInstance();

    if (reportId) {
      // Delete specific report
      const success = await reportGenerator.deleteReport(reportId, session.user.id);

      if (!success) {
        return NextResponse.json(
          { error: 'Report not found or access denied' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Report deleted successfully'
      });
    }

    if (evaluationId && deleteAll) {
      // Verify evaluation ownership
      const evaluation = await prisma.businessEvaluation.findUnique({
        where: { id: evaluationId },
        select: { userId: true }
      });

      if (!evaluation || evaluation.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Evaluation not found or access denied' },
          { status: 404 }
        );
      }

      // Delete all reports for evaluation
      const deletedCount = await reportGenerator.deleteReportsForEvaluation(evaluationId, session.user.id);

      return NextResponse.json({
        success: true,
        message: `${deletedCount} reports deleted successfully`
      });
    }

    return NextResponse.json(
      { error: 'Invalid request parameters' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Enhanced report DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}