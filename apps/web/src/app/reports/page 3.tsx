'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ProfessionalReportModal } from '@/components/premium/reports/ProfessionalReportModal'
import { useAuth } from '@/lib/hooks/useAuth'
import { 
  FileText, 
  Crown, 
  Download, 
  Calendar,
  Users,
  TrendingUp,
  AlertTriangle,
  Loader2,
  Plus,
  Award
} from 'lucide-react'
import Link from 'next/link'

interface ReportHistory {
  id: string
  title: string
  reportType: string
  generatedAt: string
  fileUrl: string
  pageCount: number
  fileSize: number
}

export default function ReportsPage() {
  const { user } = useAuth()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [reportHistory, setReportHistory] = useState<ReportHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      checkAccess()
      loadReportHistory()
    }
  }, [user?.id])

  const checkAccess = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      // Check premium access using proper service
      const response = await fetch('/api/premium/check-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          featureType: 'pdf_reports',
          requiredTier: 'PREMIUM'
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        setHasAccess(result.hasAccess)
      } else {
        setHasAccess(false)
      }
    } catch (error) {
      console.error('Error checking access:', error)
      setHasAccess(false)
    } finally {
      setLoading(false)
    }
  }

  const loadReportHistory = async () => {
    if (!user?.id) return

    try {
      // Load report history from API
      const response = await fetch('/api/reports/history')
      if (response.ok) {
        const history = await response.json()
        setReportHistory(history)
      } else {
        setReportHistory([])
      }
    } catch (error) {
      console.error('Error loading report history:', error)
      setReportHistory([])
    }
  }

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'executive': return <Award className="h-4 w-4" />
      case 'investor': return <TrendingUp className="h-4 w-4" />
      case 'comprehensive': return <FileText className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getReportTypeBadge = (type: string) => {
    switch (type) {
      case 'executive': return 'Executive'
      case 'investor': return 'Investor'
      case 'comprehensive': return 'Comprehensive'
      case 'custom': return 'Custom'
      default: return type
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-600">Please sign in to access professional reports.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-3 text-lg">Loading reports...</span>
        </div>
      </div>
    )
  }

  if (hasAccess === false) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Professional Reports</h1>
          <p className="text-lg text-muted-foreground">
            Create comprehensive, branded PDF reports for stakeholders and investors
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <Crown className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Premium Feature</h3>
            <p className="text-gray-600 mb-6">
              Professional PDF reports with AI insights are available with a premium subscription.
            </p>
            
            <div className="max-w-2xl mx-auto space-y-6">
              <Alert>
                <Crown className="h-4 w-4" />
                <AlertDescription>
                  <strong>Professional Reports include:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>AI-generated executive summaries with key insights</li>
                    <li>Comprehensive improvement tracking and ROI analysis</li>
                    <li>Professional charts and visualizations</li>
                    <li>Multiple templates for different audiences (investors, executives)</li>
                    <li>Customizable sections and branding</li>
                    <li>Export-ready PDF format with professional styling</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Award className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-medium mb-1">Executive Reports</h4>
                    <p className="text-sm text-muted-foreground">
                      High-level summaries for leadership
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-medium mb-1">Investor Reports</h4>
                    <p className="text-sm text-muted-foreground">
                      Comprehensive analysis for stakeholders
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 text-center">
                    <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-medium mb-1">Custom Reports</h4>
                    <p className="text-sm text-muted-foreground">
                      Tailored reports for any audience
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Link href="/subscription">
                <Button size="lg" className="w-full">
                  <Crown className="h-5 w-5 mr-2" />
                  Upgrade to Premium
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center space-x-2">
            <Crown className="h-8 w-8 text-yellow-600" />
            <span>Professional Reports</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Create comprehensive, branded PDF reports with AI-powered insights
          </p>
        </div>

        <ProfessionalReportModal 
          userId={user.id}
          trigger={
            <Button size="lg" className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Create Report</span>
            </Button>
          }
        />
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-blue-600" />
              <span>AI-Powered Insights</span>
            </CardTitle>
            <CardDescription>
              Automatically generated executive summaries and strategic recommendations
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>Advanced Analytics</span>
            </CardTitle>
            <CardDescription>
              Statistical trend analysis, forecasting, and ROI calculations
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <span>Multiple Templates</span>
            </CardTitle>
            <CardDescription>
              Professional templates tailored for executives, investors, and stakeholders
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Report History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Report History</span>
          </CardTitle>
          <CardDescription>
            View and download your previously generated reports
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {reportHistory.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first professional report to get started.
              </p>
              <ProfessionalReportModal 
                userId={user.id}
                trigger={
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Report
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="space-y-4">
              {reportHistory.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getReportTypeIcon(report.reportType)}
                    <div>
                      <h4 className="font-medium">{report.title}</h4>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(report.generatedAt).toLocaleDateString()}</span>
                        </span>
                        <span>{report.pageCount} pages</span>
                        <span>{formatFileSize(report.fileSize)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      {getReportTypeBadge(report.reportType)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(report.fileUrl, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}