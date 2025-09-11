'use client'

import { useEffect, useRef } from 'react'

export function DashboardMockup() {
  const countersRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const animateCounter = (element: HTMLElement) => {
      const target = parseFloat(element.getAttribute('data-target') || '0')
      const increment = target / 60
      let current = 0
      
      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          current = target
          clearInterval(timer)
        }
        
        if (target < 10 && target > 1) {
          element.textContent = current.toFixed(1)
        } else {
          element.textContent = Math.floor(current).toString()
        }
      }, 25)
    }

    const timer = setTimeout(() => {
      if (countersRef.current) {
        const counters = countersRef.current.querySelectorAll('[data-target]')
        counters.forEach((counter) => animateCounter(counter as HTMLElement))
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="w-full max-w-2xl" ref={countersRef}>
      {/* Dashboard Container */}
      <div className="relative bg-white/15 backdrop-blur-[20px] rounded-2xl shadow-[0_25px_80px_rgba(61,57,41,0.12),inset_0_1px_0_rgba(255,255,255,0.4)] p-8 border border-white/18">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-5 border-b border-border/30">
          <h2 className="text-2xl font-semibold text-foreground">
            Business Valuation Dashboard
          </h2>
          <div className="flex items-center gap-2 bg-primary/15 backdrop-blur-[8px] px-4 py-2 rounded-lg border border-white/30 text-primary text-sm font-semibold">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            AI Confidence: 94.7%
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {/* Primary Metric - Business Value */}
          <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-primary to-chart-1 text-primary-foreground p-6 rounded-xl hover:scale-[1.02] transition-transform duration-300">
            <div className="text-xs font-medium opacity-90 uppercase tracking-wide mb-2">
              Estimated Business Value
            </div>
            <div className="text-3xl lg:text-4xl font-bold mb-2">
              $<span data-target="2.8">0.0</span>M
            </div>
            <div className="text-sm opacity-90 flex items-center gap-1">
              ↗ <span>+12.5% from last analysis</span>
            </div>
          </div>

          {/* Secondary Metric - Revenue Multiple */}
          <div className="bg-gradient-to-br from-chart-2 to-[#8b6ff7] text-white p-6 rounded-xl hover:scale-[1.02] transition-transform duration-300">
            <div className="text-xs font-medium opacity-90 uppercase tracking-wide mb-2">
              Revenue Multiple
            </div>
            <div className="text-3xl font-bold mb-2">
              <span data-target="3.2">0.0</span>x
            </div>
            <div className="text-sm opacity-90 flex items-center gap-1">
              ↗ <span>Industry avg: 2.8x</span>
            </div>
          </div>

          {/* Tertiary Metric - Risk Assessment */}
          <div className="bg-gradient-to-br from-[#f4a261] to-[#e76f51] text-white p-6 rounded-xl hover:scale-[1.02] transition-transform duration-300">
            <div className="text-xs font-medium opacity-90 uppercase tracking-wide mb-2">
              Risk Assessment
            </div>
            <div className="text-3xl font-bold mb-2">
              <span data-target="23">0</span>/100
            </div>
            <div className="text-sm opacity-90 flex items-center gap-1">
              ↓ <span>Low Risk Profile</span>
            </div>
          </div>
        </div>

        {/* Trend Section */}
        <div className="bg-white/20 backdrop-blur-[10px] border border-white/20 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-foreground">
              Valuation Growth Trajectory
            </h3>
            <span className="text-sm text-muted-foreground">
              Last 8 months
            </span>
          </div>
          
          {/* Chart Container */}
          <div className="h-[140px] bg-muted rounded-lg overflow-hidden mb-5 relative">
            <div className="flex items-end justify-around h-full p-4 gap-2">
              {[30, 45, 55, 70, 85, 75, 90, 95].map((height, index) => (
                <div
                  key={index}
                  className={`bg-gradient-to-t from-primary to-chart-1 rounded-t-sm min-w-[24px] transition-all duration-300 hover:brightness-110 hover:scale-x-110 ${
                    index === 7 ? 'relative' : ''
                  }`}
                  style={{
                    height: `${height}%`,
                    animation: `growUp 1.5s ease-out ${(index + 1) * 0.1}s forwards`,
                    transformOrigin: 'bottom',
                    transform: 'scaleY(0)'
                  }}
                >
                  {index === 7 && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-[#059669] border-2 border-white rounded-full animate-bounce" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Chart Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xs text-muted-foreground uppercase font-medium mb-1">
                Revenue
              </div>
              <div className="text-lg font-semibold text-foreground">
                $<span data-target="1.2">0.0</span>M
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground uppercase font-medium mb-1">
                Growth
              </div>
              <div className="text-lg font-semibold text-foreground">
                <span data-target="23">0</span>%
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground uppercase font-medium mb-1">
                Margin
              </div>
              <div className="text-lg font-semibold text-foreground">
                <span data-target="42">0</span>%
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground uppercase font-medium mb-1">
                Stability
              </div>
              <div className="text-lg font-semibold text-foreground">
                A+
              </div>
            </div>
          </div>
        </div>

        {/* AI Footer */}
        <div className="flex items-center gap-3 p-4 bg-secondary/30 backdrop-blur-[10px] border border-white/20 rounded-lg text-sm text-secondary-foreground">
          <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 relative">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          </div>
          <span>
            AI-powered analysis complete • Bank-grade accuracy • 8 min processing time
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes growUp {
          to { transform: scaleY(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-6px); }
        }
      `}</style>
    </div>
  )
}