/**
 * Report Styling Integration Module
 *
 * Integrates the report styling system with the existing template engine
 * and enhanced report generator. Provides utilities for applying tier-specific
 * styling to generated reports and ensures consistent branding across all
 * report components.
 */

import {
  generateReportStylesheet,
  getTierStyling,
  getChartStyling,
  StyleUtils,
  PROFESSIONAL_COLOR_SCHEME,
  ENTERPRISE_COLOR_SCHEME,
  PROFESSIONAL_CHART_PALETTE,
  ENTERPRISE_CHART_PALETTE,
} from './report-styling';

import {
  ReportTier,
  ReportGenerationConfig,
  ReportStyling,
  ChartConfiguration,
  ChartStyling,
  ReportSectionType,
} from '@/types/enhanced-reports';

/**
 * Main styling integration class
 */
export class ReportStylingIntegration {
  private static instance: ReportStylingIntegration;
  private styleCache = new Map<string, string>();

  public static getInstance(): ReportStylingIntegration {
    if (!ReportStylingIntegration.instance) {
      ReportStylingIntegration.instance = new ReportStylingIntegration();
    }
    return ReportStylingIntegration.instance;
  }

  /**
   * Applies tier-specific styling to report configuration
   */
  public applyStylingToConfig(config: ReportGenerationConfig): ReportGenerationConfig {
    const tierStyling = getTierStyling(config.tier);

    return {
      ...config,
      styling: {
        ...config.styling,
        ...tierStyling,
        // Merge custom styles if provided
        customStyles: this.combineCustomStyles(tierStyling.customStyles, config.styling?.customStyles),
      },
    };
  }

  /**
   * Generates complete stylesheet for a report
   */
  public generateStylesheet(tier: ReportTier, customStyles?: string): string {
    const cacheKey = `${tier}-${customStyles ? 'custom' : 'default'}`;

    if (this.styleCache.has(cacheKey)) {
      return this.styleCache.get(cacheKey)!;
    }

    const baseStylesheet = generateReportStylesheet(tier);
    const finalStylesheet = customStyles
      ? `${baseStylesheet}\n\n/* Custom Styles */\n${customStyles}`
      : baseStylesheet;

    this.styleCache.set(cacheKey, finalStylesheet);
    return finalStylesheet;
  }

  /**
   * Applies styling to chart configurations
   */
  public styleChartConfiguration(config: ChartConfiguration, tier: ReportTier): ChartConfiguration {
    const chartStyling = getChartStyling(tier);

    return {
      ...config,
      styling: {
        ...config.styling,
        ...chartStyling,
      },
    };
  }

  /**
   * Gets tier-specific HTML structure with styling
   */
  public generateStyledHTMLStructure(tier: ReportTier, content: string): string {
    const stylesheet = this.generateStylesheet(tier);
    const colors = tier === 'enterprise' ? ENTERPRISE_COLOR_SCHEME : PROFESSIONAL_COLOR_SCHEME;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Professional Business Analysis Report</title>
  <style>
${stylesheet}
  </style>
  <style media="print">
    @page {
      size: letter;
      margin: 0.75in;
    }

    body {
      -webkit-print-color-adjust: exact;
      color-adjust: exact;
      print-color-adjust: exact;
    }

    .page-break {
      page-break-before: always;
      break-before: page;
    }

    .no-page-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    @page :first {
      margin-top: 0.5in;
    }
  </style>
</head>
<body>
  <div class="report-page">
    ${content}
  </div>
</body>
</html>
    `;
  }

  /**
   * Wraps section content with appropriate styling
   */
  public wrapSectionContent(
    sectionType: ReportSectionType,
    content: string,
    tier: ReportTier,
    options: SectionStylingOptions = {}
  ): string {
    const sectionClass = this.getSectionClass(sectionType);
    const pageBreak = options.pageBreakBefore ? 'page-break' : '';
    const noBreak = options.avoidPageBreak ? 'no-page-break' : '';
    const customClass = options.customClass || '';

    const classes = [sectionClass, pageBreak, noBreak, customClass]
      .filter(Boolean)
      .join(' ');

    return `
<section class="${classes}" data-section="${sectionType}">
  ${content}
</section>
    `;
  }

  /**
   * Generates styled chart HTML
   */
  public generateStyledChart(
    chartConfig: ChartConfiguration,
    tier: ReportTier,
    chartImageUrl: string
  ): string {
    const styledConfig = this.styleChartConfiguration(chartConfig, tier);

    return `
<div class="chart-container" data-chart-id="${chartConfig.id}">
  <h3 class="chart-title">${chartConfig.title}</h3>
  <div class="chart-canvas">
    <img src="${chartImageUrl}" alt="${chartConfig.title}" style="max-width: 100%; height: auto;" />
  </div>
  ${this.generateChartLegend(styledConfig)}
  ${chartConfig.dataSource.type === 'scenario' ? '<div class="chart-note">*Scenario-based projections</div>' : ''}
</div>
    `;
  }

  /**
   * Generates styled metrics grid
   */
  public generateStyledMetrics(metrics: MetricData[], tier: ReportTier): string {
    const metricsHTML = metrics.map(metric => `
<div class="metric-card">
  <div class="metric-value">${this.formatMetricValue(metric.value, metric.unit)}</div>
  <div class="metric-label">${metric.label}</div>
  ${metric.change ? this.generateMetricChange(metric.change) : ''}
</div>
    `).join('');

    return `
<div class="metrics-grid">
  ${metricsHTML}
</div>
    `;
  }

  /**
   * Generates styled data table
   */
  public generateStyledTable(
    data: TableData,
    tier: ReportTier,
    options: TableStylingOptions = {}
  ): string {
    const tableClass = options.financial ? 'data-table financial-table' : 'data-table';
    const comparison = options.comparison ? 'comparison-table' : '';

    const headerHTML = `
<thead>
  <tr>
    ${data.headers.map(header => `
    <th class="${header.numeric ? 'numeric' : ''}">${header.label}</th>
    `).join('')}
  </tr>
</thead>
    `;

    const bodyHTML = `
<tbody>
  ${data.rows.map((row, index) => `
  <tr class="${row.isTotal ? 'total-row' : ''}">
    ${row.cells.map((cell, cellIndex) => {
      const header = data.headers[cellIndex];
      let cellClass = header.numeric ? 'numeric' : '';

      if (options.comparison && typeof cell.value === 'number') {
        if (cell.value > 0) cellClass += ' positive';
        else if (cell.value < 0) cellClass += ' negative';
      }

      if (header.type === 'currency') cellClass += ' currency';
      if (header.type === 'percentage') cellClass += ' percentage';

      return `<td class="${cellClass}">${this.formatCellValue(cell.value, header.type)}</td>`;
    }).join('')}
  </tr>
  `).join('')}
</tbody>
    `;

    return `
<div class="table-container">
  ${data.title ? `<h4 class="table-title">${data.title}</h4>` : ''}
  <table class="${tableClass} ${comparison}">
    ${headerHTML}
    ${bodyHTML}
  </table>
  ${data.caption ? `<div class="table-caption">${data.caption}</div>` : ''}
</div>
    `;
  }

  /**
   * Generates styled recommendations section
   */
  public generateStyledRecommendations(
    recommendations: RecommendationData[],
    tier: ReportTier
  ): string {
    const recommendationsHTML = recommendations.map(rec => `
<div class="recommendation-item">
  <div class="recommendation-title">${rec.title}</div>
  <span class="recommendation-priority priority-${rec.priority}">${rec.priority}</span>
  <p>${rec.description}</p>

  ${rec.metrics ? `
  <div class="recommendation-metrics">
    ${rec.metrics.map(metric => `
    <div class="metric-item">
      <div class="value">${this.formatMetricValue(metric.value, metric.unit)}</div>
      <div class="label">${metric.label}</div>
    </div>
    `).join('')}
  </div>
  ` : ''}

  ${rec.actionItems ? `
  <div class="action-items">
    <h5>Action Items:</h5>
    ${rec.actionItems.map(action => `
    <div class="action-item">
      <div class="action-checkbox"></div>
      <div class="action-text">
        ${action.text}
        ${action.timeline ? `<div class="action-timeline">${action.timeline}</div>` : ''}
      </div>
    </div>
    `).join('')}
  </div>
  ` : ''}
</div>
    `).join('');

    return `
<div class="recommendations-section">
  <h2>Strategic Recommendations</h2>
  ${recommendationsHTML}
</div>
    `;
  }

  /**
   * Generates styled risk assessment
   */
  public generateStyledRiskAssessment(risks: RiskData[], tier: ReportTier): string {
    const risksByCategory = this.groupRisksByCategory(risks);

    const categoriesHTML = Object.entries(risksByCategory).map(([category, categoryRisks]) => `
<div class="risk-category">
  <h4>${category} Risks</h4>
  <ul class="risk-list">
    ${categoryRisks.map(risk => `
    <li>
      <span class="risk-level ${risk.level}">${risk.level.toUpperCase()}</span>
      ${risk.description}
    </li>
    `).join('')}
  </ul>
</div>
    `).join('');

    return `
<div class="risk-assessment">
  <h2>Risk Analysis</h2>
  <div class="risk-categories">
    ${categoriesHTML}
  </div>
</div>
    `;
  }

  /**
   * Generates Enterprise-tier scenario analysis
   */
  public generateStyledScenarioAnalysis(scenarios: ScenarioData[], tier: ReportTier): string {
    if (tier !== 'enterprise') {
      return ''; // Scenarios only available for Enterprise tier
    }

    const scenariosHTML = scenarios.map(scenario => `
<div class="scenario-card">
  <h3 class="scenario-title">${scenario.name}</h3>
  <div class="scenario-probability">Probability: ${(scenario.probability * 100).toFixed(1)}%</div>
  <div class="scenario-outcomes">
    ${scenario.outcomes.map(outcome => `
    <div class="outcome-item">
      <span>${outcome.label}</span>
      <span class="outcome-value">${this.formatMetricValue(outcome.value, outcome.unit)}</span>
    </div>
    `).join('')}
  </div>
</div>
    `).join('');

    return `
<div class="scenario-analysis">
  <h2>Scenario Analysis</h2>
  <div class="scenario-grid">
    ${scenariosHTML}
  </div>
</div>
    `;
  }

  // ===== PRIVATE HELPER METHODS =====

  private combineCustomStyles(baseStyles?: string, customStyles?: string): string {
    return [baseStyles, customStyles].filter(Boolean).join('\n\n');
  }

  private getSectionClass(sectionType: ReportSectionType): string {
    const classMap: Record<ReportSectionType, string> = {
      cover_page: 'cover-page-section',
      executive_summary: 'executive-summary-section',
      business_overview: 'business-overview-section',
      financial_analysis: 'financial-analysis-section',
      operational_assessment: 'operational-assessment-section',
      strategic_positioning: 'strategic-positioning-section',
      risk_analysis: 'risk-analysis-section',
      investment_recommendations: 'investment-recommendations-section',
      valuation_summary: 'valuation-summary-section',
      scenario_analysis: 'scenario-analysis-section',
      exit_strategy: 'exit-strategy-section',
      capital_structure: 'capital-structure-section',
      strategic_options: 'strategic-options-section',
      multi_year_projections: 'multi-year-projections-section',
      appendices: 'appendices-section',
    };

    return classMap[sectionType] || 'report-section';
  }

  private generateChartLegend(chartConfig: ChartConfiguration): string {
    if (!chartConfig.series || chartConfig.series.length <= 1) {
      return '';
    }

    const legendItems = chartConfig.series.map((series, index) => {
      const color = chartConfig.styling.colors.primary[index % chartConfig.styling.colors.primary.length];
      return `
      <div class="legend-item">
        <div class="legend-color" style="background-color: ${color};"></div>
        <span>${series.name}</span>
      </div>
      `;
    }).join('');

    return `
<div class="chart-legend">
  ${legendItems}
</div>
    `;
  }

  private generateMetricChange(change: MetricChange): string {
    const changeClass = change.value > 0 ? 'positive' : change.value < 0 ? 'negative' : 'neutral';
    const arrow = change.value > 0 ? '↗' : change.value < 0 ? '↙' : '→';

    return `
<div class="metric-change ${changeClass}">
  <span>${arrow}</span>
  <span>${Math.abs(change.value).toFixed(1)}${change.unit}</span>
  <span>${change.period}</span>
</div>
    `;
  }

  private formatMetricValue(value: number, unit: string): string {
    switch (unit) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);

      case 'percentage':
        return `${value.toFixed(1)}%`;

      case 'number':
        return new Intl.NumberFormat('en-US').format(value);

      case 'ratio':
        return `${value.toFixed(2)}x`;

      default:
        return `${value} ${unit}`;
    }
  }

  private formatCellValue(value: any, type?: string): string {
    if (value === null || value === undefined) {
      return '-';
    }

    if (typeof value === 'number') {
      switch (type) {
        case 'currency':
          return this.formatMetricValue(value, 'currency');
        case 'percentage':
          return this.formatMetricValue(value, 'percentage');
        case 'number':
          return this.formatMetricValue(value, 'number');
        default:
          return value.toString();
      }
    }

    return value.toString();
  }

  private groupRisksByCategory(risks: RiskData[]): Record<string, RiskData[]> {
    return risks.reduce((acc, risk) => {
      if (!acc[risk.category]) {
        acc[risk.category] = [];
      }
      acc[risk.category].push(risk);
      return acc;
    }, {} as Record<string, RiskData[]>);
  }
}

// ===== TYPE DEFINITIONS =====

export interface SectionStylingOptions {
  pageBreakBefore?: boolean;
  avoidPageBreak?: boolean;
  customClass?: string;
}

export interface TableStylingOptions {
  financial?: boolean;
  comparison?: boolean;
}

export interface MetricData {
  label: string;
  value: number;
  unit: string;
  change?: MetricChange;
}

export interface MetricChange {
  value: number;
  unit: string;
  period: string;
}

export interface TableData {
  title?: string;
  caption?: string;
  headers: TableHeader[];
  rows: TableRow[];
}

export interface TableHeader {
  label: string;
  numeric: boolean;
  type?: 'currency' | 'percentage' | 'number' | 'text';
}

export interface TableRow {
  cells: TableCell[];
  isTotal?: boolean;
}

export interface TableCell {
  value: any;
}

export interface RecommendationData {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  metrics?: MetricData[];
  actionItems?: ActionItem[];
}

export interface ActionItem {
  text: string;
  timeline?: string;
}

export interface RiskData {
  category: string;
  description: string;
  level: 'low' | 'medium' | 'high' | 'critical';
}

export interface ScenarioData {
  name: string;
  probability: number;
  outcomes: OutcomeData[];
}

export interface OutcomeData {
  label: string;
  value: number;
  unit: string;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Creates a singleton instance of the styling integration
 */
export function createStylingIntegration(): ReportStylingIntegration {
  return ReportStylingIntegration.getInstance();
}

/**
 * Applies tier-specific styling to an entire report configuration
 */
export function applyTierStyling(
  config: ReportGenerationConfig,
  customizations?: Partial<ReportStyling>
): ReportGenerationConfig {
  const integration = ReportStylingIntegration.getInstance();
  const styledConfig = integration.applyStylingToConfig(config);

  if (customizations) {
    styledConfig.styling = {
      ...styledConfig.styling,
      ...customizations,
    };
  }

  return styledConfig;
}

/**
 * Generates HTML with tier-appropriate styling
 */
export function generateStyledHTML(
  tier: ReportTier,
  content: string,
  customStyles?: string
): string {
  const integration = ReportStylingIntegration.getInstance();
  return integration.generateStyledHTMLStructure(tier, content);
}

/**
 * Utility to get chart colors for a specific tier
 */
export function getChartColors(tier: ReportTier): string[] {
  return tier === 'enterprise'
    ? ENTERPRISE_CHART_PALETTE.primary
    : PROFESSIONAL_CHART_PALETTE.primary;
}

/**
 * Utility to get brand colors for a specific tier
 */
export function getBrandColors(tier: ReportTier) {
  return tier === 'enterprise' ? ENTERPRISE_COLOR_SCHEME : PROFESSIONAL_COLOR_SCHEME;
}

export default ReportStylingIntegration;