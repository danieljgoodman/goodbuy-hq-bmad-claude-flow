import { currentUser } from '@clerk/nextjs';
// Supabase client - to be replaced with your database
// import { createClient } from '@supabase/supabase-js';
import {
  TierOverride,
  TemporaryAccessGrant,
  AdminAction,
  UserTier,
  AdminPermissions,
  TierOverrideRequest,
  TemporaryAccessRequest,
  UserTierInfo,
  AdminAuditQuery,
  TierOverrideError,
  TemporaryAccessError,
  AdminPermissionError,
  AdminControlsConfig,
  WebhookNotification
} from '@/types/admin-controls';

// Database client placeholder - replace with your database
const supabase = {
  from: (table: string) => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: null, error: null }),
    update: () => ({ data: null, error: null }),
    delete: () => ({ data: null, error: null }),
    eq: () => ({ data: [], error: null }),
    single: () => ({ data: null, error: null })
  })
};

// Configuration
const ADMIN_CONFIG: AdminControlsConfig = {
  maxOverrideDuration: 365, // 1 year max
  maxAccessGrantDuration: 10080, // 1 week max in minutes
  requireApprovalForPermanentOverrides: true,
  enableWebhookNotifications: true,
  auditRetentionDays: 365,
  allowedAdminRoles: ['enterprise-admin', 'super-admin', 'support-manager']
};

// Admin permission checking
export async function validateAdminPermissions(requiredAction: string): Promise<{
  isValid: boolean;
  adminId: string;
  permissions: AdminPermissions;
  error?: string;
}> {
  try {
    const user = await currentUser();

    if (!user) {
      throw new AdminPermissionError('No authenticated user', 'INVALID_ADMIN');
    }

    // Check if user has admin role
    const adminRole = user.publicMetadata?.role as string;
    if (!ADMIN_CONFIG.allowedAdminRoles.includes(adminRole)) {
      throw new AdminPermissionError('Insufficient admin permissions', 'INSUFFICIENT_PERMISSIONS');
    }

    // Get admin permissions from database
    const { data: adminData, error } = await supabase
      .from('admin_permissions')
      .select('*')
      .eq('admin_id', user.id)
      .eq('is_active', true)
      .single();

    if (error || !adminData) {
      throw new AdminPermissionError('Admin permissions not found', 'INVALID_ADMIN');
    }

    const permissions: AdminPermissions = {
      canOverrideTiers: adminData.can_override_tiers,
      canGrantTemporaryAccess: adminData.can_grant_temporary_access,
      canViewAuditLogs: adminData.can_view_audit_logs,
      canManageUsers: adminData.can_manage_users,
      canViewAnalytics: adminData.can_view_analytics,
      maxOverrideDuration: adminData.max_override_duration,
      allowedTierOverrides: adminData.allowed_tier_overrides
    };

    // Validate specific action permissions
    let isValid = false;
    switch (requiredAction) {
      case 'tier_override':
        isValid = permissions.canOverrideTiers;
        break;
      case 'temporary_access':
        isValid = permissions.canGrantTemporaryAccess;
        break;
      case 'view_audit':
        isValid = permissions.canViewAuditLogs;
        break;
      case 'manage_users':
        isValid = permissions.canManageUsers;
        break;
      default:
        isValid = false;
    }

    return {
      isValid,
      adminId: user.id,
      permissions,
      error: isValid ? undefined : `Insufficient permissions for ${requiredAction}`
    };

  } catch (error) {
    if (error instanceof AdminPermissionError) {
      throw error;
    }
    throw new AdminPermissionError('Permission validation failed', 'INVALID_ADMIN');
  }
}

// Audit logging
export async function logAdminAction(action: Omit<AdminAction, 'id' | 'timestamp'>): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('admin_audit_log')
      .insert({
        type: action.type,
        admin_id: action.adminId,
        admin_email: action.adminEmail,
        target_user_id: action.targetUserId,
        target_user_email: action.targetUserEmail,
        action: action.action,
        reason: action.reason,
        old_value: action.oldValue,
        new_value: action.newValue,
        ip_address: action.ipAddress,
        user_agent: action.userAgent,
        metadata: action.metadata,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to log admin action:', error);
      throw new Error('Audit logging failed');
    }

    // Send webhook notification if enabled
    if (ADMIN_CONFIG.enableWebhookNotifications) {
      await sendWebhookNotification({
        event: action.type === 'tier_override' ? 'tier_override' : 'admin_action',
        userId: action.targetUserId,
        adminId: action.adminId,
        data: {
          action: action.action,
          reason: action.reason,
          oldValue: action.oldValue,
          newValue: action.newValue
        },
        timestamp: new Date()
      });
    }

  } catch (error) {
    console.error('Audit logging error:', error);
    // Don't throw here to avoid blocking the main operation
  }
}

// Manual tier override functions
export async function createTierOverride(request: TierOverrideRequest): Promise<TierOverride> {
  const { isValid, adminId, permissions, error } = await validateAdminPermissions('tier_override');

  if (!isValid) {
    throw new AdminPermissionError(error!, 'INSUFFICIENT_PERMISSIONS');
  }

  // Validate tier override permissions
  if (permissions.allowedTierOverrides && !permissions.allowedTierOverrides.includes(request.newTier)) {
    throw new TierOverrideError('Not authorized to override to this tier', 'INVALID_TIER');
  }

  // Validate duration
  if (request.duration && request.duration > (permissions.maxOverrideDuration || ADMIN_CONFIG.maxOverrideDuration)) {
    throw new TierOverrideError('Override duration exceeds maximum allowed', 'DURATION_EXCEEDED');
  }

  try {
    // Get current user info
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tier, email')
      .eq('id', request.userId)
      .single();

    if (userError || !userData) {
      throw new TierOverrideError('User not found', 'USER_NOT_FOUND');
    }

    // Check for existing active override
    const { data: existingOverride } = await supabase
      .from('tier_overrides')
      .select('*')
      .eq('user_id', request.userId)
      .eq('is_active', true)
      .single();

    if (existingOverride) {
      throw new TierOverrideError('User already has an active tier override', 'ALREADY_OVERRIDDEN');
    }

    const user = await currentUser();
    const expiresAt = request.duration ? new Date(Date.now() + request.duration * 24 * 60 * 60 * 1000) : undefined;

    // Create override record
    const { data: override, error: overrideError } = await supabase
      .from('tier_overrides')
      .insert({
        user_id: request.userId,
        original_tier: userData.tier,
        override_tier: request.newTier,
        reason: request.reason,
        admin_id: adminId,
        admin_email: user!.emailAddresses[0]?.emailAddress,
        expires_at: expiresAt?.toISOString(),
        is_active: true,
        metadata: request.metadata
      })
      .select()
      .single();

    if (overrideError) {
      throw new Error(`Failed to create tier override: ${overrideError.message}`);
    }

    // Update user's current tier
    const { error: updateError } = await supabase
      .from('users')
      .update({ tier: request.newTier })
      .eq('id', request.userId);

    if (updateError) {
      // Rollback override creation
      await supabase
        .from('tier_overrides')
        .delete()
        .eq('id', override.id);

      throw new Error(`Failed to update user tier: ${updateError.message}`);
    }

    // Log admin action
    await logAdminAction({
      type: 'tier_override',
      adminId,
      adminEmail: user!.emailAddresses[0]?.emailAddress || '',
      targetUserId: request.userId,
      targetUserEmail: userData.email,
      action: 'create_tier_override',
      reason: request.reason,
      oldValue: userData.tier,
      newValue: request.newTier,
      metadata: {
        duration: request.duration,
        expiresAt: expiresAt?.toISOString(),
        ...request.metadata
      }
    });

    // Send notification to user if requested
    if (request.notifyUser) {
      await sendUserNotification(request.userId, 'tier_override', {
        newTier: request.newTier,
        reason: request.reason,
        expiresAt
      });
    }

    return {
      id: override.id,
      userId: override.user_id,
      originalTier: override.original_tier,
      overrideTier: override.override_tier,
      reason: override.reason,
      adminId: override.admin_id,
      adminEmail: override.admin_email,
      createdAt: new Date(override.created_at),
      expiresAt: override.expires_at ? new Date(override.expires_at) : undefined,
      isActive: override.is_active,
      metadata: override.metadata
    };

  } catch (error) {
    if (error instanceof TierOverrideError || error instanceof AdminPermissionError) {
      throw error;
    }
    throw new TierOverrideError('Failed to create tier override', 'INVALID_TIER');
  }
}

// Temporary access grant functions
export async function createTemporaryAccessGrant(request: TemporaryAccessRequest): Promise<TemporaryAccessGrant> {
  const { isValid, adminId, permissions, error } = await validateAdminPermissions('temporary_access');

  if (!isValid) {
    throw new AdminPermissionError(error!, 'INSUFFICIENT_PERMISSIONS');
  }

  // Validate duration
  if (request.duration > ADMIN_CONFIG.maxAccessGrantDuration) {
    throw new TemporaryAccessError('Access grant duration exceeds maximum allowed', 'DURATION_EXCEEDED');
  }

  try {
    // Get current user info
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tier, email')
      .eq('id', request.userId)
      .single();

    if (userError || !userData) {
      throw new TemporaryAccessError('User not found', 'USER_NOT_FOUND');
    }

    // Check for existing active grant
    const { data: existingGrant } = await supabase
      .from('temporary_access_grants')
      .select('*')
      .eq('user_id', request.userId)
      .eq('is_active', true)
      .single();

    if (existingGrant) {
      throw new TemporaryAccessError('User already has an active access grant', 'ALREADY_GRANTED');
    }

    const user = await currentUser();
    const expiresAt = new Date(Date.now() + request.duration * 60 * 1000);

    // Create access grant record
    const { data: grant, error: grantError } = await supabase
      .from('temporary_access_grants')
      .insert({
        user_id: request.userId,
        granted_tier: request.grantedTier,
        reason: request.reason,
        admin_id: adminId,
        admin_email: user!.emailAddresses[0]?.emailAddress,
        duration: request.duration,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        notifications_sent: false,
        metadata: request.metadata
      })
      .select()
      .single();

    if (grantError) {
      throw new Error(`Failed to create access grant: ${grantError.message}`);
    }

    // Update user's current tier temporarily
    const { error: updateError } = await supabase
      .from('users')
      .update({ tier: request.grantedTier })
      .eq('id', request.userId);

    if (updateError) {
      // Rollback grant creation
      await supabase
        .from('temporary_access_grants')
        .delete()
        .eq('id', grant.id);

      throw new Error(`Failed to update user tier: ${updateError.message}`);
    }

    // Schedule automatic expiration (this would typically be handled by a background job)
    setTimeout(async () => {
      await expireTemporaryAccessGrant(grant.id);
    }, request.duration * 60 * 1000);

    // Log admin action
    await logAdminAction({
      type: 'access_grant',
      adminId,
      adminEmail: user!.emailAddresses[0]?.emailAddress || '',
      targetUserId: request.userId,
      targetUserEmail: userData.email,
      action: 'create_access_grant',
      reason: request.reason,
      oldValue: userData.tier,
      newValue: request.grantedTier,
      metadata: {
        duration: request.duration,
        expiresAt: expiresAt.toISOString(),
        ...request.metadata
      }
    });

    // Send notification to user if requested
    if (request.notifyUser) {
      await sendUserNotification(request.userId, 'access_grant', {
        grantedTier: request.grantedTier,
        reason: request.reason,
        expiresAt,
        duration: request.duration
      });
    }

    return {
      id: grant.id,
      userId: grant.user_id,
      grantedTier: grant.granted_tier,
      reason: grant.reason,
      adminId: grant.admin_id,
      adminEmail: grant.admin_email,
      duration: grant.duration,
      createdAt: new Date(grant.created_at),
      expiresAt: new Date(grant.expires_at),
      isActive: grant.is_active,
      notificationsSent: grant.notifications_sent,
      metadata: grant.metadata
    };

  } catch (error) {
    if (error instanceof TemporaryAccessError || error instanceof AdminPermissionError) {
      throw error;
    }
    throw new TemporaryAccessError('Failed to create temporary access grant', 'INVALID_TIER');
  }
}

// Expiration handling
export async function expireTemporaryAccessGrant(grantId: string): Promise<void> {
  try {
    // Get grant details
    const { data: grant, error: grantError } = await supabase
      .from('temporary_access_grants')
      .select('*, users!inner(tier, email)')
      .eq('id', grantId)
      .eq('is_active', true)
      .single();

    if (grantError || !grant) {
      return; // Grant not found or already expired
    }

    // Deactivate the grant
    const { error: updateError } = await supabase
      .from('temporary_access_grants')
      .update({ is_active: false })
      .eq('id', grantId);

    if (updateError) {
      throw new Error(`Failed to deactivate grant: ${updateError.message}`);
    }

    // Restore original tier (check for any active overrides)
    const { data: activeOverride } = await supabase
      .from('tier_overrides')
      .select('override_tier')
      .eq('user_id', grant.user_id)
      .eq('is_active', true)
      .single();

    // Get user's original tier from profile or default to free
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('original_tier')
      .eq('user_id', grant.user_id)
      .single();

    const restoreTier = activeOverride?.override_tier || userProfile?.original_tier || 'free';

    const { error: restoreError } = await supabase
      .from('users')
      .update({ tier: restoreTier })
      .eq('id', grant.user_id);

    if (restoreError) {
      console.error('Failed to restore user tier after grant expiration:', restoreError);
    }

    // Send expiration notification
    await sendUserNotification(grant.user_id, 'access_expired', {
      grantedTier: grant.granted_tier,
      restoredTier: restoreTier,
      reason: grant.reason
    });

    // Send webhook notification
    if (ADMIN_CONFIG.enableWebhookNotifications) {
      await sendWebhookNotification({
        event: 'access_expired',
        userId: grant.user_id,
        adminId: grant.admin_id,
        data: {
          grantId,
          grantedTier: grant.granted_tier,
          restoredTier: restoreTier
        },
        timestamp: new Date()
      });
    }

  } catch (error) {
    console.error('Failed to expire temporary access grant:', error);
  }
}

// Utility functions
export async function getUserTierInfo(userId: string): Promise<UserTierInfo | null> {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('tier, email, created_at')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return null;
    }

    // Get active override
    const { data: override } = await supabase
      .from('tier_overrides')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    // Get active grant
    const { data: grant } = await supabase
      .from('temporary_access_grants')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    return {
      userId,
      email: user.email,
      currentTier: user.tier,
      originalTier: override?.original_tier,
      hasActiveOverride: !!override,
      hasActiveGrant: !!grant,
      overrideDetails: override ? {
        id: override.id,
        userId: override.user_id,
        originalTier: override.original_tier,
        overrideTier: override.override_tier,
        reason: override.reason,
        adminId: override.admin_id,
        adminEmail: override.admin_email,
        createdAt: new Date(override.created_at),
        expiresAt: override.expires_at ? new Date(override.expires_at) : undefined,
        isActive: override.is_active,
        metadata: override.metadata
      } : undefined,
      grantDetails: grant ? {
        id: grant.id,
        userId: grant.user_id,
        grantedTier: grant.granted_tier,
        reason: grant.reason,
        adminId: grant.admin_id,
        adminEmail: grant.admin_email,
        duration: grant.duration,
        createdAt: new Date(grant.created_at),
        expiresAt: new Date(grant.expires_at),
        isActive: grant.is_active,
        notificationsSent: grant.notifications_sent,
        metadata: grant.metadata
      } : undefined,
      lastModified: new Date(Math.max(
        new Date(user.created_at).getTime(),
        override ? new Date(override.created_at).getTime() : 0,
        grant ? new Date(grant.created_at).getTime() : 0
      )),
      joinedAt: new Date(user.created_at)
    };

  } catch (error) {
    console.error('Failed to get user tier info:', error);
    return null;
  }
}

export async function getAdminAuditLog(query: AdminAuditQuery): Promise<AdminAction[]> {
  const { isValid, error } = await validateAdminPermissions('view_audit');

  if (!isValid) {
    throw new AdminPermissionError(error!, 'INSUFFICIENT_PERMISSIONS');
  }

  try {
    let supabaseQuery = supabase
      .from('admin_audit_log')
      .select('*')
      .order('timestamp', { ascending: false });

    if (query.adminId) {
      supabaseQuery = supabaseQuery.eq('admin_id', query.adminId);
    }
    if (query.targetUserId) {
      supabaseQuery = supabaseQuery.eq('target_user_id', query.targetUserId);
    }
    if (query.actionType) {
      supabaseQuery = supabaseQuery.eq('type', query.actionType);
    }
    if (query.startDate) {
      supabaseQuery = supabaseQuery.gte('timestamp', query.startDate.toISOString());
    }
    if (query.endDate) {
      supabaseQuery = supabaseQuery.lte('timestamp', query.endDate.toISOString());
    }
    if (query.limit) {
      supabaseQuery = supabaseQuery.limit(query.limit);
    }
    if (query.offset) {
      supabaseQuery = supabaseQuery.range(query.offset, query.offset + (query.limit || 50) - 1);
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      throw new Error(`Failed to fetch audit log: ${error.message}`);
    }

    return data.map(action => ({
      id: action.id,
      type: action.type,
      adminId: action.admin_id,
      adminEmail: action.admin_email,
      targetUserId: action.target_user_id,
      targetUserEmail: action.target_user_email,
      action: action.action,
      reason: action.reason,
      oldValue: action.old_value,
      newValue: action.new_value,
      timestamp: new Date(action.timestamp),
      ipAddress: action.ip_address,
      userAgent: action.user_agent,
      metadata: action.metadata
    }));

  } catch (error) {
    if (error instanceof AdminPermissionError) {
      throw error;
    }
    throw new Error('Failed to fetch audit log');
  }
}

// Notification functions
async function sendUserNotification(userId: string, type: string, data: any): Promise<void> {
  try {
    // Implementation would depend on your notification system
    // This could be email, in-app notifications, etc.
    console.log(`Sending ${type} notification to user ${userId}:`, data);

    // Example email notification logic
    // await sendEmail({
    //   to: userEmail,
    //   template: type,
    //   data
    // });

  } catch (error) {
    console.error('Failed to send user notification:', error);
  }
}

async function sendWebhookNotification(notification: WebhookNotification): Promise<void> {
  try {
    const webhookUrl = process.env.ADMIN_WEBHOOK_URL;
    if (!webhookUrl) return;

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WEBHOOK_SECRET}`
      },
      body: JSON.stringify(notification)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`);
    }

  } catch (error) {
    console.error('Failed to send webhook notification:', error);
  }
}

// Cleanup expired grants and overrides (this would typically run as a cron job)
export async function cleanupExpiredAccess(): Promise<void> {
  try {
    const now = new Date().toISOString();

    // Expire temporary access grants
    const { data: expiredGrants } = await supabase
      .from('temporary_access_grants')
      .select('id')
      .eq('is_active', true)
      .lte('expires_at', now);

    if (expiredGrants) {
      for (const grant of expiredGrants) {
        await expireTemporaryAccessGrant(grant.id);
      }
    }

    // Expire tier overrides
    const { data: expiredOverrides } = await supabase
      .from('tier_overrides')
      .select('*')
      .eq('is_active', true)
      .lte('expires_at', now);

    if (expiredOverrides) {
      for (const override of expiredOverrides) {
        await supabase
          .from('tier_overrides')
          .update({ is_active: false })
          .eq('id', override.id);

        // Restore original tier if no other active overrides
        const { data: otherOverrides } = await supabase
          .from('tier_overrides')
          .select('id')
          .eq('user_id', override.user_id)
          .eq('is_active', true)
          .neq('id', override.id);

        if (!otherOverrides || otherOverrides.length === 0) {
          await supabase
            .from('users')
            .update({ tier: override.original_tier })
            .eq('id', override.user_id);
        }
      }
    }

  } catch (error) {
    console.error('Failed to cleanup expired access:', error);
  }
}