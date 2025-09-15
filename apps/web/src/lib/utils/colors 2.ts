/**
 * Color utilities for consistent design system usage
 * Maps semantic color names to CSS custom properties from colors.md
 */

// Get CSS custom property value for use in JavaScript/TypeScript
export const getCSSVar = (property: string): string => {
  if (typeof window === 'undefined') {
    // Return fallback for SSR
    return `hsl(var(${property}))`
  }
  
  const value = getComputedStyle(document.documentElement).getPropertyValue(property)
  return value.trim() ? `hsl(${value})` : `hsl(var(${property}))`
}

// Semantic color mappings for charts and components
export const colors = {
  // Business metric colors
  success: () => getCSSVar('--chart-1'),      // Green for positive metrics
  warning: () => getCSSVar('--chart-2'),      // Orange/amber for warnings  
  info: () => getCSSVar('--primary'),         // Primary color for info
  danger: () => getCSSVar('--destructive'),   // Red for danger/risk
  neutral: () => getCSSVar('--muted-foreground'), // Gray for neutral
  
  // Chart colors (consistent with colors.md)
  chart1: () => getCSSVar('--chart-1'),
  chart2: () => getCSSVar('--chart-2'), 
  chart3: () => getCSSVar('--chart-3'),
  chart4: () => getCSSVar('--chart-4'),
  chart5: () => getCSSVar('--chart-5'),
  
  // Core theme colors
  primary: () => getCSSVar('--primary'),
  secondary: () => getCSSVar('--secondary'),
  background: () => getCSSVar('--background'),
  foreground: () => getCSSVar('--foreground'),
  muted: () => getCSSVar('--muted'),
  border: () => getCSSVar('--border'),
} as const

// Health score color mapping (replaces hardcoded colors)
export const getHealthScoreColor = (score: number): string => {
  if (score >= 80) return colors.success()    // Green
  if (score >= 60) return colors.warning()    // Orange/amber
  if (score >= 40) return colors.danger()     // Red
  return colors.neutral()                     // Gray
}

// Business metric color mapping
export const getMetricColor = (type: 'financial' | 'operational' | 'market' | 'risk' | 'growth'): string => {
  const colorMap = {
    financial: colors.info(),      // Primary blue
    operational: colors.success(), // Green
    market: colors.warning(),      // Orange
    risk: colors.danger(),         // Red
    growth: colors.chart5(),       // Purple
  }
  return colorMap[type] || colors.neutral()
}

// Chart color palette (for multi-series charts)
export const getChartPalette = (): string[] => [
  colors.chart1(),
  colors.chart2(),
  colors.chart3(), 
  colors.chart4(),
  colors.chart5(),
  colors.info(),
]

// Status color mapping
export const getStatusColor = (status: 'completed' | 'processing' | 'failed' | 'pending'): string => {
  const statusMap = {
    completed: colors.success(),
    processing: colors.warning(),
    failed: colors.danger(),
    pending: colors.neutral(),
  }
  return statusMap[status] || colors.neutral()
}

// Export raw CSS custom property strings for direct usage
export const cssVars = {
  success: 'hsl(var(--chart-1))',
  warning: 'hsl(var(--chart-2))',
  info: 'hsl(var(--primary))',
  danger: 'hsl(var(--destructive))',
  neutral: 'hsl(var(--muted-foreground))',
  
  chart1: 'hsl(var(--chart-1))',
  chart2: 'hsl(var(--chart-2))',
  chart3: 'hsl(var(--chart-3))',
  chart4: 'hsl(var(--chart-4))',
  chart5: 'hsl(var(--chart-5))',
  
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
} as const