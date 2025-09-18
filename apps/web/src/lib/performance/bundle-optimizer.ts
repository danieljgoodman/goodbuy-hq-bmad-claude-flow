/**
 * Bundle Size Optimizer for Professional Questionnaire
 *
 * Comprehensive bundle optimization with tree shaking,
 * code splitting, compression, and intelligent loading strategies
 * Target: <500KB total bundle size with optimal loading performance
 */

// Webpack bundle analyzer integration
interface BundleAnalysis {
  totalSize: number
  gzippedSize: number
  chunks: Array<{
    name: string
    size: number
    files: string[]
  }>
  dependencies: Record<string, number>
  duplicates: string[]
}

// Bundle optimization configuration
const OPTIMIZATION_CONFIG = {
  maxChunkSize: 250 * 1024, // 250KB per chunk
  maxTotalSize: 500 * 1024, // 500KB total
  compressionLevel: 9, // Maximum compression
  treeshakingEnabled: true,
  minimizationEnabled: true,
  enableSplitting: true
}

// Tree shaking utilities
export class TreeShakingOptimizer {
  private usedExports = new Set<string>()
  private importGraph = new Map<string, Set<string>>()

  // Track used exports
  trackUsage(moduleName: string, exportName: string): void {
    const key = `${moduleName}.${exportName}`
    this.usedExports.add(key)

    if (!this.importGraph.has(moduleName)) {
      this.importGraph.set(moduleName, new Set())
    }
    this.importGraph.get(moduleName)!.add(exportName)
  }

  // Get unused exports for removal
  getUnusedExports(moduleName: string, allExports: string[]): string[] {
    const usedExports = this.importGraph.get(moduleName) || new Set()
    return allExports.filter(exp => !usedExports.has(exp))
  }

  // Generate tree shaking report
  generateReport(): string {
    let report = "Tree Shaking Analysis:\n"
    report += `Total tracked modules: ${this.importGraph.size}\n`
    report += `Total used exports: ${this.usedExports.size}\n\n`

    this.importGraph.forEach((exports, module) => {
      report += `${module}: ${exports.size} exports used\n`
    })

    return report
  }
}

// Code splitting strategies
export class CodeSplittingManager {
  private chunks = new Map<string, Set<string>>()
  private priorities = new Map<string, number>()

  // Define chunk boundaries
  defineChunk(chunkName: string, modules: string[], priority: number = 1): void {
    this.chunks.set(chunkName, new Set(modules))
    this.priorities.set(chunkName, priority)
  }

  // Get optimal loading order
  getLoadingOrder(): string[] {
    return Array.from(this.chunks.keys()).sort((a, b) => {
      const priorityA = this.priorities.get(a) || 1
      const priorityB = this.priorities.get(b) || 1
      return priorityB - priorityA // Higher priority first
    })
  }

  // Check if module should be in specific chunk
  shouldIncludeInChunk(moduleName: string, chunkName: string): boolean {
    const chunkModules = this.chunks.get(chunkName)
    return chunkModules ? chunkModules.has(moduleName) : false
  }

  // Optimize chunk sizes
  optimizeChunks(): void {
    // Redistribute modules to keep chunks under size limit
    this.chunks.forEach((modules, chunkName) => {
      if (this.estimateChunkSize(modules) > OPTIMIZATION_CONFIG.maxChunkSize) {
        this.splitLargeChunk(chunkName, modules)
      }
    })
  }

  private estimateChunkSize(modules: Set<string>): number {
    // Rough estimation - would be more accurate with actual file sizes
    return modules.size * 10 * 1024 // 10KB per module estimate
  }

  private splitLargeChunk(chunkName: string, modules: Set<string>): void {
    const moduleArray = Array.from(modules)
    const midpoint = Math.ceil(moduleArray.length / 2)

    const chunk1 = new Set(moduleArray.slice(0, midpoint))
    const chunk2 = new Set(moduleArray.slice(midpoint))

    this.chunks.set(`${chunkName}_1`, chunk1)
    this.chunks.set(`${chunkName}_2`, chunk2)
    this.chunks.delete(chunkName)
  }
}

// Compression utilities
export class CompressionOptimizer {
  // Gzip compression simulation
  static estimateGzipSize(content: string): number {
    // Simplified estimation - real implementation would use zlib
    const originalSize = new Blob([content]).size
    const compressionRatio = 0.3 // Typical 70% reduction
    return Math.round(originalSize * compressionRatio)
  }

  // Brotli compression simulation
  static estimateBrotliSize(content: string): number {
    const originalSize = new Blob([content]).size
    const compressionRatio = 0.25 // Brotli typically 75% reduction
    return Math.round(originalSize * compressionRatio)
  }

  // Choose best compression method
  static getBestCompression(content: string): {
    method: 'gzip' | 'brotli'
    originalSize: number
    compressedSize: number
    ratio: number
  } {
    const originalSize = new Blob([content]).size
    const gzipSize = this.estimateGzipSize(content)
    const brotliSize = this.estimateBrotliSize(content)

    if (brotliSize < gzipSize) {
      return {
        method: 'brotli',
        originalSize,
        compressedSize: brotliSize,
        ratio: brotliSize / originalSize
      }
    } else {
      return {
        method: 'gzip',
        originalSize,
        compressedSize: gzipSize,
        ratio: gzipSize / originalSize
      }
    }
  }
}

// Dynamic import optimization
export class DynamicImportOptimizer {
  private importCache = new Map<string, Promise<any>>()
  private preloadedModules = new Set<string>()
  private importStats = new Map<string, { loadTime: number; size: number }>()

  // Optimized dynamic import with caching
  async optimizedImport<T>(
    importFn: () => Promise<T>,
    moduleName: string,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<T> {
    // Check cache first
    if (this.importCache.has(moduleName)) {
      return this.importCache.get(moduleName) as Promise<T>
    }

    const startTime = performance.now()

    // Create and cache the import promise
    const importPromise = importFn().then(module => {
      const loadTime = performance.now() - startTime
      this.importStats.set(moduleName, {
        loadTime,
        size: this.estimateModuleSize(module)
      })

      console.log(`Module ${moduleName} loaded in ${loadTime.toFixed(2)}ms`)
      return module
    })

    this.importCache.set(moduleName, importPromise)
    return importPromise
  }

  // Preload critical modules
  preloadModule(importFn: () => Promise<any>, moduleName: string): void {
    if (!this.preloadedModules.has(moduleName)) {
      this.optimizedImport(importFn, moduleName, 'high')
      this.preloadedModules.add(moduleName)
    }
  }

  // Get import statistics
  getImportStats(): Record<string, { loadTime: number; size: number }> {
    return Object.fromEntries(this.importStats)
  }

  // Estimate module size
  private estimateModuleSize(module: any): number {
    try {
      const serialized = JSON.stringify(module)
      return new Blob([serialized]).size
    } catch {
      return 0 // Fallback for non-serializable modules
    }
  }

  // Clear cache (useful for testing)
  clearCache(): void {
    this.importCache.clear()
    this.preloadedModules.clear()
    this.importStats.clear()
  }
}

// Bundle analyzer
export class BundleAnalyzer {
  private chunks = new Map<string, number>()
  private dependencies = new Map<string, number>()
  private totalSize = 0

  // Analyze bundle composition
  analyzeBundleComposition(): BundleAnalysis {
    return {
      totalSize: this.totalSize,
      gzippedSize: Math.round(this.totalSize * 0.3), // Estimated
      chunks: Array.from(this.chunks.entries()).map(([name, size]) => ({
        name,
        size,
        files: [`${name}.js`, `${name}.css`] // Estimated
      })),
      dependencies: Object.fromEntries(this.dependencies),
      duplicates: this.findDuplicateDependencies()
    }
  }

  // Add chunk information
  addChunk(name: string, size: number): void {
    this.chunks.set(name, size)
    this.totalSize += size
  }

  // Add dependency information
  addDependency(name: string, size: number): void {
    this.dependencies.set(name, size)
  }

  // Find duplicate dependencies
  private findDuplicateDependencies(): string[] {
    // Simplified - would analyze actual dependency tree
    const duplicates: string[] = []

    // Common duplicates in React apps
    const commonDuplicates = ['react', 'lodash', 'moment', 'axios']
    commonDuplicates.forEach(dep => {
      if (this.dependencies.has(dep) && this.dependencies.has(`${dep}-es`)) {
        duplicates.push(dep)
      }
    })

    return duplicates
  }

  // Generate optimization recommendations
  generateRecommendations(): string[] {
    const recommendations: string[] = []

    if (this.totalSize > OPTIMIZATION_CONFIG.maxTotalSize) {
      recommendations.push(
        `Total bundle size (${Math.round(this.totalSize / 1024)}KB) exceeds target (${Math.round(OPTIMIZATION_CONFIG.maxTotalSize / 1024)}KB)`
      )
    }

    // Check large chunks
    this.chunks.forEach((size, name) => {
      if (size > OPTIMIZATION_CONFIG.maxChunkSize) {
        recommendations.push(
          `Chunk '${name}' (${Math.round(size / 1024)}KB) should be split further`
        )
      }
    })

    // Check for large dependencies
    this.dependencies.forEach((size, name) => {
      if (size > 50 * 1024) { // 50KB threshold
        recommendations.push(
          `Consider alternatives to large dependency '${name}' (${Math.round(size / 1024)}KB)`
        )
      }
    })

    const duplicates = this.findDuplicateDependencies()
    if (duplicates.length > 0) {
      recommendations.push(
        `Remove duplicate dependencies: ${duplicates.join(', ')}`
      )
    }

    return recommendations
  }
}

// Main bundle optimizer
export class BundleOptimizer {
  private treeShaker = new TreeShakingOptimizer()
  private codeSplitter = new CodeSplittingManager()
  private importOptimizer = new DynamicImportOptimizer()
  private analyzer = new BundleAnalyzer()

  constructor() {
    this.setupQuestionnaireOptimization()
  }

  // Setup optimization for questionnaire
  private setupQuestionnaireOptimization(): void {
    // Define critical chunks
    this.codeSplitter.defineChunk('critical', [
      'react',
      'react-dom',
      '@/components/ui/card',
      '@/components/ui/input',
      '@/components/ui/button'
    ], 10)

    this.codeSplitter.defineChunk('questionnaire-core', [
      '@/components/questionnaire/professional/professional-field',
      '@/lib/performance/questionnaire-optimizer',
      '@/lib/cache/questionnaire-cache'
    ], 9)

    this.codeSplitter.defineChunk('sections', [
      '@/components/questionnaire/professional/financial-section',
      '@/components/questionnaire/professional/customer-risk-section'
    ], 8)

    this.codeSplitter.defineChunk('advanced-features', [
      '@/components/questionnaire/professional/virtual-scrolling',
      '@/components/questionnaire/professional/performance-dashboard'
    ], 5)

    this.codeSplitter.defineChunk('utils', [
      'lodash',
      'date-fns',
      'zod'
    ], 3)
  }

  // Optimize bundle with all strategies
  async optimizeBundle(): Promise<{
    originalSize: number
    optimizedSize: number
    savings: number
    recommendations: string[]
  }> {
    console.log('Starting bundle optimization...')

    // Optimize code splitting
    this.codeSplitter.optimizeChunks()

    // Preload critical modules
    this.preloadCriticalModules()

    // Analyze current bundle
    const analysis = this.analyzer.analyzeBundleComposition()
    const recommendations = this.analyzer.generateRecommendations()

    // Calculate potential savings
    const originalSize = analysis.totalSize
    const optimizedSize = analysis.gzippedSize
    const savings = ((originalSize - optimizedSize) / originalSize) * 100

    return {
      originalSize,
      optimizedSize,
      savings,
      recommendations
    }
  }

  // Preload critical modules
  private preloadCriticalModules(): void {
    // Preload most important questionnaire components
    this.importOptimizer.preloadModule(
      () => import('@/components/questionnaire/professional/financial-section'),
      'financial-section'
    )

    this.importOptimizer.preloadModule(
      () => import('@/components/questionnaire/professional/customer-risk-section'),
      'customer-risk-section'
    )
  }

  // Get optimization report
  getOptimizationReport(): string {
    let report = "Bundle Optimization Report\n"
    report += "=" * 40 + "\n\n"

    // Tree shaking report
    report += this.treeShaker.generateReport() + "\n"

    // Code splitting report
    const loadingOrder = this.codeSplitter.getLoadingOrder()
    report += `Chunk Loading Order: ${loadingOrder.join(' → ')}\n\n`

    // Import statistics
    const importStats = this.importOptimizer.getImportStats()
    report += "Import Performance:\n"
    Object.entries(importStats).forEach(([module, stats]) => {
      report += `  ${module}: ${stats.loadTime.toFixed(2)}ms (${Math.round(stats.size / 1024)}KB)\n`
    })

    // Bundle analysis
    const analysis = this.analyzer.analyzeBundleComposition()
    report += `\nTotal Bundle Size: ${Math.round(analysis.totalSize / 1024)}KB\n`
    report += `Gzipped Size: ${Math.round(analysis.gzippedSize / 1024)}KB\n`
    report += `Compression Ratio: ${((1 - analysis.gzippedSize / analysis.totalSize) * 100).toFixed(1)}%\n`

    return report
  }

  // Get optimized import function
  getOptimizedImport() {
    return this.importOptimizer.optimizedImport.bind(this.importOptimizer)
  }

  // Track usage for tree shaking
  trackUsage(moduleName: string, exportName: string): void {
    this.treeShaker.trackUsage(moduleName, exportName)
  }
}

// Global bundle optimizer instance
export const bundleOptimizer = new BundleOptimizer()

// Webpack plugin integration helper
export const createWebpackOptimizationConfig = () => ({
  splitChunks: {
    chunks: 'all',
    maxSize: OPTIMIZATION_CONFIG.maxChunkSize,
    cacheGroups: {
      critical: {
        test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
        name: 'critical',
        priority: 10,
        enforce: true
      },
      questionnaire: {
        test: /[\\/]src[\\/]components[\\/]questionnaire[\\/]/,
        name: 'questionnaire',
        priority: 9,
        enforce: true
      },
      utils: {
        test: /[\\/]node_modules[\\/](lodash|date-fns|zod)[\\/]/,
        name: 'utils',
        priority: 3,
        enforce: true
      }
    }
  },
  minimize: OPTIMIZATION_CONFIG.minimizationEnabled,
  usedExports: OPTIMIZATION_CONFIG.treeshakingEnabled,
  sideEffects: false
})

export default BundleOptimizer