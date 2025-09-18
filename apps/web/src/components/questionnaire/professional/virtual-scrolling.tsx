/**
 * Virtual Scrolling Component for Professional Questionnaire
 *
 * High-performance virtual scrolling implementation for handling
 * large questionnaire sections with 45+ fields efficiently
 * Maintains smooth 60fps scrolling and minimal memory footprint
 */

"use client"

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  ReactElement
} from 'react'
import { performanceMonitor } from '@/lib/performance/questionnaire-optimizer'

// Virtual scrolling configuration
const VIRTUAL_CONFIG = {
  itemHeight: 180, // Default field height in pixels
  bufferSize: 5, // Number of items to render outside viewport
  scrollThreshold: 100, // Scroll threshold for performance optimization
  resizeDebounceMs: 150,
  maxRenderItems: 20 // Maximum items to render at once
}

// Item data interface
interface VirtualItem {
  id: string
  height: number
  component: ReactElement
  data?: any
  priority?: 'high' | 'medium' | 'low'
}

// Virtual scrolling props
interface VirtualScrollingProps {
  items: VirtualItem[]
  containerHeight: number
  className?: string
  onScroll?: (scrollTop: number, scrollDirection: 'up' | 'down') => void
  onItemVisible?: (itemId: string, isVisible: boolean) => void
  estimatedItemHeight?: number
  enableSmoothScrolling?: boolean
}

// Viewport calculation hook
const useViewportCalculations = (
  containerHeight: number,
  items: VirtualItem[],
  scrollTop: number
) => {
  return useMemo(() => {
    let accumulatedHeight = 0
    const itemPositions: Array<{ top: number; bottom: number; height: number }> = []

    // Calculate positions for all items
    items.forEach((item, index) => {
      const top = accumulatedHeight
      const height = item.height || VIRTUAL_CONFIG.itemHeight
      const bottom = top + height

      itemPositions.push({ top, bottom, height })
      accumulatedHeight += height
    })

    const totalHeight = accumulatedHeight
    const viewportTop = scrollTop
    const viewportBottom = scrollTop + containerHeight

    // Find visible range with buffer
    let startIndex = 0
    let endIndex = items.length - 1

    for (let i = 0; i < items.length; i++) {
      const pos = itemPositions[i]
      if (pos.bottom > viewportTop - VIRTUAL_CONFIG.bufferSize * VIRTUAL_CONFIG.itemHeight) {
        startIndex = Math.max(0, i - VIRTUAL_CONFIG.bufferSize)
        break
      }
    }

    for (let i = items.length - 1; i >= 0; i--) {
      const pos = itemPositions[i]
      if (pos.top < viewportBottom + VIRTUAL_CONFIG.bufferSize * VIRTUAL_CONFIG.itemHeight) {
        endIndex = Math.min(items.length - 1, i + VIRTUAL_CONFIG.bufferSize)
        break
      }
    }

    // Limit render count for performance
    const renderCount = endIndex - startIndex + 1
    if (renderCount > VIRTUAL_CONFIG.maxRenderItems) {
      endIndex = startIndex + VIRTUAL_CONFIG.maxRenderItems - 1
    }

    return {
      totalHeight,
      startIndex,
      endIndex,
      itemPositions,
      visibleItems: items.slice(startIndex, endIndex + 1).map((item, index) => ({
        ...item,
        index: startIndex + index,
        position: itemPositions[startIndex + index]
      }))
    }
  }, [containerHeight, items, scrollTop])
}

// Scroll optimization hook
const useScrollOptimization = (
  onScroll?: (scrollTop: number, scrollDirection: 'up' | 'down') => void
) => {
  const lastScrollTop = useRef(0)
  const lastScrollTime = useRef(0)
  const scrollDirection = useRef<'up' | 'down'>('down')
  const rafId = useRef<number>()

  const optimizedScrollHandler = useCallback((scrollTop: number) => {
    const now = performance.now()

    // Determine scroll direction
    const direction = scrollTop > lastScrollTop.current ? 'down' : 'up'
    if (direction !== scrollDirection.current) {
      scrollDirection.current = direction
    }

    // Throttle scroll events using requestAnimationFrame
    if (rafId.current) {
      cancelAnimationFrame(rafId.current)
    }

    rafId.current = requestAnimationFrame(() => {
      if (onScroll) {
        onScroll(scrollTop, scrollDirection.current)
      }

      lastScrollTop.current = scrollTop
      lastScrollTime.current = now
    })
  }, [onScroll])

  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [])

  return optimizedScrollHandler
}

// Intersection observer for visibility tracking
const useVisibilityObserver = (
  onItemVisible?: (itemId: string, isVisible: boolean) => void
) => {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const visibleItems = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!onItemVisible) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const itemId = entry.target.getAttribute('data-item-id')
          if (!itemId) return

          const isVisible = entry.isIntersecting
          const wasVisible = visibleItems.current.has(itemId)

          if (isVisible !== wasVisible) {
            if (isVisible) {
              visibleItems.current.add(itemId)
            } else {
              visibleItems.current.delete(itemId)
            }
            onItemVisible(itemId, isVisible)
          }
        })
      },
      {
        threshold: [0, 0.1, 0.5, 1.0],
        rootMargin: '50px'
      }
    )

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [onItemVisible])

  const observeItem = useCallback((element: HTMLElement | null, itemId: string) => {
    if (!element || !observerRef.current) return

    element.setAttribute('data-item-id', itemId)
    observerRef.current.observe(element)
  }, [])

  const unobserveItem = useCallback((element: HTMLElement | null) => {
    if (!element || !observerRef.current) return
    observerRef.current.unobserve(element)
  }, [])

  return { observeItem, unobserveItem }
}

// Virtual item component with optimizations
const VirtualItem: React.FC<{
  item: VirtualItem & { position: { top: number; height: number } }
  observeItem: (element: HTMLElement | null, itemId: string) => void
}> = React.memo(({ item, observeItem }) => {
  const itemRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    observeItem(itemRef.current, item.id)
  }, [item.id, observeItem])

  return (
    <div
      ref={itemRef}
      style={{
        position: 'absolute',
        top: item.position.top,
        left: 0,
        right: 0,
        height: item.position.height,
        transform: 'translateZ(0)', // Force GPU acceleration
      }}
      className="virtual-item"
      data-item-id={item.id}
    >
      {item.component}
    </div>
  )
})

VirtualItem.displayName = 'VirtualItem'

// Main virtual scrolling component
export const VirtualScrolling: React.FC<VirtualScrollingProps> = ({
  items,
  containerHeight,
  className = '',
  onScroll,
  onItemVisible,
  estimatedItemHeight = VIRTUAL_CONFIG.itemHeight,
  enableSmoothScrolling = true
}) => {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollElementRef = useRef<HTMLDivElement>(null)

  // Performance monitoring
  const renderCountRef = useRef(0)
  const lastRenderTime = useRef(performance.now())

  // Custom hooks
  const optimizedScrollHandler = useScrollOptimization(onScroll)
  const { observeItem } = useVisibilityObserver(onItemVisible)

  // Calculate viewport and visible items
  const {
    totalHeight,
    startIndex,
    endIndex,
    visibleItems
  } = useViewportCalculations(containerHeight, items, scrollTop)

  // Scroll event handler
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement
    const newScrollTop = target.scrollTop

    setScrollTop(newScrollTop)
    optimizedScrollHandler(newScrollTop)
  }, [optimizedScrollHandler])

  // Performance tracking
  useEffect(() => {
    renderCountRef.current++
    const now = performance.now()
    const renderTime = now - lastRenderTime.current
    lastRenderTime.current = now

    if (renderTime > 16.67) { // More than one frame at 60fps
      console.warn(`Virtual scroll render took ${renderTime.toFixed(2)}ms`)
    }

    performanceMonitor.recordMetric('virtual-scroll', { renderTime })
  })

  // Smooth scrolling utility
  const scrollToItem = useCallback((itemIndex: number, behavior: ScrollBehavior = 'smooth') => {
    if (!scrollElementRef.current) return

    let targetTop = 0
    for (let i = 0; i < itemIndex && i < items.length; i++) {
      targetTop += items[i].height || estimatedItemHeight
    }

    scrollElementRef.current.scrollTo({
      top: targetTop,
      behavior: enableSmoothScrolling ? behavior : 'auto'
    })
  }, [items, estimatedItemHeight, enableSmoothScrolling])

  // Scroll to top utility
  const scrollToTop = useCallback(() => {
    if (scrollElementRef.current) {
      scrollElementRef.current.scrollTo({
        top: 0,
        behavior: enableSmoothScrolling ? 'smooth' : 'auto'
      })
    }
  }, [enableSmoothScrolling])

  // Expose utilities via imperative handle
  React.useImperativeHandle(containerRef, () => ({
    scrollToItem,
    scrollToTop,
    getScrollTop: () => scrollTop,
    getTotalHeight: () => totalHeight,
    getVisibleRange: () => ({ startIndex, endIndex })
  }))

  return (
    <div
      ref={containerRef}
      className={`virtual-scrolling-container ${className}`}
      style={{
        height: containerHeight,
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <div
        ref={scrollElementRef}
        className="virtual-scrolling-viewport"
        style={{
          height: '100%',
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch', // iOS smooth scrolling
        }}
        onScroll={handleScroll}
      >
        {/* Virtual container with total height */}
        <div
          className="virtual-scrolling-content"
          style={{
            height: totalHeight,
            position: 'relative',
            // Force GPU acceleration for better performance
            transform: 'translateZ(0)',
            willChange: 'transform'
          }}
        >
          {/* Render only visible items */}
          {visibleItems.map((item) => (
            <VirtualItem
              key={`${item.id}-${item.index}`}
              item={item}
              observeItem={observeItem}
            />
          ))}
        </div>
      </div>

      {/* Performance debug info (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 text-xs bg-black text-white p-2 rounded opacity-75">
          <div>Rendered: {visibleItems.length}/{items.length}</div>
          <div>Range: {startIndex}-{endIndex}</div>
          <div>Scroll: {scrollTop.toFixed(0)}px</div>
          <div>Total: {totalHeight}px</div>
        </div>
      )}
    </div>
  )
}

// HOC for virtualizing questionnaire sections
export const withVirtualScrolling = <P extends object>(
  Component: React.ComponentType<P>,
  itemHeight: number = VIRTUAL_CONFIG.itemHeight
) => {
  return React.forwardRef<any, P & { virtualScrolling?: boolean }>((props, ref) => {
    if (!props.virtualScrolling) {
      return <Component {...props} ref={ref} />
    }

    // This would need to be implemented based on the specific component structure
    // For now, return the original component
    return <Component {...props} ref={ref} />
  })
}

// Utility for converting form fields to virtual items
export const createVirtualItemsFromFields = (
  fields: Array<{
    id: string
    component: ReactElement
    height?: number
    priority?: 'high' | 'medium' | 'low'
  }>
): VirtualItem[] => {
  return fields.map(field => ({
    id: field.id,
    height: field.height || VIRTUAL_CONFIG.itemHeight,
    component: field.component,
    priority: field.priority || 'medium'
  }))
}

export default VirtualScrolling