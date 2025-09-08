export interface BaseChartProps {
  data: any[]
  height?: number
  width?: number
  responsive?: boolean
  className?: string
}

export interface LineChartProps extends BaseChartProps {
  xAxisKey: string
  yAxisKey: string
  lineColor?: string
  strokeWidth?: number
  showDots?: boolean
  showGrid?: boolean
  onPointClick?: (data: any) => void
}

export interface BarChartProps extends BaseChartProps {
  xAxisKey: string
  yAxisKey: string
  barColor?: string
  showLabels?: boolean
  orientation?: 'horizontal' | 'vertical'
  onBarClick?: (data: any) => void
}

export interface AreaChartProps extends BaseChartProps {
  xAxisKey: string
  yAxisKey: string
  areaColor?: string
  fillOpacity?: number
  gradient?: boolean
  stackOffset?: 'none' | 'expand' | 'wiggle' | 'silhouette'
}

export interface PieChartProps extends BaseChartProps {
  dataKey: string
  nameKey: string
  colors?: string[]
  showLabels?: boolean
  showPercentage?: boolean
  innerRadius?: number
  outerRadius?: number
  onSliceClick?: (data: any) => void
}

export interface GaugeChartProps {
  value: number
  min?: number
  max?: number
  segments?: Array<{
    start: number
    end: number
    color: string
    label?: string
  }>
  size?: number
  thickness?: number
  showValue?: boolean
  label?: string
  className?: string
}

export interface ProgressChartProps {
  value: number
  max?: number
  color?: string
  size?: 'sm' | 'md' | 'lg'
  showPercentage?: boolean
  showValue?: boolean
  label?: string
  className?: string
}

export interface ChartTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  formatter?: (value: any, name: string) => [string, string]
  labelFormatter?: (value: any) => string
}

export interface ChartLegendProps {
  payload?: any[]
  wrapperStyle?: React.CSSProperties
  iconType?: 'line' | 'square' | 'rect' | 'circle' | 'cross' | 'diamond' | 'star' | 'triangle' | 'wye'
}

export interface ChartAxisProps {
  domain?: [number | string, number | string]
  type?: 'number' | 'category'
  tick?: boolean | React.ComponentType<any>
  tickFormatter?: (value: any) => string
  label?: string | { value: string; angle?: number; position?: string }
}

export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'gauge' | 'progress'

export interface ChartTheme {
  colors: {
    primary: string
    secondary: string
    accent: string
    success: string
    warning: string
    danger: string
    info: string
    muted: string
  }
  fonts: {
    body: string
    heading: string
  }
  spacing: {
    sm: number
    md: number
    lg: number
  }
}