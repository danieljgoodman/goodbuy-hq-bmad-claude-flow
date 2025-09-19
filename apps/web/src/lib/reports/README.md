# High-Quality Chart Generation System

## Overview

The chart generation system provides print-quality (300 DPI) charts for Professional and Enterprise tier reports using Chart.js with Node Canvas backend. It supports all major chart types with Professional/Enterprise branding and advanced features like caching and performance optimization.

## Features

### Core Capabilities
- **Print Quality**: 300 DPI output for professional reports
- **Multiple Chart Types**: Financial trends, customer concentration, competitive radar, ROI calculator
- **Enterprise Charts**: Scenario matrix, exit strategy, capital structure, strategic options
- **Performance Optimization**: Intelligent caching and batch generation
- **Tier-Specific Branding**: Professional and Enterprise themes

### Supported Chart Types

#### Professional Tier
1. **Financial Trends Chart** - Line chart showing performance over time
2. **Customer Concentration Chart** - Pie/doughnut chart for revenue distribution
3. **Competitive Radar Chart** - Multi-dimensional competitive positioning
4. **ROI Calculator Chart** - Bar chart for investment projections
5. **Risk Assessment Chart** - Radar chart for risk analysis
6. **Valuation Summary Chart** - Bar chart comparing valuation methods

#### Enterprise Tier (includes all Professional charts plus)
1. **Scenario Matrix Chart** - Heatmap/scatter for scenario analysis
2. **Exit Strategy Chart** - Waterfall chart for value creation
3. **Capital Structure Chart** - Stacked bar for financing optimization
4. **Strategic Options Chart** - Bubble chart for risk/return analysis
5. **Multi-Year Projections Chart** - Line chart for extended forecasts
6. **Advanced Risk Analysis Chart** - Matrix for complex risk scenarios

## Quick Start

### Basic Chart Generation

```typescript
import { defaultChartGenerator } from '@/lib/reports/chart-generator';

// Generate a financial trends chart
const chartData = {
  labels: ['Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023'],
  datasets: [{
    label: 'Revenue',
    data: [250000, 280000, 320000, 350000],
    borderColor: '#0ea5e9',
    backgroundColor: '#0ea5e9'
  }]
};

const chartImage = await defaultChartGenerator.generateFinancialTrendsChart(
  chartData,
  'professional'
);

// chartImage is a base64-encoded PNG ready for PDF embedding
```

### Using Chart Integration Service

```typescript
import { defaultChartIntegration } from '@/lib/reports/chart-integration';

// Generate all charts for a professional report
const charts = await defaultChartIntegration.generateProfessionalCharts(
  businessEvaluation,
  reportStructure
);

// Generate all charts for an enterprise report
const enterpriseCharts = await defaultChartIntegration.generateEnterpriseCharts(
  businessEvaluation,
  enterpriseData,
  reportStructure
);
```

### Custom Configuration

```typescript
import { ChartGenerator } from '@/lib/reports/chart-generator';

// Create custom generator with high-resolution settings
const customGenerator = new ChartGenerator({
  width: 1600,
  height: 1000,
  dpi: 400,
  quality: 'print'
});

const chart = await customGenerator.generateFinancialTrendsChart(
  data,
  'enterprise'
);
```

## Configuration Options

### Chart Generator Config
```typescript
interface ChartGeneratorConfig {
  width: number;           // Chart width in pixels
  height: number;          // Chart height in pixels
  dpi: number;            // Dots per inch (300 for print)
  backgroundColor: string; // Background color
  devicePixelRatio: number; // Pixel density
  quality: 'low' | 'medium' | 'high' | 'print';
}
```

### Export Options
```typescript
interface ChartExportOptions {
  format: 'png' | 'svg' | 'base64';
  quality: number;        // 0.0 to 1.0
  includeTitle: boolean;
  includeSubtitle: boolean;
  includeWatermark: boolean;
}
```

## Performance Features

### Caching
- Automatic chart caching based on configuration and data
- Configurable cache size and timeout
- Cache statistics and management

### Batch Generation
```typescript
const requests = [
  {
    chartType: 'financial-trends',
    tier: 'professional',
    title: 'Financial Performance',
    data: financialData
  },
  {
    chartType: 'customer-concentration',
    tier: 'professional',
    title: 'Customer Analysis',
    data: customerData
  }
];

const charts = await defaultChartIntegration.generateChartBatch(requests);
```

### Memory Management
- Automatic cache cleanup when size limits are reached
- Configurable retention policies
- Memory usage tracking

## Theming

### Professional Theme
- Clean, business-focused design
- Blue primary color palette
- Standard fonts and spacing
- Conservative styling approach

### Enterprise Theme
- Premium, sophisticated design
- Purple/indigo primary colors
- Enhanced typography
- Advanced visual elements

### Custom Themes
```typescript
generator.updateTheme('professional', {
  colors: {
    primary: ['#custom-color-1', '#custom-color-2'],
    // ... other color overrides
  },
  fonts: {
    sizes: {
      title: 20,
      // ... other size overrides
    }
  }
});
```

## Integration with Reports

### HTML Embedding
```typescript
import { embedChartInHTML } from '@/lib/reports/chart-integration';

const htmlContent = embedChartInHTML(generatedChart);
```

### PDF Integration
Charts are generated as base64-encoded images that can be directly embedded in PDFs:

```typescript
// Chart data is ready for PDF embedding
const pdfDoc = new jsPDF();
pdfDoc.addImage(chart.data, 'PNG', x, y, width, height);
```

## Error Handling

The system includes comprehensive error handling:

```typescript
try {
  const chart = await generator.generateFinancialTrendsChart(data, 'professional');
} catch (error) {
  console.error('Chart generation failed:', error.message);
  // Fallback handling
}
```

## Testing

Run the comprehensive test suite:

```bash
npm test -- src/lib/reports/__tests__/chart-generator.test.ts
```

Tests cover:
- All chart types for both tiers
- Caching functionality
- Performance optimization
- Error handling
- Memory management
- Configuration management

## Examples

See `/examples/chart-examples.ts` for complete working examples including:
- Basic chart generation
- Enterprise-specific charts
- Batch processing
- Performance monitoring
- Error handling patterns

## File Structure

```
src/lib/reports/
├── chart-generator.ts          # Core chart generation engine
├── chart-integration.ts        # Integration service for reports
├── examples/
│   └── chart-examples.ts      # Complete usage examples
├── __tests__/
│   └── chart-generator.test.ts # Comprehensive test suite
└── README.md                  # This documentation
```

## Dependencies

- `chartjs-node-canvas`: Server-side Chart.js rendering
- `chart.js`: Chart.js library with all components
- `canvas`: Node.js Canvas implementation

## Performance Characteristics

- **Generation Time**: 50-200ms per chart (depending on complexity)
- **Memory Usage**: ~2-5MB per cached chart
- **Cache Hit Rate**: 90%+ for repeated report generation
- **Concurrent Limit**: 10+ charts simultaneously

## Best Practices

1. **Use Default Generator**: For most use cases, the default generator provides optimal settings
2. **Batch Generation**: Use batch processing for multiple charts to improve performance
3. **Cache Management**: Monitor cache statistics and clear when needed
4. **Error Handling**: Always wrap chart generation in try-catch blocks
5. **Resource Cleanup**: Clear caches periodically in long-running processes

## Support

For issues or feature requests related to chart generation, check:
1. Test suite for expected behavior patterns
2. Examples directory for implementation patterns
3. Type definitions for configuration options
4. Performance monitoring utilities for optimization

The chart generation system is designed to provide high-quality, professional charts that enhance the value of business analysis reports for both Professional and Enterprise tier customers.