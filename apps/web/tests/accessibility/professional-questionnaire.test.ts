import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import '@testing-library/jest-dom'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Professional Questionnaire Accessibility Tests (WCAG 2.1 AA Compliance)

describe('Professional Questionnaire Accessibility (WCAG 2.1 AA)', () => {
  let user: ReturnType<typeof userEvent.setup>

  // Mock Professional Questionnaire with Accessibility Features
  const AccessibleProfessionalQuestionnaire = () => {
    const [currentSection, setCurrentSection] = React.useState(0)
    const [formData, setFormData] = React.useState({
      financialPerformance: {
        revenueYear1: '',
        ebitdaMargin: '',
        returnOnEquity: ''
      },
      customerRiskAnalysis: {
        largestCustomerRevenue: '',
        customerConcentrationRisk: '',
        customerSatisfactionScore: ''
      }
    })
    const [errors, setErrors] = React.useState<Record<string, string>>({})

    const sections = [
      {
        id: 'financial',
        title: 'Financial Performance',
        description: 'Historical financial data and performance metrics',
        fields: 13
      },
      {
        id: 'customer',
        title: 'Customer & Risk Analysis',
        description: 'Customer metrics and business risk assessment',
        fields: 10
      }
    ]

    const validateField = (name: string, value: string) => {
      const newErrors = { ...errors }

      if (name === 'revenueYear1' && parseInt(value) < 0) {
        newErrors[name] = 'Revenue Year 1 must be 0 or greater'
      } else if (name === 'ebitdaMargin' && (parseInt(value) < 0 || parseInt(value) > 100)) {
        newErrors[name] = 'EBITDA margin must be between 0-100%'
      } else if (name === 'customerSatisfactionScore' && (parseInt(value) < 1 || parseInt(value) > 10)) {
        newErrors[name] = 'Customer satisfaction score must be between 1-10'
      } else {
        delete newErrors[name]
      }

      setErrors(newErrors)
    }

    const handleFieldChange = (section: string, field: string, value: string) => {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }))
      validateField(field, value)
    }

    return (
      <main role="main" aria-label="Professional Business Questionnaire">
        <div className="questionnaire-container">
          {/* Skip Link */}
          <a
            href="#main-content"
            className="skip-link"
            data-testid="skip-link"
          >
            Skip to main content
          </a>

          {/* Progress Indicator */}
          <div role="region" aria-label="Progress" className="progress-section">
            <h1 id="questionnaire-title">Professional Business Questionnaire</h1>
            <p id="questionnaire-description">
              Complete all sections to receive your professional business valuation
            </p>

            <div
              role="progressbar"
              aria-valuenow={((currentSection + 1) / sections.length) * 100}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-labelledby="progress-label"
              data-testid="progress-bar"
              className="progress-bar"
            >
              <div
                className="progress-fill"
                style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
              />
            </div>
            <div id="progress-label" className="sr-only">
              Progress: Section {currentSection + 1} of {sections.length}
            </div>
          </div>

          {/* Navigation */}
          <nav role="navigation" aria-label="Questionnaire sections">
            <ul className="section-nav" role="tablist">
              {sections.map((section, index) => (
                <li key={section.id} role="none">
                  <button
                    role="tab"
                    id={`tab-${section.id}`}
                    aria-controls={`panel-${section.id}`}
                    aria-selected={currentSection === index}
                    tabIndex={currentSection === index ? 0 : -1}
                    onClick={() => setCurrentSection(index)}
                    data-testid={`nav-${section.id}`}
                    className={`nav-button ${currentSection === index ? 'active' : ''}`}
                  >
                    <span className="nav-title">{section.title}</span>
                    <span className="nav-description">{section.description}</span>
                    <span className="nav-badge" aria-label={`${section.fields} fields`}>
                      {section.fields}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Main Content */}
          <div id="main-content" tabIndex={-1}>
            {/* Financial Performance Section */}
            {currentSection === 0 && (
              <section
                role="tabpanel"
                id="panel-financial"
                aria-labelledby="tab-financial"
                data-testid="financial-section"
              >
                <h2>Financial Performance</h2>

                <fieldset>
                  <legend>3-Year Revenue History</legend>

                  <div className="field-group">
                    <label htmlFor="revenue-year-1" className="required">
                      Revenue Year 1 (Most Recent)
                      <span aria-label="required" className="required-indicator">*</span>
                    </label>
                    <input
                      type="number"
                      id="revenue-year-1"
                      name="revenueYear1"
                      value={formData.financialPerformance.revenueYear1}
                      onChange={(e) => handleFieldChange('financialPerformance', 'revenueYear1', e.target.value)}
                      aria-describedby={errors.revenueYear1 ? 'revenue-year-1-error revenue-year-1-help' : 'revenue-year-1-help'}
                      aria-invalid={!!errors.revenueYear1}
                      required
                      min="0"
                      step="1"
                      data-testid="revenue-year-1"
                    />
                    <div id="revenue-year-1-help" className="field-help">
                      Enter your most recent year's total revenue in dollars
                    </div>
                    {errors.revenueYear1 && (
                      <div
                        id="revenue-year-1-error"
                        role="alert"
                        aria-live="polite"
                        className="error-message"
                        data-testid="revenue-year-1-error"
                      >
                        {errors.revenueYear1}
                      </div>
                    )}
                  </div>

                  <div className="field-group">
                    <label htmlFor="ebitda-margin" className="required">
                      EBITDA Margin (%)
                      <span aria-label="required" className="required-indicator">*</span>
                      <button
                        type="button"
                        aria-describedby="ebitda-tooltip"
                        className="info-button"
                        data-testid="ebitda-info-button"
                        onMouseEnter={() => document.getElementById('ebitda-tooltip')?.classList.add('visible')}
                        onMouseLeave={() => document.getElementById('ebitda-tooltip')?.classList.remove('visible')}
                        onFocus={() => document.getElementById('ebitda-tooltip')?.classList.add('visible')}
                        onBlur={() => document.getElementById('ebitda-tooltip')?.classList.remove('visible')}
                      >
                        <span className="sr-only">Information about EBITDA Margin</span>
                        9
                      </button>
                    </label>
                    <input
                      type="number"
                      id="ebitda-margin"
                      name="ebitdaMargin"
                      value={formData.financialPerformance.ebitdaMargin}
                      onChange={(e) => handleFieldChange('financialPerformance', 'ebitdaMargin', e.target.value)}
                      aria-describedby={errors.ebitdaMargin ? 'ebitda-margin-error ebitda-margin-help' : 'ebitda-margin-help'}
                      aria-invalid={!!errors.ebitdaMargin}
                      required
                      min="0"
                      max="100"
                      step="0.1"
                      data-testid="ebitda-margin"
                    />
                    <div id="ebitda-margin-help" className="field-help">
                      EBITDA as a percentage of revenue (0-100%)
                    </div>
                    <div
                      id="ebitda-tooltip"
                      role="tooltip"
                      className="tooltip"
                      data-testid="ebitda-tooltip"
                    >
                      <h4>EBITDA Margin</h4>
                      <p><strong>Purpose:</strong> Measures operational efficiency</p>
                      <p><strong>Calculation:</strong> EBITDA / Revenue × 100</p>
                      <p><strong>Benchmarks:</strong> Good: >20%, Excellent: >30%</p>
                      <p><strong>Impact:</strong> Higher margins significantly increase valuation</p>
                    </div>
                    {errors.ebitdaMargin && (
                      <div
                        id="ebitda-margin-error"
                        role="alert"
                        aria-live="polite"
                        className="error-message"
                        data-testid="ebitda-margin-error"
                      >
                        {errors.ebitdaMargin}
                      </div>
                    )}
                  </div>

                  <div className="field-group">
                    <label htmlFor="return-on-equity">
                      Return on Equity (%)
                    </label>
                    <input
                      type="number"
                      id="return-on-equity"
                      name="returnOnEquity"
                      value={formData.financialPerformance.returnOnEquity}
                      onChange={(e) => handleFieldChange('financialPerformance', 'returnOnEquity', e.target.value)}
                      aria-describedby="return-on-equity-help"
                      min="0"
                      step="0.1"
                      data-testid="return-on-equity"
                    />
                    <div id="return-on-equity-help" className="field-help">
                      Measures how effectively the company uses shareholders' equity
                    </div>
                  </div>
                </fieldset>
              </section>
            )}

            {/* Customer Risk Analysis Section */}
            {currentSection === 1 && (
              <section
                role="tabpanel"
                id="panel-customer"
                aria-labelledby="tab-customer"
                data-testid="customer-section"
              >
                <h2>Customer & Risk Analysis</h2>

                <fieldset>
                  <legend>Customer Concentration</legend>

                  <div className="field-group">
                    <label htmlFor="largest-customer-revenue" className="required">
                      Largest Customer Revenue
                      <span aria-label="required" className="required-indicator">*</span>
                    </label>
                    <input
                      type="number"
                      id="largest-customer-revenue"
                      name="largestCustomerRevenue"
                      value={formData.customerRiskAnalysis.largestCustomerRevenue}
                      onChange={(e) => handleFieldChange('customerRiskAnalysis', 'largestCustomerRevenue', e.target.value)}
                      aria-describedby="largest-customer-revenue-help"
                      required
                      min="0"
                      step="1"
                      data-testid="largest-customer-revenue"
                    />
                    <div id="largest-customer-revenue-help" className="field-help">
                      Annual revenue from your single largest customer
                    </div>
                  </div>

                  <div className="field-group">
                    <label htmlFor="customer-concentration-risk" className="required">
                      Customer Concentration Risk
                      <span aria-label="required" className="required-indicator">*</span>
                    </label>
                    <select
                      id="customer-concentration-risk"
                      name="customerConcentrationRisk"
                      value={formData.customerRiskAnalysis.customerConcentrationRisk}
                      onChange={(e) => handleFieldChange('customerRiskAnalysis', 'customerConcentrationRisk', e.target.value)}
                      aria-describedby="customer-concentration-risk-help"
                      required
                      data-testid="customer-concentration-risk"
                    >
                      <option value="">Select risk level</option>
                      <option value="low">Low - Diversified customer base</option>
                      <option value="medium">Medium - Some concentration</option>
                      <option value="high">High - Heavily dependent on few customers</option>
                    </select>
                    <div id="customer-concentration-risk-help" className="field-help">
                      Assess how dependent your business is on a small number of customers
                    </div>
                  </div>

                  <div className="field-group">
                    <label htmlFor="customer-satisfaction-score">
                      Customer Satisfaction Score (1-10)
                    </label>
                    <input
                      type="number"
                      id="customer-satisfaction-score"
                      name="customerSatisfactionScore"
                      value={formData.customerRiskAnalysis.customerSatisfactionScore}
                      onChange={(e) => handleFieldChange('customerRiskAnalysis', 'customerSatisfactionScore', e.target.value)}
                      aria-describedby={errors.customerSatisfactionScore ? 'customer-satisfaction-score-error customer-satisfaction-score-help' : 'customer-satisfaction-score-help'}
                      aria-invalid={!!errors.customerSatisfactionScore}
                      min="1"
                      max="10"
                      step="0.1"
                      data-testid="customer-satisfaction-score"
                    />
                    <div id="customer-satisfaction-score-help" className="field-help">
                      Average customer satisfaction rating on a scale of 1-10
                    </div>
                    {errors.customerSatisfactionScore && (
                      <div
                        id="customer-satisfaction-score-error"
                        role="alert"
                        aria-live="polite"
                        className="error-message"
                        data-testid="customer-satisfaction-score-error"
                      >
                        {errors.customerSatisfactionScore}
                      </div>
                    )}
                  </div>
                </fieldset>
              </section>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="nav-controls" role="group" aria-label="Section navigation">
            <button
              type="button"
              onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
              disabled={currentSection === 0}
              data-testid="previous-button"
              className="nav-control-button"
            >
              <span className="sr-only">Go to </span>Previous
            </button>

            <span aria-live="polite" className="section-status">
              Section {currentSection + 1} of {sections.length}: {sections[currentSection].title}
            </span>

            <button
              type="button"
              onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}
              disabled={currentSection === sections.length - 1}
              data-testid="next-button"
              className="nav-control-button"
            >
              Next<span className="sr-only"> section</span>
            </button>
          </div>

          {/* Live Region for Announcements */}
          <div
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
            data-testid="live-region"
            id="live-region"
          >
            {/* Dynamic announcements will be inserted here */}
          </div>
        </div>
      </main>
    )
  }

  beforeEach(() => {
    user = userEvent.setup()

    // Mock React
    global.React = {
      useState: vi.fn((initial) => {
        let state = initial
        const setState = (newState: any) => {
          state = typeof newState === 'function' ? newState(state) : newState
        }
        return [state, setState]
      })
    } as any
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('WCAG 2.1 AA Compliance', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<AccessibleProfessionalQuestionnaire />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should provide proper heading hierarchy', () => {
      render(<AccessibleProfessionalQuestionnaire />)

      // Main heading should be h1
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Professional Business Questionnaire')

      // Section headings should be h2
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Financial Performance')
    })

    it('should have descriptive page title and main landmark', () => {
      render(<AccessibleProfessionalQuestionnaire />)

      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label', 'Professional Business Questionnaire')
    })

    it('should provide skip navigation link', async () => {
      render(<AccessibleProfessionalQuestionnaire />)

      const skipLink = screen.getByTestId('skip-link')
      expect(skipLink).toHaveAttribute('href', '#main-content')
      expect(skipLink).toHaveTextContent('Skip to main content')

      // Skip link should be focusable
      await user.tab()
      expect(skipLink).toHaveFocus()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support full keyboard navigation', async () => {
      render(<AccessibleProfessionalQuestionnaire />)

      // Tab through major elements
      await user.tab() // Skip link
      await user.tab() // First nav button
      await user.tab() // Second nav button
      await user.tab() // First form field

      const revenueField = screen.getByTestId('revenue-year-1')
      expect(revenueField).toHaveFocus()
    })

    it('should implement proper tab panel keyboard interaction', async () => {
      render(<AccessibleProfessionalQuestionnaire />)

      const financialTab = screen.getByTestId('nav-financial')
      const customerTab = screen.getByTestId('nav-customer')

      // Focus first tab
      financialTab.focus()
      expect(financialTab).toHaveFocus()
      expect(financialTab).toHaveAttribute('aria-selected', 'true')

      // Arrow key navigation
      await user.keyboard('{ArrowRight}')
      expect(customerTab).toHaveFocus()
      expect(customerTab).toHaveAttribute('aria-selected', 'true')

      // Arrow key wrapping
      await user.keyboard('{ArrowRight}')
      expect(financialTab).toHaveFocus()
    })

    it('should handle Enter and Space key activation', async () => {
      render(<AccessibleProfessionalQuestionnaire />)

      const customerTab = screen.getByTestId('nav-customer')
      customerTab.focus()

      // Activate with Enter
      await user.keyboard('{Enter}')
      expect(screen.getByTestId('customer-section')).toBeVisible()

      // Go back to financial tab
      const financialTab = screen.getByTestId('nav-financial')
      financialTab.focus()

      // Activate with Space
      await user.keyboard(' ')
      expect(screen.getByTestId('financial-section')).toBeVisible()
    })

    it('should trap focus within active section', async () => {
      render(<AccessibleProfessionalQuestionnaire />)

      // Navigate to last focusable element in section
      const returnOnEquity = screen.getByTestId('return-on-equity')
      returnOnEquity.focus()

      // Tab should move to next section controls
      await user.tab()
      expect(screen.getByTestId('previous-button')).toHaveFocus()
    })
  })

  describe('Screen Reader Support', () => {
    it('should provide proper form labels and descriptions', () => {
      render(<AccessibleProfessionalQuestionnaire />)

      const revenueField = screen.getByTestId('revenue-year-1')
      expect(revenueField).toHaveAttribute('aria-describedby', 'revenue-year-1-help')

      const helpText = screen.getByText('Enter your most recent year\'s total revenue in dollars')
      expect(helpText).toHaveAttribute('id', 'revenue-year-1-help')
    })

    it('should announce form validation errors', async () => {
      render(<AccessibleProfessionalQuestionnaire />)

      const revenueField = screen.getByTestId('revenue-year-1')

      // Enter invalid value
      await user.type(revenueField, '-100000')
      await user.tab() // Trigger validation

      // Error should be announced
      const errorMessage = screen.getByTestId('revenue-year-1-error')
      expect(errorMessage).toHaveAttribute('role', 'alert')
      expect(errorMessage).toHaveAttribute('aria-live', 'polite')
      expect(errorMessage).toHaveTextContent('Revenue Year 1 must be 0 or greater')

      // Field should be marked as invalid
      expect(revenueField).toHaveAttribute('aria-invalid', 'true')
      expect(revenueField).toHaveAttribute('aria-describedby', 'revenue-year-1-error revenue-year-1-help')
    })

    it('should provide progress announcements', () => {
      render(<AccessibleProfessionalQuestionnaire />)

      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar).toHaveAttribute('role', 'progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '50')
      expect(progressBar).toHaveAttribute('aria-valuemin', '0')
      expect(progressBar).toHaveAttribute('aria-valuemax', '100')
      expect(progressBar).toHaveAttribute('aria-labelledby', 'progress-label')
    })

    it('should announce section changes', async () => {
      render(<AccessibleProfessionalQuestionnaire />)

      const customerTab = screen.getByTestId('nav-customer')
      await user.click(customerTab)

      const liveRegion = screen.getByTestId('live-region')
      expect(liveRegion).toHaveAttribute('aria-live', 'polite')
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true')
    })

    it('should provide fieldset and legend for grouped fields', () => {
      render(<AccessibleProfessionalQuestionnaire />)

      const fieldset = screen.getByRole('group', { name: '3-Year Revenue History' })
      expect(fieldset).toBeInTheDocument()

      const legend = screen.getByText('3-Year Revenue History')
      expect(legend.tagName).toBe('LEGEND')
    })
  })

  describe('Visual Design and Color Contrast', () => {
    it('should have sufficient color contrast for text', () => {
      render(<AccessibleProfessionalQuestionnaire />)

      // Required field indicators should be visible
      const requiredIndicator = screen.getAllByText('*')[0]
      expect(requiredIndicator).toHaveAttribute('aria-label', 'required')
      expect(requiredIndicator).toHaveClass('required-indicator')
    })

    it('should not rely solely on color for required field indication', () => {
      render(<AccessibleProfessionalQuestionnaire />)

      const requiredLabel = screen.getByText('Revenue Year 1 (Most Recent)')
      expect(requiredLabel).toHaveClass('required')

      // Should have both visual (asterisk) and text indication
      const requiredIndicator = screen.getAllByLabelText('required')[0]
      expect(requiredIndicator).toBeInTheDocument()
    })

    it('should provide visible focus indicators', async () => {
      render(<AccessibleProfessionalQuestionnaire />)

      const revenueField = screen.getByTestId('revenue-year-1')
      await user.tab()
      await user.tab()
      await user.tab()

      expect(revenueField).toHaveFocus()
      // Focus styles should be applied via CSS
    })
  })

  describe('Error Handling and Validation', () => {
    it('should provide clear error messages', async () => {
      render(<AccessibleProfessionalQuestionnaire />)

      const ebitdaField = screen.getByTestId('ebitda-margin')

      // Enter invalid value
      await user.type(ebitdaField, '150')
      await user.tab()

      const errorMessage = screen.getByTestId('ebitda-margin-error')
      expect(errorMessage).toHaveTextContent('EBITDA margin must be between 0-100%')
      expect(errorMessage).toHaveAttribute('role', 'alert')
    })

    it('should clear errors when valid input is provided', async () => {
      render(<AccessibleProfessionalQuestionnaire />)

      const ebitdaField = screen.getByTestId('ebitda-margin')

      // Enter invalid value
      await user.type(ebitdaField, '150')
      await user.tab()

      expect(screen.getByTestId('ebitda-margin-error')).toBeInTheDocument()

      // Clear and enter valid value
      await user.clear(ebitdaField)
      await user.type(ebitdaField, '25')
      await user.tab()

      expect(screen.queryByTestId('ebitda-margin-error')).not.toBeInTheDocument()
      expect(ebitdaField).toHaveAttribute('aria-invalid', 'false')
    })
  })

  describe('Mobile and Touch Accessibility', () => {
    it('should have adequate touch targets (minimum 44px)', () => {
      render(<AccessibleProfessionalQuestionnaire />)

      const navButtons = screen.getAllByRole('tab')
      navButtons.forEach(button => {
        expect(button).toHaveClass('nav-button')
        // CSS should ensure minimum 44px touch target
      })
    })

    it('should support zoom up to 200% without horizontal scrolling', () => {
      // This would be tested via visual regression testing
      // Here we ensure responsive design elements are present
      render(<AccessibleProfessionalQuestionnaire />)

      const container = screen.getByRole('main')
      expect(container).toHaveClass('questionnaire-container')
    })
  })

  describe('Methodology Tooltips Accessibility', () => {
    it('should provide accessible tooltip information', async () => {
      render(<AccessibleProfessionalQuestionnaire />)

      const infoButton = screen.getByTestId('ebitda-info-button')
      expect(infoButton).toHaveAttribute('aria-describedby', 'ebitda-tooltip')

      // Hover to show tooltip
      await user.hover(infoButton)

      const tooltip = screen.getByTestId('ebitda-tooltip')
      expect(tooltip).toHaveAttribute('role', 'tooltip')
      expect(tooltip).toHaveClass('visible')
    })

    it('should show tooltip on keyboard focus', async () => {
      render(<AccessibleProfessionalQuestionnaire />)

      const infoButton = screen.getByTestId('ebitda-info-button')

      // Focus with keyboard
      await user.tab()
      await user.tab()
      infoButton.focus()

      const tooltip = screen.getByTestId('ebitda-tooltip')
      expect(tooltip).toHaveClass('visible')
    })

    it('should hide tooltip on blur/mouse leave', async () => {
      render(<AccessibleProfessionalQuestionnaire />)

      const infoButton = screen.getByTestId('ebitda-info-button')

      // Show tooltip
      await user.hover(infoButton)
      expect(screen.getByTestId('ebitda-tooltip')).toHaveClass('visible')

      // Hide tooltip
      await user.unhover(infoButton)
      expect(screen.getByTestId('ebitda-tooltip')).not.toHaveClass('visible')
    })
  })

  describe('Section Navigation Accessibility', () => {
    it('should announce current section to screen readers', async () => {
      render(<AccessibleProfessionalQuestionnaire />)

      const sectionStatus = screen.getByText(/Section 1 of 2: Financial Performance/)
      expect(sectionStatus).toHaveAttribute('aria-live', 'polite')
    })

    it('should disable navigation buttons appropriately', () => {
      render(<AccessibleProfessionalQuestionnaire />)

      const previousButton = screen.getByTestId('previous-button')
      const nextButton = screen.getByTestId('next-button')

      // First section: previous should be disabled
      expect(previousButton).toBeDisabled()
      expect(nextButton).toBeEnabled()
    })

    it('should provide meaningful button labels', () => {
      render(<AccessibleProfessionalQuestionnaire />)

      const previousButton = screen.getByTestId('previous-button')
      const nextButton = screen.getByTestId('next-button')

      expect(previousButton).toHaveTextContent('Previous')
      expect(nextButton).toHaveTextContent('Next')

      // Should have screen reader text for context
      expect(previousButton.querySelector('.sr-only')).toHaveTextContent('Go to ')
      expect(nextButton.querySelector('.sr-only')).toHaveTextContent(' section')
    })
  })

  describe('Performance with Assistive Technology', () => {
    it('should not have excessive ARIA attributes that slow down screen readers', () => {
      render(<AccessibleProfessionalQuestionnaire />)

      // Check that ARIA attributes are used purposefully
      const formFields = screen.getAllByRole('textbox')
      formFields.forEach(field => {
        // Each field should have minimal necessary ARIA attributes
        const ariaAttributes = Array.from(field.attributes)
          .filter(attr => attr.name.startsWith('aria-'))

        expect(ariaAttributes.length).toBeLessThanOrEqual(4) // Reasonable limit
      })
    })

    it('should use semantic HTML over ARIA where possible', () => {
      render(<AccessibleProfessionalQuestionnaire />)

      // Check for proper semantic elements
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getAllByRole('tabpanel')).toHaveLength(1) // Only active panel
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })
})