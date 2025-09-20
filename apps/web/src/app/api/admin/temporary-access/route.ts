import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { rateLimit } from '@/lib/utils/rate-limit';
import {
  createTemporaryAccessGrant,
  validateAdminPermissions,
  logAdminAction,
  expireTemporaryAccessGrant
} from '@/lib/admin/tier-admin-controls';
import {
  TemporaryAccessRequest,
  TemporaryAccessResponse,
  TemporaryAccessError,
  AdminPermissionError
} from '@/types/admin-controls';
import { z } from 'zod';

// Rate limiting: 15 requests per minute for temporary access
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

// Validation schema
const TemporaryAccessRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  grantedTier: z.enum(['professional', 'enterprise'], {
    errorMap: () => ({ message: 'Invalid tier. Must be professional or enterprise' })
  }),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  duration: z.number().min(5).max(10080, 'Duration must be between 5 minutes and 1 week'),
  notifyUser: z.boolean().default(true),
  metadata: z.record(z.any()).optional()
});

const TemporaryAccessQuerySchema = z.object({
  userId: z.string().optional(),
  adminId: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  grantedTier: z.enum(['professional', 'enterprise']).optional(),
  limit: z.string().transform(val => parseInt(val, 10)).optional(),
  offset: z.string().transform(val => parseInt(val, 10)).optional()
});

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfIP) {
    return cfIP;
  }
  return request.ip || 'unknown';
}

// POST /api/admin/temporary-access - Create temporary access grant
export async function POST(request: NextRequest): Promise<NextResponse<TemporaryAccessResponse>> {
  try {
    // Rate limiting
    try {
      await limiter.check(request, 15, 'ADMIN_TEMPORARY_ACCESS');
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
    const { isValid, adminId, error: permissionError } = await validateAdminPermissions('temporary_access');
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: permissionError || 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = TemporaryAccessRequestSchema.parse(body);

    // Create temporary access grant
    const grant = await createTemporaryAccessGrant(validatedData);

    // Log successful action with additional context
    await logAdminAction({
      type: 'access_grant',
      adminId,
      adminEmail: user.emailAddresses[0]?.emailAddress || '',
      targetUserId: validatedData.userId,
      targetUserEmail: '', // This will be filled by the createTemporaryAccessGrant function
      action: 'create_temporary_access',
      reason: validatedData.reason,
      oldValue: 'unknown', // Will be filled by the createTemporaryAccessGrant function
      newValue: validatedData.grantedTier,
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
      metadata: {
        duration: validatedData.duration,
        expiresAt: grant.expiresAt.toISOString(),
        notifyUser: validatedData.notifyUser,
        ...validatedData.metadata
      }
    });

    return NextResponse.json({
      success: true,
      grant,
      message: 'Temporary access granted successfully'
    });

  } catch (error) {
    console.error('Temporary access creation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: error.errors.map(e => e.message).join(', ')
        },
        { status: 400 }
      );
    }

    if (error instanceof TemporaryAccessError) {
      const statusCode = error.code === 'UNAUTHORIZED' ? 403 :
                        error.code === 'USER_NOT_FOUND' ? 404 :
                        error.code === 'ALREADY_GRANTED' ? 409 : 400;

      return NextResponse.json(
        { success: false, error: error.message },
        { status: statusCode }
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

// GET /api/admin/temporary-access - List temporary access grants
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting
    try {
      await limiter.check(request, 50, 'ADMIN_TEMPORARY_ACCESS_LIST');
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryData = TemporaryAccessQuerySchema.parse({
      userId: searchParams.get('userId') || undefined,
      adminId: searchParams.get('adminId') || undefined,
      isActive: searchParams.get('isActive') || undefined,
      grantedTier: searchParams.get('grantedTier') as any || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined
    });

    // Build Supabase query
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

    let query = supabase
      .from('temporary_access_grants')
      .select(`
        *,
        users!inner(email)
      `)
      .order('created_at', { ascending: false });

    if (queryData.userId) {
      query = query.eq('user_id', queryData.userId);
    }
    if (queryData.adminId) {
      query = query.eq('admin_id', queryData.adminId);
    }
    if (queryData.isActive !== undefined) {
      query = query.eq('is_active', queryData.isActive === 'true');
    }
    if (queryData.grantedTier) {
      query = query.eq('granted_tier', queryData.grantedTier);
    }
    if (queryData.limit) {
      query = query.limit(queryData.limit);
    }
    if (queryData.offset) {
      query = query.range(queryData.offset, queryData.offset + (queryData.limit || 20) - 1);
    }

    const { data: grants, error: queryError, count } = await query;

    if (queryError) {
      throw new Error(`Failed to fetch temporary access grants: ${queryError.message}`);
    }

    // Transform data
    const transformedGrants = grants?.map(grant => ({
      id: grant.id,
      userId: grant.user_id,
      userEmail: grant.users.email,
      grantedTier: grant.granted_tier,
      reason: grant.reason,
      adminId: grant.admin_id,
      adminEmail: grant.admin_email,
      duration: grant.duration,
      createdAt: new Date(grant.created_at),
      expiresAt: new Date(grant.expires_at),
      isActive: grant.is_active,
      notificationsSent: grant.notifications_sent,
      metadata: grant.metadata,
      timeRemaining: grant.is_active ? Math.max(0, new Date(grant.expires_at).getTime() - Date.now()) : 0
    })) || [];

    return NextResponse.json({
      success: true,
      grants: transformedGrants,
      total: count || 0,
      hasMore: queryData.limit ? transformedGrants.length === queryData.limit : false
    });

  } catch (error) {
    console.error('Temporary access grants list error:', error);

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

// DELETE /api/admin/temporary-access/[id] - Revoke temporary access grant
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // Get grant ID from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const grantId = pathSegments[pathSegments.length - 1];

    if (!grantId) {
      return NextResponse.json(
        { success: false, error: 'Grant ID is required' },
        { status: 400 }
      );
    }

    // Rate limiting
    try {
      await limiter.check(request, 10, 'ADMIN_TEMPORARY_ACCESS_REVOKE');
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
    const { isValid, adminId, error: permissionError } = await validateAdminPermissions('temporary_access');
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: permissionError || 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body for reason
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'Reason is required and must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Get grant details
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

    const { data: grant, error: fetchError } = await supabase
      .from('temporary_access_grants')
      .select(`
        *,
        users!inner(email, tier)
      `)
      .eq('id', grantId)
      .single();

    if (fetchError || !grant) {
      return NextResponse.json(
        { success: false, error: 'Temporary access grant not found' },
        { status: 404 }
      );
    }

    if (!grant.is_active) {
      return NextResponse.json(
        { success: false, error: 'Temporary access grant is already inactive' },
        { status: 400 }
      );
    }

    // Expire the grant (this handles tier restoration)
    await expireTemporaryAccessGrant(grantId);

    // Log admin action
    await logAdminAction({
      type: 'access_grant',
      adminId,
      adminEmail: user.emailAddresses[0]?.emailAddress || '',
      targetUserId: grant.user_id,
      targetUserEmail: grant.users.email,
      action: 'revoke_temporary_access',
      reason,
      oldValue: grant.granted_tier,
      newValue: grant.users.tier, // Current tier after revocation
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
      metadata: {
        grantId,
        revokedAt: new Date().toISOString(),
        originalExpiresAt: grant.expires_at
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Temporary access grant revoked successfully'
    });

  } catch (error) {
    console.error('Temporary access grant revocation error:', error);

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

// PUT /api/admin/temporary-access/[id]/extend - Extend temporary access grant
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    // Get grant ID from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const grantId = pathSegments[pathSegments.indexOf('temporary-access') + 1];

    if (!grantId) {
      return NextResponse.json(
        { success: false, error: 'Grant ID is required' },
        { status: 400 }
      );
    }

    // Rate limiting
    try {
      await limiter.check(request, 5, 'ADMIN_TEMPORARY_ACCESS_EXTEND');
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
    const { isValid, adminId, error: permissionError } = await validateAdminPermissions('temporary_access');
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: permissionError || 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { additionalMinutes, reason } = body;

    if (!additionalMinutes || additionalMinutes < 5 || additionalMinutes > 2880) {
      return NextResponse.json(
        { success: false, error: 'Additional minutes must be between 5 and 2880 (2 days)' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'Reason is required and must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Get grant details
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

    const { data: grant, error: fetchError } = await supabase
      .from('temporary_access_grants')
      .select(`
        *,
        users!inner(email)
      `)
      .eq('id', grantId)
      .single();

    if (fetchError || !grant) {
      return NextResponse.json(
        { success: false, error: 'Temporary access grant not found' },
        { status: 404 }
      );
    }

    if (!grant.is_active) {
      return NextResponse.json(
        { success: false, error: 'Cannot extend inactive grant' },
        { status: 400 }
      );
    }

    // Calculate new expiration time
    const currentExpiry = new Date(grant.expires_at);
    const newExpiry = new Date(currentExpiry.getTime() + additionalMinutes * 60 * 1000);
    const newDuration = grant.duration + additionalMinutes;

    // Update grant
    const { error: updateError } = await supabase
      .from('temporary_access_grants')
      .update({
        expires_at: newExpiry.toISOString(),
        duration: newDuration,
        metadata: {
          ...grant.metadata,
          extensions: [
            ...(grant.metadata?.extensions || []),
            {
              adminId,
              additionalMinutes,
              reason,
              extendedAt: new Date().toISOString()
            }
          ]
        }
      })
      .eq('id', grantId);

    if (updateError) {
      throw new Error(`Failed to extend grant: ${updateError.message}`);
    }

    // Log admin action
    await logAdminAction({
      type: 'access_grant',
      adminId,
      adminEmail: user.emailAddresses[0]?.emailAddress || '',
      targetUserId: grant.user_id,
      targetUserEmail: grant.users.email,
      action: 'extend_temporary_access',
      reason,
      oldValue: grant.expires_at,
      newValue: newExpiry.toISOString(),
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
      metadata: {
        grantId,
        additionalMinutes,
        newDuration,
        extendedAt: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      message: `Temporary access extended by ${additionalMinutes} minutes`,
      newExpiresAt: newExpiry.toISOString(),
      newDuration
    });

  } catch (error) {
    console.error('Temporary access grant extension error:', error);

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