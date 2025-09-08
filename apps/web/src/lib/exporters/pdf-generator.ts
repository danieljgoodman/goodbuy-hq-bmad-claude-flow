import type { ExportConfiguration } from '@/types/export-types';
import type { UnifiedDashboard } from '@/types/unified-dashboard';

export interface PDFGenerationOptions {
  configuration: ExportConfiguration;
  dashboard: UnifiedDashboard;
  customStyling?: {
    fonts?: string[];
    colors?: Record<string, string>;
    layout?: 'portrait' | 'landscape';
  };
}

export interface PDFSection {
  id: string;
  title: string;
  content: any;
  pageBreak?: boolean;
  styling?: Record<string, any>;
}

export class PDFGenerator {
  private static instance: PDFGenerator;

  static getInstance(): PDFGenerator {
    if (!PDFGenerator.instance) {
      PDFGenerator.instance = new PDFGenerator();
    }
    return PDFGenerator.instance;
  }

  async generatePDF(options: PDFGenerationOptions): Promise<Blob> {
    const { configuration, dashboard } = options;

    try {
      // Build PDF sections based on configuration
      const sections = await this.buildPDFSections(configuration, dashboard);
      
      // Apply branding and styling
      const styledSections = this.applyBranding(sections, configuration.branding);
      
      // Generate PDF using appropriate method based on environment
      if (typeof window === 'undefined') {
        return await this.generateServerSidePDF(styledSections, options);
      } else {
        return await this.generateClientSidePDF(styledSections, options);
      }
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw new Error('Failed to generate PDF report');
    }
  }

  private async buildPDFSections(
    config: ExportConfiguration,
    dashboard: UnifiedDashboard
  ): Promise<PDFSection[]> {
    const sections: PDFSection[] = [];

    // Title page
    sections.push({
      id: 'title',
      title: 'Business Intelligence Report',
      content: {
        companyName: config.branding.companyName,
        generatedDate: new Date().toLocaleDateString(),
        confidentialityLevel: config.confidentialityLevel,
        businessId: dashboard.businessId
      },
      pageBreak: true
    });

    // Executive Summary
    if (config.sections.executiveSummary) {
      sections.push({
        id: 'executive-summary',
        title: 'Executive Summary',
        content: await this.buildExecutiveSummary(dashboard),
        pageBreak: true
      });
    }

    // Valuation Section
    if (config.sections.valuation) {
      sections.push({
        id: 'valuation',
        title: 'Business Valuation Analysis',
        content: await this.buildValuationSection(dashboard.components.valuation),
        pageBreak: true
      });
    }

    // Health Analysis Section
    if (config.sections.healthAnalysis) {
      sections.push({
        id: 'health-analysis',
        title: 'Business Health Assessment',
        content: await this.buildHealthAnalysisSection(dashboard.components.healthScore),
        pageBreak: true
      });
    }

    // Opportunities Section
    if (config.sections.opportunities) {
      sections.push({
        id: 'opportunities',
        title: 'Growth Opportunities',
        content: await this.buildOpportunitiesSection(dashboard.components.opportunities),
        pageBreak: true
      });
    }

    // Appendices
    if (config.sections.appendices) {
      sections.push({
        id: 'appendices',
        title: 'Appendices',
        content: await this.buildAppendices(dashboard),
        pageBreak: false
      });
    }

    return sections;
  }

  private applyBranding(sections: PDFSection[], branding: ExportConfiguration['branding']): PDFSection[] {
    return sections.map(section => ({
      ...section,
      styling: {
        ...section.styling,
        primaryColor: branding.colorScheme.primary,
        secondaryColor: branding.colorScheme.secondary,
        textColor: branding.colorScheme.text,
        backgroundColor: branding.colorScheme.background,
        logo: branding.logo,
        customFooter: branding.customFooter,
        whiteLabel: branding.whiteLabel
      }
    }));
  }

  private async generateServerSidePDF(sections: PDFSection[], options: PDFGenerationOptions): Promise<Blob> {
    // Server-side PDF generation using Puppeteer or similar
    const response = await fetch('/api/exports/pdf/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections, options })
    });

    if (!response.ok) {
      throw new Error('Server-side PDF generation failed');
    }

    return await response.blob();
  }

  private async generateClientSidePDF(sections: PDFSection[], options: PDFGenerationOptions): Promise<Blob> {
    // Client-side PDF generation using jsPDF or similar library
    // This is a simplified implementation - real implementation would use jsPDF
    
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({
      orientation: options.customStyling?.layout || 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    sections.forEach((section, index) => {
      // Add new page if needed
      if (section.pageBreak && index > 0) {
        doc.addPage();
        yPosition = 20;
      }

      // Section title
      doc.setFontSize(18);
      doc.setTextColor(section.styling?.primaryColor || '#000000');
      doc.text(section.title, margin, yPosition);
      yPosition += 15;

      // Section content
      doc.setFontSize(12);
      doc.setTextColor(section.styling?.textColor || '#333333');
      
      const contentText = this.formatContentForPDF(section.content);
      const lines = doc.splitTextToSize(contentText, doc.internal.pageSize.width - 2 * margin);
      
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 7;
      });

      yPosition += 10;
    });

    // Add footer if not white-label
    if (!options.configuration.branding.whiteLabel) {
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor('#666666');
        doc.text(
          `Generated by GoodBuy Business Intelligence • Page ${i} of ${totalPages}`,
          margin,
          pageHeight - 10
        );
      }
    }

    return new Blob([doc.output('blob')], { type: 'application/pdf' });
  }

  private formatContentForPDF(content: any): string {
    if (typeof content === 'string') return content;
    if (typeof content === 'object') {
      return JSON.stringify(content, null, 2);
    }
    return String(content);
  }

  private async buildExecutiveSummary(dashboard: UnifiedDashboard) {
    return {
      businessValue: dashboard.components.valuation.summary,
      healthScore: dashboard.components.healthScore.summary,
      keyOpportunities: dashboard.components.opportunities.summary,
      lastUpdated: dashboard.lastUpdated,
      confidence: 'High'
    };
  }

  private async buildValuationSection(valuationData: any) {
    return {
      currentValue: valuationData.summary?.currentValue,
      methodology: 'AI-powered valuation analysis',
      marketComparisons: valuationData.summary?.marketMultiple,
      growthProjections: valuationData.summary?.growthRate,
      confidence: valuationData.summary?.confidence
    };
  }

  private async buildHealthAnalysisSection(healthData: any) {
    return {
      overallScore: healthData.summary?.overallScore,
      categoryScores: healthData.summary?.categoryScores,
      recommendations: 'Based on comprehensive business analysis',
      trends: 'Positive trajectory observed'
    };
  }

  private async buildOpportunitiesSection(opportunitiesData: any) {
    return {
      totalOpportunities: opportunitiesData.summary?.totalOpportunities,
      potentialValue: opportunitiesData.summary?.potentialValue,
      topOpportunities: opportunitiesData.summary?.topOpportunities,
      implementation: 'Strategic recommendations provided'
    };
  }

  private async buildAppendices(dashboard: UnifiedDashboard) {
    return {
      dataSource: 'AI Analysis Engine',
      generationDate: new Date().toISOString(),
      methodology: 'Advanced machine learning algorithms',
      disclaimers: 'This report is for informational purposes only'
    };
  }

  // Template management
  async getAvailableTemplates(isPremium: boolean = false) {
    const baseTemplates = [
      {
        id: 'executive',
        name: 'Executive Summary',
        description: 'Concise overview for leadership',
        sections: ['executiveSummary', 'valuation', 'opportunities']
      },
      {
        id: 'detailed',
        name: 'Detailed Analysis',
        description: 'Comprehensive business analysis',
        sections: ['executiveSummary', 'valuation', 'healthAnalysis', 'opportunities', 'appendices']
      }
    ];

    const premiumTemplates = [
      {
        id: 'investor',
        name: 'Investor Presentation',
        description: 'Professional investor-ready report',
        sections: ['executiveSummary', 'valuation', 'opportunities', 'appendices']
      },
      {
        id: 'custom',
        name: 'Custom Template',
        description: 'Fully customizable template',
        sections: ['custom']
      }
    ];

    return isPremium ? [...baseTemplates, ...premiumTemplates] : baseTemplates;
  }
}