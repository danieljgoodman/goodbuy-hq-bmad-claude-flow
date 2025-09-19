export type UserTier = 'free' | 'professional' | 'enterprise';

export interface TierOverride {
  id: string;
  userId: string;
  originalTier: UserTier;
  overrideTier: UserTier;
  reason: string;
  adminId: string;
  adminEmail: string;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface TemporaryAccessGrant {
  id: string;
  userId: string;
  grantedTier: UserTier;
  reason: string;
  adminId: string;
  adminEmail: string;
  duration: number; // in minutes
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  notificationsSent: boolean;
  metadata?: Record<string, any>;
}

export interface AdminAction {
  id: string;
  type: 'tier_override' | 'access_grant' | 'permission_change' | 'user_modification';
  adminId: string;
  adminEmail: string;
  targetUserId: string;
  targetUserEmail: string;
  action: string;
  reason: string;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface AdminPermissions {
  canOverrideTiers: boolean;
  canGrantTemporaryAccess: boolean;
  canViewAuditLogs: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  maxOverrideDuration?: number; // in days
  allowedTierOverrides?: UserTier[];
}

export interface TierOverrideRequest {
  userId: string;
  newTier: UserTier;
  reason: string;
  duration?: number; // in days, undefined for permanent
  notifyUser: boolean;
  metadata?: Record<string, any>;
}

export interface TemporaryAccessRequest {
  userId: string;
  grantedTier: UserTier;
  reason: string;
  duration: number; // in minutes
  notifyUser: boolean;
  metadata?: Record<string, any>;
}

export interface UserTierInfo {
  userId: string;
  email: string;
  currentTier: UserTier;
  originalTier?: UserTier;
  hasActiveOverride: boolean;
  hasActiveGrant: boolean;
  overrideDetails?: TierOverride;
  grantDetails?: TemporaryAccessGrant;
  lastModified: Date;
  joinedAt: Date;
}

export interface AdminAuditQuery {
  adminId?: string;
  targetUserId?: string;
  actionType?: AdminAction['type'];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface WebhookNotification {
  event: 'tier_override' | 'access_grant' | 'access_expired' | 'admin_action';
  userId: string;
  adminId: string;
  data: Record<string, any>;
  timestamp: Date;
}

export interface AdminControlsConfig {
  maxOverrideDuration: number; // days
  maxAccessGrantDuration: number; // minutes
  requireApprovalForPermanentOverrides: boolean;
  enableWebhookNotifications: boolean;
  auditRetentionDays: number;
  allowedAdminRoles: string[];
}

export interface TierManagementStats {
  totalOverrides: number;
  activeOverrides: number;
  totalGrants: number;
  activeGrants: number;
  overridesByTier: Record<UserTier, number>;
  grantsByTier: Record<UserTier, number>;
  lastUpdated: Date;
}

// API Response types
export interface TierOverrideResponse {
  success: boolean;
  override?: TierOverride;
  error?: string;
  message?: string;
}

export interface TemporaryAccessResponse {
  success: boolean;
  grant?: TemporaryAccessGrant;
  error?: string;
  message?: string;
}

export interface AdminAuditResponse {
  success: boolean;
  actions: AdminAction[];
  total: number;
  hasMore: boolean;
  error?: string;
}

export interface UserTierResponse {
  success: boolean;
  userInfo?: UserTierInfo;
  error?: string;
}

// Error types
export class TierOverrideError extends Error {
  constructor(
    message: string,
    public code: 'UNAUTHORIZED' | 'INVALID_TIER' | 'USER_NOT_FOUND' | 'DURATION_EXCEEDED' | 'ALREADY_OVERRIDDEN'
  ) {
    super(message);
    this.name = 'TierOverrideError';
  }
}

export class TemporaryAccessError extends Error {
  constructor(
    message: string,
    public code: 'UNAUTHORIZED' | 'INVALID_TIER' | 'USER_NOT_FOUND' | 'DURATION_EXCEEDED' | 'ALREADY_GRANTED'
  ) {
    super(message);
    this.name = 'TemporaryAccessError';
  }
}

export class AdminPermissionError extends Error {
  constructor(
    message: string,
    public code: 'INSUFFICIENT_PERMISSIONS' | 'INVALID_ADMIN' | 'ACTION_NOT_ALLOWED'
  ) {
    super(message);
    this.name = 'AdminPermissionError';
  }
}