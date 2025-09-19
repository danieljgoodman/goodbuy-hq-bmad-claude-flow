# Professional Report Styling System Guide

## Overview

The Professional Report Styling System provides comprehensive tier-specific styling for Professional and Enterprise tier reports. It implements the brand guidelines with brown/terracotta (Professional) and deep brown/navy (Enterprise) color schemes, creating sophisticated, print-optimized reports with consistent typography and layout.

## Architecture

### Core Components

1. **`report-styling.ts`** - Main styling definitions and CSS generators
2. **`styling-integration.ts`** - Integration with template engine and report generator
3. **Tests** - Comprehensive test coverage for all styling features

### Color Schemes

#### Professional Tier (Brown/Terracotta)
```typescript
PROFESSIONAL_COLOR_SCHEME = {
  primary: '#c96442',      // Warm terracotta - main brand color
  secondary: '#b05730',    // Deeper terracotta - accents
  accent: '#9c87f5',       // Subtle purple - charts and callouts
  background: '#ded8c4',   // Warm cream - page backgrounds
  text: '#3d3929',         // Dark brown - primary text
  muted: '#83827d',        // Medium gray-brown - secondary text
}
```

#### Enterprise Tier (Deep Brown/Navy)
```typescript
ENTERPRISE_COLOR_SCHEME = {
  primary: '#2c1810',      // Deep espresso brown - primary brand
  secondary: '#1e3a8a',    // Deep navy blue - corporate accent
  accent: '#7c3aed',       // Rich purple - premium highlights
  background: '#f8f6f3',   // Warm off-white - elegant background
  text: '#1a1611',         // Rich dark brown - premium text
  muted: '#6b7280',        // Neutral gray - supporting text
}
```

## Usage Guide

### Basic Setup

```typescript
import {
  ReportStylingIntegration,
  generateReportStylesheet,
  getTierStyling,
  applyTierStyling,
} from '@/lib/reports/styling-integration';

// Create styling integration instance
const stylingIntegration = ReportStylingIntegration.getInstance();
```

### Applying Tier-Specific Styling

#### To Report Configuration

```typescript
import { ReportGenerationConfig } from '@/types/enhanced-reports';

// Apply tier styling to report configuration
const styledConfig = applyTierStyling(reportConfig, {
  // Optional customizations
  colorScheme: {
    primary: '#custom-color', // Override primary color
  },
});
```

#### Generate Complete Stylesheet

```typescript
// Generate complete CSS stylesheet for a tier
const professionalStylesheet = generateReportStylesheet('professional');
const enterpriseStylesheet = generateReportStylesheet('enterprise');

// With custom styles
const customStylesheet = stylingIntegration.generateStylesheet(
  'professional',
  '.custom-class { font-weight: bold; }'
);
```

### HTML Generation

#### Complete Document Structure

```typescript
// Generate full HTML document with styling
const styledHTML = stylingIntegration.generateStyledHTMLStructure(
  'professional',
  '<h1>Report Content</h1><p>Report body...</p>'
);
```

#### Section Wrapping

```typescript
// Wrap section content with appropriate styling
const wrappedSection = stylingIntegration.wrapSectionContent(
  'financial_analysis',
  '<h2>Financial Analysis</h2><p>Content...</p>',
  'professional',
  {
    pageBreakBefore: true,    // Add page break before section
    avoidPageBreak: true,     // Avoid breaking section across pages
    customClass: 'highlight'   // Add custom CSS class
  }
);
```

### Component Styling

#### Metrics Grid

```typescript
const metrics = [
  {
    label: 'Revenue',
    value: 1000000,
    unit: 'currency',
    change: {
      value: 15.5,
      unit: '%',
      period: 'YoY'
    }
  },
  {
    label: 'Profit Margin',
    value: 23.5,
    unit: 'percentage'
  }
];

const metricsHTML = stylingIntegration.generateStyledMetrics(metrics, 'professional');
```

#### Data Tables

```typescript
const tableData = {
  title: 'Financial Summary',
  headers: [
    { label: 'Metric', numeric: false },
    { label: 'Value', numeric: true, type: 'currency' },
    { label: 'Change', numeric: true, type: 'percentage' }
  ],
  rows: [
    {
      cells: [
        { value: 'Revenue' },
        { value: 1000000 },
        { value: 15.5 }
      ]
    }
  ],
  caption: 'All figures in USD'
};

const tableHTML = stylingIntegration.generateStyledTable(
  tableData,
  'professional',
  {
    financial: true,    // Apply financial table styling
    comparison: true    // Apply comparison styling for positive/negative values
  }
);
```

#### Charts

```typescript
// Apply tier-specific styling to chart configuration
const styledChartConfig = stylingIntegration.styleChartConfiguration(
  chartConfig,
  'professional'
);

// Generate chart HTML with styling
const chartHTML = stylingIntegration.generateStyledChart(
  chartConfig,
  'professional',
  'data:image/png;base64,chart-image-data'
);
```

#### Recommendations

```typescript
const recommendations = [
  {
    title: 'Improve Operational Efficiency',
    description: 'Implement automated processes to reduce costs',
    priority: 'high',
    metrics: [
      {
        label: 'Investment',
        value: 50000,
        unit: 'currency'
      },
      {
        label: 'Expected ROI',
        value: 200,
        unit: 'percentage'
      }
    ],
    actionItems: [
      {
        text: 'Conduct process audit',
        timeline: '2-4 weeks'
      }
    ]
  }
];

const recommendationsHTML = stylingIntegration.generateStyledRecommendations(
  recommendations,
  'professional'
);
```

#### Risk Assessment

```typescript
const risks = [
  {
    category: 'Financial',
    description: 'Customer concentration risk',
    level: 'medium'
  },
  {
    category: 'Operational',
    description: 'Key person dependency',
    level: 'high'
  }
];

const riskHTML = stylingIntegration.generateStyledRiskAssessment(risks, 'professional');
```

#### Scenario Analysis (Enterprise Only)

```typescript
const scenarios = [
  {
    name: 'Base Case',
    probability: 0.6,
    outcomes: [
      {
        label: 'Revenue',
        value: 1200000,
        unit: 'currency'
      },
      {
        label: 'Growth',
        value: 15,
        unit: 'percentage'
      }
    ]
  }
];

// Only generates content for Enterprise tier
const scenarioHTML = stylingIntegration.generateStyledScenarioAnalysis(
  scenarios,
  'enterprise'
);
```

## Print Optimization

### Page Breaks

```typescript
// Control page breaks in CSS
.force-page-break {
  page-break-before: always;
  break-before: page;
}

.avoid-page-break {
  page-break-inside: avoid;
  break-inside: avoid;
}

.keep-together {
  page-break-inside: avoid;
  break-inside: avoid;
}
```

### Print-Specific Styling

```css
@media print {
  body {
    -webkit-print-color-adjust: exact;
    color-adjust: exact;
    print-color-adjust: exact;
  }

  @page {
    size: letter;
    margin: 0.75in;
  }

  .report-page {
    width: 100%;
    margin: 0;
    padding: 0.75in;
    box-shadow: none;
  }
}
```

## Typography Hierarchy

### Professional Tier
- **Headings**: Inter, clean and modern
- **Body**: Inter, excellent readability
- **Size**: 11pt body, 28pt headings
- **Line Height**: 1.6 for optimal reading

### Enterprise Tier
- **Headings**: Playfair Display, elegant serif
- **Body**: Source Sans Pro, professional sans-serif
- **Size**: 12pt body, 32pt headings
- **Line Height**: 1.7 for premium feel

## Chart Colors

### Professional Tier Chart Palette
```typescript
const PROFESSIONAL_CHART_PALETTE = {
  primary: ['#c96442', '#b05730', '#9c87f5', '#e97a56', '#8b4513'],
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  neutral: '#6b7280'
};
```

### Enterprise Tier Chart Palette
```typescript
const ENTERPRISE_CHART_PALETTE = {
  primary: ['#2c1810', '#1e3a8a', '#7c3aed', '#4338ca', '#581c87'],
  success: '#059669',
  warning: '#d97706',
  danger: '#dc2626',
  neutral: '#4b5563'
};
```

## Utility Functions

### Style Utilities

```typescript
import { StyleUtils } from '@/lib/reports/report-styling';

// Convert colors for print optimization
const printColor = StyleUtils.toPrintColor('#f0f0f0');

// Get appropriate contrast color
const textColor = StyleUtils.getContrastColor('#2c1810');

// Generate page break CSS
const pageBreakCSS = StyleUtils.getPageBreakCSS(true, false, true);

// Unit conversions
const points = StyleUtils.pxToPt(100); // Convert pixels to points
const pixels = StyleUtils.ptToPx(72);  // Convert points to pixels
```

### Quick Access Functions

```typescript
import { getChartColors, getBrandColors } from '@/lib/reports/styling-integration';

// Get chart colors for tier
const professionalChartColors = getChartColors('professional');
const enterpriseChartColors = getChartColors('enterprise');

// Get brand colors for tier
const professionalBrandColors = getBrandColors('professional');
const enterpriseBrandColors = getBrandColors('enterprise');
```

## Advanced Customization

### Custom CSS Integration

```typescript
const customStyles = `
  .custom-highlight {
    background: linear-gradient(135deg, #c96442 0%, #e97a56 100%);
    color: white;
    padding: 16pt;
    border-radius: 8pt;
  }

  .enterprise-premium {
    border-left: 4pt solid #7c3aed;
    background: #f8f6f3;
  }
`;

const stylesheet = stylingIntegration.generateStylesheet('professional', customStyles);
```

### Template Integration

```typescript
// Integration with existing template engine
import { TemplateEngine } from '@/lib/reports/template-engine';

const templateEngine = new TemplateEngine();
const stylingIntegration = ReportStylingIntegration.getInstance();

// Apply styling to template configuration
const styledTemplate = templateEngine.createTemplate({
  tier: 'professional',
  styling: getTierStyling('professional'),
  customizations: {
    // Override specific styling elements
    colorScheme: {
      primary: '#custom-brand-color'
    }
  }
});
```

## Testing

### Running Tests

```bash
# Run styling system tests
npm test src/lib/reports/__tests__/report-styling.test.ts
npm test src/lib/reports/__tests__/styling-integration.test.ts

# Run with coverage
npm test -- --coverage
```

### Custom Test Cases

```typescript
import { generateReportStylesheet, getTierStyling } from '@/lib/reports/report-styling';

describe('Custom Styling Tests', () => {
  it('should apply custom brand colors', () => {
    const styling = getTierStyling('professional');
    expect(styling.colorScheme.primary).toBe('#c96442');
  });

  it('should generate valid CSS', () => {
    const stylesheet = generateReportStylesheet('enterprise');
    expect(stylesheet).toContain('@media print');
    expect(stylesheet).toMatch(/color:\s*#[0-9a-f]{6}/i);
  });
});
```

## Performance Considerations

### Caching

The styling system includes built-in caching for generated stylesheets:

```typescript
// First call generates and caches
const stylesheet1 = stylingIntegration.generateStylesheet('professional');

// Second call returns cached version
const stylesheet2 = stylingIntegration.generateStylesheet('professional');

console.log(stylesheet1 === stylesheet2); // true (same reference)
```

### Memory Management

- Stylesheets are cached per tier and customization combination
- Cache keys are automatically generated based on tier and custom styles
- Memory usage is optimized for typical report generation workflows

## Troubleshooting

### Common Issues

1. **Colors not displaying in print**
   - Ensure `print-color-adjust: exact` is included
   - Check that colors are dark enough for print (use `StyleUtils.toPrintColor`)

2. **Page breaks not working**
   - Verify CSS includes proper page break declarations
   - Use `StyleUtils.getPageBreakCSS()` for consistent page break rules

3. **Typography not loading**
   - Check font family declarations in generated CSS
   - Ensure fonts are available in the rendering environment

4. **Styling not applied**
   - Verify tier parameter is correct ('professional' or 'enterprise')
   - Check that styling configuration is properly merged

### Debug Mode

```typescript
// Enable debug logging (if implemented)
const stylingIntegration = ReportStylingIntegration.getInstance();

// Check cache status
console.log('Cache size:', stylingIntegration['styleCache'].size);

// Validate generated CSS
const stylesheet = stylingIntegration.generateStylesheet('professional');
console.log('Generated stylesheet length:', stylesheet.length);
```

## Examples

### Complete Report Styling

```typescript
import {
  ReportStylingIntegration,
  applyTierStyling,
  generateStyledHTML,
} from '@/lib/reports/styling-integration';

// Initialize styling system
const stylingIntegration = ReportStylingIntegration.getInstance();

// Apply tier styling to configuration
const styledConfig = applyTierStyling(reportConfig);

// Generate report content with styling
const reportContent = `
  ${stylingIntegration.generateStyledMetrics(metrics, 'professional')}
  ${stylingIntegration.generateStyledTable(tableData, 'professional')}
  ${stylingIntegration.generateStyledChart(chartConfig, 'professional', chartImageUrl)}
  ${stylingIntegration.generateStyledRecommendations(recommendations, 'professional')}
`;

// Wrap in complete HTML structure
const styledHTML = stylingIntegration.generateStyledHTMLStructure(
  'professional',
  reportContent
);

// Result: Complete styled HTML ready for PDF generation
```

This comprehensive styling system ensures consistent, professional presentation across all Professional and Enterprise tier reports while maintaining flexibility for customization and optimization for both screen and print output.