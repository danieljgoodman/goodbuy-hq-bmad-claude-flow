import type { ExportData, ExportHistory } from '@/types/dashboard'

export class ExportService {
  private static instance: ExportService
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com'
      : 'http://localhost:3000'
  }

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService()
    }
    return ExportService.instance
  }

  async exportDashboardData(
    exportData: ExportData, 
    userId: string
  ): Promise<{ downloadUrl: string; filename: string }> {
    try {
      const response = await fetch('/api/v2/dashboard/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...exportData,
          userId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Export failed')
      }

      const result = await response.json()
      return {
        downloadUrl: result.downloadUrl,
        filename: result.filename
      }
    } catch (error) {
      console.error('Export service error:', error)
      throw error
    }
  }

  async getExportHistory(userId: string): Promise<ExportHistory[]> {
    try {
      const response = await fetch(`/api/v2/dashboard/export-history?userId=${userId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch export history')
      }

      const result = await response.json()
      return result.history || []
    } catch (error) {
      console.error('Export history service error:', error)
      throw error
    }
  }

  async deleteExpiredExports(userId: string): Promise<{ deletedCount: number }> {
    try {
      const response = await fetch('/api/v2/dashboard/export-cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Cleanup failed')
      }

      return await response.json()
    } catch (error) {
      console.error('Export cleanup service error:', error)
      throw error
    }
  }

  // Client-side utility methods
  generateFilename(format: 'pdf' | 'csv', prefix = 'dashboard-export'): string {
    const timestamp = new Date().toISOString().split('T')[0]
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    return `${prefix}-${timestamp}-${randomSuffix}.${format}`
  }

  validateExportData(exportData: ExportData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!exportData.evaluations || exportData.evaluations.length === 0) {
      errors.push('No evaluation data provided')
    }

    if (!['pdf', 'csv'].includes(exportData.format)) {
      errors.push('Invalid export format. Must be "pdf" or "csv"')
    }

    if (exportData.evaluations && exportData.evaluations.length > 1000) {
      errors.push('Too many evaluations. Maximum 1000 allowed per export')
    }

    // Estimate file size (rough calculation)
    const estimatedSize = this.estimateFileSize(exportData)
    if (estimatedSize > 50 * 1024 * 1024) { // 50MB limit
      errors.push('Export would exceed 50MB file size limit')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  estimateFileSize(exportData: ExportData): number {
    const baseSize = exportData.evaluations.length * (exportData.format === 'pdf' ? 2048 : 512) // bytes per evaluation
    const chartSize = exportData.includeCharts && exportData.format === 'pdf' 
      ? exportData.evaluations.length * 10240 // 10KB per chart
      : 0
    
    return baseSize + chartSize
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Download utilities
  downloadFile(url: string, filename?: string): void {
    const link = document.createElement('a')
    link.href = url
    if (filename) {
      link.download = filename
    }
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async downloadAsBlob(url: string): Promise<Blob> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to download file')
    }
    return response.blob()
  }

  // Progress tracking for large exports
  private exportProgress = new Map<string, number>()

  setExportProgress(exportId: string, progress: number): void {
    this.exportProgress.set(exportId, Math.max(0, Math.min(100, progress)))
  }

  getExportProgress(exportId: string): number {
    return this.exportProgress.get(exportId) || 0
  }

  clearExportProgress(exportId: string): void {
    this.exportProgress.delete(exportId)
  }

  // Export templates and formatting
  getCSVHeaders(): string[] {
    return [
      'Evaluation ID',
      'Created Date',
      'Status',
      'Business Name',
      'Industry',
      'Annual Revenue',
      'Net Income',
      'Employee Count',
      'Health Score',
      'Financial Health',
      'Operational Health',
      'Market Health',
      'Growth Health',
      'Risk Health',
      'Weighted Valuation',
      'Income Based Valuation',
      'Asset Based Valuation',
      'Market Based Valuation',
      'Confidence Score',
      'Last Updated'
    ]
  }

  formatEvaluationForCSV(evaluation: any): string[] {
    const businessData = evaluation.businessData || evaluation.business_data || {}
    const healthBreakdown = evaluation.healthBreakdown || evaluation.health_breakdown || {}
    const valuations = evaluation.valuations || {}

    return [
      evaluation.id || '',
      evaluation.createdAt || evaluation.created_at || '',
      evaluation.status || '',
      businessData.businessName || businessData.business_name || '',
      businessData.industry || '',
      String(businessData.annualRevenue || businessData.annual_revenue || 0),
      String(businessData.netIncome || businessData.net_income || 0),
      String(businessData.employeeCount || businessData.employee_count || 0),
      String(evaluation.healthScore || evaluation.health_score || 0),
      String(healthBreakdown.financial?.score || 0),
      String(healthBreakdown.operational?.score || 0),
      String(healthBreakdown.market?.score || 0),
      String(healthBreakdown.growth?.score || 0),
      String(healthBreakdown.risk?.score || 0),
      String(typeof valuations.weighted === 'object' ? valuations.weighted?.value || 0 : valuations.weighted || 0),
      String(typeof valuations.income === 'object' ? valuations.income?.value || 0 : valuations.income || 0),
      String(typeof valuations.asset === 'object' ? valuations.asset?.value || 0 : valuations.asset || 0),
      String(typeof valuations.market === 'object' ? valuations.market?.value || 0 : valuations.market || 0),
      String(evaluation.confidenceScore || evaluation.confidence_score || 0),
      evaluation.updatedAt || evaluation.updated_at || evaluation.createdAt || evaluation.created_at || ''
    ]
  }
}

// Export singleton instance
export const exportService = ExportService.getInstance()