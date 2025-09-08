export interface DrillDownView {
  id: string;
  name: string;
  description: string;
  component: 'valuation' | 'health' | 'documents' | 'opportunities';
  viewType: 'chart' | 'table' | 'timeline' | 'comparison' | 'detailed';
  isPremium: boolean;
  requiredData: string[];
}

export interface FilterOption {
  id: string;
  name: string;
  type: 'date' | 'category' | 'numeric' | 'boolean' | 'select';
  options?: string[];
  defaultValue?: any;
  isPremium: boolean;
}

export interface ComparisonOption {
  id: string;
  name: string;
  type: 'time_period' | 'industry_benchmark' | 'custom_target' | 'peer_analysis';
  description: string;
  isPremium: boolean;
  requiresData: string[];
}

export interface InteractiveFeature {
  id: string;
  name: string;
  type: 'zoom' | 'filter' | 'drill_down' | 'export' | 'annotation';
  description: string;
  isPremium: boolean;
  component: string;
}

export interface ContextualHelp {
  id: string;
  trigger: string; // CSS selector or component name
  title: string;
  content: string;
  type: 'tooltip' | 'popover' | 'modal' | 'sidebar';
  isPremium: boolean;
  showCondition?: string;
}

export interface ViewCustomization {
  id: string;
  name: string;
  type: 'layout' | 'styling' | 'data_selection' | 'interaction';
  options: {
    [key: string]: any;
  };
  isPremium: boolean;
  defaultValue: any;
}

export interface DrillDownConfiguration {
  id: string;
  dashboardId: string;
  component: 'valuation' | 'health' | 'documents' | 'opportunities';
  availableViews: DrillDownView[];
  filters: FilterOption[];
  comparisons: ComparisonOption[];
  interactiveFeatures: InteractiveFeature[];
  contextualHelp: ContextualHelp[];
  customizations: ViewCustomization[];
}

export interface PremiumFeatureAccess {
  userId: string;
  feature: string;
  hasAccess: boolean;
  trialEndDate?: Date;
  usageCount: number;
  usageLimit?: number;
  lastUsed?: Date;
}

export interface ConversionEvent {
  id: string;
  userId: string;
  eventType: 'view_prompt' | 'click_prompt' | 'start_trial' | 'upgrade' | 'cancel';
  promptId: string;
  context: string;
  metadata: {
    [key: string]: any;
  };
  timestamp: Date;
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  isControl: boolean;
  trafficPercentage: number;
  isActive: boolean;
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    conversionRate: number;
  };
}