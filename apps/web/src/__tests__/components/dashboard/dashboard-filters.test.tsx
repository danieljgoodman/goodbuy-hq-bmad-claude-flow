import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import DashboardFilters from '@/components/dashboard/dashboard-filters'
import type { DashboardFilters as DashboardFiltersType } from '@/types/dashboard'

const mockFilters: DashboardFiltersType = {
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31')
  },
  businessCategories: ['Technology'],
  evaluationTypes: ['completed', 'processing'],
  customTimeframe: { label: '30 days', days: 30 }
}

describe('DashboardFilters', () => {
  it('renders filter options correctly', () => {
    const mockOnFiltersChange = vi.fn()
    
    render(
      <DashboardFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    expect(screen.getByText('Filters')).toBeInTheDocument()
    expect(screen.getByText('Time Period')).toBeInTheDocument()
    expect(screen.getByText('Evaluation Status')).toBeInTheDocument()
  })

  it('shows active filters count', () => {
    const mockOnFiltersChange = vi.fn()
    
    render(
      <DashboardFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    expect(screen.getByText('2 active')).toBeInTheDocument()
  })

  it('handles evaluation type toggle', () => {
    const mockOnFiltersChange = vi.fn()
    
    render(
      <DashboardFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    const failedButton = screen.getByRole('button', { name: /failed/i })
    fireEvent.click(failedButton)

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      evaluationTypes: ['completed', 'processing', 'failed']
    })
  })

  it('handles date range changes', () => {
    const mockOnFiltersChange = vi.fn()
    
    render(
      <DashboardFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    const sevenDaysButton = screen.getByRole('button', { name: '7 days' })
    fireEvent.click(sevenDaysButton)

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        customTimeframe: { label: '7 days', days: 7 }
      })
    )
  })

  it('resets filters correctly', () => {
    const mockOnFiltersChange = vi.fn()
    
    render(
      <DashboardFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    const resetButton = screen.getByRole('button', { name: /reset/i })
    fireEvent.click(resetButton)

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      dateRange: expect.any(Object),
      businessCategories: [],
      evaluationTypes: ['completed', 'processing', 'failed'],
      customTimeframe: { label: '30 days', days: 30 }
    })
  })

  it('expands to show business categories', () => {
    const mockOnFiltersChange = vi.fn()
    
    render(
      <DashboardFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    const expandButton = screen.getByRole('button', { name: 'Expand' })
    fireEvent.click(expandButton)

    expect(screen.getByText('Business Categories')).toBeInTheDocument()
    expect(screen.getByText('Technology')).toBeInTheDocument()
  })

  it('handles business category toggle when expanded', () => {
    const mockOnFiltersChange = vi.fn()
    
    render(
      <DashboardFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    // Expand first
    const expandButton = screen.getByRole('button', { name: 'Expand' })
    fireEvent.click(expandButton)

    // Toggle Healthcare category
    const healthcareButton = screen.getByRole('button', { name: 'Healthcare' })
    fireEvent.click(healthcareButton)

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      businessCategories: ['Technology', 'Healthcare']
    })
  })

  it('displays loading state correctly', () => {
    const mockOnFiltersChange = vi.fn()
    
    render(
      <DashboardFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        isLoading={true}
      />
    )

    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      if (button.textContent !== 'Expand' && button.textContent !== 'Collapse') {
        expect(button).toBeDisabled()
      }
    })
  })
})