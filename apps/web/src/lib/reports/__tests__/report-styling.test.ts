/**
 * Unit Tests for Report Styling System
 *
 * Comprehensive tests for the professional report styling system including
 * tier-specific branding, CSS generation, color schemes, typography,
 * and integration with template engine.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateReportStylesheet,
  getTierStyling,
  getChartStyling,
  StyleUtils,
  PROFESSIONAL_COLOR_SCHEME,
  ENTERPRISE_COLOR_SCHEME,
  PROFESSIONAL_TYPOGRAPHY,
  ENTERPRISE_TYPOGRAPHY,
  PROFESSIONAL_CHART_PALETTE,
  ENTERPRISE_CHART_PALETTE,
  generateBaseStyles,
  generateTypographyStyles,
  generateHeaderFooterStyles,
  generateMetricsStyles,
  generateTableStyles,
  generateChartStyles,
  generateRecommendationStyles,
  generateRiskStyles,
  generateScenarioStyles,
} from '../report-styling';

import { ReportTier } from '@/types/enhanced-reports';

describe('Report Styling System', () => {
  describe('Color Schemes', () => {
    it('should define Professional tier colors correctly', () => {
      expect(PROFESSIONAL_COLOR_SCHEME.primary).toBe('#c96442');
      expect(PROFESSIONAL_COLOR_SCHEME.secondary).toBe('#b05730');
      expect(PROFESSIONAL_COLOR_SCHEME.accent).toBe('#9c87f5');
      expect(PROFESSIONAL_COLOR_SCHEME.background).toBe('#ded8c4');
      expect(PROFESSIONAL_COLOR_SCHEME.text).toBe('#3d3929');
      expect(PROFESSIONAL_COLOR_SCHEME.muted).toBe('#83827d');
    });

    it('should define Enterprise tier colors correctly', () => {
      expect(ENTERPRISE_COLOR_SCHEME.primary).toBe('#2c1810');
      expect(ENTERPRISE_COLOR_SCHEME.secondary).toBe('#1e3a8a');
      expect(ENTERPRISE_COLOR_SCHEME.accent).toBe('#7c3aed');
      expect(ENTERPRISE_COLOR_SCHEME.background).toBe('#f8f6f3');
      expect(ENTERPRISE_COLOR_SCHEME.text).toBe('#1a1611');
      expect(ENTERPRISE_COLOR_SCHEME.muted).toBe('#6b7280');
    });

    it('should have distinct color schemes for different tiers', () => {
      expect(PROFESSIONAL_COLOR_SCHEME.primary).not.toBe(ENTERPRISE_COLOR_SCHEME.primary);
      expect(PROFESSIONAL_COLOR_SCHEME.secondary).not.toBe(ENTERPRISE_COLOR_SCHEME.secondary);
      expect(PROFESSIONAL_COLOR_SCHEME.background).not.toBe(ENTERPRISE_COLOR_SCHEME.background);
    });
  });

  describe('Typography Configurations', () => {
    it('should configure Professional typography correctly', () => {
      expect(PROFESSIONAL_TYPOGRAPHY.headings.family).toContain('Inter');
      expect(PROFESSIONAL_TYPOGRAPHY.headings.size).toBe(28);
      expect(PROFESSIONAL_TYPOGRAPHY.headings.weight).toBe(700);
      expect(PROFESSIONAL_TYPOGRAPHY.body.size).toBe(11);
      expect(PROFESSIONAL_TYPOGRAPHY.body.lineHeight).toBe(1.6);
    });

    it('should configure Enterprise typography correctly', () => {
      expect(ENTERPRISE_TYPOGRAPHY.headings.family).toContain('Playfair Display');
      expect(ENTERPRISE_TYPOGRAPHY.headings.size).toBe(32);
      expect(ENTERPRISE_TYPOGRAPHY.headings.weight).toBe(700);
      expect(ENTERPRISE_TYPOGRAPHY.body.size).toBe(12);
      expect(ENTERPRISE_TYPOGRAPHY.body.lineHeight).toBe(1.7);
    });

    it('should have different typography styles for different tiers', () => {
      expect(PROFESSIONAL_TYPOGRAPHY.headings.family).not.toBe(ENTERPRISE_TYPOGRAPHY.headings.family);
      expect(PROFESSIONAL_TYPOGRAPHY.headings.size).not.toBe(ENTERPRISE_TYPOGRAPHY.headings.size);
      expect(PROFESSIONAL_TYPOGRAPHY.body.size).not.toBe(ENTERPRISE_TYPOGRAPHY.body.size);
    });
  });

  describe('Chart Color Palettes', () => {
    it('should define Professional chart colors', () => {
      expect(PROFESSIONAL_CHART_PALETTE.primary).toContain('#c96442');
      expect(PROFESSIONAL_CHART_PALETTE.primary).toContain('#b05730');
      expect(PROFESSIONAL_CHART_PALETTE.primary).toContain('#9c87f5');
      expect(PROFESSIONAL_CHART_PALETTE.success).toBe('#10b981');
      expect(PROFESSIONAL_CHART_PALETTE.warning).toBe('#f59e0b');
      expect(PROFESSIONAL_CHART_PALETTE.danger).toBe('#ef4444');
    });

    it('should define Enterprise chart colors', () => {
      expect(ENTERPRISE_CHART_PALETTE.primary).toContain('#2c1810');
      expect(ENTERPRISE_CHART_PALETTE.primary).toContain('#1e3a8a');
      expect(ENTERPRISE_CHART_PALETTE.primary).toContain('#7c3aed');
      expect(ENTERPRISE_CHART_PALETTE.success).toBe('#059669');
      expect(ENTERPRISE_CHART_PALETTE.warning).toBe('#d97706');
      expect(ENTERPRISE_CHART_PALETTE.danger).toBe('#dc2626');
    });

    it('should include gradient definitions', () => {
      expect(PROFESSIONAL_CHART_PALETTE.gradients).toHaveLength(4);
      expect(PROFESSIONAL_CHART_PALETTE.gradients[0]).toContain('linear-gradient');
      expect(ENTERPRISE_CHART_PALETTE.gradients).toHaveLength(4);
      expect(ENTERPRISE_CHART_PALETTE.gradients[0]).toContain('linear-gradient');
    });
  });

  describe('CSS Style Generation', () => {
    describe('Base Styles', () => {
      it('should generate base styles for Professional tier', () => {
        const styles = generateBaseStyles('professional');

        expect(styles).toContain('font-family:');
        expect(styles).toContain(PROFESSIONAL_TYPOGRAPHY.body.family);
        expect(styles).toContain(`font-size: ${PROFESSIONAL_TYPOGRAPHY.body.size}pt`);
        expect(styles).toContain(`color: ${PROFESSIONAL_COLOR_SCHEME.text}`);
        expect(styles).toContain(`background-color: ${PROFESSIONAL_COLOR_SCHEME.background}`);
      });

      it('should generate base styles for Enterprise tier', () => {
        const styles = generateBaseStyles('enterprise');

        expect(styles).toContain('font-family:');
        expect(styles).toContain(ENTERPRISE_TYPOGRAPHY.body.family);
        expect(styles).toContain(`font-size: ${ENTERPRISE_TYPOGRAPHY.body.size}pt`);
        expect(styles).toContain(`color: ${ENTERPRISE_COLOR_SCHEME.text}`);
        expect(styles).toContain(`background-color: ${ENTERPRISE_COLOR_SCHEME.background}`);
      });

      it('should include print optimization styles', () => {
        const styles = generateBaseStyles('professional');

        expect(styles).toContain('@media print');
        expect(styles).toContain('-webkit-print-color-adjust: exact');
        expect(styles).toContain('page-break-before: always');
        expect(styles).toContain('page-break-inside: avoid');
      });

      it('should include responsive layout styles', () => {
        const styles = generateBaseStyles('professional');

        expect(styles).toContain('.report-page');
        expect(styles).toContain('width: 8.5in');
        expect(styles).toContain('min-height: 11in');
        expect(styles).toContain('padding: 1in');
      });
    });

    describe('Typography Styles', () => {
      it('should generate typography hierarchy for Professional tier', () => {
        const styles = generateTypographyStyles('professional');

        expect(styles).toContain('h1, h2, h3, h4, h5, h6');
        expect(styles).toContain(PROFESSIONAL_TYPOGRAPHY.headings.family);
        expect(styles).toContain(`font-size: ${PROFESSIONAL_TYPOGRAPHY.headings.size}pt`);
        expect(styles).toContain(`border-bottom: 3px solid ${PROFESSIONAL_COLOR_SCHEME.primary}`);
      });

      it('should generate typography hierarchy for Enterprise tier', () => {
        const styles = generateTypographyStyles('enterprise');

        expect(styles).toContain('h1, h2, h3, h4, h5, h6');
        expect(styles).toContain(ENTERPRISE_TYPOGRAPHY.headings.family);
        expect(styles).toContain(`font-size: ${ENTERPRISE_TYPOGRAPHY.headings.size}pt`);
        expect(styles).toContain(`border-bottom: 3px solid ${ENTERPRISE_COLOR_SCHEME.primary}`);
      });

      it('should include heading size hierarchy', () => {
        const styles = generateTypographyStyles('professional');

        expect(styles).toContain('h1 {');
        expect(styles).toContain('h2 {');
        expect(styles).toContain('h3 {');
        expect(styles).toContain('h4 {');
      });

      it('should include body text and list styles', () => {
        const styles = generateTypographyStyles('professional');

        expect(styles).toContain('p {');
        expect(styles).toContain('ul, ol {');
        expect(styles).toContain('li {');
        expect(styles).toContain('text-align: justify');
      });

      it('should include code and caption styles', () => {
        const styles = generateTypographyStyles('professional');

        expect(styles).toContain('code, pre {');
        expect(styles).toContain('.caption');
        expect(styles).toContain('.figure-caption');
        expect(styles).toContain(PROFESSIONAL_TYPOGRAPHY.monospace.family);
      });
    });

    describe('Header and Footer Styles', () => {
      it('should generate header styles with tier colors', () => {
        const styles = generateHeaderFooterStyles('professional');

        expect(styles).toContain('.report-header');
        expect(styles).toContain(`background: linear-gradient(135deg, ${PROFESSIONAL_COLOR_SCHEME.primary}`);
        expect(styles).toContain('color: white');
        expect(styles).toContain('justify-content: space-between');
      });

      it('should generate footer styles with tier colors', () => {
        const styles = generateHeaderFooterStyles('professional');

        expect(styles).toContain('.report-footer');
        expect(styles).toContain(`border-top: 2px solid ${PROFESSIONAL_COLOR_SCHEME.primary}`);
        expect(styles).toContain(`background: ${PROFESSIONAL_COLOR_SCHEME.background}`);
      });

      it('should include print-specific header/footer positioning', () => {
        const styles = generateHeaderFooterStyles('professional');

        expect(styles).toContain('@media print');
        expect(styles).toContain('position: fixed');
        expect(styles).toContain('bottom: 0');
      });

      it('should include page numbering and confidentiality', () => {
        const styles = generateHeaderFooterStyles('professional');

        expect(styles).toContain('.page-number::after');
        expect(styles).toContain('content: counter(page)');
        expect(styles).toContain('.confidential');
      });
    });

    describe('Metrics Styles', () => {
      it('should generate metrics grid layout', () => {
        const styles = generateMetricsStyles('professional');

        expect(styles).toContain('.metrics-grid');
        expect(styles).toContain('display: grid');
        expect(styles).toContain('grid-template-columns: repeat(auto-fit, minmax(200pt, 1fr))');
      });

      it('should style metric cards with tier colors', () => {
        const styles = generateMetricsStyles('professional');

        expect(styles).toContain('.metric-card');
        expect(styles).toContain(`border: 1px solid ${PROFESSIONAL_COLOR_SCHEME.secondary}`);
        expect(styles).toContain('border-radius: 8pt');
        expect(styles).toContain('page-break-inside: avoid');
      });

      it('should style metric values and labels', () => {
        const styles = generateMetricsStyles('professional');

        expect(styles).toContain('.metric-value');
        expect(styles).toContain('font-size: 28pt');
        expect(styles).toContain(`color: ${PROFESSIONAL_COLOR_SCHEME.primary}`);
        expect(styles).toContain('.metric-label');
        expect(styles).toContain('text-transform: uppercase');
      });

      it('should include positive/negative change indicators', () => {
        const styles = generateMetricsStyles('professional');

        expect(styles).toContain('.metric-change.positive');
        expect(styles).toContain('.metric-change.negative');
        expect(styles).toContain('.metric-change.neutral');
        expect(styles).toContain(PROFESSIONAL_CHART_PALETTE.success);
        expect(styles).toContain(PROFESSIONAL_CHART_PALETTE.danger);
      });

      it('should include score indicators', () => {
        const styles = generateMetricsStyles('professional');

        expect(styles).toContain('.score-indicator');
        expect(styles).toContain('.score-indicator.excellent');
        expect(styles).toContain('.score-indicator.good');
        expect(styles).toContain('.score-indicator.fair');
        expect(styles).toContain('.score-indicator.poor');
      });
    });

    describe('Table Styles', () => {
      it('should generate data table styles', () => {
        const styles = generateTableStyles('professional');

        expect(styles).toContain('.data-table');
        expect(styles).toContain('border-collapse: collapse');
        expect(styles).toContain('page-break-inside: avoid');
      });

      it('should style table headers with tier colors', () => {
        const styles = generateTableStyles('professional');

        expect(styles).toContain('.data-table th');
        expect(styles).toContain(`background: ${PROFESSIONAL_COLOR_SCHEME.primary}`);
        expect(styles).toContain('color: white');
        expect(styles).toContain('text-align: left');
      });

      it('should style table cells and rows', () => {
        const styles = generateTableStyles('professional');

        expect(styles).toContain('.data-table td');
        expect(styles).toContain('.data-table tbody tr:nth-child(even)');
        expect(styles).toContain(`background: ${PROFESSIONAL_COLOR_SCHEME.background}`);
      });

      it('should include financial table styles', () => {
        const styles = generateTableStyles('professional');

        expect(styles).toContain('.financial-table');
        expect(styles).toContain('.total-row');
        expect(styles).toContain('.currency');
        expect(styles).toContain('.percentage');
      });

      it('should include comparison table styles', () => {
        const styles = generateTableStyles('professional');

        expect(styles).toContain('.comparison-table .positive');
        expect(styles).toContain('.comparison-table .negative');
        expect(styles).toContain(PROFESSIONAL_CHART_PALETTE.success);
        expect(styles).toContain(PROFESSIONAL_CHART_PALETTE.danger);
      });
    });

    describe('Chart Styles', () => {
      it('should generate chart container styles', () => {
        const styles = generateChartStyles('professional');

        expect(styles).toContain('.chart-container');
        expect(styles).toContain('border-radius: 8pt');
        expect(styles).toContain('page-break-inside: avoid');
        expect(styles).toContain('box-shadow');
      });

      it('should style chart titles and canvas', () => {
        const styles = generateChartStyles('professional');

        expect(styles).toContain('.chart-title');
        expect(styles).toContain(`color: ${PROFESSIONAL_COLOR_SCHEME.primary}`);
        expect(styles).toContain('.chart-canvas');
        expect(styles).toContain('max-width: 100%');
      });

      it('should include chart grid layout', () => {
        const styles = generateChartStyles('professional');

        expect(styles).toContain('.charts-grid');
        expect(styles).toContain('grid-template-columns: repeat(auto-fit, minmax(300pt, 1fr))');
      });

      it('should style chart legends and annotations', () => {
        const styles = generateChartStyles('professional');

        expect(styles).toContain('.chart-legend');
        expect(styles).toContain('.legend-item');
        expect(styles).toContain('.legend-color');
        expect(styles).toContain('.chart-note');
      });
    });

    describe('Recommendation Styles', () => {
      it('should generate recommendation sections', () => {
        const styles = generateRecommendationStyles('professional');

        expect(styles).toContain('.recommendations-section');
        expect(styles).toContain(`background: ${PROFESSIONAL_COLOR_SCHEME.background}40`);
        expect(styles).toContain('page-break-inside: avoid');
      });

      it('should style recommendation items', () => {
        const styles = generateRecommendationStyles('professional');

        expect(styles).toContain('.recommendation-item');
        expect(styles).toContain(`border-left: 4pt solid ${PROFESSIONAL_COLOR_SCHEME.primary}`);
        expect(styles).toContain('border-radius: 0 8pt 8pt 0');
      });

      it('should style priority indicators', () => {
        const styles = generateRecommendationStyles('professional');

        expect(styles).toContain('.priority-critical');
        expect(styles).toContain('.priority-high');
        expect(styles).toContain('.priority-medium');
        expect(styles).toContain('.priority-low');
        expect(styles).toContain(PROFESSIONAL_CHART_PALETTE.danger);
        expect(styles).toContain(PROFESSIONAL_CHART_PALETTE.warning);
      });

      it('should include action items styling', () => {
        const styles = generateRecommendationStyles('professional');

        expect(styles).toContain('.action-items');
        expect(styles).toContain('.action-item');
        expect(styles).toContain('.action-checkbox');
        expect(styles).toContain('.action-timeline');
      });
    });

    describe('Risk Styles', () => {
      it('should generate risk assessment sections', () => {
        const styles = generateRiskStyles('professional');

        expect(styles).toContain('.risk-assessment');
        expect(styles).toContain(`border: 2px solid ${PROFESSIONAL_CHART_PALETTE.warning}`);
        expect(styles).toContain(`background: ${PROFESSIONAL_CHART_PALETTE.warning}10`);
      });

      it('should style risk level indicators', () => {
        const styles = generateRiskStyles('professional');

        expect(styles).toContain('.risk-level');
        expect(styles).toContain('.risk-level.low');
        expect(styles).toContain('.risk-level.medium');
        expect(styles).toContain('.risk-level.high');
        expect(styles).toContain('.risk-level.critical');
      });

      it('should include risk matrix styling', () => {
        const styles = generateRiskStyles('professional');

        expect(styles).toContain('.risk-matrix');
        expect(styles).toContain('grid-template-columns: repeat(5, 1fr)');
        expect(styles).toContain('.risk-cell');
        expect(styles).toContain('aspect-ratio: 1');
      });

      it('should style risk categories', () => {
        const styles = generateRiskStyles('professional');

        expect(styles).toContain('.risk-categories');
        expect(styles).toContain('.risk-category');
        expect(styles).toContain('.risk-list');
      });
    });

    describe('Scenario Styles (Enterprise Only)', () => {
      it('should generate scenario analysis styles for Enterprise tier', () => {
        const styles = generateScenarioStyles('enterprise');

        expect(styles).toContain('.scenario-analysis');
        expect(styles).toContain(`border: 2px solid ${ENTERPRISE_COLOR_SCHEME.primary}`);
        expect(styles).toContain('border-radius: 12pt');
      });

      it('should style scenario grid and cards', () => {
        const styles = generateScenarioStyles('enterprise');

        expect(styles).toContain('.scenario-grid');
        expect(styles).toContain('.scenario-card');
        expect(styles).toContain('grid-template-columns: repeat(auto-fit, minmax(250pt, 1fr))');
      });

      it('should style scenario titles and outcomes', () => {
        const styles = generateScenarioStyles('enterprise');

        expect(styles).toContain('.scenario-title');
        expect(styles).toContain('.scenario-probability');
        expect(styles).toContain('.scenario-outcomes');
        expect(styles).toContain('.outcome-item');
      });

      it('should include scenario comparison styling', () => {
        const styles = generateScenarioStyles('enterprise');

        expect(styles).toContain('.scenario-comparison');
        expect(styles).toContain('.comparison-header');
        expect(styles).toContain('.comparison-row');
        expect(styles).toContain('grid-template-columns: 1fr repeat(3, 120pt)');
      });
    });
  });

  describe('Complete Stylesheet Generation', () => {
    it('should generate complete stylesheet for Professional tier', () => {
      const stylesheet = generateReportStylesheet('professional');

      expect(stylesheet).toContain('/* Base Document Styles */');
      expect(stylesheet).toContain('/* Typography Hierarchy */');
      expect(stylesheet).toContain('/* Header Styles */');
      expect(stylesheet).toContain('/* Key Metrics Grid */');
      expect(stylesheet).toContain('/* Data Tables */');
      expect(stylesheet).toContain('/* Chart Containers */');
      expect(stylesheet).toContain('/* Recommendation Sections */');
      expect(stylesheet).toContain('/* Risk Assessment Sections */');
      expect(stylesheet).toContain('/* Responsive Utilities */');
    });

    it('should generate complete stylesheet for Enterprise tier', () => {
      const stylesheet = generateReportStylesheet('enterprise');

      expect(stylesheet).toContain('/* Base Document Styles */');
      expect(stylesheet).toContain('/* Typography Hierarchy */');
      expect(stylesheet).toContain('/* Scenario Analysis (Enterprise Only) */');
      expect(stylesheet).toContain('/* Responsive Utilities */');
    });

    it('should include Enterprise-specific scenario styles only for Enterprise tier', () => {
      const professionalStylesheet = generateReportStylesheet('professional');
      const enterpriseStylesheet = generateReportStylesheet('enterprise');

      expect(professionalStylesheet).not.toContain('.scenario-analysis');
      expect(enterpriseStylesheet).toContain('.scenario-analysis');
    });
  });

  describe('Tier Styling Configuration', () => {
    it('should get Professional tier styling configuration', () => {
      const styling = getTierStyling('professional');

      expect(styling.colorScheme).toEqual(PROFESSIONAL_COLOR_SCHEME);
      expect(styling.typography.fonts).toEqual(PROFESSIONAL_TYPOGRAPHY);
      expect(styling.pageLayout.pageSize).toBe('letter');
      expect(styling.pageLayout.orientation).toBe('portrait');
      expect(styling.pageLayout.margins.top).toBe(72); // 1 inch
    });

    it('should get Enterprise tier styling configuration', () => {
      const styling = getTierStyling('enterprise');

      expect(styling.colorScheme).toEqual(ENTERPRISE_COLOR_SCHEME);
      expect(styling.typography.fonts).toEqual(ENTERPRISE_TYPOGRAPHY);
      expect(styling.pageLayout.pageSize).toBe('letter');
      expect(styling.pageLayout.orientation).toBe('portrait');
      expect(styling.pageLayout.margins.top).toBe(72); // 1 inch
    });

    it('should include header and footer configuration', () => {
      const styling = getTierStyling('professional');

      expect(styling.headerFooter.header.enabled).toBe(true);
      expect(styling.headerFooter.footer.enabled).toBe(true);
      expect(styling.headerFooter.header.content).toContain('{{title}}');
      expect(styling.headerFooter.footer.content).toContain('CONFIDENTIAL');
    });

    it('should include branding configuration', () => {
      const professionalStyling = getTierStyling('professional');
      const enterpriseStyling = getTierStyling('enterprise');

      expect(professionalStyling.branding.companyName).toBe('GoodBuy Business Analysis');
      expect(professionalStyling.branding.tagline).toBe('Professional Business Insights');
      expect(enterpriseStyling.branding.tagline).toBe('Strategic Excellence in Business Analysis');
    });
  });

  describe('Chart Styling Configuration', () => {
    it('should get Professional tier chart styling', () => {
      const chartStyling = getChartStyling('professional');

      expect(chartStyling.colors.primary).toEqual(PROFESSIONAL_CHART_PALETTE.primary);
      expect(chartStyling.fonts).toEqual(PROFESSIONAL_TYPOGRAPHY);
      expect(chartStyling.animations.enabled).toBe(false); // Disabled for print
    });

    it('should get Enterprise tier chart styling', () => {
      const chartStyling = getChartStyling('enterprise');

      expect(chartStyling.colors.primary).toEqual(ENTERPRISE_CHART_PALETTE.primary);
      expect(chartStyling.fonts).toEqual(ENTERPRISE_TYPOGRAPHY);
      expect(chartStyling.animations.enabled).toBe(false); // Disabled for print
    });

    it('should include layout and styling configuration', () => {
      const chartStyling = getChartStyling('professional');

      expect(chartStyling.layout.padding).toBe(16);
      expect(chartStyling.layout.alignment).toBe('center');
      expect(chartStyling.borders.radius).toBe(4);
      expect(chartStyling.background.color).toBe('white');
    });
  });

  describe('Style Utilities', () => {
    describe('toPrintColor', () => {
      it('should darken light colors for print', () => {
        const lightColor = '#f0f0f0';
        const printColor = StyleUtils.toPrintColor(lightColor);

        expect(printColor).not.toBe(lightColor);
        expect(printColor).toMatch(/^#[0-9a-f]{6}$/i);
      });

      it('should leave dark colors unchanged for print', () => {
        const darkColor = '#333333';
        const printColor = StyleUtils.toPrintColor(darkColor);

        expect(printColor).toBe(darkColor);
      });

      it('should handle non-hex colors gracefully', () => {
        const namedColor = 'red';
        const printColor = StyleUtils.toPrintColor(namedColor);

        expect(printColor).toBe(namedColor);
      });
    });

    describe('getContrastColor', () => {
      it('should return white for dark backgrounds', () => {
        expect(StyleUtils.getContrastColor('#1a1611')).toBe('white');
        expect(StyleUtils.getContrastColor('#2c1810')).toBe('white');
        expect(StyleUtils.getContrastColor('dark')).toBe('white');
      });

      it('should return dark color for light backgrounds', () => {
        expect(StyleUtils.getContrastColor('#ffffff')).toBe('#333333');
        expect(StyleUtils.getContrastColor('#f8f6f3')).toBe('#333333');
        expect(StyleUtils.getContrastColor('light')).toBe('#333333');
      });
    });

    describe('getPageBreakCSS', () => {
      it('should generate page break before CSS', () => {
        const css = StyleUtils.getPageBreakCSS(true, false, false);
        expect(css).toContain('page-break-before: always');
        expect(css).toContain('break-before: page');
      });

      it('should generate page break after CSS', () => {
        const css = StyleUtils.getPageBreakCSS(false, true, false);
        expect(css).toContain('page-break-after: always');
        expect(css).toContain('break-after: page');
      });

      it('should generate avoid page break CSS', () => {
        const css = StyleUtils.getPageBreakCSS(false, false, true);
        expect(css).toContain('page-break-inside: avoid');
        expect(css).toContain('break-inside: avoid');
      });

      it('should combine multiple page break rules', () => {
        const css = StyleUtils.getPageBreakCSS(true, true, true);
        expect(css).toContain('page-break-before: always');
        expect(css).toContain('page-break-after: always');
        expect(css).toContain('page-break-inside: avoid');
      });
    });

    describe('Unit Conversions', () => {
      it('should convert pixels to points', () => {
        expect(StyleUtils.pxToPt(100)).toBe(75);
        expect(StyleUtils.pxToPt(16)).toBe(12);
      });

      it('should convert points to pixels', () => {
        expect(StyleUtils.ptToPx(12)).toBeCloseTo(15.96, 1);
        expect(StyleUtils.ptToPx(72)).toBeCloseTo(95.76, 1);
      });
    });
  });

  describe('Integration with Report Types', () => {
    it('should differentiate between tier requirements', () => {
      const professionalStyling = getTierStyling('professional');
      const enterpriseStyling = getTierStyling('enterprise');

      // Professional should be warm and approachable
      expect(professionalStyling.colorScheme.primary).toContain('c96442'); // Terracotta
      expect(professionalStyling.typography.fonts.headings.family).toContain('Inter');

      // Enterprise should be sophisticated and premium
      expect(enterpriseStyling.colorScheme.primary).toContain('2c1810'); // Deep brown
      expect(enterpriseStyling.typography.fonts.headings.family).toContain('Playfair Display');
    });

    it('should support print optimization across tiers', () => {
      const professionalSheet = generateReportStylesheet('professional');
      const enterpriseSheet = generateReportStylesheet('enterprise');

      [professionalSheet, enterpriseSheet].forEach(stylesheet => {
        expect(stylesheet).toContain('@media print');
        expect(stylesheet).toContain('-webkit-print-color-adjust: exact');
        expect(stylesheet).toContain('page-break-inside: avoid');
      });
    });

    it('should maintain consistency in layout structure', () => {
      const professionalStyling = getTierStyling('professional');
      const enterpriseStyling = getTierStyling('enterprise');

      // Both should use same page setup
      expect(professionalStyling.pageLayout.pageSize).toBe(enterpriseStyling.pageLayout.pageSize);
      expect(professionalStyling.pageLayout.orientation).toBe(enterpriseStyling.pageLayout.orientation);
      expect(professionalStyling.pageLayout.margins).toEqual(enterpriseStyling.pageLayout.margins);
    });
  });
});

describe('CSS Validation', () => {
  it('should generate valid CSS syntax', () => {
    const stylesheet = generateReportStylesheet('professional');

    // Check for basic CSS structure
    expect(stylesheet).toMatch(/\{[^}]*\}/); // Has CSS rules
    expect(stylesheet).not.toContain('{{'); // No unresolved templates
    expect(stylesheet).not.toContain('undefined'); // No undefined values

    // Check for proper CSS declarations
    const cssRules = stylesheet.match(/[^{]+\{[^}]+\}/g) || [];
    expect(cssRules.length).toBeGreaterThan(10); // Has multiple CSS rules
  });

  it('should use consistent color values', () => {
    const stylesheet = generateReportStylesheet('professional');

    // Should contain valid hex colors
    const hexColors = stylesheet.match(/#[0-9a-f]{6}/gi) || [];
    expect(hexColors.length).toBeGreaterThan(0);

    // Should not contain invalid color values
    expect(stylesheet).not.toContain('color: undefined');
    expect(stylesheet).not.toContain('background: null');
  });

  it('should use valid CSS units', () => {
    const stylesheet = generateReportStylesheet('professional');

    // Should contain valid CSS units
    expect(stylesheet).toMatch(/\d+pt/); // Points for print
    expect(stylesheet).toMatch(/\d+px/); // Pixels for screen
    expect(stylesheet).toMatch(/\d+em/); // Relative units
    expect(stylesheet).toMatch(/\d+%/); // Percentages

    // Should not contain invalid units
    expect(stylesheet).not.toContain('NaNpt');
    expect(stylesheet).not.toContain('undefinedpx');
  });
});