'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { GuideStep } from '@/types'
import { ChevronLeft, ChevronRight, X, Play, Pause, RotateCcw } from 'lucide-react'

interface GuidedTourProps {
  steps: GuideStep[]
  isActive: boolean
  onComplete: () => void
  onClose: () => void
  onStepChange?: (stepIndex: number) => void
  autoAdvance?: boolean
  autoAdvanceDelay?: number
}

export function GuidedTour({
  steps,
  isActive,
  onComplete,
  onClose,
  onStepChange,
  autoAdvance = false,
  autoAdvanceDelay = 3000
}: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoAdvance)
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const autoAdvanceTimer = useRef<NodeJS.Timeout>()

  const currentStepData = steps[currentStep]

  useEffect(() => {
    if (isActive) {
      document.body.style.overflow = 'hidden'
      highlightTargetElement()
    } else {
      document.body.style.overflow = 'auto'
      clearHighlight()
    }

    return () => {
      document.body.style.overflow = 'auto'
      clearHighlight()
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current)
      }
    }
  }, [isActive, currentStep])

  useEffect(() => {
    if (isActive && isPlaying && autoAdvance) {
      startAutoAdvance()
    } else {
      stopAutoAdvance()
    }

    return () => stopAutoAdvance()
  }, [isActive, isPlaying, currentStep, autoAdvance])

  const startAutoAdvance = () => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current)
    }
    
    autoAdvanceTimer.current = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        goToNextStep()
      } else {
        setIsPlaying(false)
      }
    }, autoAdvanceDelay)
  }

  const stopAutoAdvance = () => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current)
    }
  }

  const highlightTargetElement = () => {
    clearHighlight()
    
    if (currentStepData?.target_element) {
      const element = document.querySelector(currentStepData.target_element) as HTMLElement
      if (element) {
        setHighlightedElement(element)
        
        // Add highlight styles
        element.style.position = 'relative'
        element.style.zIndex = '9999'
        element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'
        element.style.border = '2px solid #3b82f6'
        element.style.borderRadius = '4px'
        
        // Scroll element into view
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center'
        })

        // Simulate action if specified
        if (currentStepData.action_type) {
          simulateAction(element, currentStepData.action_type)
        }
      }
    }
  }

  const clearHighlight = () => {
    if (highlightedElement) {
      highlightedElement.style.position = ''
      highlightedElement.style.zIndex = ''
      highlightedElement.style.backgroundColor = ''
      highlightedElement.style.border = ''
      highlightedElement.style.borderRadius = ''
      setHighlightedElement(null)
    }
  }

  const simulateAction = (element: HTMLElement, actionType: string) => {
    switch (actionType) {
      case 'click':
        element.style.animation = 'pulse 0.5s ease-in-out'
        setTimeout(() => {
          element.style.animation = ''
        }, 500)
        break
      case 'hover':
        element.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'
        setTimeout(() => {
          element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'
        }, 1000)
        break
      case 'input':
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.focus()
        }
        break
    }
  }

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      const newStep = currentStep + 1
      setCurrentStep(newStep)
      onStepChange?.(newStep)
    } else {
      completeTour()
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1
      setCurrentStep(newStep)
      onStepChange?.(newStep)
    }
  }

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex)
      onStepChange?.(stepIndex)
    }
  }

  const completeTour = () => {
    setIsPlaying(false)
    onComplete()
  }

  const restartTour = () => {
    setCurrentStep(0)
    setIsPlaying(autoAdvance)
    onStepChange?.(0)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const getTooltipPosition = () => {
    if (!highlightedElement) return { top: '50%', left: '50%' }

    const rect = highlightedElement.getBoundingClientRect()
    const position = currentStepData.position

    switch (position) {
      case 'top':
        return { 
          top: rect.top - 20, 
          left: rect.left + rect.width / 2,
          transform: 'translate(-50%, -100%)'
        }
      case 'bottom':
        return { 
          top: rect.bottom + 20, 
          left: rect.left + rect.width / 2,
          transform: 'translate(-50%, 0)'
        }
      case 'left':
        return { 
          top: rect.top + rect.height / 2, 
          left: rect.left - 20,
          transform: 'translate(-100%, -50%)'
        }
      case 'right':
        return { 
          top: rect.top + rect.height / 2, 
          left: rect.right + 20,
          transform: 'translate(0, -50%)'
        }
      default:
        return { 
          top: '50%', 
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }
    }
  }

  if (!isActive) return null

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <>
      {/* Dark Overlay */}
      <div 
        ref={overlayRef}
        className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
        onClick={onClose}
      />

      {/* Tour Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[9999] transition-all duration-300"
        style={getTooltipPosition()}
      >
        <Card className="w-80 max-w-sm shadow-xl border-2 border-blue-500">
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Step {currentStep + 1} of {steps.length}
                </Badge>
                {currentStepData.is_optional && (
                  <Badge variant="secondary" className="text-xs">
                    Optional
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">
                {Math.round(progress)}% complete
              </p>
            </div>

            {/* Step Content */}
            <div className="mb-4">
              <h4 className="font-semibold text-sm text-gray-900 mb-2">
                {currentStepData.title}
              </h4>
              <div 
                className="text-sm text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: currentStepData.content }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousStep}
                  disabled={currentStep === 0}
                  className="text-xs"
                >
                  <ChevronLeft className="h-3 w-3 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextStep}
                  className="text-xs"
                >
                  {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
                  {currentStep < steps.length - 1 && (
                    <ChevronRight className="h-3 w-3 ml-1" />
                  )}
                </Button>
              </div>

              {autoAdvance && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlayPause}
                    className="h-6 w-6 p-0"
                  >
                    {isPlaying ? (
                      <Pause className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={restartTour}
                    className="h-6 w-6 p-0"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Step Navigation Dots */}
            <div className="flex justify-center gap-1 mt-4 pt-3 border-t">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToStep(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentStep 
                      ? 'bg-blue-600 scale-125' 
                      : index < currentStep
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}