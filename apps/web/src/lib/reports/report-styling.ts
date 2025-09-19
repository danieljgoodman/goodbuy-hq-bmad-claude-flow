/**
 * Professional Report Styling System
 *
 * Comprehensive styling system for Professional and Enterprise tier reports
 * implementing tier-specific branding with brown/terracotta (Professional) and
 * deep brown/navy (Enterprise) color schemes.
 *
 * Features:
 * - Tier-specific color schemes and branding
 * - CSS styles for all report sections
 * - Print-optimized styling with proper page breaks
 * - Chart and visualization styling utilities
 * - Typography and spacing consistency
 * - Template engine and generator integration
 */

import { ReportTier, ColorScheme, FontConfiguration, ReportStyling } from '@/types/enhanced-reports';

// ===== TIER-SPECIFIC COLOR SCHEMES =====

/**
 * Professional Tier Color Scheme
 * Warm brown/terracotta palette conveying trust and sophistication
 */
export const PROFESSIONAL_COLOR_SCHEME: ColorScheme = {
  primary: '#c96442',      // Warm terracotta - main brand color
  secondary: '#b05730',    // Deeper terracotta - accents and highlights
  accent: '#9c87f5',       // Subtle purple - charts and callouts
  background: '#ded8c4',   // Warm cream - page backgrounds
  text: '#3d3929',         // Dark brown - primary text
  muted: '#83827d',        // Medium gray-brown - secondary text
};

/**
 * Enterprise Tier Color Scheme
 * Sophisticated deep brown/navy palette for premium corporate reports
 */
export const ENTERPRISE_COLOR_SCHEME: ColorScheme = {
  primary: '#2c1810',      // Deep espresso brown - primary brand
  secondary: '#1e3a8a',    // Deep navy blue - corporate accent
  accent: '#7c3aed',       // Rich purple - premium highlights
  background: '#f8f6f3',   // Warm off-white - elegant background
  text: '#1a1611',         // Rich dark brown - premium text
  muted: '#6b7280',        // Neutral gray - supporting text
};

// ===== TYPOGRAPHY CONFIGURATIONS =====

/**
 * Professional Tier Typography
 * Clean, modern fonts with excellent readability
 */
export const PROFESSIONAL_TYPOGRAPHY: FontConfiguration = {
  headings: {
    family: '"Inter", "Helvetica Neue", Arial, sans-serif',
    size: 28,
    weight: 700,
    lineHeight: 1.2,
    color: PROFESSIONAL_COLOR_SCHEME.text,
  },
  body: {
    family: '"Inter", "Helvetica Neue", Arial, sans-serif',
    size: 11,
    weight: 400,
    lineHeight: 1.6,
    color: PROFESSIONAL_COLOR_SCHEME.text,
  },
  captions: {
    family: '"Inter", "Helvetica Neue", Arial, sans-serif',
    size: 9,
    weight: 500,
    lineHeight: 1.4,
    color: PROFESSIONAL_COLOR_SCHEME.muted,
  },
  monospace: {
    family: '"JetBrains Mono", "Fira Code", monospace',
    size: 10,
    weight: 400,
    lineHeight: 1.5,
    color: PROFESSIONAL_COLOR_SCHEME.text,
  },
};

/**
 * Enterprise Tier Typography
 * Premium typography with enhanced sophistication
 */
export const ENTERPRISE_TYPOGRAPHY: FontConfiguration = {
  headings: {
    family: '"Playfair Display", "Georgia", serif',
    size: 32,
    weight: 700,
    lineHeight: 1.1,
    color: ENTERPRISE_COLOR_SCHEME.text,
  },
  body: {
    family: '"Source Sans Pro", "Helvetica Neue", Arial, sans-serif',
    size: 12,
    weight: 400,
    lineHeight: 1.7,
    color: ENTERPRISE_COLOR_SCHEME.text,
  },
  captions: {
    family: '"Source Sans Pro", "Helvetica Neue", Arial, sans-serif',
    size: 10,
    weight: 600,
    lineHeight: 1.5,
    color: ENTERPRISE_COLOR_SCHEME.muted,
  },
  monospace: {
    family: '"SF Mono", "Monaco", monospace',
    size: 11,
    weight: 500,
    lineHeight: 1.6,
    color: ENTERPRISE_COLOR_SCHEME.text,
  },
};

// ===== CHART COLOR PALETTES =====

/**
 * Professional Tier Chart Colors
 * Warm, approachable colors aligned with brand
 */
export const PROFESSIONAL_CHART_PALETTE = {
  primary: ['#c96442', '#b05730', '#9c87f5', '#e97a56', '#8b4513'],
  gradients: [
    'linear-gradient(135deg, #c96442 0%, #e97a56 100%)',
    'linear-gradient(135deg, #b05730 0%, #c96442 100%)',
    'linear-gradient(135deg, #9c87f5 0%, #c8b3ff 100%)',
    'linear-gradient(135deg, #8b4513 0%, #b05730 100%)',
  ],
  success: '#10b981',     // Green for positive metrics
  warning: '#f59e0b',     // Amber for caution
  danger: '#ef4444',      // Red for risks/negative
  neutral: '#6b7280',     // Gray for neutral data
};

/**
 * Enterprise Tier Chart Colors
 * Sophisticated, premium color palette
 */
export const ENTERPRISE_CHART_PALETTE = {
  primary: ['#2c1810', '#1e3a8a', '#7c3aed', '#4338ca', '#581c87'],
  gradients: [
    'linear-gradient(135deg, #2c1810 0%, #4b2c20 100%)',
    'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)',
  ],
  success: '#059669',     // Deep green for growth
  warning: '#d97706',     // Deep amber for attention
  danger: '#dc2626',      // Deep red for risks
  neutral: '#4b5563',     // Dark gray for data
};

// ===== CSS STYLE GENERATORS =====

/**
 * Generates base CSS styles for report documents
 */
export function generateBaseStyles(tier: ReportTier): string {
  const colors = tier === 'professional' ? PROFESSIONAL_COLOR_SCHEME : ENTERPRISE_COLOR_SCHEME;
  const typography = tier === 'professional' ? PROFESSIONAL_TYPOGRAPHY : ENTERPRISE_TYPOGRAPHY;

  return `
    /* Base Document Styles */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: ${typography.body.family};
      font-size: ${typography.body.size}pt;
      font-weight: ${typography.body.weight};
      line-height: ${typography.body.lineHeight};
      color: ${typography.body.color || colors.text};
      background-color: ${colors.background};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Print Optimization */
    @media print {
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

      .keep-together {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }

    /* Page Layout */
    .report-page {
      width: 8.5in;
      min-height: 11in;
      margin: 0 auto;
      padding: 1in;
      background: white;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    @media print {
      .report-page {
        width: 100%;
        min-height: auto;
        margin: 0;
        padding: 0.75in;
        box-shadow: none;
      }
    }
  `;
}

/**
 * Generates typography styles for headers, body text, and captions
 */
export function generateTypographyStyles(tier: ReportTier): string {
  const typography = tier === 'professional' ? PROFESSIONAL_TYPOGRAPHY : ENTERPRISE_TYPOGRAPHY;
  const colors = tier === 'professional' ? PROFESSIONAL_COLOR_SCHEME : ENTERPRISE_COLOR_SCHEME;

  return `
    /* Typography Hierarchy */
    h1, h2, h3, h4, h5, h6 {
      font-family: ${typography.headings.family};
      font-weight: ${typography.headings.weight};
      line-height: ${typography.headings.lineHeight};
      color: ${typography.headings.color || colors.text};
      margin-bottom: 0.75em;
      margin-top: 1.5em;
    }

    h1 {
      font-size: ${typography.headings.size}pt;
      border-bottom: 3px solid ${colors.primary};
      padding-bottom: 0.5em;
      margin-top: 0;
    }

    h2 {
      font-size: ${typography.headings.size * 0.85}pt;
      color: ${colors.primary};
      border-bottom: 1px solid ${colors.secondary};
      padding-bottom: 0.3em;
    }

    h3 {
      font-size: ${typography.headings.size * 0.7}pt;
      color: ${colors.secondary};
      margin-bottom: 0.5em;
    }

    h4 {
      font-size: ${typography.headings.size * 0.6}pt;
      color: ${colors.text};
      font-weight: 600;
    }

    h5, h6 {
      font-size: ${typography.body.size}pt;
      color: ${colors.text};
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Body Text */
    p {
      margin-bottom: 1em;
      text-align: justify;
      orphans: 2;
      widows: 2;
    }

    /* Lists */
    ul, ol {
      margin-bottom: 1em;
      padding-left: 1.5em;
    }

    li {
      margin-bottom: 0.5em;
    }

    /* Emphasis */
    strong, b {
      font-weight: 700;
      color: ${colors.text};
    }

    em, i {
      font-style: italic;
      color: ${colors.text};
    }

    /* Code */
    code, pre {
      font-family: ${typography.monospace.family};
      font-size: ${typography.monospace.size}pt;
      background: ${colors.background};
      padding: 0.2em 0.4em;
      border-radius: 3px;
      border: 1px solid ${colors.muted};
    }

    pre {
      padding: 1em;
      overflow-x: auto;
      white-space: pre-wrap;
    }

    /* Captions */
    .caption, .figure-caption, .table-caption {
      font-family: ${typography.captions.family};
      font-size: ${typography.captions.size}pt;
      font-weight: ${typography.captions.weight};
      line-height: ${typography.captions.lineHeight};
      color: ${typography.captions.color || colors.muted};
      text-align: center;
      margin-top: 0.5em;
      margin-bottom: 1em;
      font-style: italic;
    }
  `;
}

/**
 * Generates header and footer styles
 */
export function generateHeaderFooterStyles(tier: ReportTier): string {
  const colors = tier === 'professional' ? PROFESSIONAL_COLOR_SCHEME : ENTERPRISE_COLOR_SCHEME;
  const typography = tier === 'professional' ? PROFESSIONAL_TYPOGRAPHY : ENTERPRISE_TYPOGRAPHY;

  return `
    /* Header Styles */
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5in 1in;
      background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
      color: white;
      margin: -1in -1in 1in -1in;
    }

    @media print {
      .report-header {
        margin: -0.75in -0.75in 0.75in -0.75in;
        padding: 0.375in 0.75in;
      }
    }

    .report-header h1 {
      margin: 0;
      color: white;
      border: none;
      padding: 0;
      font-size: ${typography.headings.size * 1.2}pt;
    }

    .report-header .company-info {
      text-align: right;
      font-size: ${typography.body.size * 0.9}pt;
    }

    .report-header .logo {
      max-height: 2in;
      max-width: 3in;
    }

    /* Footer Styles */
    .report-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5in 1in;
      margin: 1in -1in -1in -1in;
      border-top: 2px solid ${colors.primary};
      background: ${colors.background};
      font-size: ${typography.captions.size}pt;
      color: ${colors.muted};
    }

    @media print {
      .report-footer {
        margin: 0.75in -0.75in -0.75in -0.75in;
        padding: 0.375in 0.75in;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
      }
    }

    .report-footer .page-number::after {
      content: counter(page);
    }

    .report-footer .confidential {
      font-weight: 600;
      color: ${colors.secondary};
    }
  `;
}

/**
 * Generates styles for key metrics and KPI sections
 */
export function generateMetricsStyles(tier: ReportTier): string {
  const colors = tier === 'professional' ? PROFESSIONAL_COLOR_SCHEME : ENTERPRISE_COLOR_SCHEME;
  const chartColors = tier === 'professional' ? PROFESSIONAL_CHART_PALETTE : ENTERPRISE_CHART_PALETTE;

  return `
    /* Key Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200pt, 1fr));
      gap: 16pt;
      margin: 1em 0;
    }

    .metric-card {
      background: white;
      border: 1px solid ${colors.secondary};
      border-radius: 8pt;
      padding: 16pt;
      text-align: center;
      box-shadow: 0 2pt 4pt rgba(0, 0, 0, 0.1);
      page-break-inside: avoid;
    }

    .metric-value {
      font-size: 28pt;
      font-weight: 700;
      color: ${colors.primary};
      margin-bottom: 4pt;
    }

    .metric-label {
      font-size: 10pt;
      color: ${colors.muted};
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8pt;
    }

    .metric-change {
      font-size: 9pt;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4pt;
    }

    .metric-change.positive {
      color: ${chartColors.success};
    }

    .metric-change.negative {
      color: ${chartColors.danger};
    }

    .metric-change.neutral {
      color: ${chartColors.neutral};
    }

    /* Financial Highlights */
    .financial-highlights {
      background: linear-gradient(135deg, ${colors.background} 0%, white 100%);
      border-left: 4pt solid ${colors.primary};
      padding: 16pt;
      margin: 1em 0;
      border-radius: 0 8pt 8pt 0;
    }

    .financial-highlights h3 {
      color: ${colors.primary};
      margin-top: 0;
    }

    /* Score Indicators */
    .score-indicator {
      display: inline-flex;
      align-items: center;
      gap: 8pt;
      padding: 4pt 12pt;
      border-radius: 20pt;
      font-weight: 600;
      font-size: 9pt;
    }

    .score-indicator.excellent {
      background: ${chartColors.success};
      color: white;
    }

    .score-indicator.good {
      background: ${colors.accent};
      color: white;
    }

    .score-indicator.fair {
      background: ${chartColors.warning};
      color: white;
    }

    .score-indicator.poor {
      background: ${chartColors.danger};
      color: white;
    }
  `;
}

/**
 * Generates table styles for financial data and analysis
 */
export function generateTableStyles(tier: ReportTier): string {
  const colors = tier === 'professional' ? PROFESSIONAL_COLOR_SCHEME : ENTERPRISE_COLOR_SCHEME;
  const typography = tier === 'professional' ? PROFESSIONAL_TYPOGRAPHY : ENTERPRISE_TYPOGRAPHY;

  return `
    /* Data Tables */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
      background: white;
      box-shadow: 0 1pt 3pt rgba(0, 0, 0, 0.1);
      page-break-inside: avoid;
    }

    .data-table th {
      background: ${colors.primary};
      color: white;
      padding: 12pt;
      text-align: left;
      font-weight: 600;
      font-size: ${typography.body.size * 0.9}pt;
      border: 1px solid ${colors.secondary};
    }

    .data-table th.numeric {
      text-align: right;
    }

    .data-table td {
      padding: 10pt 12pt;
      border: 1px solid ${colors.background};
      font-size: ${typography.body.size}pt;
    }

    .data-table td.numeric {
      text-align: right;
      font-family: ${typography.monospace.family};
      font-weight: 500;
    }

    .data-table tbody tr:nth-child(even) {
      background: ${colors.background};
    }

    .data-table tbody tr:hover {
      background: ${colors.accent}20;
    }

    /* Financial Tables */
    .financial-table {
      border: 2px solid ${colors.primary};
    }

    .financial-table .total-row {
      background: ${colors.secondary}20;
      font-weight: 700;
      border-top: 2px solid ${colors.primary};
    }

    .financial-table .currency {
      color: ${colors.primary};
    }

    .financial-table .percentage {
      color: ${colors.secondary};
    }

    /* Comparison Tables */
    .comparison-table .positive {
      color: ${tier === 'professional' ? PROFESSIONAL_CHART_PALETTE.success : ENTERPRISE_CHART_PALETTE.success};
      font-weight: 600;
    }

    .comparison-table .negative {
      color: ${tier === 'professional' ? PROFESSIONAL_CHART_PALETTE.danger : ENTERPRISE_CHART_PALETTE.danger};
      font-weight: 600;
    }

    /* Table Captions */
    .table-container {
      margin: 1.5em 0;
      page-break-inside: avoid;
    }

    .table-title {
      font-size: ${typography.headings.size * 0.6}pt;
      font-weight: 600;
      color: ${colors.primary};
      margin-bottom: 0.5em;
    }
  `;
}

/**
 * Generates chart and visualization container styles
 */
export function generateChartStyles(tier: ReportTier): string {
  const colors = tier === 'professional' ? PROFESSIONAL_COLOR_SCHEME : ENTERPRISE_COLOR_SCHEME;

  return `
    /* Chart Containers */
    .chart-container {
      background: white;
      border: 1px solid ${colors.background};
      border-radius: 8pt;
      padding: 16pt;
      margin: 1.5em 0;
      text-align: center;
      page-break-inside: avoid;
      box-shadow: 0 2pt 4pt rgba(0, 0, 0, 0.1);
    }

    .chart-title {
      font-size: 14pt;
      font-weight: 600;
      color: ${colors.primary};
      margin-bottom: 1em;
      text-align: center;
    }

    .chart-canvas {
      max-width: 100%;
      height: auto;
      margin: 0 auto;
    }

    /* Chart Grid Layout */
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300pt, 1fr));
      gap: 20pt;
      margin: 1em 0;
    }

    .chart-grid-item {
      background: white;
      border: 1px solid ${colors.background};
      border-radius: 8pt;
      padding: 12pt;
      page-break-inside: avoid;
    }

    /* Dashboard-style Charts */
    .dashboard-chart {
      background: linear-gradient(135deg, white 0%, ${colors.background} 100%);
      border-left: 4pt solid ${colors.primary};
    }

    /* Chart Legends */
    .chart-legend {
      display: flex;
      justify-content: center;
      gap: 16pt;
      margin-top: 12pt;
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6pt;
      font-size: 9pt;
      color: ${colors.text};
    }

    .legend-color {
      width: 12pt;
      height: 12pt;
      border-radius: 2pt;
    }

    /* Chart Annotations */
    .chart-note {
      font-size: 8pt;
      color: ${colors.muted};
      font-style: italic;
      text-align: left;
      margin-top: 8pt;
      padding-left: 12pt;
      border-left: 2pt solid ${colors.background};
    }
  `;
}

/**
 * Generates recommendation and action item styles
 */
export function generateRecommendationStyles(tier: ReportTier): string {
  const colors = tier === 'professional' ? PROFESSIONAL_COLOR_SCHEME : ENTERPRISE_COLOR_SCHEME;
  const chartColors = tier === 'professional' ? PROFESSIONAL_CHART_PALETTE : ENTERPRISE_CHART_PALETTE;

  return `
    /* Recommendation Sections */
    .recommendations-section {
      background: ${colors.background}40;
      border: 1px solid ${colors.secondary};
      border-radius: 8pt;
      padding: 20pt;
      margin: 1.5em 0;
      page-break-inside: avoid;
    }

    .recommendation-item {
      background: white;
      border-left: 4pt solid ${colors.primary};
      padding: 16pt;
      margin-bottom: 16pt;
      border-radius: 0 8pt 8pt 0;
      box-shadow: 0 1pt 3pt rgba(0, 0, 0, 0.1);
    }

    .recommendation-title {
      font-size: 12pt;
      font-weight: 700;
      color: ${colors.primary};
      margin-bottom: 8pt;
    }

    .recommendation-priority {
      display: inline-block;
      padding: 4pt 8pt;
      border-radius: 4pt;
      font-size: 8pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8pt;
    }

    .priority-critical {
      background: ${chartColors.danger};
      color: white;
    }

    .priority-high {
      background: ${chartColors.warning};
      color: white;
    }

    .priority-medium {
      background: ${colors.accent};
      color: white;
    }

    .priority-low {
      background: ${chartColors.neutral};
      color: white;
    }

    .recommendation-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120pt, 1fr));
      gap: 12pt;
      margin-top: 12pt;
      padding-top: 12pt;
      border-top: 1px solid ${colors.background};
    }

    .metric-item {
      text-align: center;
    }

    .metric-item .value {
      font-size: 16pt;
      font-weight: 700;
      color: ${colors.primary};
    }

    .metric-item .label {
      font-size: 8pt;
      color: ${colors.muted};
      text-transform: uppercase;
    }

    /* Action Items */
    .action-items {
      margin-top: 16pt;
    }

    .action-item {
      display: flex;
      align-items: flex-start;
      gap: 8pt;
      margin-bottom: 8pt;
      padding: 8pt;
      background: ${colors.background}20;
      border-radius: 4pt;
    }

    .action-checkbox {
      width: 12pt;
      height: 12pt;
      border: 2px solid ${colors.primary};
      border-radius: 2pt;
      margin-top: 2pt;
    }

    .action-text {
      flex: 1;
      font-size: 10pt;
      line-height: 1.4;
    }

    .action-timeline {
      font-size: 8pt;
      color: ${colors.muted};
      font-style: italic;
    }
  `;
}

/**
 * Generates risk assessment and analysis styles
 */
export function generateRiskStyles(tier: ReportTier): string {
  const colors = tier === 'professional' ? PROFESSIONAL_COLOR_SCHEME : ENTERPRISE_COLOR_SCHEME;
  const chartColors = tier === 'professional' ? PROFESSIONAL_CHART_PALETTE : ENTERPRISE_CHART_PALETTE;

  return `
    /* Risk Assessment Sections */
    .risk-assessment {
      border: 2px solid ${chartColors.warning};
      border-radius: 8pt;
      padding: 16pt;
      margin: 1em 0;
      background: ${chartColors.warning}10;
      page-break-inside: avoid;
    }

    .risk-level {
      display: inline-flex;
      align-items: center;
      gap: 8pt;
      padding: 6pt 12pt;
      border-radius: 20pt;
      font-weight: 700;
      font-size: 10pt;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .risk-level.low {
      background: ${chartColors.success};
      color: white;
    }

    .risk-level.medium {
      background: ${chartColors.warning};
      color: white;
    }

    .risk-level.high {
      background: ${chartColors.danger};
      color: white;
    }

    .risk-level.critical {
      background: ${colors.text};
      color: white;
    }

    /* Risk Matrix */
    .risk-matrix {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 2pt;
      margin: 1em 0;
      max-width: 300pt;
    }

    .risk-cell {
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8pt;
      font-weight: 600;
      border-radius: 2pt;
    }

    .risk-cell.low-risk {
      background: ${chartColors.success}40;
      color: ${chartColors.success};
    }

    .risk-cell.medium-risk {
      background: ${chartColors.warning}40;
      color: ${chartColors.warning};
    }

    .risk-cell.high-risk {
      background: ${chartColors.danger}40;
      color: ${chartColors.danger};
    }

    /* Risk Categories */
    .risk-categories {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200pt, 1fr));
      gap: 16pt;
      margin: 1em 0;
    }

    .risk-category {
      background: white;
      border: 1px solid ${colors.background};
      border-radius: 8pt;
      padding: 16pt;
      box-shadow: 0 1pt 3pt rgba(0, 0, 0, 0.1);
    }

    .risk-category h4 {
      color: ${colors.primary};
      margin-bottom: 12pt;
      padding-bottom: 8pt;
      border-bottom: 1px solid ${colors.background};
    }

    .risk-list {
      list-style: none;
      padding: 0;
    }

    .risk-list li {
      padding: 6pt 0;
      border-bottom: 1px dotted ${colors.background};
      font-size: 9pt;
    }

    .risk-list li:last-child {
      border-bottom: none;
    }
  `;
}

/**
 * Generates scenario analysis styles for Enterprise tier
 */
export function generateScenarioStyles(tier: ReportTier): string {
  const colors = tier === 'professional' ? PROFESSIONAL_COLOR_SCHEME : ENTERPRISE_COLOR_SCHEME;
  const chartColors = tier === 'professional' ? PROFESSIONAL_CHART_PALETTE : ENTERPRISE_CHART_PALETTE;

  return `
    /* Scenario Analysis (Enterprise Only) */
    .scenario-analysis {
      background: linear-gradient(135deg, ${colors.background} 0%, white 100%);
      border: 2px solid ${colors.primary};
      border-radius: 12pt;
      padding: 24pt;
      margin: 1.5em 0;
      page-break-inside: avoid;
    }

    .scenario-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250pt, 1fr));
      gap: 20pt;
      margin: 1em 0;
    }

    .scenario-card {
      background: white;
      border: 1px solid ${colors.secondary};
      border-radius: 8pt;
      padding: 16pt;
      text-align: center;
      box-shadow: 0 4pt 6pt rgba(0, 0, 0, 0.1);
    }

    .scenario-title {
      font-size: 14pt;
      font-weight: 700;
      color: ${colors.primary};
      margin-bottom: 12pt;
    }

    .scenario-probability {
      font-size: 11pt;
      color: ${colors.muted};
      margin-bottom: 16pt;
    }

    .scenario-outcomes {
      text-align: left;
    }

    .outcome-item {
      display: flex;
      justify-content: space-between;
      padding: 6pt 0;
      border-bottom: 1px dotted ${colors.background};
      font-size: 9pt;
    }

    .outcome-item:last-child {
      border-bottom: none;
    }

    .outcome-value {
      font-weight: 600;
      color: ${colors.primary};
    }

    /* Scenario Comparison */
    .scenario-comparison {
      background: white;
      border: 1px solid ${colors.background};
      border-radius: 8pt;
      padding: 16pt;
      margin: 1em 0;
    }

    .comparison-header {
      display: grid;
      grid-template-columns: 1fr repeat(3, 120pt);
      gap: 12pt;
      padding-bottom: 12pt;
      border-bottom: 2px solid ${colors.primary};
      font-weight: 700;
      color: ${colors.primary};
    }

    .comparison-row {
      display: grid;
      grid-template-columns: 1fr repeat(3, 120pt);
      gap: 12pt;
      padding: 8pt 0;
      border-bottom: 1px solid ${colors.background};
      align-items: center;
    }

    .comparison-row:last-child {
      border-bottom: none;
    }

    .comparison-value {
      text-align: right;
      font-weight: 500;
    }
  `;
}

/**
 * Generates responsive layout utilities for different screen sizes
 */
export function generateResponsiveStyles(): string {
  return `
    /* Responsive Utilities */
    @media screen and (max-width: 768px) {
      .report-page {
        padding: 16pt;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .charts-grid {
        grid-template-columns: 1fr;
      }

      .scenario-grid {
        grid-template-columns: 1fr;
      }

      .comparison-header,
      .comparison-row {
        grid-template-columns: 1fr;
        text-align: left;
      }

      .comparison-value {
        text-align: left;
      }
    }

    @media screen and (min-width: 1200px) {
      .report-page {
        max-width: 1000pt;
      }

      .metrics-grid {
        grid-template-columns: repeat(4, 1fr);
      }

      .charts-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    /* Print-specific responsive adjustments */
    @media print {
      .responsive-hide-print {
        display: none !important;
      }

      .force-page-break {
        page-break-before: always;
      }

      .avoid-page-break {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
  `;
}

// ===== MAIN STYLING FUNCTIONS =====

/**
 * Generates complete CSS stylesheet for a report
 */
export function generateReportStylesheet(tier: ReportTier): string {
  return [
    generateBaseStyles(tier),
    generateTypographyStyles(tier),
    generateHeaderFooterStyles(tier),
    generateMetricsStyles(tier),
    generateTableStyles(tier),
    generateChartStyles(tier),
    generateRecommendationStyles(tier),
    generateRiskStyles(tier),
    tier === 'enterprise' ? generateScenarioStyles(tier) : '',
    generateResponsiveStyles(),
  ].join('\n\n');
}

/**
 * Gets tier-specific styling configuration
 */
export function getTierStyling(tier: ReportTier): ReportStyling {
  const isEnterprise = tier === 'enterprise';

  return {
    colorScheme: isEnterprise ? ENTERPRISE_COLOR_SCHEME : PROFESSIONAL_COLOR_SCHEME,
    typography: {
      fonts: isEnterprise ? ENTERPRISE_TYPOGRAPHY : PROFESSIONAL_TYPOGRAPHY,
      lineHeight: 1.6,
      letterSpacing: 0,
      wordSpacing: 0,
      textAlign: 'justify',
    },
    pageLayout: {
      pageSize: 'letter',
      orientation: 'portrait',
      margins: {
        top: 72,    // 1 inch
        right: 72,  // 1 inch
        bottom: 72, // 1 inch
        left: 72,   // 1 inch
      },
      columns: 1,
      columnGap: 0,
    },
    headerFooter: {
      header: {
        enabled: true,
        content: '<h1>{{title}}</h1><div class="company-info">{{companyName}}<br>{{reportDate}}</div>',
        height: 100,
        styling: {
          backgroundColor: isEnterprise ? ENTERPRISE_COLOR_SCHEME.primary : PROFESSIONAL_COLOR_SCHEME.primary,
          backgroundImage: undefined,
          margins: { top: 0, right: 0, bottom: 20, left: 0 },
          orientation: 'portrait',
        },
      },
      footer: {
        enabled: true,
        content: '<div class="confidential">CONFIDENTIAL</div><div class="page-number">Page </div><div>{{generatedDate}}</div>',
        height: 50,
        styling: {
          backgroundColor: isEnterprise ? ENTERPRISE_COLOR_SCHEME.background : PROFESSIONAL_COLOR_SCHEME.background,
          backgroundImage: undefined,
          margins: { top: 20, right: 0, bottom: 0, left: 0 },
          orientation: 'portrait',
        },
      },
    },
    branding: {
      logo: {
        url: '',
        width: 150,
        height: 50,
        position: 'left',
      },
      companyName: 'GoodBuy Business Analysis',
      tagline: isEnterprise ? 'Strategic Excellence in Business Analysis' : 'Professional Business Insights',
      colors: isEnterprise ? ENTERPRISE_COLOR_SCHEME : PROFESSIONAL_COLOR_SCHEME,
      fonts: isEnterprise ? ENTERPRISE_TYPOGRAPHY : PROFESSIONAL_TYPOGRAPHY,
    },
  };
}

/**
 * Gets chart styling configuration for tier
 */
export function getChartStyling(tier: ReportTier) {
  const chartColors = tier === 'enterprise' ? ENTERPRISE_CHART_PALETTE : PROFESSIONAL_CHART_PALETTE;
  const colors = tier === 'enterprise' ? ENTERPRISE_COLOR_SCHEME : ENTERPRISE_COLOR_SCHEME;

  return {
    colors: {
      primary: chartColors.primary,
      secondary: chartColors.primary.slice(1),
      accent: [colors.accent],
      neutral: [chartColors.neutral],
    },
    fonts: tier === 'enterprise' ? ENTERPRISE_TYPOGRAPHY : PROFESSIONAL_TYPOGRAPHY,
    layout: {
      padding: 16,
      margin: 8,
      spacing: 12,
      alignment: 'center' as const,
    },
    borders: {
      width: 1,
      style: 'solid' as const,
      color: colors.background,
      radius: 4,
    },
    background: {
      color: 'white',
      opacity: 1,
      repeat: 'no-repeat' as const,
    },
    animations: {
      enabled: false, // Disabled for print
      duration: 0,
      easing: 'linear' as const,
      delay: 0,
    },
  };
}

/**
 * Utility functions for dynamic styling
 */
export const StyleUtils = {
  /**
   * Converts color to print-safe version
   */
  toPrintColor: (color: string): string => {
    // Ensure colors are dark enough for print
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;

      if (brightness > 200) {
        // Too light for print, darken it
        return `#${Math.floor(r * 0.7).toString(16).padStart(2, '0')}${Math.floor(g * 0.7).toString(16).padStart(2, '0')}${Math.floor(b * 0.7).toString(16).padStart(2, '0')}`;
      }
    }
    return color;
  },

  /**
   * Gets appropriate text color for background
   */
  getContrastColor: (backgroundColor: string): string => {
    // Simple contrast calculation
    if (backgroundColor.includes('dark') || backgroundColor.includes('#2') || backgroundColor.includes('#1') || backgroundColor.includes('#0')) {
      return 'white';
    }
    return '#333333';
  },

  /**
   * Generates page break CSS for sections
   */
  getPageBreakCSS: (breakBefore: boolean = false, breakAfter: boolean = false, avoidBreak: boolean = false): string => {
    let css = '';
    if (breakBefore) css += 'page-break-before: always; break-before: page;';
    if (breakAfter) css += 'page-break-after: always; break-after: page;';
    if (avoidBreak) css += 'page-break-inside: avoid; break-inside: avoid;';
    return css;
  },

  /**
   * Converts points to pixels for screen display
   */
  pxToPt: (px: number): number => px * 0.75,
  ptToPx: (pt: number): number => pt * 1.33,
};

// All exports are already declared above with their definitions