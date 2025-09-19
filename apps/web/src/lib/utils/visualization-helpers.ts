/**
 * Utility functions for D3.js chart configurations and data processing
 */

import * as d3 from 'd3';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import type {
  ChartDimensions,
  ExportOptions,
  MonteCarloSimulationData,
  SensitivityAnalysisData,
  TimeSeriesData,
  VisualizationConfig
} from '../types/visualization';

/**
 * Default chart dimensions and margins
 */
export const DEFAULT_DIMENSIONS: ChartDimensions = {
  width: 800,
  height: 600,
  margin: {
    top: 20,
    right: 30,
    bottom: 40,
    left: 50
  }
};

/**
 * Color schemes for different chart types
 */
export const COLOR_SCHEMES = {
  categorical: d3.schemeCategory10,
  sequential: d3.schemeBlues[9],
  diverging: d3.schemeRdYlBu[11],
  risk: ['#2563eb', '#dc2626', '#f59e0b', '#059669'],
  financial: ['#1f2937', '#374151', '#6b7280', '#9ca3af', '#d1d5db']
};

/**
 * Generate responsive dimensions based on container size
 */
export function getResponsiveDimensions(
  container: HTMLElement,
  aspectRatio: number = 16/9
): ChartDimensions {
  const containerWidth = container.clientWidth;
  const width = Math.max(400, containerWidth - 40);
  const height = width / aspectRatio;

  return {
    width,
    height,
    margin: {
      top: height * 0.05,
      right: width * 0.05,
      bottom: height * 0.1,
      left: width * 0.1
    }
  };
}

/**
 * Create SVG element with proper dimensions and responsive behavior
 */
export function createSVG(
  container: d3.Selection<HTMLElement, unknown, null, undefined>,
  dimensions: ChartDimensions,
  className: string = 'visualization-svg'
): d3.Selection<SVGSVGElement, unknown, null, undefined> {
  return container
    .append('svg')
    .attr('class', className)
    .attr('width', dimensions.width)
    .attr('height', dimensions.height)
    .attr('viewBox', `0 0 ${dimensions.width} ${dimensions.height}`)
    .style('max-width', '100%')
    .style('height', 'auto');
}

/**
 * Create canvas element for high-performance rendering
 */
export function createCanvas(
  container: HTMLElement,
  dimensions: ChartDimensions,
  pixelRatio: number = window.devicePixelRatio || 1
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;

  canvas.width = dimensions.width * pixelRatio;
  canvas.height = dimensions.height * pixelRatio;
  canvas.style.width = `${dimensions.width}px`;
  canvas.style.height = `${dimensions.height}px`;

  context.scale(pixelRatio, pixelRatio);
  container.appendChild(canvas);

  return canvas;
}

/**
 * Format numbers for display in charts
 */
export function formatNumber(
  value: number,
  type: 'currency' | 'percent' | 'decimal' | 'integer' = 'decimal',
  precision: number = 2
): string {
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: precision
      }).format(value);
    case 'percent':
      return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: precision
      }).format(value);
    case 'integer':
      return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0
      }).format(value);
    default:
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
      }).format(value);
  }
}

/**
 * Format dates for display in charts
 */
export function formatDate(date: Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
  switch (format) {
    case 'short':
      return d3.timeFormat('%m/%d/%y')(date);
    case 'long':
      return d3.timeFormat('%B %d, %Y')(date);
    default:
      return d3.timeFormat('%b %d, %Y')(date);
  }
}

/**
 * Generate statistical summary for Monte Carlo simulations
 */
export function calculateStatistics(values: number[]): MonteCarloSimulationData['statistics'] {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const mean = d3.mean(sorted) || 0;
  const median = d3.median(sorted) || 0;
  const variance = d3.variance(sorted) || 0;
  const standardDeviation = Math.sqrt(variance);

  // Calculate skewness and kurtosis
  const skewness = calculateSkewness(sorted, mean, standardDeviation);
  const kurtosis = calculateKurtosis(sorted, mean, standardDeviation);

  // Calculate percentiles
  const percentiles: Record<number, number> = {};
  [5, 10, 25, 50, 75, 90, 95].forEach(p => {
    percentiles[p] = d3.quantile(sorted, p / 100) || 0;
  });

  return {
    mean,
    median,
    standardDeviation,
    variance,
    skewness,
    kurtosis,
    percentiles
  };
}

function calculateSkewness(values: number[], mean: number, std: number): number {
  const n = values.length;
  const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / std, 3), 0);
  return (n / ((n - 1) * (n - 2))) * sum;
}

function calculateKurtosis(values: number[], mean: number, std: number): number {
  const n = values.length;
  const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / std, 4), 0);
  return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum - (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
}

/**
 * Calculate confidence intervals
 */
export function calculateConfidenceIntervals(
  values: number[],
  levels: number[] = [0.68, 0.95, 0.99]
): { level: number; lower: number; upper: number }[] {
  const sorted = [...values].sort((a, b) => a - b);

  return levels.map(level => {
    const alpha = 1 - level;
    const lowerPercentile = alpha / 2;
    const upperPercentile = 1 - alpha / 2;

    return {
      level,
      lower: d3.quantile(sorted, lowerPercentile) || 0,
      upper: d3.quantile(sorted, upperPercentile) || 0
    };
  });
}

/**
 * Generate time series forecast with confidence bands
 */
export function generateForecast(
  historicalData: TimeSeriesData[],
  periods: number,
  confidence: number = 0.95
): TimeSeriesData[] {
  const forecast: TimeSeriesData[] = [];
  const values = historicalData.map(d => d.actual || 0);
  const trend = calculateTrend(values);
  const seasonality = calculateSeasonality(values, 12); // Assuming monthly data
  const noise = calculateNoise(values, trend, seasonality);

  const lastDate = historicalData[historicalData.length - 1].date;

  for (let i = 1; i <= periods; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setMonth(forecastDate.getMonth() + i);

    const trendValue = trend * i;
    const seasonalValue = seasonality[i % seasonality.length];
    const forecastValue = values[values.length - 1] + trendValue + seasonalValue;

    const errorMargin = Math.sqrt(noise) * Math.sqrt(i) * 1.96 * (1 - confidence);

    forecast.push({
      date: forecastDate,
      forecast: forecastValue,
      upperBound: forecastValue + errorMargin,
      lowerBound: forecastValue - errorMargin,
      confidence
    });
  }

  return forecast;
}

function calculateTrend(values: number[]): number {
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = values;

  const sumX = d3.sum(x);
  const sumY = d3.sum(y);
  const sumXY = d3.sum(x.map((xi, i) => xi * y[i]));
  const sumX2 = d3.sum(x.map(xi => xi * xi));

  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

function calculateSeasonality(values: number[], period: number): number[] {
  const seasonal = new Array(period).fill(0);
  const counts = new Array(period).fill(0);

  values.forEach((value, index) => {
    const seasonIndex = index % period;
    seasonal[seasonIndex] += value;
    counts[seasonIndex]++;
  });

  return seasonal.map((sum, i) => counts[i] > 0 ? sum / counts[i] : 0);
}

function calculateNoise(values: number[], trend: number, seasonality: number[]): number {
  const residuals = values.map((value, index) => {
    const trendValue = trend * index;
    const seasonalValue = seasonality[index % seasonality.length];
    return value - trendValue - seasonalValue;
  });

  return d3.variance(residuals) || 0;
}

/**
 * Export chart as image or PDF
 */
export async function exportChart(
  element: HTMLElement,
  options: ExportOptions
): Promise<void> {
  const { format, filename, quality = 1, scale = 2, backgroundColor = '#ffffff' } = options;

  try {
    switch (format) {
      case 'png':
        await exportPNG(element, filename, quality, scale, backgroundColor);
        break;
      case 'svg':
        await exportSVG(element, filename);
        break;
      case 'pdf':
        await exportPDF(element, filename, backgroundColor);
        break;
    }
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error(`Failed to export chart as ${format.toUpperCase()}`);
  }
}

async function exportPNG(
  element: HTMLElement,
  filename: string,
  quality: number,
  scale: number,
  backgroundColor: string
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale,
    backgroundColor,
    useCORS: true,
    allowTaint: true
  });

  canvas.toBlob((blob) => {
    if (blob) {
      saveAs(blob, `${filename}.png`);
    }
  }, 'image/png', quality);
}

async function exportSVG(element: HTMLElement, filename: string): Promise<void> {
  const svgElement = element.querySelector('svg');
  if (!svgElement) {
    throw new Error('No SVG element found for export');
  }

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  saveAs(blob, `${filename}.svg`);
}

async function exportPDF(
  element: HTMLElement,
  filename: string,
  backgroundColor: string
): Promise<void> {
  const canvas = await html2canvas(element, {
    backgroundColor,
    useCORS: true,
    allowTaint: true
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [canvas.width, canvas.height]
  });

  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
  pdf.save(`${filename}.pdf`);
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}