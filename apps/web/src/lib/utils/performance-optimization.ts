/**
 * Performance optimization utilities for large dataset visualization
 */

import * as d3 from 'd3';
import { debounce, throttle } from './visualization-helpers';

/**
 * Canvas-based renderer for high-performance visualizations
 */
export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private pixelRatio: number;
  private animationFrame: number | null = null;

  constructor(container: HTMLElement, width: number, height: number) {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
    this.pixelRatio = window.devicePixelRatio || 1;

    // Set canvas dimensions
    this.canvas.width = width * this.pixelRatio;
    this.canvas.height = height * this.pixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    // Scale context for high DPI displays
    this.context.scale(this.pixelRatio, this.pixelRatio);

    container.appendChild(this.canvas);
  }

  /**
   * Clear the canvas
   */
  clear(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draw scatter plot points efficiently
   */
  drawScatterPlot(
    data: Array<{ x: number; y: number; color?: string; radius?: number }>,
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>
  ): void {
    this.context.save();

    data.forEach(point => {
      const x = xScale(point.x);
      const y = yScale(point.y);
      const radius = point.radius || 3;

      this.context.beginPath();
      this.context.arc(x, y, radius, 0, 2 * Math.PI);
      this.context.fillStyle = point.color || '#2563eb';
      this.context.fill();
    });

    this.context.restore();
  }

  /**
   * Draw line chart efficiently
   */
  drawLine(
    data: Array<{ x: number; y: number }>,
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    color: string = '#2563eb',
    lineWidth: number = 2
  ): void {
    if (data.length < 2) return;

    this.context.save();
    this.context.strokeStyle = color;
    this.context.lineWidth = lineWidth;
    this.context.beginPath();

    const firstPoint = data[0];
    this.context.moveTo(xScale(firstPoint.x), yScale(firstPoint.y));

    for (let i = 1; i < data.length; i++) {
      const point = data[i];
      this.context.lineTo(xScale(point.x), yScale(point.y));
    }

    this.context.stroke();
    this.context.restore();
  }

  /**
   * Draw heat map efficiently
   */
  drawHeatMap(
    data: Array<{ x: number; y: number; value: number; color: string }>,
    cellWidth: number,
    cellHeight: number
  ): void {
    this.context.save();

    data.forEach(cell => {
      this.context.fillStyle = cell.color;
      this.context.fillRect(cell.x, cell.y, cellWidth, cellHeight);
    });

    this.context.restore();
  }

  /**
   * Animate with requestAnimationFrame
   */
  animate(callback: () => void): void {
    const frame = () => {
      callback();
      this.animationFrame = requestAnimationFrame(frame);
    };
    this.animationFrame = requestAnimationFrame(frame);
  }

  /**
   * Stop animation
   */
  stopAnimation(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Export canvas as blob
   */
  exportAsBlob(quality: number = 1): Promise<Blob | null> {
    return new Promise(resolve => {
      this.canvas.toBlob(resolve, 'image/png', quality);
    });
  }

  /**
   * Destroy canvas and cleanup
   */
  destroy(): void {
    this.stopAnimation();
    this.canvas.remove();
  }
}

/**
 * Data virtualization for large datasets
 */
export class DataVirtualizer<T> {
  private data: T[];
  private itemHeight: number;
  private containerHeight: number;
  private scrollTop: number = 0;
  private visibleStartIndex: number = 0;
  private visibleEndIndex: number = 0;
  private buffer: number = 5;

  constructor(data: T[], itemHeight: number, containerHeight: number) {
    this.data = data;
    this.itemHeight = itemHeight;
    this.containerHeight = containerHeight;
    this.updateVisibleRange();
  }

  /**
   * Update visible range based on scroll position
   */
  updateScroll(scrollTop: number): void {
    this.scrollTop = scrollTop;
    this.updateVisibleRange();
  }

  /**
   * Get visible items with buffer
   */
  getVisibleItems(): { items: T[]; startIndex: number; offsetY: number } {
    const items = this.data.slice(this.visibleStartIndex, this.visibleEndIndex + 1);
    const offsetY = this.visibleStartIndex * this.itemHeight;

    return { items, startIndex: this.visibleStartIndex, offsetY };
  }

  /**
   * Get total height for scrolling
   */
  getTotalHeight(): number {
    return this.data.length * this.itemHeight;
  }

  private updateVisibleRange(): void {
    const visibleStart = Math.floor(this.scrollTop / this.itemHeight);
    const visibleEnd = Math.ceil((this.scrollTop + this.containerHeight) / this.itemHeight);

    this.visibleStartIndex = Math.max(0, visibleStart - this.buffer);
    this.visibleEndIndex = Math.min(this.data.length - 1, visibleEnd + this.buffer);
  }
}

/**
 * Level-of-detail rendering for different zoom levels
 */
export class LevelOfDetailRenderer {
  private zoomLevel: number = 1;
  private thresholds: Array<{ level: number; maxPoints: number; simplification: number }>;

  constructor() {
    this.thresholds = [
      { level: 0.1, maxPoints: 100, simplification: 10 },
      { level: 0.5, maxPoints: 500, simplification: 5 },
      { level: 1, maxPoints: 1000, simplification: 2 },
      { level: 2, maxPoints: 5000, simplification: 1 },
      { level: 5, maxPoints: 10000, simplification: 0 }
    ];
  }

  /**
   * Update zoom level
   */
  setZoomLevel(level: number): void {
    this.zoomLevel = level;
  }

  /**
   * Get appropriate rendering settings for current zoom level
   */
  getRenderingSettings(): { maxPoints: number; simplification: number } {
    const threshold = this.thresholds
      .reverse()
      .find(t => this.zoomLevel >= t.level) || this.thresholds[0];

    return {
      maxPoints: threshold.maxPoints,
      simplification: threshold.simplification
    };
  }

  /**
   * Simplify data based on current zoom level
   */
  simplifyData<T extends { x: number; y: number }>(data: T[]): T[] {
    const settings = this.getRenderingSettings();

    if (data.length <= settings.maxPoints) {
      return data;
    }

    if (settings.simplification === 0) {
      return data;
    }

    // Simple downsampling - take every nth point
    const step = Math.ceil(data.length / settings.maxPoints);
    return data.filter((_, index) => index % step === 0);
  }
}

/**
 * Memory-efficient data streaming
 */
export class DataStreamer<T> {
  private buffer: T[] = [];
  private maxBufferSize: number;
  private onDataUpdate: (data: T[]) => void;
  private processingQueue: T[] = [];
  private isProcessing: boolean = false;

  constructor(maxBufferSize: number, onDataUpdate: (data: T[]) => void) {
    this.maxBufferSize = maxBufferSize;
    this.onDataUpdate = onDataUpdate;
  }

  /**
   * Add data to stream
   */
  addData(data: T[]): void {
    this.processingQueue.push(...data);
    this.processQueue();
  }

  /**
   * Process data queue efficiently
   */
  private processQueue = debounce(() => {
    if (this.isProcessing || this.processingQueue.length === 0) return;

    this.isProcessing = true;

    // Process in chunks to avoid blocking UI
    const chunkSize = 1000;
    const processChunk = () => {
      const chunk = this.processingQueue.splice(0, chunkSize);
      this.buffer.push(...chunk);

      // Trim buffer if it exceeds max size
      if (this.buffer.length > this.maxBufferSize) {
        this.buffer = this.buffer.slice(-this.maxBufferSize);
      }

      if (this.processingQueue.length > 0) {
        requestAnimationFrame(processChunk);
      } else {
        this.isProcessing = false;
        this.onDataUpdate([...this.buffer]);
      }
    };

    requestAnimationFrame(processChunk);
  }, 16);

  /**
   * Clear buffer
   */
  clear(): void {
    this.buffer = [];
    this.processingQueue = [];
    this.isProcessing = false;
  }

  /**
   * Get current buffer size
   */
  getBufferSize(): number {
    return this.buffer.length;
  }
}

/**
 * Performance monitor for visualization components
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private startTimes: Map<string, number> = new Map();

  /**
   * Start timing an operation
   */
  startTimer(operation: string): void {
    this.startTimes.set(operation, performance.now());
  }

  /**
   * End timing and record metric
   */
  endTimer(operation: string): number {
    const startTime = this.startTimes.get(operation);
    if (!startTime) return 0;

    const duration = performance.now() - startTime;

    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    const operationMetrics = this.metrics.get(operation)!;
    operationMetrics.push(duration);

    // Keep only last 100 measurements
    if (operationMetrics.length > 100) {
      operationMetrics.shift();
    }

    this.startTimes.delete(operation);
    return duration;
  }

  /**
   * Get performance statistics for an operation
   */
  getStats(operation: string): {
    avg: number;
    min: number;
    max: number;
    count: number;
  } | null {
    const metrics = this.metrics.get(operation);
    if (!metrics || metrics.length === 0) return null;

    return {
      avg: metrics.reduce((sum, val) => sum + val, 0) / metrics.length,
      min: Math.min(...metrics),
      max: Math.max(...metrics),
      count: metrics.length
    };
  }

  /**
   * Get all performance metrics
   */
  getAllStats(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const stats: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    for (const [operation] of this.metrics) {
      const operationStats = this.getStats(operation);
      if (operationStats) {
        stats[operation] = operationStats;
      }
    }

    return stats;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.startTimes.clear();
  }
}

/**
 * Adaptive performance controller
 */
export class AdaptivePerformanceController {
  private monitor: PerformanceMonitor;
  private targetFPS: number = 60;
  private currentQuality: number = 1;
  private qualityLevels: number[] = [0.5, 0.75, 1, 1.25, 1.5];
  private frameRateHistory: number[] = [];

  constructor() {
    this.monitor = new PerformanceMonitor();
  }

  /**
   * Update frame rate and adjust quality if needed
   */
  updateFrameRate(frameTime: number): void {
    const fps = 1000 / frameTime;
    this.frameRateHistory.push(fps);

    // Keep only last 30 frames
    if (this.frameRateHistory.length > 30) {
      this.frameRateHistory.shift();
    }

    // Adjust quality based on average FPS
    if (this.frameRateHistory.length >= 10) {
      const avgFPS = this.frameRateHistory.reduce((sum, val) => sum + val, 0) / this.frameRateHistory.length;

      if (avgFPS < this.targetFPS * 0.8 && this.currentQuality > this.qualityLevels[0]) {
        // Decrease quality
        const currentIndex = this.qualityLevels.indexOf(this.currentQuality);
        this.currentQuality = this.qualityLevels[Math.max(0, currentIndex - 1)];
      } else if (avgFPS > this.targetFPS * 1.1 && this.currentQuality < this.qualityLevels[this.qualityLevels.length - 1]) {
        // Increase quality
        const currentIndex = this.qualityLevels.indexOf(this.currentQuality);
        this.currentQuality = this.qualityLevels[Math.min(this.qualityLevels.length - 1, currentIndex + 1)];
      }
    }
  }

  /**
   * Get current quality level
   */
  getCurrentQuality(): number {
    return this.currentQuality;
  }

  /**
   * Get performance recommendations
   */
  getRecommendations(): {
    useCanvas: boolean;
    maxDataPoints: number;
    enableAnimations: boolean;
    updateFrequency: number;
  } {
    const avgFPS = this.frameRateHistory.length > 0
      ? this.frameRateHistory.reduce((sum, val) => sum + val, 0) / this.frameRateHistory.length
      : 60;

    return {
      useCanvas: avgFPS < 30,
      maxDataPoints: Math.floor(avgFPS * 100),
      enableAnimations: avgFPS > 45,
      updateFrequency: avgFPS < 30 ? 500 : 100
    };
  }
}

/**
 * Web Worker for heavy data processing
 */
export class DataProcessor {
  private worker: Worker | null = null;
  private messageQueue: Array<{ id: string; resolve: Function; reject: Function }> = [];

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker(): void {
    const workerScript = `
      self.onmessage = function(e) {
        const { id, operation, data } = e.data;

        try {
          let result;

          switch (operation) {
            case 'calculateStatistics':
              result = calculateStatistics(data);
              break;
            case 'generateHistogram':
              result = generateHistogram(data);
              break;
            case 'smoothData':
              result = smoothData(data);
              break;
            default:
              throw new Error('Unknown operation: ' + operation);
          }

          self.postMessage({ id, result });
        } catch (error) {
          self.postMessage({ id, error: error.message });
        }
      };

      function calculateStatistics(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const n = sorted.length;
        const mean = sorted.reduce((sum, val) => sum + val, 0) / n;
        const median = sorted[Math.floor(n / 2)];
        const variance = sorted.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;

        return {
          mean,
          median,
          standardDeviation: Math.sqrt(variance),
          variance,
          min: sorted[0],
          max: sorted[n - 1]
        };
      }

      function generateHistogram(values, bins = 50) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const binWidth = (max - min) / bins;
        const histogram = [];

        for (let i = 0; i < bins; i++) {
          const binStart = min + i * binWidth;
          const binEnd = binStart + binWidth;
          const count = values.filter(v => v >= binStart && v < binEnd).length;

          histogram.push({
            x: binStart + binWidth / 2,
            y: count,
            count
          });
        }

        return histogram;
      }

      function smoothData(data, windowSize = 5) {
        const smoothed = [];
        const halfWindow = Math.floor(windowSize / 2);

        for (let i = 0; i < data.length; i++) {
          const start = Math.max(0, i - halfWindow);
          const end = Math.min(data.length - 1, i + halfWindow);
          const window = data.slice(start, end + 1);
          const average = window.reduce((sum, val) => sum + val, 0) / window.length;

          smoothed.push(average);
        }

        return smoothed;
      }
    `;

    const blob = new Blob([workerScript], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));

    this.worker.onmessage = (e) => {
      const { id, result, error } = e.data;
      const messageIndex = this.messageQueue.findIndex(msg => msg.id === id);

      if (messageIndex !== -1) {
        const message = this.messageQueue[messageIndex];
        this.messageQueue.splice(messageIndex, 1);

        if (error) {
          message.reject(new Error(error));
        } else {
          message.resolve(result);
        }
      }
    };
  }

  /**
   * Process data using web worker
   */
  process<T>(operation: string, data: any): Promise<T> {
    if (!this.worker) {
      return Promise.reject(new Error('Worker not initialized'));
    }

    const id = Math.random().toString(36).substr(2, 9);

    return new Promise((resolve, reject) => {
      this.messageQueue.push({ id, resolve, reject });
      this.worker!.postMessage({ id, operation, data });
    });
  }

  /**
   * Destroy worker
   */
  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.messageQueue = [];
  }
}