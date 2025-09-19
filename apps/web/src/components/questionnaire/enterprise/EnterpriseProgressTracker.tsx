"use client"

import React from 'react'
import { CheckCircle, Circle, ChevronRight, Crown, Building, FileText } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Section {
  id: string
  title: string
  tier: 'professional' | 'enterprise'
  fields: number
  completed: number
  isActive: boolean
  isCompleted: boolean
}

interface EnterpriseProgressTrackerProps {
  sections: Section[]
  currentSection: string
  onSectionChange: (sectionId: string) => void
  totalProgress: number
  professionalDataImported: boolean
  className?: string
}

export function EnterpriseProgressTracker({
  sections,
  currentSection,
  onSectionChange,
  totalProgress,
  professionalDataImported,
  className
}: EnterpriseProgressTrackerProps) {
  const professionalSections = sections.filter(s => s.tier === 'professional')
  const enterpriseSections = sections.filter(s => s.tier === 'enterprise')

  const professionalProgress = professionalSections.reduce((acc, section) =>
    acc + (section.completed / section.fields), 0) / professionalSections.length * 100

  const enterpriseProgress = enterpriseSections.reduce((acc, section) =>
    acc + (section.completed / section.fields), 0) / enterpriseSections.length * 100

  const professionalCompleted = professionalSections.filter(s => s.isCompleted).length
  const enterpriseCompleted = enterpriseSections.filter(s => s.isCompleted).length

  const renderSection = (section: Section, index: number, sectionArray: Section[]) => {
    const isClickable = index === 0 || sectionArray[index - 1].isCompleted
    const completionPercentage = (section.completed / section.fields) * 100

    return (
      <button
        key={section.id}
        onClick={() => isClickable && onSectionChange(section.id)}
        disabled={!isClickable}
        className={cn(
          'w-full text-left p-4 rounded-lg border transition-all duration-200 group',
          'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
          {
            // Active section
            'bg-purple-50 border-purple-200 shadow-sm ring-1 ring-purple-200': section.isActive && isClickable,
            // Completed section
            'bg-green-50 border-green-200 hover:bg-green-100': section.isCompleted && !section.isActive,
            // Available but not active
            'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300': !section.isActive && !section.isCompleted && isClickable,
            // Disabled section
            'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60': !isClickable,
            // Hover states
            'hover:shadow-md': isClickable && !section.isActive
          }
        )}
        aria-current={section.isActive ? 'step' : undefined}
        aria-disabled={!isClickable}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Section Status Icon */}
            <div className="flex-shrink-0">
              {section.isCompleted ? (
                <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />
              ) : (
                <Circle
                  className={cn(
                    'h-5 w-5',
                    section.isActive ? 'text-purple-600' : 'text-gray-400'
                  )}
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Section Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={cn(
                  'text-sm font-medium truncate',
                  {
                    'text-purple-900': section.isActive,
                    'text-green-900': section.isCompleted && !section.isActive,
                    'text-gray-900': !section.isActive && !section.isCompleted && isClickable,
                    'text-gray-500': !isClickable
                  }
                )}>
                  {section.title}
                </h4>

                {/* Tier Badge */}
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs px-1.5 py-0.5',
                    section.tier === 'professional'
                      ? 'border-blue-300 text-blue-700 bg-blue-50'
                      : 'border-purple-300 text-purple-700 bg-purple-50'
                  )}
                >
                  {section.tier === 'professional' ? (
                    <Building className="h-3 w-3 mr-1" />
                  ) : (
                    <Crown className="h-3 w-3 mr-1" />
                  )}
                  {section.tier === 'professional' ? 'Pro' : 'Ent'}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-xs',
                  {
                    'text-purple-600': section.isActive,
                    'text-green-600': section.isCompleted && !section.isActive,
                    'text-gray-600': !section.isActive && !section.isCompleted && isClickable,
                    'text-gray-400': !isClickable
                  }
                )}>
                  {section.completed} of {section.fields} fields
                </span>

                {/* Progress indicator */}
                <span className={cn(
                  'text-xs font-medium',
                  {
                    'text-purple-600': section.isActive,
                    'text-green-600': section.isCompleted && !section.isActive,
                    'text-gray-600': !section.isActive && !section.isCompleted && isClickable,
                    'text-gray-400': !isClickable
                  }
                )}>
                  {Math.round(completionPercentage)}%
                </span>
              </div>

              {/* Mini progress bar */}
              <div className="mt-2">
                <div className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  {
                    'bg-purple-100': section.isActive,
                    'bg-green-100': section.isCompleted && !section.isActive,
                    'bg-gray-200': !section.isActive && !section.isCompleted
                  }
                )}>
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      {
                        'bg-purple-500': section.isActive,
                        'bg-green-500': section.isCompleted && !section.isActive,
                        'bg-gray-400': !section.isActive && !section.isCompleted
                      }
                    )}
                    style={{ width: `${completionPercentage}%` }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Arrow indicator */}
          {isClickable && (
            <ChevronRight
              className={cn(
                'h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5',
                {
                  'text-purple-600': section.isActive,
                  'text-green-600': section.isCompleted && !section.isActive,
                  'text-gray-400': !section.isActive && !section.isCompleted
                }
              )}
              aria-hidden="true"
            />
          )}
        </div>
      </button>
    )
  }

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg p-6 space-y-6', className)}>
      {/* Overall Progress */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
            <Crown className="h-5 w-5 text-purple-600" />
            Enterprise Questionnaire
          </h3>
          <span className="text-sm font-medium text-purple-600">
            {Math.round(totalProgress)}% Complete
          </span>
        </div>
        <Progress
          value={totalProgress}
          className="h-3 bg-purple-50"
          aria-label={`Overall progress: ${Math.round(totalProgress)}% complete`}
        />
        <p className="text-xs text-gray-600 mt-2">
          Complete all 10 sections for comprehensive enterprise-level valuation
        </p>
      </div>

      {/* Professional Data Import Status */}
      {professionalDataImported && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Professional Data Imported</span>
          </div>
          <p className="text-xs text-green-700 mt-1">
            Your Professional tier responses have been imported and are available in sections 1-5.
          </p>
        </div>
      )}

      {/* Professional Tier Sections */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
            <Building className="h-4 w-4 text-blue-600" />
            Professional Tier
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600">
              {professionalCompleted}/{professionalSections.length} complete
            </span>
            <span className="text-xs text-blue-600 font-medium">
              {Math.round(professionalProgress)}%
            </span>
          </div>
        </div>
        <div className="space-y-2">
          {professionalSections.map((section, index) =>
            renderSection(section, index, professionalSections)
          )}
        </div>
      </div>

      {/* Enterprise Tier Sections */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-purple-900 flex items-center gap-2">
            <Crown className="h-4 w-4 text-purple-600" />
            Enterprise Tier
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-xs text-purple-600">
              {enterpriseCompleted}/{enterpriseSections.length} complete
            </span>
            <span className="text-xs text-purple-600 font-medium">
              {Math.round(enterpriseProgress)}%
            </span>
          </div>
        </div>
        <div className="space-y-2">
          {enterpriseSections.map((section, index) =>
            renderSection(section, index, enterpriseSections)
          )}
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-900">Progress Summary</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-blue-700 font-medium">Professional</div>
            <div className="text-blue-600">
              {professionalSections.reduce((acc, s) => acc + s.completed, 0)} / {professionalSections.reduce((acc, s) => acc + s.fields, 0)} fields
            </div>
          </div>
          <div>
            <div className="text-purple-700 font-medium">Enterprise</div>
            <div className="text-purple-600">
              {enterpriseSections.reduce((acc, s) => acc + s.completed, 0)} / {enterpriseSections.reduce((acc, s) => acc + s.fields, 0)} fields
            </div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-purple-200">
          <div className="text-purple-700 font-medium text-xs">
            Total: {sections.reduce((acc, s) => acc + s.completed, 0)} / {sections.reduce((acc, s) => acc + s.fields, 0)} fields
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-xs text-gray-700">
          <strong>Enterprise Tier Benefits:</strong> Advanced strategic analysis, multi-scenario planning,
          exit strategy optimization, and comprehensive financial modeling for maximum business valuation.
        </p>
      </div>
    </div>
  )
}

export default EnterpriseProgressTracker