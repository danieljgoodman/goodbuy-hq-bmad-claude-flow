'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Download, FileText, FileSpreadsheet, Image, Settings, Check, AlertCircle } from 'lucide-react'
import type { DashboardFilters, ExportData } from '@/types/dashboard'
import type { BusinessEvaluation } from '@/types'

interface ExportModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  evaluations: BusinessEvaluation[]
  filters: DashboardFilters
  onExport: (exportData: ExportData) => Promise<string> // Returns download URL
}

interface ExportOptions {
  format: 'pdf' | 'csv'
  includeCharts: boolean
  includeMetrics: boolean
  includeComparisons: boolean
  dateRange: 'filtered' | 'all'
  evaluationStatus: 'filtered' | 'all'
}

const DEFAULT_OPTIONS: ExportOptions = {
  format: 'pdf',
  includeCharts: true,
  includeMetrics: true,
  includeComparisons: false,
  dateRange: 'filtered',
  evaluationStatus: 'filtered'
}

export default function ExportModal({
  isOpen,
  onOpenChange,
  evaluations,
  filters,
  onExport
}: ExportModalProps) {
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_OPTIONS)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filteredEvaluations = evaluations.filter(evaluation => {
    // Apply date range filter
    if (options.dateRange === 'filtered') {
      const evalDate = new Date(evaluation.createdAt)
      if (evalDate < filters.dateRange.start || evalDate > filters.dateRange.end) {
        return false
      }
    }

    // Apply status filter
    if (options.evaluationStatus === 'filtered') {
      if (!filters.evaluationTypes.includes(evaluation.status)) {
        return false
      }
    }

    return true
  })

  const estimatedFileSize = () => {
    const baseSize = filteredEvaluations.length * (options.format === 'pdf' ? 50 : 5) // KB per evaluation
    const chartsSize = options.includeCharts ? filteredEvaluations.length * 100 : 0 // KB for charts
    return baseSize + chartsSize
  }

  const handleExport = async () => {
    setIsExporting(true)
    setError(null)
    setExportProgress(0)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const exportData: ExportData = {
        evaluations: filteredEvaluations,
        filters,
        generatedAt: new Date(),
        format: options.format,
        includeCharts: options.includeCharts
      }

      const url = await onExport(exportData)
      
      clearInterval(progressInterval)
      setExportProgress(100)
      setDownloadUrl(url)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank')
      setDownloadUrl(null)
      onOpenChange(false)
    }
  }

  const resetModal = () => {
    setOptions(DEFAULT_OPTIONS)
    setIsExporting(false)
    setExportProgress(0)
    setDownloadUrl(null)
    setError(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if (!open) resetModal(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Export Dashboard Data
          </DialogTitle>
          <DialogDescription>
            Export your business evaluation data and analytics for external analysis or reporting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <h3 className="font-medium mb-3">Export Format</h3>
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-colors ${options.format === 'pdf' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setOptions({ ...options, format: 'pdf' })}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-red-600" />
                    <div>
                      <div className="font-medium">PDF Report</div>
                      <div className="text-xs text-muted-foreground">
                        Professional report with charts
                      </div>
                    </div>
                    {options.format === 'pdf' && <Check className="h-4 w-4 text-primary ml-auto" />}
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-colors ${options.format === 'csv' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setOptions({ ...options, format: 'csv' })}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="font-medium">CSV Data</div>
                      <div className="text-xs text-muted-foreground">
                        Raw data for analysis
                      </div>
                    </div>
                    {options.format === 'csv' && <Check className="h-4 w-4 text-primary ml-auto" />}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Content Options */}
          <div>
            <h3 className="font-medium mb-3">Content Options</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.includeMetrics}
                  onChange={(e) => setOptions({ ...options, includeMetrics: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Include KPI metrics and scores</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.includeCharts}
                  onChange={(e) => setOptions({ ...options, includeCharts: e.target.checked })}
                  className="rounded"
                  disabled={options.format === 'csv'}
                />
                <span className="text-sm">Include charts and visualizations (PDF only)</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.includeComparisons}
                  onChange={(e) => setOptions({ ...options, includeComparisons: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Include comparison analysis</span>
              </label>
            </div>
          </div>

          {/* Filter Options */}
          <div>
            <h3 className="font-medium mb-3">Data Range</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="dateRange"
                  checked={options.dateRange === 'filtered'}
                  onChange={() => setOptions({ ...options, dateRange: 'filtered' })}
                />
                <span className="text-sm">Use current date filter ({filters.customTimeframe?.label || 'Custom range'})</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="dateRange"
                  checked={options.dateRange === 'all'}
                  onChange={() => setOptions({ ...options, dateRange: 'all' })}
                />
                <span className="text-sm">Include all evaluations (ignore date filter)</span>
              </label>
            </div>
          </div>

          {/* Export Preview */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Export Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Evaluations:</span>
                <span className="ml-2 font-medium">{filteredEvaluations.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Format:</span>
                <span className="ml-2 font-medium uppercase">{options.format}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Est. Size:</span>
                <span className="ml-2 font-medium">{estimatedFileSize()} KB</span>
              </div>
              <div>
                <span className="text-muted-foreground">Charts:</span>
                <span className="ml-2 font-medium">{options.includeCharts ? 'Yes' : 'No'}</span>
              </div>
            </div>
            
            {filteredEvaluations.length === 0 && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                No evaluations match the current filters. Consider adjusting your filter settings.
              </div>
            )}
          </div>

          {/* Export Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Generating export...</span>
                <span>{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="h-2" />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              {error}
            </div>
          )}

          {/* Success State */}
          {downloadUrl && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-green-700 font-medium">Export ready for download</span>
                </div>
                <Button onClick={handleDownload} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={isExporting || filteredEvaluations.length === 0 || !!downloadUrl}
            >
              {isExporting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export {options.format.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}