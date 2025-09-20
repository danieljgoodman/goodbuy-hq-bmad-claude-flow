import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { rateLimit } from '@/lib/utils/rate-limit';
import {
  createTierOverride,
  validateAdminPermissions,
  logAdminAction
} from '@/lib/admin/tier-admin-controls';
import {
  TierOverrideRequest,
  TierOverrideResponse,
  TierOverrideError,
  AdminPermissionError
} from '@/types/admin-controls';
import { z } from 'zod';

// Rate limiting: 10 requests per minute for tier overrides
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

// Validation schema
const TierOverrideRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  newTier: z.enum(['free', 'professional', 'enterprise'], {
    errorMap: () => ({ message: 'Invalid tier. Must be free, professional, or enterprise' })
  }),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  duration: z.number().positive().max(365).optional(),
  notifyUser: z.boolean().default(true),
  metadata: z.record(z.any()).optional()
});

const TierOverrideQuerySchema = z.object({
  userId: z.string().optional(),
  adminId: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
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

// POST /api/admin/tier-overrides - Create tier override
export async function POST(request: NextRequest): Promise<NextResponse<TierOverrideResponse>> {
  try {
    // Rate limiting
    try {
      await limiter.check(request, 10, 'ADMIN_TIER_OVERRIDE');
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
    const { isValid, adminId, error: permissionError } = await validateAdminPermissions('tier_override');
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: permissionError || 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = TierOverrideRequestSchema.parse(body);

    // Create tier override
    const override = await createTierOverride(validatedData);

    // Log successful action with additional context
    await logAdminAction({
      type: 'tier_override',
      adminId,
      adminEmail: user.emailAddresses[0]?.emailAddress || '',
      targetUserId: validatedData.userId,
      targetUserEmail: '', // This will be filled by the createTierOverride function
      action: 'create_tier_override',
      reason: validatedData.reason,
      oldValue: override.originalTier,
      newValue: override.overrideTier,
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
      metadata: {
        duration: validatedData.duration,
        notifyUser: validatedData.notifyUser,
        ...validatedData.metadata
      }
    });

    return NextResponse.json({
      success: true,
      override,
      message: 'Tier override created successfully'
    });

  } catch (error) {
    console.error('Tier override creation error:', error);

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

    if (error instanceof TierOverrideError) {
      const statusCode = error.code === 'UNAUTHORIZED' ? 403 :
                        error.code === 'USER_NOT_FOUND' ? 404 :
                        error.code === 'ALREADY_OVERRIDDEN' ? 409 : 400;

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

// GET /api/admin/tier-overrides - List tier overrides
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting
    try {
      await limiter.check(request, 30, 'ADMIN_TIER_OVERRIDE_LIST');
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
    const queryData = TierOverrideQuerySchema.parse({
      userId: searchParams.get('userId') || undefined,
      adminId: searchParams.get('adminId') || undefined,
      isActive: searchParams.get('isActive') || undefined,
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
      .from('tier_overrides')
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
    if (queryData.limit) {
      query = query.limit(queryData.limit);
    }
    if (queryData.offset) {
      query = query.range(queryData.offset, queryData.offset + (queryData.limit || 20) - 1);
    }

    const { data: overrides, error: queryError, count } = await query;

    if (queryError) {
      throw new Error(`Failed to fetch tier overrides: ${queryError.message}`);
    }

    // Transform data
    const transformedOverrides = overrides?.map(override => ({
      id: override.id,
      userId: override.user_id,
      userEmail: override.users.email,
      originalTier: override.original_tier,
      overrideTier: override.override_tier,
      reason: override.reason,
      adminId: override.admin_id,
      adminEmail: override.admin_email,
      createdAt: new Date(override.created_at),
      expiresAt: override.expires_at ? new Date(override.expires_at) : null,
      isActive: override.is_active,
      metadata: override.metadata
    })) || [];

    return NextResponse.json({
      success: true,
      overrides: transformedOverrides,
      total: count || 0,
      hasMore: queryData.limit ? transformedOverrides.length === queryData.limit : false
    });

  } catch (error) {
    console.error('Tier overrides list error:', error);

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

// PUT /api/admin/tier-overrides/[id] - Update tier override (deactivate)
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    // Get override ID from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const overrideId = pathSegments[pathSegments.length - 1];

    if (!overrideId) {
      return NextResponse.json(
        { success: false, error: 'Override ID is required' },
        { status: 400 }
      );
    }

    // Rate limiting
    try {
      await limiter.check(request, 10, 'ADMIN_TIER_OVERRIDE_UPDATE');
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
    const { isValid, adminId, error: permissionError } = await validateAdminPermissions('tier_override');
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: permissionError || 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { action, reason } = body;

    if (action !== 'deactivate') {
      return NextResponse.json(
        { success: false, error: 'Only deactivate action is supported' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'Reason is required and must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Get override details
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

    const { data: override, error: fetchError } = await supabase
      .from('tier_overrides')
      .select(`
        *,
        users!inner(email, tier)
      `)
      .eq('id', overrideId)
      .single();

    if (fetchError || !override) {
      return NextResponse.json(
        { success: false, error: 'Tier override not found' },
        { status: 404 }
      );
    }

    if (!override.is_active) {
      return NextResponse.json(
        { success: false, error: 'Tier override is already inactive' },
        { status: 400 }
      );
    }

    // Deactivate override
    const { error: updateError } = await supabase
      .from('tier_overrides')
      .update({ is_active: false })
      .eq('id', overrideId);

    if (updateError) {
      throw new Error(`Failed to deactivate override: ${updateError.message}`);
    }

    // Restore original tier (check for other active overrides first)
    const { data: otherOverrides } = await supabase
      .from('tier_overrides')
      .select('override_tier')
      .eq('user_id', override.user_id)
      .eq('is_active', true)
      .neq('id', overrideId);

    if (!otherOverrides || otherOverrides.length === 0) {
      // No other active overrides, restore original tier
      const { error: restoreError } = await supabase
        .from('users')
        .update({ tier: override.original_tier })
        .eq('id', override.user_id);

      if (restoreError) {
        console.error('Failed to restore user tier:', restoreError);
      }
    }

    // Log admin action
    await logAdminAction({
      type: 'tier_override',
      adminId,
      adminEmail: user.emailAddresses[0]?.emailAddress || '',
      targetUserId: override.user_id,
      targetUserEmail: override.users.email,
      action: 'deactivate_tier_override',
      reason,
      oldValue: override.override_tier,
      newValue: override.original_tier,
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
      metadata: {
        overrideId,
        deactivatedAt: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Tier override deactivated successfully'
    });

  } catch (error) {
    console.error('Tier override update error:', error);

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