'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAccessibility } from '@/contexts/accessibility-context'

interface KeyboardNavigationProps {
  children: React.ReactNode
  onNavigate?: (direction: 'up' | 'down' | 'left' | 'right') => void
  focusSelector?: string
  className?: string
}

export default function KeyboardNavigation({ 
  children, 
  onNavigate, 
  focusSelector = 'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])',
  className = ''
}: KeyboardNavigationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [focusedIndex, setFocusedIndex] = useState(0)
  const { announceToScreenReader } = useAccessibility()
  
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return []
    return Array.from(containerRef.current.querySelectorAll(focusSelector)) as HTMLElement[]
  }, [focusSelector])

  const focusElement = useCallback((index: number) => {
    const elements = getFocusableElements()
    if (elements[index]) {
      elements[index].focus()
      setFocusedIndex(index)
      
      // Announce to screen reader
      const element = elements[index]
      const description = element.getAttribute('aria-label') || 
                         element.getAttribute('title') || 
                         element.textContent || 
                         'Interactive element'
      announceToScreenReader(`Focused: ${description}`)
    }
  }, [getFocusableElements, announceToScreenReader])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const elements = getFocusableElements()
    if (elements.length === 0) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        const nextIndex = Math.min(focusedIndex + 1, elements.length - 1)
        focusElement(nextIndex)
        onNavigate?.('down')
        break
        
      case 'ArrowUp':
        event.preventDefault()
        const prevIndex = Math.max(focusedIndex - 1, 0)
        focusElement(prevIndex)
        onNavigate?.('up')
        break
        
      case 'ArrowRight':
        event.preventDefault()
        onNavigate?.('right')
        break
        
      case 'ArrowLeft':
        event.preventDefault()
        onNavigate?.('left')
        break
        
      case 'Home':
        event.preventDefault()
        focusElement(0)
        break
        
      case 'End':
        event.preventDefault()
        focusElement(elements.length - 1)
        break
        
      case 'Enter':
      case ' ':
        // Let the focused element handle the activation
        const activeElement = document.activeElement as HTMLElement
        if (activeElement && elements.includes(activeElement)) {
          event.preventDefault()
          activeElement.click()
        }
        break
    }
  }, [focusedIndex, focusElement, getFocusableElements, onNavigate])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('keydown', handleKeyDown)
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  // Update focused index when focus changes via mouse or other means
  useEffect(() => {
    const handleFocusChange = () => {
      const elements = getFocusableElements()
      const activeElement = document.activeElement
      const newIndex = elements.indexOf(activeElement as HTMLElement)
      if (newIndex !== -1) {
        setFocusedIndex(newIndex)
      }
    }

    document.addEventListener('focusin', handleFocusChange)
    return () => document.removeEventListener('focusin', handleFocusChange)
  }, [getFocusableElements])

  return (
    <div
      ref={containerRef}
      className={className}
      role="group"
      tabIndex={-1}
    >
      {children}
    </div>
  )
}

// Hook for roving tabindex pattern
export function useRovingTabIndex(itemCount: number, initialIndex = 0) {
  const [focusedIndex, setFocusedIndex] = useState(initialIndex)

  const getTabIndex = useCallback((index: number) => {
    return index === focusedIndex ? 0 : -1
  }, [focusedIndex])

  const handleKeyDown = useCallback((event: KeyboardEvent, currentIndex: number) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault()
        setFocusedIndex((prev) => Math.min(prev + 1, itemCount - 1))
        break
        
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault()
        setFocusedIndex((prev) => Math.max(prev - 1, 0))
        break
        
      case 'Home':
        event.preventDefault()
        setFocusedIndex(0)
        break
        
      case 'End':
        event.preventDefault()
        setFocusedIndex(itemCount - 1)
        break
    }
  }, [itemCount])

  return {
    focusedIndex,
    setFocusedIndex,
    getTabIndex,
    handleKeyDown
  }
}

// Accessible menu component
export function AccessibleMenu({ 
  items, 
  onSelect, 
  className = '' 
}: {
  items: { id: string; label: string; disabled?: boolean }[]
  onSelect: (id: string) => void
  className?: string
}) {
  const { focusedIndex, getTabIndex, handleKeyDown } = useRovingTabIndex(items.length)
  const { announceToScreenReader } = useAccessibility()

  const handleItemKeyDown = (event: React.KeyboardEvent, index: number) => {
    handleKeyDown(event.nativeEvent, index)
    
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const item = items[index]
      if (!item.disabled) {
        onSelect(item.id)
        announceToScreenReader(`Selected: ${item.label}`)
      }
    }
  }

  return (
    <div
      role="menu"
      className={`space-y-1 ${className}`}
      aria-orientation="vertical"
    >
      {items.map((item, index) => (
        <button
          key={item.id}
          role="menuitem"
          tabIndex={getTabIndex(index)}
          disabled={item.disabled}
          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors
            ${item.disabled 
              ? 'text-muted-foreground cursor-not-allowed' 
              : 'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
            }
            ${index === focusedIndex ? 'ring-2 ring-ring ring-offset-2' : ''}
          `}
          onClick={() => !item.disabled && onSelect(item.id)}
          onKeyDown={(e) => handleItemKeyDown(e, index)}
          aria-disabled={item.disabled}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

// Accessible breadcrumb navigation
export function AccessibleBreadcrumb({ 
  items 
}: { 
  items: { href?: string; label: string; current?: boolean }[] 
}) {
  const { announceToScreenReader } = useAccessibility()

  useEffect(() => {
    const currentItem = items.find(item => item.current)
    if (currentItem) {
      announceToScreenReader(`Current page: ${currentItem.label}`, 'polite')
    }
  }, [items, announceToScreenReader])

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 select-none" aria-hidden="true">
                /
              </span>
            )}
            {item.href && !item.current ? (
              <a
                href={item.href}
                className="hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-1 py-0.5"
                aria-current={item.current ? 'page' : undefined}
              >
                {item.label}
              </a>
            ) : (
              <span
                className={item.current ? 'text-foreground font-medium' : ''}
                aria-current={item.current ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Accessible pagination
export function AccessiblePagination({
  currentPage,
  totalPages,
  onPageChange,
  className = ''
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}) {
  const { announceToScreenReader } = useAccessibility()

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page)
      announceToScreenReader(`Page ${page} of ${totalPages}`, 'polite')
    }
  }

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={`flex items-center justify-center space-x-2 ${className}`}
    >
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="Go to previous page"
      >
        Previous
      </button>

      <span className="px-3 py-2 text-sm" aria-live="polite">
        Page {currentPage} of {totalPages}
      </span>

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="Go to next page"
      >
        Next
      </button>
    </nav>
  )
}