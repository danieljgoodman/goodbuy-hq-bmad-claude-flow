/**
 * Color utilities for consistent design system usage
 * Maps semantic color names to CSS custom properties from colors.md
 */

// Get CSS custom property value for use in JavaScript/TypeScript
export const getCSSVar = (property: string): string => {
  // Add -- prefix if not present
  const cssVar = property.startsWith('--') ? property : `--${property}`;

  if (typeof window === 'undefined') {
    // Return fallback for SSR
    return getColorFallback(property);
  }

  const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar)
  return value.trim() || getColorFallback(property);
}

// Semantic color mappings for charts and components
export const colors = {
  // Business metric colors - Now using semantic colors from colors.md
  success: () => getCSSVar('--success'),           // Green for positive metrics
  warning: () => getCSSVar('--warning'),           // Orange/amber for warnings
  info: () => getCSSVar('--info'),                 // Blue for info
  danger: () => getCSSVar('--error'),              // Red for danger/risk
  neutral: () => getCSSVar('--muted-foreground'),  // Gray for neutral
  
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
  success: 'var(--success)',
  warning: 'var(--warning)',
  info: 'var(--info)',
  danger: 'var(--error)',
  neutral: 'var(--muted-foreground)',

  chart1: 'var(--chart-1)',
  chart2: 'var(--chart-2)',
  chart3: 'var(--chart-3)',
  chart4: 'var(--chart-4)',
  chart5: 'var(--chart-5)',

  primary: 'var(--primary)',
  secondary: 'var(--secondary)',
  background: 'var(--background)',
  foreground: 'var(--foreground)',
  muted: 'var(--muted)',
  border: 'var(--border)',

  // Gray scale
  gray50: 'var(--gray-50)',
  gray100: 'var(--gray-100)',
  gray200: 'var(--gray-200)',
  gray300: 'var(--gray-300)',
  gray400: 'var(--gray-400)',
  gray500: 'var(--gray-500)',
  gray600: 'var(--gray-600)',
  gray700: 'var(--gray-700)',
  gray800: 'var(--gray-800)',
  gray900: 'var(--gray-900)',
} as const

/**
 * Fallback colors for SSR or when CSS variables are not available
 * These match the light theme from colors.md
 */
function getColorFallback(varName: string): string {
  const fallbacks: Record<string, string> = {
    'primary': '#c96442',
    'secondary': '#e9e6dc',
    'accent': '#e9e6dc',
    'background': '#faf9f5',
    'foreground': '#3d3929',
    'success': '#10b981',
    'warning': '#f59e0b',
    'error': '#ef4444',
    'info': '#3b82f6',
    'border': '#dad9d4',
    'muted': '#ede9de',
    'muted-foreground': '#83827d',
    'chart-1': '#b05730',
    'chart-2': '#9c87f5',
    'chart-3': '#ded8c4',
    'chart-4': '#dbd3f0',
    'chart-5': '#b4552d',
    'gray-50': '#faf9f5',
    'gray-100': '#f5f3f0',
    'gray-200': '#e8e4e0',
    'gray-300': '#dad9d4',
    'gray-400': '#b4b2a7',
    'gray-500': '#83827d',
    'gray-600': '#5d4e42',
    'gray-700': '#3d3929',
    'gray-800': '#2c1810',
    'gray-900': '#141413',
  };

  const cleanVarName = varName.replace('--', '');
  return fallbacks[cleanVarName] || '#000000';
}

/**
 * Get color value with opacity
 * @param varName - CSS variable name
 * @param opacity - Opacity value (0-1)
 * @returns RGBA color string
 */
export function getColorWithOpacity(varName: string, opacity: number): string {
  const color = getCSSVar(varName);

  // If it's already an rgba value, replace the opacity
  if (color.startsWith('rgba')) {
    return color.replace(/[\d.]+\)$/, `${opacity})`);
  }

  // Convert hex to rgba
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // If it's rgb, convert to rgba
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
  }

  return color;
}