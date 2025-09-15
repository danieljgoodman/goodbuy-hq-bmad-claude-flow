'use client'

import { useState, useEffect, ReactNode } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HelpCircle, X, ThumbsUp, ThumbsDown } from 'lucide-react'
import { useHelp } from '@/contexts/help-context'
import { HelpItem } from '@/contexts/help-context'

interface ContextualTooltipProps {
  helpId: string
  trigger?: ReactNode
  children?: ReactNode
  className?: string
  disabled?: boolean
}

interface TooltipContentProps {
  helpItem: HelpItem
  onDismiss: () => void
  onFeedback: (helpful: boolean) => void
}

function TooltipContent({ helpItem, onDismiss, onFeedback }: TooltipContentProps) {
  const [feedbackGiven, setFeedbackGiven] = useState(false)

  const handleFeedback = (helpful: boolean) => {
    onFeedback(helpful)
    setFeedbackGiven(true)
  }

  return (
    <div className="max-w-sm space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary flex-shrink-0" />
          <h4 className="font-semibold text-sm">{helpItem.title}</h4>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* Content */}
      <div className="text-sm text-muted-foreground leading-relaxed">
        {helpItem.content}
      </div>

      {/* Type Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {helpItem.type}
        </Badge>
        {helpItem.priority === 'high' && (
          <Badge variant="destructive" className="text-xs">
            Important
          </Badge>
        )}
      </div>

      {/* Feedback Section */}
      {!feedbackGiven && (
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">Was this helpful?</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedback(true)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-green-600"
            >
              <ThumbsUp className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedback(false)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
            >
              <ThumbsDown className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {feedbackGiven && (
        <div className="pt-2 border-t text-center">
          <span className="text-xs text-green-600">Thanks for your feedback!</span>
        </div>
      )}
    </div>
  )
}

export default function ContextualTooltip({ 
  helpId, 
  trigger, 
  children, 
  className = '',
  disabled = false 
}: ContextualTooltipProps) {
  const { activeHelp, dismissHelp, trackHelpInteraction, requestHelp } = useHelp()
  const [isOpen, setIsOpen] = useState(false)
  
  const helpItem = activeHelp.find(item => item.id === helpId)
  
  // Auto-open if help item becomes active
  useEffect(() => {
    if (helpItem && helpItem.type === 'tooltip') {
      setIsOpen(true)
    }
  }, [helpItem])

  const handleDismiss = () => {
    setIsOpen(false)
    dismissHelp(helpId)
  }

  const handleFeedback = (helpful: boolean) => {
    trackHelpInteraction(helpId, {
      type: helpful ? 'helpful' : 'not_helpful',
      helpful,
      context: window.location.pathname,
      userTier: 'FREE' // This should come from auth context
    })
  }

  const handleTriggerClick = () => {
    if (!helpItem) {
      requestHelp(helpId)
    }
    setIsOpen(!isOpen)
  }

  if (disabled) {
    return <>{children}</>
  }

  // Default trigger if none provided
  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className="h-5 w-5 p-0 text-muted-foreground hover:text-primary"
      onClick={handleTriggerClick}
    >
      <HelpCircle className="w-4 h-4" />
    </Button>
  )

  const triggerElement = trigger || defaultTrigger

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className={`inline-flex items-center gap-2 ${className}`}>
          {children}
          {triggerElement}
        </div>
      </PopoverTrigger>
      
      {helpItem && (
        <PopoverContent
          align={helpItem.targeting.alignment || 'center'}
          side={helpItem.targeting.position as any}
          sideOffset={helpItem.targeting.offset?.y || 8}
          className="w-auto max-w-sm"
        >
          <TooltipContent
            helpItem={helpItem}
            onDismiss={handleDismiss}
            onFeedback={handleFeedback}
          />
        </PopoverContent>
      )}
    </Popover>
  )
}

// Helper component for wrapping form fields with help
interface FormFieldWithHelpProps {
  helpId: string
  children: ReactNode
  className?: string
  showTrigger?: boolean
}

export function FormFieldWithHelp({ 
  helpId, 
  children, 
  className = '',
  showTrigger = true 
}: FormFieldWithHelpProps) {
  return (
    <ContextualTooltip 
      helpId={helpId} 
      className={className}
      trigger={showTrigger ? undefined : null}
    >
      {children}
    </ContextualTooltip>
  )
}

// Hook for manual help triggering
export function useContextualHelp() {
  const { requestHelp, dismissHelp, isHelpVisible, trackUserAction } = useHelp()

  const showHelp = (helpId: string) => {
    requestHelp(helpId)
  }

  const hideHelp = (helpId: string) => {
    dismissHelp(helpId)
  }

  const trackAction = (type: string, element?: string) => {
    trackUserAction({
      type,
      element,
      context: window.location.pathname,
      timestamp: new Date()
    })
  }

  return {
    showHelp,
    hideHelp,
    isHelpVisible,
    trackAction
  }
}