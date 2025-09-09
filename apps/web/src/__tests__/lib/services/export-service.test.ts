import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exportService } from '@/lib/services/export-service'
import type { ExportData } from '@/types/dashboard'

// Mock fetch
global.fetch = vi.fn()

const mockEvaluations = [
  {
    id: '1',
    createdAt: '2024-01-01T00:00:00Z',
    status: 'completed',
    healthScore: 85,
    businessData: {
      businessName: 'Test Business',
      annualRevenue: 1000000,
      netIncome: 100000
    },
    valuations: {
      weighted: { value: 5000000 }
    }
  }
]

const mockExportData: ExportData = {
  evaluations: mockEvaluations,
  filters: {
    dateRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-12-31')
    },
    businessCategories: [],
    evaluationTypes: ['completed']
  },
  generatedAt: new Date(),
  format: 'csv',
  includeCharts: false
}

describe('ExportService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should be a singleton', () => {
    const instance1 = exportService
    const instance2 = exportService
    expect(instance1).toBe(instance2)
  })

  describe('exportDashboardData', () => {
    it('should successfully export data', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          downloadUrl: 'https://example.com/export.csv',
          filename: 'dashboard-export-2024-01-01.csv'
        })
      }

      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any)

      const result = await exportService.exportDashboardData(mockExportData, 'user123')

      expect(fetch).toHaveBeenCalledWith('/api/v2/dashboard/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...mockExportData,
          userId: 'user123'
        })
      })

      expect(result).toEqual({
        downloadUrl: 'https://example.com/export.csv',
        filename: 'dashboard-export-2024-01-01.csv'
      })
    })

    it('should throw error on failed export', async () => {
      const mockResponse = {
        ok: false,
        json: () => Promise.resolve({
          error: 'Export failed'
        })
      }

      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any)

      await expect(
        exportService.exportDashboardData(mockExportData, 'user123')
      ).rejects.toThrow('Export failed')
    })
  })

  describe('validateExportData', () => {
    it('should validate valid export data', () => {
      const result = exportService.validateExportData(mockExportData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty evaluation data', () => {
      const invalidData = { ...mockExportData, evaluations: [] }
      const result = exportService.validateExportData(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('No evaluation data provided')
    })

    it('should reject invalid format', () => {
      const invalidData = { ...mockExportData, format: 'xlsx' as any }
      const result = exportService.validateExportData(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid export format. Must be "pdf" or "csv"')
    })

    it('should reject too many evaluations', () => {
      const largeEvaluations = Array(1001).fill(mockEvaluations[0])
      const invalidData = { ...mockExportData, evaluations: largeEvaluations }
      const result = exportService.validateExportData(invalidData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Too many evaluations. Maximum 1000 allowed per export')
    })
  })

  describe('generateFilename', () => {
    it('should generate filename with correct format', () => {
      const filename = exportService.generateFilename('pdf')
      expect(filename).toMatch(/^dashboard-export-\d{4}-\d{2}-\d{2}-[a-z0-9]{6}\.pdf$/)
    })

    it('should use custom prefix', () => {
      const filename = exportService.generateFilename('csv', 'custom-export')
      expect(filename).toMatch(/^custom-export-\d{4}-\d{2}-\d{2}-[a-z0-9]{6}\.csv$/)
    })
  })

  describe('estimateFileSize', () => {
    it('should estimate CSV file size correctly', () => {
      const size = exportService.estimateFileSize(mockExportData)
      expect(size).toBeGreaterThan(0)
      expect(size).toBe(512) // 1 evaluation * 512 bytes for CSV
    })

    it('should estimate PDF file size with charts', () => {
      const pdfData = { 
        ...mockExportData, 
        format: 'pdf' as const, 
        includeCharts: true 
      }
      const size = exportService.estimateFileSize(pdfData)
      expect(size).toBe(12288) // (2048 base + 10240 chart) * 1 evaluation
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(exportService.formatFileSize(0)).toBe('0 Bytes')
      expect(exportService.formatFileSize(1024)).toBe('1 KB')
      expect(exportService.formatFileSize(1048576)).toBe('1 MB')
      expect(exportService.formatFileSize(1073741824)).toBe('1 GB')
    })

    it('should handle decimal values', () => {
      expect(exportService.formatFileSize(1536)).toBe('1.5 KB')
      expect(exportService.formatFileSize(2621440)).toBe('2.5 MB')
    })
  })

  describe('getCSVHeaders', () => {
    it('should return correct CSV headers', () => {
      const headers = exportService.getCSVHeaders()
      expect(headers).toContain('Evaluation ID')
      expect(headers).toContain('Health Score')
      expect(headers).toContain('Weighted Valuation')
      expect(headers).toHaveLength(20) // Verify we have all expected headers
    })
  })

  describe('formatEvaluationForCSV', () => {
    it('should format evaluation data for CSV correctly', () => {
      const csvRow = exportService.formatEvaluationForCSV(mockEvaluations[0])
      
      expect(csvRow).toHaveLength(20) // Should match headers length
      expect(csvRow[0]).toBe('1') // ID
      expect(csvRow[2]).toBe('completed') // Status
      expect(csvRow[8]).toBe('85') // Health Score
      expect(csvRow[15]).toBe('5000000') // Weighted Valuation
    })

    it('should handle missing data gracefully', () => {
      const incompleteEvaluation = { id: '2', status: 'processing' }
      const csvRow = exportService.formatEvaluationForCSV(incompleteEvaluation)
      
      expect(csvRow).toHaveLength(20)
      expect(csvRow[0]).toBe('2')
      expect(csvRow[1]).toBe('') // Missing createdAt
      expect(csvRow[8]).toBe('0') // Missing healthScore defaults to 0
    })
  })

  describe('progress tracking', () => {
    it('should track export progress correctly', () => {
      const exportId = 'test-export-123'
      
      exportService.setExportProgress(exportId, 50)
      expect(exportService.getExportProgress(exportId)).toBe(50)
      
      exportService.setExportProgress(exportId, 100)
      expect(exportService.getExportProgress(exportId)).toBe(100)
      
      exportService.clearExportProgress(exportId)
      expect(exportService.getExportProgress(exportId)).toBe(0)
    })

    it('should clamp progress values', () => {
      const exportId = 'test-export-456'
      
      exportService.setExportProgress(exportId, -10)
      expect(exportService.getExportProgress(exportId)).toBe(0)
      
      exportService.setExportProgress(exportId, 150)
      expect(exportService.getExportProgress(exportId)).toBe(100)
    })
  })
})