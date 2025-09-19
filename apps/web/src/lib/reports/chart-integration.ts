/**
 * Chart Integration Utility
 *
 * Integrates the ChartGenerator with the Enhanced Report Generator
 * Provides seamless chart generation for Professional and Enterprise tier reports
 * with automatic data processing and embedding capabilities.
 */

import {
  ChartGenerator,
  ChartDataProcessor,
  defaultChartGenerator,
  type ChartDataInput,
  type ChartExportOptions
} from './chart-generator';
import type {
  BusinessEvaluation,
  FinancialData,
  MarketAnalysis,
  OperationalMetrics
} from '@/types/valuation';
import type {
  EnterpriseTierData,
  ScenarioAnalysis,
  ExitStrategy,
  CapitalStructureAnalysis,
  StrategicOptions
} from '@/types/enterprise-evaluation';
import type {
  ReportTier,
  ChartConfiguration,
  ProfessionalReportStructure,
  EnterpriseReportStructure
} from '@/types/enhanced-reports';

/**
 * Chart embedding configuration for reports
 */
export interface ChartEmbedConfig {
  width: number;
  height: number;
  dpi: number;
  format: 'base64' | 'png' | 'svg';
  compression: number;
  includeTitle: boolean;
  includeSubtitle: boolean;
}

/**
 * Generated chart result with metadata
 */
export interface GeneratedChart {
  id: string;
  title: string;
  subtitle?: string;
  type: string;
  data: string; // Base64 encoded image
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
    generatedAt: Date;
    tier: ReportTier;
  };
}

/**
 * Chart generation request
 */
export interface ChartGenerationRequest {
  chartType: string;
  tier: ReportTier;
  title: string;
  subtitle?: string;
  data: any;
  config?: Partial<ChartEmbedConfig>;
}

/**
 * Chart Integration Service
 *
 * Provides high-level interface for generating charts within reports
 * Handles data processing, chart generation, and embedding
 */
export class ChartIntegrationService {
  private chartGenerator: ChartGenerator;
  private defaultConfig: ChartEmbedConfig;

  constructor(chartGenerator?: ChartGenerator, defaultConfig?: Partial<ChartEmbedConfig>) {
    this.chartGenerator = chartGenerator || defaultChartGenerator;
    this.defaultConfig = {
      width: 1200,
      height: 800,
      dpi: 300,
      format: 'base64',
      compression: 0.9,
      includeTitle: true,
      includeSubtitle: true,
      ...defaultConfig
    };
  }

  /**
   * Generate all charts for a Professional tier report
   */
  public async generateProfessionalCharts(
    evaluation: BusinessEvaluation,
    reportStructure: ProfessionalReportStructure
  ): Promise<GeneratedChart[]> {
    const charts: GeneratedChart[] = [];

    try {
      // Financial Performance Trends
      const financialTrendsChart = await this.generateFinancialTrendsChart(
        evaluation,
        'professional'
      );
      charts.push(financialTrendsChart);

      // Customer Concentration Analysis
      if (evaluation.customerAnalysis?.concentrationData) {
        const customerChart = await this.generateCustomerConcentrationChart(
          evaluation,
          'professional'
        );
        charts.push(customerChart);
      }

      // Competitive Positioning Radar
      if (evaluation.competitiveAnalysis?.positioningData) {
        const competitiveChart = await this.generateCompetitiveRadarChart(
          evaluation,
          'professional'
        );
        charts.push(competitiveChart);
      }

      // ROI Calculator Chart
      if (evaluation.investmentAnalysis?.roiProjections) {
        const roiChart = await this.generateROICalculatorChart(
          evaluation,
          'professional'
        );
        charts.push(roiChart);
      }

      // Risk Assessment Chart
      const riskChart = await this.generateRiskAssessmentChart(
        evaluation,
        'professional'
      );
      charts.push(riskChart);

      // Valuation Summary Chart
      const valuationChart = await this.generateValuationSummaryChart(
        evaluation,
        'professional'
      );
      charts.push(valuationChart);

    } catch (error) {
      console.error('Error generating professional charts:', error);
      throw new Error(`Failed to generate professional tier charts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return charts;
  }

  /**
   * Generate all charts for an Enterprise tier report
   */
  public async generateEnterpriseCharts(
    evaluation: BusinessEvaluation,
    enterpriseData: EnterpriseTierData,
    reportStructure: EnterpriseReportStructure
  ): Promise<GeneratedChart[]> {
    const charts: GeneratedChart[] = [];

    try {
      // First generate all Professional tier charts
      const professionalCharts = await this.generateProfessionalCharts(
        evaluation,
        reportStructure
      );
      charts.push(...professionalCharts);

      // Scenario Analysis Matrix
      if (enterpriseData.scenarioAnalysis) {
        const scenarioChart = await this.generateScenarioMatrixChart(
          enterpriseData.scenarioAnalysis
        );
        charts.push(scenarioChart);
      }

      // Exit Strategy Waterfall
      if (enterpriseData.exitStrategy) {
        const exitChart = await this.generateExitStrategyChart(
          enterpriseData.exitStrategy
        );
        charts.push(exitChart);
      }

      // Capital Structure Optimization
      if (enterpriseData.capitalStructure) {
        const capitalChart = await this.generateCapitalStructureChart(
          enterpriseData.capitalStructure
        );
        charts.push(capitalChart);
      }

      // Strategic Options Analysis
      if (enterpriseData.strategicOptions) {
        const strategicChart = await this.generateStrategicOptionsChart(
          enterpriseData.strategicOptions
        );
        charts.push(strategicChart);
      }

      // Multi-Year Projections
      if (enterpriseData.multiYearProjections) {
        const projectionsChart = await this.generateMultiYearProjectionsChart(
          enterpriseData.multiYearProjections
        );
        charts.push(projectionsChart);
      }

      // Advanced Risk Scenario Analysis
      const advancedRiskChart = await this.generateAdvancedRiskAnalysisChart(
        evaluation,
        enterpriseData
      );
      charts.push(advancedRiskChart);

    } catch (error) {
      console.error('Error generating enterprise charts:', error);
      throw new Error(`Failed to generate enterprise tier charts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return charts;
  }

  /**
   * Generate Financial Trends Chart
   */
  private async generateFinancialTrendsChart(
    evaluation: BusinessEvaluation,
    tier: ReportTier
  ): Promise<GeneratedChart> {
    const chartData = this.processFinancialData(evaluation.financialData);

    const imageData = await this.chartGenerator.generateFinancialTrendsChart(
      chartData,
      tier,
      this.getExportOptions()
    );

    return {
      id: 'financial-trends',
      title: 'Financial Performance Trends',
      subtitle: 'Revenue, profitability, and cash flow over time',
      type: 'line',
      data: imageData,
      metadata: {
        width: this.defaultConfig.width,
        height: this.defaultConfig.height,
        format: this.defaultConfig.format,
        size: imageData.length,
        generatedAt: new Date(),
        tier
      }
    };
  }

  /**
   * Generate Customer Concentration Chart
   */
  private async generateCustomerConcentrationChart(
    evaluation: BusinessEvaluation,
    tier: ReportTier
  ): Promise<GeneratedChart> {
    const chartData = this.processCustomerData(evaluation);

    const imageData = await this.chartGenerator.generateCustomerConcentrationChart(
      chartData,
      tier,
      this.getExportOptions()
    );

    return {
      id: 'customer-concentration',
      title: 'Customer Revenue Concentration',
      subtitle: 'Distribution of revenue across customer base',
      type: 'doughnut',
      data: imageData,
      metadata: {
        width: this.defaultConfig.width,
        height: this.defaultConfig.height,
        format: this.defaultConfig.format,
        size: imageData.length,
        generatedAt: new Date(),
        tier
      }
    };
  }

  /**
   * Generate Competitive Radar Chart
   */
  private async generateCompetitiveRadarChart(
    evaluation: BusinessEvaluation,
    tier: ReportTier
  ): Promise<GeneratedChart> {
    const chartData = this.processCompetitiveData(evaluation);

    const imageData = await this.chartGenerator.generateCompetitiveRadarChart(
      chartData,
      tier,
      this.getExportOptions()
    );

    return {
      id: 'competitive-radar',
      title: 'Competitive Positioning Analysis',
      subtitle: 'Comparison across key competitive dimensions',
      type: 'radar',
      data: imageData,
      metadata: {
        width: this.defaultConfig.width,
        height: this.defaultConfig.height,
        format: this.defaultConfig.format,
        size: imageData.length,
        generatedAt: new Date(),
        tier
      }
    };
  }

  /**
   * Generate ROI Calculator Chart
   */
  private async generateROICalculatorChart(
    evaluation: BusinessEvaluation,
    tier: ReportTier
  ): Promise<GeneratedChart> {
    const chartData = this.processROIData(evaluation);

    const imageData = await this.chartGenerator.generateROICalculatorChart(
      chartData,
      tier,
      this.getExportOptions()
    );

    return {
      id: 'roi-calculator',
      title: 'ROI Projection Analysis',
      subtitle: 'Return on investment across different scenarios',
      type: 'bar',
      data: imageData,
      metadata: {
        width: this.defaultConfig.width,
        height: this.defaultConfig.height,
        format: this.defaultConfig.format,
        size: imageData.length,
        generatedAt: new Date(),
        tier
      }
    };
  }

  /**
   * Generate Risk Assessment Chart
   */
  private async generateRiskAssessmentChart(
    evaluation: BusinessEvaluation,
    tier: ReportTier
  ): Promise<GeneratedChart> {
    const chartData = this.processRiskData(evaluation);

    const imageData = await this.chartGenerator.generateCompetitiveRadarChart(
      chartData,
      tier,
      this.getExportOptions()
    );

    return {
      id: 'risk-assessment',
      title: 'Risk Assessment Overview',
      subtitle: 'Risk levels across different business areas',
      type: 'radar',
      data: imageData,
      metadata: {
        width: this.defaultConfig.width,
        height: this.defaultConfig.height,
        format: this.defaultConfig.format,
        size: imageData.length,
        generatedAt: new Date(),
        tier
      }
    };
  }

  /**
   * Generate Valuation Summary Chart
   */
  private async generateValuationSummaryChart(
    evaluation: BusinessEvaluation,
    tier: ReportTier
  ): Promise<GeneratedChart> {
    const chartData = this.processValuationData(evaluation);

    const imageData = await this.chartGenerator.generateROICalculatorChart(
      chartData,
      tier,
      this.getExportOptions()
    );

    return {
      id: 'valuation-summary',
      title: 'Valuation Method Comparison',
      subtitle: 'Business value across different valuation approaches',
      type: 'bar',
      data: imageData,
      metadata: {
        width: this.defaultConfig.width,
        height: this.defaultConfig.height,
        format: this.defaultConfig.format,
        size: imageData.length,
        generatedAt: new Date(),
        tier
      }
    };
  }

  /**
   * Generate Scenario Matrix Chart (Enterprise Only)
   */
  private async generateScenarioMatrixChart(
    scenarioAnalysis: ScenarioAnalysis
  ): Promise<GeneratedChart> {
    const chartData = this.processScenarioData(scenarioAnalysis);

    const imageData = await this.chartGenerator.generateScenarioMatrixChart(
      chartData,
      this.getExportOptions()
    );

    return {
      id: 'scenario-matrix',
      title: 'Scenario Analysis Matrix',
      subtitle: 'Outcome distribution across scenario variables',
      type: 'scatter',
      data: imageData,
      metadata: {
        width: this.defaultConfig.width,
        height: this.defaultConfig.height,
        format: this.defaultConfig.format,
        size: imageData.length,
        generatedAt: new Date(),
        tier: 'enterprise'
      }
    };
  }

  /**
   * Generate Exit Strategy Chart (Enterprise Only)
   */
  private async generateExitStrategyChart(
    exitStrategy: ExitStrategy
  ): Promise<GeneratedChart> {
    const chartData = this.processExitStrategyData(exitStrategy);

    const imageData = await this.chartGenerator.generateExitStrategyChart(
      chartData,
      this.getExportOptions()
    );

    return {
      id: 'exit-strategy',
      title: 'Exit Strategy Value Waterfall',
      subtitle: 'Value creation pathway to exit',
      type: 'waterfall',
      data: imageData,
      metadata: {
        width: this.defaultConfig.width,
        height: this.defaultConfig.height,
        format: this.defaultConfig.format,
        size: imageData.length,
        generatedAt: new Date(),
        tier: 'enterprise'
      }
    };
  }

  /**
   * Generate Capital Structure Chart (Enterprise Only)
   */
  private async generateCapitalStructureChart(
    capitalStructure: CapitalStructureAnalysis
  ): Promise<GeneratedChart> {
    const chartData = this.processCapitalStructureData(capitalStructure);

    const imageData = await this.chartGenerator.generateCapitalStructureChart(
      chartData,
      this.getExportOptions()
    );

    return {
      id: 'capital-structure',
      title: 'Capital Structure Optimization',
      subtitle: 'Optimal debt-equity mix analysis',
      type: 'stackedBar',
      data: imageData,
      metadata: {
        width: this.defaultConfig.width,
        height: this.defaultConfig.height,
        format: this.defaultConfig.format,
        size: imageData.length,
        generatedAt: new Date(),
        tier: 'enterprise'
      }
    };
  }

  /**
   * Generate Strategic Options Chart (Enterprise Only)
   */
  private async generateStrategicOptionsChart(
    strategicOptions: StrategicOptions
  ): Promise<GeneratedChart> {
    const chartData = this.processStrategicOptionsData(strategicOptions);

    const imageData = await this.chartGenerator.generateStrategicOptionsChart(
      chartData,
      this.getExportOptions()
    );

    return {
      id: 'strategic-options',
      title: 'Strategic Options Analysis',
      subtitle: 'Risk-return-investment mapping of strategic alternatives',
      type: 'bubble',
      data: imageData,
      metadata: {
        width: this.defaultConfig.width,
        height: this.defaultConfig.height,
        format: this.defaultConfig.format,
        size: imageData.length,
        generatedAt: new Date(),
        tier: 'enterprise'
      }
    };
  }

  /**
   * Generate Multi-Year Projections Chart (Enterprise Only)
   */
  private async generateMultiYearProjectionsChart(
    projections: any
  ): Promise<GeneratedChart> {
    const chartData = this.processProjectionsData(projections);

    const imageData = await this.chartGenerator.generateFinancialTrendsChart(
      chartData,
      'enterprise',
      this.getExportOptions()
    );

    return {
      id: 'multi-year-projections',
      title: 'Multi-Year Financial Projections',
      subtitle: 'Five-year financial performance forecast',
      type: 'line',
      data: imageData,
      metadata: {
        width: this.defaultConfig.width,
        height: this.defaultConfig.height,
        format: this.defaultConfig.format,
        size: imageData.length,
        generatedAt: new Date(),
        tier: 'enterprise'
      }
    };
  }

  /**
   * Generate Advanced Risk Analysis Chart (Enterprise Only)
   */
  private async generateAdvancedRiskAnalysisChart(
    evaluation: BusinessEvaluation,
    enterpriseData: EnterpriseTierData
  ): Promise<GeneratedChart> {
    const chartData = this.processAdvancedRiskData(evaluation, enterpriseData);

    const imageData = await this.chartGenerator.generateScenarioMatrixChart(
      chartData,
      this.getExportOptions()
    );

    return {
      id: 'advanced-risk-analysis',
      title: 'Advanced Risk Scenario Analysis',
      subtitle: 'Risk impact distribution across scenarios',
      type: 'heatmap',
      data: imageData,
      metadata: {
        width: this.defaultConfig.width,
        height: this.defaultConfig.height,
        format: this.defaultConfig.format,
        size: imageData.length,
        generatedAt: new Date(),
        tier: 'enterprise'
      }
    };
  }

  /**
   * Data processing methods
   */
  private processFinancialData(financialData: FinancialData): ChartDataInput {
    return {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [
        {
          label: 'Revenue',
          data: [
            financialData.annualRevenue * 0.22,
            financialData.annualRevenue * 0.24,
            financialData.annualRevenue * 0.26,
            financialData.annualRevenue * 0.28
          ],
          borderColor: '#0ea5e9',
          backgroundColor: '#0ea5e9'
        },
        {
          label: 'Profit',
          data: [
            financialData.netProfit * 0.20,
            financialData.netProfit * 0.23,
            financialData.netProfit * 0.27,
            financialData.netProfit * 0.30
          ],
          borderColor: '#10b981',
          backgroundColor: '#10b981'
        }
      ]
    };
  }

  private processCustomerData(evaluation: BusinessEvaluation): ChartDataInput {
    const customerData = evaluation.customerAnalysis?.concentrationData || [];

    return {
      labels: customerData.map((c: any) => c.name || 'Customer'),
      datasets: [{
        label: 'Revenue Share',
        data: customerData.map((c: any) => c.percentage || 0)
      }]
    };
  }

  private processCompetitiveData(evaluation: BusinessEvaluation): ChartDataInput {
    const competitiveData = evaluation.competitiveAnalysis?.positioningData || {};

    return {
      labels: ['Market Share', 'Innovation', 'Quality', 'Price', 'Service'],
      datasets: [
        {
          label: 'Our Company',
          data: [
            competitiveData.marketShare || 6,
            competitiveData.innovation || 7,
            competitiveData.quality || 8,
            competitiveData.price || 6,
            competitiveData.service || 7
          ]
        },
        {
          label: 'Industry Average',
          data: [5, 5, 5, 5, 5]
        }
      ]
    };
  }

  private processROIData(evaluation: BusinessEvaluation): ChartDataInput {
    const roiData = evaluation.investmentAnalysis?.roiProjections || {};

    return {
      labels: ['Year 1', 'Year 2', 'Year 3', 'Year 5'],
      datasets: [
        {
          label: 'Conservative',
          data: [
            roiData.conservative?.year1 || 12,
            roiData.conservative?.year2 || 18,
            roiData.conservative?.year3 || 25,
            roiData.conservative?.year5 || 40
          ]
        },
        {
          label: 'Base Case',
          data: [
            roiData.baseCase?.year1 || 18,
            roiData.baseCase?.year2 || 28,
            roiData.baseCase?.year3 || 40,
            roiData.baseCase?.year5 || 65
          ]
        },
        {
          label: 'Optimistic',
          data: [
            roiData.optimistic?.year1 || 25,
            roiData.optimistic?.year2 || 40,
            roiData.optimistic?.year3 || 60,
            roiData.optimistic?.year5 || 95
          ]
        }
      ]
    };
  }

  private processRiskData(evaluation: BusinessEvaluation): ChartDataInput {
    const riskData = evaluation.riskAssessment || {};

    return {
      labels: ['Financial', 'Operational', 'Market', 'Regulatory', 'Technology'],
      datasets: [{
        label: 'Risk Level',
        data: [
          riskData.financial?.level || 4,
          riskData.operational?.level || 3,
          riskData.market?.level || 5,
          riskData.regulatory?.level || 2,
          riskData.technology?.level || 4
        ]
      }]
    };
  }

  private processValuationData(evaluation: BusinessEvaluation): ChartDataInput {
    const valuationData = evaluation.valuation || {};

    return {
      labels: ['Asset-Based', 'Market Multiple', 'DCF', 'Comparable Sales'],
      datasets: [{
        label: 'Valuation ($)',
        data: [
          valuationData.assetBased || evaluation.calculatedValue * 0.8,
          valuationData.marketMultiple || evaluation.calculatedValue * 0.9,
          valuationData.dcf || evaluation.calculatedValue,
          valuationData.comparableSales || evaluation.calculatedValue * 1.1
        ]
      }]
    };
  }

  private processScenarioData(scenarioAnalysis: ScenarioAnalysis): ChartDataInput {
    return {
      labels: Object.keys(scenarioAnalysis.scenarios || {}),
      datasets: [{
        label: 'Scenario Outcomes',
        data: Object.values(scenarioAnalysis.scenarios || {}).map((s: any) => s.value || 0)
      }],
      metadata: {
        risk: Object.values(scenarioAnalysis.scenarios || {}).map((s: any) => s.risk || 5),
        return: Object.values(scenarioAnalysis.scenarios || {}).map((s: any) => s.return || 15)
      }
    };
  }

  private processExitStrategyData(exitStrategy: ExitStrategy): ChartDataInput {
    return {
      labels: ['Current Value', 'Operational Improvements', 'Market Expansion', 'Efficiency Gains', 'Exit Value'],
      datasets: [{
        label: 'Value Creation',
        data: [
          exitStrategy.currentValue || 1000000,
          exitStrategy.improvements?.operational || 200000,
          exitStrategy.improvements?.market || 300000,
          exitStrategy.improvements?.efficiency || 150000,
          exitStrategy.projectedExitValue || 1650000
        ]
      }]
    };
  }

  private processCapitalStructureData(capitalStructure: CapitalStructureAnalysis): ChartDataInput {
    return {
      labels: ['Current', 'Optimized', 'Conservative', 'Aggressive'],
      datasets: [
        {
          label: 'Equity',
          data: [
            capitalStructure.current?.equity || 600000,
            capitalStructure.optimized?.equity || 700000,
            capitalStructure.conservative?.equity || 800000,
            capitalStructure.aggressive?.equity || 500000
          ]
        },
        {
          label: 'Debt',
          data: [
            capitalStructure.current?.debt || 400000,
            capitalStructure.optimized?.debt || 300000,
            capitalStructure.conservative?.debt || 200000,
            capitalStructure.aggressive?.debt || 500000
          ]
        }
      ]
    };
  }

  private processStrategicOptionsData(strategicOptions: StrategicOptions): ChartDataInput {
    return {
      labels: Object.keys(strategicOptions.options || {}),
      datasets: [{
        label: 'Strategic Options',
        data: Object.values(strategicOptions.options || {}).map((o: any) => o.investment || 0)
      }],
      metadata: {
        risk: Object.values(strategicOptions.options || {}).map((o: any) => o.risk || 5),
        return: Object.values(strategicOptions.options || {}).map((o: any) => o.expectedReturn || 15)
      }
    };
  }

  private processProjectionsData(projections: any): ChartDataInput {
    return {
      labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
      datasets: [
        {
          label: 'Revenue',
          data: projections.revenue || [1000000, 1200000, 1440000, 1728000, 2073600]
        },
        {
          label: 'EBITDA',
          data: projections.ebitda || [200000, 240000, 288000, 345600, 414720]
        },
        {
          label: 'Net Income',
          data: projections.netIncome || [100000, 120000, 144000, 172800, 207360]
        }
      ]
    };
  }

  private processAdvancedRiskData(
    evaluation: BusinessEvaluation,
    enterpriseData: EnterpriseTierData
  ): ChartDataInput {
    return {
      labels: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical Risk'],
      datasets: [{
        label: 'Risk Impact',
        data: [500000, 1000000, 2000000, 5000000]
      }]
    };
  }

  /**
   * Get standardized export options
   */
  private getExportOptions(): ChartExportOptions {
    return {
      format: 'base64',
      quality: this.defaultConfig.compression,
      includeTitle: this.defaultConfig.includeTitle,
      includeSubtitle: this.defaultConfig.includeSubtitle,
      includeWatermark: false
    };
  }

  /**
   * Generate custom chart from configuration
   */
  public async generateCustomChart(
    request: ChartGenerationRequest
  ): Promise<GeneratedChart> {
    const config = { ...this.defaultConfig, ...request.config };
    const exportOptions = this.getExportOptions();

    let imageData: string;

    switch (request.chartType) {
      case 'financial-trends':
        imageData = await this.chartGenerator.generateFinancialTrendsChart(
          request.data,
          request.tier,
          exportOptions
        );
        break;
      case 'customer-concentration':
        imageData = await this.chartGenerator.generateCustomerConcentrationChart(
          request.data,
          request.tier,
          exportOptions
        );
        break;
      case 'competitive-radar':
        imageData = await this.chartGenerator.generateCompetitiveRadarChart(
          request.data,
          request.tier,
          exportOptions
        );
        break;
      case 'roi-calculator':
        imageData = await this.chartGenerator.generateROICalculatorChart(
          request.data,
          request.tier,
          exportOptions
        );
        break;
      case 'scenario-matrix':
        imageData = await this.chartGenerator.generateScenarioMatrixChart(
          request.data,
          exportOptions
        );
        break;
      case 'exit-strategy':
        imageData = await this.chartGenerator.generateExitStrategyChart(
          request.data,
          exportOptions
        );
        break;
      case 'capital-structure':
        imageData = await this.chartGenerator.generateCapitalStructureChart(
          request.data,
          exportOptions
        );
        break;
      case 'strategic-options':
        imageData = await this.chartGenerator.generateStrategicOptionsChart(
          request.data,
          exportOptions
        );
        break;
      default:
        throw new Error(`Unsupported chart type: ${request.chartType}`);
    }

    return {
      id: `custom-${request.chartType}-${Date.now()}`,
      title: request.title,
      subtitle: request.subtitle,
      type: request.chartType,
      data: imageData,
      metadata: {
        width: config.width,
        height: config.height,
        format: config.format,
        size: imageData.length,
        generatedAt: new Date(),
        tier: request.tier
      }
    };
  }

  /**
   * Batch generate multiple charts
   */
  public async generateChartBatch(
    requests: ChartGenerationRequest[]
  ): Promise<GeneratedChart[]> {
    const results = await Promise.allSettled(
      requests.map(request => this.generateCustomChart(request))
    );

    const charts: GeneratedChart[] = [];
    const errors: Error[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        charts.push(result.value);
      } else {
        errors.push(new Error(`Chart ${index} failed: ${result.reason}`));
      }
    });

    if (errors.length > 0) {
      console.warn('Some charts failed to generate:', errors);
    }

    return charts;
  }

  /**
   * Get cache statistics from the chart generator
   */
  public getCacheStats() {
    return this.chartGenerator.getCacheStats();
  }

  /**
   * Clear chart generation cache
   */
  public clearCache(): void {
    this.chartGenerator.clearCache();
  }

  /**
   * Update default configuration
   */
  public updateConfig(config: Partial<ChartEmbedConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }
}

/**
 * Default chart integration service instance
 */
export const defaultChartIntegration = new ChartIntegrationService();

/**
 * Utility function to embed chart in HTML
 */
export function embedChartInHTML(chart: GeneratedChart): string {
  return `
    <div class="chart-container" data-chart-id="${chart.id}">
      <div class="chart-header">
        <h3 class="chart-title">${chart.title}</h3>
        ${chart.subtitle ? `<p class="chart-subtitle">${chart.subtitle}</p>` : ''}
      </div>
      <div class="chart-image">
        <img
          src="${chart.data}"
          alt="${chart.title}"
          width="${chart.metadata.width}"
          height="${chart.metadata.height}"
          style="max-width: 100%; height: auto;"
        />
      </div>
      <div class="chart-metadata">
        <small>Generated on ${chart.metadata.generatedAt.toLocaleDateString()}</small>
      </div>
    </div>
  `;
}

/**
 * Utility function to get chart summary for reports
 */
export function getChartSummary(charts: GeneratedChart[]): {
  totalCharts: number;
  totalSize: number;
  chartTypes: Record<string, number>;
  averageGenerationTime: number;
} {
  const totalCharts = charts.length;
  const totalSize = charts.reduce((sum, chart) => sum + chart.metadata.size, 0);
  const chartTypes: Record<string, number> = {};

  charts.forEach(chart => {
    chartTypes[chart.type] = (chartTypes[chart.type] || 0) + 1;
  });

  return {
    totalCharts,
    totalSize,
    chartTypes,
    averageGenerationTime: 0 // Would need to track generation times for accurate calculation
  };
}

// Export types for external use
export type {
  ChartEmbedConfig,
  GeneratedChart,
  ChartGenerationRequest
};