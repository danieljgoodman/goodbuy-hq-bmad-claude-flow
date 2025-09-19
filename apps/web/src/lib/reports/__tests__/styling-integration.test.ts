/**
 * Unit Tests for Report Styling Integration
 *
 * Tests for the integration module that connects the styling system
 * with the template engine and report generator.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ReportStylingIntegration,
  createStylingIntegration,
  applyTierStyling,
  generateStyledHTML,
  getChartColors,
  getBrandColors,
  SectionStylingOptions,
  TableStylingOptions,
  MetricData,
  TableData,
  RecommendationData,
  RiskData,
  ScenarioData,
} from '../styling-integration';

import {
  ReportGenerationConfig,
  ReportTier,
  ChartConfiguration,
  ReportSectionType,
} from '@/types/enhanced-reports';

// Mock data for testing
const mockReportConfig: ReportGenerationConfig = {
  id: 'test-report-001',
  tier: 'professional',
  format: 'pdf',
  businessEvaluationId: 'eval-001',
  userId: 'user-001',
  template: {
    id: 'professional-template',
    name: 'Professional Analysis',
    description: 'Comprehensive business analysis',
    tier: 'professional',
    version: '1.0',
    sections: [],
    defaultStyling: {
      colorScheme: {
        primary: '#c96442',
        secondary: '#b05730',
        accent: '#9c87f5',
        background: '#ded8c4',
        text: '#3d3929',
        muted: '#83827d',
      },
      typography: {
        fonts: {
          headings: {
            family: 'Inter',
            size: 28,
            weight: 700,
            lineHeight: 1.2,
          },
          body: {
            family: 'Inter',
            size: 11,
            weight: 400,
            lineHeight: 1.6,
          },
          captions: {
            family: 'Inter',
            size: 9,
            weight: 500,
            lineHeight: 1.4,
          },
          monospace: {
            family: 'JetBrains Mono',
            size: 10,
            weight: 400,
            lineHeight: 1.5,
          },
        },
        lineHeight: 1.6,
        letterSpacing: 0,
        wordSpacing: 0,
        textAlign: 'justify',
      },
      pageLayout: {
        pageSize: 'letter',
        orientation: 'portrait',
        margins: { top: 72, right: 72, bottom: 72, left: 72 },
        columns: 1,
        columnGap: 0,
      },
      headerFooter: {
        header: {
          enabled: true,
          content: '<h1>{{title}}</h1>',
          height: 100,
          styling: {
            backgroundColor: '#c96442',
            margins: { top: 0, right: 0, bottom: 20, left: 0 },
            orientation: 'portrait',
          },
        },
        footer: {
          enabled: true,
          content: '<div>Page {{page}}</div>',
          height: 50,
          styling: {
            backgroundColor: '#ded8c4',
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
        colors: {
          primary: '#c96442',
          secondary: '#b05730',
          accent: '#9c87f5',
          background: '#ded8c4',
          text: '#3d3929',
          muted: '#83827d',
        },
        fonts: {
          headings: {
            family: 'Inter',
            size: 28,
            weight: 700,
            lineHeight: 1.2,
          },
          body: {
            family: 'Inter',
            size: 11,
            weight: 400,
            lineHeight: 1.6,
          },
          captions: {
            family: 'Inter',
            size: 9,
            weight: 500,
            lineHeight: 1.4,
          },
          monospace: {
            family: 'JetBrains Mono',
            size: 10,
            weight: 400,
            lineHeight: 1.5,
          },
        },
      },
    },
    customizationOptions: [],
    supportsScenarios: false,
    estimatedGenerationTime: 120,
  },
  styling: {
    colorScheme: {
      primary: '#c96442',
      secondary: '#b05730',
      accent: '#9c87f5',
      background: '#ded8c4',
      text: '#3d3929',
      muted: '#83827d',
    },
    typography: {
      fonts: {
        headings: {
          family: 'Inter',
          size: 28,
          weight: 700,
          lineHeight: 1.2,
        },
        body: {
          family: 'Inter',
          size: 11,
          weight: 400,
          lineHeight: 1.6,
        },
        captions: {
          family: 'Inter',
          size: 9,
          weight: 500,
          lineHeight: 1.4,
        },
        monospace: {
          family: 'JetBrains Mono',
          size: 10,
          weight: 400,
          lineHeight: 1.5,
        },
      },
      lineHeight: 1.6,
      letterSpacing: 0,
      wordSpacing: 0,
      textAlign: 'justify',
    },
    pageLayout: {
      pageSize: 'letter',
      orientation: 'portrait',
      margins: { top: 72, right: 72, bottom: 72, left: 72 },
      columns: 1,
      columnGap: 0,
    },
    headerFooter: {
      header: {
        enabled: true,
        content: '<h1>{{title}}</h1>',
        height: 100,
        styling: {
          backgroundColor: '#c96442',
          margins: { top: 0, right: 0, bottom: 20, left: 0 },
          orientation: 'portrait',
        },
      },
      footer: {
        enabled: true,
        content: '<div>Page {{page}}</div>',
        height: 50,
        styling: {
          backgroundColor: '#ded8c4',
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
      colors: {
        primary: '#c96442',
        secondary: '#b05730',
        accent: '#9c87f5',
        background: '#ded8c4',
        text: '#3d3929',
        muted: '#83827d',
      },
      fonts: {
        headings: {
          family: 'Inter',
          size: 28,
          weight: 700,
          lineHeight: 1.2,
        },
        body: {
          family: 'Inter',
          size: 11,
          weight: 400,
          lineHeight: 1.6,
        },
        captions: {
          family: 'Inter',
          size: 9,
          weight: 500,
          lineHeight: 1.4,
        },
        monospace: {
          family: 'JetBrains Mono',
          size: 10,
          weight: 400,
          lineHeight: 1.5,
        },
      },
    },
  },
  delivery: {
    method: 'download',
    encryption: {
      enabled: false,
      algorithm: 'AES-256',
      keyId: '',
    },
    accessControl: {
      visibility: 'private',
      allowedUsers: [],
      passwordProtected: false,
    },
    retentionPolicy: {
      retentionPeriod: 90,
      autoDelete: false,
      archiveAfter: 30,
    },
  },
  metadata: {
    reportId: 'test-report-001',
    version: '1.0',
    tier: 'professional',
    generatedAt: new Date(),
    generatedBy: 'user-001',
    sourceEvaluationId: 'eval-001',
    title: 'Test Business Analysis',
    companyName: 'Test Company',
    analysisPeriod: {
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
    },
    status: 'generating',
    performance: {
      startTime: new Date(),
      endTime: new Date(),
      durationMs: 1000,
      memoryUsage: 100,
      tokensGenerated: 500,
      pagesGenerated: 10,
    },
    tags: ['test'],
  },
  createdAt: new Date(),
};

const mockChartConfig: ChartConfiguration = {
  id: 'test-chart-001',
  title: 'Revenue Trends',
  type: 'line',
  dataSource: {
    type: 'evaluation_data',
    path: 'financials.revenue',
    transformations: [],
    filters: [],
    timePeriod: 'historical',
  },
  styling: {
    colors: {
      primary: ['#c96442'],
      secondary: ['#b05730'],
      accent: ['#9c87f5'],
      neutral: ['#6b7280'],
    },
    fonts: {
      headings: {
        family: 'Inter',
        size: 28,
        weight: 700,
        lineHeight: 1.2,
      },
      body: {
        family: 'Inter',
        size: 11,
        weight: 400,
        lineHeight: 1.6,
      },
      captions: {
        family: 'Inter',
        size: 9,
        weight: 500,
        lineHeight: 1.4,
      },
      monospace: {
        family: 'JetBrains Mono',
        size: 10,
        weight: 400,
        lineHeight: 1.5,
      },
    },
    layout: {
      padding: 16,
      margin: 8,
      spacing: 12,
      alignment: 'center',
    },
    borders: {
      width: 1,
      style: 'solid',
      color: '#ded8c4',
      radius: 4,
    },
    background: {
      color: 'white',
      opacity: 1,
      repeat: 'no-repeat',
    },
    animations: {
      enabled: false,
      duration: 0,
      easing: 'linear',
      delay: 0,
    },
  },
  axes: [],
  series: [
    {
      id: 'revenue',
      name: 'Revenue',
      type: 'line',
      dataPath: 'revenue',
      styling: {
        color: '#c96442',
        lineWidth: 2,
        markerSize: 4,
        markerStyle: 'circle',
        fill: false,
        fillOpacity: 0.2,
      },
      yAxis: 'primary',
    },
  ],
  interactions: [],
  exportOptions: {
    formats: ['png', 'svg'],
    resolution: 300,
    includeData: false,
  },
};

describe('ReportStylingIntegration', () => {
  let integration: ReportStylingIntegration;

  beforeEach(() => {
    integration = ReportStylingIntegration.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ReportStylingIntegration.getInstance();
      const instance2 = ReportStylingIntegration.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should create instance through factory function', () => {
      const factoryInstance = createStylingIntegration();
      const directInstance = ReportStylingIntegration.getInstance();

      expect(factoryInstance).toBe(directInstance);
    });
  });

  describe('Configuration Styling', () => {
    it('should apply tier-specific styling to Professional config', () => {
      const styledConfig = integration.applyStylingToConfig(mockReportConfig);

      expect(styledConfig.tier).toBe('professional');
      expect(styledConfig.styling.colorScheme.primary).toBe('#c96442');
      expect(styledConfig.styling.typography.fonts.headings.family).toContain('Inter');
    });

    it('should apply tier-specific styling to Enterprise config', () => {
      const enterpriseConfig = { ...mockReportConfig, tier: 'enterprise' as ReportTier };
      const styledConfig = integration.applyStylingToConfig(enterpriseConfig);

      expect(styledConfig.tier).toBe('enterprise');
      expect(styledConfig.styling.colorScheme.primary).toBe('#2c1810');
      expect(styledConfig.styling.typography.fonts.headings.family).toContain('Playfair Display');
    });

    it('should merge custom styles with tier styling', () => {
      const configWithCustom = {
        ...mockReportConfig,
        styling: {
          ...mockReportConfig.styling,
          customStyles: '.custom { color: red; }',
        },
      };

      const styledConfig = integration.applyStylingToConfig(configWithCustom);

      expect(styledConfig.styling.customStyles).toContain('.custom { color: red; }');
    });
  });

  describe('Stylesheet Generation', () => {
    it('should generate stylesheet for Professional tier', () => {
      const stylesheet = integration.generateStylesheet('professional');

      expect(stylesheet).toContain('/* Base Document Styles */');
      expect(stylesheet).toContain('#c96442'); // Professional primary color
      expect(stylesheet).toContain('Inter'); // Professional font
    });

    it('should generate stylesheet for Enterprise tier', () => {
      const stylesheet = integration.generateStylesheet('enterprise');

      expect(stylesheet).toContain('/* Base Document Styles */');
      expect(stylesheet).toContain('#2c1810'); // Enterprise primary color
      expect(stylesheet).toContain('Playfair Display'); // Enterprise font
    });

    it('should cache generated stylesheets', () => {
      const stylesheet1 = integration.generateStylesheet('professional');
      const stylesheet2 = integration.generateStylesheet('professional');

      expect(stylesheet1).toBe(stylesheet2); // Same reference due to caching
    });

    it('should include custom styles when provided', () => {
      const customStyles = '.custom-class { font-weight: bold; }';
      const stylesheet = integration.generateStylesheet('professional', customStyles);

      expect(stylesheet).toContain('/* Custom Styles */');
      expect(stylesheet).toContain(customStyles);
    });
  });

  describe('Chart Styling', () => {
    it('should apply tier-specific styling to chart configuration', () => {
      const styledChart = integration.styleChartConfiguration(mockChartConfig, 'professional');

      expect(styledChart.styling.colors.primary).toContain('#c96442');
      expect(styledChart.styling.fonts.headings.family).toContain('Inter');
      expect(styledChart.styling.animations.enabled).toBe(false); // Disabled for print
    });

    it('should apply Enterprise styling to chart configuration', () => {
      const styledChart = integration.styleChartConfiguration(mockChartConfig, 'enterprise');

      expect(styledChart.styling.colors.primary).toContain('#2c1810');
      expect(styledChart.styling.fonts.headings.family).toContain('Playfair Display');
    });
  });

  describe('HTML Structure Generation', () => {
    it('should generate complete HTML structure with styling', () => {
      const content = '<h1>Test Report</h1><p>Content here</p>';
      const html = integration.generateStyledHTMLStructure('professional', content);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('<style>');
      expect(html).toContain(content);
      expect(html).toContain('#c96442'); // Professional colors
    });

    it('should include print-specific styles', () => {
      const html = integration.generateStyledHTMLStructure('professional', '<div>Test</div>');

      expect(html).toContain('@media print');
      expect(html).toContain('-webkit-print-color-adjust: exact');
      expect(html).toContain('@page');
    });

    it('should include responsive meta tag', () => {
      const html = integration.generateStyledHTMLStructure('professional', '<div>Test</div>');

      expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
    });
  });

  describe('Section Content Wrapping', () => {
    it('should wrap section content with appropriate classes', () => {
      const content = '<h2>Financial Analysis</h2><p>Content</p>';
      const wrapped = integration.wrapSectionContent('financial_analysis', content, 'professional');

      expect(wrapped).toContain('<section class="financial-analysis-section"');
      expect(wrapped).toContain('data-section="financial_analysis"');
      expect(wrapped).toContain(content);
    });

    it('should apply page break options', () => {
      const options: SectionStylingOptions = {
        pageBreakBefore: true,
        avoidPageBreak: true,
        customClass: 'custom-section',
      };

      const wrapped = integration.wrapSectionContent('executive_summary', '<div>Test</div>', 'professional', options);

      expect(wrapped).toContain('page-break');
      expect(wrapped).toContain('no-page-break');
      expect(wrapped).toContain('custom-section');
    });
  });

  describe('Chart HTML Generation', () => {
    it('should generate styled chart HTML', () => {
      const chartImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const chartHTML = integration.generateStyledChart(mockChartConfig, 'professional', chartImageUrl);

      expect(chartHTML).toContain('<div class="chart-container"');
      expect(chartHTML).toContain(`data-chart-id="${mockChartConfig.id}"`);
      expect(chartHTML).toContain(`<h3 class="chart-title">${mockChartConfig.title}</h3>`);
      expect(chartHTML).toContain(`<img src="${chartImageUrl}"`);
    });

    it('should include chart legend when multiple series', () => {
      const multiSeriesChart = {
        ...mockChartConfig,
        series: [
          ...mockChartConfig.series,
          {
            id: 'profit',
            name: 'Profit',
            type: 'line' as const,
            dataPath: 'profit',
            styling: {
              color: '#b05730',
              lineWidth: 2,
              markerSize: 4,
              markerStyle: 'circle' as const,
              fill: false,
              fillOpacity: 0.2,
            },
            yAxis: 'primary',
          },
        ],
      };

      const chartHTML = integration.generateStyledChart(multiSeriesChart, 'professional', 'test.png');

      expect(chartHTML).toContain('<div class="chart-legend">');
      expect(chartHTML).toContain('Revenue');
      expect(chartHTML).toContain('Profit');
    });

    it('should include scenario note for scenario charts', () => {
      const scenarioChart = {
        ...mockChartConfig,
        dataSource: {
          ...mockChartConfig.dataSource,
          type: 'scenario' as const,
        },
      };

      const chartHTML = integration.generateStyledChart(scenarioChart, 'professional', 'test.png');

      expect(chartHTML).toContain('*Scenario-based projections');
    });
  });

  describe('Metrics Generation', () => {
    it('should generate styled metrics grid', () => {
      const metrics: MetricData[] = [
        {
          label: 'Revenue',
          value: 1000000,
          unit: 'currency',
          change: {
            value: 15.5,
            unit: '%',
            period: 'YoY',
          },
        },
        {
          label: 'Profit Margin',
          value: 23.5,
          unit: 'percentage',
        },
      ];

      const metricsHTML = integration.generateStyledMetrics(metrics, 'professional');

      expect(metricsHTML).toContain('<div class="metrics-grid">');
      expect(metricsHTML).toContain('<div class="metric-card">');
      expect(metricsHTML).toContain('$1,000,000'); // Formatted currency
      expect(metricsHTML).toContain('23.5%'); // Formatted percentage
      expect(metricsHTML).toContain('15.5%'); // Change indicator
    });
  });

  describe('Table Generation', () => {
    it('should generate styled data table', () => {
      const tableData: TableData = {
        title: 'Financial Summary',
        headers: [
          { label: 'Metric', numeric: false },
          { label: 'Value', numeric: true, type: 'currency' },
          { label: 'Change', numeric: true, type: 'percentage' },
        ],
        rows: [
          {
            cells: [
              { value: 'Revenue' },
              { value: 1000000 },
              { value: 15.5 },
            ],
          },
          {
            cells: [
              { value: 'Total' },
              { value: 1000000 },
              { value: 15.5 },
            ],
            isTotal: true,
          },
        ],
        caption: 'All figures in USD',
      };

      const tableHTML = integration.generateStyledTable(tableData, 'professional');

      expect(tableHTML).toContain('<div class="table-container">');
      expect(tableHTML).toContain('<h4 class="table-title">Financial Summary</h4>');
      expect(tableHTML).toContain('<table class="data-table');
      expect(tableHTML).toContain('$1,000,000'); // Formatted currency
      expect(tableHTML).toContain('15.5%'); // Formatted percentage
      expect(tableHTML).toContain('class="total-row"');
      expect(tableHTML).toContain('All figures in USD');
    });

    it('should apply table styling options', () => {
      const tableData: TableData = {
        headers: [{ label: 'Metric', numeric: false }],
        rows: [{ cells: [{ value: 'Test' }] }],
      };

      const options: TableStylingOptions = {
        financial: true,
        comparison: true,
      };

      const tableHTML = integration.generateStyledTable(tableData, 'professional', options);

      expect(tableHTML).toContain('financial-table');
      expect(tableHTML).toContain('comparison-table');
    });
  });

  describe('Recommendations Generation', () => {
    it('should generate styled recommendations section', () => {
      const recommendations: RecommendationData[] = [
        {
          title: 'Improve Operational Efficiency',
          description: 'Implement automated processes to reduce costs',
          priority: 'high',
          metrics: [
            {
              label: 'Investment',
              value: 50000,
              unit: 'currency',
            },
            {
              label: 'Expected ROI',
              value: 200,
              unit: 'percentage',
            },
          ],
          actionItems: [
            {
              text: 'Conduct process audit',
              timeline: '2-4 weeks',
            },
          ],
        },
      ];

      const recommendationsHTML = integration.generateStyledRecommendations(recommendations, 'professional');

      expect(recommendationsHTML).toContain('<div class="recommendations-section">');
      expect(recommendationsHTML).toContain('<div class="recommendation-item">');
      expect(recommendationsHTML).toContain('Improve Operational Efficiency');
      expect(recommendationsHTML).toContain('priority-high');
      expect(recommendationsHTML).toContain('$50,000'); // Formatted currency
      expect(recommendationsHTML).toContain('200.0%'); // Formatted percentage
      expect(recommendationsHTML).toContain('Action Items:');
      expect(recommendationsHTML).toContain('Conduct process audit');
    });
  });

  describe('Risk Assessment Generation', () => {
    it('should generate styled risk assessment', () => {
      const risks: RiskData[] = [
        {
          category: 'Financial',
          description: 'Customer concentration risk',
          level: 'medium',
        },
        {
          category: 'Operational',
          description: 'Key person dependency',
          level: 'high',
        },
      ];

      const riskHTML = integration.generateStyledRiskAssessment(risks, 'professional');

      expect(riskHTML).toContain('<div class="risk-assessment">');
      expect(riskHTML).toContain('<h2>Risk Analysis</h2>');
      expect(riskHTML).toContain('Financial Risks');
      expect(riskHTML).toContain('Operational Risks');
      expect(riskHTML).toContain('Customer concentration risk');
      expect(riskHTML).toContain('medium');
      expect(riskHTML).toContain('high');
    });
  });

  describe('Scenario Analysis Generation (Enterprise Only)', () => {
    it('should generate scenario analysis for Enterprise tier', () => {
      const scenarios: ScenarioData[] = [
        {
          name: 'Base Case',
          probability: 0.6,
          outcomes: [
            {
              label: 'Revenue',
              value: 1200000,
              unit: 'currency',
            },
            {
              label: 'Growth',
              value: 15,
              unit: 'percentage',
            },
          ],
        },
      ];

      const scenarioHTML = integration.generateStyledScenarioAnalysis(scenarios, 'enterprise');

      expect(scenarioHTML).toContain('<div class="scenario-analysis">');
      expect(scenarioHTML).toContain('<h2>Scenario Analysis</h2>');
      expect(scenarioHTML).toContain('Base Case');
      expect(scenarioHTML).toContain('60.0%'); // Probability
      expect(scenarioHTML).toContain('$1,200,000'); // Formatted currency
      expect(scenarioHTML).toContain('15.0%'); // Formatted percentage
    });

    it('should return empty string for Professional tier', () => {
      const scenarios: ScenarioData[] = [
        {
          name: 'Base Case',
          probability: 0.6,
          outcomes: [],
        },
      ];

      const scenarioHTML = integration.generateStyledScenarioAnalysis(scenarios, 'professional');

      expect(scenarioHTML).toBe('');
    });
  });
});

describe('Utility Functions', () => {
  describe('applyTierStyling', () => {
    it('should apply tier styling through utility function', () => {
      const styledConfig = applyTierStyling(mockReportConfig);

      expect(styledConfig.styling.colorScheme.primary).toBe('#c96442');
      expect(styledConfig.styling.typography.fonts.headings.family).toContain('Inter');
    });

    it('should apply customizations when provided', () => {
      const customizations = {
        colorScheme: {
          primary: '#custom-color',
          secondary: '#custom-secondary',
          accent: '#custom-accent',
          background: '#custom-bg',
          text: '#custom-text',
          muted: '#custom-muted',
        },
      };

      const styledConfig = applyTierStyling(mockReportConfig, customizations);

      expect(styledConfig.styling.colorScheme.primary).toBe('#custom-color');
    });
  });

  describe('generateStyledHTML', () => {
    it('should generate styled HTML through utility function', () => {
      const html = generateStyledHTML('professional', '<div>Test Content</div>');

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<div>Test Content</div>');
      expect(html).toContain('#c96442'); // Professional colors
    });
  });

  describe('getChartColors', () => {
    it('should return Professional chart colors', () => {
      const colors = getChartColors('professional');

      expect(colors).toContain('#c96442');
      expect(colors).toContain('#b05730');
      expect(colors).toContain('#9c87f5');
    });

    it('should return Enterprise chart colors', () => {
      const colors = getChartColors('enterprise');

      expect(colors).toContain('#2c1810');
      expect(colors).toContain('#1e3a8a');
      expect(colors).toContain('#7c3aed');
    });
  });

  describe('getBrandColors', () => {
    it('should return Professional brand colors', () => {
      const colors = getBrandColors('professional');

      expect(colors.primary).toBe('#c96442');
      expect(colors.secondary).toBe('#b05730');
      expect(colors.background).toBe('#ded8c4');
    });

    it('should return Enterprise brand colors', () => {
      const colors = getBrandColors('enterprise');

      expect(colors.primary).toBe('#2c1810');
      expect(colors.secondary).toBe('#1e3a8a');
      expect(colors.background).toBe('#f8f6f3');
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  let integration: ReportStylingIntegration;

  beforeEach(() => {
    integration = ReportStylingIntegration.getInstance();
  });

  it('should handle empty metric arrays gracefully', () => {
    const metricsHTML = integration.generateStyledMetrics([], 'professional');

    expect(metricsHTML).toContain('<div class="metrics-grid">');
    expect(metricsHTML).toContain('</div>');
  });

  it('should handle empty table data gracefully', () => {
    const emptyTable: TableData = {
      headers: [],
      rows: [],
    };

    const tableHTML = integration.generateStyledTable(emptyTable, 'professional');

    expect(tableHTML).toContain('<table class="data-table');
    expect(tableHTML).toContain('<thead>');
    expect(tableHTML).toContain('<tbody>');
  });

  it('should handle missing chart series gracefully', () => {
    const chartWithoutSeries = {
      ...mockChartConfig,
      series: [],
    };

    const chartHTML = integration.generateStyledChart(chartWithoutSeries, 'professional', 'test.png');

    expect(chartHTML).toContain('<div class="chart-container"');
    expect(chartHTML).not.toContain('<div class="chart-legend">');
  });

  it('should format null/undefined values in tables', () => {
    const tableData: TableData = {
      headers: [{ label: 'Value', numeric: true }],
      rows: [
        { cells: [{ value: null }] },
        { cells: [{ value: undefined }] },
      ],
    };

    const tableHTML = integration.generateStyledTable(tableData, 'professional');

    expect(tableHTML).toContain('<td class="numeric">-</td>');
  });

  it('should handle invalid section types gracefully', () => {
    const wrapped = integration.wrapSectionContent(
      'invalid_section' as ReportSectionType,
      '<div>Test</div>',
      'professional'
    );

    expect(wrapped).toContain('class="report-section"'); // Falls back to default class
  });
});

describe('Performance and Caching', () => {
  let integration: ReportStylingIntegration;

  beforeEach(() => {
    integration = ReportStylingIntegration.getInstance();
  });

  it('should cache stylesheets efficiently', () => {
    const startTime = Date.now();

    // First call - should generate
    integration.generateStylesheet('professional');

    const firstCallTime = Date.now() - startTime;

    const secondStartTime = Date.now();

    // Second call - should use cache
    integration.generateStylesheet('professional');

    const secondCallTime = Date.now() - secondStartTime;

    // Cache should be significantly faster
    expect(secondCallTime).toBeLessThan(firstCallTime);
  });

  it('should handle large metric arrays efficiently', () => {
    const largeMetricsArray: MetricData[] = Array.from({ length: 100 }, (_, i) => ({
      label: `Metric ${i}`,
      value: Math.random() * 1000000,
      unit: 'currency',
    }));

    const startTime = Date.now();
    const metricsHTML = integration.generateStyledMetrics(largeMetricsArray, 'professional');
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    expect(metricsHTML).toContain('<div class="metrics-grid">');
  });
});