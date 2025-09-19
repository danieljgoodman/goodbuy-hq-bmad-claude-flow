/**
 * Sophisticated Template Engine for Dynamic Report Content Generation
 *
 * This template engine provides comprehensive support for Professional and Enterprise
 * tier report templates with dynamic content generation, conditional sections,
 * data binding, validation, and nested template support.
 *
 * Features:
 * - Professional and Enterprise tier template support
 * - Dynamic content population and data binding
 * - Conditional sections and partial includes
 * - Template validation and error handling
 * - Nested templates and composition
 * - Integration with enhanced-report-generator.ts
 * - Custom template language with Handlebars-like syntax
 */

import {
  ReportTemplate,
  ReportSectionConfig,
  ReportSectionType,
  ReportTier,
  ProfessionalReportStructure,
  EnterpriseReportStructure,
  DataMapping,
  ConditionalRule,
  ReportStyling,
  ChartConfiguration,
  isEnterpriseReport
} from '@/types/enhanced-reports';
import { BusinessEvaluation } from '@/types/valuation';
import { EnterpriseTierData } from '@/types/enterprise-evaluation';
import { AnalysisResult } from '@/types/ai-analysis';

// Template Engine Types

export interface TemplateContext {
  businessEvaluation: BusinessEvaluation;
  enterpriseData?: EnterpriseTierData;
  analysisResults?: AnalysisResult[];
  metadata: TemplateMetadata;
  styling: ReportStyling;
  tier: ReportTier;
  customData?: Record<string, any>;
}

export interface TemplateMetadata {
  reportId: string;
  companyName: string;
  generatedAt: Date;
  generatedBy: string;
  version: string;
  title: string;
  subtitle?: string;
}

export interface CompiledTemplate {
  id: string;
  name: string;
  tier: ReportTier;
  sections: CompiledSection[];
  metadata: TemplateCompilationMetadata;
  renderFunction: (context: TemplateContext) => Promise<RenderedTemplate>;
}

export interface CompiledSection {
  id: string;
  title: string;
  type: ReportSectionType;
  order: number;
  required: boolean;
  conditionalRules: ConditionalRule[];
  template: string;
  partials: CompiledPartial[];
  visualizations: ChartConfiguration[];
  renderFunction: (context: TemplateContext) => Promise<string>;
}

export interface CompiledPartial {
  id: string;
  name: string;
  template: string;
  dataMapping: DataMapping[];
  renderFunction: (context: TemplateContext, data?: any) => string;
}

export interface TemplateCompilationMetadata {
  compiledAt: Date;
  version: string;
  dependencies: string[];
  estimatedRenderTime: number;
  performance: TemplatePerformanceProfile;
}

export interface TemplatePerformanceProfile {
  complexity: 'low' | 'medium' | 'high' | 'extreme';
  estimatedMemoryUsage: number;
  estimatedRenderTime: number;
  cacheable: boolean;
  parallelizable: boolean;
}

export interface RenderedTemplate {
  content: string;
  sections: RenderedSection[];
  metadata: RenderMetadata;
  performance: RenderPerformance;
}

export interface RenderedSection {
  id: string;
  title: string;
  content: string;
  included: boolean;
  renderTime: number;
  visualizations: RenderedVisualization[];
}

export interface RenderedVisualization {
  id: string;
  title: string;
  type: string;
  content: string;
  dataUrl?: string;
  renderTime: number;
}

export interface RenderMetadata {
  templateId: string;
  templateVersion: string;
  renderedAt: Date;
  tier: ReportTier;
  totalSections: number;
  includedSections: number;
  excludedSections: string[];
  variables: Record<string, any>;
}

export interface RenderPerformance {
  startTime: Date;
  endTime: Date;
  totalRenderTime: number;
  sectionRenderTimes: Record<string, number>;
  memoryUsage: NodeJS.MemoryUsage;
  cacheHits: number;
  cacheMisses: number;
}

// Template Engine Errors

export class TemplateEngineError extends Error {
  constructor(
    message: string,
    public code: string,
    public templateId?: string,
    public sectionId?: string,
    public context?: any
  ) {
    super(message);
    this.name = 'TemplateEngineError';
  }
}

export class TemplateCompilationError extends TemplateEngineError {
  constructor(message: string, templateId: string, context?: any) {
    super(message, 'COMPILATION_ERROR', templateId, undefined, context);
    this.name = 'TemplateCompilationError';
  }
}

export class TemplateRenderError extends TemplateEngineError {
  constructor(message: string, templateId: string, sectionId?: string, context?: any) {
    super(message, 'RENDER_ERROR', templateId, sectionId, context);
    this.name = 'TemplateRenderError';
  }
}

export class TemplateValidationError extends TemplateEngineError {
  constructor(message: string, templateId: string, context?: any) {
    super(message, 'VALIDATION_ERROR', templateId, undefined, context);
    this.name = 'TemplateValidationError';
  }
}

// Template Engine Cache

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

class TemplateCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 1000;
  private defaultTTL = 30 * 60 * 1000; // 30 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    this.evictExpired();

    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      accessCount: 0,
      lastAccessed: Date.now()
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    entry.accessCount++;
    entry.lastAccessed = Date.now();
    return entry.data as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate(),
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private evictLRU(): void {
    let lruKey = '';
    let lruTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  private calculateHitRate(): number {
    const entries = Array.from(this.cache.values());
    if (entries.length === 0) return 0;

    const totalAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    return totalAccess / entries.length;
  }

  private estimateMemoryUsage(): number {
    // Rough estimation in bytes
    return this.cache.size * 1024; // Assume ~1KB per entry
  }
}

/**
 * Sophisticated Template Engine Class
 *
 * Provides comprehensive template processing with:
 * - Dynamic content generation and data binding
 * - Conditional sections and business logic
 * - Professional and Enterprise tier support
 * - Template composition and partial includes
 * - Advanced caching and performance optimization
 * - Comprehensive error handling and validation
 */
export class TemplateEngine {
  private static instance: TemplateEngine;
  private cache = new TemplateCache();
  private templates = new Map<string, CompiledTemplate>();
  private partials = new Map<string, CompiledPartial>();
  private helpers = new Map<string, Function>();

  // Performance tracking
  private performance = {
    totalCompilations: 0,
    totalRenders: 0,
    averageCompileTime: 0,
    averageRenderTime: 0,
    cacheHitRate: 0,
    lastOptimization: new Date()
  };

  // Built-in tier-specific templates
  private static readonly PROFESSIONAL_TEMPLATES: Partial<Record<ReportSectionType, string>> = {
    cover_page: `
      <div class="cover-page">
        <div class="header">
          {{#if branding.logo}}
            <img src="{{branding.logo.url}}" alt="Logo" class="logo" />
          {{/if}}
          <div class="company-info">
            <h1 class="company-name">{{metadata.companyName}}</h1>
            <p class="industry">{{businessEvaluation.industry}}</p>
          </div>
        </div>

        <div class="title-section">
          <h2 class="report-title">{{metadata.title}}</h2>
          {{#if metadata.subtitle}}
            <h3 class="report-subtitle">{{metadata.subtitle}}</h3>
          {{/if}}
        </div>

        <div class="report-details">
          <p class="date">Generated: {{formatDate metadata.generatedAt}}</p>
          <p class="version">Version: {{metadata.version}}</p>
          <p class="id">Report ID: {{metadata.reportId}}</p>
        </div>

        <div class="confidentiality">
          <p>CONFIDENTIAL & PROPRIETARY</p>
          <p>This report contains confidential and proprietary information.</p>
        </div>
      </div>
    `,

    executive_summary: `
      <section class="executive-summary">
        <h2>Executive Summary</h2>

        <div class="key-findings">
          <h3>Key Findings</h3>
          {{#each executiveSummary.keyFindings}}
            <div class="finding finding-{{impact}}">
              <h4>{{title}}</h4>
              <p>{{description}}</p>
              <div class="confidence">Confidence: {{confidence}}%</div>
            </div>
          {{/each}}
        </div>

        <div class="financial-highlights">
          <h3>Financial Highlights</h3>
          <div class="metrics-grid">
            {{#each executiveSummary.financialHighlights}}
              <div class="metric metric-{{trend}}">
                <span class="value">{{formatCurrency value unit}}</span>
                <span class="label">{{metric}}</span>
                {{#if comparison}}
                  <span class="comparison">{{comparison}}</span>
                {{/if}}
              </div>
            {{/each}}
          </div>
        </div>

        <div class="valuation-highlight">
          <h3>Valuation Summary</h3>
          <div class="valuation-box">
            <div class="primary-value">
              {{formatCurrency executiveSummary.valuationHighlight.primaryValuation}}
            </div>
            <div class="range">
              Range: {{formatCurrency executiveSummary.valuationHighlight.valuationRange.min}} -
              {{formatCurrency executiveSummary.valuationHighlight.valuationRange.max}}
            </div>
            <div class="methodology">{{executiveSummary.valuationHighlight.methodology}}</div>
            <div class="confidence">Confidence: {{executiveSummary.valuationHighlight.confidence}}%</div>
          </div>
        </div>

        <div class="primary-recommendations">
          <h3>Primary Recommendations</h3>
          {{#each executiveSummary.primaryRecommendations}}
            <div class="recommendation priority-{{priority}}">
              <h4>{{title}}</h4>
              <p>{{description}}</p>
              <div class="meta">
                <span class="timeframe">{{timeframe}}</span>
                <span class="investment">{{investmentRequired}}</span>
              </div>
            </div>
          {{/each}}
        </div>

        <div class="investment-thesis">
          <h3>Investment Thesis</h3>
          <p class="thesis-summary">{{executiveSummary.investmentThesis.summary}}</p>

          <div class="thesis-details">
            <div class="strengths">
              <h4>Key Strengths</h4>
              <ul>
                {{#each executiveSummary.investmentThesis.keyStrengths}}
                  <li>{{this}}</li>
                {{/each}}
              </ul>
            </div>

            <div class="value-drivers">
              <h4>Value Drivers</h4>
              <ul>
                {{#each executiveSummary.investmentThesis.valueDrivers}}
                  <li>{{this}}</li>
                {{/each}}
              </ul>
            </div>
          </div>
        </div>
      </section>
    `,

    financial_analysis: `
      <section class="financial-analysis">
        <h2>Financial Analysis</h2>

        <div class="historical-performance">
          <h3>Historical Performance</h3>
          {{> financial_trend_chart data=financialAnalysis.historicalPerformance}}

          <div class="performance-summary">
            <p>{{financialAnalysis.historicalPerformance.summary}}</p>
          </div>
        </div>

        <div class="profitability-analysis">
          <h3>Profitability Analysis</h3>
          {{> profitability_metrics data=financialAnalysis.profitabilityAnalysis}}
        </div>

        <div class="cash-flow-analysis">
          <h3>Cash Flow Analysis</h3>
          {{> cashflow_chart data=financialAnalysis.cashFlowAnalysis}}

          <div class="cash-flow-insights">
            {{#each financialAnalysis.cashFlowAnalysis.insights}}
              <div class="insight">
                <h4>{{title}}</h4>
                <p>{{description}}</p>
              </div>
            {{/each}}
          </div>
        </div>

        <div class="financial-ratios">
          <h3>Key Financial Ratios</h3>
          {{> ratio_table data=financialAnalysis.financialRatios}}
        </div>
      </section>
    `
  };

  private static readonly ENTERPRISE_TEMPLATES: Partial<Record<ReportSectionType, string>> = {
    scenario_analysis: `
      <section class="scenario-analysis">
        <h2>Scenario Analysis</h2>

        <div class="scenario-overview">
          <h3>Scenario Overview</h3>
          <p>{{scenarioAnalysis.scenarioOverview.methodology}}</p>
        </div>

        <div class="scenarios-grid">
          <div class="scenario base-case">
            <h4>Base Case ({{scenarioAnalysis.baseCase.probability}}%)</h4>
            {{> scenario_model data=scenarioAnalysis.baseCase}}
          </div>

          <div class="scenario optimistic-case">
            <h4>Optimistic Case ({{scenarioAnalysis.optimisticCase.probability}}%)</h4>
            {{> scenario_model data=scenarioAnalysis.optimisticCase}}
          </div>

          <div class="scenario conservative-case">
            <h4>Conservative Case ({{scenarioAnalysis.conservativeCase.probability}}%)</h4>
            {{> scenario_model data=scenarioAnalysis.conservativeCase}}
          </div>
        </div>

        {{#if scenarioAnalysis.customScenarios}}
          <div class="custom-scenarios">
            <h3>Custom Scenarios</h3>
            {{#each scenarioAnalysis.customScenarios}}
              <div class="scenario custom-scenario">
                <h4>{{name}} ({{probability}}%)</h4>
                {{> scenario_model data=this}}
              </div>
            {{/each}}
          </div>
        {{/if}}

        <div class="comparison-analysis">
          <h3>Scenario Comparison</h3>
          {{> scenario_comparison_chart data=scenarioAnalysis.comparisonAnalysis}}
        </div>

        <div class="key-variables">
          <h3>Key Variables & Sensitivity</h3>
          {{> sensitivity_analysis data=scenarioAnalysis.keyVariables}}
        </div>
      </section>
    `,

    exit_strategy: `
      <section class="exit-strategy">
        <h2>Exit Strategy Analysis</h2>

        <div class="strategy-overview">
          <h3>Exit Strategy Overview</h3>
          <p>{{exitStrategy.strategyOverview.summary}}</p>
        </div>

        <div class="exit-options">
          <h3>Available Exit Options</h3>
          {{#each exitStrategy.exitOptions}}
            <div class="exit-option">
              <h4>{{type}}</h4>
              <div class="option-details">
                <p><strong>Description:</strong> {{description}}</p>
                <p><strong>Timeline:</strong> {{timeline}}</p>
                <p><strong>Valuation Range:</strong> {{formatCurrency valuationRange.min}} - {{formatCurrency valuationRange.max}}</p>
                <p><strong>Probability:</strong> {{probability}}%</p>
              </div>

              <div class="pros-cons">
                <div class="pros">
                  <h5>Advantages</h5>
                  <ul>
                    {{#each advantages}}
                      <li>{{this}}</li>
                    {{/each}}
                  </ul>
                </div>

                <div class="cons">
                  <h5>Considerations</h5>
                  <ul>
                    {{#each considerations}}
                      <li>{{this}}</li>
                    {{/each}}
                  </ul>
                </div>
              </div>
            </div>
          {{/each}}
        </div>

        <div class="timeline-analysis">
          <h3>Exit Timeline Analysis</h3>
          {{> exit_timeline_chart data=exitStrategy.timelineAnalysis}}
        </div>

        <div class="value-maximization">
          <h3>Value Maximization Strategies</h3>
          {{#each exitStrategy.valueMaximization}}
            <div class="strategy">
              <h4>{{title}}</h4>
              <p>{{description}}</p>
              <div class="impact">
                <span>Potential Value Impact: {{formatPercentage potentialImpact}}</span>
                <span>Implementation Time: {{implementationTime}}</span>
              </div>
            </div>
          {{/each}}
        </div>

        <div class="transaction-readiness">
          <h3>Transaction Readiness Assessment</h3>
          {{> readiness_scorecard data=exitStrategy.transactionReadiness}}
        </div>
      </section>
    `,

    multi_year_projections: `
      <section class="multi-year-projections">
        <h2>Multi-Year Financial Projections</h2>

        <div class="projection-methodology">
          <h3>Methodology</h3>
          <p>{{multiYearProjections.methodology.description}}</p>

          <div class="key-assumptions">
            <h4>Key Assumptions</h4>
            {{#each multiYearProjections.keyAssumptions}}
              <div class="assumption">
                <strong>{{parameter}}:</strong> {{value}} {{unit}}
                <p class="rationale">{{rationale}}</p>
              </div>
            {{/each}}
          </div>
        </div>

        <div class="five-year-projections">
          <h3>Five-Year Financial Projections</h3>
          {{> projection_table data=multiYearProjections.fiveYearProjections}}
          {{> projection_charts data=multiYearProjections.fiveYearProjections}}
        </div>

        <div class="performance-scenarios">
          <h3>Performance Scenarios</h3>
          {{#each multiYearProjections.performanceScenarios}}
            <div class="scenario">
              <h4>{{name}}</h4>
              <p>{{description}}</p>
              {{> scenario_projection_chart data=this.projections}}
            </div>
          {{/each}}
        </div>

        <div class="investment-requirements">
          <h3>Investment Requirements Over Time</h3>
          {{> investment_timeline_chart data=multiYearProjections.investmentRequirements}}

          <div class="investment-details">
            {{#each multiYearProjections.investmentRequirements}}
              <div class="investment-period">
                <h4>{{period}}</h4>
                <p><strong>Total Investment:</strong> {{formatCurrency totalAmount}}</p>
                <div class="breakdown">
                  {{#each breakdown}}
                    <div class="item">
                      <span>{{category}}:</span>
                      <span>{{formatCurrency amount}}</span>
                    </div>
                  {{/each}}
                </div>
              </div>
            {{/each}}
          </div>
        </div>

        <div class="sensitivity-analysis">
          <h3>Sensitivity Analysis</h3>
          {{> sensitivity_tornado_chart data=multiYearProjections.sensitivityAnalysis}}
        </div>
      </section>
    `
  };

  constructor() {
    this.initializeHelpers();
    this.initializePartials();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): TemplateEngine {
    if (!TemplateEngine.instance) {
      TemplateEngine.instance = new TemplateEngine();
    }
    return TemplateEngine.instance;
  }

  /**
   * Initialize built-in template helpers
   */
  private initializeHelpers(): void {
    // Date formatting helper
    this.registerHelper('formatDate', (date: Date | string, format?: string) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (!d || isNaN(d.getTime())) return 'Invalid Date';

      const options: Intl.DateTimeFormatOptions = format ?
        this.parseDateFormat(format) :
        { year: 'numeric', month: 'long', day: 'numeric' };

      return d.toLocaleDateString('en-US', options);
    });

    // Currency formatting helper
    this.registerHelper('formatCurrency', (value: number, currency = 'USD') => {
      if (typeof value !== 'number' || isNaN(value)) return '$0';

      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    });

    // Percentage formatting helper
    this.registerHelper('formatPercentage', (value: number, decimals = 1) => {
      if (typeof value !== 'number' || isNaN(value)) return '0%';

      return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value / 100);
    });

    // Number formatting helper
    this.registerHelper('formatNumber', (value: number, decimals = 0) => {
      if (typeof value !== 'number' || isNaN(value)) return '0';

      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value);
    });

    // Conditional helper (if/else)
    this.registerHelper('if', (condition: any, options: any) => {
      if (this.isTruthy(condition)) {
        return options.fn ? options.fn(this) : '';
      } else {
        return options.inverse ? options.inverse(this) : '';
      }
    });

    // Each helper for iterations
    this.registerHelper('each', (context: any[], options: any) => {
      if (!Array.isArray(context)) return '';

      return context.map((item, index) => {
        const itemContext = { ...item, @index: index, @first: index === 0, @last: index === context.length - 1 };
        return options.fn ? options.fn(itemContext) : '';
      }).join('');
    });

    // Comparison helpers
    this.registerHelper('eq', (a: any, b: any) => a === b);
    this.registerHelper('ne', (a: any, b: any) => a !== b);
    this.registerHelper('gt', (a: any, b: any) => a > b);
    this.registerHelper('gte', (a: any, b: any) => a >= b);
    this.registerHelper('lt', (a: any, b: any) => a < b);
    this.registerHelper('lte', (a: any, b: any) => a <= b);

    // Math helpers
    this.registerHelper('add', (a: number, b: number) => (a || 0) + (b || 0));
    this.registerHelper('subtract', (a: number, b: number) => (a || 0) - (b || 0));
    this.registerHelper('multiply', (a: number, b: number) => (a || 0) * (b || 0));
    this.registerHelper('divide', (a: number, b: number) => b !== 0 ? (a || 0) / b : 0);

    // String helpers
    this.registerHelper('uppercase', (str: string) => String(str || '').toUpperCase());
    this.registerHelper('lowercase', (str: string) => String(str || '').toLowerCase());
    this.registerHelper('capitalize', (str: string) => {
      const s = String(str || '');
      return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    });
    this.registerHelper('truncate', (str: string, length: number) => {
      const s = String(str || '');
      return s.length > length ? s.substring(0, length) + '...' : s;
    });
  }

  /**
   * Initialize built-in partial templates
   */
  private initializePartials(): void {
    // Financial trend chart partial
    this.registerPartial('financial_trend_chart', `
      <div class="chart-container">
        <canvas id="financial-trend-{{@index}}" class="financial-chart"></canvas>
        <script>
          // Chart configuration will be injected here
          window.chartConfigs = window.chartConfigs || [];
          window.chartConfigs.push({
            id: 'financial-trend-{{@index}}',
            type: 'line',
            data: {{{json data}}}
          });
        </script>
      </div>
    `);

    // Profitability metrics partial
    this.registerPartial('profitability_metrics', `
      <div class="metrics-table">
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Current</th>
              <th>Previous</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {{#each data.metrics}}
              <tr class="metric-row">
                <td>{{name}}</td>
                <td>{{formatPercentage current}}</td>
                <td>{{formatPercentage previous}}</td>
                <td class="change {{#gt change 0}}positive{{else}}negative{{/gt}}">
                  {{formatPercentage change}}
                </td>
              </tr>
            {{/each}}
          </tbody>
        </table>
      </div>
    `);

    // Scenario model partial
    this.registerPartial('scenario_model', `
      <div class="scenario-model">
        <div class="scenario-description">
          <p>{{data.description}}</p>
        </div>

        <div class="scenario-assumptions">
          <h5>Key Assumptions</h5>
          <ul>
            {{#each data.assumptions}}
              <li><strong>{{parameter}}:</strong> {{value}} {{unit}} - {{rationale}}</li>
            {{/each}}
          </ul>
        </div>

        <div class="scenario-outcomes">
          <h5>Projected Outcomes</h5>
          <div class="outcomes-grid">
            {{#each data.outcomes}}
              <div class="outcome">
                <span class="metric">{{metric}}</span>
                <span class="value">{{formatCurrency value unit}}</span>
                <span class="confidence">{{confidence}}% confidence</span>
              </div>
            {{/each}}
          </div>
        </div>
      </div>
    `);

    // Ratio table partial
    this.registerPartial('ratio_table', `
      <div class="ratio-table">
        <table>
          <thead>
            <tr>
              <th>Ratio Category</th>
              <th>Metric</th>
              <th>Value</th>
              <th>Industry Avg</th>
              <th>Assessment</th>
            </tr>
          </thead>
          <tbody>
            {{#each data.categories}}
              {{#each this.ratios}}
                <tr>
                  {{#if @first}}
                    <td rowspan="{{../this.ratios.length}}">{{../this.category}}</td>
                  {{/if}}
                  <td>{{name}}</td>
                  <td>{{formatNumber value decimals}}</td>
                  <td>{{formatNumber industryAvg decimals}}</td>
                  <td class="assessment assessment-{{assessment}}">{{assessment}}</td>
                </tr>
              {{/each}}
            {{/each}}
          </tbody>
        </table>
      </div>
    `);
  }

  /**
   * Register a custom helper function
   */
  registerHelper(name: string, fn: Function): void {
    this.helpers.set(name, fn);
  }

  /**
   * Register a partial template
   */
  registerPartial(name: string, template: string): void {
    const compiled = this.compilePartial(name, template);
    this.partials.set(name, compiled);
  }

  /**
   * Compile a template from ReportTemplate configuration
   */
  async compileTemplate(template: ReportTemplate): Promise<CompiledTemplate> {
    const startTime = Date.now();

    try {
      this.validateTemplate(template);

      const cacheKey = `template:${template.id}:${template.version}`;
      const cached = this.cache.get<CompiledTemplate>(cacheKey);
      if (cached) {
        return cached;
      }

      const compiledSections = await Promise.all(
        template.sections.map(section => this.compileSection(section, template.tier))
      );

      const performanceProfile = this.analyzeTemplatePerformance(template, compiledSections);

      const compiled: CompiledTemplate = {
        id: template.id,
        name: template.name,
        tier: template.tier,
        sections: compiledSections,
        metadata: {
          compiledAt: new Date(),
          version: template.version,
          dependencies: this.extractDependencies(template),
          estimatedRenderTime: performanceProfile.estimatedRenderTime,
          performance: performanceProfile
        },
        renderFunction: this.createRenderFunction(compiledSections)
      };

      // Cache the compiled template
      this.cache.set(cacheKey, compiled, 60 * 60 * 1000); // 1 hour TTL

      this.performance.totalCompilations++;
      this.performance.averageCompileTime =
        (this.performance.averageCompileTime + (Date.now() - startTime)) / this.performance.totalCompilations;

      return compiled;
    } catch (error) {
      throw new TemplateCompilationError(
        `Failed to compile template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        template.id,
        { error, template }
      );
    }
  }

  /**
   * Render a compiled template with provided context
   */
  async renderTemplate(
    compiled: CompiledTemplate,
    context: TemplateContext
  ): Promise<RenderedTemplate> {
    const startTime = Date.now();
    const renderPerformance: RenderPerformance = {
      startTime: new Date(),
      endTime: new Date(),
      totalRenderTime: 0,
      sectionRenderTimes: {},
      memoryUsage: process.memoryUsage(),
      cacheHits: 0,
      cacheMisses: 0
    };

    try {
      this.validateContext(context, compiled.tier);

      const renderedSections = await Promise.all(
        compiled.sections.map(async (section) => {
          const sectionStartTime = Date.now();

          try {
            // Check if section should be included based on conditional rules
            const shouldInclude = this.evaluateConditionalRules(section.conditionalRules, context);

            if (!shouldInclude && !section.required) {
              return {
                id: section.id,
                title: section.title,
                content: '',
                included: false,
                renderTime: Date.now() - sectionStartTime,
                visualizations: []
              };
            }

            const content = await section.renderFunction(context);
            const visualizations = await this.renderVisualizations(section.visualizations, context);

            const sectionRenderTime = Date.now() - sectionStartTime;
            renderPerformance.sectionRenderTimes[section.id] = sectionRenderTime;

            return {
              id: section.id,
              title: section.title,
              content,
              included: true,
              renderTime: sectionRenderTime,
              visualizations
            };
          } catch (error) {
            throw new TemplateRenderError(
              `Failed to render section '${section.id}': ${error instanceof Error ? error.message : 'Unknown error'}`,
              compiled.id,
              section.id,
              { error, section, context }
            );
          }
        })
      );

      const totalContent = this.assembleContent(renderedSections, compiled);
      const endTime = Date.now();

      renderPerformance.endTime = new Date();
      renderPerformance.totalRenderTime = endTime - startTime;

      const rendered: RenderedTemplate = {
        content: totalContent,
        sections: renderedSections,
        metadata: {
          templateId: compiled.id,
          templateVersion: compiled.metadata.version,
          renderedAt: new Date(),
          tier: compiled.tier,
          totalSections: compiled.sections.length,
          includedSections: renderedSections.filter(s => s.included).length,
          excludedSections: renderedSections.filter(s => !s.included).map(s => s.id),
          variables: this.extractVariables(context)
        },
        performance: renderPerformance
      };

      this.performance.totalRenders++;
      this.performance.averageRenderTime =
        (this.performance.averageRenderTime + renderPerformance.totalRenderTime) / this.performance.totalRenders;

      return rendered;
    } catch (error) {
      if (error instanceof TemplateRenderError) {
        throw error;
      }

      throw new TemplateRenderError(
        `Failed to render template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        compiled.id,
        undefined,
        { error, context }
      );
    }
  }

  /**
   * Get a built-in template by tier and type
   */
  getBuiltInTemplate(tier: ReportTier, type: ReportSectionType): string | null {
    const templates = tier === 'enterprise' ?
      { ...TemplateEngine.PROFESSIONAL_TEMPLATES, ...TemplateEngine.ENTERPRISE_TEMPLATES } :
      TemplateEngine.PROFESSIONAL_TEMPLATES;

    return templates[type] || null;
  }

  /**
   * Create a template from built-in sections
   */
  createBuiltInTemplate(
    id: string,
    name: string,
    tier: ReportTier,
    sections: ReportSectionType[]
  ): ReportTemplate {
    const sectionConfigs: ReportSectionConfig[] = sections.map((type, index) => ({
      id: `${id}_${type}`,
      title: this.formatSectionTitle(type),
      order: index,
      required: this.isSectionRequired(type),
      type,
      dataSources: this.getDefaultDataSources(type),
      visualizations: this.getDefaultVisualizations(type),
      config: {}
    }));

    return {
      id,
      name,
      description: `Built-in ${tier} tier template`,
      tier,
      version: '1.0.0',
      sections: sectionConfigs,
      defaultStyling: this.getDefaultStyling(tier),
      customizationOptions: [],
      supportsScenarios: tier === 'enterprise',
      estimatedGenerationTime: this.estimateGenerationTime(sections, tier)
    };
  }

  /**
   * Get template performance statistics
   */
  getPerformanceStats() {
    return {
      ...this.performance,
      cacheStats: this.cache.getStats(),
      templatesCompiled: this.templates.size,
      partialsRegistered: this.partials.size,
      helpersRegistered: this.helpers.size
    };
  }

  /**
   * Clear all caches and reset performance stats
   */
  clearCaches(): void {
    this.cache.clear();
    this.templates.clear();
    this.performance = {
      totalCompilations: 0,
      totalRenders: 0,
      averageCompileTime: 0,
      averageRenderTime: 0,
      cacheHitRate: 0,
      lastOptimization: new Date()
    };
  }

  // Private helper methods

  private validateTemplate(template: ReportTemplate): void {
    if (!template.id || !template.name || !template.tier) {
      throw new TemplateValidationError('Template missing required fields', template.id);
    }

    if (!['professional', 'enterprise'].includes(template.tier)) {
      throw new TemplateValidationError('Invalid template tier', template.id);
    }

    if (!template.sections || template.sections.length === 0) {
      throw new TemplateValidationError('Template must have at least one section', template.id);
    }

    // Validate sections
    for (const section of template.sections) {
      if (!section.id || !section.title || !section.type) {
        throw new TemplateValidationError(
          `Section missing required fields: ${section.id}`,
          template.id
        );
      }
    }
  }

  private validateContext(context: TemplateContext, tier: ReportTier): void {
    if (!context.businessEvaluation) {
      throw new TemplateValidationError('Context missing business evaluation data', '');
    }

    if (tier === 'enterprise' && !context.enterpriseData) {
      throw new TemplateValidationError('Enterprise tier requires enterprise data', '');
    }

    if (!context.metadata || !context.metadata.reportId) {
      throw new TemplateValidationError('Context missing required metadata', '');
    }
  }

  private async compileSection(section: ReportSectionConfig, tier: ReportTier): Promise<CompiledSection> {
    const builtInTemplate = this.getBuiltInTemplate(tier, section.type);
    const template = builtInTemplate || `<div>{{section.title}} - Template not found</div>`;

    const partials = section.subsections?.map(sub => this.compilePartial(sub.id, '')) || [];

    const renderFunction = this.createSectionRenderFunction(template, section);

    return {
      id: section.id,
      title: section.title,
      type: section.type,
      order: section.order,
      required: section.required,
      conditionalRules: section.config?.conditionalRules || [],
      template,
      partials,
      visualizations: section.visualizations,
      renderFunction
    };
  }

  private compilePartial(name: string, template: string): CompiledPartial {
    const renderFunction = this.createPartialRenderFunction(template);

    return {
      id: name,
      name,
      template,
      dataMapping: [],
      renderFunction
    };
  }

  private createRenderFunction(sections: CompiledSection[]) {
    return async (context: TemplateContext): Promise<RenderedTemplate> => {
      return this.renderTemplate({ sections } as CompiledTemplate, context);
    };
  }

  private createSectionRenderFunction(template: string, section: ReportSectionConfig) {
    return async (context: TemplateContext): Promise<string> => {
      return this.processTemplate(template, context, section);
    };
  }

  private createPartialRenderFunction(template: string) {
    return (context: TemplateContext, data?: any): string => {
      const mergedContext = data ? { ...context, ...data } : context;
      return this.processTemplate(template, mergedContext);
    };
  }

  private processTemplate(template: string, context: TemplateContext, section?: ReportSectionConfig): string {
    let processed = template;

    // Process handlebars-style expressions
    processed = this.processExpressions(processed, context);

    // Process conditionals
    processed = this.processConditionals(processed, context);

    // Process loops
    processed = this.processLoops(processed, context);

    // Process partials
    processed = this.processPartials(processed, context);

    return processed;
  }

  private processExpressions(template: string, context: TemplateContext): string {
    // Match {{expression}} patterns
    return template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      try {
        return this.evaluateExpression(expression.trim(), context);
      } catch (error) {
        console.warn(`Failed to evaluate expression: ${expression}`, error);
        return match; // Return original if evaluation fails
      }
    });
  }

  private processConditionals(template: string, context: TemplateContext): string {
    // Match {{#if condition}}...{{/if}} patterns
    return template.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
      try {
        const isTrue = this.evaluateCondition(condition.trim(), context);
        return isTrue ? this.processTemplate(content, context) : '';
      } catch (error) {
        console.warn(`Failed to evaluate condition: ${condition}`, error);
        return '';
      }
    });
  }

  private processLoops(template: string, context: TemplateContext): string {
    // Match {{#each array}}...{{/each}} patterns
    return template.replace(/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayPath, content) => {
      try {
        const array = this.getNestedValue(context, arrayPath.trim());
        if (!Array.isArray(array)) return '';

        return array.map((item, index) => {
          const itemContext = {
            ...context,
            this: item,
            '@index': index,
            '@first': index === 0,
            '@last': index === array.length - 1
          };
          return this.processTemplate(content, itemContext);
        }).join('');
      } catch (error) {
        console.warn(`Failed to process loop: ${arrayPath}`, error);
        return '';
      }
    });
  }

  private processPartials(template: string, context: TemplateContext): string {
    // Match {{> partialName}} patterns
    return template.replace(/\{\{>\s*([^}]+)\}\}/g, (match, partialSpec) => {
      try {
        const [partialName, ...args] = partialSpec.trim().split(/\s+/);
        const partial = this.partials.get(partialName);

        if (!partial) {
          console.warn(`Partial not found: ${partialName}`);
          return match;
        }

        // Parse arguments if any
        const partialData = this.parsePartialArgs(args, context);
        return partial.renderFunction(context, partialData);
      } catch (error) {
        console.warn(`Failed to process partial: ${partialSpec}`, error);
        return match;
      }
    });
  }

  private evaluateExpression(expression: string, context: TemplateContext): string {
    // Check if it's a helper call
    const helperMatch = expression.match(/^(\w+)\s*(.*)/);
    if (helperMatch) {
      const [, helperName, argsStr] = helperMatch;
      const helper = this.helpers.get(helperName);

      if (helper) {
        const args = this.parseHelperArgs(argsStr, context);
        const result = helper(...args);
        return String(result ?? '');
      }
    }

    // Otherwise, treat as property access
    const value = this.getNestedValue(context, expression);
    return String(value ?? '');
  }

  private evaluateCondition(condition: string, context: TemplateContext): boolean {
    // Handle helper-based conditions
    const helperMatch = condition.match(/^(\w+)\s*(.*)/);
    if (helperMatch) {
      const [, helperName, argsStr] = helperMatch;
      const helper = this.helpers.get(helperName);

      if (helper) {
        const args = this.parseHelperArgs(argsStr, context);
        return this.isTruthy(helper(...args));
      }
    }

    // Handle simple property access
    const value = this.getNestedValue(context, condition);
    return this.isTruthy(value);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' ? current[key] : undefined;
    }, obj);
  }

  private parseHelperArgs(argsStr: string, context: TemplateContext): any[] {
    if (!argsStr.trim()) return [];

    // Simple argument parsing - could be enhanced for more complex cases
    return argsStr.split(/\s+/).map(arg => {
      // String literal
      if (arg.startsWith('"') && arg.endsWith('"')) {
        return arg.slice(1, -1);
      }

      // Number literal
      if (/^-?\d+(\.\d+)?$/.test(arg)) {
        return parseFloat(arg);
      }

      // Boolean literal
      if (arg === 'true') return true;
      if (arg === 'false') return false;

      // Property access
      return this.getNestedValue(context, arg);
    });
  }

  private parsePartialArgs(args: string[], context: TemplateContext): any {
    const data: any = {};

    for (const arg of args) {
      const [key, value] = arg.split('=');
      if (key && value) {
        data[key] = this.getNestedValue(context, value);
      }
    }

    return data;
  }

  private isTruthy(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value.length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return !!value;
  }

  private evaluateConditionalRules(rules: ConditionalRule[], context: TemplateContext): boolean {
    if (!rules || rules.length === 0) return true;

    // Sort by priority and evaluate
    const sortedRules = [...rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const rule of sortedRules) {
      const conditionResult = this.evaluateCondition(rule.condition, context);

      if (conditionResult) {
        return rule.action === 'include';
      }
    }

    return true; // Default to include if no rules match
  }

  private async renderVisualizations(
    visualizations: ChartConfiguration[],
    context: TemplateContext
  ): Promise<RenderedVisualization[]> {
    // This would integrate with the chart generation system
    // For now, return placeholder implementations
    return visualizations.map(viz => ({
      id: viz.id,
      title: viz.title,
      type: viz.type,
      content: `<div class="chart-placeholder" data-chart-id="${viz.id}">Chart: ${viz.title}</div>`,
      renderTime: 0
    }));
  }

  private assembleContent(sections: RenderedSection[], compiled: CompiledTemplate): string {
    const includedSections = sections
      .filter(section => section.included)
      .sort((a, b) => {
        const orderA = compiled.sections.find(s => s.id === a.id)?.order ?? 0;
        const orderB = compiled.sections.find(s => s.id === b.id)?.order ?? 0;
        return orderA - orderB;
      });

    return includedSections.map(section => section.content).join('\n\n');
  }

  private analyzeTemplatePerformance(
    template: ReportTemplate,
    sections: CompiledSection[]
  ): TemplatePerformanceProfile {
    const complexity = this.calculateComplexity(template, sections);
    const estimatedMemoryUsage = this.estimateMemoryUsage(template, sections);
    const estimatedRenderTime = this.estimateRenderTime(template, sections);

    return {
      complexity,
      estimatedMemoryUsage,
      estimatedRenderTime,
      cacheable: complexity !== 'extreme',
      parallelizable: sections.length > 1 && complexity !== 'extreme'
    };
  }

  private calculateComplexity(template: ReportTemplate, sections: CompiledSection[]): 'low' | 'medium' | 'high' | 'extreme' {
    let score = 0;

    // Base score from section count
    score += sections.length * 2;

    // Add score for visualizations
    sections.forEach(section => {
      score += section.visualizations.length * 3;
    });

    // Add score for enterprise features
    if (template.tier === 'enterprise') {
      score += 10;
    }

    // Add score for complex sections
    sections.forEach(section => {
      if (['scenario_analysis', 'multi_year_projections', 'exit_strategy'].includes(section.type)) {
        score += 5;
      }
    });

    if (score < 10) return 'low';
    if (score < 25) return 'medium';
    if (score < 50) return 'high';
    return 'extreme';
  }

  private estimateMemoryUsage(template: ReportTemplate, sections: CompiledSection[]): number {
    // Rough estimation in MB
    let usage = 5; // Base usage

    usage += sections.length * 0.5; // Per section
    usage += sections.reduce((sum, s) => sum + s.visualizations.length * 2, 0); // Per chart

    if (template.tier === 'enterprise') {
      usage *= 1.5; // Enterprise features use more memory
    }

    return Math.round(usage * 100) / 100; // Round to 2 decimal places
  }

  private estimateRenderTime(template: ReportTemplate, sections: CompiledSection[]): number {
    // Rough estimation in seconds
    let time = 1; // Base time

    time += sections.length * 0.2; // Per section
    time += sections.reduce((sum, s) => sum + s.visualizations.length * 0.5, 0); // Per chart

    if (template.tier === 'enterprise') {
      time *= 2; // Enterprise features take longer
    }

    return Math.round(time * 100) / 100; // Round to 2 decimal places
  }

  private extractDependencies(template: ReportTemplate): string[] {
    const deps = new Set<string>();

    // Add data source dependencies
    template.sections.forEach(section => {
      section.dataSources?.forEach(ds => {
        deps.add(ds.sourceType);
      });
    });

    // Add tier-specific dependencies
    if (template.tier === 'enterprise') {
      deps.add('enterprise-data');
    }

    return Array.from(deps);
  }

  private extractVariables(context: TemplateContext): Record<string, any> {
    return {
      tier: context.tier,
      companyName: context.metadata.companyName,
      reportId: context.metadata.reportId,
      hasEnterpriseData: !!context.enterpriseData,
      hasAnalysisResults: !!context.analysisResults?.length
    };
  }

  private parseDateFormat(format: string): Intl.DateTimeFormatOptions {
    // Simple format parsing - could be enhanced
    const options: Intl.DateTimeFormatOptions = {};

    if (format.includes('Y')) options.year = 'numeric';
    if (format.includes('M')) options.month = 'long';
    if (format.includes('D')) options.day = 'numeric';

    return options;
  }

  private formatSectionTitle(type: ReportSectionType): string {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private isSectionRequired(type: ReportSectionType): boolean {
    const requiredSections: ReportSectionType[] = [
      'cover_page',
      'executive_summary',
      'business_overview',
      'financial_analysis',
      'valuation_summary'
    ];

    return requiredSections.includes(type);
  }

  private getDefaultDataSources(type: ReportSectionType): any[] {
    // Return appropriate data sources based on section type
    return [
      {
        sourceId: 'business_evaluation',
        sourceType: 'business_evaluation',
        fieldMappings: [],
        required: true
      }
    ];
  }

  private getDefaultVisualizations(type: ReportSectionType): ChartConfiguration[] {
    // Return appropriate visualizations based on section type
    if (type === 'financial_analysis') {
      return [
        {
          id: `${type}_trend_chart`,
          title: 'Financial Trends',
          type: 'line',
          dataSource: {
            type: 'evaluation_data',
            path: 'financialData.trends',
            transformations: [],
            filters: []
          },
          styling: {} as any,
          axes: [],
          series: [],
          interactions: [],
          exportOptions: {
            formats: ['png', 'svg'],
            resolution: 300,
            includeData: false
          }
        }
      ];
    }

    return [];
  }

  private getDefaultStyling(tier: ReportTier): ReportStyling {
    return {
      colorScheme: {
        primary: '#c96442',
        secondary: '#9c87f5',
        accent: '#b05730',
        background: '#ffffff',
        text: '#3d3929',
        muted: '#83827d'
      },
      typography: {
        fonts: {
          headings: { family: 'Inter', size: 24, weight: 600, lineHeight: 1.2 },
          body: { family: 'Inter', size: 14, weight: 400, lineHeight: 1.5 },
          captions: { family: 'Inter', size: 12, weight: 400, lineHeight: 1.4 },
          monospace: { family: 'Monaco', size: 12, weight: 400, lineHeight: 1.4 }
        },
        lineHeight: 1.5,
        letterSpacing: 0,
        wordSpacing: 0,
        textAlign: 'left'
      },
      pageLayout: {
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        columns: 1,
        columnGap: 20
      },
      headerFooter: {
        header: {
          enabled: true,
          content: '{{metadata.companyName}} - {{metadata.title}}',
          height: 40,
          styling: {} as any
        },
        footer: {
          enabled: true,
          content: 'Page {{page}} of {{totalPages}} | {{metadata.reportId}}',
          height: 30,
          styling: {} as any
        }
      },
      branding: {
        logo: { url: '', width: 100, height: 50, position: 'left' },
        companyName: 'GoodBuy HQ',
        colors: {
          primary: '#c96442',
          secondary: '#9c87f5',
          accent: '#b05730',
          background: '#ffffff',
          text: '#3d3929',
          muted: '#83827d'
        },
        fonts: {
          headings: { family: 'Inter', size: 24, weight: 600, lineHeight: 1.2 },
          body: { family: 'Inter', size: 14, weight: 400, lineHeight: 1.5 },
          captions: { family: 'Inter', size: 12, weight: 400, lineHeight: 1.4 },
          monospace: { family: 'Monaco', size: 12, weight: 400, lineHeight: 1.4 }
        }
      }
    };
  }

  private estimateGenerationTime(sections: ReportSectionType[], tier: ReportTier): number {
    let time = 30; // Base time in seconds

    time += sections.length * 10; // Per section

    if (tier === 'enterprise') {
      time *= 1.5; // Enterprise features take longer
    }

    return Math.round(time);
  }
}

// Export singleton instance
export const templateEngine = TemplateEngine.getInstance();

// Export utility functions
export const createTemplateContext = (
  businessEvaluation: BusinessEvaluation,
  metadata: TemplateMetadata,
  styling: ReportStyling,
  tier: ReportTier,
  enterpriseData?: EnterpriseTierData,
  analysisResults?: AnalysisResult[],
  customData?: Record<string, any>
): TemplateContext => ({
  businessEvaluation,
  enterpriseData,
  analysisResults,
  metadata,
  styling,
  tier,
  customData
});

export const validateTemplateEngine = (): boolean => {
  try {
    const engine = TemplateEngine.getInstance();
    const stats = engine.getPerformanceStats();
    return stats.helpersRegistered > 0;
  } catch {
    return false;
  }
};