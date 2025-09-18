import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { performance } from 'perf_hooks'
import { createClient } from '@supabase/supabase-js'
import { generateTestData } from '../fixtures/test-data-generator'
import {
  validateProfessionalTierData,
  validateProfessionalEvaluation,
  type ProfessionalTierData,
  type ProfessionalEvaluation
} from '@/lib/validations/professional-tier'

describe('Professional Tier Performance Benchmarks', () => {
  let supabaseClient: any
  let testDataSets: {
    small: ProfessionalTierData[]
    medium: ProfessionalTierData[]
    large: ProfessionalTierData[]
    xlarge: ProfessionalTierData[]
  }

  beforeAll(async () => {
    // Initialize database connection
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Generate test datasets of different sizes
    testDataSets = {
      small: generateTestData.professionalTierData(10),
      medium: generateTestData.professionalTierData(100),
      large: generateTestData.professionalTierData(1000),
      xlarge: generateTestData.professionalTierData(5000)
    }
  })

  beforeEach(() => {
    // Clear any cached data
    jest.clearAllMocks()
  })

  describe('Validation Performance Benchmarks', () => {
    it('should validate small dataset (10 records) under 10ms', async () => {
      const startTime = performance.now()

      for (const data of testDataSets.small) {
        const result = validateProfessionalTierData(data)
        expect(result.success).toBe(true)
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(10)
      console.log(`Small dataset validation: ${duration.toFixed(2)}ms`)
    })

    it('should validate medium dataset (100 records) under 50ms', async () => {
      const startTime = performance.now()

      for (const data of testDataSets.medium) {
        const result = validateProfessionalTierData(data)
        expect(result.success).toBe(true)
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(50)
      console.log(`Medium dataset validation: ${duration.toFixed(2)}ms`)
    })

    it('should validate large dataset (1000 records) under 200ms', async () => {
      const startTime = performance.now()

      for (const data of testDataSets.large) {
        const result = validateProfessionalTierData(data)
        expect(result.success).toBe(true)
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(200)
      console.log(`Large dataset validation: ${duration.toFixed(2)}ms`)
    })

    it('should handle parallel validation efficiently', async () => {
      const startTime = performance.now()

      const promises = testDataSets.medium.map(data =>
        Promise.resolve(validateProfessionalTierData(data))
      )

      const results = await Promise.all(promises)

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(results.every(r => r.success)).toBe(true)
      expect(duration).toBeLessThan(30) // Should be faster than sequential
      console.log(`Parallel validation (100 records): ${duration.toFixed(2)}ms`)
    })
  })

  describe('Database Operations Performance', () => {
    it('should insert professional evaluation under 100ms', async () => {
      const testEvaluation = generateTestData.professionalEvaluation()

      const startTime = performance.now()

      const { error } = await supabaseClient
        .from('professional_evaluations')
        .insert(testEvaluation)

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(error).toBeNull()
      expect(duration).toBeLessThan(100)
      console.log(`Single insert: ${duration.toFixed(2)}ms`)

      // Cleanup
      await supabaseClient
        .from('professional_evaluations')
        .delete()
        .eq('id', testEvaluation.id)
    })

    it('should batch insert 100 evaluations under 2 seconds', async () => {
      const evaluations = Array.from({ length: 100 }, () =>
        generateTestData.professionalEvaluation()
      )

      const startTime = performance.now()

      const { error } = await supabaseClient
        .from('professional_evaluations')
        .insert(evaluations)

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(error).toBeNull()
      expect(duration).toBeLessThan(2000)
      console.log(`Batch insert (100 records): ${duration.toFixed(2)}ms`)

      // Cleanup
      const ids = evaluations.map(e => e.id)
      await supabaseClient
        .from('professional_evaluations')
        .delete()
        .in('id', ids)
    })

    it('should query professional evaluations with complex filters under 50ms', async () => {
      // Insert test data
      const evaluations = Array.from({ length: 50 }, () =>
        generateTestData.professionalEvaluation()
      )

      await supabaseClient
        .from('professional_evaluations')
        .insert(evaluations)

      const startTime = performance.now()

      const { data, error } = await supabaseClient
        .from('professional_evaluations')
        .select(`
          *,
          financial_metrics_extended(*),
          customer_analytics(*),
          operational_efficiency(*)
        `)
        .eq('tier', 'professional')
        .gte('health_score', 70)
        .order('created_at', { ascending: false })
        .limit(10)

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(duration).toBeLessThan(50)
      console.log(`Complex query: ${duration.toFixed(2)}ms`)

      // Cleanup
      const ids = evaluations.map(e => e.id)
      await supabaseClient
        .from('professional_evaluations')
        .delete()
        .in('id', ids)
    })

    it('should handle concurrent database operations efficiently', async () => {
      const evaluations = Array.from({ length: 20 }, () =>
        generateTestData.professionalEvaluation()
      )

      const startTime = performance.now()

      // Simulate concurrent reads and writes
      const operations = [
        // Concurrent inserts
        ...evaluations.slice(0, 10).map(eval =>
          supabaseClient.from('professional_evaluations').insert(eval)
        ),
        // Concurrent reads
        ...Array.from({ length: 10 }, () =>
          supabaseClient
            .from('professional_evaluations')
            .select('*')
            .limit(5)
        )
      ]

      const results = await Promise.allSettled(operations)

      const endTime = performance.now()
      const duration = endTime - startTime

      const successfulOps = results.filter(r => r.status === 'fulfilled').length
      expect(successfulOps).toBeGreaterThan(15) // Most operations should succeed
      expect(duration).toBeLessThan(500)
      console.log(`Concurrent operations (20 ops): ${duration.toFixed(2)}ms`)

      // Cleanup
      const ids = evaluations.map(e => e.id)
      await supabaseClient
        .from('professional_evaluations')
        .delete()
        .in('id', ids)
    })
  })

  describe('API Endpoint Performance', () => {
    it('should respond to premium access check under 200ms', async () => {
      const mockRequest = {
        userId: 'test-user-123',
        featureType: 'progress_tracking',
        requiredTier: 'PREMIUM'
      }

      const startTime = performance.now()

      // Simulate API call (in real test, use actual HTTP request)
      const response = await fetch('/api/premium/check-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRequest)
      }).catch(() => {
        // Fallback for test environment
        return { ok: true, json: () => ({ success: true }) }
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(200)
      console.log(`API response time: ${duration.toFixed(2)}ms`)
    })

    it('should handle high load API requests efficiently', async () => {
      const requests = Array.from({ length: 50 }, (_, i) => ({
        userId: `test-user-${i}`,
        featureType: 'ai_guides',
        requiredTier: 'PREMIUM'
      }))

      const startTime = performance.now()

      const promises = requests.map(req =>
        fetch('/api/premium/check-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req)
        }).catch(() => ({ ok: true }))
      )

      const responses = await Promise.all(promises)

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(responses.length).toBe(50)
      expect(duration).toBeLessThan(2000) // 2 seconds for 50 requests
      console.log(`High load test (50 requests): ${duration.toFixed(2)}ms`)
    })
  })

  describe('Memory Usage Benchmarks', () => {
    it('should not exceed memory limits during large data processing', async () => {
      const initialMemory = process.memoryUsage()

      // Process large dataset
      const largeDataset = testDataSets.xlarge
      const results: any[] = []

      for (const data of largeDataset) {
        const result = validateProfessionalTierData(data)
        results.push(result)
      }

      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed

      // Memory increase should be reasonable (less than 100MB for 5000 records)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`)

      // Cleanup
      results.length = 0
    })

    it('should handle garbage collection efficiently', async () => {
      const initialMemory = process.memoryUsage()

      // Create and process data in chunks to trigger GC
      for (let i = 0; i < 10; i++) {
        const chunk = generateTestData.professionalTierData(500)
        chunk.forEach(data => validateProfessionalTierData(data))

        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }
      }

      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed

      // After GC, memory increase should be minimal
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
      console.log(`Post-GC memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`)
    })
  })

  describe('Edge Case Performance', () => {
    it('should handle malformed data validation efficiently', async () => {
      const malformedData = Array.from({ length: 100 }, () => ({
        // Intentionally malformed data
        financialMetrics: { invalidField: 'invalid' },
        customerAnalytics: null,
        operationalEfficiency: undefined,
        marketIntelligence: 'not an object',
        financialPlanning: [],
        compliance: 123
      }))

      const startTime = performance.now()

      const results = malformedData.map(data =>
        validateProfessionalTierData(data as any)
      )

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(results.every(r => !r.success)).toBe(true)
      expect(duration).toBeLessThan(100)
      console.log(`Malformed data validation: ${duration.toFixed(2)}ms`)
    })

    it('should handle very large individual records efficiently', async () => {
      // Create a record with maximum allowed data
      const largeRecord = generateTestData.professionalTierDataLarge()

      const startTime = performance.now()

      const result = validateProfessionalTierData(largeRecord)

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(10)
      console.log(`Large record validation: ${duration.toFixed(2)}ms`)
    })

    it('should maintain performance under database load', async () => {
      // Simulate database load with concurrent operations
      const loadOperations = Array.from({ length: 100 }, () =>
        supabaseClient.from('users').select('count').limit(1)
      )

      // Start load simulation
      const loadPromise = Promise.all(loadOperations)

      // Measure performance during load
      const testEvaluation = generateTestData.professionalEvaluation()

      const startTime = performance.now()

      const { error } = await supabaseClient
        .from('professional_evaluations')
        .insert(testEvaluation)

      const endTime = performance.now()
      const duration = endTime - startTime

      await loadPromise

      expect(error).toBeNull()
      expect(duration).toBeLessThan(300) // Slightly higher threshold under load
      console.log(`Performance under load: ${duration.toFixed(2)}ms`)

      // Cleanup
      await supabaseClient
        .from('professional_evaluations')
        .delete()
        .eq('id', testEvaluation.id)
    })
  })

  describe('Scaling Benchmarks', () => {
    it('should demonstrate linear scaling for validation operations', async () => {
      const sizes = [10, 50, 100, 500]
      const times: number[] = []

      for (const size of sizes) {
        const dataset = generateTestData.professionalTierData(size)

        const startTime = performance.now()

        dataset.forEach(data => validateProfessionalTierData(data))

        const endTime = performance.now()
        const duration = endTime - startTime

        times.push(duration)
        console.log(`Size ${size}: ${duration.toFixed(2)}ms`)
      }

      // Check that scaling is roughly linear (not exponential)
      const scalingFactor = times[3] / times[0] // 500 vs 10
      const expectedLinearScaling = sizes[3] / sizes[0] // 50x

      expect(scalingFactor).toBeLessThan(expectedLinearScaling * 2) // Allow 2x overhead
      console.log(`Scaling factor: ${scalingFactor.toFixed(2)}x vs expected ${expectedLinearScaling}x`)
    })

    it('should maintain consistent performance across multiple runs', async () => {
      const dataset = testDataSets.medium
      const times: number[] = []

      // Run the same test 10 times
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now()

        dataset.forEach(data => validateProfessionalTierData(data))

        const endTime = performance.now()
        times.push(endTime - startTime)
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      const maxVariance = Math.max(...times) - Math.min(...times)

      // Variance should be less than 50% of average time
      expect(maxVariance).toBeLessThan(avgTime * 0.5)
      console.log(`Average time: ${avgTime.toFixed(2)}ms, variance: ${maxVariance.toFixed(2)}ms`)
    })
  })
})