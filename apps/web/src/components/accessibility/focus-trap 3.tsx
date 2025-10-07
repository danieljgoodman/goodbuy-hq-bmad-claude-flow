'use client'

import { useEffect, useRef, ReactNode } from 'react'
import { useAccessibility } from '@/contexts/accessibility-context'

interface FocusTrapProps {
  children: ReactNode
  enabled?: boolean
  initialFocus?: string
  restoreFocus?: boolean
  className?: string
}

export default function FocusTrap({
  children,
  enabled = true,
  initialFocus,
  restoreFocus = true,
  className = ''
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<Element | null>(null)
  const { announceToScreenReader } = useAccessibility()

  useEffect(() => {
    if (!enabled) return

    const container = containerRef.current
    if (!container) return

    // Store the currently focused element
    previousActiveElement.current = document.activeElement

    // Get all focusable elements within the container
    const getFocusableElements = (): HTMLElement[] => {
      const focusableElementsString = `
        a[href],
        area[href],
        input:not([disabled]):not([type="hidden"]):not([aria-hidden]),
        select:not([disabled]):not([aria-hidden]),
        textarea:not([disabled]):not([aria-hidden]),
        button:not([disabled]):not([aria-hidden]),
        iframe,
        object,
        embed,
        [tabindex]:not([tabindex="-1"]),
        [contenteditable],
        audio[controls],
        video[controls],
        summary
      `
      
      return Array.from(
        container.querySelectorAll(focusableElementsString)
      ).filter(el => {
        // Filter out elements that are not actually focusable
        const element = el as HTMLElement
        return (
          element.offsetWidth > 0 ||
          element.offsetHeight > 0 ||
          element.getClientRects().length > 0
        )
      }) as HTMLElement[]
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        // Shift + Tab (moving backwards)
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab (moving forwards)
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Element
      if (!container.contains(target)) {
        event.preventDefault()
        
        // Focus the first focusable element in the trap
        const focusableElements = getFocusableElements()
        if (focusableElements.length > 0) {
          focusableElements[0].focus()
        }
      }
    }

    // Set initial focus
    const setInitialFocus = () => {
      const focusableElements = getFocusableElements()
      
      if (initialFocus) {
        const targetElement = container.querySelector(initialFocus) as HTMLElement
        if (targetElement && focusableElements.includes(targetElement)) {
          targetElement.focus()
          return
        }
      }
      
      // Focus the first focusable element
      if (focusableElements.length > 0) {
        focusableElements[0].focus()
      }
    }

    // Add event listeners
    container.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown, true)
    
    // Set initial focus with a small delay to ensure DOM is ready
    setTimeout(setInitialFocus, 0)

    // Announce focus trap activation
    announceToScreenReader('Focus trapped in dialog', 'polite')

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown, true)
      
      // Restore focus to the previously focused element
      if (restoreFocus && previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus()
      }
      
      // Announce focus trap deactivation
      announceToScreenReader('Focus restored', 'polite')
    }
  }, [enabled, initialFocus, restoreFocus, announceToScreenReader])

  return (
    <div
      ref={containerRef}
      className={className}
      // Add a data attribute to identify focus trap containers
      data-focus-trap={enabled ? 'true' : 'false'}
    >
      {children}
    </div>
  )
}

// Hook for managing focus trap state
export function useFocusTrap() {
  const activeTrapRef = useRef<HTMLElement | null>(null)

  const createFocusTrap = (element: HTMLElement) => {
    activeTrapRef.current = element
    
    const cleanup = () => {
      activeTrapRef.current = null
    }

    return cleanup
  }

  const isTrapped = () => {
    return activeTrapRef.current !== null
  }

  const getCurrentTrap = () => {
    return activeTrapRef.current
  }

  return {
    createFocusTrap,
    isTrapped,
    getCurrentTrap
  }
}

// Utility component for creating focus trap boundaries
export function FocusTrapBoundary({ 
  children, 
  onEscape 
}: { 
  children: ReactNode
  onEscape?: () => void 
}) {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && onEscape) {
      event.preventDefault()
      onEscape()
    }
  }

  return (
    <div
      onKeyDown={handleKeyDown}
      className="focus-trap-boundary"
      role="region"
      aria-label="Modal content"
    >
      {children}
    </div>
  )
}

// Accessible dialog with focus trap
export function AccessibleDialog({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}) {
  const { announceToScreenReader } = useAccessibility()

  useEffect(() => {
    if (isOpen) {
      announceToScreenReader(`Dialog opened: ${title}`, 'assertive')
    }
  }, [isOpen, title, announceToScreenReader])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Dialog */}
      <FocusTrap enabled={isOpen} initialFocus="[data-dialog-close]">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          className={`relative bg-background border shadow-lg rounded-lg p-6 max-w-md w-full mx-4 ${className}`}
        >
          <div className="flex items-start justify-between mb-4">
            <h2 id="dialog-title" className="text-lg font-semibold">
              {title}
            </h2>
            <button
              data-dialog-close
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1 rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Close dialog"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            {children}
          </div>
        </div>
      </FocusTrap>
    </div>
  )
}

// Hook for managing multiple focus traps
export function useStackedFocusTraps() {
  const trapStack = useRef<HTMLElement[]>([])

  const pushTrap = (element: HTMLElement) => {
    trapStack.current.push(element)
  }

  const popTrap = () => {
    return trapStack.current.pop()
  }

  const getCurrentTrap = () => {
    const stack = trapStack.current
    return stack.length > 0 ? stack[stack.length - 1] : null
  }

  const clearAllTraps = () => {
    trapStack.current = []
  }

  return {
    pushTrap,
    popTrap,
    getCurrentTrap,
    clearAllTraps,
    trapCount: trapStack.current.length
  }
}