"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Save, FileText, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

// Enterprise Section Components
import { StrategicValueDriversSection } from '@/components/questionnaire/enterprise/StrategicValueDriversSection'
import { OperationalScalabilitySection } from '@/components/questionnaire/enterprise/OperationalScalabilitySection'
import { FinancialOptimizationSection } from '@/components/questionnaire/enterprise/FinancialOptimizationSection'
import { StrategicScenarioPlanningSection } from '@/components/questionnaire/enterprise/StrategicScenarioPlanningSection'
import { MultiYearProjectionsSection } from '@/components/questionnaire/enterprise/MultiYearProjectionsSection'

// Professional Section Components (Import from Professional tier)
import { FinancialSection } from '@/components/questionnaire/professional/financial-section'
import { CustomerRiskSection } from '@/components/questionnaire/professional/customer-risk-section'
import { CompetitiveMarketSection } from '@/components/questionnaire/professional/competitive-market-section'
import { OperationalStrategicSection } from '@/components/questionnaire/professional/operational-strategic-section'
import { ValueEnhancementSection } from '@/components/questionnaire/professional/value-enhancement-section'

// Enterprise-specific components
import { EnterpriseProgressTracker } from '@/components/questionnaire/enterprise/EnterpriseProgressTracker'
import { useEnterpriseQuestionnaireProgress } from '@/hooks/useEnterpriseQuestionnaireProgress'
import { useSafeUser as useUser } from '@/hooks/use-safe-clerk'

interface SectionDefinition {
  id: string
  title: string
  description: string
  component: React.ComponentType<any>
  tier: 'professional' | 'enterprise'
  fieldCount: number
  isRequired: boolean
}

// Define all 10 sections (5 Professional + 5 Enterprise)
const QUESTIONNAIRE_SECTIONS: SectionDefinition[] = [
  // Professional Tier Sections (1-5)
  {
    id: 'financial-performance',
    title: 'Financial Performance',
    description: 'Historical 3-year financial data and advanced metrics',
    component: FinancialSection,
    tier: 'professional',
    fieldCount: 13,
    isRequired: true
  },
  {
    id: 'customer-risk',
    title: 'Customer & Risk Analysis',
    description: 'Customer concentration, retention, and lifecycle analytics',
    component: CustomerRiskSection,
    tier: 'professional',
    fieldCount: 10,
    isRequired: true
  },
  {
    id: 'competitive-market',
    title: 'Competitive & Market Position',
    description: 'Market share, competitive advantages, and scalability',
    component: CompetitiveMarketSection,
    tier: 'professional',
    fieldCount: 9,
    isRequired: true
  },
  {
    id: 'operational-strategic',
    title: 'Operational & Strategic',
    description: 'Key person dependencies and strategic positioning',
    component: OperationalStrategicSection,
    tier: 'professional',
    fieldCount: 7,
    isRequired: true
  },
  {
    id: 'value-enhancement',
    title: 'Value Enhancement',
    description: 'Growth potential and improvement opportunities',
    component: ValueEnhancementSection,
    tier: 'professional',
    fieldCount: 5,
    isRequired: true
  },
  // Enterprise Tier Sections (6-10)
  {
    id: 'strategic-value-drivers',
    title: 'Strategic Value Drivers',
    description: 'IP portfolio, partnerships, brand assets, competitive moats',
    component: StrategicValueDriversSection,
    tier: 'enterprise',
    fieldCount: 15,
    isRequired: true
  },
  {
    id: 'operational-scalability',
    title: 'Operational Scalability',
    description: 'Process optimization, systems, and scalability analysis',
    component: OperationalScalabilitySection,
    tier: 'enterprise',
    fieldCount: 12,
    isRequired: true
  },
  {
    id: 'financial-optimization',
    title: 'Financial Optimization',
    description: 'Tax structure, working capital, and capital optimization',
    component: FinancialOptimizationSection,
    tier: 'enterprise',
    fieldCount: 16,
    isRequired: true
  },
  {
    id: 'strategic-scenario-planning',
    title: 'Strategic Scenario Planning',
    description: 'Growth scenarios, exit strategies, and value maximization',
    component: StrategicScenarioPlanningSection,
    tier: 'enterprise',
    fieldCount: 18,
    isRequired: true
  },
  {
    id: 'multi-year-projections',
    title: 'Multi-Year Projections',
    description: '5-year financial projections and strategic options',
    component: MultiYearProjectionsSection,
    tier: 'enterprise',
    fieldCount: 20,
    isRequired: true
  }
]

export default function EnterpriseQuestionnairePage() {
  const router = useRouter()
  const { user } = useUser()
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [importedProfessionalData, setImportedProfessionalData] = useState<any>(null)
  const [isImporting, setIsImporting] = useState(false)

  // Initialize progress tracking
  const progressHook = useEnterpriseQuestionnaireProgress({
    questionnaireId: 'enterprise-main',
    businessEvaluationId: 'current', // This would come from context/route
    autoSave: true,
    saveInterval: 30,
    sessionPersistence: true,
    trackFieldLevel: true
  })

  const currentSection = QUESTIONNAIRE_SECTIONS[currentSectionIndex]
  const isFirstSection = currentSectionIndex === 0
  const isLastSection = currentSectionIndex === QUESTIONNAIRE_SECTIONS.length - 1
  const professionalSections = QUESTIONNAIRE_SECTIONS.filter(s => s.tier === 'professional')
  const enterpriseSections = QUESTIONNAIRE_SECTIONS.filter(s => s.tier === 'enterprise')

  // Import Professional tier data if available
  const importProfessionalData = useCallback(async () => {
    if (!user?.id || isImporting) return
    
    setIsImporting(true)
    try {
      const response = await fetch('/api/questionnaire/professional/export', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.professionalData) {
          setImportedProfessionalData(data.professionalData)
          // Auto-populate professional sections with imported data
          progressHook.importProfessionalData?.(data.professionalData)
        }
      }
    } catch (error) {
      console.error('Failed to import professional data:', error)
    } finally {
      setIsImporting(false)
    }
  }, [user?.id, isImporting, progressHook])

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await Promise.all([
          progressHook.reload?.(),
          importProfessionalData()
        ])
      } finally {
        setIsLoading(false)
      }
    }
    
    if (user?.id) {
      loadData()
    }
  }, [user?.id, progressHook.reload, importProfessionalData])

  // Navigation handlers
  const goToNextSection = useCallback(() => {
    if (!isLastSection) {
      const nextIndex = currentSectionIndex + 1
      setCurrentSectionIndex(nextIndex)
      progressHook.setCurrentSection?.(QUESTIONNAIRE_SECTIONS[nextIndex].id)
    }
  }, [currentSectionIndex, isLastSection, progressHook])

  const goToPreviousSection = useCallback(() => {
    if (!isFirstSection) {
      const prevIndex = currentSectionIndex - 1
      setCurrentSectionIndex(prevIndex)
      progressHook.setCurrentSection?.(QUESTIONNAIRE_SECTIONS[prevIndex].id)
    }
  }, [currentSectionIndex, isFirstSection, progressHook])

  const goToSection = useCallback((sectionId: string) => {
    const sectionIndex = QUESTIONNAIRE_SECTIONS.findIndex(s => s.id === sectionId)
    if (sectionIndex !== -1) {
      setCurrentSectionIndex(sectionIndex)
      progressHook.setCurrentSection?.(sectionId)
    }
  }, [progressHook])

  // Save handlers
  const handleSaveAndContinue = useCallback(async () => {
    try {
      await progressHook.saveNow?.()
      setHasUnsavedChanges(false)
      goToNextSection()
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }, [progressHook, goToNextSection])

  const handleManualSave = useCallback(async () => {
    try {
      await progressHook.saveNow?.()
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }, [progressHook])

  // Section completion handler
  const handleSectionComplete = useCallback((sectionId: string, data: any) => {
    progressHook.completeSection?.(sectionId)
    progressHook.updateSectionData?.(sectionId, data)
    setHasUnsavedChanges(true)
  }, [progressHook])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault()
            handleManualSave()
            break
          case 'ArrowLeft':
            e.preventDefault()
            goToPreviousSection()
            break
          case 'ArrowRight':
            e.preventDefault()
            goToNextSection()
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [handleManualSave, goToPreviousSection, goToNextSection])

  if (isLoading || progressHook.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Enterprise Questionnaire...</p>
        </div>
      </div>
    )
  }

  const CurrentSectionComponent = currentSection.component

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-purple-900">
                Enterprise Tier Questionnaire
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Complete comprehensive business analysis across 10 specialized sections
              </p>
            </div>
            
            {/* Save Status & Actions */}
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium",
                {
                  'bg-green-100 text-green-800': progressHook.saveStatus === 'saved',
                  'bg-yellow-100 text-yellow-800': progressHook.saveStatus === 'saving',
                  'bg-red-100 text-red-800': progressHook.saveStatus === 'error',
                  'bg-gray-100 text-gray-600': progressHook.saveStatus === 'idle'
                }
              )}>
                {progressHook.saveStatus === 'saved' && <CheckCircle className="h-4 w-4" />}
                {progressHook.saveStatus === 'saving' && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />}
                {progressHook.saveStatus === 'error' && <AlertTriangle className="h-4 w-4" />}
                {progressHook.saveStatus === 'idle' && hasUnsavedChanges && <FileText className="h-4 w-4" />}
                
                {progressHook.saveStatus === 'saved' && 'Saved'}
                {progressHook.saveStatus === 'saving' && 'Saving...'}
                {progressHook.saveStatus === 'error' && 'Save Error'}
                {progressHook.saveStatus === 'idle' && (hasUnsavedChanges ? 'Unsaved Changes' : 'All Saved')}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSave}
                disabled={progressHook.saveStatus === 'saving'}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Now
              </Button>
            </div>
          </div>

          {/* Professional Data Import Alert */}
          {importedProfessionalData && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Professional tier data has been imported. Professional sections (1-5) are pre-populated with your existing data.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {progressHook.error && (
            <Alert className="border-red-200 bg-red-50 mt-4">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {progressHook.error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Progress Sidebar */}
          <div className="lg:col-span-1">
            <EnterpriseProgressTracker
              sections={QUESTIONNAIRE_SECTIONS.map(section => ({
                id: section.id,
                title: section.title,
                tier: section.tier,
                fields: section.fieldCount,
                completed: progressHook.getSectionProgress?.(section.id)?.fieldsCompleted || 0,
                isActive: currentSection.id === section.id,
                isCompleted: progressHook.progress?.completedSections?.includes(section.id) || false
              }))}
              currentSection={currentSection.id}
              onSectionChange={goToSection}
              totalProgress={progressHook.progress?.percentageComplete || 0}
              professionalDataImported={!!importedProfessionalData}
              className="sticky top-8"
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              {/* Section Header */}
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        currentSection.tier === 'professional'
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      )}>
                        {currentSection.tier === 'professional' ? 'Professional' : 'Enterprise'} Tier
                      </span>
                      <span className="text-sm text-gray-500">
                        Section {currentSectionIndex + 1} of {QUESTIONNAIRE_SECTIONS.length}
                      </span>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {currentSection.title}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {currentSection.description}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {progressHook.getSectionProgress?.(currentSection.id)?.fieldsCompleted || 0} of {currentSection.fieldCount} fields
                    </div>
                    <div className="text-xs text-gray-400">
                      {currentSection.isRequired ? 'Required' : 'Optional'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Content */}
              <div className="p-6">
                <CurrentSectionComponent
                  data={progressHook.progress?.sectionData?.[currentSection.id] || {}}
                  onUpdate={(data: any) => {
                    progressHook.updateSectionData?.(currentSection.id, data)
                    setHasUnsavedChanges(true)
                  }}
                  onComplete={(data: any) => handleSectionComplete(currentSection.id, data)}
                  isReadOnly={false}
                  importedData={importedProfessionalData && currentSection.tier === 'professional' 
                    ? importedProfessionalData[currentSection.id] 
                    : null
                  }
                />
              </div>

              {/* Navigation */}
              <div className="border-t border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={goToPreviousSection}
                    disabled={isFirstSection}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {Math.round(progressHook.progress?.percentageComplete || 0)}% Complete
                    </span>
                    
                    {isLastSection ? (
                      <Button
                        onClick={() => router.push('/dashboard/enterprise')}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Complete Questionnaire
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSaveAndContinue}
                        disabled={progressHook.saveStatus === 'saving'}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Save & Continue
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Keyboard Shortcuts Hint */}
                <div className="mt-4 text-xs text-gray-400 text-center">
                  Keyboard shortcuts: Ctrl+S (Save), Ctrl+← (Previous), Ctrl+→ (Next)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Force dynamic rendering for real-time progress tracking
export const dynamic = 'force-dynamic'