/**
 * Chart Generation Examples
 *
 * Demonstrates how to use the ChartGenerator and ChartIntegrationService
 * for generating high-quality charts in Professional and Enterprise tier reports
 */

import {
  ChartGenerator,
  ChartDataProcessor,
  defaultChartGenerator,
  type ChartDataInput,
  type ChartGeneratorConfig
} from '../chart-generator';
import {
  ChartIntegrationService,
  defaultChartIntegration,
  type ChartGenerationRequest,
  type GeneratedChart,
  embedChartInHTML
} from '../chart-integration';
import type { BusinessEvaluation } from '@/types/valuation';
import type { EnterpriseTierData } from '@/types/enterprise-evaluation';

/**
 * Example 1: Basic Chart Generation
 */
export async function basicChartExample(): Promise<string> {
  // Sample financial data
  const financialData: ChartDataInput = {
    labels: ['Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023'],
    datasets: [{
      label: 'Revenue',
      data: [250000, 280000, 320000, 350000],
      borderColor: '#0ea5e9',
      backgroundColor: '#0ea5e9'
    }, {
      label: 'Profit',
      data: [35000, 42000, 51000, 63000],
      borderColor: '#10b981',
      backgroundColor: '#10b981'
    }]
  };

  // Generate chart using default generator
  const chartImage = await defaultChartGenerator.generateFinancialTrendsChart(
    financialData,
    'professional'
  );

  console.log('✅ Financial trends chart generated successfully');
  return chartImage;
}

/**
 * Example 2: Customer Concentration Analysis
 */
export async function customerConcentrationExample(): Promise<string> {
  const customerData: ChartDataInput = {
    labels: [
      'Tech Corp Solutions',
      'Global Industries Ltd',
      'Regional Partners',
      'Small Business Clients',
      'Government Contracts'
    ],
    datasets: [{
      label: 'Revenue Distribution',
      data: [35, 25, 20, 15, 5] // Percentages
    }]
  };

  const chartImage = await defaultChartGenerator.generateCustomerConcentrationChart(
    customerData,
    'professional'
  );

  console.log('✅ Customer concentration chart generated successfully');
  return chartImage;
}

/**
 * Example 3: Competitive Positioning Radar
 */
export async function competitivePositioningExample(): Promise<string> {
  const competitiveData: ChartDataInput = {
    labels: [
      'Market Share',
      'Innovation',
      'Product Quality',
      'Price Competitiveness',
      'Customer Service',
      'Brand Recognition'
    ],
    datasets: [{
      label: 'Our Company',
      data: [7, 8, 9, 6, 8, 7] // Scores out of 10
    }, {
      label: 'Competitor A',
      data: [8, 6, 7, 8, 6, 9]
    }, {
      label: 'Competitor B',
      data: [5, 7, 6, 9, 7, 6]
    }]
  };

  const chartImage = await defaultChartGenerator.generateCompetitiveRadarChart(
    competitiveData,
    'enterprise'
  );

  console.log('✅ Competitive positioning chart generated successfully');
  return chartImage;
}

/**
 * Example 4: ROI Calculator Chart
 */
export async function roiCalculatorExample(): Promise<string> {
  const roiData: ChartDataInput = {
    labels: ['Year 1', 'Year 2', 'Year 3', 'Year 5'],
    datasets: [{
      label: 'Conservative Scenario',
      data: [12, 18, 25, 40] // ROI percentages
    }, {
      label: 'Base Case Scenario',
      data: [18, 28, 42, 68]
    }, {
      label: 'Optimistic Scenario',
      data: [25, 42, 65, 110]
    }]
  };

  const chartImage = await defaultChartGenerator.generateROICalculatorChart(
    roiData,
    'professional'
  );

  console.log('✅ ROI calculator chart generated successfully');
  return chartImage;
}

/**
 * Example 5: Enterprise Scenario Matrix
 */
export async function scenarioMatrixExample(): Promise<string> {
  const scenarioData: ChartDataInput = {
    labels: [
      'Conservative Growth',
      'Market Expansion',
      'Product Innovation',
      'Acquisition Strategy',
      'Digital Transformation',
      'International Expansion'
    ],
    datasets: [{
      label: 'Scenario Outcomes',
      data: [1200000, 1800000, 2200000, 3000000, 1600000, 2500000] // Values
    }],
    metadata: {
      risk: [3, 5, 7, 8, 4, 6], // Risk scores 1-10
      return: [15, 25, 35, 45, 20, 40] // Expected return percentages
    }
  };

  const chartImage = await defaultChartGenerator.generateScenarioMatrixChart(scenarioData);

  console.log('✅ Scenario matrix chart generated successfully');
  return chartImage;
}

/**
 * Example 6: Exit Strategy Waterfall
 */
export async function exitStrategyExample(): Promise<string> {
  const exitData: ChartDataInput = {
    labels: [
      'Current Valuation',
      'Operational Efficiency',
      'Revenue Growth',
      'Market Expansion',
      'Cost Optimization',
      'Strategic Positioning',
      'Exit Valuation'
    ],
    datasets: [{
      label: 'Value Creation Steps',
      data: [
        2000000,  // Current value
        300000,   // Operational improvements
        500000,   // Revenue growth
        400000,   // Market expansion
        200000,   // Cost optimization
        300000,   // Strategic positioning
        3700000   // Final exit value
      ]
    }]
  };

  const chartImage = await defaultChartGenerator.generateExitStrategyChart(exitData);

  console.log('✅ Exit strategy chart generated successfully');
  return chartImage;
}

/**
 * Example 7: Capital Structure Optimization
 */
export async function capitalStructureExample(): Promise<string> {
  const capitalData: ChartDataInput = {
    labels: ['Current Structure', 'Optimized Mix', 'Conservative Approach', 'Growth Focused'],
    datasets: [{
      label: 'Equity Financing',
      data: [1200000, 1400000, 1600000, 1000000]
    }, {
      label: 'Debt Financing',
      data: [800000, 600000, 400000, 1000000]
    }, {
      label: 'Retained Earnings',
      data: [500000, 600000, 700000, 400000]
    }]
  };

  const chartImage = await defaultChartGenerator.generateCapitalStructureChart(capitalData);

  console.log('✅ Capital structure chart generated successfully');
  return chartImage;
}

/**
 * Example 8: Strategic Options Analysis
 */
export async function strategicOptionsExample(): Promise<string> {
  const strategicData: ChartDataInput = {
    labels: [
      'Organic Growth',
      'Strategic Acquisition',
      'Joint Venture',
      'New Market Entry',
      'Product Development',
      'Digital Platform'
    ],
    datasets: [{
      label: 'Investment Required',
      data: [500000, 2000000, 750000, 1200000, 800000, 1500000]
    }],
    metadata: {
      risk: [3, 7, 4, 6, 5, 4], // Risk scores
      return: [18, 35, 22, 28, 25, 30] // Expected returns
    }
  };

  const chartImage = await defaultChartGenerator.generateStrategicOptionsChart(strategicData);

  console.log('✅ Strategic options chart generated successfully');
  return chartImage;
}

/**
 * Example 9: Complete Professional Report Charts
 */
export async function generateProfessionalReportCharts(
  evaluation: BusinessEvaluation
): Promise<GeneratedChart[]> {
  try {
    console.log('🚀 Generating Professional tier report charts...');

    // Mock professional report structure
    const mockReportStructure = {
      metadata: { reportId: 'prof-001', tier: 'professional' as const },
      coverPage: {},
      executiveSummary: {},
      businessOverview: {},
      financialAnalysis: {},
      operationalAssessment: {},
      strategicPositioning: {},
      riskAnalysis: {},
      investmentRecommendations: {},
      valuationSummary: {},
      appendices: {}
    };

    const charts = await defaultChartIntegration.generateProfessionalCharts(
      evaluation,
      mockReportStructure
    );

    console.log(`✅ Generated ${charts.length} professional charts:`);
    charts.forEach(chart => {
      console.log(`   - ${chart.title} (${chart.type})`);
    });

    return charts;
  } catch (error) {
    console.error('❌ Failed to generate professional charts:', error);
    throw error;
  }
}

/**
 * Example 10: Complete Enterprise Report Charts
 */
export async function generateEnterpriseReportCharts(
  evaluation: BusinessEvaluation,
  enterpriseData: EnterpriseTierData
): Promise<GeneratedChart[]> {
  try {
    console.log('🚀 Generating Enterprise tier report charts...');

    // Mock enterprise report structure
    const mockReportStructure = {
      metadata: { reportId: 'ent-001', tier: 'enterprise' as const },
      coverPage: {},
      executiveSummary: {},
      businessOverview: {},
      financialAnalysis: {},
      operationalAssessment: {},
      strategicPositioning: {},
      riskAnalysis: {},
      investmentRecommendations: {},
      valuationSummary: {},
      appendices: {},
      scenarioAnalysis: {},
      exitStrategy: {},
      capitalStructure: {},
      strategicOptions: {},
      multiYearProjections: {}
    };

    const charts = await defaultChartIntegration.generateEnterpriseCharts(
      evaluation,
      enterpriseData,
      mockReportStructure
    );

    console.log(`✅ Generated ${charts.length} enterprise charts:`);
    charts.forEach(chart => {
      console.log(`   - ${chart.title} (${chart.type})`);
    });

    return charts;
  } catch (error) {
    console.error('❌ Failed to generate enterprise charts:', error);
    throw error;
  }
}

/**
 * Example 11: Custom Chart Configuration
 */
export async function customChartConfigExample(): Promise<string> {
  // Create custom chart generator with specific settings
  const customConfig: ChartGeneratorConfig = {
    width: 1600,  // Higher resolution
    height: 1000,
    dpi: 400,     // Ultra-high DPI for print
    backgroundColor: '#fafafa',
    devicePixelRatio: 3,
    quality: 'print'
  };

  const customGenerator = new ChartGenerator(customConfig);

  const data: ChartDataInput = {
    labels: ['Product A', 'Product B', 'Product C', 'Product D'],
    datasets: [{
      label: 'Market Share',
      data: [35, 28, 22, 15]
    }]
  };

  const chartImage = await customGenerator.generateCustomerConcentrationChart(
    data,
    'enterprise',
    {
      format: 'base64',
      quality: 1.0,
      includeTitle: true,
      includeSubtitle: true,
      includeWatermark: false
    }
  );

  console.log('✅ Custom high-resolution chart generated');
  return chartImage;
}

/**
 * Example 12: Batch Chart Generation
 */
export async function batchChartGenerationExample(): Promise<GeneratedChart[]> {
  const requests: ChartGenerationRequest[] = [
    {
      chartType: 'financial-trends',
      tier: 'professional',
      title: 'Quarterly Financial Performance',
      subtitle: 'Revenue and profit trends over 4 quarters',
      data: {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [{
          label: 'Revenue',
          data: [100000, 120000, 135000, 150000]
        }]
      }
    },
    {
      chartType: 'customer-concentration',
      tier: 'professional',
      title: 'Customer Revenue Distribution',
      subtitle: 'Top customers by revenue contribution',
      data: {
        labels: ['Customer A', 'Customer B', 'Customer C', 'Others'],
        datasets: [{
          label: 'Revenue Share',
          data: [40, 25, 20, 15]
        }]
      }
    },
    {
      chartType: 'roi-calculator',
      tier: 'enterprise',
      title: 'Investment ROI Projections',
      subtitle: 'Expected returns across different scenarios',
      data: {
        labels: ['Conservative', 'Base Case', 'Optimistic'],
        datasets: [{
          label: 'ROI %',
          data: [15, 25, 40]
        }]
      }
    }
  ];

  console.log('🚀 Starting batch chart generation...');

  const charts = await defaultChartIntegration.generateChartBatch(requests);

  console.log(`✅ Batch generation complete: ${charts.length} charts created`);
  charts.forEach((chart, index) => {
    console.log(`   ${index + 1}. ${chart.title} (${chart.metadata.size} bytes)`);
  });

  return charts;
}

/**
 * Example 13: Chart Embedding in HTML
 */
export function chartEmbeddingExample(charts: GeneratedChart[]): string {
  console.log('📄 Generating HTML with embedded charts...');

  const chartSections = charts.map(chart => embedChartInHTML(chart)).join('\n\n');

  const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Business Analysis Report</title>
    <style>
        body { font-family: 'Inter', Arial, sans-serif; margin: 40px; }
        .chart-container { margin: 40px 0; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; }
        .chart-title { color: #1e293b; font-size: 1.5em; margin-bottom: 8px; }
        .chart-subtitle { color: #64748b; font-size: 1em; margin-bottom: 20px; }
        .chart-image { text-align: center; margin: 20px 0; }
        .chart-metadata { text-align: right; color: #94a3b8; }
    </style>
</head>
<body>
    <h1>Business Analysis Report - Chart Gallery</h1>
    <p>This report contains high-quality charts generated for business analysis and valuation purposes.</p>

    ${chartSections}

    <footer>
        <p><small>Generated on ${new Date().toLocaleDateString()} using GoodBuy HQ Chart Generation System</small></p>
    </footer>
</body>
</html>
  `;

  console.log('✅ HTML report with embedded charts generated');
  return fullHTML;
}

/**
 * Example 14: Performance Monitoring
 */
export async function performanceMonitoringExample(): Promise<void> {
  console.log('📊 Monitoring chart generation performance...');

  const startTime = Date.now();

  // Generate multiple charts and monitor performance
  const performanceData = [];

  for (let i = 0; i < 5; i++) {
    const chartStart = Date.now();

    await basicChartExample();

    const chartEnd = Date.now();
    performanceData.push({
      chartIndex: i + 1,
      duration: chartEnd - chartStart,
      cacheStats: defaultChartGenerator.getCacheStats()
    });
  }

  const totalTime = Date.now() - startTime;

  console.log('📈 Performance Results:');
  console.log(`   Total time: ${totalTime}ms`);
  console.log(`   Average per chart: ${totalTime / 5}ms`);
  console.log(`   Cache utilization: ${defaultChartGenerator.getCacheStats().size} entries`);

  performanceData.forEach((data, index) => {
    console.log(`   Chart ${data.chartIndex}: ${data.duration}ms`);
  });

  console.log('✅ Performance monitoring complete');
}

/**
 * Example 15: Error Handling and Recovery
 */
export async function errorHandlingExample(): Promise<void> {
  console.log('🔧 Testing error handling capabilities...');

  try {
    // Test with invalid data
    const invalidData: ChartDataInput = {
      labels: [], // Empty labels
      datasets: [{
        label: 'Test',
        data: [NaN, undefined, null] as any // Invalid data
      }]
    };

    await defaultChartGenerator.generateFinancialTrendsChart(
      invalidData,
      'professional'
    );

    console.log('⚠️  Chart generated despite invalid data (graceful handling)');
  } catch (error) {
    console.log('❌ Chart generation failed as expected:', error instanceof Error ? error.message : error);
  }

  try {
    // Test with unsupported chart type
    await defaultChartIntegration.generateCustomChart({
      chartType: 'unsupported-type',
      tier: 'professional',
      title: 'Test Chart',
      data: { labels: ['A'], datasets: [{ label: 'Test', data: [1] }] }
    });
  } catch (error) {
    console.log('❌ Unsupported chart type failed as expected:', error instanceof Error ? error.message : error);
  }

  console.log('✅ Error handling tests complete');
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  console.log('🚀 Running all chart generation examples...\n');

  try {
    // Basic examples
    await basicChartExample();
    await customerConcentrationExample();
    await competitivePositioningExample();
    await roiCalculatorExample();

    // Enterprise examples
    await scenarioMatrixExample();
    await exitStrategyExample();
    await capitalStructureExample();
    await strategicOptionsExample();

    // Advanced examples
    await customChartConfigExample();
    await batchChartGenerationExample();

    // Performance and monitoring
    await performanceMonitoringExample();
    await errorHandlingExample();

    console.log('\n✅ All examples completed successfully!');
    console.log('📊 Chart generation system is ready for production use.');

  } catch (error) {
    console.error('\n❌ Example execution failed:', error);
    throw error;
  }
}

// Example data for testing
export const sampleBusinessEvaluation: Partial<BusinessEvaluation> = {
  id: 'example-eval-001',
  calculatedValue: 2500000,
  financialData: {
    annualRevenue: 1200000,
    netProfit: 180000,
    assets: 800000,
    liabilities: 200000,
    cashFlow: 220000
  } as any,
  customerAnalysis: {
    concentrationData: [
      { name: 'Enterprise Client A', percentage: 35 },
      { name: 'Enterprise Client B', percentage: 25 },
      { name: 'Mid-Market Segment', percentage: 25 },
      { name: 'Small Business', percentage: 15 }
    ]
  } as any,
  competitiveAnalysis: {
    positioningData: {
      marketShare: 7,
      innovation: 8,
      quality: 9,
      price: 6,
      service: 8
    }
  } as any,
  investmentAnalysis: {
    roiProjections: {
      conservative: { year1: 15, year2: 22, year3: 30, year5: 45 },
      baseCase: { year1: 22, year2: 32, year3: 45, year5: 70 },
      optimistic: { year1: 30, year2: 45, year3: 65, year5: 105 }
    }
  } as any,
  riskAssessment: {
    financial: { level: 4 },
    operational: { level: 3 },
    market: { level: 5 },
    regulatory: { level: 2 },
    technology: { level: 4 }
  } as any
};

export const sampleEnterpriseData: Partial<EnterpriseTierData> = {
  scenarioAnalysis: {
    scenarios: {
      'Conservative Growth': { value: 2000000, risk: 3, return: 18 },
      'Market Expansion': { value: 3200000, risk: 6, return: 35 },
      'Innovation Push': { value: 4500000, risk: 8, return: 55 },
      'Acquisition Strategy': { value: 6000000, risk: 9, return: 75 }
    }
  } as any,
  exitStrategy: {
    currentValue: 2500000,
    improvements: {
      operational: 400000,
      market: 600000,
      efficiency: 300000
    },
    projectedExitValue: 3800000
  } as any,
  capitalStructure: {
    current: { equity: 1500000, debt: 1000000 },
    optimized: { equity: 1800000, debt: 700000 },
    conservative: { equity: 2000000, debt: 500000 },
    aggressive: { equity: 1200000, debt: 1300000 }
  } as any,
  strategicOptions: {
    options: {
      'Organic Growth': { investment: 500000, risk: 3, expectedReturn: 20 },
      'Strategic Acquisition': { investment: 2000000, risk: 7, expectedReturn: 40 },
      'Market Expansion': { investment: 1200000, risk: 5, expectedReturn: 30 },
      'Digital Transformation': { investment: 800000, risk: 4, expectedReturn: 25 }
    }
  } as any
};

export default {
  runAllExamples,
  basicChartExample,
  customerConcentrationExample,
  competitivePositioningExample,
  roiCalculatorExample,
  scenarioMatrixExample,
  exitStrategyExample,
  capitalStructureExample,
  strategicOptionsExample,
  generateProfessionalReportCharts,
  generateEnterpriseReportCharts,
  customChartConfigExample,
  batchChartGenerationExample,
  chartEmbeddingExample,
  performanceMonitoringExample,
  errorHandlingExample,
  sampleBusinessEvaluation,
  sampleEnterpriseData
};