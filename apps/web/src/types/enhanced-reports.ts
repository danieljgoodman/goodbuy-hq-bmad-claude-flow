/**
 * Enhanced Report Generation System Type Definitions
 * Comprehensive TypeScript interfaces for Professional and Enterprise tier reports
 *
 * This file defines all necessary types for the enhanced report generation system
 * including Professional and Enterprise tier report structures, templates,
 * configurations, and supporting data types.
 */

import { BusinessEvaluation } from './valuation';
import { EnterpriseTierData } from './enterprise-evaluation';
import { AnalysisResult, AnalysisRecommendation, RiskAssessment } from './ai-analysis';

// Base Report Types
export type ReportTier = 'professional' | 'enterprise';
export type ReportFormat = 'pdf' | 'html' | 'docx' | 'json';
export type ReportStatus = 'generating' | 'completed' | 'failed' | 'cancelled';
export type ChartType = 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'donut' | 'waterfall' | 'heatmap';
export type TimeHorizon = 'historical' | 'current' | 'projected' | 'scenario';

/**
 * Core Report Generation Configuration
 * Base configuration for all report types
 */
export interface ReportGenerationConfig {
  /** Unique identifier for the report generation request */
  id: string;
  /** Report tier determining feature set and depth */
  tier: ReportTier;
  /** Output format for the generated report */
  format: ReportFormat;
  /** Business evaluation data source */
  businessEvaluationId: string;
  /** User requesting the report */
  userId: string;
  /** Template configuration to use */
  template: ReportTemplate;
  /** Custom styling and branding options */
  styling: ReportStyling;
  /** Export and delivery options */
  delivery: ReportDelivery;
  /** Generation metadata */
  metadata: ReportMetadata;
  /** Report generation timestamp */
  createdAt: Date;
}

/**
 * Report Template Configuration
 * Defines structure, sections, and customization options
 */
export interface ReportTemplate {
  /** Template identifier */
  id: string;
  /** Human-readable template name */
  name: string;
  /** Template description and use case */
  description: string;
  /** Tier this template is available for */
  tier: ReportTier;
  /** Template version for compatibility tracking */
  version: string;
  /** Sections included in this template */
  sections: ReportSectionConfig[];
  /** Default styling configuration */
  defaultStyling: ReportStyling;
  /** Template-specific customization options */
  customizationOptions: TemplateCustomization[];
  /** Whether template supports scenario analysis */
  supportsScenarios: boolean;
  /** Estimated generation time in seconds */
  estimatedGenerationTime: number;
}

/**
 * Report Section Configuration
 * Defines individual sections within a report template
 */
export interface ReportSectionConfig {
  /** Section identifier */
  id: string;
  /** Section title displayed in report */
  title: string;
  /** Section order in the report */
  order: number;
  /** Whether section is required or optional */
  required: boolean;
  /** Section type for rendering logic */
  type: ReportSectionType;
  /** Data sources needed for this section */
  dataSources: DataSourceMapping[];
  /** Charts and visualizations in this section */
  visualizations: ChartConfiguration[];
  /** Subsections within this section */
  subsections?: ReportSubsection[];
  /** Custom configuration for this section */
  config?: Record<string, any>;
}

export type ReportSectionType =
  | 'cover_page'
  | 'executive_summary'
  | 'business_overview'
  | 'financial_analysis'
  | 'operational_assessment'
  | 'strategic_positioning'
  | 'risk_analysis'
  | 'investment_recommendations'
  | 'valuation_summary'
  | 'scenario_analysis'
  | 'exit_strategy'
  | 'capital_structure'
  | 'strategic_options'
  | 'multi_year_projections'
  | 'appendices';

/**
 * Report Subsection Configuration
 * Granular control over section content
 */
export interface ReportSubsection {
  /** Subsection identifier */
  id: string;
  /** Subsection title */
  title: string;
  /** Order within parent section */
  order: number;
  /** Content type and rendering */
  contentType: SubsectionContentType;
  /** Data mapping for content generation */
  dataMapping: DataMapping;
  /** Conditional rendering rules */
  conditionalRules?: ConditionalRule[];
}

export type SubsectionContentType =
  | 'narrative_text'
  | 'data_table'
  | 'chart_visualization'
  | 'key_metrics'
  | 'bullet_points'
  | 'financial_statements'
  | 'scenario_comparison'
  | 'recommendation_list';

/**
 * Professional Tier Report Structure
 * Comprehensive report structure for Professional tier customers
 */
export interface ProfessionalReportStructure {
  /** Report metadata and identification */
  metadata: ReportMetadata;

  /** Cover page with branding and basic info */
  coverPage: CoverPageSection;

  /** Executive summary with key findings */
  executiveSummary: ExecutiveSummarySection;

  /** Business overview and context */
  businessOverview: BusinessOverviewSection;

  /** Detailed financial analysis */
  financialAnalysis: FinancialAnalysisSection;

  /** Operational assessment and capabilities */
  operationalAssessment: OperationalAssessmentSection;

  /** Strategic positioning and competitive analysis */
  strategicPositioning: StrategicPositioningSection;

  /** Risk analysis and mitigation strategies */
  riskAnalysis: RiskAnalysisSection;

  /** Investment recommendations and priorities */
  investmentRecommendations: InvestmentRecommendationsSection;

  /** Valuation summary and methodology */
  valuationSummary: ValuationSummarySection;

  /** Supporting appendices and detailed data */
  appendices: AppendicesSection;
}

/**
 * Enterprise Tier Report Structure
 * Extended report structure with advanced analysis for Enterprise tier
 */
export interface EnterpriseReportStructure extends ProfessionalReportStructure {
  /** Advanced scenario analysis with multiple outcomes */
  scenarioAnalysis: ScenarioAnalysisSection;

  /** Exit strategy analysis and recommendations */
  exitStrategy: ExitStrategySection;

  /** Capital structure optimization analysis */
  capitalStructure: CapitalStructureSection;

  /** Strategic options and growth pathways */
  strategicOptions: StrategicOptionsSection;

  /** Multi-year financial projections and modeling */
  multiYearProjections: MultiYearProjectionsSection;
}

/**
 * Report Metadata
 * Administrative and tracking information
 */
export interface ReportMetadata {
  /** Unique report identifier */
  reportId: string;
  /** Report generation version */
  version: string;
  /** Report tier */
  tier: ReportTier;
  /** Generation timestamp */
  generatedAt: Date;
  /** User who requested the report */
  generatedBy: string;
  /** Business evaluation used as data source */
  sourceEvaluationId: string;
  /** Report title */
  title: string;
  /** Report subtitle or description */
  subtitle?: string;
  /** Company name being analyzed */
  companyName: string;
  /** Analysis period covered */
  analysisPeriod: DateRange;
  /** Report status */
  status: ReportStatus;
  /** Generation performance metrics */
  performance: GenerationPerformance;
  /** Custom tags for organization */
  tags: string[];
}

/**
 * Cover Page Section
 * Professional presentation and branding
 */
export interface CoverPageSection {
  /** Report title and subtitle */
  title: string;
  subtitle?: string;
  /** Company being analyzed */
  companyInformation: CompanyInfo;
  /** Report metadata display */
  reportDetails: ReportDetails;
  /** Custom branding elements */
  branding: BrandingElements;
  /** Confidentiality notice */
  confidentialityNotice: string;
  /** Page background and styling */
  styling: PageStyling;
}

/**
 * Executive Summary Section
 * High-level overview and key findings
 */
export interface ExecutiveSummarySection {
  /** Key findings and insights */
  keyFindings: KeyFinding[];
  /** Primary recommendations */
  primaryRecommendations: ExecutiveSummaryRecommendation[];
  /** Financial highlights */
  financialHighlights: FinancialHighlight[];
  /** Valuation summary */
  valuationHighlight: ValuationHighlight;
  /** Risk summary */
  riskSummary: RiskSummary;
  /** Investment thesis */
  investmentThesis: InvestmentThesis;
  /** Strategic priorities */
  strategicPriorities: StrategicPriority[];
}

/**
 * Business Overview Section
 * Company background and market context
 */
export interface BusinessOverviewSection {
  /** Company background and history */
  companyBackground: CompanyBackground;
  /** Business model description */
  businessModel: BusinessModelAnalysis;
  /** Market analysis and positioning */
  marketAnalysis: MarketAnalysis;
  /** Competitive landscape */
  competitiveLandscape: CompetitiveLandscape;
  /** Key success factors */
  keySuccessFactors: SuccessFactor[];
  /** Management team assessment */
  managementTeam: ManagementTeamAnalysis;
}

/**
 * Financial Analysis Section
 * Detailed financial performance and metrics
 */
export interface FinancialAnalysisSection {
  /** Historical financial performance */
  historicalPerformance: HistoricalFinancialAnalysis;
  /** Profitability analysis */
  profitabilityAnalysis: ProfitabilityAnalysis;
  /** Cash flow analysis */
  cashFlowAnalysis: CashFlowAnalysis;
  /** Balance sheet analysis */
  balanceSheetAnalysis: BalanceSheetAnalysis;
  /** Financial ratios and metrics */
  financialRatios: FinancialRatioAnalysis;
  /** Working capital analysis */
  workingCapitalAnalysis: WorkingCapitalAnalysis;
  /** Financial trends and patterns */
  trendAnalysis: FinancialTrendAnalysis;
}

/**
 * Operational Assessment Section
 * Operations, processes, and capabilities analysis
 */
export interface OperationalAssessmentSection {
  /** Operational efficiency metrics */
  operationalEfficiency: OperationalEfficiencyAnalysis;
  /** Process optimization opportunities */
  processOptimization: ProcessOptimizationAnalysis;
  /** Technology and systems assessment */
  technologyAssessment: TechnologyAssessment;
  /** Human capital analysis */
  humanCapitalAnalysis: HumanCapitalAnalysis;
  /** Scalability assessment */
  scalabilityAssessment: ScalabilityAssessment;
  /** Quality management systems */
  qualityManagement: QualityManagementAnalysis;
}

/**
 * Strategic Positioning Section
 * Market position and competitive advantages
 */
export interface StrategicPositioningSection {
  /** Market position analysis */
  marketPosition: MarketPositionAnalysis;
  /** Competitive advantages */
  competitiveAdvantages: CompetitiveAdvantageAnalysis[];
  /** SWOT analysis */
  swotAnalysis: SWOTAnalysis;
  /** Value proposition assessment */
  valueProposition: ValuePropositionAnalysis;
  /** Strategic assets evaluation */
  strategicAssets: StrategicAssetAnalysis[];
  /** Growth potential assessment */
  growthPotential: GrowthPotentialAnalysis;
}

/**
 * Risk Analysis Section
 * Comprehensive risk assessment and mitigation
 */
export interface RiskAnalysisSection {
  /** Risk assessment summary */
  riskSummary: RiskAssessmentSummary;
  /** Detailed risk analysis by category */
  risksByCategory: CategorizedRiskAnalysis;
  /** Risk mitigation strategies */
  mitigationStrategies: RiskMitigationStrategy[];
  /** Risk monitoring framework */
  monitoringFramework: RiskMonitoringFramework;
  /** Scenario-based risk analysis */
  scenarioRisks: ScenarioRiskAnalysis[];
}

/**
 * Investment Recommendations Section
 * Strategic recommendations and action plans
 */
export interface InvestmentRecommendationsSection {
  /** Primary investment recommendations */
  primaryRecommendations: InvestmentRecommendation[];
  /** Implementation roadmap */
  implementationRoadmap: ImplementationRoadmap;
  /** Investment priorities matrix */
  prioritiesMatrix: InvestmentPrioritiesMatrix;
  /** Resource requirements */
  resourceRequirements: ResourceRequirement[];
  /** Expected outcomes and ROI */
  expectedOutcomes: ExpectedOutcome[];
  /** Success metrics and KPIs */
  successMetrics: SuccessMetric[];
}

/**
 * Valuation Summary Section
 * Comprehensive valuation analysis and methodology
 */
export interface ValuationSummarySection {
  /** Valuation methodology overview */
  methodology: ValuationMethodology;
  /** Multiple valuation approaches */
  valuationApproaches: ValuationApproach[];
  /** Valuation reconciliation */
  reconciliation: ValuationReconciliation;
  /** Sensitivity analysis */
  sensitivityAnalysis: SensitivityAnalysis;
  /** Comparable company analysis */
  comparableAnalysis: ComparableCompanyAnalysis;
  /** Valuation adjustments */
  adjustments: ValuationAdjustment[];
}

/**
 * Scenario Analysis Section (Enterprise Only)
 * Advanced scenario modeling and analysis
 */
export interface ScenarioAnalysisSection {
  /** Scenario overview and methodology */
  scenarioOverview: ScenarioOverview;
  /** Base case scenario */
  baseCase: ScenarioModel;
  /** Optimistic scenario */
  optimisticCase: ScenarioModel;
  /** Conservative scenario */
  conservativeCase: ScenarioModel;
  /** Custom scenarios */
  customScenarios: ScenarioModel[];
  /** Scenario comparison analysis */
  comparisonAnalysis: ScenarioComparisonAnalysis;
  /** Key variables and drivers */
  keyVariables: ScenarioVariable[];
}

/**
 * Exit Strategy Section (Enterprise Only)
 * Exit planning and strategy analysis
 */
export interface ExitStrategySection {
  /** Exit strategy overview */
  strategyOverview: ExitStrategyOverview;
  /** Available exit options */
  exitOptions: ExitOption[];
  /** Exit timeline analysis */
  timelineAnalysis: ExitTimelineAnalysis;
  /** Value maximization strategies */
  valueMaximization: ValueMaximizationStrategy[];
  /** Transaction readiness assessment */
  transactionReadiness: TransactionReadinessAssessment;
  /** Exit planning recommendations */
  planningRecommendations: ExitPlanningRecommendation[];
}

/**
 * Capital Structure Section (Enterprise Only)
 * Capital optimization and financing analysis
 */
export interface CapitalStructureSection {
  /** Current capital structure analysis */
  currentStructure: CapitalStructureAnalysis;
  /** Optimal capital structure recommendation */
  optimalStructure: OptimalCapitalStructure;
  /** Financing options analysis */
  financingOptions: FinancingOption[];
  /** Cost of capital analysis */
  costOfCapital: CostOfCapitalAnalysis;
  /** Leverage analysis */
  leverageAnalysis: LeverageAnalysis;
  /** Capital allocation recommendations */
  allocationRecommendations: CapitalAllocationRecommendation[];
}

/**
 * Strategic Options Section (Enterprise Only)
 * Growth strategies and strategic alternatives
 */
export interface StrategicOptionsSection {
  /** Strategic options overview */
  optionsOverview: StrategicOptionsOverview;
  /** Growth strategies */
  growthStrategies: GrowthStrategy[];
  /** Acquisition opportunities */
  acquisitionOpportunities: AcquisitionOpportunity[];
  /** Partnership strategies */
  partnershipStrategies: PartnershipStrategy[];
  /** Innovation initiatives */
  innovationInitiatives: InnovationInitiative[];
  /** Strategic option evaluation */
  optionEvaluation: StrategicOptionEvaluation[];
}

/**
 * Multi-Year Projections Section (Enterprise Only)
 * Extended financial modeling and projections
 */
export interface MultiYearProjectionsSection {
  /** Projection methodology */
  methodology: ProjectionMethodology;
  /** Five-year financial projections */
  fiveYearProjections: MultiYearFinancialProjections;
  /** Key assumption analysis */
  keyAssumptions: ProjectionAssumption[];
  /** Sensitivity analysis */
  sensitivityAnalysis: ProjectionSensitivityAnalysis;
  /** Performance scenarios */
  performanceScenarios: PerformanceScenario[];
  /** Investment requirements over time */
  investmentRequirements: InvestmentRequirement[];
}

/**
 * Appendices Section
 * Supporting documentation and detailed data
 */
export interface AppendicesSection {
  /** Detailed financial statements */
  financialStatements: DetailedFinancialStatements;
  /** Methodology documentation */
  methodologyDocumentation: MethodologyDocumentation;
  /** Data sources and references */
  dataSources: DataSource[];
  /** Glossary of terms */
  glossary: GlossaryEntry[];
  /** Additional charts and tables */
  additionalVisualizations: AdditionalVisualization[];
  /** Technical assumptions */
  technicalAssumptions: TechnicalAssumption[];
}

/**
 * Chart Configuration
 * Visualization settings and data mapping
 */
export interface ChartConfiguration {
  /** Chart identifier */
  id: string;
  /** Chart title */
  title: string;
  /** Chart type */
  type: ChartType;
  /** Data source mapping */
  dataSource: ChartDataSource;
  /** Chart styling options */
  styling: ChartStyling;
  /** Axis configurations */
  axes: AxisConfiguration[];
  /** Series configurations */
  series: SeriesConfiguration[];
  /** Interactive features */
  interactions: ChartInteraction[];
  /** Export options */
  exportOptions: ChartExportOptions;
}

/**
 * Chart Data Source
 * Data mapping for chart generation
 */
export interface ChartDataSource {
  /** Source type */
  type: 'evaluation_data' | 'calculated' | 'external' | 'scenario';
  /** Data path in source object */
  path: string;
  /** Data transformation rules */
  transformations: DataTransformation[];
  /** Filtering criteria */
  filters: DataFilter[];
  /** Aggregation rules */
  aggregation?: DataAggregation;
  /** Time period for data */
  timePeriod?: TimeHorizon;
}

/**
 * Chart Styling Configuration
 * Visual appearance and theming
 */
export interface ChartStyling {
  /** Color palette */
  colors: ColorPalette;
  /** Font configurations */
  fonts: FontConfiguration;
  /** Spacing and layout */
  layout: LayoutConfiguration;
  /** Border and line styles */
  borders: BorderConfiguration;
  /** Background settings */
  background: BackgroundConfiguration;
  /** Animation settings */
  animations: AnimationConfiguration;
}

/**
 * Report Styling Configuration
 * Overall report appearance and branding
 */
export interface ReportStyling {
  /** Color scheme */
  colorScheme: ColorScheme;
  /** Typography settings */
  typography: TypographyConfiguration;
  /** Page layout settings */
  pageLayout: PageLayoutConfiguration;
  /** Header and footer configuration */
  headerFooter: HeaderFooterConfiguration;
  /** Branding elements */
  branding: BrandingConfiguration;
  /** Custom CSS overrides */
  customStyles?: string;
}

/**
 * Report Delivery Configuration
 * Export and distribution settings
 */
export interface ReportDelivery {
  /** Delivery method */
  method: 'download' | 'email' | 'api' | 'storage';
  /** Email configuration if applicable */
  emailConfig?: EmailDeliveryConfig;
  /** Storage configuration if applicable */
  storageConfig?: StorageDeliveryConfig;
  /** Encryption settings */
  encryption: EncryptionConfig;
  /** Access control settings */
  accessControl: AccessControlConfig;
  /** Retention policy */
  retentionPolicy: RetentionPolicy;
}

/**
 * Template Customization Options
 * Available customization for report templates
 */
export interface TemplateCustomization {
  /** Customization identifier */
  id: string;
  /** Customization name */
  name: string;
  /** Customization type */
  type: 'section_toggle' | 'styling' | 'data_filter' | 'chart_type' | 'content_depth';
  /** Available options */
  options: CustomizationOption[];
  /** Default value */
  defaultValue: any;
  /** Dependencies on other customizations */
  dependencies?: CustomizationDependency[];
}

/**
 * Data Source Mapping
 * Mapping between report sections and data sources
 */
export interface DataSourceMapping {
  /** Data source identifier */
  sourceId: string;
  /** Source type */
  sourceType: 'business_evaluation' | 'enterprise_data' | 'ai_analysis' | 'external_api';
  /** Field mappings */
  fieldMappings: FieldMapping[];
  /** Required vs optional data */
  required: boolean;
  /** Fallback values if data unavailable */
  fallbacks?: Record<string, any>;
}

/**
 * Data Mapping Configuration
 * Detailed field-level data mapping
 */
export interface DataMapping {
  /** Source field path */
  sourcePath: string;
  /** Target field in report */
  targetField: string;
  /** Data transformation function */
  transformation?: DataTransformationType;
  /** Formatting options */
  formatting?: DataFormatting;
  /** Validation rules */
  validation?: ValidationRule[];
}

/**
 * Conditional Rendering Rules
 * Logic for dynamic content inclusion
 */
export interface ConditionalRule {
  /** Rule identifier */
  id: string;
  /** Condition expression */
  condition: string;
  /** Action when condition is true */
  action: 'include' | 'exclude' | 'modify' | 'replace';
  /** Parameters for the action */
  parameters?: Record<string, any>;
  /** Priority for rule evaluation */
  priority: number;
}

// Supporting Type Definitions

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface GenerationPerformance {
  startTime: Date;
  endTime: Date;
  durationMs: number;
  memoryUsage: number;
  tokensGenerated: number;
  pagesGenerated: number;
}

export interface CompanyInfo {
  name: string;
  industry: string;
  location: string;
  establishedYear?: number;
  website?: string;
  description?: string;
}

export interface ReportDetails {
  reportType: string;
  analysisDate: Date;
  reportNumber: string;
  version: string;
  preparerId: string;
  reviewerId?: string;
}

export interface BrandingElements {
  logo?: string;
  companyName?: string;
  colors: ColorScheme;
  fonts: FontConfiguration;
  watermark?: string;
}

export interface PageStyling {
  backgroundColor: string;
  backgroundImage?: string;
  margins: MarginConfiguration;
  orientation: 'portrait' | 'landscape';
}

export interface KeyFinding {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'financial' | 'operational' | 'strategic' | 'risk';
  confidence: number;
  supportingData: string[];
}

export interface ExecutiveSummaryRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  expectedImpact: string;
  investmentRequired: string;
}

export interface FinancialHighlight {
  metric: string;
  value: number;
  unit: string;
  trend: 'positive' | 'negative' | 'stable';
  comparison?: string;
  significance: string;
}

export interface ValuationHighlight {
  primaryValuation: number;
  valuationRange: { min: number; max: number };
  methodology: string;
  confidence: number;
  keyDrivers: string[];
}

export interface RiskSummary {
  overallRiskRating: 'low' | 'medium' | 'high' | 'critical';
  keyRisks: string[];
  mitigationStatus: 'strong' | 'adequate' | 'weak';
  riskTrend: 'improving' | 'stable' | 'deteriorating';
}

export interface InvestmentThesis {
  summary: string;
  keyStrengths: string[];
  valueDrivers: string[];
  competitiveAdvantages: string[];
  investmentRationale: string;
}

export interface StrategicPriority {
  priority: string;
  description: string;
  timeline: string;
  investmentRequired: string;
  expectedReturn: string;
}

// Chart and Visualization Types

export interface AxisConfiguration {
  id: string;
  type: 'x' | 'y' | 'secondary_y';
  label: string;
  scale: 'linear' | 'logarithmic' | 'category' | 'time';
  range?: { min: number; max: number };
  format: string;
}

export interface SeriesConfiguration {
  id: string;
  name: string;
  type: ChartType;
  dataPath: string;
  styling: SeriesStyling;
  yAxis: string;
}

export interface ChartInteraction {
  type: 'hover' | 'click' | 'zoom' | 'drill_down';
  enabled: boolean;
  configuration: Record<string, any>;
}

export interface ChartExportOptions {
  formats: ('png' | 'svg' | 'pdf' | 'csv')[];
  resolution: number;
  includeData: boolean;
}

export interface DataTransformation {
  type: DataTransformationType;
  parameters: Record<string, any>;
}

export type DataTransformationType =
  | 'aggregate'
  | 'filter'
  | 'sort'
  | 'format'
  | 'calculate'
  | 'normalize'
  | 'interpolate';

export interface DataFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'between';
  value: any;
}

export interface DataAggregation {
  groupBy: string[];
  aggregations: { field: string; function: 'sum' | 'avg' | 'min' | 'max' | 'count' }[];
}

// Styling Types

export interface ColorPalette {
  primary: string[];
  secondary: string[];
  accent: string[];
  neutral: string[];
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  muted: string;
}

export interface FontConfiguration {
  headings: FontStyle;
  body: FontStyle;
  captions: FontStyle;
  monospace: FontStyle;
}

export interface FontStyle {
  family: string;
  size: number;
  weight: number;
  lineHeight: number;
  color?: string;
}

export interface LayoutConfiguration {
  padding: number;
  margin: number;
  spacing: number;
  alignment: 'left' | 'center' | 'right' | 'justify';
}

export interface BorderConfiguration {
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
  color: string;
  radius: number;
}

export interface BackgroundConfiguration {
  color: string;
  image?: string;
  opacity: number;
  repeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
}

export interface AnimationConfiguration {
  enabled: boolean;
  duration: number;
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  delay: number;
}

export interface TypographyConfiguration {
  fonts: FontConfiguration;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  textAlign: 'left' | 'center' | 'right' | 'justify';
}

export interface PageLayoutConfiguration {
  pageSize: 'A4' | 'letter' | 'legal' | 'A3';
  orientation: 'portrait' | 'landscape';
  margins: MarginConfiguration;
  columns: number;
  columnGap: number;
}

export interface MarginConfiguration {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface HeaderFooterConfiguration {
  header: HeaderFooterContent;
  footer: HeaderFooterContent;
}

export interface HeaderFooterContent {
  enabled: boolean;
  content: string;
  height: number;
  styling: PageStyling;
}

export interface BrandingConfiguration {
  logo: LogoConfiguration;
  companyName: string;
  tagline?: string;
  colors: ColorScheme;
  fonts: FontConfiguration;
}

export interface LogoConfiguration {
  url: string;
  width: number;
  height: number;
  position: 'left' | 'center' | 'right';
}

export interface SeriesStyling {
  color: string;
  lineWidth: number;
  markerSize: number;
  markerStyle: 'circle' | 'square' | 'triangle' | 'diamond';
  fill: boolean;
  fillOpacity: number;
}

// Delivery and Security Types

export interface EmailDeliveryConfig {
  recipients: string[];
  subject: string;
  body: string;
  attachmentName: string;
}

export interface StorageDeliveryConfig {
  provider: 'aws_s3' | 'azure_blob' | 'google_cloud' | 'local';
  bucket: string;
  path: string;
  publicAccess: boolean;
}

export interface EncryptionConfig {
  enabled: boolean;
  algorithm: 'AES-256' | 'RSA-2048';
  keyId: string;
}

export interface AccessControlConfig {
  visibility: 'private' | 'internal' | 'public';
  allowedUsers: string[];
  expirationDate?: Date;
  passwordProtected: boolean;
}

export interface RetentionPolicy {
  retentionPeriod: number; // days
  autoDelete: boolean;
  archiveAfter: number; // days
}

// Customization Types

export interface CustomizationOption {
  value: any;
  label: string;
  description?: string;
  preview?: string;
}

export interface CustomizationDependency {
  customizationId: string;
  requiredValue: any;
  effect: 'enable' | 'disable' | 'show' | 'hide';
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: DataTransformationType;
  required: boolean;
}

export interface DataFormatting {
  type: 'currency' | 'percentage' | 'number' | 'date' | 'text';
  precision?: number;
  locale?: string;
  prefix?: string;
  suffix?: string;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value: any;
  message: string;
}

/**
 * Recommendation Types
 * Structured recommendation data for reports
 */
export interface InvestmentRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'growth' | 'efficiency' | 'risk_mitigation' | 'strategic' | 'financial';
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  investmentRequired: InvestmentRequirement;
  expectedOutcome: ExpectedOutcome;
  riskAssessment: RecommendationRiskAssessment;
  implementation: ImplementationPlan;
  successMetrics: SuccessMetric[];
}

export interface InvestmentRequirement {
  total: number;
  breakdown: InvestmentBreakdown[];
  timeline: InvestmentTimeline[];
  fundingSources: FundingSource[];
}

export interface InvestmentBreakdown {
  category: string;
  amount: number;
  description: string;
  timing: string;
}

export interface InvestmentTimeline {
  phase: string;
  amount: number;
  startDate: Date;
  endDate: Date;
}

export interface FundingSource {
  source: 'internal_cash' | 'debt' | 'equity' | 'grants' | 'partnerships';
  amount: number;
  cost: number;
  terms: string;
}

export interface ExpectedOutcome {
  financial: FinancialOutcome;
  operational: OperationalOutcome;
  strategic: StrategicOutcome;
  timeline: OutcomeTimeline[];
}

export interface FinancialOutcome {
  revenueImpact: number;
  costSavings: number;
  profitabilityImprovement: number;
  roi: number;
  paybackPeriod: number;
  npv: number;
}

export interface OperationalOutcome {
  efficiencyGains: number;
  qualityImprovements: string[];
  capacityIncrease: number;
  processImprovements: string[];
}

export interface StrategicOutcome {
  competitiveAdvantage: string[];
  marketPosition: string;
  riskReduction: string[];
  capabilityEnhancement: string[];
}

export interface OutcomeTimeline {
  milestone: string;
  targetDate: Date;
  metrics: Record<string, number>;
  dependencies: string[];
}

export interface RecommendationRiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  risks: RecommendationRisk[];
  mitigationStrategies: MitigationStrategy[];
}

export interface RecommendationRisk {
  type: string;
  description: string;
  probability: number;
  impact: number;
  severity: 'low' | 'medium' | 'high';
}

export interface MitigationStrategy {
  risk: string;
  strategy: string;
  cost: number;
  effectiveness: number;
}

export interface ImplementationPlan {
  phases: ImplementationPhase[];
  resources: ResourceRequirement[];
  timeline: ImplementationTimeline;
  dependencies: string[];
  criticalPath: string[];
}

export interface ImplementationPhase {
  phase: string;
  description: string;
  duration: number;
  resources: string[];
  deliverables: string[];
  successCriteria: string[];
}

export interface ResourceRequirement {
  type: 'human' | 'financial' | 'technology' | 'infrastructure';
  description: string;
  quantity: number;
  cost: number;
  timeline: string;
}

export interface ImplementationTimeline {
  totalDuration: number;
  phases: PhaseTimeline[];
  milestones: MilestoneTimeline[];
}

export interface PhaseTimeline {
  phase: string;
  startDate: Date;
  endDate: Date;
  duration: number;
}

export interface MilestoneTimeline {
  milestone: string;
  targetDate: Date;
  description: string;
  dependencies: string[];
}

export interface SuccessMetric {
  name: string;
  description: string;
  baseline: number;
  target: number;
  unit: string;
  measurementFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  owner: string;
}

/**
 * Scenario Modeling Types
 * Advanced scenario analysis for Enterprise tier
 */
export interface ScenarioModel {
  id: string;
  name: string;
  description: string;
  probability: number;
  assumptions: ScenarioAssumption[];
  projections: ScenarioProjection[];
  outcomes: ScenarioOutcome[];
  risks: ScenarioRisk[];
  valueDrivers: ValueDriver[];
}

export interface ScenarioAssumption {
  parameter: string;
  value: number;
  unit: string;
  rationale: string;
  confidence: number;
  sensitivity: 'high' | 'medium' | 'low';
}

export interface ScenarioProjection {
  year: number;
  revenue: number;
  costs: number;
  ebitda: number;
  cashFlow: number;
  capex: number;
  workingCapital: number;
}

export interface ScenarioOutcome {
  metric: string;
  value: number;
  unit: string;
  comparison: ScenarioComparison;
  confidence: number;
}

export interface ScenarioComparison {
  baseline: number;
  variance: number;
  variancePercentage: number;
  significance: 'material' | 'moderate' | 'minimal';
}

export interface ScenarioRisk {
  risk: string;
  probability: number;
  impact: number;
  mitigation: string;
  residualRisk: number;
}

export interface ValueDriver {
  driver: string;
  importance: number;
  current: number;
  target: number;
  impact: number;
}

export interface ScenarioVariable {
  name: string;
  description: string;
  baseValue: number;
  range: { min: number; max: number };
  distribution: 'normal' | 'uniform' | 'triangular' | 'beta';
  correlation: VariableCorrelation[];
}

export interface VariableCorrelation {
  variable: string;
  correlation: number;
  description: string;
}

/**
 * Valuation Analysis Types
 * Comprehensive valuation methodology and results
 */
export interface ValuationMethodology {
  approachesUsed: string[];
  primaryApproach: string;
  rationale: string;
  limitations: string[];
  assumptions: ValuationAssumption[];
}

export interface ValuationApproach {
  name: string;
  methodology: string;
  value: number;
  weight: number;
  confidence: number;
  assumptions: string[];
  limitations: string[];
  calculations: ValuationCalculation[];
}

export interface ValuationAssumption {
  assumption: string;
  value: any;
  rationale: string;
  sensitivity: 'high' | 'medium' | 'low';
  source: string;
}

export interface ValuationCalculation {
  step: string;
  formula: string;
  inputs: Record<string, number>;
  result: number;
  explanation: string;
}

export interface ValuationReconciliation {
  weightedValue: number;
  range: { min: number; max: number };
  confidence: number;
  reconciliationFactors: ReconciliationFactor[];
  finalAdjustments: ValuationAdjustment[];
}

export interface ReconciliationFactor {
  factor: string;
  adjustment: number;
  rationale: string;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface ValuationAdjustment {
  type: 'control_premium' | 'marketability_discount' | 'key_person_discount' | 'size_discount';
  percentage: number;
  amount: number;
  rationale: string;
}

export interface SensitivityAnalysis {
  baseCase: number;
  variables: SensitivityVariable[];
  scenarios: SensitivityScenario[];
  tornado: TornadoAnalysis[];
}

export interface SensitivityVariable {
  variable: string;
  baseValue: number;
  range: { min: number; max: number };
  impact: { min: number; max: number };
}

export interface SensitivityScenario {
  name: string;
  variables: Record<string, number>;
  result: number;
  variance: number;
}

export interface TornadoAnalysis {
  variable: string;
  lowImpact: number;
  highImpact: number;
  range: number;
}

/**
 * Report Template Types
 * Pre-defined templates for different use cases
 */
export interface ReportTemplateLibrary {
  professional: ProfessionalTemplate[];
  enterprise: EnterpriseTemplate[];
}

export interface ProfessionalTemplate {
  id: string;
  name: string;
  description: string;
  useCase: string;
  sections: ReportSectionType[];
  estimatedTime: number;
  complexity: 'basic' | 'standard' | 'comprehensive';
}

export interface EnterpriseTemplate extends ProfessionalTemplate {
  scenarioTypes: string[];
  projectionHorizon: number;
  advancedFeatures: string[];
}

/**
 * Export utility types for external consumption
 */
export type ReportConfigSummary = Pick<ReportGenerationConfig, 'id' | 'tier' | 'format' | 'template' | 'createdAt'>;
export type ReportMetadataSummary = Pick<ReportMetadata, 'reportId' | 'title' | 'companyName' | 'generatedAt' | 'status'>;
export type ChartConfigSummary = Pick<ChartConfiguration, 'id' | 'title' | 'type' | 'dataSource'>;
export type RecommendationSummary = Pick<InvestmentRecommendation, 'id' | 'title' | 'priority' | 'timeframe' | 'expectedOutcome'>;
export type ScenarioSummary = Pick<ScenarioModel, 'id' | 'name' | 'probability' | 'outcomes'>;

/**
 * Type guards for runtime type checking
 */
export const isEnterpriseReport = (report: ProfessionalReportStructure | EnterpriseReportStructure): report is EnterpriseReportStructure => {
  return 'scenarioAnalysis' in report && 'exitStrategy' in report && 'capitalStructure' in report;
};

export const isProfessionalTier = (config: ReportGenerationConfig): boolean => {
  return config.tier === 'professional';
};

export const isEnterpriseTier = (config: ReportGenerationConfig): boolean => {
  return config.tier === 'enterprise';
};