export interface PremiumSubscription {
  id: string;
  userId: string;
  plan: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: Date;
  endDate?: Date;
  features: PremiumFeature[];
  usage: PremiumUsage;
  billing: BillingInfo;
}

export interface PremiumFeature {
  feature: string;
  enabled: boolean;
  usage: number;
  limit?: number;
  description: string;
}

export interface PremiumUsage {
  implementationGuides: number;
  templateDownloads: number;
  consultationMinutes: number;
  expertInsights: number;
  caseStudyAccess: number;
  roadmapGeneration: number;
  period: 'month' | 'year';
  resetDate: Date;
}

export interface BillingInfo {
  amount: number;
  currency: string;
  interval: 'monthly' | 'annually';
  nextBillingDate: Date;
  paymentMethod: string;
}

export interface ContentGatingRule {
  contentType: 'implementation_guide' | 'template' | 'case_study' | 'expert_insight' | 'consultation';
  accessLevel: 'free' | 'basic' | 'premium' | 'enterprise';
  restrictions: {
    usage?: number;
    timeLimit?: number;
    featureSet?: string[];
  };
  upgradePrompt: {
    title: string;
    description: string;
    benefits: string[];
    ctaText: string;
  };
}

export interface PremiumTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  templateType: 'document' | 'spreadsheet' | 'checklist' | 'process' | 'presentation';
  content: string;
  variables: TemplateVariable[];
  instructions: string;
  examples: TemplateExample[];
  relatedOpportunities: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  downloadCount: number;
  rating: number;
  reviews: TemplateReview[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  description: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'percentage' | 'boolean';
  required: boolean;
  defaultValue?: any;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface TemplateExample {
  industry: string;
  scenario: string;
  filledTemplate: string;
  notes: string;
  results: string;
}

export interface TemplateReview {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  helpful: number;
  createdAt: Date;
}

export interface ImplementationGuide {
  id: string;
  opportunityId: string;
  title: string;
  description: string;
  overview: string;
  objectives: string[];
  prerequisites: string[];
  phases: GuidePhase[];
  templates: string[];
  tools: string[];
  successMetrics: string[];
  commonPitfalls: CommonPitfall[];
  expertTips: ExpertTip[];
  caseStudies: string[];
  estimatedDuration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  industry: string[];
  businessSize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
}

export interface GuidePhase {
  phase: number;
  name: string;
  description: string;
  duration: string;
  steps: GuideStep[];
  deliverables: string[];
  checkpoints: Checkpoint[];
}

export interface GuideStep {
  step: number;
  title: string;
  description: string;
  instructions: string[];
  resources: string[];
  timeEstimate: string;
  dependencies: number[];
  optional: boolean;
}

export interface Checkpoint {
  name: string;
  criteria: string[];
  deliverables: string[];
  signOff: string;
}

export interface CommonPitfall {
  pitfall: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  prevention: string;
  recovery: string;
}

export interface ExpertTip {
  tip: string;
  context: string;
  impact: string;
  expert: string;
  expertise: string;
}

export interface ConsultationBooking {
  id: string;
  userId: string;
  expertId: string;
  opportunityId?: string;
  type: 'strategy' | 'implementation' | 'troubleshooting' | 'review';
  duration: number;
  scheduledDate: Date;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  topics: string[];
  preparationNotes?: string;
  sessionNotes?: string;
  followUpActions?: string[];
  rating?: number;
  feedback?: string;
  cost: number;
  currency: string;
  createdAt: Date;
}

export interface Expert {
  id: string;
  name: string;
  title: string;
  bio: string;
  expertise: string[];
  industries: string[];
  experience: number;
  rating: number;
  totalSessions: number;
  hourlyRate: number;
  availability: ExpertAvailability[];
  certifications: string[];
  languages: string[];
  timezone: string;
}

export interface ExpertAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
}

export interface PremiumAnalytics {
  userId: string;
  opportunityId: string;
  trackingPeriod: {
    start: Date;
    end: Date;
  };
  progress: ProgressMetric[];
  milestones: MilestoneProgress[];
  kpis: KPITracking[];
  recommendations: AnalyticsRecommendation[];
  alerts: AnalyticsAlert[];
  reports: GeneratedReport[];
}

export interface ProgressMetric {
  metric: string;
  currentValue: number;
  targetValue: number;
  progress: number;
  trend: 'improving' | 'declining' | 'stable';
  lastUpdated: Date;
}

export interface MilestoneProgress {
  milestoneId: string;
  name: string;
  targetDate: Date;
  completionDate?: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  progress: number;
  blockers: string[];
}

export interface KPITracking {
  kpi: string;
  baseline: number;
  current: number;
  target: number;
  improvement: number;
  trend: number[];
  lastMeasured: Date;
}

export interface AnalyticsRecommendation {
  type: 'optimization' | 'course_correction' | 'opportunity' | 'risk_mitigation';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  effort: string;
  confidence: number;
  actionItems: string[];
  dueDate?: Date;
}

export interface AnalyticsAlert {
  id: string;
  type: 'performance' | 'milestone' | 'risk' | 'opportunity';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  metric?: string;
  threshold?: number;
  currentValue?: number;
  recommended_action: string;
  createdAt: Date;
  acknowledged: boolean;
}

export interface GeneratedReport {
  id: string;
  type: 'progress' | 'performance' | 'impact' | 'summary';
  format: 'pdf' | 'html' | 'excel';
  title: string;
  description: string;
  generatedAt: Date;
  downloadUrl: string;
  expiresAt: Date;
}