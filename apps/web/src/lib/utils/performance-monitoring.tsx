/**
 * Performance monitoring utility for Enterprise dashboard
 * Tracks load times, component rendering, and memory usage
 */

import React from 'react';

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
  timestamp: number;
  route: string;
  userAgent: string;
}

export interface ComponentMetrics {
  name: string;
  renderTime: number;
  rerenderCount: number;
  memoryImpact: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private componentMetrics: Map<string, ComponentMetrics> = new Map();
  private observers: PerformanceObserver[] = [];
  private startTime: number = 0;

  constructor() {
    this.initializeObservers();
    this.startTime = performance.now();
  }

  /**
   * Initialize performance observers for various metrics
   */
  private initializeObservers(): void {
    if (typeof window === 'undefined') return;

    // Navigation timing observer
    try {
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.recordNavigationMetrics(entry as PerformanceNavigationTiming);
          }
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);
    } catch (error) {
      console.warn('Navigation observer not supported:', error);
    }

    // Resource timing observer
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            this.recordResourceMetrics(entry as PerformanceResourceTiming);
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (error) {
      console.warn('Resource observer not supported:', error);
    }

    // Paint timing observer
    try {
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'paint') {
            this.recordPaintMetrics(entry);
          }
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);
    } catch (error) {
      console.warn('Paint observer not supported:', error);
    }
  }

  /**
   * Record navigation timing metrics
   */
  private recordNavigationMetrics(entry: PerformanceNavigationTiming): void {
    const loadTime = entry.loadEventEnd - entry.navigationStart;
    const renderTime = entry.domContentLoadedEventEnd - entry.navigationStart;

    const metrics: PerformanceMetrics = {
      loadTime,
      renderTime,
      memoryUsage: this.getMemoryUsage(),
      componentCount: this.getComponentCount(),
      timestamp: Date.now(),
      route: window.location.pathname,
      userAgent: navigator.userAgent
    };

    this.metrics.push(metrics);
    this.reportMetrics(metrics);
  }

  /**
   * Record resource loading metrics
   */
  private recordResourceMetrics(entry: PerformanceResourceTiming): void {
    const loadTime = entry.responseEnd - entry.startTime;

    // Log slow resources (>500ms)
    if (loadTime > 500) {
      console.warn(`Slow resource detected: ${entry.name} took ${loadTime.toFixed(2)}ms`);
    }
  }

  /**
   * Record paint timing metrics
   */
  private recordPaintMetrics(entry: PerformanceEntry): void {
    console.log(`${entry.name}: ${entry.startTime.toFixed(2)}ms`);
  }

  /**
   * Start tracking component render time
   */
  public startComponentRender(componentName: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      this.updateComponentMetrics(componentName, renderTime);
    };
  }

  /**
   * Update component-specific metrics
   */
  private updateComponentMetrics(componentName: string, renderTime: number): void {
    const existing = this.componentMetrics.get(componentName) || {
      name: componentName,
      renderTime: 0,
      rerenderCount: 0,
      memoryImpact: 0
    };

    existing.renderTime = renderTime;
    existing.rerenderCount += 1;
    existing.memoryImpact = this.getMemoryUsage();

    this.componentMetrics.set(componentName, existing);

    // Log slow components (>100ms)
    if (renderTime > 100) {
      console.warn(`Slow component render: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if (typeof window === 'undefined' || !('performance' in window)) return 0;

    try {
      const memory = (performance as any).memory;
      return memory ? memory.usedJSHeapSize / 1024 / 1024 : 0; // MB
    } catch {
      return 0;
    }
  }

  /**
   * Estimate component count on page
   */
  private getComponentCount(): number {
    if (typeof document === 'undefined') return 0;
    return document.querySelectorAll('[data-testid], [data-component]').length;
  }

  /**
   * Report metrics to console or analytics service
   */
  private reportMetrics(metrics: PerformanceMetrics): void {
    console.group('🚀 Performance Metrics');
    console.log(`Load Time: ${metrics.loadTime.toFixed(2)}ms`);
    console.log(`Render Time: ${metrics.renderTime.toFixed(2)}ms`);
    console.log(`Memory Usage: ${metrics.memoryUsage.toFixed(2)}MB`);
    console.log(`Component Count: ${metrics.componentCount}`);
    console.log(`Route: ${metrics.route}`);
    console.groupEnd();

    // Check if load time exceeds 3-second target
    if (metrics.loadTime > 3000) {
      console.error(`⚠️ Load time exceeded 3s target: ${metrics.loadTime.toFixed(2)}ms`);
    }
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary(): {
    avgLoadTime: number;
    avgRenderTime: number;
    avgMemoryUsage: number;
    slowestComponents: ComponentMetrics[];
  } {
    const avgLoadTime = this.metrics.reduce((sum, m) => sum + m.loadTime, 0) / this.metrics.length || 0;
    const avgRenderTime = this.metrics.reduce((sum, m) => sum + m.renderTime, 0) / this.metrics.length || 0;
    const avgMemoryUsage = this.metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / this.metrics.length || 0;

    const slowestComponents = Array.from(this.componentMetrics.values())
      .sort((a, b) => b.renderTime - a.renderTime)
      .slice(0, 10);

    return {
      avgLoadTime,
      avgRenderTime,
      avgMemoryUsage,
      slowestComponents
    };
  }

  /**
   * Mark a performance milestone
   */
  public markMilestone(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(name);
      console.log(`📍 Milestone: ${name} at ${performance.now().toFixed(2)}ms`);
    }
  }

  /**
   * Measure time between two milestones
   */
  public measureBetweenMilestones(startMark: string, endMark: string, measureName: string): number {
    if (typeof performance === 'undefined') return 0;

    try {
      performance.measure(measureName, startMark, endMark);
      const measure = performance.getEntriesByName(measureName)[0];
      console.log(`⏱️ ${measureName}: ${measure.duration.toFixed(2)}ms`);
      return measure.duration;
    } catch (error) {
      console.warn('Failed to measure between milestones:', error);
      return 0;
    }
  }

  /**
   * Monitor Core Web Vitals
   */
  public monitorCoreWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Monitor FCP (First Contentful Paint)
    this.observeWebVital('first-contentful-paint', (value) => {
      console.log(`🎨 First Contentful Paint: ${value.toFixed(2)}ms`);
    });

    // Monitor LCP (Largest Contentful Paint)
    this.observeWebVital('largest-contentful-paint', (value) => {
      console.log(`🖼️ Largest Contentful Paint: ${value.toFixed(2)}ms`);
      if (value > 2500) {
        console.warn('⚠️ LCP exceeds good threshold (2.5s)');
      }
    });

    // Monitor CLS (Cumulative Layout Shift)
    this.observeCLS();
  }

  private observeWebVital(entryType: string, callback: (value: number) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          callback(entry.startTime);
        });
      });
      observer.observe({ entryTypes: [entryType] });
      this.observers.push(observer);
    } catch (error) {
      console.warn(`${entryType} observer not supported:`, error);
    }
  }

  private observeCLS(): void {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        console.log(`📐 Cumulative Layout Shift: ${clsValue.toFixed(4)}`);
        if (clsValue > 0.1) {
          console.warn('⚠️ CLS exceeds good threshold (0.1)');
        }
      });
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Layout shift observer not supported:', error);
    }
  }

  /**
   * Clean up observers
   */
  public cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for component performance tracking
export function usePerformanceTracking(componentName: string) {
  const [renderTime, setRenderTime] = React.useState<number>(0);

  React.useEffect(() => {
    const endTracking = performanceMonitor.startComponentRender(componentName);

    return () => {
      const time = endTracking();
      setRenderTime(time);
    };
  }, [componentName]);

  return { renderTime };
}

// Higher-order component for performance tracking
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const WithPerformanceTracking = React.forwardRef<any, P>((props, ref) => {
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Unknown';

    React.useEffect(() => {
      const endTracking = performanceMonitor.startComponentRender(name);
      return endTracking;
    }, [name]);

    return <WrappedComponent {...props} ref={ref} />;
  });

  WithPerformanceTracking.displayName = `withPerformanceTracking(${componentName || WrappedComponent.displayName || WrappedComponent.name})`;

  return WithPerformanceTracking;
}

// Initialize monitoring
if (typeof window !== 'undefined') {
  performanceMonitor.monitorCoreWebVitals();
  performanceMonitor.markMilestone('performance-monitor-initialized');
}

export default performanceMonitor;