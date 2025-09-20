import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { rateLimit } from '@/lib/utils/rate-limit';
import { validateAdminPermissions } from '@/lib/admin/tier-admin-controls';
import { AdminPermissionError } from '@/types/admin-controls';
import { z } from 'zod';

// Rate limiting: 30 requests per minute for user search
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

// Validation schema
const UserSearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.string().transform(val => Math.min(parseInt(val, 10) || 20, 50)).optional()
});

// GET /api/admin/users/search - Search users for admin management
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting
    try {
      await limiter.check(request, 30, 'ADMIN_USER_SEARCH');
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
    const { isValid, error: permissionError } = await validateAdminPermissions('manage_users');
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: permissionError || 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const { q: searchQuery, limit } = UserSearchQuerySchema.parse({
      q: searchParams.get('q'),
      limit: searchParams.get('limit')
    });

    // Initialize Supabase client
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

    // Build search query - search by email or user ID
    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        tier,
        created_at,
        updated_at
      `)
      .limit(limit || 20);

    // Search by email (case insensitive) or exact user ID match
    if (searchQuery.includes('@')) {
      // Email search
      query = query.ilike('email', `%${searchQuery}%`);
    } else {
      // User ID search or email partial match
      query = query.or(`id.eq.${searchQuery},email.ilike.%${searchQuery}%`);
    }

    const { data: users, error: searchError } = await query.order('created_at', { ascending: false });

    if (searchError) {
      throw new Error(`User search failed: ${searchError.message}`);
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        users: [],
        message: 'No users found matching your search criteria'
      });
    }

    // Get additional tier information for each user
    const userIds = users.map(u => u.id);

    // Get active overrides
    const { data: activeOverrides } = await supabase
      .from('tier_overrides')
      .select('user_id, override_tier, original_tier, reason, admin_email, created_at, expires_at')
      .in('user_id', userIds)
      .eq('is_active', true);

    // Get active grants
    const { data: activeGrants } = await supabase
      .from('temporary_access_grants')
      .select('user_id, granted_tier, reason, admin_email, duration, created_at, expires_at')
      .in('user_id', userIds)
      .eq('is_active', true);

    // Transform users with tier information
    const enrichedUsers = users.map(user => {
      const override = activeOverrides?.find(o => o.user_id === user.id);
      const grant = activeGrants?.find(g => g.user_id === user.id);

      return {
        userId: user.id,
        email: user.email,
        currentTier: user.tier,
        originalTier: override?.original_tier,
        hasActiveOverride: !!override,
        hasActiveGrant: !!grant,
        overrideDetails: override ? {
          overrideTier: override.override_tier,
          reason: override.reason,
          adminEmail: override.admin_email,
          createdAt: new Date(override.created_at),
          expiresAt: override.expires_at ? new Date(override.expires_at) : undefined
        } : undefined,
        grantDetails: grant ? {
          grantedTier: grant.granted_tier,
          reason: grant.reason,
          adminEmail: grant.admin_email,
          duration: grant.duration,
          createdAt: new Date(grant.created_at),
          expiresAt: new Date(grant.expires_at)
        } : undefined,
        lastModified: new Date(Math.max(
          new Date(user.updated_at || user.created_at).getTime(),
          override ? new Date(override.created_at).getTime() : 0,
          grant ? new Date(grant.created_at).getTime() : 0
        )),
        joinedAt: new Date(user.created_at)
      };
    });

    return NextResponse.json({
      success: true,
      users: enrichedUsers,
      total: enrichedUsers.length,
      searchQuery
    });

  } catch (error) {
    console.error('User search error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid search parameters',
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