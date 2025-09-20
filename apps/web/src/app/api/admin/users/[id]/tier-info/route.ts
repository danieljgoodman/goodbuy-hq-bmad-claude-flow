import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { rateLimit } from '@/lib/utils/rate-limit';
import { validateAdminPermissions, getUserTierInfo } from '@/lib/admin/tier-admin-controls';
import { AdminPermissionError } from '@/types/admin-controls';

// Rate limiting: 60 requests per minute for user details
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

// GET /api/admin/users/[id]/tier-info - Get detailed tier information for a user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Rate limiting
    try {
      await limiter.check(request, 60, 'ADMIN_USER_DETAILS');
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

    // Get user tier information
    const userInfo = await getUserTierInfo(userId);

    if (!userInfo) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get additional user statistics
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

    // Get historical overrides and grants count
    const [
      { count: totalOverrides },
      { count: totalGrants },
      { data: recentActions }
    ] = await Promise.all([
      supabase
        .from('tier_overrides')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('temporary_access_grants')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('admin_audit_log')
        .select('type, action, admin_email, timestamp, reason')
        .eq('target_user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(10)
    ]);

    // Enhanced user info with statistics
    const enhancedUserInfo = {
      ...userInfo,
      statistics: {
        totalOverrides: totalOverrides || 0,
        totalGrants: totalGrants || 0,
        hasHistory: (totalOverrides || 0) > 0 || (totalGrants || 0) > 0
      },
      recentAdminActions: recentActions?.map(action => ({
        type: action.type,
        action: action.action,
        adminEmail: action.admin_email,
        timestamp: new Date(action.timestamp),
        reason: action.reason
      })) || []
    };

    return NextResponse.json({
      success: true,
      userInfo: enhancedUserInfo
    });

  } catch (error) {
    console.error('User tier info error:', error);

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