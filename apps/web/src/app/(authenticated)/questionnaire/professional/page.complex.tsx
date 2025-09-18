"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Save, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProfessionalTierData } from '@/types/evaluation'

// Import section components
import ProgressTracker from '@/components/questionnaire/professional/progress-tracker'
import FinancialSection from '@/components/questionnaire/professional/financial-section'
import CustomerRiskSection from '@/components/questionnaire/professional/customer-risk-section'
import CompetitiveMarketSection from '@/components/questionnaire/professional/competitive-market-section'
import OperationalStrategicSection from '@/components/questionnaire/professional/operational-strategic-section'
import ValueEnhancementSection from '@/components/questionnaire/professional/value-enhancement-section'

interface Section {
  id: string
  title: string
  fields: number
  component: React.ComponentType<any>
}

const sections: Section[] = [
  {
    id: 'financial',
    title: 'Enhanced Financial Metrics',
    fields: 15,
    component: FinancialSection
  },
  {
    id: 'customer',
    title: 'Customer Analytics & Risk',
    fields: 8,
    component: CustomerRiskSection
  },
  {
    id: 'market',
    title: 'Competitive & Market Intelligence',
    fields: 6,
    component: CompetitiveMarketSection
  },
  {
    id: 'operational',
    title: 'Operational Efficiency',
    fields: 7,
    component: OperationalStrategicSection
  },
  {
    id: 'value',
    title: 'Value Enhancement & Risk Management',
    fields: 9,
    component: ValueEnhancementSection
  }
]

const initialData: ProfessionalTierData = {
  financialMetrics: {
    annualRevenue: 0,
    monthlyRecurring: 0,
    expenses: 0,
    cashFlow: 0,
    grossMargin: 0,
    netProfit: 0,
    ebitda: 0,
    burnRate: 0,
    runwayMonths: 0,
    debtToEquityRatio: 0,
    currentRatio: 0,
    quickRatio: 0,
    inventoryTurnover: 0,
    receivablesTurnover: 0,
    workingCapital: 0
  },
  customerAnalytics: {
    customerAcquisitionCost: 0,
    customerLifetimeValue: 0,
    churnRate: 0,
    netPromoterScore: 0,
    monthlyActiveUsers: 0,
    conversionRate: 0,
    averageOrderValue: 0,
    repeatCustomerRate: 0
  },
  operationalEfficiency: {
    employeeProductivity: 0,
    operatingExpenseRatio: 0,
    capacityUtilization: 0,
    inventoryDaysOnHand: 0,
    paymentTermsDays: 0,
    vendorPaymentDays: 0,
    cashConversionCycle: 0
  },
  marketIntelligence: {
    marketShare: 0,
    marketGrowthRate: 0,
    competitorAnalysis: [],
    marketTrends: [],
    threatLevel: 'medium',
    opportunityScore: 0
  },
  financialPlanning: {
    revenueForecast12Month: [],
    expenseForecast12Month: [],
    cashFlowForecast12Month: [],
    scenarioAnalysis: {
      optimistic: { revenue: 0, expenses: 0 },
      realistic: { revenue: 0, expenses: 0 },
      pessimistic: { revenue: 0, expenses: 0 }
    },
    budgetVariance: 0
  },
  compliance: {
    regulatoryCompliance: [],
    riskAssessment: {
      financialRisk: 'medium',
      operationalRisk: 'medium',
      marketRisk: 'medium',
      overallRiskScore: 0
    },
    insuranceCoverage: [],
    auditTrail: []
  }
}

export default function ProfessionalQuestionnairePage() {
  const router = useRouter()
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [data, setData] = useState<ProfessionalTierData>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const currentSection = sections[currentSectionIndex]

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!hasUnsavedChanges) return
    
    setIsSaving(true)
    try {
      // Simulate API call - replace with actual save logic
      await new Promise(resolve => setTimeout(resolve, 500))
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }, [hasUnsavedChanges])

  // Auto-save every 30 seconds if there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return
    
    const timer = setTimeout(autoSave, 30000)
    return () => clearTimeout(timer)
  }, [hasUnsavedChanges, autoSave])

  // Manual save
  const handleSave = async () => {
    await autoSave()
  }

  // Calculate completion status for each section
  const getSectionProgress = () => {
    return sections.map((section, index) => {
      let completed = 0
      
      switch (section.id) {
        case 'financial':
          completed = Object.values(data.financialMetrics).filter(v => v > 0).length
          break
        case 'customer':
          completed = Object.values(data.customerAnalytics).filter(v => v > 0).length
          break
        case 'market':
          completed = [data.marketIntelligence.marketShare, data.marketIntelligence.marketGrowthRate, 
                      data.marketIntelligence.threatLevel, data.marketIntelligence.opportunityScore]
                      .filter(v => v !== undefined && v !== 0).length
          break
        case 'operational':
          completed = Object.values(data.operationalEfficiency).filter(v => v > 0).length
          break
        case 'value':
          const planningCompleted = [data.financialPlanning.budgetVariance].filter(v => v !== undefined && v !== 0).length
          const complianceCompleted = [data.compliance.riskAssessment.overallRiskScore].filter(v => v !== undefined && v !== 0).length
          completed = planningCompleted + complianceCompleted
          break
      }
      
      return {
        id: section.id,
        title: section.title,
        fields: section.fields,
        completed,
        isActive: index === currentSectionIndex,
        isCompleted: completed >= section.fields * 0.8 // 80% completion threshold
      }
    })
  }

  const sectionProgress = getSectionProgress()
  const totalProgress = (sectionProgress.reduce((sum, section) => sum + section.completed, 0) / 
                       sectionProgress.reduce((sum, section) => sum + section.fields, 0)) * 100

  // Section data handlers
  const handleSectionDataChange = (sectionId: string, sectionData: any) => {
    setData(prev => ({
      ...prev,
      [sectionId]: { ...prev[sectionId as keyof ProfessionalTierData], ...sectionData }
    }))
    setHasUnsavedChanges(true)
  }

  const handleFinancialChange = (financialData: Partial<ProfessionalTierData['financialMetrics']>) => {
    handleSectionDataChange('financialMetrics', financialData)
  }

  const handleCustomerChange = (customerData: Partial<ProfessionalTierData['customerAnalytics']>) => {
    handleSectionDataChange('customerAnalytics', customerData)
  }

  const handleMarketChange = (marketData: Partial<ProfessionalTierData['marketIntelligence']>) => {
    handleSectionDataChange('marketIntelligence', marketData)
  }

  const handleOperationalChange = (operationalData: Partial<ProfessionalTierData['operationalEfficiency']>) => {
    handleSectionDataChange('operationalEfficiency', operationalData)
  }

  const handleValueChange = (valueData: any) => {
    // Split data between financial planning and compliance
    const planningFields = ['budgetVariance', 'revenue12MonthGrowth', 'cashFlowGrowth', 
                           'scenarioOptimisticRevenue', 'scenarioPessimisticRevenue']
    const complianceFields = ['overallRiskScore', 'regulatoryCompliance', 'insuranceCoverageRatio', 'auditFrequency']
    
    const planningData: any = {}
    const complianceData: any = {}
    
    Object.entries(valueData).forEach(([key, value]) => {
      if (planningFields.includes(key)) {
        planningData[key] = value
      } else if (complianceFields.includes(key)) {
        if (key === 'overallRiskScore') {
          complianceData.riskAssessment = { ...data.compliance.riskAssessment, overallRiskScore: value }
        } else {
          complianceData[key] = value
        }
      }
    })
    
    if (Object.keys(planningData).length > 0) {
      handleSectionDataChange('financialPlanning', planningData)
    }
    if (Object.keys(complianceData).length > 0) {
      handleSectionDataChange('compliance', complianceData)
    }
  }

  // Navigation
  const canNavigateToSection = (index: number) => {
    if (index === 0) return true
    return sectionProgress[index - 1].isCompleted
  }

  const goToSection = (index: number) => {
    if (canNavigateToSection(index)) {
      setCurrentSectionIndex(index)
    }
  }

  const goToNextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      goToSection(currentSectionIndex + 1)
    }
  }

  const goToPreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1)
    }
  }

  const handleComplete = async () => {
    await handleSave()
    router.push('/evaluations')
  }

  // Render current section
  const renderCurrentSection = () => {
    const CurrentComponent = currentSection.component
    
    switch (currentSection.id) {
      case 'financial':
        return <CurrentComponent data={data.financialMetrics} onChange={handleFinancialChange} errors={errors} />
      case 'customer':
        return <CurrentComponent data={data.customerAnalytics} onChange={handleCustomerChange} errors={errors} />
      case 'market':
        return <CurrentComponent data={data.marketIntelligence} onChange={handleMarketChange} errors={errors} />
      case 'operational':
        return <CurrentComponent data={data.operationalEfficiency} onChange={handleOperationalChange} errors={errors} />
      case 'value':
        return <CurrentComponent 
          data={{...data.financialPlanning, ...data.compliance, overallRiskScore: data.compliance.riskAssessment.overallRiskScore}} 
          onChange={handleValueChange} 
          errors={errors} 
        />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Professional Tier Questionnaire</h1>
                <p className="text-sm text-gray-600">Complete all sections for comprehensive business valuation</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Save Status */}
              <div className="flex items-center gap-2 text-sm">
                {isSaving ? (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : hasUnsavedChanges ? (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    Unsaved changes
                  </div>
                ) : lastSaved ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Saved {lastSaved.toLocaleTimeString()}
                  </div>
                ) : null}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-medium text-blue-600">{Math.round(totalProgress)}% Complete</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Progress Tracker Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <ProgressTracker
                sections={sectionProgress}
                currentSection={currentSection.id}
                onSectionChange={(sectionId) => {
                  const index = sections.findIndex(s => s.id === sectionId)
                  if (index !== -1) goToSection(index)
                }}
                totalProgress={totalProgress}
              />
            </div>
          </div>

          {/* Main Form Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Current Section */}
              {renderCurrentSection()}

              {/* Navigation */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={goToPreviousSection}
                      disabled={currentSectionIndex === 0}
                      className="flex items-center gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        Section {currentSectionIndex + 1} of {sections.length}
                      </p>
                      <p className="text-xs text-gray-500">
                        {sectionProgress[currentSectionIndex].completed} of {sectionProgress[currentSectionIndex].fields} fields completed
                      </p>
                    </div>
                    
                    {currentSectionIndex === sections.length - 1 ? (
                      <Button
                        onClick={handleComplete}
                        disabled={totalProgress < 80}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Complete Questionnaire
                      </Button>
                    ) : (
                      <Button
                        onClick={goToNextSection}
                        disabled={!canNavigateToSection(currentSectionIndex + 1)}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Completion Alert */}
              {totalProgress < 80 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Complete at least 80% of all sections to unlock the comprehensive professional evaluation. 
                    Current progress: {Math.round(totalProgress)}%
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Force dynamic rendering to prevent static generation issues with useState
export const dynamic = 'force-dynamic'