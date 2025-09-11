import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import AIInsights from '@/components/dashboard/ai-insights'
import type { DashboardMetrics } from '@/types/dashboard'

// Mock data
const mockMetrics: DashboardMetrics = {
  healthScore: 78,
  valuation: 1250000,
  riskLevel: 'Low',
  growthPotential: 8.5,
  lastUpdated: '2024-01-15T10:30:00Z'
}

describe('AIInsights', () => {
  it('renders AI Insights title with brain icon', () => {
    render(<AIInsights />)
    
    expect(screen.getByText('AI Insights')).toBeInTheDocument()
    expect(screen.getByTestId('brain-icon') || screen.getByRole('img', { hidden: true })).toBeInTheDocument()
  })

  it('renders fallback insights when no metrics provided', () => {
    render(<AIInsights />)
    
    expect(screen.getByText('Your health score is 12% above industry average')).toBeInTheDocument()
    expect(screen.getByText('Revenue growth is accelerating (+15% this quarter)')).toBeInTheDocument()
    expect(screen.getByText('Consider expanding market reach in Q4')).toBeInTheDocument()
  })

  it('renders dynamic insights based on metrics data', () => {
    render(<AIInsights metrics={mockMetrics} />)
    
    // Should render insights based on metrics
    expect(screen.getByText(/Your health score is.*above industry average/)).toBeInTheDocument()
    expect(screen.getByText(/Revenue growth is accelerating/)).toBeInTheDocument()
    expect(screen.getByText('Consider expanding market reach in Q4')).toBeInTheDocument()
  })

  it('renders insights for low health score', () => {
    const lowHealthMetrics = {
      ...mockMetrics,
      healthScore: 45
    }
    
    render(<AIInsights metrics={lowHealthMetrics} />)
    
    expect(screen.getByText(/Your health score is.*below industry average/)).toBeInTheDocument()
  })

  it('renders insights for high risk level', () => {
    const highRiskMetrics = {
      ...mockMetrics,
      riskLevel: 'High' as const
    }
    
    render(<AIInsights metrics={highRiskMetrics} />)
    
    expect(screen.getByText(/Revenue growth is stable/)).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<AIInsights className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('renders colored bullet points for each insight', () => {
    render(<AIInsights />)
    
    // Check for colored dots (should be 3 insights)
    const coloredDots = screen.getAllByText((content, element) => {
      return element?.classList.contains('bg-orange-500') ||
             element?.classList.contains('bg-green-500') ||
             element?.classList.contains('bg-blue-500') || false
    })
    
    // Should have at least colored elements present
    expect(document.querySelectorAll('.bg-orange-500, .bg-green-500, .bg-blue-500')).toHaveLength(3)
  })
})