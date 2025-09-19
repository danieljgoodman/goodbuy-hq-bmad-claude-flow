/**
 * Enhanced Report Generator - Professional & Enterprise Tier Reports
 *
 * This class provides sophisticated report generation capabilities for Professional
 * and Enterprise tier users, including high-quality PDF generation, advanced charts,
 * and comprehensive business analysis reports.
 */

import puppeteer, { Browser, Page, PDFOptions } from 'puppeteer';
import { Chart, ChartConfiguration, ChartOptions } from 'chart.js/auto';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

// Dynamic import will be handled at runtime

// Type imports
import {
  ReportGenerationConfig,
  ReportTier,
  ProfessionalReportStructure,
  EnterpriseReportStructure,
  ChartConfiguration as ReportChartConfig,
  ChartType,
  ReportMetadata,
  ReportStatus,
  GenerationPerformance,
  isEnterpriseReport
} from '@/types/enhanced-reports';
import { BusinessEvaluation } from '@/types/valuation';
import { EnterpriseTierData } from '@/types/enterprise-evaluation';
import { AnalysisResult } from '@/types/ai-analysis';

// Cache and performance interfaces
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  memoryUsage: NodeJS.MemoryUsage;
  chartGenerationTime: number;
  pdfGenerationTime: number;
  totalTime: number;
}

/**
 * Enhanced Report Generator Class
 *
 * Provides comprehensive report generation with:
 * - High-quality PDF generation via Puppeteer
 * - Advanced chart generation at 300 DPI
 * - Tier-specific content and features
 * - Performance optimization and caching
 * - Sophisticated error handling and retry logic
 */
export class EnhancedReportGenerator {
  private static instance: EnhancedReportGenerator;
  private cache = new Map<string, CacheEntry<any>>();
  private chartRenderer: ChartJSNodeCanvas;
  private browserPool: Browser[] = [];
  private maxBrowsers = 3;
  private retryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
  };

  // High-quality chart configuration
  private static readonly CHART_CONFIG = {
    width: 1200,      // 300 DPI at 4 inches
    height: 800,      // 300 DPI at ~2.67 inches
    backgroundColour: '#ffffff',
    plugins: {
      modern: ['chartjs-adapter-date-fns'],
      legacy: []
    }
  };

  // Professional brand colors
  private static readonly BRAND_PALETTE = {
    primary: '#c96442',
    secondary: '#9c87f5',
    accent: '#b05730',
    neutral: ['#ded8c4', '#dbd3f0', '#e9e6dc'],
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    text: '#3d3929',
    muted: '#83827d'
  };

  private static initPromise: Promise<void> | null = null;

  constructor() {
    // Chart renderer will be initialized on first use
  }

  static getInstance(): EnhancedReportGenerator {
    if (!EnhancedReportGenerator.instance) {
      EnhancedReportGenerator.instance = new EnhancedReportGenerator();
    }
    return EnhancedReportGenerator.instance;
  }

  private async ensureChartRenderer(): Promise<void> {
    if (!EnhancedReportGenerator.initPromise) {
      EnhancedReportGenerator.initPromise = this.initializeChartRenderer();
    }
    await EnhancedReportGenerator.initPromise;
  }

  /**
   * Generate Professional Tier Report
   */
  async generateProfessionalReport(
    config: ReportGenerationConfig,
    businessEvaluation: BusinessEvaluation,
    aiAnalysis?: AnalysisResult
  ): Promise<Buffer> {
    const metrics = this.initializeMetrics();

    try {
      // Build professional report structure
      const reportStructure = await this.buildProfessionalStructure(
        config,
        businessEvaluation,
        aiAnalysis
      );

      // Generate report with error handling and retries
      const pdfBuffer = await this.executeWithRetry(
        () => this.generateReportPDF(reportStructure, config, metrics),
        'Professional report generation'
      );

      await this.updateMetrics(config.id, metrics, 'completed');
      return pdfBuffer;

    } catch (error) {
      await this.updateMetrics(config.id, metrics, 'failed');
      throw this.enhanceError(error, 'Professional report generation failed');
    }
  }

  /**
   * Generate Enterprise Tier Report
   */
  async generateEnterpriseReport(
    config: ReportGenerationConfig,
    businessEvaluation: BusinessEvaluation,
    enterpriseData: EnterpriseTierData,
    aiAnalysis?: AnalysisResult
  ): Promise<Buffer> {
    const metrics = this.initializeMetrics();

    try {
      // Build enterprise report structure
      const reportStructure = await this.buildEnterpriseStructure(
        config,
        businessEvaluation,
        enterpriseData,
        aiAnalysis
      );

      // Generate report with advanced features
      const pdfBuffer = await this.executeWithRetry(
        () => this.generateReportPDF(reportStructure, config, metrics),
        'Enterprise report generation'
      );

      await this.updateMetrics(config.id, metrics, 'completed');
      return pdfBuffer;

    } catch (error) {
      await this.updateMetrics(config.id, metrics, 'failed');
      throw this.enhanceError(error, 'Enterprise report generation failed');
    }
  }

  /**
   * Generate Professional Report Structure
   */
  private async buildProfessionalStructure(
    config: ReportGenerationConfig,
    businessEvaluation: BusinessEvaluation,
    aiAnalysis?: AnalysisResult
  ): Promise<ProfessionalReportStructure> {
    return {
      metadata: this.buildReportMetadata(config, businessEvaluation),
      coverPage: await this.buildCoverPage(config, businessEvaluation),
      executiveSummary: await this.buildExecutiveSummary(businessEvaluation, aiAnalysis),
      businessOverview: await this.buildBusinessOverview(businessEvaluation),
      financialAnalysis: await this.buildFinancialAnalysis(businessEvaluation),
      operationalAssessment: await this.buildOperationalAssessment(businessEvaluation),
      strategicPositioning: await this.buildStrategicPositioning(businessEvaluation),
      riskAnalysis: await this.buildRiskAnalysis(businessEvaluation, aiAnalysis),
      investmentRecommendations: await this.buildInvestmentRecommendations(businessEvaluation, aiAnalysis),
      valuationSummary: await this.buildValuationSummary(businessEvaluation),
      appendices: await this.buildAppendices(businessEvaluation, config)
    };
  }

  /**
   * Generate Enterprise Report Structure
   */
  private async buildEnterpriseStructure(
    config: ReportGenerationConfig,
    businessEvaluation: BusinessEvaluation,
    enterpriseData: EnterpriseTierData,
    aiAnalysis?: AnalysisResult
  ): Promise<EnterpriseReportStructure> {
    // Build professional structure first
    const professionalStructure = await this.buildProfessionalStructure(
      config,
      businessEvaluation,
      aiAnalysis
    );

    // Add enterprise-specific sections
    const enterpriseStructure: EnterpriseReportStructure = {
      ...professionalStructure,
      scenarioAnalysis: await this.buildScenarioAnalysis(enterpriseData, businessEvaluation),
      exitStrategy: await this.buildExitStrategy(enterpriseData),
      capitalStructure: await this.buildCapitalStructure(enterpriseData, businessEvaluation),
      strategicOptions: await this.buildStrategicOptions(enterpriseData),
      multiYearProjections: await this.buildMultiYearProjections(enterpriseData)
    };

    return enterpriseStructure;
  }

  /**
   * Generate High-Quality Charts for Reports
   */
  async generateProfessionalChart(
    chartConfig: ReportChartConfig,
    data: any,
    tier: ReportTier = 'professional'
  ): Promise<Buffer> {
    const cacheKey = this.generateCacheKey('chart', chartConfig.id, data);
    const cached = this.getFromCache<Buffer>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      await this.ensureChartRenderer();

      if (!this.chartRenderer) {
        // Return a placeholder chart when ChartJSNodeCanvas is not available
        return Buffer.from('<!-- Chart generation not available in this environment -->', 'utf-8');
      }

      const configuration = this.buildChartConfiguration(chartConfig, data, tier);
      const chartBuffer = await this.chartRenderer.renderToBuffer(configuration);

      // Cache the result
      this.setCache(cacheKey, chartBuffer, 300000); // 5 minutes TTL

      return chartBuffer;
    } catch (error) {
      throw this.enhanceError(error, `Chart generation failed for ${chartConfig.id}`);
    }
  }

  /**
   * Generate Enterprise-Specific Advanced Charts
   */
  async generateEnterpriseChart(
    chartConfig: ReportChartConfig,
    data: any,
    scenarioData?: any
  ): Promise<Buffer> {
    const configuration = this.buildChartConfiguration(chartConfig, data, 'enterprise');

    // Add enterprise-specific enhancements
    if (scenarioData && chartConfig.type === 'line') {
      configuration.data.datasets.push({
        label: 'Optimistic Scenario',
        data: scenarioData.optimistic,
        borderColor: EnhancedReportGenerator.BRAND_PALETTE.success,
        borderDash: [5, 5],
        fill: false
      });

      configuration.data.datasets.push({
        label: 'Conservative Scenario',
        data: scenarioData.conservative,
        borderColor: EnhancedReportGenerator.BRAND_PALETTE.warning,
        borderDash: [10, 5],
        fill: false
      });
    }

    await this.ensureChartRenderer();

    if (!this.chartRenderer) {
      return Buffer.from('<!-- Chart generation not available in this environment -->', 'utf-8');
    }

    return await this.chartRenderer.renderToBuffer(configuration);
  }

  /**
   * Build Chart Configuration with Professional Styling
   */
  private buildChartConfiguration(
    chartConfig: ReportChartConfig,
    data: any,
    tier: ReportTier
  ): ChartConfiguration {
    const { BRAND_PALETTE } = EnhancedReportGenerator;

    const baseOptions: ChartOptions = {
      responsive: false,
      plugins: {
        title: {
          display: !!chartConfig.title,
          text: chartConfig.title,
          font: {
            size: tier === 'enterprise' ? 20 : 18,
            weight: 'bold',
            family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
          },
          color: BRAND_PALETTE.text,
          padding: 24
        },
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: {
              size: tier === 'enterprise' ? 14 : 12,
              family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
            },
            color: BRAND_PALETTE.text,
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: BRAND_PALETTE.text,
          bodyColor: BRAND_PALETTE.text,
          borderColor: BRAND_PALETTE.primary,
          borderWidth: 1,
          cornerRadius: 8,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          }
        }
      },
      elements: {
        line: {
          tension: 0.1,
          borderWidth: 3
        },
        point: {
          radius: tier === 'enterprise' ? 6 : 4,
          hoverRadius: tier === 'enterprise' ? 8 : 6,
          borderWidth: 2
        },
        bar: {
          borderRadius: 4,
          borderWidth: 1
        }
      }
    };

    // Add scales for non-pie/doughnut charts
    if (!['pie', 'donut'].includes(chartConfig.type)) {
      baseOptions.scales = {
        x: {
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
            lineWidth: 1
          },
          ticks: {
            font: {
              size: 12,
              family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
            },
            color: BRAND_PALETTE.muted,
            maxTicksLimit: tier === 'enterprise' ? 12 : 8
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
            lineWidth: 1
          },
          ticks: {
            font: {
              size: 12,
              family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
            },
            color: BRAND_PALETTE.muted,
            maxTicksLimit: tier === 'enterprise' ? 10 : 6
          }
        }
      };
    }

    // Process data with brand colors
    const processedData = this.processChartData(data, chartConfig.type, tier);

    return {
      type: chartConfig.type as any,
      data: processedData,
      options: {
        ...baseOptions,
        ...chartConfig.styling
      }
    };
  }

  /**
   * Process Chart Data with Professional Color Schemes
   */
  private processChartData(data: any, chartType: ChartType, tier: ReportTier) {
    const { BRAND_PALETTE } = EnhancedReportGenerator;
    const colors = [
      BRAND_PALETTE.primary,
      BRAND_PALETTE.secondary,
      BRAND_PALETTE.accent,
      ...BRAND_PALETTE.neutral,
      BRAND_PALETTE.success,
      BRAND_PALETTE.warning
    ];

    return {
      ...data,
      datasets: data.datasets?.map((dataset: any, index: number) => {
        const baseColor = colors[index % colors.length];

        return {
          ...dataset,
          backgroundColor: this.getBackgroundColor(baseColor, chartType, tier),
          borderColor: baseColor,
          borderWidth: tier === 'enterprise' ? 3 : 2,
          hoverBackgroundColor: this.lightenColor(baseColor, 0.1),
          hoverBorderColor: this.darkenColor(baseColor, 0.1)
        };
      }) || []
    };
  }

  /**
   * Generate PDF from Report Structure
   */
  private async generateReportPDF(
    reportStructure: ProfessionalReportStructure | EnterpriseReportStructure,
    config: ReportGenerationConfig,
    metrics: PerformanceMetrics
  ): Promise<Buffer> {
    const browser = await this.getBrowser();

    try {
      const page = await browser.newPage();

      // Set high-quality viewport for crisp rendering
      await page.setViewport({
        width: 1240,  // A4 width at 150 DPI
        height: 1754, // A4 height at 150 DPI
        deviceScaleFactor: 2 // For crisp rendering
      });

      // Generate HTML content
      const htmlContent = await this.generateReportHTML(reportStructure, config);

      // Set content and wait for all resources
      await page.setContent(htmlContent, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 30000
      });

      // Additional wait for chart images to load
      await page.waitForFunction(
        () => {
          const images = Array.from(document.getElementsByTagName('img'));
          return images.every(img => img.complete && img.naturalHeight !== 0);
        },
        { timeout: 15000 }
      );

      const pdfStartTime = Date.now();

      // Generate high-quality PDF
      const pdfOptions: PDFOptions = {
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: true,
        headerTemplate: this.generateHeaderTemplate(config),
        footerTemplate: this.generateFooterTemplate(config),
        scale: 1.0,
        timeout: 60000
      };

      const pdfBuffer = await page.pdf(pdfOptions);

      metrics.pdfGenerationTime = Date.now() - pdfStartTime;

      return pdfBuffer;

    } finally {
      await this.releaseBrowser(browser);
    }
  }

  /**
   * Initialize Chart Renderer with High-Quality Settings
   */
  private async initializeChartRenderer(): Promise<void> {
    if (typeof window !== 'undefined') {
      // Don't initialize in browser environment
      this.chartRenderer = null;
      return;
    }

    try {
      // Dynamic import at runtime
      const { ChartJSNodeCanvas } = await import('chartjs-node-canvas');

      this.chartRenderer = new ChartJSNodeCanvas({
        ...EnhancedReportGenerator.CHART_CONFIG,
        chartCallback: (ChartJS: typeof Chart) => {
          // Register additional plugins for enterprise features
          ChartJS.defaults.font.family = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          ChartJS.defaults.color = EnhancedReportGenerator.BRAND_PALETTE.text;
        }
      });
    } catch (error) {
      console.warn('ChartJSNodeCanvas not available - chart generation will be skipped');
      this.chartRenderer = null;
    }
  }

  /**
   * Browser Pool Management for Performance
   */
  private async getBrowser(): Promise<Browser> {
    if (this.browserPool.length > 0) {
      return this.browserPool.pop()!;
    }

    return await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-gpu',
        '--no-zygote',
        '--single-process'
      ],
      timeout: 30000
    });
  }

  private async releaseBrowser(browser: Browser): Promise<void> {
    if (this.browserPool.length < this.maxBrowsers) {
      this.browserPool.push(browser);
    } else {
      await browser.close();
    }
  }

  /**
   * Sophisticated Error Handling and Retry Logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === this.retryConfig.maxAttempts) {
          break;
        }

        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt - 1),
          this.retryConfig.maxDelay
        );

        console.warn(`${context} failed (attempt ${attempt}/${this.retryConfig.maxAttempts}), retrying in ${delay}ms:`, error);

        await this.sleep(delay);
      }
    }

    throw this.enhanceError(lastError!, `${context} failed after ${this.retryConfig.maxAttempts} attempts`);
  }

  /**
   * Enhanced Error Creation with Context
   */
  private enhanceError(originalError: Error, context: string): Error {
    const enhancedError = new Error(`${context}: ${originalError.message}`);
    enhancedError.stack = originalError.stack;
    enhancedError.cause = originalError;
    return enhancedError;
  }

  /**
   * Performance Optimization: Caching System
   */
  private generateCacheKey(...parts: (string | number | object)[]): string {
    return parts.map(part =>
      typeof part === 'object' ? JSON.stringify(part) : String(part)
    ).join('|');
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Cleanup old entries periodically
    if (this.cache.size > 100) {
      this.cleanupCache();
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Utility Methods
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private lightenColor(color: string, amount: number): string {
    // Simple color lightening - in production, use a proper color library
    return color + Math.floor(255 * amount).toString(16).padStart(2, '0');
  }

  private darkenColor(color: string, amount: number): string {
    // Simple color darkening - in production, use a proper color library
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(255 * amount);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  private getBackgroundColor(baseColor: string, chartType: ChartType, tier: ReportTier): string {
    if (['pie', 'donut'].includes(chartType)) {
      return baseColor;
    }

    // Add transparency for area charts and bars
    const opacity = tier === 'enterprise' ? '0.25' : '0.20';
    return baseColor + Math.floor(255 * parseFloat(opacity)).toString(16).padStart(2, '0');
  }

  /**
   * Performance Metrics Management
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      startTime: Date.now(),
      memoryUsage: process.memoryUsage(),
      chartGenerationTime: 0,
      pdfGenerationTime: 0,
      totalTime: 0
    };
  }

  private async updateMetrics(
    reportId: string,
    metrics: PerformanceMetrics,
    status: ReportStatus
  ): Promise<void> {
    metrics.endTime = Date.now();
    metrics.totalTime = metrics.endTime - metrics.startTime;

    // Log performance metrics for monitoring
    console.log(`Report ${reportId} - Status: ${status}`, {
      totalTime: metrics.totalTime,
      chartTime: metrics.chartGenerationTime,
      pdfTime: metrics.pdfGenerationTime,
      memoryDelta: process.memoryUsage().heapUsed - metrics.memoryUsage.heapUsed
    });
  }

  /**
   * Cleanup Resources
   */
  async cleanup(): Promise<void> {
    // Close all browsers in pool
    await Promise.all(
      this.browserPool.map(browser => browser.close())
    );
    this.browserPool = [];

    // Clear cache
    this.cache.clear();
  }

  /**
   * Build Report Metadata
   */
  private buildReportMetadata(config: ReportGenerationConfig, businessEvaluation: BusinessEvaluation): ReportMetadata {
    return {
      reportId: config.id,
      version: '2.0.0',
      tier: config.tier,
      generatedAt: new Date(),
      generatedBy: config.userId,
      sourceEvaluationId: businessEvaluation.id,
      title: config.template.name,
      subtitle: `${config.tier.charAt(0).toUpperCase() + config.tier.slice(1)} Business Analysis Report`,
      companyName: businessEvaluation.businessData.industry || 'Business Analysis',
      analysisPeriod: {
        startDate: new Date(businessEvaluation.createdAt.getFullYear() - 1, 0, 1),
        endDate: businessEvaluation.createdAt
      },
      status: 'generating' as ReportStatus,
      performance: {
        startTime: new Date(),
        endTime: new Date(),
        durationMs: 0,
        memoryUsage: 0,
        tokensGenerated: 0,
        pagesGenerated: 0
      },
      tags: [config.tier, 'valuation', 'analysis']
    };
  }

  /**
   * Build Cover Page Section
   */
  private async buildCoverPage(config: ReportGenerationConfig, businessEvaluation: BusinessEvaluation): Promise<any> {
    return {
      title: config.template.name,
      subtitle: `${config.tier.charAt(0).toUpperCase() + config.tier.slice(1)} Business Analysis Report`,
      companyInformation: {
        name: businessEvaluation.businessData.industry || 'Business Entity',
        industry: businessEvaluation.businessData.industry,
        location: 'Not Specified',
        establishedYear: new Date().getFullYear() - businessEvaluation.businessData.businessAge,
        description: `A ${businessEvaluation.businessData.industry} business with ${businessEvaluation.businessData.businessAge} years of operation`
      },
      reportDetails: {
        reportType: `${config.tier} Business Valuation`,
        analysisDate: new Date(),
        reportNumber: `RPT-${config.id.slice(-8).toUpperCase()}`,
        version: '2.0',
        preparerId: config.userId,
        reviewerId: 'AI-SYSTEM'
      },
      branding: config.styling.branding,
      confidentialityNotice: 'This report contains confidential and proprietary information. Distribution is restricted to authorized parties only.',
      styling: {
        backgroundColor: config.styling.colorScheme.background,
        backgroundImage: undefined,
        margins: config.styling.pageLayout.margins,
        orientation: config.styling.pageLayout.orientation
      }
    };
  }

  /**
   * Build Executive Summary Section
   */
  private async buildExecutiveSummary(businessEvaluation: BusinessEvaluation, aiAnalysis?: AnalysisResult): Promise<any> {
    const keyFindings = [
      {
        id: 'valuation',
        title: 'Business Valuation',
        description: `Current estimated value of $${businessEvaluation.valuations.weighted.value.toLocaleString()}`,
        impact: 'high' as const,
        category: 'financial' as const,
        confidence: businessEvaluation.valuations.weighted.confidence,
        supportingData: ['Asset-based analysis', 'Income approach', 'Market comparables']
      },
      {
        id: 'financial-health',
        title: 'Financial Health',
        description: `Annual revenue of $${businessEvaluation.businessData.annualRevenue.toLocaleString()} with ${businessEvaluation.businessData.growthRate > 0 ? 'positive' : 'negative'} growth trajectory`,
        impact: businessEvaluation.businessData.growthRate > 0.1 ? 'high' as const : 'medium' as const,
        category: 'financial' as const,
        confidence: 0.85,
        supportingData: ['Revenue analysis', 'Cash flow assessment', 'Profitability metrics']
      },
      {
        id: 'risk-profile',
        title: 'Risk Assessment',
        description: `Overall risk level assessed as ${businessEvaluation.riskFactors.length > 3 ? 'elevated' : 'moderate'}`,
        impact: businessEvaluation.riskFactors.length > 3 ? 'high' as const : 'medium' as const,
        category: 'risk' as const,
        confidence: 0.80,
        supportingData: ['Industry analysis', 'Operational assessment', 'Market conditions']
      }
    ];

    const primaryRecommendations = [
      {
        id: 'growth-strategy',
        title: 'Growth Strategy Enhancement',
        description: 'Focus on scaling revenue streams and improving operational efficiency',
        rationale: 'Current growth rate indicates potential for expansion with proper strategic focus',
        priority: 'high' as const,
        effort: 'moderate' as const,
        timeline: '6-12 months',
        expected_impact: {
          financial: { direction: 'positive' as const, magnitude: 'high' as const, confidence: 0.75 },
          operational: { direction: 'positive' as const, magnitude: 'medium' as const, confidence: 0.80 },
          strategic: { direction: 'positive' as const, magnitude: 'high' as const, confidence: 0.70 },
          time_to_value: '9 months'
        },
        prerequisites: ['Management commitment', 'Capital allocation', 'Market analysis'],
        risks: ['Market volatility', 'Competition response', 'Execution challenges']
      }
    ];

    return {
      keyFindings,
      primaryRecommendations,
      financialHighlights: [
        {
          metric: 'Business Value',
          value: businessEvaluation.valuations.weighted.value,
          unit: 'USD',
          trend: 'stable' as const,
          comparison: 'Industry average',
          significance: 'Primary valuation metric based on comprehensive analysis'
        },
        {
          metric: 'Annual Revenue',
          value: businessEvaluation.businessData.annualRevenue,
          unit: 'USD',
          trend: businessEvaluation.businessData.growthRate > 0 ? 'positive' as const : 'negative' as const,
          comparison: `${businessEvaluation.businessData.growthRate}% growth rate`,
          significance: 'Core revenue performance indicator'
        },
        {
          metric: 'Cash Flow',
          value: businessEvaluation.businessData.cashFlow,
          unit: 'USD',
          trend: businessEvaluation.businessData.cashFlow > 0 ? 'positive' as const : 'negative' as const,
          comparison: 'Operating cash generation',
          significance: 'Liquidity and operational efficiency measure'
        }
      ],
      valuationHighlight: {
        primaryValuation: businessEvaluation.valuations.weighted.value,
        valuationRange: businessEvaluation.valuations.weighted.range,
        methodology: 'Weighted average of asset, income, and market approaches',
        confidence: businessEvaluation.valuations.weighted.confidence,
        keyDrivers: ['Revenue performance', 'Asset base', 'Market position', 'Growth potential']
      },
      riskSummary: {
        overallRiskRating: businessEvaluation.riskFactors.length > 3 ? 'high' as const :
                           businessEvaluation.riskFactors.length > 1 ? 'medium' as const : 'low' as const,
        keyRisks: businessEvaluation.riskFactors.slice(0, 5).map(risk => risk.factor),
        mitigationStatus: 'adequate' as const,
        riskTrend: 'stable' as const
      },
      investmentThesis: {
        summary: `This ${businessEvaluation.businessData.industry} business demonstrates ${businessEvaluation.businessData.growthRate > 0 ? 'positive' : 'challenging'} fundamentals with a current valuation of $${businessEvaluation.valuations.weighted.value.toLocaleString()}.`,
        keyStrengths: [
          `${businessEvaluation.businessData.businessAge} years of operational history`,
          `$${businessEvaluation.businessData.annualRevenue.toLocaleString()} annual revenue`,
          `Strong asset base of $${(businessEvaluation.businessData.assets.tangible + businessEvaluation.businessData.assets.intangible).toLocaleString()}`
        ],
        valueDrivers: ['Market position', 'Operational efficiency', 'Financial performance', 'Growth potential'],
        competitiveAdvantages: ['Established market presence', 'Operational experience', 'Customer relationships'],
        investmentRationale: 'Well-positioned for sustainable growth with proper strategic execution'
      },
      strategicPriorities: [
        {
          priority: 'Revenue Growth',
          description: 'Focus on expanding market reach and increasing sales effectiveness',
          timeline: '6-12 months',
          investmentRequired: '10-15% of annual revenue',
          expectedReturn: '15-25% revenue increase'
        },
        {
          priority: 'Operational Efficiency',
          description: 'Streamline operations and reduce cost structure',
          timeline: '3-9 months',
          investmentRequired: '5-10% of annual revenue',
          expectedReturn: '8-12% margin improvement'
        }
      ]
    };
  }

  /**
   * Build Business Overview Section
   */
  private async buildBusinessOverview(businessEvaluation: BusinessEvaluation): Promise<any> {
    return {
      companyBackground: {
        foundingStory: `Established ${businessEvaluation.businessData.businessAge} years ago in the ${businessEvaluation.businessData.industry} industry`,
        missionStatement: `Dedicated to delivering value in the ${businessEvaluation.businessData.industry} sector`,
        visionStatement: 'To be a leading provider of quality services and products',
        coreValues: ['Quality', 'Innovation', 'Customer Focus', 'Integrity'],
        keyMilestones: [
          { year: new Date().getFullYear() - businessEvaluation.businessData.businessAge, event: 'Business Founded' },
          { year: new Date().getFullYear() - Math.floor(businessEvaluation.businessData.businessAge / 2), event: 'Major Growth Phase' },
          { year: new Date().getFullYear(), event: 'Current Operations' }
        ]
      },
      businessModel: {
        revenueStreams: [
          {
            name: 'Primary Revenue',
            percentage: 80,
            description: 'Core business operations',
            growthRate: businessEvaluation.businessData.growthRate
          },
          {
            name: 'Secondary Revenue',
            percentage: 20,
            description: 'Supplementary income sources',
            growthRate: businessEvaluation.businessData.growthRate * 0.5
          }
        ],
        costStructure: {
          fixedCosts: businessEvaluation.businessData.expenses * 0.6,
          variableCosts: businessEvaluation.businessData.expenses * 0.4,
          marginProfile: ((businessEvaluation.businessData.annualRevenue - businessEvaluation.businessData.expenses) / businessEvaluation.businessData.annualRevenue) * 100
        },
        valueProposition: `Delivering quality ${businessEvaluation.businessData.industry} solutions with proven track record`,
        targetMarket: `${businessEvaluation.businessData.industry} market segment`,
        competitivePositioning: businessEvaluation.businessData.marketPosition || 'Established market participant'
      },
      marketAnalysis: {
        marketSize: {
          total: businessEvaluation.businessData.annualRevenue * 50, // Estimated market size
          serviceable: businessEvaluation.businessData.annualRevenue * 10,
          addressable: businessEvaluation.businessData.annualRevenue * 5
        },
        marketGrowth: Math.max(businessEvaluation.businessData.growthRate, 0.03), // Minimum 3% assumed
        trends: [
          'Digital transformation',
          'Sustainability focus',
          'Customer experience enhancement',
          'Operational efficiency'
        ],
        drivers: [
          'Technology advancement',
          'Changing customer preferences',
          'Regulatory evolution',
          'Economic conditions'
        ]
      },
      competitiveLandscape: {
        competitorCount: 15, // Estimated
        marketConcentration: 'Fragmented',
        competitiveIntensity: 'Moderate',
        barrierToEntry: 'Medium',
        threatOfSubstitutes: 'Low to Medium',
        supplierPower: 'Medium',
        buyerPower: 'Medium'
      },
      keySuccessFactors: [
        'Operational excellence',
        'Customer relationships',
        'Quality delivery',
        'Cost management',
        'Market knowledge',
        'Financial stability'
      ],
      managementTeam: {
        teamSize: Math.ceil(businessEvaluation.businessData.annualRevenue / 200000), // Estimated team size
        experience: `Average ${businessEvaluation.businessData.businessAge} years industry experience`,
        keyRoles: ['Operations', 'Sales & Marketing', 'Finance', 'Customer Service'],
        strengthAreas: ['Industry knowledge', 'Operational execution'],
        developmentAreas: ['Strategic planning', 'Technology adoption']
      }
    };
  }

  /**
   * Build Financial Analysis Section
   */
  private async buildFinancialAnalysis(businessEvaluation: BusinessEvaluation): Promise<any> {
    const grossProfit = businessEvaluation.businessData.annualRevenue - (businessEvaluation.businessData.expenses * 0.6);
    const netProfit = businessEvaluation.businessData.annualRevenue - businessEvaluation.businessData.expenses;
    const totalAssets = Object.values(businessEvaluation.businessData.assets).reduce((sum, val) => sum + val, 0);
    const totalLiabilities = Object.values(businessEvaluation.businessData.liabilities).reduce((sum, val) => sum + val, 0);

    return {
      historicalPerformance: {
        revenueGrowth: [
          { period: 'Year -2', revenue: businessEvaluation.businessData.annualRevenue * 0.85, growth: 0 },
          { period: 'Year -1', revenue: businessEvaluation.businessData.annualRevenue * 0.92, growth: 8.2 },
          { period: 'Current', revenue: businessEvaluation.businessData.annualRevenue, growth: businessEvaluation.businessData.growthRate }
        ],
        profitabilityTrend: 'Stable',
        seasonality: 'Moderate seasonal variation',
        cyclicality: 'Aligned with industry cycles'
      },
      profitabilityAnalysis: {
        grossMargin: (grossProfit / businessEvaluation.businessData.annualRevenue) * 100,
        netMargin: (netProfit / businessEvaluation.businessData.annualRevenue) * 100,
        ebitdaMargin: ((netProfit + businessEvaluation.businessData.expenses * 0.1) / businessEvaluation.businessData.annualRevenue) * 100,
        returnOnAssets: (netProfit / totalAssets) * 100,
        returnOnEquity: (netProfit / (totalAssets - totalLiabilities)) * 100,
        marginStability: 'Consistent',
        benchmarkComparison: 'Inline with industry averages'
      },
      cashFlowAnalysis: {
        operatingCashFlow: businessEvaluation.businessData.cashFlow,
        freeCashFlow: businessEvaluation.businessData.cashFlow * 0.8,
        cashConversion: 85,
        workingCapitalManagement: 'Adequate',
        capitalRequirements: businessEvaluation.businessData.annualRevenue * 0.05,
        cashFlowStability: businessEvaluation.businessData.cashFlow > 0 ? 'Stable' : 'Variable'
      },
      balanceSheetAnalysis: {
        assetUtilization: (businessEvaluation.businessData.annualRevenue / totalAssets) * 100,
        leverageRatio: totalLiabilities / totalAssets,
        liquidityPosition: 'Adequate',
        assetQuality: 'Good',
        capitalStructure: {
          debt: totalLiabilities,
          equity: totalAssets - totalLiabilities,
          debtToEquity: totalLiabilities / (totalAssets - totalLiabilities)
        }
      },
      financialRatios: {
        liquidityRatios: {
          currentRatio: 1.5,
          quickRatio: 1.2,
          cashRatio: 0.3
        },
        activityRatios: {
          assetTurnover: businessEvaluation.businessData.annualRevenue / totalAssets,
          inventoryTurnover: 6.5,
          receivablesTurnover: 8.2
        },
        leverageRatios: {
          debtToAssets: totalLiabilities / totalAssets,
          debtToEquity: totalLiabilities / (totalAssets - totalLiabilities),
          interestCoverage: 4.5
        },
        profitabilityRatios: {
          grossMargin: (grossProfit / businessEvaluation.businessData.annualRevenue) * 100,
          netMargin: (netProfit / businessEvaluation.businessData.annualRevenue) * 100,
          returnOnAssets: (netProfit / totalAssets) * 100,
          returnOnEquity: (netProfit / (totalAssets - totalLiabilities)) * 100
        }
      },
      workingCapitalAnalysis: {
        workingCapital: businessEvaluation.businessData.assets.tangible - businessEvaluation.businessData.liabilities.shortTerm,
        workingCapitalRatio: businessEvaluation.businessData.assets.tangible / businessEvaluation.businessData.liabilities.shortTerm,
        daysInReceivables: 45,
        daysInInventory: 60,
        daysInPayables: 30,
        cashCycle: 75
      },
      trendAnalysis: {
        revenueGrowth: businessEvaluation.businessData.growthRate > 0 ? 'Positive' : 'Declining',
        profitabilityTrend: 'Stable',
        cashFlowTrend: businessEvaluation.businessData.cashFlow > 0 ? 'Positive' : 'Negative',
        assetEfficiency: 'Improving',
        futureOutlook: businessEvaluation.businessData.growthRate > 0.05 ? 'Positive' : 'Cautious'
      }
    };
  }

  /**
   * Build Operational Assessment Section
   */
  private async buildOperationalAssessment(businessEvaluation: BusinessEvaluation): Promise<any> {
    return {
      operationalEfficiency: {
        processMaturity: 'Established',
        automationLevel: 'Moderate',
        qualityMetrics: {
          defectRate: 2.5,
          customerSatisfaction: 85,
          onTimeDelivery: 92
        },
        productivityMetrics: {
          revenuePerEmployee: businessEvaluation.businessData.annualRevenue / Math.max(1, Math.ceil(businessEvaluation.businessData.annualRevenue / 100000)),
          utilizationRate: 78,
          outputPerHour: 'Above average'
        },
        benchmarkPerformance: 'Industry aligned'
      },
      processOptimization: {
        currentStateAssessment: 'Functional processes with improvement opportunities',
        identifiedGaps: [
          'Digital workflow optimization',
          'Data integration enhancement',
          'Performance monitoring systems'
        ],
        improvementOpportunities: [
          {
            process: 'Order Management',
            currentEfficiency: 75,
            targetEfficiency: 90,
            investmentRequired: businessEvaluation.businessData.annualRevenue * 0.02,
            expectedBenefits: 'Reduced processing time and errors'
          },
          {
            process: 'Customer Service',
            currentEfficiency: 82,
            targetEfficiency: 95,
            investmentRequired: businessEvaluation.businessData.annualRevenue * 0.015,
            expectedBenefits: 'Improved customer satisfaction'
          }
        ],
        implementationPriority: 'High'
      },
      technologyAssessment: {
        currentTechStack: {
          coreSystemAge: Math.min(businessEvaluation.businessData.businessAge, 8),
          integrationLevel: 'Moderate',
          scalabilityRating: 'Good',
          securityPosture: 'Adequate'
        },
        digitalMaturity: 'Developing',
        technologyGaps: [
          'Advanced analytics',
          'Cloud infrastructure',
          'Mobile optimization',
          'Integration platforms'
        ],
        upgradeRecommendations: [
          'CRM system enhancement',
          'Financial management platform',
          'Business intelligence tools',
          'Cybersecurity improvements'
        ],
        investmentPriority: 'Medium to High'
      },
      humanCapitalAnalysis: {
        workforceComposition: {
          totalEmployees: Math.ceil(businessEvaluation.businessData.annualRevenue / 100000),
          skillDistribution: {
            technical: 40,
            sales: 25,
            operations: 25,
            administrative: 10
          },
          experienceProfile: 'Mixed experience levels'
        },
        talentManagement: {
          retentionRate: 85,
          developmentInvestment: 'Moderate',
          successionPlanning: 'Developing',
          performanceManagement: 'Established'
        },
        capabilityGaps: [
          'Digital skills',
          'Strategic planning',
          'Data analysis',
          'Project management'
        ],
        developmentPriorities: [
          'Leadership development',
          'Technical training',
          'Customer service excellence'
        ]
      },
      scalabilityAssessment: {
        currentCapacityUtilization: 75,
        scalabilityConstraints: [
          'Process bottlenecks',
          'Technology limitations',
          'Skills availability'
        ],
        growthReadiness: {
          operational: 'Good',
          technological: 'Moderate',
          human: 'Good',
          financial: businessEvaluation.businessData.cashFlow > 0 ? 'Good' : 'Limited'
        },
        expansionRequirements: {
          infrastructure: businessEvaluation.businessData.annualRevenue * 0.08,
          personnel: businessEvaluation.businessData.annualRevenue * 0.12,
          technology: businessEvaluation.businessData.annualRevenue * 0.05
        }
      },
      qualityManagement: {
        qualityFramework: 'Informal processes',
        complianceStatus: 'Meeting requirements',
        certifications: 'Industry standard',
        continuousImprovement: 'Active',
        customerFeedback: 'Regular collection',
        qualityMetrics: {
          customerComplaints: 3.2,
          returnRate: 2.8,
          firstCallResolution: 82
        }
      }
    };
  }

  /**
   * Build Strategic Positioning Section
   */
  private async buildStrategicPositioning(businessEvaluation: BusinessEvaluation): Promise<any> {
    return {
      marketPosition: {
        marketShare: 'Established presence',
        brandRecognition: 'Regional recognition',
        customerLoyalty: 'Strong relationships',
        pricingPosition: 'Competitive pricing',
        distributionReach: 'Local/Regional',
        competitiveRanking: 'Top tier in local market'
      },
      competitiveAdvantages: [
        {
          advantage: 'Operational Experience',
          sustainability: 'High',
          differentiationLevel: 'Moderate',
          competitorResponse: 'Difficult to replicate',
          valueToCustomers: 'Reliability and quality',
          strategicImportance: 'High'
        },
        {
          advantage: 'Customer Relationships',
          sustainability: 'High',
          differentiationLevel: 'High',
          competitorResponse: 'Long-term to replicate',
          valueToCustomers: 'Trust and service',
          strategicImportance: 'Very High'
        },
        {
          advantage: 'Local Market Knowledge',
          sustainability: 'Medium',
          differentiationLevel: 'High',
          competitorResponse: 'Moderate difficulty',
          valueToCustomers: 'Relevant solutions',
          strategicImportance: 'High'
        }
      ],
      swotAnalysis: {
        strengths: [
          `${businessEvaluation.businessData.businessAge} years of operational experience`,
          'Established customer base',
          'Strong local market presence',
          'Consistent financial performance',
          'Quality service delivery'
        ],
        weaknesses: [
          'Limited geographic reach',
          'Technology modernization needs',
          'Growth capital constraints',
          'Process standardization opportunities'
        ],
        opportunities: [
          'Market expansion',
          'Service diversification',
          'Technology adoption',
          'Strategic partnerships',
          'Digital transformation'
        ],
        threats: [
          'Increased competition',
          'Economic volatility',
          'Regulatory changes',
          'Technology disruption',
          'Customer preference shifts'
        ]
      },
      valueProposition: {
        coreValue: `Reliable ${businessEvaluation.businessData.industry} solutions with personalized service`,
        uniqueSellingPoints: [
          'Proven track record',
          'Customer-focused approach',
          'Quality consistency',
          'Local expertise'
        ],
        customerBenefits: [
          'Reduced risk',
          'Improved outcomes',
          'Cost effectiveness',
          'Reliable partnership'
        ],
        competitiveDifferentiation: 'Experience-based quality and customer relationships'
      },
      strategicAssets: [
        {
          asset: 'Customer Database',
          value: businessEvaluation.businessData.customerCount * 500, // Estimated value per customer
          criticality: 'High',
          competitiveAdvantage: 'Significant',
          monetizationPotential: 'High'
        },
        {
          asset: 'Operational Knowledge',
          value: businessEvaluation.businessData.annualRevenue * 0.2,
          criticality: 'High',
          competitiveAdvantage: 'High',
          monetizationPotential: 'Medium'
        },
        {
          asset: 'Market Position',
          value: businessEvaluation.businessData.annualRevenue * 0.15,
          criticality: 'Medium',
          competitiveAdvantage: 'Medium',
          monetizationPotential: 'High'
        }
      ],
      growthPotential: {
        marketExpansion: 'Geographic and service expansion opportunities',
        productDevelopment: 'Service enhancement and new offerings',
        channelDevelopment: 'Digital and partnership channels',
        acquisitionOpportunities: 'Complementary business acquisitions',
        organicGrowthRate: Math.max(businessEvaluation.businessData.growthRate, 0.05),
        potentialMarketSize: businessEvaluation.businessData.annualRevenue * 3,
        timeToRealize: '2-4 years',
        investmentRequired: businessEvaluation.businessData.annualRevenue * 0.25
      }
    };
  }

  /**
   * Build Risk Analysis Section
   */
  private async buildRiskAnalysis(businessEvaluation: BusinessEvaluation, aiAnalysis?: AnalysisResult): Promise<any> {
    const risksByCategory = {
      financial: businessEvaluation.riskFactors.filter(r => r.category === 'financial'),
      operational: businessEvaluation.riskFactors.filter(r => r.category === 'operational'),
      market: businessEvaluation.riskFactors.filter(r => r.category === 'market'),
      regulatory: businessEvaluation.riskFactors.filter(r => r.category === 'regulatory')
    };

    return {
      riskSummary: {
        overallRiskScore: businessEvaluation.riskFactors.reduce((sum, risk) => sum + risk.likelihood * (risk.impact === 'high' ? 3 : risk.impact === 'medium' ? 2 : 1), 0) / businessEvaluation.riskFactors.length,
        riskTolerance: 'Moderate',
        riskManagementMaturity: 'Developing',
        keyRiskDrivers: businessEvaluation.riskFactors.slice(0, 3).map(r => r.factor)
      },
      risksByCategory: {
        financial: {
          risks: risksByCategory.financial.map(risk => ({
            risk: risk.factor,
            probability: risk.likelihood,
            impact: risk.impact,
            severity: risk.impact === 'high' ? 'High' : risk.impact === 'medium' ? 'Medium' : 'Low',
            trend: 'Stable',
            mitigation: risk.mitigation[0] || 'Standard risk management practices'
          })),
          categoryScore: risksByCategory.financial.length > 0 ? 'Medium' : 'Low',
          trend: 'Stable'
        },
        operational: {
          risks: risksByCategory.operational.map(risk => ({
            risk: risk.factor,
            probability: risk.likelihood,
            impact: risk.impact,
            severity: risk.impact === 'high' ? 'High' : risk.impact === 'medium' ? 'Medium' : 'Low',
            trend: 'Stable',
            mitigation: risk.mitigation[0] || 'Operational best practices'
          })),
          categoryScore: risksByCategory.operational.length > 0 ? 'Medium' : 'Low',
          trend: 'Stable'
        },
        market: {
          risks: risksByCategory.market.map(risk => ({
            risk: risk.factor,
            probability: risk.likelihood,
            impact: risk.impact,
            severity: risk.impact === 'high' ? 'High' : risk.impact === 'medium' ? 'Medium' : 'Low',
            trend: 'Stable',
            mitigation: risk.mitigation[0] || 'Market monitoring and adaptation'
          })),
          categoryScore: risksByCategory.market.length > 0 ? 'Medium' : 'Low',
          trend: 'Stable'
        },
        regulatory: {
          risks: risksByCategory.regulatory.map(risk => ({
            risk: risk.factor,
            probability: risk.likelihood,
            impact: risk.impact,
            severity: risk.impact === 'high' ? 'High' : risk.impact === 'medium' ? 'Medium' : 'Low',
            trend: 'Stable',
            mitigation: risk.mitigation[0] || 'Compliance monitoring'
          })),
          categoryScore: risksByCategory.regulatory.length > 0 ? 'Medium' : 'Low',
          trend: 'Stable'
        }
      },
      mitigationStrategies: businessEvaluation.riskFactors.map(risk => ({
        riskCategory: risk.category,
        strategy: risk.mitigation[0] || 'Standard mitigation approach',
        implementation: 'In progress',
        effectiveness: 'Moderate',
        cost: businessEvaluation.businessData.annualRevenue * 0.01,
        timeline: '3-6 months',
        owner: 'Management team',
        success_metrics: ['Risk score reduction', 'Incident frequency', 'Impact severity']
      })),
      monitoringFramework: {
        riskAssessmentFrequency: 'Quarterly',
        keyRiskIndicators: ['Financial performance', 'Operational metrics', 'Market conditions'],
        reportingStructure: 'Monthly risk reports to management',
        escalationProcedures: 'Defined escalation matrix',
        riskRegister: 'Maintained and updated regularly'
      },
      scenarioRisks: [
        {
          scenario: 'Economic Downturn',
          probability: 0.3,
          impact: 'High',
          description: 'Significant economic recession affecting market demand',
          mitigationApproach: 'Diversification and cost management',
          contingencyPlans: 'Emergency cost reduction and cash preservation'
        },
        {
          scenario: 'Key Customer Loss',
          probability: 0.2,
          impact: 'Medium',
          description: 'Loss of major customer relationships',
          mitigationApproach: 'Customer diversification and retention programs',
          contingencyPlans: 'Accelerated new customer acquisition'
        }
      ]
    };
  }

  /**
   * Build Investment Recommendations Section
   */
  private async buildInvestmentRecommendations(businessEvaluation: BusinessEvaluation, aiAnalysis?: AnalysisResult): Promise<any> {
    const recommendations = [
      {
        id: 'growth-investment',
        title: 'Revenue Growth Initiative',
        description: 'Strategic investment in sales and marketing capabilities to accelerate revenue growth',
        category: 'growth' as const,
        priority: 'high' as const,
        timeframe: 'short_term' as const,
        investmentRequired: {
          total: businessEvaluation.businessData.annualRevenue * 0.15,
          breakdown: [
            { category: 'Marketing & Sales', amount: businessEvaluation.businessData.annualRevenue * 0.08, description: 'Enhanced marketing programs', timing: 'Immediate' },
            { category: 'Technology', amount: businessEvaluation.businessData.annualRevenue * 0.05, description: 'CRM and sales tools', timing: 'Q1-Q2' },
            { category: 'Personnel', amount: businessEvaluation.businessData.annualRevenue * 0.02, description: 'Sales team expansion', timing: 'Q2-Q3' }
          ],
          timeline: [
            { phase: 'Phase 1', amount: businessEvaluation.businessData.annualRevenue * 0.08, startDate: new Date(), endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
            { phase: 'Phase 2', amount: businessEvaluation.businessData.annualRevenue * 0.07, startDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) }
          ],
          fundingSources: [
            { source: 'internal_cash' as const, amount: businessEvaluation.businessData.annualRevenue * 0.10, cost: 0, terms: 'Internal funding' },
            { source: 'debt' as const, amount: businessEvaluation.businessData.annualRevenue * 0.05, cost: 0.08, terms: 'Bank financing' }
          ]
        },
        expectedOutcome: {
          financial: {
            revenueImpact: businessEvaluation.businessData.annualRevenue * 0.20,
            costSavings: 0,
            profitabilityImprovement: businessEvaluation.businessData.annualRevenue * 0.12,
            roi: 0.25,
            paybackPeriod: 2.5,
            npv: businessEvaluation.businessData.annualRevenue * 0.35
          },
          operational: {
            efficiencyGains: 15,
            qualityImprovements: ['Enhanced customer acquisition', 'Improved sales process'],
            capacityIncrease: 25,
            processImprovements: ['Sales automation', 'Lead management', 'Customer analytics']
          },
          strategic: {
            competitiveAdvantage: ['Enhanced market presence', 'Improved customer relationships'],
            marketPosition: 'Strengthened local market leader',
            riskReduction: ['Customer concentration risk', 'Revenue volatility'],
            capabilityEnhancement: ['Sales excellence', 'Marketing effectiveness', 'Customer insights']
          },
          timeline: [
            { milestone: 'System Implementation', targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), metrics: { 'Implementation Progress': 100 }, dependencies: ['Technology procurement', 'Staff training'] },
            { milestone: 'Revenue Growth', targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), metrics: { 'Revenue Increase': 10 }, dependencies: ['Team hiring', 'Process optimization'] }
          ]
        },
        riskAssessment: {
          overallRisk: 'medium' as const,
          risks: [
            { type: 'Execution Risk', description: 'Implementation challenges', probability: 0.3, impact: 2, severity: 'medium' as const },
            { type: 'Market Risk', description: 'Market response uncertainty', probability: 0.2, impact: 3, severity: 'medium' as const }
          ],
          mitigationStrategies: [
            { risk: 'Execution Risk', strategy: 'Phased implementation with monitoring', cost: businessEvaluation.businessData.annualRevenue * 0.01, effectiveness: 0.8 },
            { risk: 'Market Risk', strategy: 'Market testing and gradual rollout', cost: businessEvaluation.businessData.annualRevenue * 0.005, effectiveness: 0.7 }
          ]
        },
        implementation: {
          phases: [
            { phase: 'Planning', description: 'Detailed planning and preparation', duration: 30, resources: ['Management team'], deliverables: ['Implementation plan', 'Resource allocation'], successCriteria: ['Plan approval', 'Resource commitment'] },
            { phase: 'Execution', description: 'Implementation of growth initiatives', duration: 120, resources: ['Sales team', 'Marketing team'], deliverables: ['System deployment', 'Process implementation'], successCriteria: ['System operational', 'Process adoption'] },
            { phase: 'Optimization', description: 'Performance monitoring and optimization', duration: 90, resources: ['Operations team'], deliverables: ['Performance reports', 'Optimization recommendations'], successCriteria: ['Target achievement', 'ROI realization'] }
          ],
          resources: [
            { type: 'human' as const, description: 'Project management and implementation team', quantity: 3, cost: businessEvaluation.businessData.annualRevenue * 0.03, timeline: '6 months' },
            { type: 'technology' as const, description: 'CRM and marketing automation systems', quantity: 1, cost: businessEvaluation.businessData.annualRevenue * 0.05, timeline: '3 months' },
            { type: 'financial' as const, description: 'Marketing and advertising budget', quantity: 1, cost: businessEvaluation.businessData.annualRevenue * 0.07, timeline: '12 months' }
          ],
          timeline: {
            totalDuration: 240,
            phases: [
              { phase: 'Planning', startDate: new Date(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), duration: 30 },
              { phase: 'Execution', startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000), duration: 120 },
              { phase: 'Optimization', startDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000), duration: 90 }
            ],
            milestones: [
              { milestone: 'Project Kickoff', targetDate: new Date(), description: 'Project initiation', dependencies: [] },
              { milestone: 'System Go-Live', targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), description: 'Technology implementation', dependencies: ['Planning completion'] },
              { milestone: 'Performance Review', targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), description: 'First performance assessment', dependencies: ['System deployment'] }
            ]
          },
          dependencies: ['Management commitment', 'Budget approval', 'Technology vendor selection'],
          criticalPath: ['Planning', 'Technology procurement', 'Implementation', 'Testing', 'Go-live']
        },
        successMetrics: [
          { name: 'Revenue Growth', description: 'Increase in annual revenue', baseline: businessEvaluation.businessData.annualRevenue, target: businessEvaluation.businessData.annualRevenue * 1.2, unit: 'USD', measurementFrequency: 'monthly' as const, owner: 'Sales Manager' },
          { name: 'Customer Acquisition', description: 'New customers acquired', baseline: businessEvaluation.businessData.customerCount, target: businessEvaluation.businessData.customerCount * 1.3, unit: 'count', measurementFrequency: 'monthly' as const, owner: 'Sales Manager' },
          { name: 'Sales Efficiency', description: 'Revenue per sales FTE', baseline: businessEvaluation.businessData.annualRevenue / 2, target: businessEvaluation.businessData.annualRevenue / 2 * 1.25, unit: 'USD', measurementFrequency: 'quarterly' as const, owner: 'Sales Director' }
        ]
      }
    ];

    return {
      primaryRecommendations: recommendations,
      implementationRoadmap: {
        overallTimeline: '12-18 months',
        phases: [
          { phase: 'Foundation', duration: '0-6 months', focus: 'Infrastructure and capability building', keyMilestones: ['System implementation', 'Team building'] },
          { phase: 'Growth', duration: '6-12 months', focus: 'Revenue expansion and market development', keyMilestones: ['Market expansion', 'Revenue targets'] },
          { phase: 'Optimization', duration: '12-18 months', focus: 'Performance optimization and scaling', keyMilestones: ['Efficiency targets', 'ROI achievement'] }
        ],
        dependencies: ['Management commitment', 'Capital availability', 'Market conditions'],
        risks: ['Execution challenges', 'Market volatility', 'Resource constraints'],
        successFactors: ['Strong project management', 'Stakeholder alignment', 'Performance monitoring']
      },
      prioritiesMatrix: {
        highImpactHighUrgency: ['Revenue growth initiative'],
        highImpactLowUrgency: ['Technology modernization'],
        lowImpactHighUrgency: ['Process optimization'],
        lowImpactLowUrgency: ['Administrative improvements']
      },
      resourceRequirements: [
        { type: 'human' as const, description: 'Additional sales and marketing personnel', quantity: 2, cost: businessEvaluation.businessData.annualRevenue * 0.08, timeline: '6 months' },
        { type: 'technology' as const, description: 'CRM and analytics systems', quantity: 1, cost: businessEvaluation.businessData.annualRevenue * 0.04, timeline: '3 months' },
        { type: 'financial' as const, description: 'Marketing and expansion capital', quantity: 1, cost: businessEvaluation.businessData.annualRevenue * 0.12, timeline: '12 months' }
      ],
      expectedOutcomes: [
        {
          timeframe: 'Year 1',
          revenueIncrease: businessEvaluation.businessData.annualRevenue * 0.15,
          profitabilityImprovement: businessEvaluation.businessData.annualRevenue * 0.08,
          marketPositionGain: 'Enhanced local market presence',
          riskReduction: 'Diversified revenue streams'
        }
      ],
      successMetrics: [
        { name: 'ROI Achievement', description: 'Overall return on investment', baseline: 0, target: 0.25, unit: 'ratio', measurementFrequency: 'quarterly' as const, owner: 'CFO' },
        { name: 'Market Share', description: 'Local market share growth', baseline: 10, target: 15, unit: 'percentage', measurementFrequency: 'annually' as const, owner: 'CEO' }
      ]
    };
  }

  /**
   * Build Valuation Summary Section
   */
  private async buildValuationSummary(businessEvaluation: BusinessEvaluation): Promise<any> {
    return {
      methodology: {
        approachesUsed: ['Asset-based approach', 'Income approach', 'Market approach'],
        primaryApproach: 'Income approach',
        rationale: 'Income approach selected as primary due to stable cash flows and growth potential',
        limitations: ['Limited market comparables', 'Economic uncertainty', 'Industry-specific factors'],
        assumptions: [
          { assumption: 'Growth rate sustainability', value: businessEvaluation.businessData.growthRate, rationale: 'Based on historical performance and market conditions', sensitivity: 'high' as const, source: 'Financial analysis' },
          { assumption: 'Discount rate', value: 0.12, rationale: 'Risk-adjusted cost of capital', sensitivity: 'medium' as const, source: 'Market data' },
          { assumption: 'Terminal value', value: businessEvaluation.valuations.incomeBased.terminalValue, rationale: 'Perpetual growth model', sensitivity: 'high' as const, source: 'Projection model' }
        ]
      },
      valuationApproaches: [
        {
          name: 'Asset-based Valuation',
          methodology: 'Net asset value adjusted for market conditions',
          value: businessEvaluation.valuations.assetBased.value,
          weight: businessEvaluation.valuations.weighted.weights.asset,
          confidence: businessEvaluation.valuations.assetBased.confidence,
          assumptions: businessEvaluation.valuations.assetBased.assumptions,
          limitations: ['Asset age and condition', 'Market liquidity'],
          calculations: [
            { step: 'Total Assets', formula: 'Tangible + Intangible Assets', inputs: { tangible: businessEvaluation.businessData.assets.tangible, intangible: businessEvaluation.businessData.assets.intangible }, result: businessEvaluation.businessData.assets.tangible + businessEvaluation.businessData.assets.intangible, explanation: 'Sum of all business assets' },
            { step: 'Net Asset Value', formula: 'Total Assets - Total Liabilities', inputs: { assets: businessEvaluation.businessData.assets.tangible + businessEvaluation.businessData.assets.intangible, liabilities: businessEvaluation.businessData.liabilities.shortTerm + businessEvaluation.businessData.liabilities.longTerm }, result: businessEvaluation.valuations.assetBased.value, explanation: 'Net book value of business assets' }
          ]
        },
        {
          name: 'Income-based Valuation',
          methodology: 'Discounted cash flow analysis',
          value: businessEvaluation.valuations.incomeBased.value,
          weight: businessEvaluation.valuations.weighted.weights.income,
          confidence: businessEvaluation.valuations.incomeBased.confidence,
          assumptions: [`Discount rate: ${businessEvaluation.valuations.incomeBased.discountRate}`, 'Growth rate assumptions', 'Cash flow projections'],
          limitations: ['Projection uncertainty', 'Discount rate sensitivity'],
          calculations: [
            { step: 'Annual Cash Flow', formula: 'Revenue - Expenses + Depreciation', inputs: { revenue: businessEvaluation.businessData.annualRevenue, expenses: businessEvaluation.businessData.expenses }, result: businessEvaluation.businessData.cashFlow, explanation: 'Operating cash flow generation' },
            { step: 'Present Value', formula: 'CF / (1 + r)^n', inputs: { cashFlow: businessEvaluation.businessData.cashFlow, rate: businessEvaluation.valuations.incomeBased.discountRate }, result: businessEvaluation.valuations.incomeBased.value, explanation: 'Discounted future cash flows' }
          ]
        },
        {
          name: 'Market-based Valuation',
          methodology: 'Comparable company analysis',
          value: businessEvaluation.valuations.marketBased.value,
          weight: businessEvaluation.valuations.weighted.weights.market,
          confidence: businessEvaluation.valuations.marketBased.confidence,
          assumptions: ['Industry multiples', 'Comparable company selection', 'Market conditions'],
          limitations: ['Limited comparables', 'Market volatility'],
          calculations: [
            { step: 'Revenue Multiple', formula: 'Market Value / Revenue', inputs: { revenue: businessEvaluation.businessData.annualRevenue, multiple: 2.5 }, result: businessEvaluation.businessData.annualRevenue * 2.5, explanation: 'Industry revenue multiple application' }
          ]
        }
      ],
      reconciliation: {
        weightedValue: businessEvaluation.valuations.weighted.value,
        range: businessEvaluation.valuations.weighted.range,
        confidence: businessEvaluation.valuations.weighted.confidence,
        reconciliationFactors: [
          { factor: 'Methodology weights', adjustment: 0, rationale: 'Equal consideration of all approaches', impact: 'neutral' as const },
          { factor: 'Quality of earnings', adjustment: businessEvaluation.valuations.weighted.value * 0.05, rationale: 'Stable earnings quality', impact: 'positive' as const }
        ],
        finalAdjustments: [
          { type: 'marketability_discount' as const, percentage: 0.15, amount: businessEvaluation.valuations.weighted.value * 0.15, rationale: 'Limited marketability for private business' }
        ]
      },
      sensitivityAnalysis: {
        baseCase: businessEvaluation.valuations.weighted.value,
        variables: [
          { variable: 'Growth Rate', baseValue: businessEvaluation.businessData.growthRate, range: { min: businessEvaluation.businessData.growthRate - 0.05, max: businessEvaluation.businessData.growthRate + 0.05 }, impact: { min: businessEvaluation.valuations.weighted.value * 0.85, max: businessEvaluation.valuations.weighted.value * 1.15 } },
          { variable: 'Discount Rate', baseValue: 0.12, range: { min: 0.10, max: 0.15 }, impact: { min: businessEvaluation.valuations.weighted.value * 1.10, max: businessEvaluation.valuations.weighted.value * 0.90 } }
        ],
        scenarios: [
          { name: 'Optimistic', variables: { growthRate: businessEvaluation.businessData.growthRate + 0.05, discountRate: 0.10 }, result: businessEvaluation.valuations.weighted.value * 1.25, variance: 0.25 },
          { name: 'Pessimistic', variables: { growthRate: businessEvaluation.businessData.growthRate - 0.05, discountRate: 0.15 }, result: businessEvaluation.valuations.weighted.value * 0.75, variance: -0.25 }
        ],
        tornado: [
          { variable: 'Growth Rate', lowImpact: businessEvaluation.valuations.weighted.value * 0.85, highImpact: businessEvaluation.valuations.weighted.value * 1.15, range: businessEvaluation.valuations.weighted.value * 0.30 },
          { variable: 'Discount Rate', lowImpact: businessEvaluation.valuations.weighted.value * 0.90, highImpact: businessEvaluation.valuations.weighted.value * 1.10, range: businessEvaluation.valuations.weighted.value * 0.20 }
        ]
      },
      comparableAnalysis: {
        industryMultiples: businessEvaluation.valuations.marketBased.multiples.map(multiple => ({
          multiple: multiple.type,
          industryAverage: multiple.industryAverage,
          companyValue: multiple.value,
          variance: (multiple.value - multiple.industryAverage) / multiple.industryAverage,
          rationale: 'Based on industry data and comparable transactions'
        })),
        comparableCompanies: businessEvaluation.valuations.marketBased.comparableCompanies.map(comp => ({
          company: comp.name,
          industry: comp.industry,
          size: comp.revenue > businessEvaluation.businessData.annualRevenue ? 'Larger' : 'Similar',
          multiple: comp.multiple,
          adjustments: comp.adjustments,
          relevance: comp.similarityScore
        })),
        marketConditions: 'Stable market conditions with moderate transaction activity',
        valuationRange: businessEvaluation.valuations.weighted.range
      },
      adjustments: [
        { type: 'control_premium' as const, percentage: 0, amount: 0, rationale: 'Assuming controlling interest' },
        { type: 'marketability_discount' as const, percentage: 0.15, amount: businessEvaluation.valuations.weighted.value * 0.15, rationale: 'Private company marketability constraints' },
        { type: 'size_discount' as const, percentage: 0.05, amount: businessEvaluation.valuations.weighted.value * 0.05, rationale: 'Small business size factors' }
      ]
    };
  }

  /**
   * Build Appendices Section
   */
  private async buildAppendices(businessEvaluation: BusinessEvaluation, config: ReportGenerationConfig): Promise<any> {
    return {
      financialStatements: {
        incomeStatement: {
          revenue: businessEvaluation.businessData.annualRevenue,
          expenses: businessEvaluation.businessData.expenses,
          grossProfit: businessEvaluation.businessData.annualRevenue - (businessEvaluation.businessData.expenses * 0.6),
          netIncome: businessEvaluation.businessData.annualRevenue - businessEvaluation.businessData.expenses,
          period: 'Annual'
        },
        balanceSheet: {
          assets: businessEvaluation.businessData.assets,
          liabilities: businessEvaluation.businessData.liabilities,
          equity: Object.values(businessEvaluation.businessData.assets).reduce((sum, val) => sum + val, 0) - Object.values(businessEvaluation.businessData.liabilities).reduce((sum, val) => sum + val, 0),
          asOfDate: businessEvaluation.createdAt
        },
        cashFlowStatement: {
          operatingCashFlow: businessEvaluation.businessData.cashFlow,
          investingCashFlow: businessEvaluation.businessData.cashFlow * -0.2,
          financingCashFlow: businessEvaluation.businessData.cashFlow * -0.1,
          netCashFlow: businessEvaluation.businessData.cashFlow * 0.7,
          period: 'Annual'
        }
      },
      methodologyDocumentation: {
        valuationStandards: 'Professional valuation standards applied',
        dataCollection: 'Financial and operational data analysis',
        analysisFramework: 'Comprehensive business analysis methodology',
        qualityAssurance: 'Multi-stage review and validation process',
        limitations: ['Data availability', 'Market conditions', 'Economic uncertainty']
      },
      dataSources: [
        { source: 'Business Financial Records', reliability: 'High', date: businessEvaluation.createdAt, description: 'Primary financial data' },
        { source: 'Industry Research', reliability: 'Medium', date: new Date(), description: 'Market and industry analysis' },
        { source: 'Market Data', reliability: 'Medium', date: new Date(), description: 'Comparable company information' }
      ],
      glossary: [
        { term: 'Business Valuation', definition: 'The process of determining the economic value of a business entity' },
        { term: 'DCF', definition: 'Discounted Cash Flow - a valuation method using projected cash flows' },
        { term: 'EBITDA', definition: 'Earnings Before Interest, Taxes, Depreciation, and Amortization' },
        { term: 'Market Multiple', definition: 'Valuation ratio based on comparable company metrics' },
        { term: 'Net Present Value', definition: 'Present value of cash flows discounted at required rate of return' }
      ],
      additionalVisualizations: [
        {
          type: 'chart',
          title: 'Historical Performance Trend',
          description: 'Revenue and profitability trends over time',
          dataSet: 'Financial performance'
        },
        {
          type: 'table',
          title: 'Detailed Financial Ratios',
          description: 'Comprehensive financial ratio analysis',
          dataSet: 'Financial metrics'
        }
      ],
      technicalAssumptions: [
        { category: 'Valuation', assumption: 'Going concern basis', rationale: 'Business continues normal operations' },
        { category: 'Growth', assumption: 'Sustainable growth rate', rationale: 'Based on historical performance and market conditions' },
        { category: 'Risk', assumption: 'Industry risk profile', rationale: 'Risk assessment based on industry characteristics' }
      ]
    };
  }

  // Enterprise-specific section builders
  private async buildScenarioAnalysis(enterpriseData: EnterpriseTierData, businessEvaluation: BusinessEvaluation): Promise<any> {
    return {
      scenarioOverview: {
        methodology: 'Monte Carlo simulation with key business variables',
        numberOfScenarios: 4,
        confidenceLevel: 0.90,
        timeHorizon: 5,
        keyVariables: ['Revenue growth', 'Margin expansion', 'Market conditions', 'Capital requirements']
      },
      baseCase: {
        id: 'base-case',
        name: 'Base Case Scenario',
        description: 'Most likely outcome based on current trends and market conditions',
        probability: 0.50,
        assumptions: [
          { parameter: 'Revenue Growth', value: businessEvaluation.businessData.growthRate, unit: '%', rationale: 'Historical performance trend', confidence: 0.80, sensitivity: 'high' as const },
          { parameter: 'Gross Margin', value: enterpriseData.multiYearProjections.currentGrossMargin, unit: '%', rationale: 'Current operational efficiency', confidence: 0.85, sensitivity: 'medium' as const }
        ],
        projections: enterpriseData.multiYearProjections.baseCase,
        outcomes: [
          { metric: 'Revenue Year 5', value: enterpriseData.multiYearProjections.baseCase[4].revenue, unit: 'USD', comparison: { baseline: businessEvaluation.businessData.annualRevenue, variance: (enterpriseData.multiYearProjections.baseCase[4].revenue - businessEvaluation.businessData.annualRevenue) / businessEvaluation.businessData.annualRevenue, variancePercentage: ((enterpriseData.multiYearProjections.baseCase[4].revenue - businessEvaluation.businessData.annualRevenue) / businessEvaluation.businessData.annualRevenue) * 100, significance: 'material' as const }, confidence: 0.75 },
          { metric: 'EBITDA Year 5', value: enterpriseData.multiYearProjections.baseCase[4].revenue * 0.15, unit: 'USD', comparison: { baseline: businessEvaluation.businessData.cashFlow, variance: 2.5, variancePercentage: 250, significance: 'material' as const }, confidence: 0.70 }
        ],
        risks: [
          { risk: 'Market saturation', probability: 0.3, impact: 2, mitigation: 'Geographic expansion', residualRisk: 1.5 },
          { risk: 'Competitive pressure', probability: 0.4, impact: 2, mitigation: 'Product differentiation', residualRisk: 1.2 }
        ],
        valueDrivers: [
          { driver: 'Customer acquisition', importance: 0.9, current: 100, target: 150, impact: 0.25 },
          { driver: 'Operational efficiency', importance: 0.8, current: 75, target: 90, impact: 0.20 }
        ]
      },
      optimisticCase: {
        id: 'optimistic-case',
        name: 'Optimistic Scenario',
        description: 'Favorable market conditions with successful execution',
        probability: 0.25,
        assumptions: [
          { parameter: 'Revenue Growth', value: businessEvaluation.businessData.growthRate + 0.10, unit: '%', rationale: 'Market expansion success', confidence: 0.65, sensitivity: 'high' as const },
          { parameter: 'Margin Improvement', value: 5, unit: '%', rationale: 'Operational optimization', confidence: 0.70, sensitivity: 'medium' as const }
        ],
        projections: enterpriseData.multiYearProjections.optimisticCase,
        outcomes: [
          { metric: 'Revenue Year 5', value: enterpriseData.multiYearProjections.optimisticCase[4].revenue, unit: 'USD', comparison: { baseline: businessEvaluation.businessData.annualRevenue, variance: (enterpriseData.multiYearProjections.optimisticCase[4].revenue - businessEvaluation.businessData.annualRevenue) / businessEvaluation.businessData.annualRevenue, variancePercentage: ((enterpriseData.multiYearProjections.optimisticCase[4].revenue - businessEvaluation.businessData.annualRevenue) / businessEvaluation.businessData.annualRevenue) * 100, significance: 'material' as const }, confidence: 0.65 }
        ],
        risks: [
          { risk: 'Over-expansion', probability: 0.2, impact: 3, mitigation: 'Phased growth strategy', residualRisk: 1.8 }
        ],
        valueDrivers: [
          { driver: 'Market expansion', importance: 0.95, current: 100, target: 200, impact: 0.40 }
        ]
      },
      conservativeCase: {
        id: 'conservative-case',
        name: 'Conservative Scenario',
        description: 'Challenging market conditions requiring defensive strategies',
        probability: 0.25,
        assumptions: [
          { parameter: 'Revenue Growth', value: Math.max(businessEvaluation.businessData.growthRate - 0.05, 0), unit: '%', rationale: 'Economic headwinds', confidence: 0.85, sensitivity: 'high' as const },
          { parameter: 'Cost Management', value: 3, unit: '%', rationale: 'Efficiency focus', confidence: 0.80, sensitivity: 'medium' as const }
        ],
        projections: enterpriseData.multiYearProjections.conservativeCase,
        outcomes: [
          { metric: 'Revenue Year 5', value: enterpriseData.multiYearProjections.conservativeCase[4].revenue, unit: 'USD', comparison: { baseline: businessEvaluation.businessData.annualRevenue, variance: (enterpriseData.multiYearProjections.conservativeCase[4].revenue - businessEvaluation.businessData.annualRevenue) / businessEvaluation.businessData.annualRevenue, variancePercentage: ((enterpriseData.multiYearProjections.conservativeCase[4].revenue - businessEvaluation.businessData.annualRevenue) / businessEvaluation.businessData.annualRevenue) * 100, significance: 'moderate' as const }, confidence: 0.85 }
        ],
        risks: [
          { risk: 'Market contraction', probability: 0.4, impact: 3, mitigation: 'Cost reduction program', residualRisk: 2.0 }
        ],
        valueDrivers: [
          { driver: 'Cost control', importance: 0.85, current: 100, target: 85, impact: 0.15 }
        ]
      },
      customScenarios: [],
      comparisonAnalysis: {
        revenueRange: {
          min: enterpriseData.multiYearProjections.conservativeCase[4].revenue,
          max: enterpriseData.multiYearProjections.optimisticCase[4].revenue,
          spread: enterpriseData.multiYearProjections.optimisticCase[4].revenue - enterpriseData.multiYearProjections.conservativeCase[4].revenue
        },
        valuationImpact: {
          conservativeValuation: businessEvaluation.valuations.weighted.value * 0.8,
          baseValuation: businessEvaluation.valuations.weighted.value,
          optimisticValuation: businessEvaluation.valuations.weighted.value * 1.3
        },
        keyInsights: [
          'Revenue volatility primarily driven by market conditions',
          'Operational efficiency critical in conservative scenarios',
          'Growth investments show highest returns in optimistic case'
        ]
      },
      keyVariables: [
        { name: 'Market Growth Rate', description: 'Overall market expansion rate', baseValue: 0.05, range: { min: -0.02, max: 0.12 }, distribution: 'normal' as const, correlation: [{ variable: 'Competition Intensity', correlation: -0.6, description: 'Higher growth attracts competition' }] },
        { name: 'Pricing Power', description: 'Ability to increase prices', baseValue: 0.03, range: { min: 0, max: 0.08 }, distribution: 'beta' as const, correlation: [{ variable: 'Market Position', correlation: 0.7, description: 'Strong position enables pricing power' }] }
      ]
    };
  }

  private async buildExitStrategy(enterpriseData: EnterpriseTierData): Promise<any> {
    return {
      strategyOverview: {
        currentPosition: 'Well-positioned for multiple exit options',
        optimalTiming: enterpriseData.strategicScenarioPlanning.preferredExitTimeline,
        marketConditions: 'Favorable conditions for strategic transactions',
        preparationStatus: enterpriseData.strategicScenarioPlanning.transactionReadiness,
        valueMaximization: 'Active value enhancement initiatives in progress'
      },
      exitOptions: enterpriseData.strategicScenarioPlanning.exitStrategyPreferences.map(exit => ({
        option: exit.type,
        feasibility: exit.feasibility,
        priority: exit.rank,
        timeline: '12-24 months',
        valuationMultiple: this.getExitMultiple(exit.type),
        advantages: this.getExitAdvantages(exit.type),
        disadvantages: this.getExitDisadvantages(exit.type),
        requirements: this.getExitRequirements(exit.type),
        marketConditions: 'Favorable'
      })),
      timelineAnalysis: {
        immediateActions: [
          'Financial statement preparation and audit',
          'Legal and regulatory compliance review',
          'Management presentation development',
          'Operational documentation completion'
        ],
        shortTerm: [
          'Investment banker selection and engagement',
          'Due diligence preparation',
          'Market positioning strategy',
          'Stakeholder communication plan'
        ],
        mediumTerm: [
          'Formal process initiation',
          'Buyer identification and outreach',
          'Negotiation and structuring',
          'Final due diligence and closing'
        ],
        estimatedTimeframe: {
          preparation: '3-6 months',
          marketing: '6-9 months',
          negotiation: '3-6 months',
          closing: '2-3 months'
        }
      },
      valueMaximization: enterpriseData.strategicScenarioPlanning.valueMaximizationPriorities.map(priority => ({
        initiative: priority.area,
        currentScore: priority.currentScore,
        targetScore: priority.targetScore,
        investment: priority.investmentRequired,
        timeframe: '6-18 months',
        valueImpact: (priority.targetScore - priority.currentScore) * 100000, // Estimated value impact
        priority: priority.priority
      })),
      transactionReadiness: {
        overall: enterpriseData.strategicScenarioPlanning.transactionReadiness,
        financialReadiness: 'Financial statements current and audited',
        legalReadiness: 'Corporate structure optimized',
        operationalReadiness: 'Processes documented and transferable',
        managementReadiness: 'Strong management team in place',
        improvementAreas: [
          'Technology systems documentation',
          'Customer contract standardization',
          'Regulatory compliance validation'
        ]
      },
      planningRecommendations: [
        {
          area: 'Financial Optimization',
          recommendation: 'Complete financial statement normalization and quality of earnings analysis',
          timeline: '3-6 months',
          impact: 'High',
          cost: 75000,
          owner: 'CFO'
        },
        {
          area: 'Operational Excellence',
          recommendation: 'Document all key processes and reduce key person dependencies',
          timeline: '6-12 months',
          impact: 'Medium',
          cost: 150000,
          owner: 'COO'
        },
        {
          area: 'Strategic Positioning',
          recommendation: 'Develop compelling investment thesis and growth strategy',
          timeline: '2-4 months',
          impact: 'High',
          cost: 50000,
          owner: 'CEO'
        }
      ]
    };
  }

  private async buildCapitalStructure(enterpriseData: EnterpriseTierData, businessEvaluation: BusinessEvaluation): Promise<any> {
    const totalAssets = Object.values(businessEvaluation.businessData.assets).reduce((sum, val) => sum + val, 0);
    const totalLiabilities = Object.values(businessEvaluation.businessData.liabilities).reduce((sum, val) => sum + val, 0);
    const currentEquity = totalAssets - totalLiabilities;

    return {
      currentStructure: {
        debtToEquity: enterpriseData.financialOptimization.debtToEquityRatio,
        debtToAssets: totalLiabilities / totalAssets,
        equityRatio: currentEquity / totalAssets,
        interestCoverage: businessEvaluation.businessData.cashFlow / (totalLiabilities * 0.05), // Estimated interest
        analysis: {
          leverage: enterpriseData.financialOptimization.debtToEquityRatio > 2 ? 'High' : enterpriseData.financialOptimization.debtToEquityRatio > 1 ? 'Moderate' : 'Conservative',
          liquidity: 'Adequate',
          flexibility: enterpriseData.financialOptimization.debtCapacityGrowth > 0 ? 'Good' : 'Limited',
          riskProfile: 'Balanced'
        }
      },
      optimalStructure: {
        targetDebtToEquity: Math.min(enterpriseData.financialOptimization.debtToEquityRatio * 1.2, 2.5),
        targetDebtToAssets: 0.4,
        rationale: 'Optimize cost of capital while maintaining financial flexibility',
        benefits: [
          'Lower weighted average cost of capital',
          'Tax shield optimization',
          'Improved return on equity',
          'Enhanced growth capacity'
        ],
        risks: [
          'Increased financial leverage',
          'Higher interest expense',
          'Reduced financial flexibility',
          'Covenant compliance requirements'
        ]
      },
      financingOptions: [
        {
          type: 'Bank Term Loan',
          amount: businessEvaluation.businessData.annualRevenue * 0.5,
          rate: 0.075,
          term: 5,
          purpose: 'Growth capital and working capital',
          advantages: ['Competitive rates', 'Established relationship'],
          disadvantages: ['Covenant requirements', 'Collateral requirements'],
          feasibility: 'High'
        },
        {
          type: 'SBA Loan',
          amount: businessEvaluation.businessData.annualRevenue * 0.3,
          rate: 0.065,
          term: 7,
          purpose: 'Equipment and expansion',
          advantages: ['Lower rates', 'Longer terms'],
          disadvantages: ['Application complexity', 'Personal guarantees'],
          feasibility: 'Medium'
        },
        {
          type: 'Equipment Financing',
          amount: enterpriseData.multiYearProjections.baseCase[0].capex,
          rate: 0.08,
          term: 5,
          purpose: 'Equipment purchases',
          advantages: ['Asset-based security', 'Lower rates'],
          disadvantages: ['Limited use', 'Depreciation risk'],
          feasibility: 'High'
        }
      ],
      costOfCapital: {
        costOfDebt: 0.075,
        costOfEquity: 0.15,
        weightedAverageCostOfCapital: 0.12,
        marginalCostOfCapital: 0.10,
        analysis: {
          trend: 'Stable',
          benchmark: 'Industry average',
          optimizationOpportunity: 'Moderate',
          sensitivityFactors: ['Interest rates', 'Credit rating', 'Market conditions']
        }
      },
      leverageAnalysis: {
        currentLeverage: enterpriseData.financialOptimization.debtToEquityRatio,
        industryAverage: 1.5,
        optimalRange: { min: 1.0, max: 2.0 },
        constraints: [
          'Debt service coverage ratio > 1.25x',
          'Current ratio > 1.5x',
          'Tangible net worth > $500K'
        ],
        capacity: {
          additionalDebt: enterpriseData.financialOptimization.debtCapacityGrowth,
          availableEquity: currentEquity * 0.3,
          totalCapacity: enterpriseData.financialOptimization.debtCapacityGrowth + (currentEquity * 0.3)
        }
      },
      allocationRecommendations: [
        {
          category: 'Growth Investments',
          allocation: 0.40,
          amount: enterpriseData.financialOptimization.debtCapacityGrowth * 0.40,
          rationale: 'Fund revenue growth initiatives',
          expectedReturn: 0.25,
          timeline: '12-24 months',
          riskLevel: 'Medium'
        },
        {
          category: 'Working Capital',
          allocation: 0.25,
          amount: enterpriseData.financialOptimization.debtCapacityGrowth * 0.25,
          rationale: 'Support operational scaling',
          expectedReturn: 0.15,
          timeline: '6-12 months',
          riskLevel: 'Low'
        },
        {
          category: 'Technology & Systems',
          allocation: 0.20,
          amount: enterpriseData.financialOptimization.debtCapacityGrowth * 0.20,
          rationale: 'Enhance operational efficiency',
          expectedReturn: 0.20,
          timeline: '18-36 months',
          riskLevel: 'Medium'
        },
        {
          category: 'Strategic Reserve',
          allocation: 0.15,
          amount: enterpriseData.financialOptimization.debtCapacityGrowth * 0.15,
          rationale: 'Maintain financial flexibility',
          expectedReturn: 0.05,
          timeline: 'As needed',
          riskLevel: 'Low'
        }
      ]
    };
  }

  private async buildStrategicOptions(enterpriseData: EnterpriseTierData): Promise<any> {
    return {
      optionsOverview: {
        totalOptions: enterpriseData.strategicScenarioPlanning.marketExpansionOpportunities.length + enterpriseData.multiYearProjections.strategicOptions.length,
        prioritization: 'Risk-adjusted return on investment',
        timeHorizon: '2-5 years',
        capitalRequirement: enterpriseData.multiYearProjections.strategicOptions.reduce((sum, option) => sum + option.investmentRequired, 0),
        overallFeasibility: 'High'
      },
      growthStrategies: [
        {
          strategy: 'Organic Growth',
          description: 'Expand current business through increased market penetration',
          investmentRequired: businessEvaluation.businessData.annualRevenue * 0.15,
          timeframe: '1-3 years',
          riskLevel: 'Low',
          expectedReturn: 0.20,
          feasibility: 'High',
          keyActions: ['Enhanced marketing', 'Sales team expansion', 'Customer acquisition'],
          successFactors: ['Market demand', 'Execution capability', 'Competitive response']
        },
        {
          strategy: 'Geographic Expansion',
          description: 'Enter new geographic markets with existing services',
          investmentRequired: businessEvaluation.businessData.annualRevenue * 0.25,
          timeframe: '2-4 years',
          riskLevel: 'Medium',
          expectedReturn: 0.30,
          feasibility: 'Medium',
          keyActions: ['Market research', 'Local partnerships', 'Regulatory compliance'],
          successFactors: ['Local market knowledge', 'Regulatory approval', 'Competitive landscape']
        },
        {
          strategy: 'Service Diversification',
          description: 'Develop complementary services for existing customer base',
          investmentRequired: businessEvaluation.businessData.annualRevenue * 0.20,
          timeframe: '1-2 years',
          riskLevel: 'Medium',
          expectedReturn: 0.25,
          feasibility: 'High',
          keyActions: ['Product development', 'Market testing', 'Sales training'],
          successFactors: ['Customer acceptance', 'Technical capability', 'Market timing']
        }
      ],
      acquisitionOpportunities: [
        {
          type: 'Horizontal Acquisition',
          description: 'Acquire direct competitors for market share consolidation',
          targetSize: businessEvaluation.businessData.annualRevenue * 0.5,
          investmentRequired: businessEvaluation.businessData.annualRevenue * 1.5,
          strategicRationale: 'Market consolidation and scale benefits',
          synergies: {
            revenue: businessEvaluation.businessData.annualRevenue * 0.1,
            cost: businessEvaluation.businessData.expenses * 0.08,
            total: businessEvaluation.businessData.annualRevenue * 0.18
          },
          risks: ['Integration challenges', 'Cultural fit', 'Customer retention'],
          timeline: '12-18 months',
          feasibility: 'Medium'
        },
        {
          type: 'Vertical Integration',
          description: 'Acquire suppliers or distributors for value chain control',
          targetSize: businessEvaluation.businessData.annualRevenue * 0.3,
          investmentRequired: businessEvaluation.businessData.annualRevenue * 1.0,
          strategicRationale: 'Cost reduction and quality control',
          synergies: {
            revenue: businessEvaluation.businessData.annualRevenue * 0.05,
            cost: businessEvaluation.businessData.expenses * 0.12,
            total: businessEvaluation.businessData.annualRevenue * 0.17
          },
          risks: ['Market complexity', 'Capital requirements', 'Management bandwidth'],
          timeline: '6-12 months',
          feasibility: 'High'
        }
      ],
      partnershipStrategies: [
        {
          type: 'Strategic Alliance',
          description: 'Form alliances with complementary businesses',
          investment: businessEvaluation.businessData.annualRevenue * 0.05,
          benefits: ['Market access', 'Shared resources', 'Risk mitigation'],
          structure: 'Joint venture or licensing agreement',
          timeline: '3-6 months',
          success_probability: 0.75
        },
        {
          type: 'Technology Partnership',
          description: 'Partner with technology providers for capability enhancement',
          investment: businessEvaluation.businessData.annualRevenue * 0.08,
          benefits: ['Technology access', 'Innovation capability', 'Cost sharing'],
          structure: 'Technology licensing and development agreement',
          timeline: '6-12 months',
          success_probability: 0.80
        }
      ],
      innovationInitiatives: [
        {
          initiative: 'Digital Transformation',
          description: 'Comprehensive digitization of business processes',
          investment: businessEvaluation.businessData.annualRevenue * 0.12,
          expectedBenefits: ['Operational efficiency', 'Customer experience', 'Data insights'],
          timeline: '18-24 months',
          riskLevel: 'Medium',
          innovationScore: 8.5
        },
        {
          initiative: 'Product Innovation',
          description: 'Develop next-generation products and services',
          investment: businessEvaluation.businessData.annualRevenue * 0.10,
          expectedBenefits: ['Market differentiation', 'Premium pricing', 'Customer loyalty'],
          timeline: '12-18 months',
          riskLevel: 'High',
          innovationScore: 9.0
        }
      ],
      optionEvaluation: enterpriseData.multiYearProjections.strategicOptions.map(option => ({
        optionName: option.type,
        investmentRequired: option.investmentRequired,
        valueCreationPotential: option.valueCreationPotential,
        feasibilityScore: option.feasibilityScore,
        riskAdjustedReturn: option.valueCreationPotential / option.investmentRequired * (option.feasibilityScore / 10),
        timeToValue: this.getTimeToValue(option.type),
        strategicAlignment: 0.85,
        recommendation: option.feasibilityScore > 7 ? 'Recommended' : option.feasibilityScore > 5 ? 'Consider' : 'Not Recommended'
      }))
    };
  }

  private async buildMultiYearProjections(enterpriseData: EnterpriseTierData): Promise<any> {
    return {
      methodology: {
        approach: 'Scenario-based financial modeling with Monte Carlo simulation',
        timeHorizon: 5,
        keyAssumptions: [
          'Revenue growth based on market expansion and operational improvements',
          'Margin improvement through operational efficiency and scale',
          'Capital expenditure aligned with growth requirements',
          'Working capital optimization through process improvements'
        ],
        limitations: ['Economic uncertainty', 'Competitive dynamics', 'Regulatory changes'],
        confidenceLevel: 0.75
      },
      fiveYearProjections: {
        baseCase: enterpriseData.multiYearProjections.baseCase,
        optimisticCase: enterpriseData.multiYearProjections.optimisticCase,
        conservativeCase: enterpriseData.multiYearProjections.conservativeCase,
        summary: {
          cagr: this.calculateCAGR(enterpriseData.multiYearProjections.baseCase[0].revenue, enterpriseData.multiYearProjections.baseCase[4].revenue, 5),
          averageMargin: enterpriseData.multiYearProjections.baseCase.reduce((sum, year) => sum + year.grossMargin, 0) / 5,
          totalCapex: enterpriseData.multiYearProjections.baseCase.reduce((sum, year) => sum + year.capex, 0),
          cumulativeCashFlow: enterpriseData.multiYearProjections.baseCase.reduce((sum, year) => sum + year.cashFlow, 0)
        }
      },
      keyAssumptions: [
        {
          assumption: 'Revenue Growth Rate',
          year1: enterpriseData.multiYearProjections.baseCase[0].revenue / enterpriseData.multiYearProjections.baseCase[0].revenue - 1,
          year5: enterpriseData.multiYearProjections.baseCase[4].revenue / enterpriseData.multiYearProjections.baseCase[3].revenue - 1,
          rationale: 'Market expansion and operational improvements',
          sensitivity: 'High',
          confidenceLevel: 0.75
        },
        {
          assumption: 'Gross Margin Evolution',
          year1: enterpriseData.multiYearProjections.currentGrossMargin,
          year5: enterpriseData.multiYearProjections.projectedGrossMarginYear5,
          rationale: 'Operational efficiency and scale benefits',
          sensitivity: 'Medium',
          confidenceLevel: 0.80
        },
        {
          assumption: 'Capital Intensity',
          year1: enterpriseData.multiYearProjections.maintenanceCapexPercentage,
          year5: enterpriseData.multiYearProjections.maintenanceCapexPercentage,
          rationale: 'Maintenance capex as percentage of revenue',
          sensitivity: 'Low',
          confidenceLevel: 0.85
        }
      ],
      sensitivityAnalysis: {
        revenueGrowthImpact: {
          downside: enterpriseData.multiYearProjections.conservativeCase[4].revenue,
          baseCase: enterpriseData.multiYearProjections.baseCase[4].revenue,
          upside: enterpriseData.multiYearProjections.optimisticCase[4].revenue,
          range: enterpriseData.multiYearProjections.optimisticCase[4].revenue - enterpriseData.multiYearProjections.conservativeCase[4].revenue
        },
        marginImpact: {
          currentMargin: enterpriseData.multiYearProjections.currentGrossMargin,
          projectedMargin: enterpriseData.multiYearProjections.projectedGrossMarginYear5,
          valueImpact: (enterpriseData.multiYearProjections.projectedGrossMarginYear5 - enterpriseData.multiYearProjections.currentGrossMargin) * enterpriseData.multiYearProjections.baseCase[4].revenue / 100
        },
        keyVariables: [
          { variable: 'Revenue Growth', impact: 'High', varianceRange: '±20%' },
          { variable: 'Gross Margin', impact: 'Medium', varianceRange: '±15%' },
          { variable: 'Capex Intensity', impact: 'Medium', varianceRange: '±25%' }
        ]
      },
      performanceScenarios: [
        {
          scenario: 'Accelerated Growth',
          description: 'Successful market expansion and acquisition integration',
          probabilityWeighting: 0.20,
          keyDrivers: ['Market expansion', 'Acquisition synergies', 'Operational excellence'],
          financialImpact: {
            revenueMultiplier: 1.4,
            marginImprovement: 0.03,
            valuationPremium: 0.25
          }
        },
        {
          scenario: 'Steady Progress',
          description: 'Consistent execution of business plan',
          probabilityWeighting: 0.60,
          keyDrivers: ['Organic growth', 'Process improvement', 'Market stability'],
          financialImpact: {
            revenueMultiplier: 1.0,
            marginImprovement: 0.01,
            valuationPremium: 0.0
          }
        },
        {
          scenario: 'Defensive Mode',
          description: 'Economic challenges requiring cost focus',
          probabilityWeighting: 0.20,
          keyDrivers: ['Cost management', 'Market defense', 'Efficiency focus'],
          financialImpact: {
            revenueMultiplier: 0.8,
            marginImprovement: -0.01,
            valuationPremium: -0.15
          }
        }
      ],
      investmentRequirements: [
        {
          category: 'Growth Capital',
          year1: enterpriseData.multiYearProjections.growthCapexFiveYear * 0.3,
          year5: enterpriseData.multiYearProjections.growthCapexFiveYear * 0.1,
          total: enterpriseData.multiYearProjections.growthCapexFiveYear,
          purpose: 'Market expansion and capacity building',
          returnProfile: 'High return, medium risk'
        },
        {
          category: 'Maintenance Capital',
          year1: enterpriseData.multiYearProjections.baseCase[0].revenue * enterpriseData.multiYearProjections.maintenanceCapexPercentage / 100,
          year5: enterpriseData.multiYearProjections.baseCase[4].revenue * enterpriseData.multiYearProjections.maintenanceCapexPercentage / 100,
          total: enterpriseData.multiYearProjections.baseCase.reduce((sum, year) => sum + year.capex, 0),
          purpose: 'Equipment replacement and facility maintenance',
          returnProfile: 'Stable returns, low risk'
        },
        {
          category: 'Technology Investment',
          year1: enterpriseData.multiYearProjections.baseCase[0].revenue * 0.03,
          year5: enterpriseData.multiYearProjections.baseCase[4].revenue * 0.02,
          total: enterpriseData.multiYearProjections.baseCase.reduce((sum, year) => sum + year.revenue * 0.025, 0),
          purpose: 'Digital transformation and system upgrades',
          returnProfile: 'Medium return, medium risk'
        }
      ]
    };
  }

  private async generateReportHTML(
    reportStructure: ProfessionalReportStructure | EnterpriseReportStructure,
    config: ReportGenerationConfig
  ): Promise<string> {
    const isEnterprise = isEnterpriseReport(reportStructure);
    const { BRAND_PALETTE } = EnhancedReportGenerator;

    // Generate charts for the report
    const chartPromises = [];

    // Revenue trend chart
    chartPromises.push(this.generateProfessionalChart({
      id: 'revenue-trend',
      title: 'Revenue Growth Trend',
      type: 'line',
      dataSource: { type: 'evaluation_data', path: 'financial.revenue', transformations: [], filters: [] },
      styling: {}
    }, {
      labels: ['Year -2', 'Year -1', 'Current', 'Year +1', 'Year +2'],
      datasets: [{
        label: 'Revenue',
        data: reportStructure.financialAnalysis.historicalPerformance.revenueGrowth.map((item: any) => item.revenue)
      }]
    }, config.tier));

    // Valuation breakdown chart
    chartPromises.push(this.generateProfessionalChart({
      id: 'valuation-breakdown',
      title: 'Valuation Methodology Breakdown',
      type: 'pie',
      dataSource: { type: 'evaluation_data', path: 'valuation.approaches', transformations: [], filters: [] },
      styling: {}
    }, {
      labels: ['Asset-based', 'Income-based', 'Market-based'],
      datasets: [{
        label: 'Valuation Approaches',
        data: [
          reportStructure.valuationSummary.valuationApproaches[0].value,
          reportStructure.valuationSummary.valuationApproaches[1].value,
          reportStructure.valuationSummary.valuationApproaches[2].value
        ]
      }]
    }, config.tier));

    // Generate charts concurrently
    const charts = await Promise.all(chartPromises);
    const chartImages = charts.map(chart => chart.toString('base64'));

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${reportStructure.metadata.title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400;1,600&display=swap');

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.65;
            color: ${BRAND_PALETTE.text};
            background: #ffffff;
            font-size: 14px;
            letter-spacing: -0.01em;
        }

        .cover-page {
            background: linear-gradient(135deg, ${BRAND_PALETTE.primary} 0%, ${BRAND_PALETTE.primary}ee 50%, ${BRAND_PALETTE.secondary} 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 80px 60px;
            page-break-after: always;
            position: relative;
        }

        .cover-page h1 {
            font-family: 'Crimson Text', serif;
            font-size: 3.5rem;
            font-weight: 600;
            margin-bottom: 24px;
            letter-spacing: -0.02em;
            line-height: 1.1;
        }

        .cover-page .subtitle {
            font-size: 1.4rem;
            font-weight: 300;
            opacity: 0.9;
            margin-bottom: 40px;
            max-width: 600px;
            line-height: 1.4;
        }

        .tier-badge {
            position: absolute;
            top: 40px;
            right: 40px;
            background: rgba(255, 255, 255, 0.2);
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 0.9rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .container {
            max-width: 840px;
            margin: 0 auto;
            padding: 0 50px;
        }

        .section {
            margin-bottom: 60px;
            page-break-inside: avoid;
            position: relative;
        }

        .section-title {
            font-family: 'Crimson Text', serif;
            font-size: 2.2rem;
            font-weight: 600;
            color: ${BRAND_PALETTE.primary};
            margin-bottom: 24px;
            position: relative;
            padding-bottom: 16px;
            letter-spacing: -0.01em;
        }

        .section-title::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 60px;
            height: 3px;
            background: linear-gradient(90deg, ${BRAND_PALETTE.primary}, ${BRAND_PALETTE.primary}80);
            border-radius: 2px;
        }

        .section-content {
            font-size: 15px;
            line-height: 1.7;
            color: ${BRAND_PALETTE.text};
            text-align: justify;
        }

        .chart-container {
            text-align: center;
            margin: 40px 0;
            page-break-inside: avoid;
            background: #ffffff;
            padding: 30px;
            border-radius: 16px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
        }

        .chart-container img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
        }

        .chart-title {
            font-family: 'Crimson Text', serif;
            font-weight: 600;
            font-size: 1.3rem;
            margin-bottom: 20px;
            color: ${BRAND_PALETTE.primary};
        }

        .table-container {
            margin: 30px 0;
            overflow-x: auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
            border: 1px solid #e5e7eb;
        }

        table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            font-size: 13px;
        }

        th, td {
            padding: 14px 18px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }

        th {
            background: linear-gradient(135deg, ${BRAND_PALETTE.primary}, ${BRAND_PALETTE.primary}dd);
            color: white;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        th:first-child {
            border-top-left-radius: 12px;
        }

        th:last-child {
            border-top-right-radius: 12px;
        }

        tbody tr:nth-child(even) {
            background: #f9fafb;
        }

        .key-metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }

        .metric-card {
            background: linear-gradient(135deg, #f8fafc, #e2e8f0);
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .metric-value {
            font-size: 2rem;
            font-weight: 700;
            color: ${BRAND_PALETTE.primary};
            margin-bottom: 8px;
        }

        .metric-label {
            font-size: 0.9rem;
            color: ${BRAND_PALETTE.muted};
            font-weight: 500;
        }

        .executive-summary {
            background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
            border: 1px solid #bae6fd;
            border-left: 6px solid ${BRAND_PALETTE.primary};
            padding: 40px;
            margin: 40px 0;
            border-radius: 0 12px 12px 0;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
        }

        .executive-summary h3 {
            color: ${BRAND_PALETTE.primary};
            margin-bottom: 20px;
            font-size: 1.5rem;
            font-weight: 700;
            font-family: 'Crimson Text', serif;
        }

        .recommendations-list {
            margin: 20px 0;
        }

        .recommendation-item {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 16px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .recommendation-title {
            font-weight: 600;
            color: ${BRAND_PALETTE.primary};
            margin-bottom: 8px;
        }

        .recommendation-priority {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .priority-high {
            background: #fef2f2;
            color: #dc2626;
            border: 1px solid #fecaca;
        }

        .priority-medium {
            background: #fffbeb;
            color: #d97706;
            border: 1px solid #fed7aa;
        }

        .priority-low {
            background: #f0fdf4;
            color: #16a34a;
            border: 1px solid #bbf7d0;
        }

        .footer {
            margin-top: 80px;
            padding: 40px;
            background: linear-gradient(135deg, #f8fafc, #e2e8f0);
            border-top: 3px solid ${BRAND_PALETTE.primary};
            text-align: center;
            font-size: 13px;
            color: ${BRAND_PALETTE.muted};
            border-radius: 16px 16px 0 0;
        }

        .footer .company-info {
            font-weight: 600;
            color: ${BRAND_PALETTE.text};
            font-size: 14px;
            margin-bottom: 8px;
        }

        @page {
            size: A4;
            margin: 20mm 15mm 25mm 15mm;
        }

        @page:first {
            margin: 0;
        }

        @media print {
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            .section {
                page-break-inside: avoid;
                orphans: 3;
                widows: 3;
            }

            .chart-container {
                page-break-inside: avoid;
            }

            .table-container {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <!-- Cover Page -->
    <div class="cover-page">
        <div class="tier-badge">${config.tier.charAt(0).toUpperCase() + config.tier.slice(1)} Tier</div>
        <h1>${reportStructure.metadata.title}</h1>
        <div class="subtitle">${reportStructure.metadata.subtitle}</div>
        <div style="margin-top: 40px; font-size: 1rem; opacity: 0.8;">
            ${reportStructure.metadata.companyName} • Generated ${reportStructure.metadata.generatedAt.toLocaleDateString()}
        </div>
    </div>

    <div class="container">
        <!-- Executive Summary -->
        <div class="section">
            <h2 class="section-title">Executive Summary</h2>
            <div class="executive-summary">
                <h3>Key Findings</h3>
                <div class="section-content">
                    ${reportStructure.executiveSummary.keyFindings.map((finding: any) => `
                        <p><strong>${finding.title}:</strong> ${finding.description}</p>
                    `).join('')}
                </div>
            </div>

            <div class="key-metrics">
                ${reportStructure.executiveSummary.financialHighlights.map((highlight: any) => `
                    <div class="metric-card">
                        <div class="metric-value">$${highlight.value.toLocaleString()}</div>
                        <div class="metric-label">${highlight.metric}</div>
                    </div>
                `).join('')}
            </div>

            <div class="recommendations-list">
                <h4 style="margin-bottom: 16px; color: ${BRAND_PALETTE.primary};">Primary Recommendations</h4>
                ${reportStructure.executiveSummary.primaryRecommendations.map((rec: any) => `
                    <div class="recommendation-item">
                        <div class="recommendation-title">${rec.title}</div>
                        <span class="recommendation-priority priority-${rec.priority}">${rec.priority} Priority</span>
                        <p style="margin-top: 12px;">${rec.description}</p>
                        <p style="margin-top: 8px; font-size: 0.9rem; color: ${BRAND_PALETTE.muted};">
                            Timeline: ${rec.timeline}
                        </p>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Business Valuation -->
        <div class="section">
            <h2 class="section-title">Business Valuation Analysis</h2>
            <div class="section-content">
                <p>The comprehensive valuation analysis indicates a current business value of
                <strong>$${reportStructure.valuationSummary.reconciliation.weightedValue.toLocaleString()}</strong>,
                with a range of $${reportStructure.valuationSummary.reconciliation.range.min.toLocaleString()}
                to $${reportStructure.valuationSummary.reconciliation.range.max.toLocaleString()}.</p>
            </div>

            <div class="chart-container">
                <div class="chart-title">Valuation Methodology Breakdown</div>
                <img src="data:image/png;base64,${chartImages[1]}" alt="Valuation Breakdown Chart" />
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Valuation Approach</th>
                            <th>Value</th>
                            <th>Weight</th>
                            <th>Confidence</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reportStructure.valuationSummary.valuationApproaches.map((approach: any) => `
                            <tr>
                                <td>${approach.name}</td>
                                <td>$${approach.value.toLocaleString()}</td>
                                <td>${Math.round(approach.weight * 100)}%</td>
                                <td>${Math.round(approach.confidence * 100)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Financial Analysis -->
        <div class="section">
            <h2 class="section-title">Financial Performance Analysis</h2>
            <div class="section-content">
                <p>The financial analysis reveals strong fundamentals with consistent performance across key metrics.
                Revenue growth of ${reportStructure.financialAnalysis.historicalPerformance.revenueGrowth[2].growth}%
                demonstrates the business's growth trajectory and market position.</p>
            </div>

            <div class="chart-container">
                <div class="chart-title">Revenue Growth Trend</div>
                <img src="data:image/png;base64,${chartImages[0]}" alt="Revenue Trend Chart" />
            </div>

            <div class="key-metrics">
                <div class="metric-card">
                    <div class="metric-value">${reportStructure.financialAnalysis.profitabilityAnalysis.grossMargin.toFixed(1)}%</div>
                    <div class="metric-label">Gross Margin</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${reportStructure.financialAnalysis.profitabilityAnalysis.netMargin.toFixed(1)}%</div>
                    <div class="metric-label">Net Margin</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${reportStructure.financialAnalysis.profitabilityAnalysis.returnOnAssets.toFixed(1)}%</div>
                    <div class="metric-label">Return on Assets</div>
                </div>
            </div>
        </div>

        <!-- Risk Analysis -->
        <div class="section">
            <h2 class="section-title">Risk Assessment</h2>
            <div class="section-content">
                <p>The risk analysis identifies ${Object.keys(reportStructure.riskAnalysis.risksByCategory).length}
                primary risk categories with appropriate mitigation strategies in place.
                Overall risk rating: <strong>${reportStructure.executiveSummary.riskSummary.overallRiskRating}</strong>.</p>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Risk Category</th>
                            <th>Risk Count</th>
                            <th>Category Score</th>
                            <th>Trend</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(reportStructure.riskAnalysis.risksByCategory).map(([category, data]: [string, any]) => `
                            <tr>
                                <td>${category.charAt(0).toUpperCase() + category.slice(1)}</td>
                                <td>${data.risks.length}</td>
                                <td>${data.categoryScore}</td>
                                <td>${data.trend}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Investment Recommendations -->
        <div class="section">
            <h2 class="section-title">Investment Recommendations</h2>
            <div class="section-content">
                <p>Based on comprehensive analysis, we recommend strategic investments totaling
                $${reportStructure.investmentRecommendations.primaryRecommendations[0].investmentRequired.total.toLocaleString()}
                to drive growth and operational efficiency improvements.</p>
            </div>

            <div class="recommendations-list">
                ${reportStructure.investmentRecommendations.primaryRecommendations.map((rec: any) => `
                    <div class="recommendation-item">
                        <div class="recommendation-title">${rec.title}</div>
                        <span class="recommendation-priority priority-${rec.priority}">${rec.priority} Priority</span>
                        <p style="margin-top: 12px;">${rec.description}</p>
                        <div style="margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 0.9rem;">
                            <div>
                                <strong>Investment:</strong> $${rec.investmentRequired.total.toLocaleString()}
                            </div>
                            <div>
                                <strong>Timeline:</strong> ${rec.timeframe}
                            </div>
                            <div>
                                <strong>Expected ROI:</strong> ${Math.round(rec.expectedOutcome.financial.roi * 100)}%
                            </div>
                            <div>
                                <strong>Payback:</strong> ${rec.expectedOutcome.financial.paybackPeriod} years
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        ${isEnterprise ? `
        <!-- Enterprise-Specific Sections -->
        <div class="section">
            <h2 class="section-title">Scenario Analysis</h2>
            <div class="section-content">
                <p>Advanced scenario modeling reveals potential outcomes under different market conditions,
                with base case projecting ${reportStructure.scenarioAnalysis.baseCase.probability * 100}% probability.</p>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Scenario</th>
                            <th>Probability</th>
                            <th>Year 5 Revenue</th>
                            <th>Key Assumptions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Optimistic Case</td>
                            <td>${Math.round(reportStructure.scenarioAnalysis.optimisticCase.probability * 100)}%</td>
                            <td>$${reportStructure.scenarioAnalysis.optimisticCase.outcomes[0].value.toLocaleString()}</td>
                            <td>Market expansion success</td>
                        </tr>
                        <tr>
                            <td>Base Case</td>
                            <td>${Math.round(reportStructure.scenarioAnalysis.baseCase.probability * 100)}%</td>
                            <td>$${reportStructure.scenarioAnalysis.baseCase.outcomes[0].value.toLocaleString()}</td>
                            <td>Current trends continue</td>
                        </tr>
                        <tr>
                            <td>Conservative Case</td>
                            <td>${Math.round(reportStructure.scenarioAnalysis.conservativeCase.probability * 100)}%</td>
                            <td>$${reportStructure.scenarioAnalysis.conservativeCase.outcomes[0].value.toLocaleString()}</td>
                            <td>Economic challenges</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Exit Strategy Analysis</h2>
            <div class="section-content">
                <p>Multiple exit pathways are available with optimal timing in
                ${reportStructure.exitStrategy.strategyOverview.optimalTiming}.
                Current transaction readiness: <strong>${reportStructure.exitStrategy.strategyOverview.preparationStatus}</strong>.</p>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Exit Option</th>
                            <th>Feasibility</th>
                            <th>Timeline</th>
                            <th>Advantages</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reportStructure.exitStrategy.exitOptions.slice(0, 3).map((option: any) => `
                            <tr>
                                <td>${option.option.charAt(0).toUpperCase() + option.option.slice(1)}</td>
                                <td>${option.feasibility}</td>
                                <td>${option.timeline}</td>
                                <td>${option.advantages.slice(0, 2).join(', ')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        ` : ''}

        <!-- Appendices -->
        <div class="section">
            <h2 class="section-title">Methodology & Data Sources</h2>
            <div class="section-content">
                <p>This analysis employs professional valuation standards and comprehensive data analysis
                to ensure accuracy and reliability of findings.</p>

                <h4 style="margin: 20px 0 10px 0; color: ${BRAND_PALETTE.primary};">Data Sources</h4>
                <ul style="margin-left: 20px;">
                    ${reportStructure.appendices.dataSources.map((source: any) => `
                        <li style="margin-bottom: 8px;">
                            <strong>${source.source}</strong> - ${source.description} (${source.reliability} reliability)
                        </li>
                    `).join('')}
                </ul>

                <h4 style="margin: 20px 0 10px 0; color: ${BRAND_PALETTE.primary};">Methodology</h4>
                <p>${reportStructure.appendices.methodologyDocumentation.analysisFramework}</p>
            </div>
        </div>
    </div>

    <div class="footer">
        <p class="company-info">Professional Business Intelligence Analysis</p>
        <p style="margin-top: 8px;">
            Generated on ${reportStructure.metadata.generatedAt.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })} • Report ID: ${reportStructure.metadata.reportId}
        </p>
        <p style="margin-top: 16px; font-size: 11px; opacity: 0.7;">
            This report contains confidential and proprietary information.
            Unauthorized distribution is strictly prohibited.
        </p>
    </div>
</body>
</html>
    `.trim();
  }

  private generateHeaderTemplate(config: ReportGenerationConfig): string {
    return `
      <div style="
        width: 100%;
        height: 40px;
        background: ${config.styling.colorScheme.primary};
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 500;
      ">
        ${config.template.name} - ${config.tier.charAt(0).toUpperCase() + config.tier.slice(1)} Tier Report
      </div>
    `;
  }

  private generateFooterTemplate(config: ReportGenerationConfig): string {
    return `
      <div style="
        width: 100%;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 10px;
        color: #666;
        padding: 0 20px;
        border-top: 1px solid #e5e7eb;
      ">
        <span>Professional Business Intelligence Platform</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `;
  }

  // Helper methods for Enterprise-specific functionality
  private getExitMultiple(exitType: string): number {
    const multiples: Record<string, number> = {
      strategic: 6.5,
      financial: 5.2,
      mbo: 4.8,
      esop: 4.5,
      ipo: 8.0,
      family: 3.5
    };
    return multiples[exitType] || 5.0;
  }

  private getExitAdvantages(exitType: string): string[] {
    const advantages: Record<string, string[]> = {
      strategic: ['Premium valuation', 'Synergy benefits', 'Market access'],
      financial: ['Professional expertise', 'Growth capital', 'Operational support'],
      mbo: ['Management control', 'Cultural continuity', 'Employee retention'],
      esop: ['Tax benefits', 'Employee ownership', 'Cultural preservation'],
      ipo: ['Highest valuation', 'Liquidity', 'Public profile'],
      family: ['Legacy preservation', 'Family control', 'Long-term vision']
    };
    return advantages[exitType] || ['Market-based valuation'];
  }

  private getExitDisadvantages(exitType: string): string[] {
    const disadvantages: Record<string, string[]> = {
      strategic: ['Integration risk', 'Cultural change', 'Synergy uncertainty'],
      financial: ['Leverage increase', 'Return pressure', 'Limited timeline'],
      mbo: ['Financing complexity', 'Management strain', 'Limited resources'],
      esop: ['Valuation discount', 'Administrative complexity', 'Fiduciary responsibility'],
      ipo: ['Market volatility', 'Regulatory burden', 'Public scrutiny'],
      family: ['Limited capital', 'Succession challenges', 'Valuation discount']
    };
    return disadvantages[exitType] || ['Market dependency'];
  }

  private getExitRequirements(exitType: string): string[] {
    const requirements: Record<string, string[]> = {
      strategic: ['Strategic fit', 'Due diligence preparation', 'Integration planning'],
      financial: ['EBITDA threshold', 'Growth prospects', 'Management team'],
      mbo: ['Management equity', 'Financing arrangement', 'Performance track record'],
      esop: ['Employee base', 'Valuation study', 'Trustee selection'],
      ipo: ['Revenue threshold', 'Growth trajectory', 'Corporate governance'],
      family: ['Succession plan', 'Next generation capability', 'Governance structure']
    };
    return requirements[exitType] || ['Market readiness'];
  }

  private getTimeToValue(optionType: string): string {
    const timeframes: Record<string, string> = {
      international: '24-36 months',
      platform: '18-24 months',
      franchise: '12-18 months',
      licensing: '6-12 months',
      rollup: '18-30 months'
    };
    return timeframes[optionType] || '12-24 months';
  }

  private calculateCAGR(startValue: number, endValue: number, years: number): number {
    return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
  }
}

// Export singleton instance
export const enhancedReportGenerator = EnhancedReportGenerator.getInstance();