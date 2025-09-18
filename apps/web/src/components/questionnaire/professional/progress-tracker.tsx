"use client"

import React from 'react'
import { CheckCircle, Circle, ChevronRight } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface Section {
  id: string
  title: string
  fields: number
  completed: number
  isActive: boolean
  isCompleted: boolean
}

interface ProgressTrackerProps {
  sections: Section[]
  currentSection: string
  onSectionChange: (sectionId: string) => void
  totalProgress: number
  className?: string
}

export function ProgressTracker({
  sections,
  currentSection,
  onSectionChange,
  totalProgress,
  className
}: ProgressTrackerProps) {
  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg p-6', className)}>
      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-blue-900">
            Professional Questionnaire Progress
          </h3>
          <span className="text-sm font-medium text-blue-600">
            {Math.round(totalProgress)}% Complete
          </span>
        </div>
        <Progress 
          value={totalProgress} 
          className="h-3 bg-blue-50"
          aria-label={`Overall progress: ${Math.round(totalProgress)}% complete`}
        />
        <p className="text-xs text-gray-600 mt-1">
          Complete all sections for comprehensive business valuation
        </p>
      </div>

      {/* Section Navigation */}
      <nav aria-label="Questionnaire sections" className="space-y-2">
        {sections.map((section, index) => {
          const isClickable = index === 0 || sections[index - 1].isCompleted
          
          return (
            <button
              key={section.id}
              onClick={() => isClickable && onSectionChange(section.id)}
              disabled={!isClickable}
              className={cn(
                'w-full text-left p-4 rounded-lg border transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                {
                  // Active section
                  'bg-blue-50 border-blue-200 shadow-sm': section.isActive && isClickable,
                  // Completed section
                  'bg-green-50 border-green-200 hover:bg-green-100': section.isCompleted && !section.isActive,
                  // Available but not active
                  'bg-gray-50 border-gray-200 hover:bg-gray-100': !section.isActive && !section.isCompleted && isClickable,
                  // Disabled section
                  'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60': !isClickable,
                  // Hover states
                  'hover:shadow-md': isClickable
                }
              )}
              aria-current={section.isActive ? 'step' : undefined}
              aria-disabled={!isClickable}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Section Status Icon */}
                  <div className="flex-shrink-0">
                    {section.isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />
                    ) : (
                      <Circle 
                        className={cn(
                          'h-5 w-5',
                          section.isActive ? 'text-blue-600' : 'text-gray-400'
                        )} 
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  
                  {/* Section Info */}
                  <div className="min-w-0 flex-1">
                    <h4 className={cn(
                      'text-sm font-medium truncate',
                      {
                        'text-blue-900': section.isActive,
                        'text-green-900': section.isCompleted && !section.isActive,
                        'text-gray-900': !section.isActive && !section.isCompleted && isClickable,
                        'text-gray-500': !isClickable
                      }
                    )}>
                      {section.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        'text-xs',
                        {
                          'text-blue-600': section.isActive,
                          'text-green-600': section.isCompleted && !section.isActive,
                          'text-gray-600': !section.isActive && !section.isCompleted && isClickable,
                          'text-gray-400': !isClickable
                        }
                      )}>
                        {section.completed} of {section.fields} fields
                      </span>
                      
                      {/* Mini progress bar for section */}
                      <div className="flex-1 max-w-16">
                        <div className={cn(
                          'h-1.5 rounded-full',
                          {
                            'bg-blue-100': section.isActive,
                            'bg-green-100': section.isCompleted && !section.isActive,
                            'bg-gray-200': !section.isActive && !section.isCompleted
                          }
                        )}>
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-300',
                              {
                                'bg-blue-500': section.isActive,
                                'bg-green-500': section.isCompleted && !section.isActive,
                                'bg-gray-400': !section.isActive && !section.isCompleted
                              }
                            )}
                            style={{ width: `${(section.completed / section.fields) * 100}%` }}
                            aria-hidden="true"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Arrow indicator */}
                {isClickable && (
                  <ChevronRight 
                    className={cn(
                      'h-4 w-4 flex-shrink-0',
                      {
                        'text-blue-600': section.isActive,
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
        })}
      </nav>
      
      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Professional Tier:</strong> Complete all sections to unlock advanced valuation methodologies, 
          detailed market analysis, and comprehensive improvement recommendations.
        </p>
      </div>
    </div>
  )
}

export default ProgressTracker