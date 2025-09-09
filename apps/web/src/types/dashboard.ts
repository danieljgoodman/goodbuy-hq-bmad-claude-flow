export interface DashboardMetrics {
  businessValuation: number
  healthScore: number
  growthRate: number
  riskLevel: 'low' | 'medium' | 'high'
  lastUpdated: Date
  totalEvaluations: number
  documentsProcessed: number
  averageProcessingTime: number
}

export interface ChartDataPoint {
  date: string
  value: number
  category: string
  formattedValue?: string
  metadata?: Record<string, any>
}

export interface ActivityItem {
  id: string
  type: 'evaluation_created' | 'data_updated' | 'document_processed' | 'settings_changed'
  timestamp: Date
  description: string
  metadata: Record<string, any>
  userId: string
  status?: 'success' | 'warning' | 'error'
}

export interface DateRange {
  start: Date
  end: Date
  period: '7d' | '30d' | '90d' | '1y' | 'all'
}

export interface ChartConfig {
  height: number
  responsive: boolean
  showGrid: boolean
  showTooltip: boolean
  showLegend: boolean
  colors?: string[]
  animations?: boolean
}

export interface HealthScoreBreakdown {
  financial: {
    score: number
    weight: number
    factors: string[]
  }
  operational: {
    score: number
    weight: number
    factors: string[]
  }
  market: {
    score: number
    weight: number
    factors: string[]
  }
  risk: {
    score: number
    weight: number
    factors: string[]
  }
  growth: {
    score: number
    weight: number
    factors: string[]
  }
}

export interface KPICard {
  title: string
  value: number | string
  change?: {
    value: number
    type: 'increase' | 'decrease'
    period: string
  }
  format: 'currency' | 'percentage' | 'number' | 'score'
  icon: string
  color: 'green' | 'blue' | 'purple' | 'orange' | 'red'
}

export interface TrendData {
  period: string
  valuations: ChartDataPoint[]
  healthScores: ChartDataPoint[]
  growthRates: ChartDataPoint[]
  riskLevels: ChartDataPoint[]
}

export interface DashboardFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  businessCategories: string[];
  evaluationTypes: ('completed' | 'processing' | 'failed')[];
  customTimeframe?: {
    label: string;
    days: number;
  };
}

export interface ComparisonState {
  selectedEvaluations: string[];
  comparisonMode: 'side-by-side' | 'trend' | 'overlay';
  metrics: string[];
}

export interface ExportData {
  evaluations: any[];
  filters: DashboardFilters;
  generatedAt: Date;
  format: 'pdf' | 'csv';
  includeCharts: boolean;
}

export interface ExportHistory {
  id: string;
  userId: string;
  filename: string;
  format: 'pdf' | 'csv';
  downloadUrl: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface DashboardState {
  metrics: DashboardMetrics | null
  activities: ActivityItem[]
  trendData: TrendData | null
  selectedDateRange: DateRange
  filters: DashboardFilters
  comparison: ComparisonState
  isLoading: boolean
  lastRefresh: Date | null
  error: string | null
}