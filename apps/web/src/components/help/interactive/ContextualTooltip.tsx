'use client'

import React, { useState, useRef, useEffect, ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HelpCircle, X, ExternalLink, ChevronRight } from 'lucide-react'

interface ContextualTooltipProps {
  children: ReactNode
  content: string
  title: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  trigger?: 'hover' | 'click' | 'focus'
  helpId?: string
  relatedLinks?: {
    title: string
    url: string
  }[]
  category?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  onShow?: () => void
  onHide?: () => void
}

export function ContextualTooltip({
  children,
  content,
  title,
  position = 'auto',
  trigger = 'hover',
  helpId,
  relatedLinks = [],
  category,
  difficulty,
  onShow,
  onHide
}: ContextualTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [actualPosition, setActualPosition] = useState(position)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible && position === 'auto' && tooltipRef.current && triggerRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      }

      // Determine best position based on available space
      let bestPosition: 'top' | 'bottom' | 'left' | 'right' = 'bottom'

      const spaceBelow = viewport.height - triggerRect.bottom
      const spaceAbove = triggerRect.top
      const spaceRight = viewport.width - triggerRect.right
      const spaceLeft = triggerRect.left

      if (spaceBelow >= tooltipRect.height + 10) {
        bestPosition = 'bottom'
      } else if (spaceAbove >= tooltipRect.height + 10) {
        bestPosition = 'top'
      } else if (spaceRight >= tooltipRect.width + 10) {
        bestPosition = 'right'
      } else if (spaceLeft >= tooltipRect.width + 10) {
        bestPosition = 'left'
      }

      setActualPosition(bestPosition)
    }
  }, [isVisible, position])

  const showTooltip = () => {
    setIsVisible(true)
    onShow?.()
  }

  const hideTooltip = () => {
    setIsVisible(false)
    onHide?.()
  }

  const handleTriggerEvent = (event: React.MouseEvent | React.FocusEvent) => {
    if (trigger === 'click') {
      event.preventDefault()
      setIsVisible(!isVisible)
    }
  }

  const getTooltipClasses = () => {
    const baseClasses = 'absolute z-50 transition-all duration-200 ease-in-out'
    const positionClasses = {
      top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
    }
    
    return `${baseClasses} ${positionClasses[actualPosition]} ${
      isVisible ? 'opacity-100 visible' : 'opacity-0 invisible'
    }`
  }

  const getArrowClasses = () => {
    const arrowClasses = {
      top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-white',
      bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-white',
      left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-white',
      right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-white'
    }
    
    return `absolute w-0 h-0 border-8 ${arrowClasses[actualPosition]}`
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        className="inline-flex items-center cursor-help"
        onMouseEnter={trigger === 'hover' ? showTooltip : undefined}
        onMouseLeave={trigger === 'hover' ? hideTooltip : undefined}
        onFocus={trigger === 'focus' ? showTooltip : undefined}
        onBlur={trigger === 'focus' ? hideTooltip : undefined}
        onClick={handleTriggerEvent}
        tabIndex={trigger === 'focus' ? 0 : undefined}
      >
        {children}
        <HelpCircle className="h-4 w-4 text-gray-400 ml-1 hover:text-blue-600 transition-colors" />
      </div>

      <div ref={tooltipRef} className={getTooltipClasses()}>
        <Card className="w-80 max-w-sm shadow-lg border">
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-gray-900 mb-1">
                  {title}
                </h4>
                <div className="flex items-center gap-2">
                  {category && (
                    <Badge variant="outline" className="text-xs">
                      {category}
                    </Badge>
                  )}
                  {difficulty && (
                    <Badge className={`text-xs ${getDifficultyColor(difficulty)}`}>
                      {difficulty}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={hideTooltip}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Content */}
            <div className="text-sm text-gray-700 mb-3 leading-relaxed">
              {content}
            </div>

            {/* Related Links */}
            {relatedLinks.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-xs font-medium text-gray-600 mb-2">
                  Learn more:
                </p>
                <div className="space-y-1">
                  {relatedLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <ChevronRight className="h-3 w-3 mr-1" />
                      {link.title}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mt-3 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                className="text-xs flex-1"
                onClick={() => {
                  // Track helpful feedback
                  console.log('Helpful feedback for:', helpId)
                }}
              >
                Helpful
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs flex-1"
                onClick={() => {
                  // Open full help article
                  console.log('Open help article:', helpId)
                }}
              >
                More Info
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Arrow */}
        <div className={getArrowClasses()} />
      </div>
    </div>
  )
}