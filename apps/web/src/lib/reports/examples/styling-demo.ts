/**
 * Report Styling System Demo
 *
 * Demonstrates the complete usage of the professional report styling system
 * with tier-specific branding and comprehensive styling features.
 */

import {
  generateReportStylesheet,
  getTierStyling,
  PROFESSIONAL_COLOR_SCHEME,
  ENTERPRISE_COLOR_SCHEME,
} from '../report-styling';

import {
  ReportStylingIntegration,
  applyTierStyling,
  generateStyledHTML,
  getChartColors,
  getBrandColors,
  MetricData,
  TableData,
  RecommendationData,
  RiskData,
  ScenarioData,
} from '../styling-integration';

import { ReportGenerationConfig, ReportTier } from '@/types/enhanced-reports';

/**
 * Demo: Generate complete styled report
 */
export function generateStyledReportDemo(tier: ReportTier): string {
  const stylingIntegration = ReportStylingIntegration.getInstance();

  // Sample data
  const metrics: MetricData[] = [
    {
      label: 'Annual Revenue',
      value: 2500000,
      unit: 'currency',
      change: {
        value: 18.5,
        unit: '%',
        period: 'YoY',
      },
    },
    {
      label: 'Profit Margin',
      value: 24.8,
      unit: 'percentage',
      change: {
        value: 3.2,
        unit: '%',
        period: 'YoY',
      },
    },
    {
      label: 'Growth Rate',
      value: 15.6,
      unit: 'percentage',
    },
    {
      label: 'Market Share',
      value: 12.4,
      unit: 'percentage',
    },
  ];

  const tableData: TableData = {
    title: 'Financial Performance Summary',
    headers: [
      { label: 'Metric', numeric: false },
      { label: '2022', numeric: true, type: 'currency' },
      { label: '2023', numeric: true, type: 'currency' },
      { label: '2024', numeric: true, type: 'currency' },
      { label: 'Change', numeric: true, type: 'percentage' },
    ],
    rows: [
      {
        cells: [
          { value: 'Revenue' },
          { value: 2100000 },
          { value: 2300000 },
          { value: 2500000 },
          { value: 18.5 },
        ],
      },
      {
        cells: [
          { value: 'Gross Profit' },
          { value: 1260000 },
          { value: 1495000 },
          { value: 1750000 },
          { value: 22.1 },
        ],
      },
      {
        cells: [
          { value: 'Net Income' },
          { value: 420000 },
          { value: 506000 },
          { value: 620000 },
          { value: 24.8 },
        ],
        isTotal: true,
      },
    ],
    caption: 'All figures in USD. Change calculated year-over-year for 2024.',
  };

  const recommendations: RecommendationData[] = [
    {
      title: 'Expand Digital Marketing Channels',
      description: 'Invest in digital marketing infrastructure to capture online market growth and improve customer acquisition efficiency.',
      priority: 'high',
      metrics: [
        {
          label: 'Investment Required',
          value: 150000,
          unit: 'currency',
        },
        {
          label: 'Expected ROI',
          value: 280,
          unit: 'percentage',
        },
        {
          label: 'Payback Period',
          value: 18,
          unit: 'months',
        },
      ],
      actionItems: [
        {
          text: 'Conduct digital marketing audit and competitive analysis',
          timeline: '2-3 weeks',
        },
        {
          text: 'Develop integrated digital marketing strategy',
          timeline: '4-6 weeks',
        },
        {
          text: 'Implement new marketing automation platform',
          timeline: '8-12 weeks',
        },
      ],
    },
    {
      title: 'Optimize Supply Chain Operations',
      description: 'Streamline supply chain processes to reduce costs and improve delivery times.',
      priority: 'medium',
      metrics: [
        {
          label: 'Cost Savings',
          value: 200000,
          unit: 'currency',
        },
        {
          label: 'Efficiency Gain',
          value: 15,
          unit: 'percentage',
        },
      ],
      actionItems: [
        {
          text: 'Evaluate current supplier relationships',
          timeline: '3-4 weeks',
        },
        {
          text: 'Implement inventory management system',
          timeline: '6-8 weeks',
        },
      ],
    },
  ];

  const risks: RiskData[] = [
    {
      category: 'Market',
      description: 'Economic recession could reduce customer demand',
      level: 'medium',
    },
    {
      category: 'Operational',
      description: 'Key supplier concentration presents supply chain risk',
      level: 'high',
    },
    {
      category: 'Financial',
      description: 'Currency exchange rate fluctuations affect international sales',
      level: 'low',
    },
    {
      category: 'Technology',
      description: 'Legacy systems may not scale with business growth',
      level: 'medium',
    },
  ];

  const scenarios: ScenarioData[] = tier === 'enterprise' ? [
    {
      name: 'Conservative Growth',
      probability: 0.3,
      outcomes: [
        {
          label: 'Revenue',
          value: 2750000,
          unit: 'currency',
        },
        {
          label: 'Net Income',
          value: 550000,
          unit: 'currency',
        },
        {
          label: 'Growth Rate',
          value: 8.5,
          unit: 'percentage',
        },
      ],
    },
    {
      name: 'Base Case',
      probability: 0.5,
      outcomes: [
        {
          label: 'Revenue',
          value: 3000000,
          unit: 'currency',
        },
        {
          label: 'Net Income',
          value: 720000,
          unit: 'currency',
        },
        {
          label: 'Growth Rate',
          value: 15.6,
          unit: 'percentage',
        },
      ],
    },
    {
      name: 'Aggressive Growth',
      probability: 0.2,
      outcomes: [
        {
          label: 'Revenue',
          value: 3500000,
          unit: 'currency',
        },
        {
          label: 'Net Income',
          value: 945000,
          unit: 'currency',
        },
        {
          label: 'Growth Rate',
          value: 28.2,
          unit: 'percentage',
        },
      ],
    },
  ] : [];

  // Generate styled components
  const reportSections = [
    stylingIntegration.wrapSectionContent(
      'executive_summary',
      '<h2>Executive Summary</h2><p>This comprehensive business analysis reveals strong financial performance with significant growth opportunities. Key findings include robust revenue growth, improving profit margins, and strategic positioning for market expansion.</p>',
      tier,
      { pageBreakBefore: false, avoidPageBreak: true }
    ),

    stylingIntegration.wrapSectionContent(
      'financial_analysis',
      `
        <h2>Financial Analysis</h2>
        <p>The company demonstrates exceptional financial performance across all key metrics:</p>
        ${stylingIntegration.generateStyledMetrics(metrics, tier)}
        ${stylingIntegration.generateStyledTable(tableData, tier, { financial: true })}
      `,
      tier,
      { pageBreakBefore: true, avoidPageBreak: true }
    ),

    stylingIntegration.wrapSectionContent(
      'investment_recommendations',
      stylingIntegration.generateStyledRecommendations(recommendations, tier),
      tier,
      { pageBreakBefore: true, avoidPageBreak: true }
    ),

    stylingIntegration.wrapSectionContent(
      'risk_analysis',
      stylingIntegration.generateStyledRiskAssessment(risks, tier),
      tier,
      { pageBreakBefore: true, avoidPageBreak: true }
    ),
  ];

  // Add scenario analysis for Enterprise tier
  if (tier === 'enterprise' && scenarios.length > 0) {
    reportSections.push(
      stylingIntegration.wrapSectionContent(
        'scenario_analysis',
        stylingIntegration.generateStyledScenarioAnalysis(scenarios, tier),
        tier,
        { pageBreakBefore: true, avoidPageBreak: true }
      )
    );
  }

  const reportContent = reportSections.join('\n');

  // Generate complete styled HTML
  return stylingIntegration.generateStyledHTMLStructure(tier, reportContent);
}

/**
 * Demo: Color scheme comparison
 */
export function demonstrateColorSchemes(): void {
  console.log('=== Professional Tier Color Scheme ===');
  console.log('Primary:', PROFESSIONAL_COLOR_SCHEME.primary);
  console.log('Secondary:', PROFESSIONAL_COLOR_SCHEME.secondary);
  console.log('Accent:', PROFESSIONAL_COLOR_SCHEME.accent);
  console.log('Background:', PROFESSIONAL_COLOR_SCHEME.background);
  console.log('Text:', PROFESSIONAL_COLOR_SCHEME.text);
  console.log('Muted:', PROFESSIONAL_COLOR_SCHEME.muted);

  console.log('\n=== Enterprise Tier Color Scheme ===');
  console.log('Primary:', ENTERPRISE_COLOR_SCHEME.primary);
  console.log('Secondary:', ENTERPRISE_COLOR_SCHEME.secondary);
  console.log('Accent:', ENTERPRISE_COLOR_SCHEME.accent);
  console.log('Background:', ENTERPRISE_COLOR_SCHEME.background);
  console.log('Text:', ENTERPRISE_COLOR_SCHEME.text);
  console.log('Muted:', ENTERPRISE_COLOR_SCHEME.muted);

  console.log('\n=== Chart Colors ===');
  console.log('Professional Chart Colors:', getChartColors('professional'));
  console.log('Enterprise Chart Colors:', getChartColors('enterprise'));
}

/**
 * Demo: Stylesheet generation
 */
export function demonstrateStylesheetGeneration(): void {
  console.log('=== Generating Professional Stylesheet ===');
  const professionalStylesheet = generateReportStylesheet('professional');
  console.log(`Professional stylesheet length: ${professionalStylesheet.length} characters`);

  console.log('\n=== Generating Enterprise Stylesheet ===');
  const enterpriseStylesheet = generateReportStylesheet('enterprise');
  console.log(`Enterprise stylesheet length: ${enterpriseStylesheet.length} characters`);

  // Show differences
  const hasScenarios = enterpriseStylesheet.includes('.scenario-analysis');
  console.log(`\nEnterprise stylesheet includes scenario styles: ${hasScenarios}`);

  const professionalHasScenarios = professionalStylesheet.includes('.scenario-analysis');
  console.log(`Professional stylesheet includes scenario styles: ${professionalHasScenarios}`);
}

/**
 * Demo: Typography differences
 */
export function demonstrateTypographyDifferences(): void {
  const professionalStyling = getTierStyling('professional');
  const enterpriseStyling = getTierStyling('enterprise');

  console.log('=== Typography Comparison ===');
  console.log('Professional Headings Font:', professionalStyling.typography.fonts.headings.family);
  console.log('Professional Headings Size:', professionalStyling.typography.fonts.headings.size);
  console.log('Professional Body Font:', professionalStyling.typography.fonts.body.family);
  console.log('Professional Body Size:', professionalStyling.typography.fonts.body.size);

  console.log('\nEnterprise Headings Font:', enterpriseStyling.typography.fonts.headings.family);
  console.log('Enterprise Headings Size:', enterpriseStyling.typography.fonts.headings.size);
  console.log('Enterprise Body Font:', enterpriseStyling.typography.fonts.body.family);
  console.log('Enterprise Body Size:', enterpriseStyling.typography.fonts.body.size);
}

/**
 * Demo: Print optimization features
 */
export function demonstratePrintOptimization(): void {
  const stylesheet = generateReportStylesheet('professional');

  console.log('=== Print Optimization Features ===');
  console.log('Includes @media print:', stylesheet.includes('@media print'));
  console.log('Includes print-color-adjust:', stylesheet.includes('print-color-adjust'));
  console.log('Includes page-break rules:', stylesheet.includes('page-break'));
  console.log('Includes @page rules:', stylesheet.includes('@page'));

  // Extract print-specific styles
  const printStyles = stylesheet.match(/@media print[^}]*{[^}]*}/g);
  console.log(`\nNumber of print-specific style blocks: ${printStyles?.length || 0}`);
}

/**
 * Demo: Custom styling integration
 */
export function demonstrateCustomStyling(): string {
  const stylingIntegration = ReportStylingIntegration.getInstance();

  const customStyles = `
    .custom-highlight {
      background: linear-gradient(135deg, #c96442 0%, #e97a56 100%);
      color: white;
      padding: 16pt;
      border-radius: 8pt;
      margin: 16pt 0;
    }

    .enterprise-premium {
      border-left: 4pt solid #7c3aed;
      background: #f8f6f3;
      padding: 20pt;
      border-radius: 0 8pt 8pt 0;
    }

    .financial-callout {
      background: #10b98120;
      border: 1px solid #10b981;
      padding: 12pt;
      border-radius: 6pt;
      margin: 12pt 0;
    }
  `;

  const stylesheetWithCustom = stylingIntegration.generateStylesheet('professional', customStyles);

  console.log('=== Custom Styling Integration ===');
  console.log('Includes custom highlight class:', stylesheetWithCustom.includes('.custom-highlight'));
  console.log('Includes enterprise premium class:', stylesheetWithCustom.includes('.enterprise-premium'));
  console.log('Includes financial callout class:', stylesheetWithCustom.includes('.financial-callout'));

  return stylesheetWithCustom;
}

/**
 * Demo: Complete integration test
 */
export function runCompleteDemo(): void {
  console.log('🎨 PROFESSIONAL REPORT STYLING SYSTEM DEMO\n');

  console.log('1. Color Schemes');
  console.log('═══════════════');
  demonstrateColorSchemes();

  console.log('\n2. Stylesheet Generation');
  console.log('════════════════════════');
  demonstrateStylesheetGeneration();

  console.log('\n3. Typography Differences');
  console.log('═════════════════════════');
  demonstrateTypographyDifferences();

  console.log('\n4. Print Optimization');
  console.log('════════════════════');
  demonstratePrintOptimization();

  console.log('\n5. Custom Styling');
  console.log('═════════════════');
  demonstrateCustomStyling();

  console.log('\n6. Complete Report Generation');
  console.log('════════════════════════════');

  // Generate sample reports for both tiers
  const professionalReport = generateStyledReportDemo('professional');
  const enterpriseReport = generateStyledReportDemo('enterprise');

  console.log(`Professional report HTML length: ${professionalReport.length} characters`);
  console.log(`Enterprise report HTML length: ${enterpriseReport.length} characters`);

  console.log('\nProfessional report includes:');
  console.log('- Executive Summary:', professionalReport.includes('Executive Summary'));
  console.log('- Financial Analysis:', professionalReport.includes('Financial Analysis'));
  console.log('- Recommendations:', professionalReport.includes('Strategic Recommendations'));
  console.log('- Risk Analysis:', professionalReport.includes('Risk Analysis'));
  console.log('- Scenario Analysis:', professionalReport.includes('Scenario Analysis'));

  console.log('\nEnterprise report includes:');
  console.log('- Executive Summary:', enterpriseReport.includes('Executive Summary'));
  console.log('- Financial Analysis:', enterpriseReport.includes('Financial Analysis'));
  console.log('- Recommendations:', enterpriseReport.includes('Strategic Recommendations'));
  console.log('- Risk Analysis:', enterpriseReport.includes('Risk Analysis'));
  console.log('- Scenario Analysis:', enterpriseReport.includes('Scenario Analysis'));

  console.log('\n✅ Demo completed successfully!');
  console.log('\nThe styling system provides:');
  console.log('• Tier-specific color schemes (Professional: brown/terracotta, Enterprise: deep brown/navy)');
  console.log('• Comprehensive CSS styling for all report components');
  console.log('• Print-optimized layouts with proper page breaks');
  console.log('• Chart and visualization styling utilities');
  console.log('• Consistent typography and spacing');
  console.log('• Integration with template engine and report generator');
}

// Export demo functions for external usage
export default {
  generateStyledReportDemo,
  demonstrateColorSchemes,
  demonstrateStylesheetGeneration,
  demonstrateTypographyDifferences,
  demonstratePrintOptimization,
  demonstrateCustomStyling,
  runCompleteDemo,
};