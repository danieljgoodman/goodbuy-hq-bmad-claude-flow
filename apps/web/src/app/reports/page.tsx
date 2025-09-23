'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ProfessionalReportModal } from '@/components/premium/reports/ProfessionalReportModal'
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
  const { user, isLoaded } = useUser()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [reportHistory, setReportHistory] = useState<ReportHistory[]>([])
  const [loading, setLoading] = useState(true)

  const checkAccess = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      // Basic tier users have access to basic reports
      // Professional and Enterprise get enhanced features
      setHasAccess(true) // All authenticated users can access reports page
    } catch (error) {
      console.error('Error checking access:', error)
      setHasAccess(false)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const loadReportHistory = useCallback(async () => {
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
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      checkAccess()
      loadReportHistory()
    }
  }, [user?.id, checkAccess, loadReportHistory])

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

  if (!isLoaded || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-3 text-lg">Loading reports...</span>
        </div>
      </div>
    )
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


  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center space-x-2">
            <FileText className="h-8 w-8 text-blue-600" />
            <span>Business Reports</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Create comprehensive reports for your business evaluation
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