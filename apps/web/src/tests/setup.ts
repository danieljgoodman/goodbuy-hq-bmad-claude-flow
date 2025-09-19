import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

// Establish API mocking before all tests
beforeAll(() => server.listen())

// Clean up after each test case
afterEach(() => {
  cleanup()
  server.resetHandlers()
})

// Clean up after all tests are done
afterAll(() => server.close())

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock scrollIntoView
Element.prototype.scrollIntoView = () => {}

// Mock performance.now for consistent timing tests
const mockPerformanceNow = (() => {
  let now = 0
  return () => {
    now += 16.67 // Simulate 60fps
    return now
  }
})()

Object.defineProperty(global.performance, 'now', {
  writable: true,
  value: mockPerformanceNow
})

// Mock Canvas for chart rendering
HTMLCanvasElement.prototype.getContext = () => ({
  fillRect: () => {},
  clearRect: () => {},
  getImageData: () => ({ data: new Array(4) }),
  putImageData: () => {},
  createImageData: () => [],
  setTransform: () => {},
  drawImage: () => {},
  save: () => {},
  fillText: () => {},
  restore: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  closePath: () => {},
  stroke: () => {},
  translate: () => {},
  scale: () => {},
  rotate: () => {},
  arc: () => {},
  fill: () => {},
  measureText: () => ({ width: 0 }),
  transform: () => {},
  rect: () => {},
  clip: () => {},
})

// Mock chart.js
if (typeof vi !== 'undefined') {
  vi.mock('chart.js', () => ({
    Chart: class Chart {
      constructor() {}
      destroy() {}
      update() {}
      render() {}
    },
    registerables: []
  }))
}

// Mock recharts for SSR compatibility
if (typeof vi !== 'undefined') {
  vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => children,
    LineChart: ({ children }: { children: React.ReactNode }) => null,
    BarChart: ({ children }: { children: React.ReactNode }) => null,
    AreaChart: ({ children }: { children: React.ReactNode }) => null,
    RadarChart: ({ children }: { children: React.ReactNode }) => null,
    PieChart: ({ children }: { children: React.ReactNode }) => null,
    ScatterChart: ({ children }: { children: React.ReactNode }) => null,
    RadialBarChart: ({ children }: { children: React.ReactNode }) => null,
    Line: () => null,
    Bar: () => null,
    Area: () => null,
    Radar: () => null,
    Pie: () => null,
    Scatter: () => null,
    RadialBar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
    PolarGrid: () => null,
    PolarAngleAxis: () => null,
    PolarRadiusAxis: () => null,
    ReferenceLine: () => null,
    Cell: () => null
  }))
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (typeof vi !== 'undefined' ? vi.fn() : jest.fn()).mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: (typeof vi !== 'undefined' ? vi.fn() : jest.fn()), // deprecated
    removeListener: (typeof vi !== 'undefined' ? vi.fn() : jest.fn()), // deprecated
    addEventListener: (typeof vi !== 'undefined' ? vi.fn() : jest.fn()),
    removeEventListener: (typeof vi !== 'undefined' ? vi.fn() : jest.fn()),
    dispatchEvent: (typeof vi !== 'undefined' ? vi.fn() : jest.fn()),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: (typeof vi !== 'undefined' ? vi.fn() : jest.fn()),
  setItem: (typeof vi !== 'undefined' ? vi.fn() : jest.fn()),
  removeItem: (typeof vi !== 'undefined' ? vi.fn() : jest.fn()),
  clear: (typeof vi !== 'undefined' ? vi.fn() : jest.fn()),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: (typeof vi !== 'undefined' ? vi.fn() : jest.fn()),
  setItem: (typeof vi !== 'undefined' ? vi.fn() : jest.fn()),
  removeItem: (typeof vi !== 'undefined' ? vi.fn() : jest.fn()),
  clear: (typeof vi !== 'undefined' ? vi.fn() : jest.fn()),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
})