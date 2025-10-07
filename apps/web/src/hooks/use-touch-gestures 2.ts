'use client'

import { useEffect, useRef, RefObject } from 'react'
import { useRouter } from 'next/navigation'

interface TouchGestureConfig {
  swipeLeft?: () => void    // Navigate back or close drawer
  swipeRight?: () => void   // Open navigation drawer
  swipeDown?: () => void    // Refresh current page
  swipeUp?: () => void      // Open quick actions
  threshold?: number        // Minimum distance for swipe recognition
  velocity?: number         // Minimum velocity for swipe recognition
}

interface TouchPosition {
  x: number
  y: number
  time: number
}

export function useTouchGestures(
  elementRef: RefObject<HTMLElement>,
  config: TouchGestureConfig
) {
  const router = useRouter()
  const touchStart = useRef<TouchPosition | null>(null)
  const touchEnd = useRef<TouchPosition | null>(null)
  
  const {
    threshold = 50,
    velocity = 0.3,
    swipeLeft,
    swipeRight, 
    swipeDown,
    swipeUp
  } = config

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      // Only handle single finger touches
      if (e.touches.length !== 1) return
      
      const touch = e.touches[0]
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      }
      touchEnd.current = null
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStart.current || e.touches.length !== 1) return
      
      const touch = e.touches[0]
      touchEnd.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current || !touchEnd.current) return

      const deltaX = touchEnd.current.x - touchStart.current.x
      const deltaY = touchEnd.current.y - touchStart.current.y
      const deltaTime = touchEnd.current.time - touchStart.current.time
      
      const distanceX = Math.abs(deltaX)
      const distanceY = Math.abs(deltaY)
      const velocityX = distanceX / deltaTime
      const velocityY = distanceY / deltaTime

      // Check if the gesture meets threshold and velocity requirements
      const isValidGesture = (distanceX > threshold || distanceY > threshold) && 
                            (velocityX > velocity || velocityY > velocity)
      
      if (!isValidGesture) return

      // Determine swipe direction (prioritize the axis with greater movement)
      if (distanceX > distanceY) {
        // Horizontal swipe
        if (deltaX > 0 && swipeRight) {
          // Swipe right - open navigation drawer
          e.preventDefault()
          swipeRight()
        } else if (deltaX < 0 && swipeLeft) {
          // Swipe left - navigate back or close drawer
          e.preventDefault()
          swipeLeft()
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && swipeDown) {
          // Swipe down - refresh page
          e.preventDefault()
          swipeDown()
        } else if (deltaY < 0 && swipeUp) {
          // Swipe up - open quick actions
          e.preventDefault()
          swipeUp()
        }
      }

      // Reset touch positions
      touchStart.current = null
      touchEnd.current = null
    }

    // Use passive listeners for better performance where possible
    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)  
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [elementRef, threshold, velocity, swipeLeft, swipeRight, swipeDown, swipeUp])
}

// Hook for common navigation gestures
export function useNavigationGestures(
  elementRef: RefObject<HTMLElement>,
  onOpenDrawer?: () => void,
  onCloseDrawer?: () => void
) {
  const router = useRouter()

  return useTouchGestures(elementRef, {
    swipeRight: () => {
      // Open navigation drawer on swipe right
      if (onOpenDrawer) {
        onOpenDrawer()
      }
    },
    swipeLeft: () => {
      // Close drawer if open, otherwise go back
      if (onCloseDrawer) {
        onCloseDrawer()
      } else {
        router.back()
      }
    },
    swipeDown: () => {
      // Refresh current page on swipe down
      window.location.reload()
    },
    threshold: 75,  // Slightly higher threshold to prevent accidental triggers
    velocity: 0.4   // Higher velocity requirement for navigation gestures
  })
}