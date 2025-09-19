/**
 * TypeScript type definitions for advanced visualization components
 */

export interface VisualizationData {
  id: string;
  name: string;
  value: number;
  date?: Date;
  category?: string;
  metadata?: Record<string, any>;
}

export interface MonteCarloSimulationData {
  scenario: string;
  iterations: number;
  results: {
    value: number;
    probability: number;
  }[];
  statistics: {
    mean: number;
    median: number;
    standardDeviation: number;
    variance: number;
    skewness: number;
    kurtosis: number;
    percentiles: Record<number, number>;
  };
  confidenceIntervals: {
    level: number;
    lower: number;
    upper: number;
  }[];
}

export interface SensitivityAnalysisData {
  variable: string;
  baseValue: number;
  impact: number;
  lowValue: number;
  highValue: number;
  change: number;
  isPositive: boolean;
}

export interface SurfacePlotData {
  x: number;
  y: number;
  z: number;
  label?: string;
}

export interface HeatMapData {
  x: string | number;
  y: string | number;
  value: number;
  color?: string;
  metadata?: Record<string, any>;
}

export interface SankeyNode {
  id: string;
  name: string;
  category?: string;
  value?: number;
  color?: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  color?: string;
  metadata?: Record<string, any>;
}

export interface NetworkNode {
  id: string;
  name: string;
  group: string;
  value: number;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
  color?: string;
  metadata?: Record<string, any>;
}

export interface NetworkLink {
  source: string;
  target: string;
  value: number;
  type?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface TimeSeriesData {
  date: Date;
  actual?: number;
  forecast?: number;
  upperBound?: number;
  lowerBound?: number;
  confidence?: number;
  trend?: number;
  seasonal?: number;
  residual?: number;
}

export interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface ExportOptions {
  format: 'png' | 'svg' | 'pdf';
  filename: string;
  quality?: number;
  scale?: number;
  backgroundColor?: string;
}

export interface DrillDownConfig {
  enabled: boolean;
  levels: string[];
  onDrillDown?: (level: string, data: any) => void;
  onDrillUp?: (level: string) => void;
}

export interface VisualizationConfig {
  theme: 'light' | 'dark';
  colors: string[];
  responsive: boolean;
  animations: boolean;
  dimensions: ChartDimensions;
  drillDown?: DrillDownConfig;
  export?: ExportOptions;
}

export interface ChartInteraction {
  type: 'hover' | 'click' | 'select' | 'zoom' | 'pan';
  data: any;
  position: { x: number; y: number };
  element: SVGElement | HTMLElement;
}

export interface PerformanceOptions {
  useCanvas: boolean;
  virtualization: boolean;
  maxDataPoints: number;
  renderThreshold: number;
  updateStrategy: 'immediate' | 'debounced' | 'throttled';
}

export interface VisualizationProps {
  data: any[];
  config: VisualizationConfig;
  performance?: PerformanceOptions;
  onInteraction?: (interaction: ChartInteraction) => void;
  onExport?: (options: ExportOptions) => void;
  className?: string;
  testId?: string;
}