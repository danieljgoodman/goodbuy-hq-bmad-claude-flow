'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileText, 
  Download, 
  Settings, 
  Eye,
  Users,
  TrendingUp,
  PieChart,
  CheckCircle,
  Loader2,
  AlertCircle,
  Crown
} from 'lucide-react'

interface ProfessionalReportModalProps {
  userId: string
  trigger?: React.ReactNode
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  audience: string
  sections: string[]
  defaultSettings: any
}

interface ReportPreview {
  title: string
  sections: any[]
  estimatedPages: number
  generationTime: string
}

export function ProfessionalReportModal({ userId, trigger }: ProfessionalReportModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'template' | 'customize' | 'preview' | 'generating'>('template')
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [reportTitle, setReportTitle] = useState('')
  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const [includeExecutiveSummary, setIncludeExecutiveSummary] = useState(true)
  const [preview, setPreview] = useState<ReportPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedReport, setGeneratedReport] = useState<any>(null)

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      
      // Fallback templates - in production these would come from API
      const fallbackTemplates: ReportTemplate[] = [
        {
          id: 'executive',
          name: 'Executive Summary',
          description: 'Concise overview for leadership and decision makers',
          audience: 'C-Suite Executives',
          sections: ['executiveSummary', 'valuation', 'keyInsights', 'recommendations'],
          defaultSettings: {
            includeCharts: true,
            includeMetrics: true,
            pageCount: '3-5 pages'
          }
        },
        {
          id: 'investor',
          name: 'Investor Presentation',
          description: 'Professional investor-ready comprehensive report',
          audience: 'Investors & Stakeholders',
          sections: ['executiveSummary', 'valuation', 'marketAnalysis', 'financials', 'opportunities', 'risks'],
          defaultSettings: {
            includeCharts: true,
            includeMetrics: true,
            pageCount: '8-12 pages'
          }
        },
        {
          id: 'comprehensive',
          name: 'Comprehensive Analysis',
          description: 'Full detailed business analysis with all available insights',
          audience: 'Business Analysts',
          sections: ['executiveSummary', 'valuation', 'healthAnalysis', 'marketAnalysis', 'opportunities', 'implementation', 'appendices'],
          defaultSettings: {
            includeCharts: true,
            includeMetrics: true,
            pageCount: '15-20 pages'
          }
        },
        {
          id: 'custom',
          name: 'Custom Report',
          description: 'Fully customizable template with your selected sections',
          audience: 'Custom Audience',
          sections: ['custom'],
          defaultSettings: {
            includeCharts: true,
            includeMetrics: true,
            pageCount: 'Variable'
          }
        }
      ]

      // Try to fetch from API first, fall back to static templates
      try {
        const response = await fetch('/api/reports/templates')
        if (response.ok) {
          const data = await response.json()
          setTemplates(data.templates || fallbackTemplates)
        } else {
          throw new Error('API not available')
        }
      } catch (apiError) {
        console.log('Using fallback templates - API not available')
        setTemplates(fallbackTemplates)
      }
      
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load templates'
      setError(errorMessage)
      console.error('Error loading templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template)
    setReportTitle(`${template.name} - ${new Date().toLocaleDateString()}`)
    setSelectedSections(template.sections)
    setStep('customize')
  }

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const generatePreview = async () => {
    if (!selectedTemplate) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/reports/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          reportType: selectedTemplate.id,
          sections: selectedSections
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate preview')
      }

      setPreview(data.preview)
      setStep('preview')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate preview'
      setError(errorMessage)
      console.error('Error generating preview:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    if (!selectedTemplate) return

    try {
      setStep('generating')
      setLoading(true)
      setError(null)

      const response = await fetch('/api/reports/professional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          reportType: selectedTemplate.id,
          title: reportTitle,
          sections: selectedSections,
          includeExecutiveSummary
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Premium subscription required for professional reports')
        }
        throw new Error(data.error || 'Failed to generate report')
      }

      setGeneratedReport(data.report)
      // Auto-download the report
      window.open(data.report.fileUrl, '_blank')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate report'
      setError(errorMessage)
      console.error('Error generating report:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetModal = () => {
    setStep('template')
    setSelectedTemplate(null)
    setReportTitle('')
    setSelectedSections([])
    setPreview(null)
    setGeneratedReport(null)
    setError(null)
  }

  const getSectionIcon = (sectionType: string) => {
    switch (sectionType) {
      case 'summary': return <FileText className="h-4 w-4" />
      case 'trends': return <TrendingUp className="h-4 w-4" />
      case 'improvements': return <CheckCircle className="h-4 w-4" />
      case 'charts': return <PieChart className="h-4 w-4" />
      case 'recommendations': return <Settings className="h-4 w-4" />
      case 'appendix': return <FileText className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getSectionTitle = (sectionType: string) => {
    switch (sectionType) {
      case 'summary': return 'Business Overview'
      case 'trends': return 'Performance Trends'
      case 'improvements': return 'Improvement Tracking'
      case 'charts': return 'Key Performance Charts'
      case 'recommendations': return 'Strategic Recommendations'
      case 'appendix': return 'Data Appendix'
      default: return sectionType
    }
  }

  const getSectionDescription = (sectionType: string) => {
    switch (sectionType) {
      case 'summary': return 'Business overview with key metrics and current status'
      case 'trends': return 'Statistical trend analysis with confidence intervals'
      case 'improvements': return 'Progress tracking and value impact analysis'
      case 'charts': return 'Professional charts and visualizations'
      case 'recommendations': return 'AI-powered strategic recommendations'
      case 'appendix': return 'Supporting data and methodology'
      default: return 'Report section content'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) resetModal()
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center space-x-2">
            <Crown className="h-4 w-4" />
            <span>Professional Report</span>
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            <span>Generate Professional Report</span>
          </DialogTitle>
          <DialogDescription>
            Create comprehensive, branded PDF reports for stakeholders and investors
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'template' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Select Report Template</h3>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading templates...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <Card 
                      key={template.id} 
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">{template.name}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {template.description}
                            </p>
                            <div className="flex items-center space-x-2 mb-3">
                              <Badge variant="outline" className="text-xs">
                                {template.audience}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {template.sections.length} sections
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Includes: {template.sections.slice(0, 3).join(', ')}
                              {template.sections.length > 3 && '...'}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'customize' && selectedTemplate && (
          <div className="space-y-6">
            <div>
              <Button 
                variant="ghost" 
                onClick={() => setStep('template')}
                className="mb-4"
              >
                ← Back to Templates
              </Button>
              
              <h3 className="text-lg font-medium mb-4">Customize Your Report</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Report Title</label>
                  <Input
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="Enter report title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Report Sections ({selectedSections.length} selected)
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {['summary', 'trends', 'improvements', 'charts', 'recommendations', 'appendix'].map((sectionType) => (
                      <Card 
                        key={sectionType}
                        className={`cursor-pointer transition-colors ${
                          selectedSections.includes(sectionType) 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleSectionToggle(sectionType)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {getSectionIcon(sectionType)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{getSectionTitle(sectionType)}</h4>
                                {selectedSections.includes(sectionType) && (
                                  <CheckCircle className="h-5 w-5 text-blue-600" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {getSectionDescription(sectionType)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="executive-summary"
                    checked={includeExecutiveSummary}
                    onChange={(e) => setIncludeExecutiveSummary(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="executive-summary" className="text-sm font-medium">
                    Include AI-Generated Executive Summary
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={generatePreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview Report
              </Button>
              <Button onClick={generateReport} disabled={selectedSections.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && preview && (
          <div className="space-y-6">
            <div>
              <Button 
                variant="ghost" 
                onClick={() => setStep('customize')}
                className="mb-4"
              >
                ← Back to Customize
              </Button>
              
              <h3 className="text-lg font-medium mb-4">Report Preview</h3>
              
              <Card>
                <CardHeader>
                  <CardTitle>{preview.title}</CardTitle>
                  <CardDescription>
                    {preview.estimatedPages} pages • Generated in approximately {preview.generationTime}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-3">Report Contents:</h4>
                      <div className="space-y-2">
                        {includeExecutiveSummary && (
                          <div className="flex items-center space-x-2 text-sm">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span>Executive Summary (AI-Generated)</span>
                          </div>
                        )}
                        {preview.sections.map((section, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            {getSectionIcon(section.type)}
                            <span>{section.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        This is a preview of your report structure. The actual report will contain your real business data and insights.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setStep('customize')}>
                Modify Report
              </Button>
              <Button onClick={generateReport} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'generating' && (
          <div className="space-y-6">
            <div className="text-center py-12">
              {generatedReport ? (
                <>
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium mb-2">Report Generated Successfully!</h3>
                  <p className="text-muted-foreground mb-6">
                    Your professional report has been created and should download automatically.
                  </p>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <div>Report: {generatedReport.title}</div>
                      <div>Pages: {generatedReport.metadata.pageCount}</div>
                      <div>Size: {(generatedReport.metadata.fileSize / 1024 / 1024).toFixed(1)} MB</div>
                    </div>
                    <div className="flex justify-center space-x-3">
                      <Button onClick={() => window.open(generatedReport.fileUrl, '_blank')}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Again
                      </Button>
                      <Button variant="outline" onClick={() => setIsOpen(false)}>
                        Close
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4" />
                  <h3 className="text-xl font-medium mb-2">Generating Your Report</h3>
                  <p className="text-muted-foreground">
                    Please wait while we create your professional report with AI insights...
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ProfessionalReportModal