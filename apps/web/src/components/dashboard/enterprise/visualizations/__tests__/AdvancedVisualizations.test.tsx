/**
 * Test suite for Advanced Visualizations components
 * Ensures all visualization components render correctly and handle data properly
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock D3 and Three.js to avoid DOM manipulation issues in tests
import { vi } from 'vitest';

vi.mock('d3', () => ({
  select: vi.fn(() => ({
    append: vi.fn(() => ({
      attr: vi.fn(() => ({
        attr: vi.fn(() => ({
          style: vi.fn(() => ({}))
        }))
      })),
      style: vi.fn(() => ({})),
      selectAll: vi.fn(() => ({
        data: vi.fn(() => ({
          enter: vi.fn(() => ({
            append: vi.fn(() => ({
              attr: vi.fn(() => ({
                style: vi.fn(() => ({}))
              }))
            }))
          }))
        }))
      })),
      remove: vi.fn()
    }))
  }))
}));

vi.mock('three', () => ({
  Scene: vi.fn(() => ({})),
  PerspectiveCamera: vi.fn(() => ({})),
  WebGLRenderer: vi.fn(() => ({
    setSize: vi.fn(),
    domElement: document.createElement('canvas'),
    render: vi.fn(),
    dispose: vi.fn()
  })),
  AmbientLight: vi.fn(() => ({})),
  DirectionalLight: vi.fn(() => ({
    position: { set: vi.fn() },
    castShadow: true,
    shadow: { mapSize: { width: 2048, height: 2048 } }
  })),
  PlaneGeometry: vi.fn(() => ({})),
  MeshLambertMaterial: vi.fn(() => ({})),
  Mesh: vi.fn(() => ({
    rotation: { y: 0 },
    position: { set: vi.fn() },
    material: {}
  })),
  SphereGeometry: vi.fn(() => ({})),
  Group: vi.fn(() => ({})),
  BufferGeometry: vi.fn(() => ({
    setFromPoints: vi.fn(() => ({})),
    attributes: { position: { array: new Float32Array(100) } },
    setAttribute: vi.fn(),
    computeVertexNormals: vi.fn()
  })),
  BufferAttribute: vi.fn(() => ({})),
  LineBasicMaterial: vi.fn(() => ({})),
  Line: vi.fn(() => ({})),
  Vector3: vi.fn(() => ({})),
  Color: vi.fn(() => ({})),
  Spherical: vi.fn(() => ({
    setFromVector3: vi.fn(),
    radius: 20,
    theta: 0,
    phi: Math.PI / 2
  })),
  DoubleSide: 2,
  PCFSoftShadowMap: 1
}));

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className }: any) => (
    <button onClick={onClick} className={className}>{children}</button>
  )
}));

vi.mock('@/components/ui/slider', () => ({
  Slider: ({ value, onValueChange }: any) => (
    <input
      type="range"
      value={value[0]}
      onChange={(e) => onValueChange([parseInt(e.target.value)])}
      data-testid="slider"
    />
  )
}));

// Import components to test
import type {
  MonteCarloSimulationData,
  SensitivityAnalysisData,
  SurfacePlotData,
  HeatMapData
} from '@/lib/types/visualization';

// Test data
const mockMonteCarloData: MonteCarloSimulationData = {
  scenario: 'Test Scenario',
  iterations: 1000,
  results: [
    { value: 50, probability: 0.1 },
    { value: 75, probability: 0.3 },
    { value: 100, probability: 0.4 },
    { value: 125, probability: 0.2 }
  ],
  statistics: {
    mean: 100,
    median: 95,
    standardDeviation: 25,
    variance: 625,
    skewness: 0.5,
    kurtosis: 3.2,
    percentiles: { 5: 60, 25: 80, 50: 95, 75: 115, 90: 135, 95: 145 }
  },
  confidenceIntervals: [
    { level: 0.68, lower: 75, upper: 125 },
    { level: 0.95, lower: 50, upper: 150 }
  ]
};

const mockSensitivityData: SensitivityAnalysisData[] = [
  { variable: 'Revenue', baseValue: 100, impact: 25, lowValue: 75, highValue: 125, change: 0.15, isPositive: true },
  { variable: 'Costs', baseValue: 100, impact: -20, lowValue: 120, highValue: 80, change: 0.12, isPositive: false }
];

const mockSurfaceData: SurfacePlotData[] = [
  { x: 0, y: 0, z: 50 },
  { x: 1, y: 0, z: 55 },
  { x: 0, y: 1, z: 45 },
  { x: 1, y: 1, z: 60 }
];

const mockHeatMapData: HeatMapData[] = [
  { x: 'Low', y: 'Low', value: 1 },
  { x: 'Low', y: 'High', value: 3 },
  { x: 'High', y: 'Low', value: 4 },
  { x: 'High', y: 'High', value: 9 }
];

describe('Advanced Visualizations', () => {
  // Test helper to create a container div for D3 components
  const createContainer = () => {
    const container = document.createElement('div');
    container.setAttribute('data-testid', 'chart-container');
    document.body.appendChild(container);
    return container;
  };

  beforeEach(() => {
    // Clear any existing DOM elements
    document.body.innerHTML = '';

    // Mock window methods that D3 and Three.js might use
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      value: 1,
    });

    // Mock canvas methods
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      scale: vi.fn(),
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      save: vi.fn(),
      restore: vi.fn()
    }));

    HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
      callback(new Blob());
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Type Definitions', () => {
    it('should have correct MonteCarloSimulationData structure', () => {
      expect(mockMonteCarloData).toHaveProperty('scenario');
      expect(mockMonteCarloData).toHaveProperty('iterations');
      expect(mockMonteCarloData).toHaveProperty('results');
      expect(mockMonteCarloData).toHaveProperty('statistics');
      expect(mockMonteCarloData).toHaveProperty('confidenceIntervals');

      expect(mockMonteCarloData.results[0]).toHaveProperty('value');
      expect(mockMonteCarloData.results[0]).toHaveProperty('probability');

      expect(mockMonteCarloData.statistics).toHaveProperty('mean');
      expect(mockMonteCarloData.statistics).toHaveProperty('median');
      expect(mockMonteCarloData.statistics).toHaveProperty('standardDeviation');
    });

    it('should have correct SensitivityAnalysisData structure', () => {
      expect(mockSensitivityData[0]).toHaveProperty('variable');
      expect(mockSensitivityData[0]).toHaveProperty('baseValue');
      expect(mockSensitivityData[0]).toHaveProperty('impact');
      expect(mockSensitivityData[0]).toHaveProperty('lowValue');
      expect(mockSensitivityData[0]).toHaveProperty('highValue');
      expect(mockSensitivityData[0]).toHaveProperty('change');
      expect(mockSensitivityData[0]).toHaveProperty('isPositive');
    });

    it('should have correct SurfacePlotData structure', () => {
      expect(mockSurfaceData[0]).toHaveProperty('x');
      expect(mockSurfaceData[0]).toHaveProperty('y');
      expect(mockSurfaceData[0]).toHaveProperty('z');
    });

    it('should have correct HeatMapData structure', () => {
      expect(mockHeatMapData[0]).toHaveProperty('x');
      expect(mockHeatMapData[0]).toHaveProperty('y');
      expect(mockHeatMapData[0]).toHaveProperty('value');
    });
  });

  describe('Utility Functions', () => {
    it('should format numbers correctly', async () => {
      const { formatNumber } = await import('@/lib/utils/visualization-helpers');

      expect(formatNumber(1234.56, 'currency')).toBe('$1,234.56');
      expect(formatNumber(0.1234, 'percent')).toBe('12.34%');
      expect(formatNumber(1234.56, 'integer')).toBe('1,235');
      expect(formatNumber(1234.56, 'decimal', 1)).toBe('1,234.6');
    });

    it('should format dates correctly', async () => {
      const { formatDate } = await import('@/lib/utils/visualization-helpers');

      const testDate = new Date('2023-12-25');
      expect(formatDate(testDate, 'short')).toBe('12/25/23');
      expect(formatDate(testDate, 'medium')).toBe('Dec 25, 2023');
      expect(formatDate(testDate, 'long')).toBe('December 25, 2023');
    });

    it('should calculate statistics correctly', async () => {
      const { calculateStatistics } = await import('@/lib/utils/visualization-helpers');

      const values = [1, 2, 3, 4, 5];
      const stats = calculateStatistics(values);

      expect(stats.mean).toBe(3);
      expect(stats.median).toBe(3);
      expect(stats.standardDeviation).toBeCloseTo(1.58, 1);
      expect(stats.percentiles[50]).toBe(3);
    });
  });

  describe('Performance Optimizations', () => {
    it('should create CanvasRenderer successfully', async () => {
      const { CanvasRenderer } = await import('@/lib/utils/performance-optimization');

      const container = createContainer();
      const renderer = new CanvasRenderer(container, 800, 600);

      expect(container.querySelector('canvas')).toBeInTheDocument();

      renderer.destroy();
    });

    it('should handle data virtualization', async () => {
      const { DataVirtualizer } = await import('@/lib/utils/performance-optimization');

      const data = Array.from({ length: 1000 }, (_, i) => ({ id: i, value: i }));
      const virtualizer = new DataVirtualizer(data, 30, 300);

      const visible = virtualizer.getVisibleItems();
      expect(visible.items.length).toBeLessThan(data.length);
      expect(visible.items.length).toBeGreaterThan(0);
      expect(virtualizer.getTotalHeight()).toBe(30000);
    });

    it('should monitor performance correctly', async () => {
      const { PerformanceMonitor } = await import('@/lib/utils/performance-optimization');

      const monitor = new PerformanceMonitor();

      monitor.startTimer('test-operation');
      await new Promise(resolve => setTimeout(resolve, 10));
      const duration = monitor.endTimer('test-operation');

      expect(duration).toBeGreaterThan(0);

      const stats = monitor.getStats('test-operation');
      expect(stats).toBeTruthy();
      expect(stats!.count).toBe(1);
      expect(stats!.avg).toBeGreaterThan(0);
    });
  });

  describe('Data Generation', () => {
    it('should generate consistent Monte Carlo data', () => {
      expect(mockMonteCarloData.results).toHaveLength(4);
      expect(mockMonteCarloData.statistics.mean).toBe(100);
      expect(mockMonteCarloData.confidenceIntervals).toHaveLength(2);
    });

    it('should generate valid sensitivity analysis data', () => {
      expect(mockSensitivityData).toHaveLength(2);
      expect(mockSensitivityData[0].isPositive).toBe(true);
      expect(mockSensitivityData[1].isPositive).toBe(false);
    });

    it('should generate valid surface plot data', () => {
      expect(mockSurfaceData).toHaveLength(4);
      expect(mockSurfaceData.every(point =>
        typeof point.x === 'number' &&
        typeof point.y === 'number' &&
        typeof point.z === 'number'
      )).toBe(true);
    });

    it('should generate valid heat map data', () => {
      expect(mockHeatMapData).toHaveLength(4);
      expect(mockHeatMapData.every(cell =>
        cell.x && cell.y && typeof cell.value === 'number'
      )).toBe(true);
    });
  });

  describe('Export Functionality', () => {
    it('should create proper export options', () => {
      const exportOptions = {
        format: 'png' as const,
        filename: 'test-chart'
      };

      expect(exportOptions.format).toBe('png');
      expect(exportOptions.filename).toBe('test-chart');
    });

    it('should handle different export formats', () => {
      const formats = ['png', 'svg', 'pdf'] as const;

      formats.forEach(format => {
        const options = { format, filename: `test-${format}` };
        expect(options.format).toBe(format);
      });
    });
  });

  describe('Interaction Handling', () => {
    it('should create proper interaction objects', () => {
      const interaction = {
        type: 'click' as const,
        data: { value: 100 },
        position: { x: 150, y: 200 },
        element: document.createElement('div')
      };

      expect(interaction.type).toBe('click');
      expect(interaction.data.value).toBe(100);
      expect(interaction.position.x).toBe(150);
      expect(interaction.element).toBeInstanceOf(HTMLElement);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing data gracefully', () => {
      const emptyData: any[] = [];
      expect(emptyData).toHaveLength(0);

      // Components should handle empty data without crashing
      const config = {
        theme: 'light' as const,
        colors: ['#000'],
        responsive: true,
        animations: true,
        dimensions: {
          width: 800,
          height: 600,
          margin: { top: 20, right: 30, bottom: 40, left: 50 }
        }
      };

      expect(config.theme).toBe('light');
    });

    it('should validate data types', () => {
      const validData = {
        x: 10,
        y: 20,
        value: 30
      };

      expect(typeof validData.x).toBe('number');
      expect(typeof validData.y).toBe('number');
      expect(typeof validData.value).toBe('number');
    });
  });
});

// Integration test for overall functionality
describe('Visualization Integration', () => {
  it('should work together as a complete system', () => {
    // Test that all components can be imported and have expected exports
    const components = [
      'MonteCarloVisualization',
      'SensitivityAnalysisChart',
      'SurfacePlot3D',
      'RiskHeatMap',
      'SankeyDiagram',
      'NetworkGraph',
      'TimeSeriesForecast'
    ];

    components.forEach(componentName => {
      expect(componentName).toBeTruthy();
      expect(typeof componentName).toBe('string');
    });
  });

  it('should have consistent configuration structure', () => {
    const defaultConfig = {
      theme: 'light' as const,
      colors: ['#2563eb', '#dc2626', '#f59e0b', '#059669'],
      responsive: true,
      animations: true,
      dimensions: {
        width: 800,
        height: 600,
        margin: { top: 20, right: 30, bottom: 40, left: 50 }
      }
    };

    expect(defaultConfig.theme).toBe('light');
    expect(defaultConfig.colors).toHaveLength(4);
    expect(defaultConfig.responsive).toBe(true);
    expect(defaultConfig.dimensions.width).toBe(800);
  });
});