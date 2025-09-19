export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent?: string;
  timestamp: Date;
  details: Record<string, any>;
  geolocation?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export enum SecurityEventType {
  RATE_LIMIT_VIOLATION = 'rate_limit_violation',
  TIER_BYPASS_ATTEMPT = 'tier_bypass_attempt',
  SUSPICIOUS_LOGIN = 'suspicious_login',
  REPEATED_FAILED_ACCESS = 'repeated_failed_access',
  GEOGRAPHIC_ANOMALY = 'geographic_anomaly',
  UNUSUAL_ACCESS_PATTERN = 'unusual_access_pattern',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  API_ABUSE = 'api_abuse',
  BRUTE_FORCE_ATTACK = 'brute_force_attack',
  SESSION_HIJACKING = 'session_hijacking',
  DATA_EXFILTRATION = 'data_exfiltration',
  INJECTION_ATTEMPT = 'injection_attempt'
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface SecurityPattern {
  id: string;
  name: string;
  type: SecurityEventType;
  conditions: PatternCondition[];
  threshold: number;
  timeWindow: number; // in minutes
  severity: SecuritySeverity;
  enabled: boolean;
  actions: SecurityAction[];
}

export interface PatternCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface SecurityAction {
  type: 'alert' | 'block_ip' | 'suspend_user' | 'rate_limit' | 'log' | 'webhook';
  config: Record<string, any>;
}

export interface SecurityAlert {
  id: string;
  eventId: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  metadata: Record<string, any>;
}

export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  eventsBySeverity: Record<SecuritySeverity, number>;
  activeThreats: number;
  blockedIPs: number;
  suspendedUsers: number;
  lastUpdated: Date;
  trends: {
    hourly: SecurityTrend[];
    daily: SecurityTrend[];
    weekly: SecurityTrend[];
  };
}

export interface SecurityTrend {
  timestamp: Date;
  count: number;
  severity: SecuritySeverity;
  type?: SecurityEventType;
}

export interface ThreatIntelligence {
  ipAddress: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  sources: string[];
  lastSeen: Date;
  notes: string;
  blocked: boolean;
}

export interface GeoAnomalyPattern {
  userId: string;
  usualLocations: {
    country: string;
    region: string;
    city: string;
    confidence: number;
  }[];
  lastKnownLocation: {
    country: string;
    region: string;
    city: string;
    timestamp: Date;
  };
  travelTimeThreshold: number; // in hours
}

export interface RateLimitViolation {
  userId?: string;
  ipAddress: string;
  endpoint: string;
  currentRate: number;
  allowedRate: number;
  windowSize: number;
  violationCount: number;
  firstViolation: Date;
  lastViolation: Date;
}

export interface TierBypassAttempt {
  userId: string;
  currentTier: string;
  attemptedTier: string;
  feature: string;
  method: 'direct_access' | 'parameter_manipulation' | 'token_injection' | 'session_manipulation';
  timestamp: Date;
  blocked: boolean;
}

export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: SecuritySeverity;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  events: SecurityEvent[];
  alerts: SecurityAlert[];
  timeline: IncidentTimelineEntry[];
  impact: IncidentImpact;
  response: IncidentResponse;
}

export interface IncidentTimelineEntry {
  id: string;
  timestamp: Date;
  actor: string;
  action: string;
  details: string;
  metadata?: Record<string, any>;
}

export interface IncidentImpact {
  usersAffected: number;
  servicesAffected: string[];
  dataCompromised: boolean;
  estimatedCost?: number;
  businessImpact: 'low' | 'medium' | 'high' | 'critical';
}

export interface IncidentResponse {
  containmentActions: string[];
  mitigationActions: string[];
  recoveryActions: string[];
  preventionActions: string[];
  lessonsLearned?: string[];
}

export interface AlertConfig {
  id: string;
  name: string;
  eventTypes: SecurityEventType[];
  severityThreshold: SecuritySeverity;
  channels: AlertChannel[];
  enabled: boolean;
  throttle: {
    enabled: boolean;
    maxAlerts: number;
    timeWindow: number; // in minutes
  };
  aggregation: {
    enabled: boolean;
    groupBy: string[];
    timeWindow: number; // in minutes
  };
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'pagerduty';
  config: Record<string, any>;
  enabled: boolean;
}

export interface SecurityDashboardData {
  metrics: SecurityMetrics;
  recentEvents: SecurityEvent[];
  activeAlerts: SecurityAlert[];
  activeIncidents: SecurityIncident[];
  threatMap: ThreatIntelligence[];
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    lastCheck: Date;
    issues: string[];
  };
}