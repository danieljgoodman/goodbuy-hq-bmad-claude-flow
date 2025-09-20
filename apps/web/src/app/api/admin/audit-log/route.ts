import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { rateLimit } from '@/lib/utils/rate-limit';
import { validateAdminPermissions, getAdminAuditLog } from '@/lib/admin/tier-admin-controls';
import { AdminPermissionError, AdminAuditQuery } from '@/types/admin-controls';
import { z } from 'zod';

// Rate limiting: 50 requests per minute for audit log
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

// Validation schema
const AuditLogQuerySchema = z.object({
  adminId: z.string().optional(),
  targetUserId: z.string().optional(),
  actionType: z.enum(['tier_override', 'access_grant', 'permission_change', 'user_modification']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.string().transform(val => Math.min(parseInt(val, 10) || 50, 200)).optional(),
  offset: z.string().transform(val => Math.max(parseInt(val, 10) || 0, 0)).optional()
});

// GET /api/admin/audit-log - Get admin audit log with filtering
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting
    try {
      await limiter.check(request, 50, 'ADMIN_AUDIT_LOG');
    } catch {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Get current user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate admin permissions
    const { isValid, error: permissionError } = await validateAdminPermissions('view_audit');
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: permissionError || 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryData = AuditLogQuerySchema.parse({
      adminId: searchParams.get('adminId') || undefined,
      targetUserId: searchParams.get('targetUserId') || undefined,
      actionType: searchParams.get('actionType') as any || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined
    });

    // Build audit query
    const auditQuery: AdminAuditQuery = {
      adminId: queryData.adminId,
      targetUserId: queryData.targetUserId,
      actionType: queryData.actionType,
      startDate: queryData.startDate ? new Date(queryData.startDate) : undefined,
      endDate: queryData.endDate ? new Date(queryData.endDate) : undefined,
      limit: queryData.limit,
      offset: queryData.offset
    };

    // Get audit log
    const actions = await getAdminAuditLog(auditQuery);

    // Get additional statistics for context
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get total count for pagination
    let totalCountQuery = supabase
      .from('admin_audit_log')
      .select('*', { count: 'exact', head: true });

    if (queryData.adminId) {
      totalCountQuery = totalCountQuery.eq('admin_id', queryData.adminId);
    }
    if (queryData.targetUserId) {
      totalCountQuery = totalCountQuery.eq('target_user_id', queryData.targetUserId);
    }
    if (queryData.actionType) {
      totalCountQuery = totalCountQuery.eq('type', queryData.actionType);
    }
    if (queryData.startDate) {
      totalCountQuery = totalCountQuery.gte('timestamp', queryData.startDate);
    }
    if (queryData.endDate) {
      totalCountQuery = totalCountQuery.lte('timestamp', queryData.endDate);
    }

    const { count: totalCount } = await totalCountQuery;

    // Get action type statistics for the current filter
    const { data: actionStats } = await supabase
      .from('admin_audit_log')
      .select('type')
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

    const actionTypeStats = actionStats?.reduce((acc, action) => {
      acc[action.type] = (acc[action.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Get recent admin activity summary
    const { data: recentActivity } = await supabase
      .from('admin_audit_log')
      .select('admin_email, timestamp')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('timestamp', { ascending: false });

    const uniqueAdmins = new Set(recentActivity?.map(a => a.admin_email) || []);

    const response = {
      success: true,
      actions,
      total: totalCount || 0,
      hasMore: actions.length === (queryData.limit || 50),
      pagination: {
        limit: queryData.limit || 50,
        offset: queryData.offset || 0,
        total: totalCount || 0
      },
      statistics: {
        actionTypes: actionTypeStats,
        recentActiveAdmins: uniqueAdmins.size,
        totalRecentActions: recentActivity?.length || 0
      },
      filters: {
        adminId: queryData.adminId,
        targetUserId: queryData.targetUserId,
        actionType: queryData.actionType,
        startDate: queryData.startDate,
        endDate: queryData.endDate
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Audit log retrieval error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          message: error.errors.map(e => e.message).join(', ')
        },
        { status: 400 }
      );
    }

    if (error instanceof AdminPermissionError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/audit-log/export - Export audit log data
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting (stricter for exports)
    try {
      await limiter.check(request, 5, 'ADMIN_AUDIT_EXPORT');
    } catch {
      return NextResponse.json(
        { success: false, error: 'Too many export requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Get current user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate admin permissions
    const { isValid, error: permissionError } = await validateAdminPermissions('view_audit');
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: permissionError || 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { format = 'csv', filters = {} } = body;

    if (!['csv', 'json'].includes(format)) {
      return NextResponse.json(
        { success: false, error: 'Invalid export format. Use csv or json.' },
        { status: 400 }
      );
    }

    // Build audit query with filters
    const auditQuery: AdminAuditQuery = {
      adminId: filters.adminId,
      targetUserId: filters.targetUserId,
      actionType: filters.actionType,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      limit: 10000 // Maximum export limit
    };

    // Get audit log
    const actions = await getAdminAuditLog(auditQuery);

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = [
        'Timestamp',
        'Admin Email',
        'Action Type',
        'Action',
        'Target User Email',
        'Reason',
        'Old Value',
        'New Value',
        'IP Address'
      ];

      const csvRows = actions.map(action => [
        action.timestamp.toISOString(),
        action.adminEmail,
        action.type,
        action.action,
        action.targetUserEmail,
        action.reason,
        action.oldValue || '',
        action.newValue || '',
        action.ipAddress || ''
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-log-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } else {
      // Return JSON
      return NextResponse.json({
        success: true,
        data: actions,
        exportedAt: new Date().toISOString(),
        filters,
        total: actions.length
      });
    }

  } catch (error) {
    console.error('Audit log export error:', error);

    if (error instanceof AdminPermissionError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}