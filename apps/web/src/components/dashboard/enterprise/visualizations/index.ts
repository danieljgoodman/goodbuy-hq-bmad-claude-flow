/**
 * Advanced Visualizations Component Exports
 * Centralized export for all D3.js visualization components
 */

// Main visualization components
export { MonteCarloVisualization } from './MonteCarloVisualization';
export { SensitivityAnalysisChart } from './SensitivityAnalysisChart';
export { SurfacePlot3D } from './SurfacePlot3D';
export { RiskHeatMap } from './RiskHeatMap';
export { SankeyDiagram } from './SankeyDiagram';
export { NetworkGraph } from './NetworkGraph';
export { TimeSeriesForecast } from './TimeSeriesForecast';

// Main dashboard component
export { AdvancedVisualizations } from '../AdvancedVisualizations';

// Example component
export { AdvancedVisualizationsExample } from '../examples/AdvancedVisualizationsExample';

// Type definitions
export type {
  MonteCarloSimulationData,
  SensitivityAnalysisData,
  SurfacePlotData,
  HeatMapData,
  SankeyNode,
  SankeyLink,
  NetworkNode,
  NetworkLink,
  TimeSeriesData,
  VisualizationData,
  VisualizationConfig,
  ChartInteraction,
  ExportOptions,
  DrillDownConfig,
  PerformanceOptions,
  VisualizationProps,
  ChartDimensions
} from '../../../lib/types/visualization';

// Utility functions
export {
  createSVG,
  createCanvas,
  formatNumber,
  formatDate,
  calculateStatistics,
  calculateConfidenceIntervals,
  generateForecast,
  exportChart,
  getResponsiveDimensions,
  debounce,
  throttle,
  COLOR_SCHEMES,
  DEFAULT_DIMENSIONS
} from '../../../lib/utils/visualization-helpers';

// Performance optimization utilities
export {
  CanvasRenderer,
  DataVirtualizer,
  LevelOfDetailRenderer,
  DataStreamer,
  PerformanceMonitor,
  AdaptivePerformanceController,
  DataProcessor
} from '../../../lib/utils/performance-optimization';