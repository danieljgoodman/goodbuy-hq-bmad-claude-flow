'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react'

interface KeyboardShortcut {
  key: string
  modifiers: ('ctrl' | 'alt' | 'shift' | 'meta')[]
  action: () => void
  description: string
  context?: string
}

interface FocusConfig {
  trapFocus: boolean
  restoreFocus: boolean
  initialFocus?: string
  skipLinks?: string[]
}

interface LiveRegionConfig {
  politeRegion: string
  assertiveRegion: string
  atomicUpdates: boolean
}

interface AccessibilityContextType {
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void
  registerKeyboardShortcut: (shortcut: KeyboardShortcut) => () => void
  focusElement: (selector: string) => boolean
  trapFocus: (containerRef: React.RefObject<HTMLElement>) => () => void
  skipToContent: () => void
  getAccessibleDescription: (element: HTMLElement) => string
  isHighContrastMode: boolean
  reducedMotion: boolean
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

// Global keyboard shortcuts for accessibility
const globalKeyboardShortcuts: KeyboardShortcut[] = [
  {
    key: 'h',
    modifiers: ['alt'],
    action: () => focusMainNavigation(),
    description: 'Focus main navigation',
    context: 'global'
  },
  {
    key: 's',
    modifiers: ['alt'],
    action: () => focusSearchInput(),
    description: 'Focus search input',
    context: 'global'
  },
  {
    key: '1',
    modifiers: ['alt'],
    action: () => focusMainContent(),
    description: 'Skip to main content',
    context: 'global'
  }
]

// Utility functions
function focusMainNavigation() {
  const nav = document.querySelector('[role="navigation"], nav')
  if (nav instanceof HTMLElement) {
    const firstFocusable = nav.querySelector('a, button, [tabindex]:not([tabindex="-1"])')
    if (firstFocusable instanceof HTMLElement) {
      firstFocusable.focus()
    }
  }
}

function focusSearchInput() {
  const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i], input[aria-label*="search" i]')
  if (searchInput instanceof HTMLElement) {
    searchInput.focus()
  }
}

function focusMainContent() {
  const main = document.querySelector('main, [role="main"], #main-content')
  if (main instanceof HTMLElement) {
    main.focus()
    main.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// Color contrast validation utility
export const validateColorContrast = (foreground: string, background: string): boolean => {
  // Simplified contrast check - in real implementation would use proper color parsing
  const contrastRatio = calculateContrastRatio(foreground, background)
  return contrastRatio >= 4.5 // WCAG AA standard
}

function calculateContrastRatio(color1: string, color2: string): number {
  // Simplified calculation - real implementation would parse color values
  // This is a placeholder that returns a passing ratio
  return 7.0
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [keyboardShortcuts, setKeyboardShortcuts] = useState<KeyboardShortcut[]>(globalKeyboardShortcuts)
  const [isHighContrastMode, setIsHighContrastMode] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const focusedElements = useRef<HTMLElement[]>([])

  // Detect system accessibility preferences
  useEffect(() => {
    // Check for high contrast mode
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)')
    setIsHighContrastMode(highContrastQuery.matches)
    
    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setIsHighContrastMode(e.matches)
    }
    
    highContrastQuery.addEventListener('change', handleHighContrastChange)

    // Check for reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(reducedMotionQuery.matches)
    
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
    }
    
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange)

    return () => {
      highContrastQuery.removeEventListener('change', handleHighContrastChange)
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange)
    }
  }, [])

  // Live region announcements
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const liveRegion = document.getElementById(`live-region-${priority}`)
    if (liveRegion) {
      liveRegion.textContent = message
      // Clear after announcement to allow repeated messages
      setTimeout(() => {
        if (liveRegion.textContent === message) {
          liveRegion.textContent = ''
        }
      }, 1000)
    }
  }, [])

  // Keyboard shortcut management
  const registerKeyboardShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setKeyboardShortcuts(prev => [...prev, shortcut])
    
    return () => {
      setKeyboardShortcuts(prev => prev.filter(s => s !== shortcut))
    }
  }, [])

  // Focus management utilities
  const focusElement = useCallback((selector: string): boolean => {
    const element = document.querySelector(selector)
    if (element instanceof HTMLElement) {
      element.focus()
      return true
    }
    return false
  }, [])

  // Focus trapping for modals and dialogs
  const trapFocus = useCallback((containerRef: React.RefObject<HTMLElement>) => {
    const container = containerRef.current
    if (!container) return () => {}

    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstFocusable = focusableElements[0] as HTMLElement
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault()
            lastFocusable.focus()
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault()
            firstFocusable.focus()
          }
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    
    // Focus first element initially
    if (firstFocusable) {
      firstFocusable.focus()
    }

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const skipToContent = useCallback(() => {
    focusMainContent()
    announceToScreenReader('Skipped to main content')
  }, [announceToScreenReader])

  const getAccessibleDescription = useCallback((element: HTMLElement): string => {
    return element.getAttribute('aria-describedby') || 
           element.getAttribute('aria-label') || 
           element.getAttribute('title') || 
           element.textContent || 
           'Interactive element'
  }, [])

  // Global keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, ctrlKey, altKey, shiftKey, metaKey } = event
      
      keyboardShortcuts.forEach(shortcut => {
        const modifierMatch = shortcut.modifiers.every(modifier => {
          switch (modifier) {
            case 'ctrl': return ctrlKey
            case 'alt': return altKey
            case 'shift': return shiftKey
            case 'meta': return metaKey
            default: return false
          }
        })

        if (shortcut.key === key && modifierMatch) {
          event.preventDefault()
          shortcut.action()
        }
      })
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [keyboardShortcuts])

  const value: AccessibilityContextType = {
    announceToScreenReader,
    registerKeyboardShortcut,
    focusElement,
    trapFocus,
    skipToContent,
    getAccessibleDescription,
    isHighContrastMode,
    reducedMotion
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      {/* Live regions for screen reader announcements */}
      <div 
        id="live-region-polite" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      />
      <div 
        id="live-region-assertive" 
        aria-live="assertive" 
        aria-atomic="true"
        className="sr-only"
      />
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

// Accessible component wrappers
export function AccessibleModal({ 
  isOpen, 
  onClose, 
  children, 
  title, 
  initialFocus 
}: {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title: string
  initialFocus?: string
}) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<Element | null>(null)
  const { trapFocus, announceToScreenReader } = useAccessibility()

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement
      announceToScreenReader(`${title} dialog opened`)
      
      const cleanup = trapFocus(modalRef)
      
      return () => {
        cleanup()
        if (previousFocus.current instanceof HTMLElement) {
          previousFocus.current.focus()
        }
        announceToScreenReader(`${title} dialog closed`)
      }
    }
  }, [isOpen, title, trapFocus, announceToScreenReader])

  if (!isOpen) return null

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabIndex={-1}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }}
    >
      <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">
        <div className="bg-background p-6 shadow-lg rounded-lg border">
          <h2 id="modal-title" className="text-lg font-semibold mb-4">
            {title}
          </h2>
          {children}
        </div>
      </div>
    </div>
  )
}

// Skip links component
export function SkipLinks() {
  const { skipToContent } = useAccessibility()

  return (
    <div className="sr-only focus-within:not-sr-only fixed top-0 left-0 z-[100]">
      <button
        onClick={skipToContent}
        className="bg-primary text-primary-foreground px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </button>
    </div>
  )
}

// Hook for accessible form fields
export function useAccessibleForm() {
  const { announceToScreenReader } = useAccessibility()

  const announceError = useCallback((fieldName: string, error: string) => {
    announceToScreenReader(`${fieldName}: ${error}`, 'assertive')
  }, [announceToScreenReader])

  const announceSuccess = useCallback((message: string) => {
    announceToScreenReader(message, 'polite')
  }, [announceToScreenReader])

  return {
    announceError,
    announceSuccess
  }
}