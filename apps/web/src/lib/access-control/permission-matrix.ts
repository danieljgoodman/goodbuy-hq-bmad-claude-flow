/**
 * Comprehensive Tier-Based Access Control Permission Matrix
 * Story 11.10: Advanced Permission System with Feature, Action, and Resource Control
 */

export type UserTier = 'basic' | 'professional' | 'enterprise';

export type Permission = 'none' | 'read' | 'write' | 'admin';

export interface ConditionalPermission {
  permission: Permission;
  usageLimit?: number;
  timeRestriction?: 'daily' | 'weekly' | 'monthly';
  requiresApproval?: boolean;
  conditions?: Record<string, any>;
}

export interface FeaturePermissions {
  [action: string]: Permission | ConditionalPermission;
}

export interface ResourcePermissions {
  [resourceType: string]: {
    [action: string]: Permission | ConditionalPermission;
  };
}

export interface TierPermissions {
  features: {
    questionnaire: FeaturePermissions;
    dashboard: FeaturePermissions;
    reports: FeaturePermissions;
    evaluations: FeaturePermissions;
    ai_analysis: FeaturePermissions;
    roi_calculator: FeaturePermissions;
    financial_trends: FeaturePermissions;
    scenario_modeling: FeaturePermissions;
    exit_planning: FeaturePermissions;
    strategic_options: FeaturePermissions;
    admin: FeaturePermissions;
    support: FeaturePermissions;
    api: FeaturePermissions;
    integrations: FeaturePermissions;
    compliance: FeaturePermissions;
  };
  resources: ResourcePermissions;
  limits: {
    maxReports: number;
    maxEvaluations: number;
    maxAiAnalyses: number;
    maxScenarios: number;
    storageLimit: number; // in MB
    apiCallsPerMonth: number;
    concurrentUsers: number;
    dataRetentionDays: number;
  };
  inheritance?: UserTier[]; // Tiers this tier inherits from
}

export interface TierPermissionMatrix {
  basic: TierPermissions;
  professional: TierPermissions;
  enterprise: TierPermissions;
}

/**
 * Complete Permission Matrix for all tiers
 */
export const PERMISSION_MATRIX: TierPermissionMatrix = {
  basic: {
    features: {
      questionnaire: {
        view: 'read',
        create: {
          permission: 'write',
          usageLimit: 3,
          timeRestriction: 'monthly'
        },
        edit: {
          permission: 'write',
          usageLimit: 5,
          timeRestriction: 'monthly'
        },
        delete: 'write',
        share: 'none',
        export: 'none'
      },
      dashboard: {
        view: 'read',
        customize: 'none',
        widgets: 'read',
        filters: {
          permission: 'read',
          conditions: { maxFilters: 3 }
        },
        export: 'none'
      },
      reports: {
        view: 'read',
        create: {
          permission: 'write',
          usageLimit: 5,
          timeRestriction: 'monthly'
        },
        edit: 'write',
        delete: 'write',
        share: 'none',
        export: {
          permission: 'read',
          usageLimit: 3,
          timeRestriction: 'monthly'
        },
        schedule: 'none',
        advanced_analytics: 'none'
      },
      evaluations: {
        view: 'read',
        create: {
          permission: 'write',
          usageLimit: 2,
          timeRestriction: 'monthly'
        },
        edit: 'write',
        delete: 'write',
        share: 'none',
        export: 'none',
        templates: 'read',
        custom_metrics: 'none'
      },
      ai_analysis: {
        view: 'none',
        create: 'none',
        edit: 'none',
        delete: 'none',
        share: 'none',
        export: 'none',
        advanced: 'none'
      },
      roi_calculator: {
        view: 'read',
        create: {
          permission: 'write',
          usageLimit: 10,
          timeRestriction: 'monthly'
        },
        edit: 'write',
        delete: 'write',
        share: 'none',
        export: 'none',
        scenarios: 'none'
      },
      financial_trends: {
        view: 'none',
        create: 'none',
        edit: 'none',
        delete: 'none',
        share: 'none',
        export: 'none',
        forecasting: 'none'
      },
      scenario_modeling: {
        view: 'none',
        create: 'none',
        edit: 'none',
        delete: 'none',
        share: 'none',
        export: 'none',
        advanced: 'none'
      },
      exit_planning: {
        view: 'none',
        create: 'none',
        edit: 'none',
        delete: 'none',
        share: 'none',
        export: 'none',
        strategies: 'none'
      },
      strategic_options: {
        view: 'none',
        create: 'none',
        edit: 'none',
        delete: 'none',
        share: 'none',
        export: 'none',
        analysis: 'none'
      },
      admin: {
        view: 'none',
        create: 'none',
        edit: 'none',
        delete: 'none',
        user_management: 'none',
        system_settings: 'none'
      },
      support: {
        view: 'read',
        create: 'write',
        edit: 'none',
        priority: 'none'
      },
      api: {
        access: 'none',
        create_keys: 'none',
        manage: 'none'
      },
      integrations: {
        view: 'none',
        create: 'none',
        edit: 'none',
        delete: 'none'
      },
      compliance: {
        view: 'none',
        create: 'none',
        reports: 'none',
        audit: 'none'
      }
    },
    resources: {
      documents: {
        view: 'read',
        create: {
          permission: 'write',
          usageLimit: 10,
          timeRestriction: 'monthly'
        },
        edit: 'write',
        delete: 'write',
        share: 'none'
      },
      templates: {
        view: 'read',
        create: 'none',
        edit: 'none',
        delete: 'none',
        share: 'none'
      },
      data: {
        view: 'read',
        export: 'none',
        import: 'none',
        bulk_operations: 'none'
      }
    },
    limits: {
      maxReports: 5,
      maxEvaluations: 2,
      maxAiAnalyses: 0,
      maxScenarios: 0,
      storageLimit: 100, // 100MB
      apiCallsPerMonth: 0,
      concurrentUsers: 1,
      dataRetentionDays: 30
    }
  },

  professional: {
    features: {
      questionnaire: {
        view: 'read',
        create: {
          permission: 'write',
          usageLimit: 15,
          timeRestriction: 'monthly'
        },
        edit: 'write',
        delete: 'write',
        share: 'write',
        export: {
          permission: 'write',
          usageLimit: 10,
          timeRestriction: 'monthly'
        },
        templates: 'write',
        collaboration: 'write'
      },
      dashboard: {
        view: 'read',
        customize: 'write',
        widgets: 'write',
        filters: 'write',
        export: 'write',
        share: 'write',
        alerts: 'write'
      },
      reports: {
        view: 'read',
        create: {
          permission: 'write',
          usageLimit: 25,
          timeRestriction: 'monthly'
        },
        edit: 'write',
        delete: 'write',
        share: 'write',
        export: 'write',
        schedule: {
          permission: 'write',
          usageLimit: 5,
          timeRestriction: 'monthly'
        },
        advanced_analytics: 'read',
        templates: 'write'
      },
      evaluations: {
        view: 'read',
        create: {
          permission: 'write',
          usageLimit: 10,
          timeRestriction: 'monthly'
        },
        edit: 'write',
        delete: 'write',
        share: 'write',
        export: 'write',
        templates: 'write',
        custom_metrics: 'write',
        benchmarking: 'read'
      },
      ai_analysis: {
        view: 'read',
        create: {
          permission: 'write',
          usageLimit: 20,
          timeRestriction: 'monthly'
        },
        edit: 'write',
        delete: 'write',
        share: 'write',
        export: 'write',
        advanced: 'none',
        insights: 'read'
      },
      roi_calculator: {
        view: 'read',
        create: 'write',
        edit: 'write',
        delete: 'write',
        share: 'write',
        export: 'write',
        scenarios: {
          permission: 'write',
          usageLimit: 10,
          timeRestriction: 'monthly'
        },
        forecasting: 'read'
      },
      financial_trends: {
        view: 'read',
        create: {
          permission: 'write',
          usageLimit: 15,
          timeRestriction: 'monthly'
        },
        edit: 'write',
        delete: 'write',
        share: 'write',
        export: 'write',
        forecasting: 'read',
        analysis: 'read'
      },
      scenario_modeling: {
        view: 'read',
        create: {
          permission: 'write',
          usageLimit: 8,
          timeRestriction: 'monthly'
        },
        edit: 'write',
        delete: 'write',
        share: 'write',
        export: 'write',
        advanced: 'none',
        simulation: 'read'
      },
      exit_planning: {
        view: 'read',
        create: {
          permission: 'write',
          usageLimit: 3,
          timeRestriction: 'monthly'
        },
        edit: 'write',
        delete: 'write',
        share: 'none',
        export: 'write',
        strategies: 'read',
        valuation: 'read'
      },
      strategic_options: {
        view: 'read',
        create: {
          permission: 'write',
          usageLimit: 5,
          timeRestriction: 'monthly'
        },
        edit: 'write',
        delete: 'write',
        share: 'write',
        export: 'write',
        analysis: 'read',
        recommendations: 'read'
      },
      admin: {
        view: 'none',
        create: 'none',
        edit: 'none',
        delete: 'none',
        user_management: 'none',
        system_settings: 'none'
      },
      support: {
        view: 'read',
        create: 'write',
        edit: 'write',
        priority: 'read'
      },
      api: {
        access: {
          permission: 'read',
          usageLimit: 1000,
          timeRestriction: 'monthly'
        },
        create_keys: 'write',
        manage: 'write'
      },
      integrations: {
        view: 'read',
        create: {
          permission: 'write',
          usageLimit: 5,
          timeRestriction: 'monthly'
        },
        edit: 'write',
        delete: 'write',
        third_party: 'read'
      },
      compliance: {
        view: 'read',
        create: 'none',
        reports: 'read',
        audit: 'none'
      }
    },
    resources: {
      documents: {
        view: 'read',
        create: 'write',
        edit: 'write',
        delete: 'write',
        share: 'write',
        collaborate: 'write'
      },
      templates: {
        view: 'read',
        create: {
          permission: 'write',
          usageLimit: 10,
          timeRestriction: 'monthly'
        },
        edit: 'write',
        delete: 'write',
        share: 'write'
      },
      data: {
        view: 'read',
        export: 'write',
        import: {
          permission: 'write',
          usageLimit: 100,
          timeRestriction: 'monthly'
        },
        bulk_operations: 'read'
      }
    },
    limits: {
      maxReports: 25,
      maxEvaluations: 10,
      maxAiAnalyses: 20,
      maxScenarios: 8,
      storageLimit: 1000, // 1GB
      apiCallsPerMonth: 10000,
      concurrentUsers: 3,
      dataRetentionDays: 365
    },
    inheritance: ['basic']
  },

  enterprise: {
    features: {
      questionnaire: {
        view: 'read',
        create: 'write',
        edit: 'write',
        delete: 'write',
        share: 'write',
        export: 'write',
        templates: 'admin',
        collaboration: 'admin',
        approval_workflows: 'admin',
        custom_fields: 'admin'
      },
      dashboard: {
        view: 'read',
        customize: 'admin',
        widgets: 'admin',
        filters: 'admin',
        export: 'admin',
        share: 'admin',
        alerts: 'admin',
        real_time: 'admin',
        multi_tenant: 'admin'
      },
      reports: {
        view: 'read',
        create: 'write',
        edit: 'write',
        delete: 'write',
        share: 'admin',
        export: 'admin',
        schedule: 'admin',
        advanced_analytics: 'admin',
        templates: 'admin',
        white_label: 'admin',
        automation: 'admin'
      },
      evaluations: {
        view: 'read',
        create: 'write',
        edit: 'write',
        delete: 'write',
        share: 'admin',
        export: 'admin',
        templates: 'admin',
        custom_metrics: 'admin',
        benchmarking: 'admin',
        industry_standards: 'admin',
        compliance_tracking: 'admin'
      },
      ai_analysis: {
        view: 'read',
        create: 'write',
        edit: 'write',
        delete: 'write',
        share: 'admin',
        export: 'admin',
        advanced: 'admin',
        insights: 'admin',
        custom_models: 'admin',
        ml_training: 'admin'
      },
      roi_calculator: {
        view: 'read',
        create: 'write',
        edit: 'write',
        delete: 'write',
        share: 'admin',
        export: 'admin',
        scenarios: 'admin',
        forecasting: 'admin',
        monte_carlo: 'admin',
        sensitivity_analysis: 'admin'
      },
      financial_trends: {
        view: 'read',
        create: 'write',
        edit: 'write',
        delete: 'write',
        share: 'admin',
        export: 'admin',
        forecasting: 'admin',
        analysis: 'admin',
        predictive_modeling: 'admin',
        market_integration: 'admin'
      },
      scenario_modeling: {
        view: 'read',
        create: 'write',
        edit: 'write',
        delete: 'write',
        share: 'admin',
        export: 'admin',
        advanced: 'admin',
        simulation: 'admin',
        stress_testing: 'admin',
        optimization: 'admin'
      },
      exit_planning: {
        view: 'read',
        create: 'write',
        edit: 'write',
        delete: 'write',
        share: 'admin',
        export: 'admin',
        strategies: 'admin',
        valuation: 'admin',
        tax_optimization: 'admin',
        succession_planning: 'admin'
      },
      strategic_options: {
        view: 'read',
        create: 'write',
        edit: 'write',
        delete: 'write',
        share: 'admin',
        export: 'admin',
        analysis: 'admin',
        recommendations: 'admin',
        decision_trees: 'admin',
        portfolio_analysis: 'admin'
      },
      admin: {
        view: 'admin',
        create: 'admin',
        edit: 'admin',
        delete: 'admin',
        user_management: 'admin',
        system_settings: 'admin',
        security_policies: 'admin',
        audit_logs: 'admin',
        backup_restore: 'admin'
      },
      support: {
        view: 'admin',
        create: 'admin',
        edit: 'admin',
        priority: 'admin',
        escalation: 'admin',
        sla_management: 'admin'
      },
      api: {
        access: 'admin',
        create_keys: 'admin',
        manage: 'admin',
        webhooks: 'admin',
        rate_limiting: 'admin'
      },
      integrations: {
        view: 'admin',
        create: 'admin',
        edit: 'admin',
        delete: 'admin',
        third_party: 'admin',
        custom_connectors: 'admin',
        sso: 'admin'
      },
      compliance: {
        view: 'admin',
        create: 'admin',
        reports: 'admin',
        audit: 'admin',
        gdpr: 'admin',
        sox: 'admin',
        iso27001: 'admin'
      }
    },
    resources: {
      documents: {
        view: 'read',
        create: 'admin',
        edit: 'admin',
        delete: 'admin',
        share: 'admin',
        collaborate: 'admin',
        version_control: 'admin',
        approval_workflows: 'admin'
      },
      templates: {
        view: 'read',
        create: 'admin',
        edit: 'admin',
        delete: 'admin',
        share: 'admin',
        marketplace: 'admin',
        custom_branding: 'admin'
      },
      data: {
        view: 'read',
        export: 'admin',
        import: 'admin',
        bulk_operations: 'admin',
        data_governance: 'admin',
        encryption: 'admin',
        backup: 'admin'
      }
    },
    limits: {
      maxReports: -1, // Unlimited
      maxEvaluations: -1, // Unlimited
      maxAiAnalyses: -1, // Unlimited
      maxScenarios: -1, // Unlimited
      storageLimit: -1, // Unlimited
      apiCallsPerMonth: -1, // Unlimited
      concurrentUsers: -1, // Unlimited
      dataRetentionDays: -1 // Unlimited
    },
    inheritance: ['basic', 'professional']
  }
};

/**
 * Permission checking utilities
 */
export class PermissionChecker {
  private static matrix = PERMISSION_MATRIX;

  /**
   * Check if user has permission for a specific feature action
   */
  static hasFeaturePermission(
    userTier: UserTier,
    feature: keyof TierPermissions['features'],
    action: string
  ): boolean {
    const tierConfig = this.matrix[userTier];
    if (!tierConfig) return false;

    const featurePermissions = tierConfig.features[feature];
    if (!featurePermissions) return false;

    const permission = featurePermissions[action];
    if (!permission) return false;

    if (typeof permission === 'string') {
      return permission !== 'none';
    }

    // Handle conditional permissions
    const conditionalPermission = permission as ConditionalPermission;
    return conditionalPermission.permission !== 'none';
  }

  /**
   * Check if user has resource permission
   */
  static hasResourcePermission(
    userTier: UserTier,
    resourceType: string,
    action: string
  ): boolean {
    const tierConfig = this.matrix[userTier];
    if (!tierConfig) return false;

    const resourcePermissions = tierConfig.resources[resourceType];
    if (!resourcePermissions) return false;

    const permission = resourcePermissions[action];
    if (!permission) return false;

    if (typeof permission === 'string') {
      return permission !== 'none';
    }

    const conditionalPermission = permission as ConditionalPermission;
    return conditionalPermission.permission !== 'none';
  }

  /**
   * Get permission level for feature action
   */
  static getFeaturePermission(
    userTier: UserTier,
    feature: keyof TierPermissions['features'],
    action: string
  ): Permission | ConditionalPermission | null {
    const tierConfig = this.matrix[userTier];
    if (!tierConfig) return null;

    const featurePermissions = tierConfig.features[feature];
    if (!featurePermissions) return null;

    return featurePermissions[action] || null;
  }

  /**
   * Get resource permission level
   */
  static getResourcePermission(
    userTier: UserTier,
    resourceType: string,
    action: string
  ): Permission | ConditionalPermission | null {
    const tierConfig = this.matrix[userTier];
    if (!tierConfig) return null;

    const resourcePermissions = tierConfig.resources[resourceType];
    if (!resourcePermissions) return null;

    return resourcePermissions[action] || null;
  }

  /**
   * Get tier limits
   */
  static getTierLimits(userTier: UserTier): TierPermissions['limits'] | null {
    const tierConfig = this.matrix[userTier];
    return tierConfig?.limits || null;
  }

  /**
   * Check if user is within usage limits
   */
  static isWithinUsageLimit(
    userTier: UserTier,
    limitType: keyof TierPermissions['limits'],
    currentUsage: number
  ): boolean {
    const limits = this.getTierLimits(userTier);
    if (!limits) return false;

    const limit = limits[limitType];
    if (limit === -1) return true; // Unlimited

    return currentUsage < limit;
  }

  /**
   * Get all permissions for a tier (including inherited)
   */
  static getAllPermissions(userTier: UserTier): TierPermissions {
    const tierConfig = this.matrix[userTier];
    if (!tierConfig) {
      throw new Error(`Invalid tier: ${userTier}`);
    }

    // If no inheritance, return the tier config directly
    if (!tierConfig.inheritance || tierConfig.inheritance.length === 0) {
      return tierConfig;
    }

    // Merge permissions from inherited tiers
    let mergedPermissions = { ...tierConfig };

    for (const inheritedTier of tierConfig.inheritance) {
      const inheritedConfig = this.matrix[inheritedTier];
      if (inheritedConfig) {
        // Merge features (current tier overrides inherited)
        mergedPermissions.features = {
          ...inheritedConfig.features,
          ...mergedPermissions.features
        };

        // Merge resources (current tier overrides inherited)
        mergedPermissions.resources = {
          ...inheritedConfig.resources,
          ...mergedPermissions.resources
        };

        // Use current tier limits (no inheritance for limits)
      }
    }

    return mergedPermissions;
  }

  /**
   * Check if action requires approval
   */
  static requiresApproval(
    userTier: UserTier,
    feature: keyof TierPermissions['features'],
    action: string
  ): boolean {
    const permission = this.getFeaturePermission(userTier, feature, action);
    if (!permission || typeof permission === 'string') return false;

    const conditionalPermission = permission as ConditionalPermission;
    return conditionalPermission.requiresApproval || false;
  }

  /**
   * Get usage limit for specific action
   */
  static getUsageLimit(
    userTier: UserTier,
    feature: keyof TierPermissions['features'],
    action: string
  ): { limit: number; period: string } | null {
    const permission = this.getFeaturePermission(userTier, feature, action);
    if (!permission || typeof permission === 'string') return null;

    const conditionalPermission = permission as ConditionalPermission;
    if (!conditionalPermission.usageLimit || !conditionalPermission.timeRestriction) {
      return null;
    }

    return {
      limit: conditionalPermission.usageLimit,
      period: conditionalPermission.timeRestriction
    };
  }
}

/**
 * Export default permission matrix and utilities
 */
export default {
  PERMISSION_MATRIX,
  PermissionChecker
};