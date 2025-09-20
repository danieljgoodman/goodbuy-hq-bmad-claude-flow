import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { rateLimit } from '@/lib/utils/rate-limit';
import { validateAdminPermissions } from '@/lib/admin/tier-admin-controls';
import { AdminPermissionError, TierManagementStats, UserTier } from '@/types/admin-controls';

// Rate limiting: 30 requests per minute for stats
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

// GET /api/admin/tier-stats - Get tier management statistics
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting
    try {
      await limiter.check(request, 30, 'ADMIN_TIER_STATS');
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

    // Get all statistics in parallel
    const [
      { count: totalOverrides },
      { count: activeOverrides },
      { count: totalGrants },
      { count: activeGrants },
      { data: overridesByTier },
      { data: grantsByTier },
      { data: userTierDistribution },
      { data: recentActivity }
    ] = await Promise.all([
      // Total overrides
      supabase
        .from('tier_overrides')
        .select('*', { count: 'exact', head: true }),

      // Active overrides
      supabase
        .from('tier_overrides')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),

      // Total grants
      supabase
        .from('temporary_access_grants')
        .select('*', { count: 'exact', head: true }),

      // Active grants
      supabase
        .from('temporary_access_grants')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),

      // Overrides by tier
      supabase
        .from('tier_overrides')
        .select('override_tier')
        .eq('is_active', true),

      // Grants by tier
      supabase
        .from('temporary_access_grants')
        .select('granted_tier')
        .eq('is_active', true),

      // User tier distribution
      supabase
        .from('users')
        .select('tier'),

      // Recent activity (last 7 days)
      supabase
        .from('admin_audit_log')
        .select('type, timestamp, admin_email')
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false })
    ]);

    // Process override statistics by tier
    const overridesByTierCounts: Record<UserTier, number> = {
      free: 0,
      professional: 0,
      enterprise: 0
    };

    overridesByTier?.forEach(override => {
      const tier = override.override_tier as UserTier;
      if (tier in overridesByTierCounts) {
        overridesByTierCounts[tier]++;
      }
    });

    // Process grant statistics by tier
    const grantsByTierCounts: Record<UserTier, number> = {
      free: 0,
      professional: 0,
      enterprise: 0
    };

    grantsByTier?.forEach(grant => {
      const tier = grant.granted_tier as UserTier;
      if (tier in grantsByTierCounts) {
        grantsByTierCounts[tier]++;
      }
    });

    // Process user tier distribution
    const tierDistribution: Record<UserTier, number> = {
      free: 0,
      professional: 0,
      enterprise: 0
    };

    userTierDistribution?.forEach(user => {
      const tier = user.tier as UserTier;
      if (tier in tierDistribution) {
        tierDistribution[tier]++;
      }
    });

    // Process recent activity statistics
    const activityByType: Record<string, number> = {};
    const activeAdmins = new Set<string>();
    const dailyActivity: Record<string, number> = {};

    recentActivity?.forEach(activity => {
      // Count by type
      activityByType[activity.type] = (activityByType[activity.type] || 0) + 1;

      // Track active admins
      activeAdmins.add(activity.admin_email);

      // Daily activity
      const date = new Date(activity.timestamp).toISOString().split('T')[0];
      dailyActivity[date] = (dailyActivity[date] || 0) + 1;
    });

    // Calculate trends (comparing last 7 days to previous 7 days)
    const { data: previousActivity } = await supabase
      .from('admin_audit_log')
      .select('type, timestamp')
      .gte('timestamp', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .lt('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const previousWeekActivity = previousActivity?.length || 0;
    const currentWeekActivity = recentActivity?.length || 0;
    const activityTrend = previousWeekActivity > 0
      ? ((currentWeekActivity - previousWeekActivity) / previousWeekActivity) * 100
      : 0;

    // Compile statistics
    const stats: TierManagementStats = {
      totalOverrides: totalOverrides || 0,
      activeOverrides: activeOverrides || 0,
      totalGrants: totalGrants || 0,
      activeGrants: activeGrants || 0,
      overridesByTier: overridesByTierCounts,
      grantsByTier: grantsByTierCounts,
      lastUpdated: new Date()
    };

    // Enhanced response with additional insights
    const response = {
      success: true,
      stats,
      insights: {
        tierDistribution,
        recentActivity: {
          total: currentWeekActivity,
          byType: activityByType,
          activeAdmins: activeAdmins.size,
          dailyBreakdown: dailyActivity,
          trend: {
            percentage: Math.round(activityTrend * 100) / 100,
            direction: activityTrend > 0 ? 'up' : activityTrend < 0 ? 'down' : 'stable'
          }
        },
        utilization: {
          overrideRate: tierDistribution.free + tierDistribution.professional + tierDistribution.enterprise > 0
            ? Math.round(((activeOverrides || 0) / (tierDistribution.free + tierDistribution.professional + tierDistribution.enterprise)) * 10000) / 100
            : 0,
          grantRate: tierDistribution.free + tierDistribution.professional + tierDistribution.enterprise > 0
            ? Math.round(((activeGrants || 0) / (tierDistribution.free + tierDistribution.professional + tierDistribution.enterprise)) * 10000) / 100
            : 0
        },
        health: {
          status: (activeOverrides || 0) + (activeGrants || 0) < 50 ? 'healthy' :
                  (activeOverrides || 0) + (activeGrants || 0) < 100 ? 'moderate' : 'high',
          totalActiveModifications: (activeOverrides || 0) + (activeGrants || 0)
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Tier stats error:', error);

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